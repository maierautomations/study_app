"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  ChevronUp,
  Trophy,
  Layers,
  Flame,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { LEVEL_THRESHOLDS } from "@/lib/gamification";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Meine Kurse",
    href: "/dashboard/courses",
    icon: GraduationCap,
  },
];

const secondaryNavItems = [
  {
    title: "Wiederholungen",
    href: "/dashboard/reviews",
    icon: Layers,
  },
  {
    title: "Lernplan",
    href: "/dashboard/study-plan",
    icon: CalendarDays,
  },
  {
    title: "Erfolge",
    href: "/dashboard/achievements",
    icon: Trophy,
  },
];

interface AppSidebarProps {
  user: {
    email?: string;
    displayName?: string;
  };
  gamification?: {
    xp: number;
    level: number;
    currentStreak: number;
    aiGenerationsUsed: number;
    tier: "free" | "premium";
  };
}

export function AppSidebar({ user, gamification }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const initials = user.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.slice(0, 2).toUpperCase() ?? "?";

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Abgemeldet");
    router.push("/login");
    router.refresh();
  }

  // XP progress calculation
  const xp = gamification?.xp ?? 0;
  const level = gamification?.level ?? 1;
  const currentLevelXp = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextLevelXp = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 5000;
  const xpProgress = Math.min(Math.round(((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100), 100);

  const aiUsed = gamification?.aiGenerationsUsed ?? 0;
  const aiLimit = gamification?.tier === "premium" ? Infinity : 20;
  const aiRemaining = gamification?.tier === "premium" ? "\u221E" : String(20 - aiUsed);

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <BookOpen className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">StudyApp</span>
                  <span className="text-xs text-muted-foreground">
                    KI-Lernassistent
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* XP + Streak compact display */}
        {gamification && (
          <div className="px-3 pb-2 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">Stufe {level}</span>
              <div className="flex items-center gap-2">
                <Flame
                  className={`h-3.5 w-3.5 ${(gamification.currentStreak ?? 0) > 0 ? "text-orange-500" : "text-muted-foreground"}`}
                />
                <span className={(gamification.currentStreak ?? 0) > 0 ? "font-medium" : "text-muted-foreground"}>
                  {gamification.currentStreak ?? 0}
                </span>
              </div>
            </div>
            <Progress value={xpProgress} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground">
              {xp} / {nextLevelXp} XP
            </p>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                  >
                    <a href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Lernen</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                  >
                    <a href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* AI Usage meter */}
        {gamification && (
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              <span>KI: {aiRemaining} übrig</span>
            </div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold flex items-center gap-1.5">
                      {user.displayName || "Benutzer"}
                      {gamification && (
                        <Badge
                          variant={gamification.tier === "premium" ? "default" : "secondary"}
                          className="text-[10px] px-1.5 py-0 h-4"
                        >
                          {gamification.tier === "premium" ? "Pro" : "Free"}
                        </Badge>
                      )}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <a href="/dashboard/settings">
                    <Settings className="mr-2 size-4" />
                    Einstellungen
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 size-4" />
                  Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
