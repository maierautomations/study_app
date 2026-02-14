"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface DeleteDocumentDialogProps {
  documentId: string;
  documentName: string;
  filePath: string;
}

export function DeleteDocumentDialog({
  documentId,
  documentName,
  filePath,
}: DeleteDocumentDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete() {
    setDeleting(true);
    try {
      // Delete chunks first
      await supabase.from("document_chunks").delete().eq("document_id", documentId);

      // Delete document record
      await supabase.from("documents").delete().eq("id", documentId);

      // Delete storage file
      await supabase.storage.from("documents").remove([filePath]);

      toast.success("Dokument gelöscht", {
        description: documentName,
      });
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Löschen fehlgeschlagen");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          title="Dokument löschen"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Dokument löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            &quot;{documentName}&quot; wird dauerhaft gelöscht, einschließlich aller
            zugehörigen Chunks und Embeddings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
