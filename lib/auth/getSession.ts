// lib/auth/getSession.ts
import { getServerSession } from "next-auth";
import { adminAuthOptions } from "@/core/auth";
// import { adminAuthOptions } from "@/core/auth/admin";
import { redirect } from "next/navigation";

export async function getSessionUser() {
  const session = await getServerSession(adminAuthOptions);

  return session?.user ?? null;

}
