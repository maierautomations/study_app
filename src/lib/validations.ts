import { z } from "zod";

// Reusable field validators
const uuid = z.string().uuid();
const courseId = z.string().uuid("Ungültige Kurs-ID");
const documentId = z.string().uuid("Ungültige Dokument-ID");

// Quiz generation
export const quizGenerateSchema = z.object({
  courseId,
  documentIds: z.array(documentId).min(1, "Mindestens ein Dokument erforderlich"),
  questionCount: z.number().int().min(1).max(50).default(10),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  questionTypes: z
    .array(z.enum(["multiple_choice", "true_false", "free_text"]))
    .optional(),
  title: z.string().optional(),
  focusArea: z.string().max(200).optional(),
});

// Flashcard generation
export const flashcardGenerateSchema = z.object({
  courseId,
  documentIds: z.array(documentId).min(1, "Mindestens ein Dokument erforderlich"),
  count: z.number().int().min(1).max(50).default(20),
  title: z.string().optional(),
  focusArea: z.string().max(200).optional(),
});

// Chat (messages are UIMessage format from AI SDK, validated loosely)
export const chatSchema = z.object({
  messages: z.array(z.any()).min(1, "Mindestens eine Nachricht erforderlich"),
  courseId,
});

// Document process
export const documentProcessSchema = z.object({
  courseId,
});

// Document summarize
export const documentSummarizeSchema = z.object({
  documentId,
});

// Document generate-all
export const documentGenerateAllSchema = z.object({
  courseId,
  documentIds: z.array(documentId).min(1, "Mindestens ein Dokument erforderlich"),
});

// Document glossary
export const documentGlossarySchema = z.object({
  documentId,
});

// Exam generate
export const examGenerateSchema = z.object({
  courseId,
  questionCount: z.number().int().min(5).max(50).default(15),
  timeLimitMinutes: z.number().int().min(10).max(180).default(60),
});

// Exam submit
export const examSubmitSchema = z.object({
  examId: uuid,
  answers: z.array(
    z.object({
      question_id: z.string(),
      selected_answer: z.string(),
    })
  ),
});

// Study plan generate
export const studyPlanGenerateSchema = z.object({
  courseId,
  examDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Ungültiges Datum"),
  dailyMinutes: z.number().int().min(15).max(480).default(60),
});

// Flashcard review
export const flashcardReviewSchema = z.object({
  flashcardId: uuid,
  quality: z.number().int().min(0).max(5),
});

// Gamification
export const gamificationSchema = z.object({
  action: z.enum([
    "quiz_complete",
    "perfect_quiz",
    "flashcard_review",
    "document_upload",
    "chat_message",
    "course_create",
    "pomodoro_complete",
  ]),
  courseId: courseId.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Settings - profile update
export const profileUpdateSchema = z.object({
  displayName: z.string().min(1, "Name darf nicht leer sein").max(100).trim(),
});

// Settings - password change
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Aktuelles Passwort erforderlich"),
  newPassword: z.string().min(6, "Mindestens 6 Zeichen"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

// Helper to parse and return errors
export function parseBody<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.issues[0];
  return {
    success: false,
    error: firstError ? `${firstError.path.join(".")}: ${firstError.message}` : "Ungültige Eingabe",
  };
}
