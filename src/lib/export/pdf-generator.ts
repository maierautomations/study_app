import PDFDocument from "pdfkit";

type QuizQuestion = {
  question: string;
  type: "multiple_choice" | "true_false" | "free_text";
  options?: string[];
  correct_answer: string;
  explanation?: string;
};

type Flashcard = {
  front: string;
  back: string;
};

type SummaryData = {
  title: string;
  summary: string;
  keyPoints: string[];
  keywords: string[];
};

function createDoc(): typeof PDFDocument.prototype {
  return new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: { Producer: "StudyApp", Creator: "StudyApp" },
  });
}

function collectBuffer(
  doc: typeof PDFDocument.prototype
): Promise<Uint8Array> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
  });
}

function addHeader(doc: typeof PDFDocument.prototype, title: string, subtitle?: string) {
  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .text(title, { align: "center" });
  if (subtitle) {
    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#666666")
      .text(subtitle, { align: "center" })
      .fillColor("#000000");
  }
  doc.moveDown(1.5);
}

function addFooter(doc: typeof PDFDocument.prototype) {
  const date = new Date().toLocaleDateString("de-DE");
  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("#999999")
    .text(`Erstellt mit StudyApp am ${date}`, 50, doc.page.height - 40, {
      align: "center",
      width: doc.page.width - 100,
    })
    .fillColor("#000000");
}

export async function generateQuizPDF(
  courseName: string,
  quizTitle: string,
  questions: QuizQuestion[]
): Promise<Uint8Array> {
  const doc = createDoc();
  const bufferPromise = collectBuffer(doc);

  addHeader(doc, quizTitle, `Kurs: ${courseName}`);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    // Check if we need a new page (rough estimate)
    if (doc.y > doc.page.height - 150) {
      doc.addPage();
    }

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(`Frage ${i + 1}: `, { continued: true })
      .font("Helvetica")
      .text(q.question);

    if (q.type === "multiple_choice" && q.options) {
      doc.moveDown(0.3);
      const letters = ["A", "B", "C", "D"];
      for (let j = 0; j < q.options.length; j++) {
        doc
          .fontSize(11)
          .text(`   ${letters[j]}) ${q.options[j]}`);
      }
    } else if (q.type === "true_false") {
      doc.moveDown(0.3);
      doc.fontSize(11).text("   O Wahr     O Falsch");
    } else {
      doc.moveDown(0.3);
      doc
        .fontSize(11)
        .fillColor("#999999")
        .text("   [Freitext-Antwort]")
        .fillColor("#000000");
    }

    doc.moveDown(1);
  }

  // Answer key on new page
  doc.addPage();
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("Antworten", { align: "center" });
  doc.moveDown(1);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    if (doc.y > doc.page.height - 100) {
      doc.addPage();
    }

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(`Frage ${i + 1}: `, { continued: true })
      .font("Helvetica")
      .text(q.correct_answer);

    if (q.explanation) {
      doc
        .fontSize(10)
        .fillColor("#555555")
        .text(`   ${q.explanation}`)
        .fillColor("#000000");
    }
    doc.moveDown(0.5);
  }

  addFooter(doc);
  doc.end();
  return bufferPromise;
}

export async function generateFlashcardsPDF(
  courseName: string,
  setName: string,
  flashcards: Flashcard[]
): Promise<Uint8Array> {
  const doc = createDoc();
  const bufferPromise = collectBuffer(doc);

  addHeader(doc, setName, `Kurs: ${courseName}`);

  for (let i = 0; i < flashcards.length; i++) {
    const fc = flashcards[i];

    if (doc.y > doc.page.height - 130) {
      doc.addPage();
    }

    // Card number
    doc
      .fontSize(9)
      .fillColor("#999999")
      .text(`Karte ${i + 1} von ${flashcards.length}`)
      .fillColor("#000000");

    // Front
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Vorderseite:")
      .font("Helvetica")
      .fontSize(11)
      .text(fc.front);

    doc.moveDown(0.3);

    // Back
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Antwort:")
      .font("Helvetica")
      .fontSize(11)
      .text(fc.back);

    doc.moveDown(0.5);

    // Separator line
    doc
      .strokeColor("#dddddd")
      .lineWidth(0.5)
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke()
      .strokeColor("#000000");

    doc.moveDown(0.5);
  }

  addFooter(doc);
  doc.end();
  return bufferPromise;
}

export async function generateSummaryPDF(
  courseName: string,
  documentName: string,
  summary: SummaryData
): Promise<Uint8Array> {
  const doc = createDoc();
  const bufferPromise = collectBuffer(doc);

  addHeader(doc, summary.title || `Zusammenfassung: ${documentName}`, `Kurs: ${courseName}`);

  // Key points
  if (summary.keyPoints && summary.keyPoints.length > 0) {
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Kernaussagen");
    doc.moveDown(0.3);

    for (const point of summary.keyPoints) {
      doc
        .fontSize(11)
        .font("Helvetica")
        .text(`  \u2022 ${point}`);
      doc.moveDown(0.2);
    }
    doc.moveDown(0.5);
  }

  // Summary text
  if (summary.summary) {
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Zusammenfassung");
    doc.moveDown(0.3);
    doc
      .fontSize(11)
      .font("Helvetica")
      .text(summary.summary, { lineGap: 3 });
    doc.moveDown(0.5);
  }

  // Keywords
  if (summary.keywords && summary.keywords.length > 0) {
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Schlagworte");
    doc.moveDown(0.3);
    doc
      .fontSize(11)
      .font("Helvetica")
      .text(summary.keywords.join(", "));
  }

  addFooter(doc);
  doc.end();
  return bufferPromise;
}
