import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
const PUBLICAS = ["/login"];
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser(); // valida o JWT no servidor
  const { pathname } = request.nextUrl;
  const publica = PUBLICAS.some((p) => pathname.startsWith(p));
  if (!user && !publica) { const u = request.nextUrl.clone(); u.pathname = "/login"; u.search = `?next=${encodeURIComponent(pathname)}`; return NextResponse.redirect(u); }
  if (user && pathname === "/login") { const u = request.nextUrl.clone(); u.pathname = "/visao-geral"; u.search = ""; return NextResponse.redirect(u); }
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"] };
