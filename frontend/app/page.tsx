"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState("");
  
  // Dynamic Stats State
  const [totalProblems, setTotalProblems] = useState("12,847");
  const [activeClusters, setActiveClusters] = useState("1,203");
  const [claimsToday, setClaimsToday] = useState("94");

  // Load auth state and fetch stats
  useEffect(() => {
    const auth = localStorage.getItem("is_authenticated");
    const userRole = localStorage.getItem("user_role");
    if (auth === "true" && userRole) {
      setIsAuthenticated(true);
      setRole(userRole);
    }

    const fetchStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";
        const res = await fetch(`${apiUrl}/api/analytics/stats`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          setTotalProblems(data.totalProblems);
          setActiveClusters(data.activeClusters);
          // Calculate dynamic claims (mocked based on actual claimed clusters in DB)
          // We can use a simple formula or fetch claims
          setClaimsToday(data.trendingCategories);
        }
      } catch (err) {
        console.warn("Failed to fetch landing stats:", err);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let points: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
    }> = [];
    const pointCount = 60;
    const maxDistance = 150;
    let animationId: number;

    const init = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      points = [];
      for (let i = 0; i < pointCount; i++) {
        points.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
        });
      }
    };

    const draw = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#6366F1";
      ctx.strokeStyle = "rgba(99, 102, 241, 0.2)";

      points.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < points.length; j++) {
          const p2 = points[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });
      animationId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      init();
    };

    window.addEventListener("resize", handleResize);
    init();
    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Determine feed route based on role
  const getFeedRoute = () => {
    if (isAuthenticated) {
      if (role === "developer") return "/developer/dashboard";
      if (role === "admin") return "/admin/dashboard";
      return "/user/dashboard";
    }
    return "/login";
  };

  const getSubmitRoute = () => {
    return "/user/dashboard?tab=submit";
  };

  return (
    <>
      {/* TopNavBar */}
      <nav className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 w-full sticky top-0 z-50 bg-[#050507]/80 backdrop-blur-xl border-b border-white/10 relative">
        <div className="font-headline-md text-headline-md font-bold text-white flex items-center gap-1 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full after:shadow-[0_0_10px_#6366F1]">
          Needstack AI
        </div>
        <div className="hidden md:flex gap-8 items-center">
          <Link
            className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md"
            href="/feed"
          >
            Feed
          </Link>
          <Link
            className="text-on-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md"
            href="/validate"
          >
            Validate
          </Link>
          <Link
            className="text-on-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md"
            href="/analytics"
          >
            Analytics
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href={getSubmitRoute()} className="hidden sm:inline-block">
            <button className="border border-white/10 hover:border-white/20 text-on-surface-variant hover:text-white px-4 py-2 rounded-lg font-label-md text-label-md transition-all cursor-pointer">
              Submit a Problem
            </button>
          </Link>
          
          {!isAuthenticated ? (
            <>
              <Link href="/login" className="hidden sm:inline-block text-on-surface-variant hover:text-white font-label-md text-label-md transition-colors px-2 py-2">
                Sign In
              </Link>
              <Link href="/signup" className="hidden sm:inline-block">
                <button className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-[#8083ff] active:scale-95 transition-all shadow-[0_0_10px_rgba(192,193,255,0.2)] cursor-pointer">
                  Sign Up
                </button>
              </Link>
            </>
          ) : (
            <Link href={getFeedRoute()} className="hidden sm:inline-block">
              <button className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-[#8083ff] active:scale-95 transition-all cursor-pointer">
                Go to Dashboard
              </button>
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center p-2 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg transition-colors cursor-pointer select-none"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined">{mobileMenuOpen ? "close" : "menu"}</span>
          </button>
        </div>
        
        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-[#050507]/95 backdrop-blur-xl border-b border-white/10 flex flex-col p-6 space-y-4 md:hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <Link
              onClick={() => setMobileMenuOpen(false)}
              className="text-on-surface-variant hover:text-primary py-2 border-b border-white/5 font-body-md"
              href="/feed"
            >
              Feed
            </Link>
            <Link
              onClick={() => setMobileMenuOpen(false)}
              className="text-on-surface-variant hover:text-primary py-2 border-b border-white/5 font-body-md"
              href="/validate"
            >
              Validate
            </Link>
            <Link
              onClick={() => setMobileMenuOpen(false)}
              className="text-on-surface-variant hover:text-primary py-2 border-b border-white/5 font-body-md"
              href="/analytics"
            >
              Analytics
            </Link>
            <Link
              onClick={() => setMobileMenuOpen(false)}
              className="text-on-surface-variant hover:text-primary py-2 border-b border-white/5 font-body-md"
              href={getSubmitRoute()}
            >
              Submit a Problem
            </Link>
            {!isAuthenticated ? (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  onClick={() => setMobileMenuOpen(false)}
                  className="border border-white/10 hover:border-white/20 text-on-surface-variant text-center py-2.5 rounded-lg font-label-md text-label-md"
                  href="/login"
                >
                  Sign In
                </Link>
                <Link
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-primary text-on-primary text-center py-2.5 rounded-lg font-label-md text-label-md"
                  href="/signup"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <Link
                onClick={() => setMobileMenuOpen(false)}
                className="bg-primary text-on-primary text-center py-2.5 rounded-lg font-label-md text-label-md"
                href={getFeedRoute()}
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        )}
      </nav>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative min-h-[870px] flex flex-col items-center justify-center text-center px-margin-mobile md:px-margin-desktop overflow-hidden">
          <canvas ref={canvasRef} id="network" className="absolute top-0 left-0 w-full h-full z-0 opacity-40 pointer-events-none" />
          <div className="hero-glow -top-20 -left-20"></div>
          <div className="hero-glow -bottom-20 -right-20"></div>
          <div className="relative z-10 max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-md text-label-md mb-4 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Live Problem Aggregation Engine
            </div>
            <h1 className="font-headline-xl text-headline-xl md:leading-tight">
              Problems Are Data. <br />
              <span className="text-primary">Data Builds Products.</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              The AI layer that turns scattered complaints into validated developer opportunities. We cluster demand so you can build with precision.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/feed">
                <button className="bg-[#6366F1] text-white px-10 py-4 rounded-xl font-headline-md text-headline-md hover:shadow-[0_0_20px_#6366F1] transition-all flex items-center justify-center gap-2 group w-full sm:w-auto cursor-pointer">
                  Explore Problems
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
              </Link>
              <Link href="/user/dashboard?tab=submit">
                <button className="bg-white/5 border border-white/20 text-white px-10 py-4 rounded-xl font-headline-md text-headline-md hover:bg-white/10 transition-all w-full sm:w-auto cursor-pointer">
                  Submit a Problem
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="px-margin-mobile md:px-margin-desktop -mt-12 mb-24 relative z-20">
          <div className="max-w-container-max mx-auto glass-card rounded-2xl p-8 border border-white/10 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10 text-center">
            <div className="flex-1 py-4 md:py-0 flex flex-col gap-1">
              <span className="text-[#06B6D4] font-headline-xl text-[48px] font-bold">{totalProblems}</span>
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Problems Submitted</span>
            </div>
            <div className="flex-1 py-4 md:py-0 flex flex-col gap-1">
              <span className="text-[#06B6D4] font-headline-xl text-[48px] font-bold">{activeClusters}</span>
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Active Clusters</span>
            </div>
            <div className="flex-1 py-4 md:py-0 flex flex-col gap-1">
              <span className="text-[#06B6D4] font-headline-xl text-[48px] font-bold">{claimsToday}</span>
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Trending Opportunities</span>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="px-margin-mobile md:px-margin-desktop py-24 bg-surface-container-lowest/50 relative overflow-hidden">
          <div className="max-w-container-max mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="font-headline-lg text-headline-lg">How It Works</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Converting chaos into structured intelligence in three steps.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter relative">
              {/* Connectors (Desktop) */}
              <div className="hidden md:block absolute top-1/2 left-[30%] w-[10%] h-[1px] bg-gradient-to-r from-primary to-transparent -translate-y-1/2">
                <span className="material-symbols-outlined absolute right-0 -top-3 text-primary">chevron_right</span>
              </div>
              <div className="hidden md:block absolute top-1/2 left-[63%] w-[10%] h-[1px] bg-gradient-to-r from-primary to-transparent -translate-y-1/2">
                <span className="material-symbols-outlined absolute right-0 -top-3 text-primary">chevron_right</span>
              </div>
              {/* Step 1 */}
              <div className="glass-card p-10 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>add_comment</span>
                </div>
                <h3 className="font-headline-md text-headline-md">Users Submit</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Anyone describes their daily friction or unresolved technical problem in natural language.
                </p>
              </div>
              {/* Step 2 */}
              <div className="glass-card p-10 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#06B6D4] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
                </div>
                <h3 className="font-headline-md text-headline-md">AI Aggregates</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Semantic deduplication groups identical problems, surfacing real-world demand clusters.
                </p>
              </div>
              {/* Step 3 */}
              <div className="glass-card p-10 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-tertiary/10 border border-tertiary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                </div>
                <h3 className="font-headline-md text-headline-md">Developers Discover</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Validated Problem Cards surface high-signal opportunities for founders and builders.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-margin-mobile md:px-margin-desktop py-24">
          <div className="max-w-container-max mx-auto glass-card rounded-2xl md:rounded-[32px] border border-white/10 p-6 md:p-20 relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <img
                className="w-full h-full object-cover"
                alt="Abstract 3D network landscape"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAy6km9axALW4Bnvx-w9E7kAXbPnlouf_EGclphWkcNkrDcGlqwhVhZ__kBj0iqhvJtZnwzfXL9WIWuMgvPHlwypFdRWOfIi6A_-6-eb_Hko30VHFtcoYjFS8m28vkX_VpFYXoFVbS5K3pkZHcnNM0PdfxDBMeo12zU8OVt7R7KxcgFYWsukrQDzkulills0MX73AL1n2fe6cvsnC1mphYyKL-OwVXizcqiAaJOLVE6TZSM0t3wREcujKXVrsLPYOtJeGKwfSmcHfzy"
              />
            </div>
            <div className="relative z-10 space-y-6 max-w-2xl">
              <h2 className="font-headline-xl text-headline-xl">Stop guessing, start building.</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Join 2,000+ builders using Needstack to validate their next project.
              </p>
              <div className="pt-6">
                <Link href="/feed">
                  <button className="bg-[#6366F1] text-white px-12 py-5 rounded-full font-headline-md text-headline-md hover:scale-105 transition-all shadow-xl cursor-pointer">
                    Get Access Now
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop py-12 w-full mt-auto bg-surface-container-lowest border-t border-white/5">
        <div className="flex flex-col gap-4 mb-8 md:mb-0">
          <div className="font-headline-md text-headline-md font-bold text-white">Needstack AI</div>
          <p className="font-label-md text-label-md text-on-surface-variant max-w-xs">
            © 2024 Needstack AI. Problem Intelligence for tech-forward leaders.
          </p>
        </div>
        <div className="flex flex-wrap gap-8 justify-center">
          <Link className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors opacity-80 hover:opacity-100" href="#">Privacy Policy</Link>
          <Link className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors opacity-80 hover:opacity-100" href="#">Terms of Service</Link>
          <Link className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors opacity-80 hover:opacity-100" href="#">Contact</Link>
          <Link className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors opacity-80 hover:opacity-100" href="#">Docs</Link>
        </div>
      </footer>
    </>
  );
}
