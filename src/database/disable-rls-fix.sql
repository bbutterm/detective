-- ПРОСТОЕ ИСПРАВЛЕНИЕ: отключаем RLS для user_profiles

-- Отключаем Row Level Security для таблицы user_profiles
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Проверяем что RLS отключен
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_profiles';

-- Теперь любой аутентифицированный пользователь может создать профиль
-- RLS остается включенным для других таблиц для безопасности 