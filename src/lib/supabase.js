import { createClient } from '@supabase/supabase-js';
import { config } from '../config/environment.js';

const supabaseUrl = config.supabase.url || 'https://jyfcpnnmpxbstyadfxer.supabase.co';
const supabaseAnonKey = config.supabase.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZmNwbm5tcHhic3R5YWRmeGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyOTU1ODUsImV4cCI6MjA2ODg3MTU4NX0.vr9prTrngdK6K-NWDKeNctJN3CxwUvMdIbc6KxmEJqw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Утилиты для работы с задачами
export const TaskAPI = {
  // Получить все одобренные задачи
  async getTasks() {
    const { data, error } = await supabase
      .from('rating_tasks')
      .select(`
        *,
        user_profiles!created_by(username)
      `)
      .eq('is_approved', true)
      .order('likes', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Получить задачу по ID
  async getTask(id) {
    const { data, error } = await supabase
      .from('rating_tasks')
      .select(`
        *,
        user_profiles!created_by(username)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Создать новую задачу
  async createTask(taskData) {
    const { data, error } = await supabase
      .from('rating_tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Сохранить решение пользователя
  async saveSolution(solutionData) {
    const { data, error } = await supabase
      .from('user_solutions')
      .upsert([solutionData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Проголосовать за задачу
  async voteTask(taskId, voteType) {
    const { data: existingVote } = await supabase
      .from('task_votes')
      .select('id, vote_type')
      .eq('task_id', taskId)
      .eq('user_id', (await supabase.auth.getUser()).data.user.id)
      .single();

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Убираем голос если тот же самый
        const { error } = await supabase
          .from('task_votes')
          .delete()
          .eq('id', existingVote.id);
        if (error) throw error;
      } else {
        // Меняем голос
        const { error } = await supabase
          .from('task_votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);
        if (error) throw error;
      }
    } else {
      // Новый голос
      const { error } = await supabase
        .from('task_votes')
        .insert([{
          task_id: taskId,
          user_id: (await supabase.auth.getUser()).data.user.id,
          vote_type: voteType
        }]);
      if (error) throw error;
    }
  },

  // Получить решения пользователя
  async getUserSolutions(userId) {
    const { data, error } = await supabase
      .from('user_solutions')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  }
};

// Утилиты для работы с профилями
export const ProfileAPI = {
  // Получить профиль пользователя
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Создать профиль при регистрации
  async createProfile(profileData) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([profileData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Обновить прогресс кампании
  async updateCampaignProgress(userId, progress) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ campaign_progress: progress })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Добавить рейтинговые очки
  async addRatingPoints(userId, points) {
    const { data, error } = await supabase
      .rpc('add_rating_points', {
        user_id: userId,
        points_to_add: points
      });

    if (error) throw error;
    return data;
  }
};

// Утилиты для авторизации
export const AuthAPI = {
  // Регистрация
  async signUp(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Создаем профиль пользователя
    if (data.user) {
      try {
        await ProfileAPI.createProfile({
          id: data.user.id,
          username,
          rating_points: 0,
          campaign_progress: {}
        });
      } catch (profileError) {
        console.error('Ошибка создания профиля:', profileError);
        // Не блокируем регистрацию если профиль не создался
      }
    }

    return data;
  },

  // Вход
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  // Выход
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Получить текущего пользователя
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const profile = await ProfileAPI.getProfile(user.id);
      return { ...user, profile };
    }
    
    return null;
  }
}; 