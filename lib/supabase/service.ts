import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Diabaikan kalau dipanggil dari Server Component (read-only)
          }
        },
      },
    }
  );
}

//  This function is used to create a Supabase client for server-side operations, such as seeding the database or perfnunjnjnjorming administrative tasks. It uses the service role key, which has elevated privileges compared to the anon key.