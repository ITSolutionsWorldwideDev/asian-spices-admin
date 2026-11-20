// core/auth/core/types.ts

import "next-auth";
import "next-auth/jwt";

export type StoreRole = {
  store_id: string;
  role: string; // admin | manager | editor | customer
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      isPlatformAdmin?: boolean;
      /** true = password already changed; false = must set a new password */
      mustChangePassword?: boolean;
      storeRoles?: StoreRole[];
    };
    expired?: boolean;
  }

  interface User {
    id: string;
    email: string;
    isPlatformAdmin?: boolean;
    mustChangePassword?: boolean;
    storeRoles?: StoreRole[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    email: string;
    isPlatformAdmin?: boolean;
    mustChangePassword?: boolean;
    storeRoles?: StoreRole[];
    lastActiveAt?: number;
  }
}
