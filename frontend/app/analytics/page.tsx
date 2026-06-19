"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface StatCard {
  label: string;
  value: string;
  hasShimmer?: boolean;
}

interface CategoryBar {
  name: string;
  percent: number;
  colorClass: string;
  shadowColor: string;
}

interface ClusterDot {
  id: number;
  top: string;
  left: string;
  size: string;
  glowClass: string;
  dotClass: string;
  label?: string;
  category: string;
  reportCount: number;
}

interface WeeklyDataPoint {
  day: string;
  healthcare: number;
  technology: number;
  business: number;
}

const CATEGORY_STYLE_MAP: Record<string, { colorClass: string; shadowColor: string; dotClass: string; glowClass: string }> = {
  Healthcare: { colorClass: "bg-[#06B6D4]", shadowColor: "shadow-[0_0_8px_rgba(6,182,212,0.5)]", dotClass: "bg-[#06B6D4]", glowClass: "bg-[#06B6D4]/30 blur-sm" },
  Education: { colorClass: "bg-[#A78BFA]", shadowColor: "shadow-[0_0_8px_rgba(167,139,250,0.5)]", dotClass: "bg-[#A78BFA]", glowClass: "bg-[#A78BFA]/30 blur-sm" },
  Business: { colorClass: "bg-[#F59E0B]", shadowColor: "shadow-[0_0_8px_rgba(245,158,11,0.5)]", dotClass: "bg-[#F59E0B]", glowClass: "bg-[#F59E0B]/30 blur-sm" },
  Technology: { colorClass: "bg-[#6366F1]", shadowColor: "shadow-[0_0_8px_rgba(99,102,241,0.5)]", dotClass: "bg-[#6366F1]", glowClass: "bg-[#6366F1]/30 blur-md" },
  Social: { colorClass: "bg-[#10B981]", shadowColor: "shadow-[0_0_8px_rgba(16,185,129,0.5)]", dotClass: "bg-[#10B981]", glowClass: "bg-[#10B981]/30 blur-sm" },
  Other: { colorClass: "bg-outline", shadowColor: "shadow-none", dotClass: "bg-outline", glowClass: "bg-outline/20" }
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("");

  const [activeTimeRange, setActiveTimeRange] = useState<"7d" | "30d" | "90d">("7d");
  const [downloadClicked, setDownloadClicked] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Dynamic States from Backend
  const [statCards, setStatCards] = useState<StatCard[]>([
    { label: "Total Problems", value: "...", hasShimmer: true },
    { label: "Active Clusters", value: "..." },
    { label: "Avg Confidence", value: "..." },
    { label: "Trending Categories", value: "..." },
  ]);
  const [categoryBars, setCategoryBars] = useState<CategoryBar[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyDataPoint[]>([]);
  const [clusterDots, setClusterDots] = useState<ClusterDot[]>([]);

  // Route Guard
  useEffect(() => {
    const auth = localStorage.getItem("is_authenticated");
    const role = localStorage.getItem("user_role");
    if (auth !== "true" || !role) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, [router]);

  // Fetch all analytics data
  const fetchAnalyticsData = useCallback(async () => {
    if (!isAuthenticated) return;

    // 1. Fetch Stats
    try {
      const data = await api.get<any>(`/api/analytics/stats?range=${activeTimeRange}`);
      setStatCards([
        { label: "Total Problems", value: data.totalProblems, hasShimmer: true },
        { label: "Active Clusters", value: data.activeClusters },
        { label: "Avg Confidence", value: data.avgConfidence },
        { label: "Trending Clusters", value: data.trendingCategories },
      ]);
    } catch (err) {
      console.warn("Stats fetch failed:", err);
    }

    // 2. Fetch Category Distribution
    try {
      const data = await api.get<any[]>(`/api/analytics/categories?range=${activeTimeRange}`);
      const formatted = data.map((c: any) => {
        const style = CATEGORY_STYLE_MAP[c.name] || CATEGORY_STYLE_MAP["Other"];
        return {
          name: c.name,
          percent: c.percent,
          colorClass: style.colorClass,
          shadowColor: style.shadowColor,
        };
      });
      setCategoryBars(formatted);
    } catch (err) {
      console.warn("Categories fetch failed:", err);
    }

    // 3. Fetch Weekly Trends
    try {
      const data = await api.get<WeeklyDataPoint[]>(`/api/analytics/weekly-trends?range=${activeTimeRange}`);
      setWeeklyData(data);
    } catch (err) {
      console.warn("Trends fetch failed:", err);
    }

    // 4. Fetch Cluster t-SNE Map
    try {
      const data = await api.get<any[]>("/api/analytics/cluster-map");
      const formatted = data.map((d: any) => {
        const style = CATEGORY_STYLE_MAP[d.category] || CATEGORY_STYLE_MAP["Other"];
        return {
          id: d.id,
          top: d.top,
          left: d.left,
          size: d.size,
          label: d.label,
          category: d.category,
          reportCount: d.reportCount,
          glowClass: style.glowClass,
          dotClass: style.dotClass,
        };
      });
      setClusterDots(formatted);
    } catch (err) {
      console.warn("Cluster map fetch failed:", err);
    }
  }, [isAuthenticated, activeTimeRange]);

  // Fetch data on mount and when time range changes
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Poll every 15 seconds for near-real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(fetchAnalyticsData, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchAnalyticsData]);

  const handleDownload = async () => {
    setDownloadClicked(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";
      const response = await fetch(`${apiUrl}/api/analytics/export`);
      
      if (!response.ok) {
        throw new Error("Export failed");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "needstack_clusters.csv");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download export", err);
    }
    
    setTimeout(() => setDownloadClicked(false), 3000);
  };

  // Convert week data to SVG path points
  const weeklyToPoints = (data: WeeklyDataPoint[], key: "healthcare" | "technology" | "business") => {
    if (data.length === 0) return "0,100";
    
    // Find max value to scale Y axis (0 to 100 range)
    const maxVal = Math.max(...data.map(d => d[key]), 10);
    
    const pts = data.map((d, i) => {
      const x = i * (200 / (data.length - 1));
      const val = d[key];
      // SVG 0 is at top, so flip Y: height=100. Let's make it scale nicely:
      const y = 90 - (val / maxVal) * 80;
      return `${x},${y}`;
    });
    return pts.join(" ");
  };

  const getFeedLink = () => {
    return userRole === "developer" ? "/feed/developer" : "/user/dashboard";
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col">
      {/* TopNavBar */}
      <header className="bg-[#050507]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 relative">
        <nav className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-headline-md font-headline-md font-extrabold text-primary tracking-tighter cursor-pointer">
              Needstack AI
            </Link>
            <div className="hidden md:flex gap-6">
              <Link className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200" href={getFeedLink()}>
                Feed
              </Link>
              <Link className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200" href="/validate">
                Validate
              </Link>
              <Link className="font-label-md text-label-md text-primary border-b-2 border-primary pb-1" href="/analytics">
                Analytics
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href={getFeedLink()}>
              <button className="bg-primary text-white px-5 py-2 rounded-lg font-bold hover:scale-95 transition-all cursor-pointer">
                Go to Feed
              </button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-grow px-margin-mobile md:px-margin-desktop py-8 max-w-container-max mx-auto w-full">
        {/* Heading */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline-xl text-headline-xl mb-2">Problem Intelligence</h1>
            <p className="text-on-surface-variant font-body-lg text-body-lg">
              Predictive clustering and insight distillation for complex ecosystems.
            </p>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-full border border-white/10 self-start md:self-auto">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setActiveTimeRange(range)}
                className={`px-5 py-1.5 rounded-full font-label-md text-label-md transition-all duration-200 cursor-pointer ${
                  activeTimeRange === range
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface-variant hover:text-white"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-gutter">
          {statCards.map((card, idx) => (
            <div key={idx} className="glass-card p-6 rounded-xl border border-white/5 relative overflow-hidden group">
              {card.hasShimmer && (
                <div className="absolute inset-0 shimmer opacity-10 pointer-events-none"></div>
              )}
              <p className="text-on-surface-variant text-label-md font-label-md mb-2">{card.label}</p>
              <p className="text-secondary font-mono text-headline-lg leading-tight font-bold">{card.value}</p>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">trending_up</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mb-gutter">
          {/* Left: Category Distribution */}
          <div className="lg:col-span-2 glass-card p-8 border border-white/5 rounded-xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-headline-md text-headline-md">Category Distribution</h3>
              <span className="material-symbols-outlined text-on-surface-variant">bar_chart</span>
            </div>
            <div className="space-y-6">
              {categoryBars.length === 0 ? (
                <div className="py-12 flex justify-center">
                  <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
                </div>
              ) : (
                categoryBars.map((cat) => (
                  <div
                    key={cat.name}
                    className="space-y-2 cursor-pointer"
                    onMouseEnter={() => setHoveredCategory(cat.name)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <div className="flex justify-between text-label-md">
                      <span className={hoveredCategory === cat.name ? "text-secondary transition-colors font-bold" : "transition-colors"}>
                        {cat.name}
                      </span>
                      <span className="font-mono">{cat.percent}%</span>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${cat.colorClass} rounded-full ${cat.shadowColor} transition-all duration-500`}
                        style={{ width: hoveredCategory === cat.name ? `${cat.percent + 2}%` : `${cat.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Weekly Trend */}
          <div className="glass-card p-8 border border-white/5 rounded-xl flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-headline-md text-headline-md">Weekly Trend</h3>
              <span className="material-symbols-outlined text-on-surface-variant">show_chart</span>
            </div>
            {weeklyData.length === 0 ? (
              <div className="flex-grow flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
              </div>
            ) : (
              <div className="flex-grow flex flex-col justify-between gap-4">
                <div className="relative pb-4 border-b border-white/5">
                  <svg className="w-full h-40 overflow-visible" preserveAspectRatio="none" viewBox="0 0 200 100">
                    <line stroke="rgba(255,255,255,0.05)" strokeWidth="1" x1="0" x2="200" y1="0" y2="0"></line>
                    <line stroke="rgba(255,255,255,0.05)" strokeWidth="1" x1="0" x2="200" y1="50" y2="50"></line>
                    <line stroke="rgba(255,255,255,0.05)" strokeWidth="1" x1="0" x2="200" y1="100" y2="100"></line>
                    
                    <polyline
                      fill="none"
                      points={weeklyToPoints(weeklyData, "healthcare")}
                      stroke="#06B6D4"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></polyline>
                    <polyline
                      fill="none"
                      points={weeklyToPoints(weeklyData, "technology")}
                      stroke="#6366F1"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></polyline>
                    <polyline
                      fill="none"
                      points={weeklyToPoints(weeklyData, "business")}
                      stroke="#F59E0B"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></polyline>
                  </svg>
                  <div className="flex justify-between mt-2">
                    {weeklyData.map((d) => (
                      <span key={d.day} className="text-[10px] text-outline font-mono">
                        {d.day}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]"></div>
                    <span className="text-label-sm text-outline">Healthcare</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#6366F1]"></div>
                    <span className="text-label-sm text-outline">Technology</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></div>
                    <span className="text-label-sm text-outline">Business</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Third Row: Problem Cluster Map */}
        <div className="glass-card p-8 border border-white/5 rounded-xl mb-gutter">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-headline-md text-headline-md">Problem Cluster Map</h3>
              <p className="text-on-surface-variant text-label-md">
                Multi-dimensional report clustering by vector similarity (2D t-SNE)
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-secondary rounded-full"></div>
                <span className="text-label-sm text-xs font-bold">Active opportunities</span>
              </div>
            </div>
          </div>

          <div className="relative h-[400px] w-full bg-[#030305] rounded-lg border border-white/5 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.02) 1px, transparent 0)",
                backgroundSize: "20px 20px",
              }}
            ></div>

            {/* Cluster Dots */}
            {clusterDots.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
              </div>
            ) : (
              clusterDots.map((dot) => (
                <div
                  key={dot.id}
                  className="absolute group/dot"
                  style={{ top: dot.top, left: dot.left, transform: "translate(-50%, -50%)" }}
                  title={`${dot.category} cluster: ${dot.reportCount} reports`}
                >
                  {/* Glow halo behind */}
                  <div className={`absolute inset-[-4px] rounded-full ${dot.glowClass} opacity-60 animate-pulse`} />
                  {/* Solid dot */}
                  <div className={`relative ${dot.size} rounded-full ${dot.dotClass} ring-1 ring-white/20 hover:ring-2 hover:ring-white transition-all cursor-pointer shadow-lg`} />
                  {/* Label (always show for labeled clusters, hover for others) */}
                  {dot.label && (
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] text-[#A0E9FF] font-mono whitespace-nowrap bg-black/80 px-2 py-0.5 rounded border border-white/10 shadow-lg opacity-0 group-hover/dot:opacity-100 transition-opacity z-10">
                      {dot.label} ({dot.reportCount} reports)
                    </span>
                  )}
                </div>
              ))
            )}

            <div className="absolute bottom-4 right-4 text-label-sm text-outline/40 font-mono text-[10px]">
              t-SNE Dimension 1 →
            </div>
            <div
              className="absolute top-4 left-4 text-label-sm text-outline/40 font-mono text-[10px]"
              style={{ writingMode: "vertical-rl" }}
            >
              t-SNE Dimension 2 ↑
            </div>
          </div>
        </div>

        {/* Bottom Row: Export */}
        <div className="flex flex-col md:flex-row gap-gutter">
          <button
            onClick={handleDownload}
            className="flex items-center gap-3 px-8 py-4 border border-white/10 rounded-lg hover:bg-white/5 transition-all group active:scale-[0.98] cursor-pointer"
          >
            {downloadClicked ? (
              <>
                <span className="material-symbols-outlined text-emerald-400 animate-bounce">check_circle</span>
                <span className="font-label-md text-label-md text-emerald-400 font-bold">Exporting CSV... Check downloads</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-secondary group-hover:scale-110 transition-transform">
                  download
                </span>
                <span className="font-label-md text-label-md text-white font-bold">
                  Download full categorized and clustered dataset (CSV)
                </span>
              </>
            )}
          </button>

          <div className="flex-grow flex items-center gap-3 px-8 py-4 border border-white/5 rounded-lg bg-primary/5">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            <div>
              <p className="font-label-md text-white font-bold">Semantic Engine Active</p>
              <p className="font-label-sm text-on-surface-variant">
                MiniLM-L6-v2 vector embeddings computed on-demand. Deduplication accuracy is &gt;85%.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
