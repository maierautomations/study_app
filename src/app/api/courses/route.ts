import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Nicht autorisiert", { status: 401 });
  }

  const { data } = await supabase
    .from("courses")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const courses = (data as unknown as { id: string; name: string }[]) ?? [];

  return Response.json({ courses });
}
