import { useState, useEffect } from "react";
import { Search, Eye, Download, Trash2, Inbox } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { ScoreBadge } from "../components/ScoreBadge";
import { toast } from "sonner";
import { getHistory, deleteFromHistory, type HistoryItem } from "../services/api";
import { Link } from "react-router";

type FilterType = "all" | "week" | "month" | "high" | "low";
type SortType = "newest" | "oldest" | "highest" | "lowest";

export function History() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");

  useEffect(() => {
    setItems(getHistory());
  }, []);

  const filteredData = items
    .filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keyword.toLowerCase().includes(searchQuery.toLowerCase());

      const now = Date.now();
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
      const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

      if (filter === "week") return matchesSearch && item.timestamp > weekAgo;
      if (filter === "month") return matchesSearch && item.timestamp > monthAgo;
      if (filter === "high") return matchesSearch && item.seoScore >= 80;
      if (filter === "low") return matchesSearch && item.seoScore < 60;

      return matchesSearch;
    })
    .sort((a, b) => {
      if (sort === "newest") return b.timestamp - a.timestamp;
      if (sort === "oldest") return a.timestamp - b.timestamp;
      if (sort === "highest") return b.seoScore - a.seoScore;
      if (sort === "lowest") return a.seoScore - b.seoScore;
      return 0;
    });

  const handleDelete = (id: string) => {
    deleteFromHistory(id);
    setItems(getHistory());
    toast.success("Blog deleted successfully");
  };

  const handleDownload = (item: HistoryItem) => {
    const blob = new Blob([item.blogContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.keyword.replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="glass-panel rounded-xl p-6 card-shadow">
        <h2 className="text-2xl font-bold mb-2">Generation History</h2>
        <p className="text-[--text-secondary]">View and manage all your generated content</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel rounded-xl p-6 card-shadow">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[--text-tertiary]" />
            <Input
              placeholder="Search by keyword or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[--bg-tertiary] border-[--border-subtle]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "All" },
              { value: "week", label: "This Week" },
              { value: "month", label: "This Month" },
              { value: "high", label: "High Score (≥80)" },
              { value: "low", label: "Low Score (<60)" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as FilterType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f.value
                    ? "btn-primary"
                    : "bg-[--bg-tertiary] text-[--text-secondary] hover:text-[--text-primary]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="px-4 py-2 rounded-lg bg-[--bg-tertiary] border border-[--border-subtle] text-[--text-primary] text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Score</option>
            <option value="lowest">Lowest Score</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-[--text-secondary]">
          Showing {filteredData.length} of {items.length} results
        </p>
      </div>

      {/* History Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredData.map((item) => (
          <div
            key={item.id}
            className="glass-panel rounded-xl p-6 card-shadow hover:border-[--border-active] transition-all duration-300 flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <ScoreBadge score={item.seoScore} />
              <div className="flex gap-1">
                <button
                  onClick={() => handleDownload(item)}
                  className="p-2 rounded-lg hover:bg-[--bg-tertiary] transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4 text-[--text-secondary]" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-lg hover:bg-[--bg-tertiary] transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-[--danger]" />
                </button>
              </div>
            </div>

            <h3 className="mb-3 line-clamp-2" style={{ fontWeight: 600, fontSize: "0.9375rem", lineHeight: 1.4 }}>{item.title}</h3>

            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-[--accent-secondary]/12 text-[--accent-secondary]">
                {item.keyword}
              </span>
            </div>

            <div className="mt-auto flex justify-between items-center text-xs text-[--text-secondary] pt-3 border-t border-[--border-subtle]/50">
              <span>{item.wordCount.toLocaleString()} words</span>
              <span>Naturalness: {item.naturalness}%</span>
              <span className="text-[--text-tertiary]">{item.date}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="glass-panel rounded-xl p-12 card-shadow text-center">
          <div className="flex justify-center mb-4">
            <Inbox className="w-12 h-12 text-[--text-tertiary]" />
          </div>
          <h3 className="text-xl font-bold mb-2">
            {items.length === 0 ? "No blogs generated yet" : "No results found"}
          </h3>
          <p className="text-[--text-secondary] mb-6">
            {items.length === 0 ? "Generate your first blog to see it here." : "Try adjusting your search or filters"}
          </p>
          {items.length === 0 && (
            <Link to="/app/generate">
              <Button className="btn-primary">
                Generate Your First Blog
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}