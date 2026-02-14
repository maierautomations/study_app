export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          tier: "free" | "premium";
          ai_generations_used: number;
          ai_generations_reset_at: string;
          xp: number;
          level: number;
          current_streak: number;
          longest_streak: number;
          last_study_date: string | null;
          onboarding_completed: boolean;
          daily_goal_minutes: number;
          daily_goal_progress: number;
          daily_goal_date: string | null;
          streak_freezes_remaining: number;
          streak_freezes_reset_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          tier?: "free" | "premium";
          ai_generations_used?: number;
          ai_generations_reset_at?: string;
          xp?: number;
          level?: number;
          current_streak?: number;
          longest_streak?: number;
          last_study_date?: string | null;
          onboarding_completed?: boolean;
          daily_goal_minutes?: number;
          daily_goal_progress?: number;
          daily_goal_date?: string | null;
          streak_freezes_remaining?: number;
          streak_freezes_reset_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          tier?: "free" | "premium";
          ai_generations_used?: number;
          ai_generations_reset_at?: string;
          xp?: number;
          level?: number;
          current_streak?: number;
          longest_streak?: number;
          last_study_date?: string | null;
          onboarding_completed?: boolean;
          daily_goal_minutes?: number;
          daily_goal_progress?: number;
          daily_goal_date?: string | null;
          streak_freezes_remaining?: number;
          streak_freezes_reset_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          course_id: string;
          user_id: string;
          name: string;
          file_path: string;
          file_type: "pdf" | "docx" | "pptx" | "txt";
          file_size: number;
          status: "uploading" | "processing" | "ready" | "error";
          content_text: string | null;
          summary: string | null;
          glossary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          user_id: string;
          name: string;
          file_path: string;
          file_type: "pdf" | "docx" | "pptx" | "txt";
          file_size: number;
          status?: "uploading" | "processing" | "ready" | "error";
          content_text?: string | null;
          summary?: string | null;
          glossary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          user_id?: string;
          name?: string;
          file_path?: string;
          file_type?: "pdf" | "docx" | "pptx" | "txt";
          file_size?: number;
          status?: "uploading" | "processing" | "ready" | "error";
          content_text?: string | null;
          summary?: string | null;
          glossary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      document_chunks: {
        Row: {
          id: string;
          document_id: string;
          content: string;
          chunk_index: number;
          embedding: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          content: string;
          chunk_index: number;
          embedding?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          content?: string;
          chunk_index?: number;
          embedding?: string | null;
          created_at?: string;
        };
      };
      quizzes: {
        Row: {
          id: string;
          course_id: string;
          user_id: string;
          title: string;
          document_ids: string[];
          difficulty: "easy" | "medium" | "hard";
          question_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          user_id: string;
          title: string;
          document_ids: string[];
          difficulty: "easy" | "medium" | "hard";
          question_count: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          user_id?: string;
          title?: string;
          document_ids?: string[];
          difficulty?: "easy" | "medium" | "hard";
          question_count?: number;
          created_at?: string;
        };
      };
      quiz_questions: {
        Row: {
          id: string;
          quiz_id: string;
          question_text: string;
          question_type: "multiple_choice" | "true_false" | "free_text";
          options: Json;
          correct_answer: string;
          explanation: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question_text: string;
          question_type: "multiple_choice" | "true_false" | "free_text";
          options: Json;
          correct_answer: string;
          explanation: string;
          order_index: number;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          question_text?: string;
          question_type?: "multiple_choice" | "true_false" | "free_text";
          options?: Json;
          correct_answer?: string;
          explanation?: string;
          order_index?: number;
        };
      };
      quiz_attempts: {
        Row: {
          id: string;
          quiz_id: string;
          user_id: string;
          answers: Json;
          score: number;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          user_id: string;
          answers: Json;
          score: number;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          user_id?: string;
          answers?: Json;
          score?: number;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      flashcard_sets: {
        Row: {
          id: string;
          course_id: string;
          user_id: string;
          title: string;
          document_ids: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          user_id: string;
          title: string;
          document_ids: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          user_id?: string;
          title?: string;
          document_ids?: string[];
          created_at?: string;
        };
      };
      flashcards: {
        Row: {
          id: string;
          set_id: string;
          front: string;
          back: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          set_id: string;
          front: string;
          back: string;
          order_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          set_id?: string;
          front?: string;
          back?: string;
          order_index?: number;
          created_at?: string;
        };
      };
      flashcard_reviews: {
        Row: {
          id: string;
          flashcard_id: string;
          user_id: string;
          quality: number;
          interval: number;
          ease_factor: number;
          next_review_at: string;
          reviewed_at: string;
        };
        Insert: {
          id?: string;
          flashcard_id: string;
          user_id: string;
          quality: number;
          interval: number;
          ease_factor: number;
          next_review_at: string;
          reviewed_at?: string;
        };
        Update: {
          id?: string;
          flashcard_id?: string;
          user_id?: string;
          quality?: number;
          interval?: number;
          ease_factor?: number;
          next_review_at?: string;
          reviewed_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          course_id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          source_chunks: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          source_chunks?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          user_id?: string;
          role?: "user" | "assistant";
          content?: string;
          source_chunks?: string[] | null;
          created_at?: string;
        };
      };
      achievements: {
        Row: {
          id: string;
          key: string;
          title_de: string;
          description_de: string;
          icon: string;
          xp_reward: number;
          category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          title_de: string;
          description_de: string;
          icon?: string;
          xp_reward?: number;
          category?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          title_de?: string;
          description_de?: string;
          icon?: string;
          xp_reward?: number;
          category?: string;
          created_at?: string;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          unlocked_at?: string;
          created_at?: string;
        };
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          activity_type: string;
          course_id: string | null;
          metadata: Json;
          xp_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: string;
          course_id?: string | null;
          metadata?: Json;
          xp_earned?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: string;
          course_id?: string | null;
          metadata?: Json;
          xp_earned?: number;
          created_at?: string;
        };
      };
      exam_attempts: {
        Row: {
          id: string;
          course_id: string;
          user_id: string;
          title: string;
          document_ids: string[];
          time_limit_minutes: number;
          questions: Json;
          answers: Json;
          score: number;
          grade: string;
          total_points: number;
          earned_points: number;
          started_at: string;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          user_id: string;
          title: string;
          document_ids: string[];
          time_limit_minutes: number;
          questions: Json;
          answers?: Json;
          score?: number;
          grade?: string;
          total_points?: number;
          earned_points?: number;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          user_id?: string;
          title?: string;
          document_ids?: string[];
          time_limit_minutes?: number;
          questions?: Json;
          answers?: Json;
          score?: number;
          grade?: string;
          total_points?: number;
          earned_points?: number;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_document_chunks: {
        Args: {
          query_embedding: string;
          match_count: number;
          filter_document_ids?: string[];
        };
        Returns: {
          id: string;
          document_id: string;
          content: string;
          chunk_index: number;
          similarity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Course = Database["public"]["Tables"]["courses"]["Row"];
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentChunk = Database["public"]["Tables"]["document_chunks"]["Row"];
export type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
export type QuizQuestion = Database["public"]["Tables"]["quiz_questions"]["Row"];
export type QuizAttempt = Database["public"]["Tables"]["quiz_attempts"]["Row"];
export type FlashcardSet = Database["public"]["Tables"]["flashcard_sets"]["Row"];
export type Flashcard = Database["public"]["Tables"]["flashcards"]["Row"];
export type FlashcardReview = Database["public"]["Tables"]["flashcard_reviews"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

export type Achievement = Database["public"]["Tables"]["achievements"]["Row"];
export type UserAchievement = Database["public"]["Tables"]["user_achievements"]["Row"];
export type StudySession = Database["public"]["Tables"]["study_sessions"]["Row"];

export type ExamAttempt = Database["public"]["Tables"]["exam_attempts"]["Row"];

export type QuizQuestionOption = {
  label: string;
  text: string;
  is_correct: boolean;
};

export type QuizAnswer = {
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
};

export type ExamQuestion = {
  id: string;
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "free_text";
  options: QuizQuestionOption[];
  correct_answer: string;
  explanation: string;
  points: number;
};

export type ExamAnswer = {
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  points_earned: number;
};
