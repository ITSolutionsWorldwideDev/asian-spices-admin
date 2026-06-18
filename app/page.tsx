// app/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { adminAuthOptions } from "@/core/auth";
// import { adminAuthOptions } from "@/core/auth/admin";

const PLATFORM_SUBDOMAIN = "admin";

export default async function Home() {
  const session = await getServerSession(adminAuthOptions);

  if (!session) redirect("/login");

  const headersList = await headers();
  const subdomain = headersList.get("x-tenant-subdomain");
  const isPlatform = headersList.get("x-platform");

  if (isPlatform === "true") {
    redirect("/platform/dashboard");
  }

  // Platform user
  if (subdomain === PLATFORM_SUBDOMAIN) {
    redirect("/platform/dashboard");
  }

  if (subdomain && subdomain !== PLATFORM_SUBDOMAIN) {
    redirect(`/store/${subdomain}/dashboard`);
  }

  redirect("/login");
}
