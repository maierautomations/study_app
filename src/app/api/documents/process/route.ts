import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractText } from "@/lib/documents/parser";
import { chunkText } from "@/lib/documents/chunker";
import { generateEmbeddings } from "@/lib/ai/embeddings";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { courseId } = await request.json();
  if (!courseId) {
    return NextResponse.json(
      { error: "courseId ist erforderlich" },
      { status: 400 }
    );
  }

  // Verify course ownership
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("user_id", user.id)
    .single();

  if (!course) {
    return NextResponse.json(
      { error: "Kurs nicht gefunden" },
      { status: 404 }
    );
  }

  // Get all documents that need processing
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("course_id", courseId)
    .eq("status", "uploading");

  if (!documents || documents.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let processedCount = 0;

  for (const doc of documents) {
    try {
      // Update status to processing
      await supabase
        .from("documents")
        .update({ status: "processing" })
        .eq("id", doc.id);

      // Download file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("documents")
        .download(doc.file_path);

      if (downloadError || !fileData) {
        throw new Error(`Download fehlgeschlagen: ${downloadError?.message}`);
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());

      // Extract text
      const text = await extractText(
        buffer,
        doc.file_type as "pdf" | "docx" | "txt"
      );

      if (!text.trim()) {
        throw new Error("Kein Text konnte extrahiert werden");
      }

      // Update document with extracted text
      await supabase
        .from("documents")
        .update({ content_text: text })
        .eq("id", doc.id);

      // Chunk text
      const chunks = chunkText(text);

      if (chunks.length === 0) {
        throw new Error("Text konnte nicht in Chunks aufgeteilt werden");
      }

      // Generate embeddings
      const embeddings = await generateEmbeddings(
        chunks.map((c) => c.content)
      );

      // Store chunks with embeddings
      const chunkRows = chunks.map((chunk, i) => ({
        document_id: doc.id,
        content: chunk.content,
        chunk_index: chunk.chunkIndex,
        embedding: JSON.stringify(embeddings[i]),
      }));

      const { error: insertError } = await supabase
        .from("document_chunks")
        .insert(chunkRows);

      if (insertError) {
        throw new Error(`Chunks speichern fehlgeschlagen: ${insertError.message}`);
      }

      // Update status to ready
      await supabase
        .from("documents")
        .update({ status: "ready" })
        .eq("id", doc.id);

      processedCount++;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`Error processing document ${doc.id} (${doc.name}):`, errorMessage);

      // Update status to error
      await supabase
        .from("documents")
        .update({ status: "error" })
        .eq("id", doc.id);
    }
  }

  return NextResponse.json({ processed: processedCount });
}
