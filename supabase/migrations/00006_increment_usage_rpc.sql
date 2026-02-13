-- Atomic increment for AI usage to prevent race conditions
CREATE OR REPLACE FUNCTION increment_ai_usage(user_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET ai_generations_used = ai_generations_used + 1
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
