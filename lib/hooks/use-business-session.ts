"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut as nextSignOut, useSession } from "next-auth/react";

const STORAGE_KEY = "dawrak:businessId";

interface BusinessSummary {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  primaryColor: string;
  phone: string | null;
  timezone: string;
  role: string;
}

/**
 * Resolves the active business for the signed-in user.
 *
 * - Reads the Auth.js session and pulls the user's businesses from
 *   /api/dashboard/businesses (which is now authz-scoped).
 * - Defaults the active business to the first one.
 * - Persists the user's last-selected business in localStorage so
 *   accounts with multiple businesses keep their choice between visits.
 */
export function useBusinessSession() {
  const { data: session, status } = useSession();
  const [businessId, setBusinessIdState] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") {
      setHydrated(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dashboard/businesses", {
          credentials: "same-origin",
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error("failed");
        const list: BusinessSummary[] = json.data.businesses;
        if (cancelled) return;

        let stored: string | null = null;
        try {
          stored = window.localStorage.getItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }

        const active =
          (stored && list.find((b) => b.id === stored)?.id) ||
          list[0]?.id ||
          null;

        setBusinesses(list);
        setBusinessIdState(active);
      } catch {
        if (!cancelled) {
          setBusinesses([]);
          setBusinessIdState(null);
        }
      } finally {
        if (!cancelled) {
          setHydrated(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.id]);

  const setBusinessId = useCallback((id: string | null) => {
    try {
      if (id) window.localStorage.setItem(STORAGE_KEY, id);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setBusinessIdState(id);
  }, []);

  const signOut = useCallback(async () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setBusinessIdState(null);
    setBusinesses([]);
    await nextSignOut({ callbackUrl: "/dashboard/login" });
  }, []);

  return {
    businessId,
    businesses,
    setBusinessId,
    signOut,
    hydrated,
    loading,
    user: session?.user ?? null,
    isAuthenticated: status === "authenticated",
  };
}
