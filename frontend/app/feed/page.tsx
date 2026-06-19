"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";

function FeedRedirectContent() {
  const router = useRouter();

  useEffect(() => {
    const auth = localStorage.getItem("is_authenticated");
    const role = localStorage.getItem("user_role");

    if (auth === "true") {
      if (role === "developer") {
        router.push("/developer/dashboard");
      } else {
        router.push("/user/dashboard");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center text-white">
      <span className="material-symbols-outlined text-primary text-5xl animate-spin mb-4">progress_activity</span>
      <p className="text-on-surface-variant font-label-md">Routing to your feed...</p>
    </div>
  );
}

export default function FeedGatewayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050507] flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
      </div>
    }>
      <FeedRedirectContent />
    </Suspense>
  );
}
