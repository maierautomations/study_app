-- ============================================
-- Migration 00010: Extended get_user_stats RPC
-- ============================================
-- Replaces get_user_stats to include extended stats for new achievements.

CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'course_count', (SELECT COUNT(*) FROM courses WHERE user_id = p_user_id),
    'document_count', (SELECT COUNT(*) FROM documents WHERE user_id = p_user_id),
    'quiz_count', (SELECT COUNT(*) FROM quiz_attempts WHERE user_id = p_user_id),
    'flashcard_session_count', (SELECT COUNT(DISTINCT set_id) FROM flashcards f
      JOIN flashcard_reviews fr ON fr.flashcard_id = f.id
      WHERE fr.user_id = p_user_id),
    'perfect_quiz_count', (SELECT COUNT(*) FROM quiz_attempts WHERE user_id = p_user_id AND score = 100),
    'chat_message_count', (SELECT COUNT(*) FROM chat_messages WHERE user_id = p_user_id AND role = 'user'),
    'total_flashcard_reviews', (SELECT COUNT(*) FROM flashcard_reviews WHERE user_id = p_user_id),
    'quizzes_today', (SELECT COUNT(*) FROM quiz_attempts WHERE user_id = p_user_id AND created_at::date = CURRENT_DATE),
    'flashcard_reviews_this_week', (SELECT COUNT(*) FROM flashcard_reviews WHERE user_id = p_user_id AND reviewed_at >= (CURRENT_DATE - INTERVAL '7 days')),
    'consecutive_high_scores', (
      SELECT COUNT(*) FROM (
        SELECT score, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
        FROM quiz_attempts WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 10
      ) sub WHERE rn <= 3 AND score >= 90
    ),
    'distinct_courses_used', (SELECT COUNT(DISTINCT course_id) FROM study_sessions WHERE user_id = p_user_id AND course_id IS NOT NULL)
  ) INTO result;
  RETURN result;
END;
$$;
