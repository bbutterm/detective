import React, { useState, useEffect } from 'react';
import TaskList from './TaskList';
import TaskSolver from './TaskSolver';
import TaskEditor from './TaskEditor';
import { TaskAPI } from '../../lib/supabase';
import './RatingMode.css';

const RatingMode = ({ user, onBack }) => {
  const [currentView, setCurrentView] = useState('list'); // list, solve, create
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all'); // all, easy, medium, hard

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      // Пытаемся загрузить задачи из Supabase
      const supabaseTasks = await TaskAPI.getTasks();
      if (supabaseTasks && supabaseTasks.length > 0) {
        // Преобразуем формат Supabase к формату компонента
        const formattedTasks = supabaseTasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          difficulty: task.difficulty,
          tags: task.tags || [],
          likes: task.likes || 0,
          dislikes: task.dislikes || 0,
          creator: task.user_profiles?.username || 'admin',
          solved_count: task.solved_count || 0
        }));
        setTasks(formattedTasks);
      } else {
        // Fallback к встроенным задачам
        setTasks(getSampleTasks());
      }
    } catch (error) {
      console.log('Ошибка загрузки задач из Supabase, используем встроенные:', error);
      setTasks(getSampleTasks());
    }
  };

  const getSampleTasks = () => [
    {
      id: 'rt_001',
      title: 'Список сотрудников',
      description: 'Выведите всех сотрудников компании с их зарплатами',
      difficulty: 1,
      tags: ['SELECT', 'basics'],
      likes: 15,
      dislikes: 2,
      creator: 'admin',
      solved_count: 47
    },
    {
      id: 'rt_002', 
      title: 'Топ-менеджеры',
      description: 'Найдите сотрудников с зарплатой выше 100000',
      difficulty: 2,
      tags: ['SELECT', 'WHERE'],
      likes: 23,
      dislikes: 1,
      creator: 'sql_master',
      solved_count: 31
    },
    {
      id: 'rt_003',
      title: 'Группировка по отделам',
      description: 'Подсчитайте количество сотрудников в каждом отделе',
      difficulty: 3,
      tags: ['GROUP BY', 'COUNT'],
      likes: 18,
      dislikes: 3,
      creator: 'data_analyst',
      solved_count: 22
    }
  ];

  const handleTaskSelect = (task) => {
    setSelectedTask(task);
    setCurrentView('solve');
  };

  const handleTaskComplete = (taskId, success) => {
    if (success) {
      // Обновляем статистику задачи
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, solved_count: task.solved_count + 1 }
          : task
      ));
    }
    
    setCurrentView('list');
    setSelectedTask(null);
  };

  const handleCreateTask = () => {
    if (!user) {
      alert('Для создания задач необходимо войти в систему');
      return;
    }
    setCurrentView('create');
  };

  const handleTaskCreated = (newTask) => {
    setTasks(prev => [newTask, ...prev]);
    setCurrentView('list');
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'easy') return task.difficulty === 1;
    if (filter === 'medium') return task.difficulty === 2;
    if (filter === 'hard') return task.difficulty >= 3;
    return true;
  });

  return (
    <div className="rating-mode">
      <div className="rating-header">
        <button className="back-button" onClick={onBack}>
          ← Главное меню
        </button>
        
        <div className="rating-title">
          <h1>🏆 Рейтинг</h1>
          <p>Пользовательские SQL задачи</p>
        </div>

        {currentView === 'list' && (
          <div className="rating-controls">
            <div className="filter-controls">
              <label>Сложность:</label>
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">Все задачи</option>
                <option value="easy">Легкие (⭐)</option>
                <option value="medium">Средние (⭐⭐)</option>
                <option value="hard">Сложные (⭐⭐⭐+)</option>
              </select>
            </div>
            
            <button 
              className="create-task-btn" 
              onClick={handleCreateTask}
              disabled={!user}
            >
              + Создать задачу
            </button>
          </div>
        )}
      </div>

      <div className="rating-content">
        {currentView === 'list' && (
          <TaskList 
            tasks={filteredTasks}
            onTaskSelect={handleTaskSelect}
            user={user}
          />
        )}
        
        {currentView === 'solve' && selectedTask && (
          <TaskSolver 
            task={selectedTask}
            user={user}
            onComplete={handleTaskComplete}
            onBack={() => setCurrentView('list')}
          />
        )}
        
        {currentView === 'create' && (
          <TaskEditor 
            user={user}
            onTaskCreated={handleTaskCreated}
            onCancel={() => setCurrentView('list')}
          />
        )}
      </div>
    </div>
  );
};

export default RatingMode; 