// ВАЖНО: После создания этого файла добавьте .env.local в корень проекта:
/*
REACT_APP_SUPABASE_URL=https://jyfcpnnmpxbstyadfxer.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZmNwbm5tcHhic3R5YWRmeGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyOTU1ODUsImV4cCI6MjA2ODg3MTU4NX0.vr9prTrngdK6K-NWDKeNctJN3CxwUvMdIbc6KxmEJqw
*/

export const config = {
  supabase: {
    url: process.env.REACT_APP_SUPABASE_URL,
    anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY,
  },
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// Проверка конфигурации
if (!config.supabase.url || !config.supabase.anonKey) {
  console.error('⚠️ ОШИБКА: Supabase переменные окружения не настроены!');
  console.log('Создайте файл .env.local в корне проекта с переменными:');
  console.log('REACT_APP_SUPABASE_URL=ваш_url');
  console.log('REACT_APP_SUPABASE_ANON_KEY=ваш_ключ');
} 