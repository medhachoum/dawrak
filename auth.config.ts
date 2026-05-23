import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config (no DB / Node-only modules).
 * Used by middleware and re-exported into auth.ts which adds the
 * Credentials provider with Prisma + bcrypt.
 *
 * The `authorized` callback gates every route via middleware.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/dashboard/login",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAuthed = !!auth?.user;
      const isOnDashboard =
        pathname.startsWith("/dashboard") &&
        pathname !== "/dashboard/login" &&
        pathname !== "/dashboard/signup";
      const isOnDashboardApi = pathname.startsWith("/api/dashboard");

      if ((isOnDashboard || isOnDashboardApi) && !isAuthed) {
        // For API routes return 401 JSON instead of redirecting to a login HTML
        // page (which a fetch() caller would see as an opaque success).
        if (isOnDashboardApi) {
          return Response.json(
            { success: false, error: "غير مصرّح" },
            { status: 401 },
          );
        }
        // Page routes: let Auth.js redirect to /dashboard/login.
        return false;
      }

      // If signed in and visiting login/signup, kick to dashboard.
      if (
        isAuthed &&
        (pathname === "/dashboard/login" || pathname === "/dashboard/signup")
      ) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
