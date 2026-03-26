import { Link } from "react-router";
import { useEffect, useState } from "react";
import {
  Zap, BarChart3, Target, Clock, TrendingUp,
  Eye, Download, PenTool, Search, BookOpen, ArrowRight,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { ScoreBadge } from "../components/ScoreBadge";
import { getHistory, healthCheck, type HistoryItem, type HealthResponse } from "../services/api";

export function Dashboard() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [apiStatus, setApiStatus] = useState<HealthResponse | null>(null);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    setHistory(getHistory());

    healthCheck()
      .then(setApiStatus)
      .catch(() => setApiError(true));
  }, []);

  const recentGenerations = history.slice(0, 5);
  const totalBlogs = history.length;
  const avgSeoScore = totalBlogs > 0
    ? (history.reduce((s, h) => s + h.seoScore, 0) / totalBlogs).toFixed(1)
    : "—";
  const avgNaturalness = totalBlogs > 0
    ? Math.round(history.reduce((s, h) => s + h.naturalness, 0) / totalBlogs) + "%"
    : "—";

  const stats = [
    { icon: Zap, value: String(totalBlogs), label: "Blogs Generated", trend: totalBlogs > 0 ? "Active" : "Get started", trendColor: "text-[--success]" },
    { icon: BarChart3, value: avgSeoScore, label: "Avg. SEO Score", trend: "", trendColor: "text-[--success]" },
    { icon: Target, value: avgNaturalness, label: "Avg. Naturalness", trend: "", trendColor: "text-[--success]" },
    { icon: Clock, value: "~2m", label: "Avg. Generation Time", trend: "", trendColor: "text-[--success]" },
  ];

  const quickActions = [
    { icon: PenTool, title: "Generate Blog", description: "Create SEO-optimized content in minutes", iconBg: "bg-accent-tint", iconColor: "text-accent", link: "/app/generate" },
    { icon: Search, title: "Analyze Keywords", description: "Research keywords and SERP gaps", iconBg: "bg-teal-tint", iconColor: "text-teal", link: "/app/keywords" },
    { icon: BookOpen, title: "View API Docs", description: "Integration guides and examples", iconBg: "bg-[--bg-tertiary]", iconColor: "text-[--text-primary]", link: "#" },
  ];

  const topItem = history[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-panel rounded-xl p-6 card-shadow">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="mb-1.5" style={{ fontSize: "1.375rem", fontWeight: 700 }}>Welcome to RankForge</h2>
            <p className="text-sm text-[--text-secondary]">Here's your content performance overview.</p>
          </div>
          <Link to="/app/generate" className="flex-shrink-0">
            <Button className="btn-primary">
              Generate New Blog
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-panel rounded-xl p-6 card-shadow hover:border-[--border-active] transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-[--bg-tertiary] flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-[--text-primary]" />
              </div>
              <div className="gradient-text mb-1" style={{ fontSize: "1.875rem", fontWeight: 700, lineHeight: 1 }}>{stat.value}</div>
              <div className="text-sm text-[--text-secondary] mb-2">{stat.label}</div>
              {stat.trend && <div className={`text-xs ${stat.trendColor}`} style={{ fontWeight: 600 }}>{stat.trend}</div>}
            </div>
          );
        })}
      </div>

      {/* Main two-column area */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Generations Table */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-6 card-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 style={{ fontSize: "1.0625rem", fontWeight: 700 }}>Recent Generations</h3>
            <Link to="/app/history" className="text-sm text-[--accent-primary] hover:text-[--accent-primary-hover] flex items-center gap-1 transition-colors">
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentGenerations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[--text-secondary] mb-4">No blogs generated yet.</p>
              <Link to="/app/generate">
                <Button className="btn-primary">
                  Generate Your First Blog
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[--border-subtle]">
                    {["Title", "Keyword", "SEO Score", "Date", "Actions"].map((col, ci) => (
                      <th key={col} className={`text-left py-3 px-3 text-xs text-[--text-tertiary] uppercase tracking-wider ${ci === 1 ? "hidden md:table-cell" : ""} ${ci === 3 ? "hidden lg:table-cell" : ""}`} style={{ fontWeight: 600 }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentGenerations.map((gen) => (
                    <tr key={gen.id} className="border-b border-[--border-subtle]/40 hover:bg-[--bg-tertiary]/25 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="text-sm text-[--text-primary]" style={{ fontWeight: 500 }}>{gen.title}</div>
                        <div className="text-xs text-[--text-tertiary] mt-0.5">{gen.wordCount.toLocaleString()} words</div>
                      </td>
                      <td className="py-3.5 px-3 hidden md:table-cell">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-[--accent-secondary]/12 text-[--accent-secondary]">{gen.keyword}</span>
                      </td>
                      <td className="py-3.5 px-3"><ScoreBadge score={gen.seoScore} /></td>
                      <td className="py-3.5 px-3 text-sm text-[--text-secondary] hidden lg:table-cell">{gen.date}</td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1">
                          <button className="p-2 rounded-lg hover:bg-[--bg-tertiary] transition-colors" title="View"><Eye className="w-4 h-4 text-[--text-secondary]" /></button>
                          <button className="p-2 rounded-lg hover:bg-[--bg-tertiary] transition-colors" title="Download"
                            onClick={() => {
                              const blob = new Blob([gen.blogContent], { type: "text/markdown" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `${gen.keyword.replace(/\s+/g, "-")}.md`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                          ><Download className="w-4 h-4 text-[--text-secondary]" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Quick Actions */}
          <div className="glass-panel rounded-xl p-6 card-shadow">
            <h3 className="mb-4" style={{ fontSize: "1rem", fontWeight: 700 }}>Quick Actions</h3>
            <div className="space-y-3">
              {quickActions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <Link key={i} to={action.link} className="flex items-center gap-3 p-3.5 rounded-lg bg-[--bg-tertiary]/40 hover:bg-[--bg-tertiary] transition-all duration-200 group">
                    <div className={`w-9 h-9 rounded-lg ${action.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${action.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[--text-primary]" style={{ fontWeight: 600 }}>{action.title}</div>
                      <div className="text-xs text-[--text-secondary] mt-0.5">{action.description}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[--text-tertiary] group-hover:text-[--accent-primary] transition-colors flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* API Status */}
          <div className="glass-panel rounded-xl p-6 card-shadow">
            <h3 className="mb-4" style={{ fontSize: "1rem", fontWeight: 700 }}>API Status</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${apiError ? "bg-[--danger]" : "bg-[--success] pulse-dot"}`} />
              <div>
                <div className="text-sm text-[--text-primary]" style={{ fontWeight: 600 }}>
                  {apiStatus ? `${apiStatus.service} v${apiStatus.version}` : apiError ? "API Unreachable" : "Connecting..."}
                </div>
                <div className="text-xs text-[--text-secondary]">
                  {apiStatus ? "All systems operational" : apiError ? "Start the backend server" : "Checking..."}
                </div>
              </div>
            </div>
            {apiError && (
              <p className="text-xs text-[--text-tertiary] mt-2">
                Run <code className="bg-[--bg-tertiary] px-1 py-0.5 rounded">python -m app.main</code> to start the backend.
              </p>
            )}
          </div>

          {/* Top Keyword */}
          {topItem && (
            <div className="glass-panel rounded-xl p-6 card-shadow">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-4 h-4 text-[--accent-secondary]" />
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Latest Generation</h3>
              </div>
              <div className="text-sm text-[--text-primary]" style={{ fontWeight: 500 }}>{topItem.keyword}</div>
              <div className="text-xs text-[--text-tertiary] mt-1">SEO Score: {topItem.seoScore} · {topItem.wordCount.toLocaleString()} words</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
