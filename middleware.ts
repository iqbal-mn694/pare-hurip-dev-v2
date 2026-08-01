import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map((c) => ({
            name: c.name,
            value: c.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login") {
    return response;
  }

  // Validasi JWT + refresh token sebelum respons dibuat; bila token
  // kedaluwarsa, hasil refresh otomatis ditulis sebagai cookie baru di
  // header Set-Cookie, sehingga halaman admin selalu dirender dengan
  // session yang valid (mencegah lompatan login saat refresh).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
