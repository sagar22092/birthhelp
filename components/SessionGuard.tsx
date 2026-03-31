"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Globally intercepts fetch() calls.
 * If any API response returns 401 (Unauthorized / session expired),
 * it clears auth and redirects to /login.
 */
export default function SessionGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't run on login page itself
    if (pathname === "/login" || pathname === "/register") return;

    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      // If any API call returns 401 → session expired
      if (response.status === 401) {
        const url = typeof args[0] === "string" ? args[0] : args[0].toString();
        // Only react to /api/ routes, not external URLs
        if (url.startsWith("/api/") || url.startsWith(window.location.origin + "/api/")) {
          // Skip the refresh endpoint itself to avoid loop
          if (!url.includes("/api/auth/refresh") && !url.includes("/api/login")) {
            try {
              // Try to refresh the token first
              const refreshRes = await originalFetch("/api/auth/refresh", {
                method: "POST",
                credentials: "include",
              });

              if (refreshRes.ok) {
                // Token refreshed — retry the original request
                return originalFetch(...args);
              }
            } catch {
              // Refresh failed
            }

            // Refresh failed → logout and redirect
            try {
              await originalFetch("/api/logout", { method: "POST", credentials: "include" });
            } catch {
              // ignore logout errors
            }
            router.push(`/login?redirect=${encodeURIComponent(pathname)}&reason=session_expired`);
          }
        }
      }

      return response;
    };

    return () => {
      // Restore original fetch on cleanup
      window.fetch = originalFetch;
    };
  }, [pathname, router]);

  return null;
}
