"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function SecuritySection() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function handleChangePassword() {
    if (newPassword.length < 6) {
      toast.error("Passwort muss mindestens 6 Zeichen haben");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwörter stimmen nicht überein");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast.success("Passwort geändert");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error("Fehler beim Ändern des Passworts", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Konto-Sicherheit</CardTitle>
        <CardDescription>Ändere dein Passwort.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newPassword">Neues Passwort</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mindestens 6 Zeichen"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Passwort wiederholen"
          />
        </div>
        <Button
          onClick={handleChangePassword}
          disabled={saving || !newPassword || !confirmPassword}
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Lock className="mr-2 h-4 w-4" />
          )}
          Passwort ändern
        </Button>
      </CardContent>
    </Card>
  );
}
