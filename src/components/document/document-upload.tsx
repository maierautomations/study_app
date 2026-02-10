"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const ACCEPTED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

interface FileUploadState {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
}

interface DocumentUploadProps {
  courseId: string;
}

export function DocumentUpload({ courseId }: DocumentUploadProps) {
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES[file.type]) {
      return `Dateityp "${file.type || "unbekannt"}" wird nicht unterstützt. Erlaubt: PDF, DOCX, TXT`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Datei ist zu groß (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum: 20 MB`;
    }
    return null;
  }

  function addFiles(newFiles: FileList | File[]) {
    const fileArray = Array.from(newFiles);
    const newStates: FileUploadState[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        continue;
      }
      if (files.some((f) => f.file.name === file.name && f.status !== "error")) {
        toast.error(`${file.name} wurde bereits hinzugefügt`);
        continue;
      }
      newStates.push({ file, status: "pending", progress: 0 });
    }

    if (newStates.length > 0) {
      setFiles((prev) => [...prev, ...newStates]);
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [files]
  );

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadAll() {
    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Nicht angemeldet");
      setIsUploading(false);
      return;
    }

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending") continue;

      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: "uploading", progress: 10 } : f
        )
      );

      const file = files[i].file;
      const fileType = ACCEPTED_TYPES[file.type] as "pdf" | "docx" | "txt";
      const filePath = `${user.id}/${Date.now()}_${file.name}`;

      try {
        // Upload to Supabase Storage
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, progress: 30 } : f
          )
        );

        const { error: storageError } = await supabase.storage
          .from("documents")
          .upload(filePath, file);

        if (storageError) throw storageError;

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, progress: 70 } : f
          )
        );

        // Create document record
        const { error: dbError } = await supabase.from("documents").insert({
          course_id: courseId,
          user_id: user.id,
          name: file.name,
          file_path: filePath,
          file_type: fileType,
          file_size: file.size,
          status: "uploading",
        });

        if (dbError) throw dbError;

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "done", progress: 100 } : f
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unbekannter Fehler";
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "error", error: message } : f
          )
        );
        toast.error(`Fehler bei ${file.name}`, { description: message });
      }
    }

    setIsUploading(false);

    const successCount = files.filter((f) => f.status === "done").length;
    if (successCount > 0) {
      toast.success(
        `${successCount} ${successCount === 1 ? "Dokument" : "Dokumente"} hochgeladen`
      );
      // Trigger processing for uploaded documents
      try {
        await fetch(`/api/documents/process`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId }),
        });
      } catch {
        // Processing will happen in the background
      }
      router.refresh();
    }
  }

  const pendingCount = files.filter((f) => f.status === "pending").length;

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium mb-1">
          Dateien hierher ziehen oder klicken
        </p>
        <p className="text-xs text-muted-foreground">
          PDF, DOCX oder TXT &middot; Max. 20 MB pro Datei
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <Card key={`${f.file.name}-${i}`}>
              <CardContent className="flex items-center gap-3 py-2.5">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(f.file.size / 1024).toFixed(0)} KB
                  </p>
                  {f.status === "uploading" && (
                    <Progress value={f.progress} className="mt-1 h-1" />
                  )}
                  {f.error && (
                    <p className="text-xs text-destructive mt-1">{f.error}</p>
                  )}
                </div>
                {f.status === "done" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                ) : f.status === "error" ? (
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                ) : f.status === "pending" ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => removeFile(i)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}

          {pendingCount > 0 && (
            <Button onClick={uploadAll} disabled={isUploading} className="w-full">
              {isUploading
                ? "Wird hochgeladen..."
                : `${pendingCount} ${pendingCount === 1 ? "Datei" : "Dateien"} hochladen`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
