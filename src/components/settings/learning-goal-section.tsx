"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Target } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const PRESETS = [
  { label: "Locker", minutes: 10, description: "10 Min./Tag" },
  { label: "Normal", minutes: 20, description: "20 Min./Tag" },
  { label: "Intensiv", minutes: 40, description: "40 Min./Tag" },
] as const;

interface LearningGoalSectionProps {
  currentGoal: number;
}

export function LearningGoalSection({ currentGoal }: LearningGoalSectionProps) {
  const [goal, setGoal] = useState(currentGoal);
  const [customValue, setCustomValue] = useState(
    PRESETS.some((p) => p.minutes === currentGoal) ? "" : String(currentGoal)
  );
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const isCustom = !PRESETS.some((p) => p.minutes === goal);

  async function handleSave() {
    if (goal < 5 || goal > 480) {
      toast.error("Ziel muss zwischen 5 und 480 Minuten liegen");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ daily_goal_minutes: goal } as never)
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Lernziel aktualisiert");
    } catch {
      toast.error("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Tägliches Lernziel
        </CardTitle>
        <CardDescription>
          Setze dir ein tägliches Lernziel und erhalte +25 XP Bonus bei Erreichen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.minutes}
              variant={goal === preset.minutes ? "default" : "outline"}
              className="flex flex-col h-auto py-3"
              onClick={() => {
                setGoal(preset.minutes);
                setCustomValue("");
              }}
            >
              <span className="font-medium">{preset.label}</span>
              <span className="text-xs opacity-80">{preset.description}</span>
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="customGoal">Eigenes Ziel (Minuten)</Label>
          <div className="flex gap-2">
            <Input
              id="customGoal"
              type="number"
              min={5}
              max={480}
              placeholder="z.B. 30"
              value={customValue}
              onChange={(e) => {
                const val = e.target.value;
                setCustomValue(val);
                const num = parseInt(val, 10);
                if (!isNaN(num) && num >= 5 && num <= 480) {
                  setGoal(num);
                }
              }}
              className={isCustom ? "border-primary" : ""}
            />
            <Button onClick={handleSave} disabled={saving || goal === currentGoal}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Aktuelles Ziel: <span className="font-medium">{goal} Minuten/Tag</span>
        </p>
      </CardContent>
    </Card>
  );
}
