import { useState } from "react";
import { Search, Lightbulb, HelpCircle, Rocket, Target, TrendingUp, ArrowRight, ArrowLeft, Star, FileText } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ScoreGauge } from "../components/ScoreGauge";
import { ProgressBar } from "../components/ProgressBar";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router";
import { analyzeKeywords, type StrategyBrief, type KeywordInput } from "../services/api";

type Phase = "input" | "analyzing" | "results";

export function KeywordAnalyzer() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("input");
  const [keyword, setKeyword] = useState("");
  const [targetLocation, setTargetLocation] = useState("");
  const [contentType, setContentType] = useState("blog");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<StrategyBrief | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!keyword || !targetLocation) {
      toast.error("Please fill in all required fields");
      return;
    }

    setPhase("analyzing");
    setProgress(0);
    setErrorMsg(null);

    // Simulate visual progress while waiting
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90; // hold until done
        return prev + 4;
      });
    }, 100);

    const input: KeywordInput = {
      primary_keyword: keyword,
      target_location: targetLocation,
      content_type: contentType as "blog" | "article" | "guide" | "tutorial",
    };

    try {
      const data = await analyzeKeywords(input);
      clearInterval(interval);
      setProgress(100);
      setResult(data);
      setTimeout(() => {
        setPhase("results");
        toast.success("Analysis complete!");
      }, 300);
    } catch (err: unknown) {
      clearInterval(interval);
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
      toast.error("Analysis failed: " + msg);
      setPhase("input");
    }
  };

  const handleReset = () => {
    setPhase("input");
    setProgress(0);
    setResult(null);
  };

  const cluster = result?.keyword_cluster;
  const serpGap = result?.serp_gap;
  const traffic = result?.traffic_projection;

  return (
    <div className="max-w-6xl mx-auto pb-20 lg:pb-6">
      {phase === "input" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass-panel rounded-xl p-6 card-shadow">
            <h2 className="text-2xl font-bold mb-6">Analyze Keywords</h2>

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
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  className="mt-2 bg-[--bg-tertiary] border-[--border-subtle]"
                />
              </div>

              <div>
                <Label htmlFor="location">Target Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., United States"
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  className="mt-2 bg-[--bg-tertiary] border-[--border-subtle]"
                />
              </div>

              <div>
                <Label htmlFor="content-type">Content Type</Label>
                <Select value={contentType} onValueChange={setContentType}>
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

              <Button
                onClick={handleAnalyze}
                className="w-full btn-primary py-6 text-lg"
              >
                <Search className="mr-2 w-5 h-5" />
                Analyze Keywords
              </Button>
              <p className="text-center text-sm text-[--text-tertiary]">Estimated: 10–20 seconds</p>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 card-shadow">
            <h3 className="text-xl font-bold mb-4">What You'll Get</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-tint flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Keyword Clusters</h4>
                  <p className="text-sm text-[--text-secondary]">Primary, secondary, and long-tail keyword variations</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-tint flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-teal" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">SERP Gap Analysis</h4>
                  <p className="text-sm text-[--text-secondary]">Missing topics and content opportunities</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-success-tint flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5" style={{color: 'var(--success)'}} />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Traffic Projection</h4>
                  <p className="text-sm text-[--text-secondary]">Search volume and ranking probability estimates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === "analyzing" && (
        <div className="max-w-2xl mx-auto">
          <div className="glass-panel rounded-xl p-8 card-shadow">
            <h2 className="text-2xl font-bold mb-6 text-center">Analyzing Keywords...</h2>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 border-4 border-[--accent-secondary] border-t-transparent rounded-full animate-spin" />
            </div>
            <ProgressBar value={progress} color="secondary" className="mb-4" />
            <p className="text-center text-sm text-[--text-secondary]">
              Analyzing search intent, competition, and content opportunities...
            </p>
          </div>
        </div>
      )}

      {phase === "results" && cluster && serpGap && traffic && (
        <div className="space-y-6">
          <Button
            onClick={handleReset}
            variant="ghost"
            className="text-[--text-secondary] hover:text-[--text-primary]"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Analyze Another
          </Button>

          {/* Keyword Cluster Card */}
          <div className="glass-panel rounded-xl p-6 card-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[--accent-secondary] to-cyan-400 flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{cluster.primary}</h2>
                <p className="text-sm text-[--text-secondary]">Primary Keyword</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-[--text-secondary]">Secondary Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {cluster.secondary.map((kw, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-[--accent-secondary]/15 text-[--accent-secondary] text-sm">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-[--text-secondary]">Search Intent</h3>
                  <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 text-xs font-semibold capitalize">
                    {cluster.search_intent}
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold text-sm mb-2">Difficulty Score</h3>
                  <ScoreGauge value={Math.round(cluster.difficulty_score)} size="small" showValue={true} />
                  <p className="text-xs text-center text-[--text-secondary] mt-2">
                    {cluster.difficulty_score > 70 ? "High" : cluster.difficulty_score > 40 ? "Medium" : "Low"} Difficulty
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-[--text-secondary]">Long-Tail Keywords</h3>
              <div className="space-y-2">
                {cluster.long_tail.map((kw, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[--bg-tertiary]/50">
                    <span className="text-sm text-[--text-primary]">{kw}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-[--text-secondary]">Related Questions</h3>
              <div className="space-y-2">
                {cluster.related_questions.map((question, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[--bg-tertiary]/50">
                    <HelpCircle className="w-5 h-5 text-[--accent-secondary] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[--text-primary]">{question}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SERP Gap Analysis */}
          <div className="glass-panel rounded-xl p-6 card-shadow">
            <h2 className="text-xl font-bold mb-6">SERP Gap Analysis</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-semibold">Missing Topics</h3>
                </div>
                <ul className="space-y-2">
                  {serpGap.missing_topics.map((item, i) => (
                    <li key={i} className="text-sm text-[--text-secondary] flex items-start gap-2">
                      <span className="text-yellow-400 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle className="w-5 h-5 text-[--accent-secondary]" />
                  <h3 className="font-semibold">Underserved Questions</h3>
                </div>
                <ul className="space-y-2">
                  {serpGap.underserved_questions.map((item, i) => (
                    <li key={i} className="text-sm text-[--text-secondary] flex items-start gap-2">
                      <span className="text-[--accent-secondary] mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Rocket className="w-5 h-5 text-purple-400" />
                  <h3 className="font-semibold">Content Opportunities</h3>
                </div>
                <ul className="space-y-2">
                  {serpGap.content_opportunities.map((item, i) => (
                    <li key={i} className="text-sm text-[--text-secondary] flex items-start gap-2">
                      <span className="text-purple-400 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-[--danger]" />
                  <h3 className="font-semibold">Competitor Weaknesses</h3>
                </div>
                <ul className="space-y-2">
                  {serpGap.competitor_weaknesses.map((item, i) => (
                    <li key={i} className="text-sm text-[--text-secondary] flex items-start gap-2">
                      <span className="text-[--danger] mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-[--accent-primary]/10 border border-[--accent-primary]/20">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-[--accent-primary]" />
                <h4 className="font-semibold">Recommended Word Count</h4>
              </div>
              <p className="text-3xl font-bold gradient-text">{serpGap.recommended_word_count.toLocaleString()} words</p>
            </div>
          </div>

          {/* Traffic Projection */}
          <div className="glass-panel rounded-xl p-6 card-shadow">
            <h2 className="text-xl font-bold mb-6">Traffic Projection</h2>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text mb-2">{traffic.estimated_monthly_searches.toLocaleString()}</div>
                <p className="text-sm text-[--text-secondary]">Est. Monthly Searches</p>
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold gradient-text mb-2">{traffic.ranking_probability}%</div>
                <p className="text-sm text-[--text-secondary]">Ranking Probability</p>
                <ProgressBar value={traffic.ranking_probability} color="primary" className="mt-3" height="thin" />
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold gradient-text mb-2">{traffic.projected_monthly_traffic.toLocaleString()}</div>
                <p className="text-sm text-[--text-secondary]">Projected Monthly Traffic</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-[--bg-tertiary]/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-[--text-secondary]">Competition Level</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    traffic.competition_level === "high" ? "bg-[--danger]/15 text-[--danger]" :
                    traffic.competition_level === "medium" ? "bg-[--warning]/15 text-[--warning]" :
                    "bg-[--success]/15 text-[--success]"
                  }`}>
                    {traffic.competition_level.charAt(0).toUpperCase() + traffic.competition_level.slice(1)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[--bg-tertiary]/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-[--text-secondary]">CTR Estimate</span>
                  <span className="font-semibold text-[--text-primary]">{traffic.ctr_estimate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="glass-panel rounded-xl p-6 card-shadow text-center">
            <h3 className="text-xl font-bold mb-3">Ready to create content for this keyword?</h3>
            <p className="text-[--text-secondary] mb-6">
              Use this strategy to generate a high-ranking blog post in minutes.
            </p>
            <Button
              className="btn-primary px-8"
              onClick={() => navigate("/app/generate", { state: { keyword, location: targetLocation, contentType } })}
            >
              Use This Strategy → Generate Blog
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}