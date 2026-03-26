import { useState, useRef } from "react";
import { Zap, Copy, Download, ArrowLeft, CheckCircle, Circle, AlertCircle, Check, X, Plus } from "lucide-react";
import { useLocation } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ScoreGauge } from "../components/ScoreGauge";
import { ProgressBar } from "../components/ProgressBar";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  generateBlog,
  saveToHistory,
  type FinalOutput,
  type GenerationRequest,
} from "../services/api";

type Phase = "input" | "generating" | "results";
type Tone = "professional" | "casual" | "technical" | "conversational";

export function BlogGenerator() {
  const location = useLocation();
  const prefill = location.state as { keyword?: string; location?: string; contentType?: string } | null;

  const [phase, setPhase] = useState<Phase>("input");
  const [keyword, setKeyword] = useState(prefill?.keyword ?? "");
  const [location2, setLocation2] = useState(prefill?.location ?? "");
  const [contentType, setContentType] = useState(prefill?.contentType ?? "blog");
  const [tone, setTone] = useState<Tone>("professional");
  const [includeFAQ, setIncludeFAQ] = useState(true);
  const [serpAnalysis, setSerpAnalysis] = useState(true);
  const [trafficProjection, setTrafficProjection] = useState(true);
  const [customInstructions, setCustomInstructions] = useState("");
  const [charCount, setCharCount] = useState(0);
  // secondary keywords tag input
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([]);
  const [kwInput, setKwInput] = useState("");
  // user-defined word count
  const [targetWordCount, setTargetWordCount] = useState<number>(1500);

  const [pipelinePhase, setPipelinePhase] = useState(1);
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [result, setResult] = useState<FinalOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleGenerate = async () => {
    if (!keyword || !location2) {
      toast.error("Please fill in all required fields");
      return;
    }

    setPhase("generating");
    setPipelinePhase(1);
    setPipelineProgress(0);
    setErrorMsg(null);

    // Simulate progress while waiting for the API
    let currentPhase = 1;
    let p = 0;
    progressRef.current = setInterval(() => {
      p += 1.2;
      if (p >= 100 && currentPhase < 3) {
        currentPhase++;
        p = 0;
        setPipelinePhase(currentPhase);
      }
      if (currentPhase >= 3 && p > 85) p = 85; // hold at 85% for phase 3 until done
      setPipelineProgress(Math.min(p, 100));
    }, 600);

    const req: GenerationRequest = {
      keyword_input: {
        primary_keyword: keyword,
        target_location: location2,
        content_type: contentType as "blog" | "article" | "guide" | "tutorial",
        secondary_keywords: secondaryKeywords.length > 0 ? secondaryKeywords : undefined,
      },
      enable_serp_analysis: serpAnalysis,
      enable_traffic_projection: trafficProjection,
      custom_instructions: customInstructions || undefined,
      tone,
      include_faq: includeFAQ,
      target_word_count: targetWordCount,
    };

    try {
      const output = await generateBlog(req);
      if (progressRef.current) clearInterval(progressRef.current);
      setPipelinePhase(4); // all done
      setPipelineProgress(100);

      setResult(output);
      saveToHistory(output);

      setTimeout(() => {
        setPhase("results");
        toast.success("Blog generated successfully!");
      }, 400);
    } catch (err: unknown) {
      if (progressRef.current) clearInterval(progressRef.current);
      let msg = "Unknown error";
      if (err && typeof err === "object" && "details" in err) {
        const details = (err as { details: unknown }).details;
        if (details && typeof details === "object" && "detail" in (details as Record<string, unknown>)) {
          const detail = (details as Record<string, unknown>).detail as Record<string, string>;
          msg = detail?.message || detail?.error || JSON.stringify(detail);
        } else if (typeof details === "string") {
          msg = details;
        } else {
          msg = JSON.stringify(details);
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setErrorMsg(msg);
      toast.error("Generation failed: " + msg);
      setPhase("input");
    }
  };

  const handleReset = () => {
    setPhase("input");
    setPipelinePhase(1);
    setPipelineProgress(0);
    setResult(null);
    setErrorMsg(null);
    setSecondaryKeywords([]);
    setKwInput("");
    setTargetWordCount(1500);
  };

  const addKeyword = (val: string) => {
    const trimmed = val.trim().toLowerCase();
    if (trimmed && !secondaryKeywords.includes(trimmed) && secondaryKeywords.length < 10) {
      setSecondaryKeywords((prev) => [...prev, trimmed]);
    }
    setKwInput("");
  };

  const removeKeyword = (kw: string) => {
    setSecondaryKeywords((prev) => prev.filter((k) => k !== kw));
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.blog_content);
      toast.success("Copied to clipboard!");
    }
  };

  const handleDownloadMarkdown = () => {
    if (!result) return;
    const blob = new Blob([result.blog_content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${keyword.replace(/\s+/g, "-")}-blog.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };

  const handleDownloadReport = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${keyword.replace(/\s+/g, "-")}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  };

  const meta = result?.metadata;
  const strat = result?.strategy_brief;
  const wordCount = result
    ? result.blog_content.replace(/[#*`\[\]()]/g, "").split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="max-w-7xl mx-auto pb-20 lg:pb-6">
      {phase === "input" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="glass-panel rounded-xl p-6 card-shadow">
            <h2 className="text-2xl font-bold mb-6">Generate New Blog</h2>

            {errorMsg && (
              <div className="mb-4 p-4 rounded-lg bg-[--danger]/10 border border-[--danger]/20 text-sm text-[--danger]">
                {errorMsg}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <Label htmlFor="keyword">Primary Keyword *</Label>
                <Input
                  id="keyword"
                  placeholder="e.g., Python automation tutorial"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="mt-2 bg-[--bg-tertiary] border-[--border-subtle] focus:border-[--border-active]"
                />
              </div>

              <div>
                <Label htmlFor="location">Target Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., United States"
                  value={location2}
                  onChange={(e) => setLocation2(e.target.value)}
                  className="mt-2 bg-[--bg-tertiary] border-[--border-subtle] focus:border-[--border-active]"
                />
              </div>

              {/* Secondary Keywords */}
              <div>
                <Label>Secondary Keywords <span className="text-[--text-tertiary] font-normal text-xs">(optional, up to 10)</span></Label>
                <div className="mt-2 flex flex-wrap gap-2 p-2.5 rounded-lg bg-[--bg-tertiary] border border-[--border-subtle] min-h-[42px]">
                  {secondaryKeywords.map((kw) => (
                    <span key={kw} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[--accent-secondary]/15 text-[--accent-secondary] text-xs font-medium">
                      {kw}
                      <button onClick={() => removeKeyword(kw)} className="hover:opacity-70 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={kwInput}
                    onChange={(e) => setKwInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addKeyword(kwInput); }
                      if (e.key === 'Backspace' && !kwInput && secondaryKeywords.length > 0) {
                        setSecondaryKeywords((prev) => prev.slice(0, -1));
                      }
                    }}
                    onBlur={() => kwInput.trim() && addKeyword(kwInput)}
                    placeholder={secondaryKeywords.length === 0 ? "Type keyword, press Enter or comma..." : ""}
                    className="flex-1 min-w-[140px] bg-transparent text-sm outline-none text-[--text-primary] placeholder:text-[--text-tertiary]"
                  />
                </div>
                <p className="text-xs text-[--text-tertiary] mt-1">{secondaryKeywords.length}/10 keywords added</p>
              </div>

              {/* Target Word Count */}
              <div>
                <Label htmlFor="word-count">Target Word Count</Label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {[500, 1000, 1500, 2000, 2500, 3000, 4000, 5000].map((wc) => (
                    <button
                      key={wc}
                      onClick={() => setTargetWordCount(wc)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                        targetWordCount === wc
                          ? "btn-primary border-transparent"
                          : "bg-white text-[--text-primary] border-[--border-subtle] hover:border-[--border-active]"
                      }`}
                    >
                      {wc >= 1000 ? `${wc/1000}k` : wc}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[--text-tertiary] mt-1">Selected: {targetWordCount.toLocaleString()} words</p>
              </div>

              <div>
                <Label htmlFor="content-type">Content Type</Label>                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger className="mt-2 bg-[--bg-tertiary] border-[--border-subtle]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                    <SelectItem value="tutorial">Tutorial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tone</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(["professional", "casual", "technical", "conversational"] as Tone[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium capitalize transition-all border ${
                        tone === t
                          ? "btn-primary border-transparent"
                          : "bg-white text-[--text-primary] border-[--border-subtle] hover:border-[--border-active]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="faq">Include FAQ</Label>
                <Switch id="faq" checked={includeFAQ} onCheckedChange={setIncludeFAQ} />
              </div>

              <div>
                <Label htmlFor="instructions">Custom Instructions (Optional)</Label>
                <Textarea
                  id="instructions"
                  placeholder="Any specific requirements..."
                  value={customInstructions}
                  onChange={(e) => {
                    setCustomInstructions(e.target.value);
                    setCharCount(e.target.value.length);
                  }}
                  maxLength={500}
                  className="mt-2 bg-[--bg-tertiary] border-[--border-subtle] min-h-24"
                />
                <p className="text-xs text-[--text-tertiary] mt-1">{charCount}/500 characters</p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="serp">SERP Analysis</Label>
                <Switch id="serp" checked={serpAnalysis} onCheckedChange={setSerpAnalysis} />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="traffic">Traffic Projection</Label>
                <Switch id="traffic" checked={trafficProjection} onCheckedChange={setTrafficProjection} />
              </div>

              <Button
                onClick={handleGenerate}
                className="w-full btn-primary py-6 text-lg"
              >
                <Zap className="mr-2 w-5 h-5" />
                Generate Blog
              </Button>
              <p className="text-center text-sm text-[--text-tertiary]">Estimated: 1–3 minutes</p>
            </div>
          </div>

          {/* Preview/Info Panel */}
          <div className="glass-panel rounded-xl p-6 card-shadow">
            <h3 className="text-xl font-bold mb-4">What to Expect</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[--bg-tertiary]/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-accent-fill flex items-center justify-center text-white text-sm font-bold">
                    1
                  </div>
                  <div className="font-semibold">Intent & Strategy</div>
                </div>
                <p className="text-sm text-[--text-secondary] ml-11">
                  AI analyzes your keyword, identifies content gaps, and projects traffic potential.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-[--bg-tertiary]/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-accent-fill flex items-center justify-center text-white text-sm font-bold">
                    2
                  </div>
                  <div className="font-semibold">Multi-Agent Generation</div>
                </div>
                <p className="text-sm text-[--text-secondary] ml-11">
                  Researcher agent creates outline, Writer agent generates 1500-3000 word content.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-[--bg-tertiary]/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-accent-fill flex items-center justify-center text-white text-sm font-bold">
                    3
                  </div>
                  <div className="font-semibold">SEO Validation</div>
                </div>
                <p className="text-sm text-[--text-secondary] ml-11">
                  Editor agent and SEO validator score your content across 20+ quality metrics.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === "generating" && (
        <div className="max-w-4xl mx-auto">
          <div className="glass-panel rounded-xl p-8 card-shadow">
            <h2 className="text-2xl font-bold mb-6">Generating Your Blog...</h2>

            {/* Overall Progress */}
            <div className="mb-8">
              <ProgressBar
                value={(pipelinePhase - 1) * 33 + pipelineProgress / 3}
                color="primary"
                height="standard"
              />
            </div>

            {/* Pipeline Phases */}
            <div className="space-y-6">
              {/* Phase 1 */}
              <div className={`p-6 rounded-lg border-l-4 ${
                pipelinePhase > 1 ? "border-[--success] bg-[--success]/5" :
                pipelinePhase === 1 ? "border-[--accent-primary] bg-[--accent-primary]/5" :
                "border-[--border-subtle] bg-[--bg-tertiary]/30"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {pipelinePhase > 1 && <CheckCircle className="w-5 h-5 text-[--success]" />}
                    {pipelinePhase === 1 && <div className="w-5 h-5 border-2 border-[--accent-primary] border-t-transparent rounded-full animate-spin" />}
                    {pipelinePhase < 1 && <Circle className="w-5 h-5 text-[--text-tertiary]" />}
                    <h3 className="font-bold">Phase 1: Intent & Strategy</h3>
                  </div>
                  <span className="text-sm text-[--text-secondary]">
                    {pipelinePhase > 1 ? "Complete" : pipelinePhase === 1 ? "In Progress..." : "Pending"}
                  </span>
                </div>
                {pipelinePhase >= 1 && (
                  <div className="ml-8 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-[--success]" />
                      <span className="text-[--text-secondary]">Keyword Clustering</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-[--success]" />
                      <span className="text-[--text-secondary]">SERP Gap Analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-[--success]" />
                      <span className="text-[--text-secondary]">Traffic Projection</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Phase 2 */}
              <div className={`p-6 rounded-lg border-l-4 ${
                pipelinePhase > 2 ? "border-[--success] bg-[--success]/5" :
                pipelinePhase === 2 ? "border-[--accent-primary] bg-[--accent-primary]/5" :
                "border-[--border-subtle] bg-[--bg-tertiary]/30"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {pipelinePhase > 2 && <CheckCircle className="w-5 h-5 text-[--success]" />}
                    {pipelinePhase === 2 && <div className="w-5 h-5 border-2 border-[--accent-primary] border-t-transparent rounded-full animate-spin" />}
                    {pipelinePhase < 2 && <Circle className="w-5 h-5 text-[--text-tertiary]" />}
                    <h3 className="font-bold">Phase 2: Multi-Agent Generation</h3>
                  </div>
                  <span className="text-sm text-[--text-secondary]">
                    {pipelinePhase > 2 ? "Complete" : pipelinePhase === 2 ? `${Math.round(pipelineProgress)}%` : "Pending"}
                  </span>
                </div>
                {pipelinePhase >= 2 && (
                  <div className="ml-8 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-[--success]" />
                      <span className="text-[--text-secondary]">Researcher Agent (outline ready)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {pipelinePhase === 2 ? (
                        <div className="w-3 h-3 border border-[--accent-primary] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5 text-[--success]" />
                      )}
                      <span className="text-[--text-secondary]">Writer Agent {pipelinePhase === 2 ? "(generating content...)" : ""}</span>
                    </div>
                  </div>
                )}
                {pipelinePhase === 2 && <ProgressBar value={pipelineProgress} className="mt-3 ml-8" color="primary" height="thin" />}
              </div>

              {/* Phase 3 */}
              <div className={`p-6 rounded-lg border-l-4 ${
                pipelinePhase > 3 ? "border-[--success] bg-[--success]/5" :
                pipelinePhase === 3 ? "border-[--accent-primary] bg-[--accent-primary]/5" :
                "border-[--border-subtle] bg-[--bg-tertiary]/30"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {pipelinePhase > 3 && <CheckCircle className="w-5 h-5 text-[--success]" />}
                    {pipelinePhase === 3 && <div className="w-5 h-5 border-2 border-[--accent-primary] border-t-transparent rounded-full animate-spin" />}
                    {pipelinePhase < 3 && <Circle className="w-5 h-5 text-[--text-tertiary]" />}
                    <h3 className="font-bold">Phase 3: SEO Validation</h3>
                  </div>
                  <span className="text-sm text-[--text-secondary]">
                    {pipelinePhase > 3 ? "Complete" : pipelinePhase === 3 ? "In Progress..." : "Pending"}
                  </span>
                </div>
                {pipelinePhase >= 3 && (
                  <div className="ml-8 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {pipelinePhase === 3 && pipelineProgress < 50 ? (
                        <div className="w-3 h-3 border border-[--accent-primary] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5 text-[--success]" />
                      )}
                      <span className="text-[--text-secondary]">Editor Agent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {pipelinePhase === 3 && pipelineProgress < 100 ? (
                        <div className="w-3 h-3 border border-[--accent-primary] border-t-transparent rounded-full animate-spin" />
                      ) : pipelinePhase > 3 ? (
                        <CheckCircle className="w-3.5 h-3.5 text-[--success]" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-[--text-tertiary]" />
                      )}
                      <span className="text-[--text-secondary]">SEO Validator</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {pipelinePhase > 3 ? (
                        <CheckCircle className="w-3.5 h-3.5 text-[--success]" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-[--text-tertiary]" />
                      )}
                      <span className="text-[--text-secondary]">Score Calculation</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === "results" && result && meta && (
        <div>
          <Button
            onClick={handleReset}
            variant="ghost"
            className="mb-6 text-[--text-secondary] hover:text-[--text-primary]"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Generate Another
          </Button>

          <Tabs defaultValue="content" className="space-y-6">
            <TabsList className="bg-[--bg-secondary] border border-[--border-subtle]">
              <TabsTrigger value="content">Blog Content</TabsTrigger>
              <TabsTrigger value="seo">SEO Report</TabsTrigger>
              <TabsTrigger value="geo">GEO Report</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6">
              <div className="glass-panel rounded-xl p-8 card-shadow">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      {result.blog_content.match(/^#\s+(.+)$/m)?.[1] || "Generated Blog"}
                    </h1>
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-[--text-secondary]">
                        Generated on {new Date(result.generation_timestamp).toLocaleDateString()}
                      </p>
                      <span className="text-[--text-tertiary]">•</span>
                      <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${
                        wordCount >= (strat?.target_word_count ?? 1500)
                          ? "bg-[--success]/10 text-[--success]"
                          : "bg-[--warning]/10 text-[--warning]"
                      }`}>
                        {wordCount.toLocaleString()} words
                        {strat && (
                          <span className="font-normal text-xs ml-1 opacity-70">
                            / {(strat.target_word_count ?? 1500).toLocaleString()} target
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadMarkdown}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>

                <div className="prose max-w-none prose-headings:text-[--text-primary] prose-p:text-[--text-secondary] prose-li:text-[--text-secondary] prose-strong:text-[--text-primary] prose-a:text-[--accent-primary] prose-code:text-[--text-primary] prose-code:bg-[--bg-tertiary] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result.blog_content}
                  </ReactMarkdown>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-6">
              {/* Overall Score */}
              <div className="glass-panel rounded-xl p-8 card-shadow text-center">
                <ScoreGauge value={Math.round(meta.overall_score)} size="large" label="Overall Content Score" />
                <p className="text-sm text-[--text-secondary] mt-4">
                  SEO (25%) + GEO (25%) + Snippet (15%) + Naturalness (20%) + Depth (10%) + Actionability (5%)
                </p>
                {/* SEO + GEO side by side */}
                <div className="grid grid-cols-2 gap-4 mt-6 max-w-sm mx-auto">
                  <div className="p-4 rounded-xl bg-[--bg-tertiary]/50 text-center">
                    <div className="text-2xl font-bold gradient-text">{meta.seo_metrics.seo_optimization_percentage.toFixed(0)}%</div>
                    <div className="text-xs text-[--text-secondary] mt-1 font-medium">SEO Score</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[--bg-tertiary]/50 text-center">
                    <div className="text-2xl font-bold gradient-text">{meta.geo_metrics ? Math.round(meta.geo_metrics.geo_score) : "—"}%</div>
                    <div className="text-xs text-[--text-secondary] mt-1 font-medium">GEO Score</div>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-panel rounded-xl p-6 card-shadow">
                  <h3 className="font-bold mb-4">SEO Optimization</h3>
                  <div className="text-3xl font-bold gradient-text mb-4">{meta.seo_metrics.seo_optimization_percentage.toFixed(1)}%</div>
                  <ProgressBar value={meta.seo_metrics.seo_optimization_percentage} color="success" className="mb-4" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[--text-secondary]">Title Optimization</span>
                      <span className="font-semibold">{meta.seo_metrics.title_optimization_score.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[--text-secondary]">Meta Description</span>
                      <span className="font-semibold">{meta.seo_metrics.meta_description_score.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[--text-secondary]">Heading Structure</span>
                      <span className="font-semibold">{meta.seo_metrics.heading_structure_score.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[--text-secondary]">Readability</span>
                      <span className="font-semibold">{meta.seo_metrics.readability_score.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-6 card-shadow">
                  <h3 className="font-bold mb-4">Snippet Readiness</h3>
                  <div className="text-3xl font-bold gradient-text mb-4">{meta.snippet_analysis.snippet_readiness_probability.toFixed(0)}%</div>
                  <ProgressBar value={meta.snippet_analysis.snippet_readiness_probability} color="secondary" className="mb-4" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[--text-secondary]">Q&A Pairs</span>
                      <span className="font-semibold">{meta.snippet_analysis.question_answer_pairs} found</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[--text-secondary]">Lists</span>
                      <span className="font-semibold">{meta.snippet_analysis.list_format_usage} found</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[--text-secondary]">Tables</span>
                      <span className="font-semibold">{meta.snippet_analysis.table_usage} found</span>
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-6 card-shadow">
                  <h3 className="font-bold mb-4">Naturalness</h3>
                  <div className="text-3xl font-bold gradient-text mb-4">{meta.naturalness_analysis.naturalness_score.toFixed(0)}%</div>
                  <ProgressBar value={meta.naturalness_analysis.naturalness_score} color="success" className="mb-4" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[--text-secondary]">Sentence Variety</span>
                      <span className="font-semibold">{meta.naturalness_analysis.sentence_variety_score >= 70 ? "High" : meta.naturalness_analysis.sentence_variety_score >= 40 ? "Medium" : "Low"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[--text-secondary]">Vocabulary Richness</span>
                      <span className="font-semibold">{meta.naturalness_analysis.vocabulary_richness >= 70 ? "Excellent" : meta.naturalness_analysis.vocabulary_richness >= 40 ? "Good" : "Fair"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[--text-secondary]">Transition Quality</span>
                      <span className="font-semibold">{meta.naturalness_analysis.transition_quality >= 70 ? "Excellent" : meta.naturalness_analysis.transition_quality >= 40 ? "Good" : "Fair"}</span>
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-6 card-shadow">
                  <h3 className="font-bold mb-4">AI Detection Risk</h3>
                  <div className="text-3xl font-bold text-[--danger] mb-4">{meta.naturalness_analysis.ai_detection_probability.toFixed(0)}%</div>
                  <ProgressBar value={meta.naturalness_analysis.ai_detection_probability} color="danger" className="mb-4" />
                  <div className={`flex items-center gap-2 text-sm ${meta.naturalness_analysis.ai_detection_probability <= 30 ? "text-[--success] bg-[--success]/10" : "text-[--warning] bg-[--warning]/10"} rounded-lg p-3`}>
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="font-semibold">
                      {meta.naturalness_analysis.ai_detection_probability <= 30 ? "Low Risk — Human-Like Content" : "Moderate Risk — Consider Edits"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Word Count vs Target */}
              {strat && (() => {
                const target = strat.target_word_count ?? (strat.estimated_monthly_searches > 2000 ? 2000 : 1500);
                const pct = Math.min(100, Math.round((wordCount / target) * 100));
                const met = wordCount >= target;
                return (
                  <div className="glass-panel rounded-xl p-6 card-shadow">
                    <h3 className="font-bold mb-4">Word Count vs Target</h3>
                    <div className="flex items-end gap-3 mb-3">
                      <span className={`text-3xl font-bold ${met ? "text-[--success]" : "text-[--warning]"}`}>
                        {wordCount.toLocaleString()}
                      </span>
                      <span className="text-[--text-tertiary] text-sm mb-1">/ {target.toLocaleString()} words target</span>
                    </div>
                    <ProgressBar value={pct} color={met ? "success" : "secondary"} className="mb-3" />
                    <div className={`flex items-center gap-2 text-sm rounded-lg p-3 ${met ? "bg-[--success]/10 text-[--success]" : "bg-[--warning]/10 text-[--warning]"}`}>
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="font-semibold">
                        {met
                          ? `Target met — ${(wordCount - target).toLocaleString()} words over`
                          : `${(target - wordCount).toLocaleString()} words short of target`}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Strategy Brief */}
              {strat && (
                <div className="glass-panel rounded-xl p-6 card-shadow">
                  <h3 className="font-bold mb-4">Strategy Brief</h3>
                  <div className="grid md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold gradient-text">{strat.estimated_monthly_searches.toLocaleString()}</div>
                      <p className="text-xs text-[--text-secondary] mt-1">Monthly Searches</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold gradient-text">{strat.ranking_probability}%</div>
                      <p className="text-xs text-[--text-secondary] mt-1">Ranking Probability</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold gradient-text">{strat.projected_monthly_traffic.toLocaleString()}</div>
                      <p className="text-xs text-[--text-secondary] mt-1">Projected Traffic/mo</p>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${strat.competition_level === "high" ? "text-[--danger]" : strat.competition_level === "medium" ? "text-[--warning]" : "text-[--success]"}`}>
                        {strat.competition_level.charAt(0).toUpperCase() + strat.competition_level.slice(1)}
                      </div>
                      <p className="text-xs text-[--text-secondary] mt-1">Competition</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Strengths & Improvements */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-panel rounded-xl p-6 card-shadow">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-[--success]">
                    <CheckCircle className="w-4 h-4" />
                    Strengths
                  </h3>
                  <ul className="space-y-3">
                    {meta.strengths.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-[--success] mt-0.5 flex-shrink-0" />
                        <span className="text-[--text-secondary]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="glass-panel rounded-xl p-6 card-shadow">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-[--warning]">
                    <AlertCircle className="w-4 h-4" />
                    Improvements
                  </h3>
                  <ul className="space-y-3">
                    {meta.improvements_needed.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-[--warning] mt-0.5 flex-shrink-0" />
                        <span className="text-[--text-secondary]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Editor Notes */}
              {meta.editor_notes && (
                <div className="glass-panel rounded-xl p-6 card-shadow">
                  <h3 className="font-bold mb-3">Editor Notes</h3>
                  <p className="text-sm text-[--text-secondary] leading-relaxed whitespace-pre-wrap">{meta.editor_notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <Button onClick={handleReset} className="btn-primary">
                  Generate Another
                </Button>
                <Button variant="outline" onClick={handleDownloadReport}>
                  <Download className="mr-2 w-4 h-4" />
                  Download Full Report (JSON)
                </Button>
                <Button variant="ghost" onClick={handleCopy}>
                  <Copy className="mr-2 w-4 h-4" />
                  Copy Blog to Clipboard
                </Button>
              </div>
            </TabsContent>

            {/* ── GEO Report Tab ── */}
            <TabsContent value="geo" className="space-y-6">
              {meta.geo_metrics && (() => {
                const geo = meta.geo_metrics;
                const getColor = (v: number) => v >= 70 ? "text-[--success]" : v >= 45 ? "text-[--warning]" : "text-[--danger]";
                const getBarColor = (v: number): "success" | "secondary" | "danger" => v >= 70 ? "success" : v >= 45 ? "secondary" : "danger";
                const getLabel = (v: number) => v >= 70 ? "Strong" : v >= 45 ? "Moderate" : "Needs Work";

                return (
                  <>
                    {/* Overall GEO Score */}
                    <div className="glass-panel rounded-xl p-8 card-shadow text-center">
                      <ScoreGauge value={Math.round(geo.geo_score)} size="large" label="GEO Score — AI Citation Readiness" />
                      <p className="text-sm text-[--text-secondary] mt-4 max-w-lg mx-auto">
                        Measures how likely AI systems (ChatGPT, Perplexity, Gemini) are to cite this content when answering user queries.
                      </p>
                      <p className="text-xs text-[--text-tertiary] mt-2">
                        Direct Answer (25%) + Citation Structure (20%) + E-E-A-T (20%) + Entity Clarity (15%) + Query Match (10%) + Authority (10%)
                      </p>
                    </div>

                    {/* Six signal breakdown */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {[
                        { label: "Direct Answer", value: geo.direct_answer_score, desc: "Concise answers after question headings", weight: "25%" },
                        { label: "Citation Structure", value: geo.citation_structure_score, desc: "Lists, tables, definitions AI can extract", weight: "20%" },
                        { label: "E-E-A-T Signals", value: geo.eeat_score, desc: "Statistics, expert refs, authority phrases", weight: "20%" },
                        { label: "Entity Clarity", value: geo.entity_clarity_score, desc: "Named entities, facts, specific numbers", weight: "15%" },
                        { label: "Query Match", value: geo.query_match_score, desc: "Mirrors how users ask AI questions", weight: "10%" },
                        { label: "Authority & Depth", value: geo.authority_score, desc: "Comprehensive coverage, FAQ, conclusion", weight: "10%" },
                      ].map(({ label, value, desc, weight }) => (
                        <div key={label} className="glass-panel rounded-xl p-5 card-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-sm">{label}</h3>
                            <span className="text-xs text-[--text-tertiary] bg-[--bg-tertiary] px-2 py-0.5 rounded-full">{weight}</span>
                          </div>
                          <div className={`text-3xl font-bold mb-2 ${getColor(value)}`}>{Math.round(value)}</div>
                          <ProgressBar value={value} color={getBarColor(value)} className="mb-2" height="thin" />
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-[--text-tertiary] leading-relaxed">{desc}</p>
                            <span className={`text-xs font-semibold ml-2 flex-shrink-0 ${getColor(value)}`}>{getLabel(value)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* GEO Strengths & Improvements */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="glass-panel rounded-xl p-6 card-shadow">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-[--success]">
                          <CheckCircle className="w-4 h-4" />
                          GEO Strengths
                        </h3>
                        {geo.geo_strengths.length > 0 ? (
                          <ul className="space-y-3">
                            {geo.geo_strengths.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-[--success] mt-0.5 flex-shrink-0" />
                                <span className="text-[--text-secondary]">{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-[--text-tertiary]">No major strengths detected yet.</p>
                        )}
                      </div>

                      <div className="glass-panel rounded-xl p-6 card-shadow">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-[--warning]">
                          <AlertCircle className="w-4 h-4" />
                          GEO Improvements
                        </h3>
                        {geo.geo_improvements.length > 0 ? (
                          <ul className="space-y-3">
                            {geo.geo_improvements.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <AlertCircle className="w-4 h-4 text-[--warning] mt-0.5 flex-shrink-0" />
                                <span className="text-[--text-secondary]">{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-[--text-tertiary]">Content is well-optimised for AI citation.</p>
                        )}
                      </div>
                    </div>

                    {/* What is GEO explainer */}
                    <div className="glass-panel rounded-xl p-6 card-shadow border-l-4 border-[--accent-secondary]">
                      <h3 className="font-bold mb-2">What is GEO?</h3>
                      <p className="text-sm text-[--text-secondary] leading-relaxed">
                        Generative Engine Optimization (GEO) is the practice of structuring content so AI systems like ChatGPT, Perplexity, and Google's AI Overviews are more likely to cite it in their responses. Unlike traditional SEO which targets search ranking algorithms, GEO targets the retrieval and citation mechanisms of large language models. Content with direct answers, clear structure, strong E-E-A-T signals, and specific entities scores higher.
                      </p>
                    </div>
                  </>
                );
              })()}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}