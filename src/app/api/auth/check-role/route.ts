import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null;

    // Try Authorization header first (works right after signIn before cookies propagate)
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const supabaseWithToken = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabaseWithToken.auth.getUser(token);
      userId = user?.id ?? null;
    }

    // Fallback to cookie-based auth
    if (!userId) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    }

    if (!userId) {
      return NextResponse.json({ role: null });
    }

    // Use admin client to bypass RLS
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const role = (profile as any)?.role || null;

    return NextResponse.json({ role });
  } catch {
    return NextResponse.json({ role: null });
  }
}
