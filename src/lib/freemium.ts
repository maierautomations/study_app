import { createClient } from "@/lib/supabase/server";

const TIER_LIMITS = {
  free: 20,
  premium: Infinity,
} as const;

const RESET_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type FreemiumCheckResult = {
  allowed: boolean;
  used: number;
  limit: number;
  tier: "free" | "premium";
};

export async function checkFreemiumLimit(
  userId: string
): Promise<FreemiumCheckResult> {
  const supabase = await createClient();

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("tier, ai_generations_used, ai_generations_reset_at")
    .eq("id", userId)
    .single();
  const profile = profileRaw as unknown as { tier: "free" | "premium"; ai_generations_used: number; ai_generations_reset_at: string } | null;

  if (!profile) {
    return { allowed: false, used: 0, limit: 0, tier: "free" };
  }

  const tier = profile.tier;
  const limit = TIER_LIMITS[tier];

  // Auto-reset if reset date is more than 30 days ago
  const resetAt = new Date(profile.ai_generations_reset_at);
  const now = new Date();
  if (now.getTime() - resetAt.getTime() > RESET_INTERVAL_MS) {
    await supabase
      .from("profiles")
      .update({
        ai_generations_used: 0,
        ai_generations_reset_at: now.toISOString(),
      } as never)
      .eq("id", userId);

    return { allowed: true, used: 0, limit: limit === Infinity ? -1 : limit, tier };
  }

  const used = profile.ai_generations_used;
  const allowed = used < limit;

  return {
    allowed,
    used,
    limit: limit === Infinity ? -1 : limit, // -1 means unlimited
    tier,
  };
}

export async function incrementUsage(userId: string): Promise<void> {
  const supabase = await createClient();

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("ai_generations_used")
    .eq("id", userId)
    .single();
  const profile = profileRaw as unknown as { ai_generations_used: number } | null;

  if (profile) {
    await supabase
      .from("profiles")
      .update({
        ai_generations_used: profile.ai_generations_used + 1,
      } as never)
      .eq("id", userId);
  }
}

export function getFreemiumErrorMessage(used: number, limit: number): string {
  if (limit === -1) return "";
  return `Du hast ${used} von ${limit} KI-Generierungen diesen Monat verbraucht. Upgrade auf Premium für unbegrenzte Nutzung.`;
}
