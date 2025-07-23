-- СОЗДАНИЕ ТОЛЬКО ТАБЛИЦ (без RLS политик)

-- Расширенная таблица пользователей (дополняет auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  rating_points INTEGER DEFAULT 0,
  campaign_progress JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Рейтинговые задачи от пользователей
CREATE TABLE IF NOT EXISTS public.rating_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5) DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  tables_data JSONB NOT NULL,
  solution TEXT NOT NULL,
  expected_result JSONB NOT NULL,
  hints TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES public.user_profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  solved_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT false,
  moderator_notes TEXT
);

-- Решения пользователей
CREATE TABLE IF NOT EXISTS public.user_solutions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  task_id UUID REFERENCES public.rating_tasks(id) NOT NULL,
  query_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 1,
  time_taken INTEGER,
  solved_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, task_id)
);

-- Лайки/дизлайки для задач
CREATE TABLE IF NOT EXISTS public.task_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  task_id UUID REFERENCES public.rating_tasks(id) NOT NULL,
  vote_type VARCHAR(10) CHECK (vote_type IN ('like', 'dislike')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, task_id)
);

-- Проверяем созданные таблицы
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'rating_tasks', 'user_solutions', 'task_votes'); 