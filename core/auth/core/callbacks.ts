// core/auth/core/callbacks.ts

import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

export function createCallbacks(maxIdleTime: number) {
  return {
    async jwt({
      token,
      user,
      trigger,
      session,
    }: {
      token: JWT;
      user?: any;
      trigger?: string;
      session?: any;
    }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;

        token.isPlatformAdmin = user.isPlatformAdmin ?? user.is_platform_admin;
        // Explicit boolean: false = still must change temporary password.
        token.mustChangePassword = user.mustChangePassword === true;
        // token.storeRoles = user.storeRoles;
        token.storeRoles = user.storeRoles?.map((role: any) => ({
          store_id: role.store_id,
          role: role.role,
          slug: role.slug, // Map the slug here
        }));
      }

      if (trigger === "update" && typeof session?.mustChangePassword === "boolean") {
        token.mustChangePassword = session.mustChangePassword;
      }

      token.lastActiveAt = (token.lastActiveAt as number) || Date.now();
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      const now = Date.now();
      const lastActive = (token.lastActiveAt as number) || now;
      const expired = now - lastActive > maxIdleTime;

      if (session.user) {
        session.user.id = token.userId as string;
        session.user.email = token.email as string;
        session.user.isPlatformAdmin = !!token.isPlatformAdmin;
        // Only set when present on the JWT (set at login / session update).
        if (typeof token.mustChangePassword === "boolean") {
          session.user.mustChangePassword = token.mustChangePassword;
        }
        session.user.storeRoles = (token.storeRoles as any[]) || [];
      }

      session.expired = Boolean(expired);
      return session;
    },
  };
}

