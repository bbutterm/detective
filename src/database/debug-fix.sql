-- ДИАГНОСТИКА И ИСПРАВЛЕНИЕ RLS проблемы

-- 1. Проверяем существующие политики
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 2. Удаляем ВСЕ существующие политики для user_profiles
DROP POLICY IF EXISTS "Пользователи могут видеть все профили" ON public.user_profiles;
DROP POLICY IF EXISTS "Пользователи могут обновлять свой профиль" ON public.user_profiles;
DROP POLICY IF EXISTS "Пользователи могут создавать свой профиль" ON public.user_profiles;

-- 3. Временно отключаем RLS для проверки
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 4. Включаем RLS обратно
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Создаем правильные политики заново
CREATE POLICY "user_profiles_select_policy" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_update_policy" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- 6. Проверяем что политики созданы
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles'; 