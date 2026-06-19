"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface UserFeedItem {
  id: number;
  category: string;
  categoryClass: string;
  timestamp: string;
  problemText: string;
  votes: number;
  similarReportsCount: number;
}

function UserFeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  
  // Feed list and submission states
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(true);
  const [problemText, setProblemText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Select Category");
  const [showSubmissionSuccess, setShowSubmissionSuccess] = useState(false);
  const [successSimilarCount, setSuccessSimilarCount] = useState(0);
  const [userFeedItems, setUserFeedItems] = useState<UserFeedItem[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  // Authentication Route Guard & Redirect to dashboard
  useEffect(() => {
    const auth = localStorage.getItem("is_authenticated");
    const role = localStorage.getItem("user_role");
    
    if (auth !== "true" || role !== "user") {
      router.push("/login");
    } else {
      const action = searchParams.get("action");
      if (action === "submit") {
        router.replace("/user/dashboard?tab=submit");
      } else {
        router.replace("/user/dashboard");
      }
    }
  }, [router, searchParams]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";

  // Fetch Feed Data from API
  const fetchFeed = async (categoryFilter = "All") => {
    setIsLoadingFeed(true);
    try {
      const catQuery = categoryFilter !== "All" ? `?category=${categoryFilter}` : "";
      const res = await fetch(`${apiUrl}/api/problems/user-feed${catQuery}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setUserFeedItems(data);
      }
    } catch (err) {
      console.warn("Failed to fetch user feed:", err);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeed(activeFilter);
    }
  }, [isAuthenticated, activeFilter]);

  // Handle auto-expansion of submission form from query params
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "submit") {
      setIsSubmissionOpen(true);
      const element = document.getElementById("submission-container");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [searchParams]);

  // Upvote Problem in API
  const handleUserUpvote = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/api/problems/upvote/${id}`, {
        method: "POST",
      }).catch(() => null);
      if (res && res.ok) {
        setUserFeedItems(prev =>
          prev.map(item => (item.id === id ? { ...item, votes: item.votes + 1 } : item))
        );
      }
    } catch (err) {
      console.warn("Failed to upvote:", err);
    }
  };

  // Submit Problem Statement to API
  const handleSubmitProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemText || selectedCategory === "Select Category") return;

    try {
      const res = await fetch(`${apiUrl}/api/problems/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: problemText,
          category: selectedCategory
        }),
      }).catch(() => null);

      if (res && res.ok) {
        const result = await res.json();
        
        // Show success hint and reports count
        setSuccessSimilarCount(result.similarReportsCount);
        setShowSubmissionSuccess(true);
        
        // Reset form
        setProblemText("");
        setSelectedCategory("Select Category");
        
        // Reload feed to show new submission
        fetchFeed(activeFilter);

        // Hide success alert after 6 seconds
        setTimeout(() => {
          setShowSubmissionSuccess(false);
        }, 6000);
      }
    } catch (err) {
      console.warn("Failed to submit problem:", err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
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
      <nav className="w-full sticky top-0 z-50 bg-[#050507]/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 w-full max-w-container-max mx-auto">
          <Link href="/" className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-1 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full after:shadow-[0_0_10px_#6366F1]">
            Needstack AI
          </Link>
          
          <div className="hidden md:flex gap-8 items-center">
            <span className="text-primary font-bold border-b-2 border-primary pb-1 font-body-md text-body-md">
              User Feed
            </span>
            <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md" href="/validate">
              Validate Idea
            </Link>
            <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md" href="/analytics">
              Analytics
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-outline hidden sm:inline">{userEmail}</span>
            <button 
              onClick={handleLogout}
              className="bg-white/5 border border-white/20 text-white px-4 py-2 rounded-lg font-label-md hover:bg-white/10 transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-grow w-full max-w-[800px] mx-auto px-margin-mobile md:px-0 py-10 space-y-10">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <h1 className="font-headline-xl text-headline-xl">Voice Your Problem</h1>
          <p className="text-on-surface-variant font-body-md">
            Describe your friction in plain language. AI will handle the rest.
          </p>
        </div>

        {/* Submission Section */}
        <section className="space-y-4" id="submission-container">
          <div className="glass-card rounded-xl p-6 border border-white/10 shadow-lg overflow-hidden">
            <div
              className="flex justify-between items-center cursor-pointer group"
              onClick={() => setIsSubmissionOpen(!isSubmissionOpen)}
            >
              <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-3">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  add_circle
                </span>
                Report a Problem
              </h2>
              <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${isSubmissionOpen ? "rotate-0" : "-rotate-90"}`}>
                expand_more
              </span>
            </div>
            
            <div className={`space-y-6 transition-all duration-400 overflow-hidden ${isSubmissionOpen ? "max-h-[500px] opacity-100 mt-6" : "max-h-0 opacity-0 pointer-events-none"}`}>
              <form onSubmit={handleSubmitProblem} className="space-y-6">
                <div className="relative group">
                  <textarea
                    value={problemText}
                    onChange={(e) => setProblemText(e.target.value)}
                    maxLength={280}
                    className="w-full h-32 bg-[#0a0a0f] border border-white/10 rounded-lg p-4 text-on-surface placeholder:text-outline-variant/50 focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none resize-none custom-scrollbar"
                    placeholder="E.g., I keep getting stuck waiting for a local bus, the schedules are completely wrong online..."
                  />
                  <div className={`absolute bottom-3 right-3 text-label-sm ${problemText.length >= 280 ? "text-error" : "text-outline/60"}`}>
                    {problemText.length}/280
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="w-full md:w-64 relative group">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg py-2.5 px-4 appearance-none text-on-surface focus:border-primary outline-none cursor-pointer"
                    >
                      <option disabled>Select Category</option>
                      <option>Healthcare</option>
                      <option>Education</option>
                      <option>Business</option>
                      <option>Technology</option>
                      <option>Social</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">
                      expand_more
                    </span>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!problemText || selectedCategory === "Select Category"}
                    className="w-full md:w-auto bg-primary-container text-on-primary-container px-8 py-3 rounded-lg font-label-md hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Submit Problem</span>
                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                  </button>
                </div>
              </form>

              {/* Success State Hint */}
              {showSubmissionSuccess && (
                <div className="bg-secondary/15 border border-secondary/30 rounded-lg py-3.5 px-4 flex items-center gap-3 animate-in fade-in duration-300">
                  <span className="material-symbols-outlined text-secondary text-lg">check_circle</span>
                  <p className="text-label-md text-secondary font-bold">
                    Problem submitted successfully! AI grouped this with {successSimilarCount} similar reports.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-3">
            {["All", "Healthcare", "Education", "Business", "Technology", "Social"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-6 py-2 rounded-full font-label-md whitespace-nowrap transition-all border cursor-pointer ${
                  activeFilter === cat
                    ? "bg-primary-container text-on-primary-container border-primary"
                    : "bg-white/5 text-on-surface-variant hover:text-white hover:bg-white/10 border-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Problem Feed */}
        <section className="space-y-6">
          {isLoadingFeed ? (
            <div className="py-12 flex justify-center">
              <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
            </div>
          ) : userFeedItems.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center text-outline border border-white/5">
              No problem statements found in this category.
            </div>
          ) : (
            userFeedItems.map((item) => (
              <div key={item.id} className="glass-card rounded-xl p-6 border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex gap-6">
                  {/* Voting */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleUserUpvote(item.id)}
                      className="material-symbols-outlined text-outline/60 hover:text-primary transition-colors cursor-pointer select-none"
                    >
                      arrow_drop_up
                    </button>
                    <span className="font-headline-md text-primary font-bold">{item.votes}</span>
                  </div>
                  
                  <div className="flex-grow space-y-4">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <span className={`px-3 py-1 rounded-full text-label-sm border ${item.categoryClass}`}>
                        {item.category}
                      </span>
                      <span className="text-label-sm text-outline/60">{item.timestamp}</span>
                    </div>
                    <p className="font-body-lg text-on-surface leading-relaxed">{item.problemText}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-label-sm text-outline/80 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">groups</span>
                        Similar reports: {item.similarReportsCount}
                      </span>
                      <Link className="text-label-sm text-primary font-bold flex items-center gap-1 hover:underline transition-all" href="/validate">
                        Check validation
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

export default function UserFeedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050507] flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
      </div>
    }>
      <UserFeedContent />
    </Suspense>
  );
}
