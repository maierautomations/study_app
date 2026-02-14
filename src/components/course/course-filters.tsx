"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { CourseCard } from "./course-card";
import type { Course } from "@/types/database";

type CourseWithCounts = Course & {
  documents: { count: number }[];
  quizzes: { count: number }[];
  flashcard_sets: { count: number }[];
};

interface CourseFiltersProps {
  courses: CourseWithCounts[];
}

type SortOption = "updated" | "name" | "created";

export function CourseFilters({ courses }: CourseFiltersProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("updated");

  const filtered = useMemo(() => {
    let result = courses;

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name, "de");
        case "created":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "updated":
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return result;
  }, [courses, search, sort]);

  return (
    <>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kurse suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Zuletzt bearbeitet</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="created">Erstelldatum</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          {search
            ? `Keine Kurse für "${search}" gefunden.`
            : "Keine Kurse vorhanden."}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              documentCount={(course.documents as unknown as { count: number }[])?.[0]?.count ?? 0}
              quizCount={(course.quizzes as unknown as { count: number }[])?.[0]?.count ?? 0}
              flashcardSetCount={(course.flashcard_sets as unknown as { count: number }[])?.[0]?.count ?? 0}
            />
          ))}
        </div>
      )}
    </>
  );
}
