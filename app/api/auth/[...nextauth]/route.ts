// apps/admin/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
// import { adminAuthOptions } from "@/core/auth/admin";
import { adminAuthOptions } from "@/core/auth";

const handler = NextAuth(adminAuthOptions);
export { handler as GET, handler as POST };
