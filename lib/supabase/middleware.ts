import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // 1. If not logged in and trying to access protected routes
  if (
    !user &&
    (pathname.startsWith("/worker") || pathname.startsWith("/admin"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    // Fetch 'roles' (array) instead of 'role'
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles")
      .eq("id", user.id)
      .single();

    /**
     * THE FIX:
     * We cast to 'unknown' first to break the 'never' or 'null' type inference.
     * This tells TypeScript: "I know what I'm doing, treat this as the Profile Row type."
     */
    const profileRow = profile as unknown as Database["public"]["Tables"]["profiles"]["Row"];
    const roles: string[] = profileRow?.roles || [];

    // 2. AFTER LOGIN REDIRECTION (Auto-redirect from /login if already authenticated)
    if (pathname === "/login" || pathname === "/") {
      if (roles.includes("admin")) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      // If they are an assessor, worker, or agent, send to worker dashboard
      if (roles.some((r) => ["assessor", "worker", "agent"].includes(r))) {
        return NextResponse.redirect(new URL("/worker", request.url));
      }
    }

    // 3. PAGE PROTECTION (URL jumping prevention)

    // Admin page protection: Must have 'admin' in roles array
    if (pathname.startsWith("/admin") && !roles.includes("admin")) {
      // Redirect to worker if they have any other valid role, otherwise login
      const hasOtherRole = roles.some((r) => ["assessor", "worker", "agent"].includes(r));
      return hasOtherRole
        ? NextResponse.redirect(new URL("/worker", request.url))
        : NextResponse.redirect(new URL("/login", request.url));
    }

    // Worker page protection: Allowed for admin, worker, assessor, or agent
    if (pathname.startsWith("/worker")) {
      const allowedRoles = ["admin", "worker", "assessor", "agent"];
      const hasAccess = roles.some((role) => allowedRoles.includes(role));

      if (!hasAccess) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  }

  return supabaseResponse;
}