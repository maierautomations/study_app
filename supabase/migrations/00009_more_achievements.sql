-- ============================================
-- Migration 00009: More Achievements (expand from 12 to 23)
-- ============================================

INSERT INTO achievements (key, title_de, description_de, icon, xp_reward, category) VALUES
  ('quiz_marathon',     'Quiz-Marathon',       '5 Quizzes an einem Tag abschließen',        'zap',            200,  'quizzes'),
  ('flawless',          'Fehlerlos',           '3x hintereinander 90%+ im Quiz',            'award',          250,  'quizzes'),
  ('card_king',         'Kartenkönig',         '100 Flashcard-Reviews in einer Woche',       'crown',          200,  'flashcards'),
  ('diligent_learner',  'Fleißiger Lerner',    '500 Flashcard-Reviews insgesamt',             'book-open',      300,  'flashcards'),
  ('half_year_streak',  'Halbjahresziel',      '100 Tage Streak erreichen',                  'flame',          1000, 'streaks'),
  ('curious',           'Wissbegierig',        '20 Chat-Nachrichten senden',                 'message-circle', 100,  'chat'),
  ('explorer',          'Forscher',            '3 verschiedene Kurse nutzen',                'compass',        150,  'courses'),
  ('expert',            'Experte',             'Erreiche Level 10',                          'medal',          500,  'levels'),
  ('night_owl',         'Nachtlerner',         'Zwischen 22:00 und 06:00 Uhr lernen',       'moon',           100,  'general'),
  ('early_bird',        'Frühaufsteher',       'Vor 08:00 Uhr lernen',                      'sunrise',        100,  'general'),
  ('all_generator',     'Alles-Generierer',    '"Alles generieren" zum ersten Mal nutzen',   'sparkles',       100,  'general')
ON CONFLICT (key) DO NOTHING;
