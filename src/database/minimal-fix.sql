-- МИНИМАЛЬНОЕ ИСПРАВЛЕНИЕ для устранения ошибки регистрации

-- Удаляем старые политики
DROP POLICY IF EXISTS "Пользователи могут видеть все профили" ON public.user_profiles;
DROP POLICY IF EXISTS "Пользователи могут обновлять свой профиль" ON public.user_profiles;

-- Создаем исправленные политики
CREATE POLICY "Пользователи могут видеть все профили" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Пользователи могут создавать свой профиль" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Пользователи могут обновлять свой профиль" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Добавляем тестовые задачи (если их еще нет)
INSERT INTO public.rating_tasks (
  id,
  title,
  description,
  difficulty,
  tags,
  tables_data,
  solution,
  expected_result,
  hints,
  created_by,
  is_approved,
  likes,
  solved_count
) VALUES 
(
  'rt_001'::uuid,
  'Список сотрудников',
  'В компании ООО "ТехноСфера" работают различные специалисты. Выведите список всех сотрудников с их зарплатами, отсортированный по убыванию зарплаты.',
  1,
  ARRAY['SELECT', 'ORDER BY', 'basics'],
  '{"employees": [{"id": 1, "name": "Иванов Алексей", "department": "IT", "salary": 120000}, {"id": 2, "name": "Петрова Мария", "department": "HR", "salary": 85000}, {"id": 3, "name": "Сидоров Петр", "department": "IT", "salary": 95000}]}',
  'SELECT name, salary FROM employees ORDER BY salary DESC;',
  '[{"name": "Иванов Алексей", "salary": 120000}, {"name": "Сидоров Петр", "salary": 95000}, {"name": "Петрова Мария", "salary": 85000}]',
  ARRAY['Используйте SELECT для выбора нужных столбцов', 'ORDER BY поможет отсортировать результат'],
  '00000000-0000-0000-0000-000000000000'::uuid,
  true,
  15,
  47
),
(
  'rt_002'::uuid,
  'Топ-менеджеры', 
  'Найдите всех сотрудников из IT отдела с зарплатой выше 100000 рублей.',
  2,
  ARRAY['SELECT', 'WHERE', 'AND'],
  '{"employees": [{"id": 1, "name": "Иванов Алексей", "department": "IT", "salary": 120000}, {"id": 2, "name": "Петрова Мария", "department": "HR", "salary": 85000}, {"id": 3, "name": "Сидоров Петр", "department": "IT", "salary": 95000}]}',
  'SELECT name, department, salary FROM employees WHERE department = ''IT'' AND salary > 100000;',
  '[{"name": "Иванов Алексей", "department": "IT", "salary": 120000}]',
  ARRAY['Нужно использовать WHERE с двумя условиями', 'Логический оператор AND объединяет условия'],
  '00000000-0000-0000-0000-000000000000'::uuid,
  true,
  23,
  31
)
ON CONFLICT (id) DO NOTHING; 