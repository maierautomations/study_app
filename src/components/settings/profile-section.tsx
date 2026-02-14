"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface ProfileSectionProps {
  displayName: string;
  email: string;
  tier: "free" | "premium";
}

export function ProfileSection({ displayName, email, tier }: ProfileSectionProps) {
  const [name, setName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name darf nicht leer sein");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ display_name: trimmed } as never)
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profil aktualisiert");
    } catch {
      toast.error("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
        <CardDescription>Dein öffentlicher Name und deine E-Mail-Adresse.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Anzeigename</Label>
          <div className="flex gap-2">
            <Input
              id="displayName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dein Name"
            />
            <Button onClick={handleSave} disabled={saving || name.trim() === displayName}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>E-Mail</Label>
          <div className="flex items-center gap-2">
            <Input value={email} disabled className="bg-muted" />
            <Badge variant={tier === "premium" ? "default" : "secondary"}>
              {tier === "premium" ? "Pro" : "Free"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
