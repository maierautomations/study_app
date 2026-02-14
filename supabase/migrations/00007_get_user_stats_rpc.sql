-- RPC function to get all user stats in a single query (fixes N+1 in gamification API)
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
    'flashcard_session_count', (SELECT COUNT(*) FROM flashcard_reviews WHERE user_id = p_user_id),
    'perfect_quiz_count', (SELECT COUNT(*) FROM quiz_attempts WHERE user_id = p_user_id AND score = 100)
  ) INTO result;

  RETURN result;
END;
$$;
