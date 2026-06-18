// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";
import { getToken } from "next-auth/jwt";

// middleware.ts
export default withAuth(
  async function middleware(req: NextRequest) {
    const token = await getToken({ req });
    const { pathname } = req.nextUrl;

    if (
      pathname.startsWith("/_next") ||
      // pathname.startsWith("/api") ||
      pathname.includes(".") // e.g. favicon.ico, logo.png
    ) {
      return NextResponse.next();
    }

    // 2. Define the "protected" prefixes
    const isStorePath = pathname.startsWith("/store");
    const isPlatformPath = pathname.startsWith("/platform");
    const isAuthPath = pathname.startsWith("/login");
    const isApi = pathname.startsWith("/api");

    if (isApi) {
      const referer = req.headers.get("referer");
      const requestHeaders = new Headers(req.headers);
      
      // If the API is called from a store page, grab the slug from referer
      if (referer && referer.includes("/store/")) {
        const url = new URL(referer);
        const slug = url.pathname.split("/")[2];
        requestHeaders.set("x-tenant-subdomain", slug);
      }

      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }

    // 3. Handle Root and Unprefixed Paths
    if (!isStorePath && !isPlatformPath && !isAuthPath && pathname !== "/login") {
      // CASE: Super Admin
      if (token?.isPlatformAdmin) {
        const destination = pathname === "/" ? "/dashboard" : pathname;
        return NextResponse.redirect(
          new URL(`/platform${destination}`, req.url),
        );
      }

      // CASE: Store User
      const storeRoles = token?.storeRoles as any[];

      if (storeRoles && storeRoles.length > 0) {
        
        const firstStore = storeRoles[0]?.slug || storeRoles[0].store_id;
        const destination = pathname === "/" ? "/dashboard" : pathname;

        return NextResponse.redirect(
          new URL(`/store/${firstStore}${destination}`, req.url),
        );
      }
    }

    if (isStorePath) {
      const slug = pathname.split("/")[2];
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-tenant-subdomain", slug);
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }

    // 4. Security Check: Prevent Store Users from accessing /platform
    if (isPlatformPath && !token?.isPlatformAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  },
);

// export const config = {
//   matcher: ["/", "/platform/:path*", "/store/:path*"],
// };



    /* if (pathname === "/") {
      console.log("middleware token ====", token);
      // If Super Admin, go to platform
      if (token?.isPlatformAdmin) {
        return NextResponse.redirect(new URL("/platform/dashboard", req.url));
      }

      // If Store Admin, go to their first available store
      if (token?.storeRoles && token.storeRoles.length > 0) {
        const firstStore = token.storeRoles[0].store_id; // or slug if available in token
        return NextResponse.redirect(
          new URL(`/store/${firstStore}/dashboard`, req.url),
        );
      }

      return NextResponse.redirect(new URL("/login", req.url));
    } */
/*

const PLATFORM_SUBDOMAIN = "admin";

function getHostname(req: NextRequest) {
  return req.headers.get("host") || "";
}

function getSubdomain(hostname: string) {
  const host = hostname.split(":")[0];

  // handle local subdomains
  if (host.endsWith("localhost") || host.endsWith("lvh.me")) {
    const parts = host.split(".");
    if (parts.length > 1) return parts[0]; // "nike" in nike.lvh.me
    return "";
  }

  // disable subdomain tenancy for vercel.app
  if (host.endsWith("vercel.app")) {
    return "";
  }

  const parts = host.split(".");
  if (parts.length <= 2) return ""; // e.g., domain.com
  return parts[0];
}

function getTenantFromPath(pathname: string) {
  const parts = pathname.split("/");

  if (parts[1] === "store" && parts[2]) {
    return parts[2];
  }

  return "";
}

export default withAuth(
  function middleware(req: NextRequest) {
    const hostname = getHostname(req);
    const pathname = req.nextUrl.pathname;

    const subdomain = getSubdomain(hostname);
    const pathTenant = getTenantFromPath(pathname);

    let tenant = "";
    let isPlatform = false;

    // -----------------------------
    // SUBDOMAIN MODE
    // -----------------------------
    if (subdomain) {
      if (subdomain === PLATFORM_SUBDOMAIN) {
        isPlatform = true;
      } else {
        tenant = subdomain;
      }
    }

    // -----------------------------
    // PATH MODE (vercel.app)
    // -----------------------------
    // if (!subdomain && pathTenant) {
    //   tenant = pathTenant;
    // }
    if (!tenant && pathTenant) {
      tenant = pathTenant;
    }

    const url = req.nextUrl.clone();

    // -----------------------------
    // PLATFORM ROUTING
    // -----------------------------
    if (isPlatform) {
      if (!pathname.startsWith("/platform")) {
        url.pathname = `/platform${pathname}`;
        return NextResponse.rewrite(url);
      }
    }

    // -----------------------------
    // STORE ROUTING
    // -----------------------------

    console.log('tenant ==== ',tenant);
    console.log('subdomain ==== ',subdomain);
    console.log('pathname ==== ',pathname);

    // if (tenant && subdomain && !pathname.startsWith("/store")) {
    //   url.pathname = `/store/${tenant}${pathname === "/" ? "" : pathname}`;
    //   return NextResponse.rewrite(url);
    // }

    // Store routing
if (tenant && !pathname.startsWith(`/store/${tenant}`)) {
  url.pathname = `/store/${tenant}${pathname}`;
  return NextResponse.rewrite(url);
}

    // -----------------------------
    // PASS TENANT HEADER
    // -----------------------------

    const requestHeaders = new Headers(req.headers);

    requestHeaders.set("x-tenant-subdomain", tenant);
    requestHeaders.set("x-platform", String(isPlatform));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  },
  {
    callbacks: {
      async authorized({ token, req }) {
        const pathname = req.nextUrl.pathname;

        if (!token) return false;

        if (pathname.startsWith("/platform")) {
          return token.isPlatformAdmin === true;
        }

        return true;
      },
    },
    pages: {
      signIn: "/login",
    },
  },
);
 */
export const config = {
  matcher: [
    "/((?!_next|static|_next/image|assets|favicon.ico|favicon.png|robots.txt|.*\\.svg$|login).*)",
    "/platform/:path*",
    "/store/:path*",
    "/api/:path*",
  ],
};
