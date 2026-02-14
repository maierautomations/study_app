import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    // Delete user data in dependency order (RLS ensures user can only delete own data)
    // Child tables first, then parent tables
    await supabase.from("flashcard_reviews").delete().eq("user_id", user.id);
    await supabase.from("quiz_attempts").delete().eq("user_id", user.id);
    await supabase.from("study_sessions").delete().eq("user_id", user.id);
    await supabase.from("user_achievements").delete().eq("user_id", user.id);
    await supabase.from("exam_attempts").delete().eq("user_id", user.id);
    await supabase.from("chat_messages").delete().eq("user_id", user.id);

    // Get documents to delete chunks and storage files
    const { data: documentsRaw } = await supabase
      .from("documents")
      .select("id, file_path")
      .eq("user_id", user.id);
    const documents = documentsRaw as unknown as Array<{ id: string; file_path: string }> | null;

    if (documents && documents.length > 0) {
      const docIds = documents.map((d) => d.id);
      await supabase.from("document_chunks").delete().in("document_id", docIds);

      // Delete storage files
      const filePaths = documents.map((d) => d.file_path);
      if (filePaths.length > 0) {
        await supabase.storage.from("documents").remove(filePaths);
      }
    }

    // Get quiz and flashcard IDs for child table cleanup
    const { data: quizzesRaw } = await supabase
      .from("quizzes")
      .select("id")
      .eq("user_id", user.id);
    const quizzes = quizzesRaw as unknown as Array<{ id: string }> | null;
    if (quizzes && quizzes.length > 0) {
      await supabase.from("quiz_questions").delete().in("quiz_id", quizzes.map((q) => q.id));
    }

    const { data: flashcardSetsRaw } = await supabase
      .from("flashcard_sets")
      .select("id")
      .eq("user_id", user.id);
    const flashcardSets = flashcardSetsRaw as unknown as Array<{ id: string }> | null;
    if (flashcardSets && flashcardSets.length > 0) {
      await supabase.from("flashcards").delete().in("set_id", flashcardSets.map((s) => s.id));
    }

    // Delete parent tables
    await supabase.from("documents").delete().eq("user_id", user.id);
    await supabase.from("quizzes").delete().eq("user_id", user.id);
    await supabase.from("flashcard_sets").delete().eq("user_id", user.id);
    await supabase.from("courses").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Konto konnte nicht gelöscht werden" },
      { status: 500 }
    );
  }
}
