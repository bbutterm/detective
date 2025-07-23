-- Создание таблиц для adHUB SQL платформы

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
  tables_data JSONB NOT NULL, -- Структура: {"table_name": [rows]}
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
  time_taken INTEGER, -- секунды
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

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_rating_tasks_difficulty ON public.rating_tasks(difficulty);
CREATE INDEX IF NOT EXISTS idx_rating_tasks_created_by ON public.rating_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_rating_tasks_approved ON public.rating_tasks(is_approved);
CREATE INDEX IF NOT EXISTS idx_user_solutions_user_id ON public.user_solutions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_solutions_task_id ON public.user_solutions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_votes_task_id ON public.task_votes(task_id);

-- Триггеры для обновления счетчиков
CREATE OR REPLACE FUNCTION update_task_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Обновляем статистику при новом лайке/дизлайке
    IF NEW.vote_type = 'like' THEN
      UPDATE public.rating_tasks 
      SET likes = likes + 1 
      WHERE id = NEW.task_id;
    ELSE
      UPDATE public.rating_tasks 
      SET dislikes = dislikes + 1 
      WHERE id = NEW.task_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Убираем статистику при удалении лайка/дизлайка
    IF OLD.vote_type = 'like' THEN
      UPDATE public.rating_tasks 
      SET likes = likes - 1 
      WHERE id = OLD.task_id;
    ELSE
      UPDATE public.rating_tasks 
      SET dislikes = dislikes - 1 
      WHERE id = OLD.task_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_votes_trigger
  AFTER INSERT OR DELETE ON public.task_votes
  FOR EACH ROW EXECUTE FUNCTION update_task_stats();

-- Триггер для обновления счетчика решений
CREATE OR REPLACE FUNCTION update_solved_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_correct = true AND (OLD IS NULL OR OLD.is_correct = false) THEN
    UPDATE public.rating_tasks 
    SET solved_count = solved_count + 1 
    WHERE id = NEW.task_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_solutions_trigger
  AFTER INSERT OR UPDATE ON public.user_solutions
  FOR EACH ROW EXECUTE FUNCTION update_solved_count();

-- RLS (Row Level Security) политики
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_votes ENABLE ROW LEVEL SECURITY;

-- Политики для user_profiles
CREATE POLICY "Пользователи могут видеть все профили" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Пользователи могут обновлять свой профиль" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Политики для rating_tasks
CREATE POLICY "Все могут видеть одобренные задачи" ON public.rating_tasks
  FOR SELECT USING (is_approved = true OR created_by = auth.uid());

CREATE POLICY "Пользователи могут создавать задачи" ON public.rating_tasks
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Авторы могут редактировать свои задачи" ON public.rating_tasks
  FOR UPDATE USING (auth.uid() = created_by);

-- Политики для user_solutions
CREATE POLICY "Пользователи могут видеть свои решения" ON public.user_solutions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут добавлять решения" ON public.user_solutions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять свои решения" ON public.user_solutions
  FOR UPDATE USING (auth.uid() = user_id);

-- Политики для task_votes
CREATE POLICY "Пользователи могут видеть все голоса" ON public.task_votes
  FOR SELECT USING (true);

CREATE POLICY "Пользователи могут голосовать" ON public.task_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут изменять свои голоса" ON public.task_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут удалять свои голоса" ON public.task_votes
  FOR DELETE USING (auth.uid() = user_id); 