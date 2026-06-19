"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ValidationCluster {
  id: number;
  title: string;
  reportCount: number;
  similarityPercent: number;
}

interface ValidationResult {
  category: string;
  confidence: number;
  clusters: ValidationCluster[];
  verdict: "real" | "weak" | "niche";
  totalSimilarReports: number;
  totalClusters: number;
}

export default function ValidatePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [ideaText, setIdeaText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [hasValidated, setHasValidated] = useState(false);
  const [error, setError] = useState("");

  // Route guard
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

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaText.trim()) return;

    setIsLoading(true);
    setValidationResult(null);
    setHasValidated(false);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";
      const res = await fetch(`${apiUrl}/api/problems/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: ideaText }),
      }).catch(() => null);

      if (!res || !res.ok) {
        throw new Error("Failed to validate idea. Could not connect to API server.");
      }

      const data = await res.json();
      setValidationResult(data);
      setHasValidated(true);
    } catch (err: any) {
      setError(err.message || "Connection to API failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIdeaText("");
    setValidationResult(null);
    setHasValidated(false);
    setIsLoading(false);
    setError("");
  };

  const getVerdictConfig = (verdict: ValidationResult["verdict"]) => {
    switch (verdict) {
      case "real":
        return {
          bg: "bg-gradient-to-r from-emerald-500/10 to-transparent",
          border: "border-emerald-500/20",
          iconColor: "bg-emerald-500/20 text-emerald-400",
          icon: "check_circle",
          title: "Real & Frequent Problem",
          textColor: "text-emerald-400/80",
        };
      case "weak":
        return {
          bg: "bg-gradient-to-r from-amber-500/10 to-transparent",
          border: "border-amber-500/20",
          iconColor: "bg-amber-500/20 text-amber-400",
          icon: "warning",
          title: "Weak Signal Detected",
          textColor: "text-amber-400/80",
        };
      case "niche":
        return {
          bg: "bg-gradient-to-r from-outline/10 to-transparent",
          border: "border-outline/20",
          iconColor: "bg-outline/20 text-outline",
          icon: "info",
          title: "Niche Problem",
          textColor: "text-outline/80",
        };
    }
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
      <header className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 w-full sticky z-50 bg-[#050507]/80 backdrop-blur-xl border-b border-white/10 top-0 relative">
        <div className="font-headline-md text-headline-md font-bold text-white flex items-center gap-1 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full after:shadow-[0_0_10px_#6366F1]">
          <Link href="/">Needstack AI</Link>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href={getFeedLink()}>
            Feed
          </Link>
          <Link className="font-body-md text-body-md text-primary font-bold border-b-2 border-primary pb-1" href="/validate">
            Validate
          </Link>
          <Link className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors" href="/analytics">
            Analytics
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href={userRole === "developer" ? "/feed/developer" : "/user/dashboard?tab=submit"}>
            <button className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:scale-95 transition-transform cursor-pointer">
              Go to Feed
            </button>
          </Link>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center px-4 py-16 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-headline-xl text-headline-xl mb-4">Idea Validator</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg mx-auto">
            Is your product idea solving a real, frequent problem? Get instant AI-driven intelligence from our aggregated database.
          </p>
        </div>

        {/* Main Input Card */}
        <div className="glass-card w-full max-w-[700px] rounded-2xl p-8 mb-12 border border-white/10 shadow-2xl">
          <form onSubmit={handleValidate} className="flex flex-col gap-6">
            {error && (
              <div className="bg-error-container/20 border border-error-container/40 text-[#FF85A1] rounded-lg p-3 text-label-md flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{error}</span>
              </div>
            )}
            <div className="relative">
              <textarea
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-6 font-body-md text-white placeholder:text-outline-variant focus:border-secondary focus:ring-0 transition-all outline-none resize-none"
                placeholder="Describe your startup idea or problem statement here in detail (e.g., An offline-first database synchronization library to prevent app crashes when network connectivity is lost)..."
                rows={5}
                disabled={isLoading}
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-2 text-outline/60 text-xs font-mono">
                <span className="material-symbols-outlined text-sm">bolt</span>
                AI validator active
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={!ideaText.trim() || isLoading}
                className="flex-1 bg-[#6366F1] hover:bg-[#494bd6] disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(99,102,241,0.6)] transition-all active:scale-95 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Running Semantic Analysis...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      auto_awesome
                    </span>
                    Validate Idea
                  </>
                )}
              </button>

              {hasValidated && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-4 rounded-xl border border-white/10 text-on-surface-variant hover:text-white hover:border-white/20 transition-all cursor-pointer bg-white/5"
                >
                  <span className="material-symbols-outlined">restart_alt</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="w-full space-y-6 animate-pulse">
            <div className="h-10 bg-white/5 rounded-lg w-2/3 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-5 rounded-xl h-28 border border-white/5"></div>
              ))}
            </div>
            <div className="h-24 bg-white/5 rounded-2xl border border-white/5"></div>
          </div>
        )}

        {/* Results Section */}
        {hasValidated && validationResult && (
          <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Predicted Category */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-xs">
                  Predicted Category
                </span>
                <span className="bg-secondary-container/20 text-secondary px-3 py-1 rounded-full text-xs font-bold border border-secondary/30">
                  {validationResult.category}
                </span>
              </div>
              <div className="font-mono text-secondary text-sm font-bold">
                {validationResult.confidence}% category confidence
              </div>
            </div>

            {/* Similarity Clusters */}
            <div className="space-y-4">
              <h3 className="font-headline-md text-headline-md">Top Similar Clusters</h3>
              
              {validationResult.clusters.length === 0 ? (
                <div className="glass-card p-6 text-center text-outline border border-white/5 rounded-xl">
                  No similar problem clusters found in our database (similarity &lt; 65%).
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {validationResult.clusters.map((cluster) => (
                    <div key={cluster.id} className="glass-card p-5 rounded-xl border border-white/5 hover:border-white/20 transition-all group">
                      <div className="flex flex-col justify-between h-full space-y-3">
                        <div>
                          <h4 className="font-body-md font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                            {cluster.title}
                          </h4>
                          <span className="font-mono text-[10px] text-[#6366F1] bg-[#6366F1]/10 px-2 py-0.5 rounded-full inline-block mt-1">
                            {cluster.reportCount} reports
                          </span>
                        </div>
                        <div>
                          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-secondary shimmer"
                              style={{ width: `${cluster.similarityPercent}%` }}
                            ></div>
                          </div>
                          <p className="text-label-sm text-outline mt-1 text-xs">{cluster.similarityPercent}% similarity</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Verdict Banner */}
            {(() => {
              const config = getVerdictConfig(validationResult.verdict);
              return (
                <div className={`w-full relative overflow-hidden p-8 rounded-2xl ${config.bg} border ${config.border}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full ${config.iconColor} flex items-center justify-center shrink-0`}>
                      <span className="material-symbols-outlined text-3xl">{config.icon}</span>
                    </div>
                    <div>
                      <div className="font-headline-md text-white font-bold mb-1">{config.title}</div>
                      <div className={`font-mono ${config.textColor} text-sm`}>
                        {validationResult.totalSimilarReports} total reports matching this idea across {validationResult.totalClusters} cluster searches.
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-10">
                    <span className="material-symbols-outlined text-8xl">verified</span>
                  </div>
                </div>
              );
            })()}

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href={getFeedLink()} className="w-full sm:w-auto">
                <button className="px-8 py-3 rounded-xl border border-primary text-primary hover:bg-primary/10 font-label-md font-bold transition-all cursor-pointer w-full text-center">
                  Explore Problems in Feed
                </button>
              </Link>
              <Link href="/analytics" className="w-full sm:w-auto">
                <button className="px-8 py-3 rounded-xl bg-primary-container text-on-primary-container font-label-md font-bold hover:opacity-90 transition-all cursor-pointer w-full text-center">
                  View Full Analytics
                </button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
