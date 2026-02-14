"use client";

import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor } from "lucide-react";

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "light", label: "Hell", icon: Sun },
    { value: "dark", label: "Dunkel", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Erscheinungsbild</CardTitle>
        <CardDescription>Wähle dein bevorzugtes Farbschema.</CardDescription>
      </CardHeader>
      <CardContent>
        <Label className="mb-3 block">Design</Label>
        <div className="flex gap-2">
          {options.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={theme === value ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme(value)}
              className="flex-1"
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
