"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  BrainCircuit,
  Layers,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { CourseFormDialog } from "./course-form-dialog";
import { DeleteCourseDialog } from "./delete-course-dialog";
import type { Course } from "@/types/database";

interface CourseCardProps {
  course: Course;
  documentCount: number;
  quizCount: number;
  flashcardSetCount: number;
}

export function CourseCard({
  course,
  documentCount,
  quizCount,
  flashcardSetCount,
}: CourseCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <Link href={`/dashboard/courses/${course.id}`}>
        <Card className="group relative overflow-hidden transition-colors hover:bg-muted/50">
          <div
            className="absolute left-0 top-0 h-full w-1"
            style={{ backgroundColor: course.color ?? "#3b82f6" }}
          />
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pl-5">
            <CardTitle className="text-lg leading-tight line-clamp-1">
              {course.name}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    setShowEditDialog(true);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Bearbeiten
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="pl-5">
            {course.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {course.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {documentCount}
              </span>
              <span className="flex items-center gap-1">
                <BrainCircuit className="h-3.5 w-3.5" />
                {quizCount}
              </span>
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                {flashcardSetCount}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>

      <CourseFormDialog
        course={course}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
      <DeleteCourseDialog
        course={course}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  );
}
