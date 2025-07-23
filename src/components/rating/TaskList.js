import React from 'react';
import './TaskList.css';

const TaskList = ({ tasks, onTaskSelect, user }) => {
  const getDifficultyStars = (difficulty) => {
    return '⭐'.repeat(Math.min(difficulty, 5));
  };

  const getDifficultyColor = (difficulty) => {
    if (difficulty === 1) return '#27ae60';
    if (difficulty === 2) return '#f39c12';
    if (difficulty >= 3) return '#e74c3c';
    return '#95a5a6';
  };

  const getTagColor = (tag) => {
    const colors = {
      'SELECT': '#3498db',
      'WHERE': '#9b59b6',
      'GROUP BY': '#e67e22',
      'COUNT': '#1abc9c',
      'JOIN': '#e74c3c',
      'basics': '#95a5a6'
    };
    return colors[tag] || '#7f8c8d';
  };

  if (tasks.length === 0) {
    return (
      <div className="empty-tasks">
        <div className="empty-icon">📝</div>
        <h3>Задач пока нет</h3>
        <p>Станьте первым, кто создаст задачу!</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      <div className="task-list-header">
        <h2>Доступные задачи ({tasks.length})</h2>
        <div className="sort-info">
          Сортировка: по популярности
        </div>
      </div>

      <div className="tasks-grid">
        {tasks.map(task => (
          <div 
            key={task.id} 
            className="task-card"
            onClick={() => onTaskSelect(task)}
          >
            <div className="task-header">
              <h3 className="task-title">{task.title}</h3>
              <div 
                className="task-difficulty"
                style={{ color: getDifficultyColor(task.difficulty) }}
              >
                {getDifficultyStars(task.difficulty)}
              </div>
            </div>

            <p className="task-description">{task.description}</p>

            <div className="task-tags">
              {task.tags.map(tag => (
                <span 
                  key={tag} 
                  className="task-tag"
                  style={{ backgroundColor: getTagColor(tag) }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="task-stats">
              <div className="task-creator">
                👤 {task.creator}
              </div>
              
              <div className="task-metrics">
                <span className="metric solved">
                  ✅ {task.solved_count}
                </span>
                <span className="metric likes">
                  👍 {task.likes}
                </span>
                {task.dislikes > 0 && (
                  <span className="metric dislikes">
                    👎 {task.dislikes}
                  </span>
                )}
              </div>
            </div>

            <div className="task-rating">
              <div className="rating-bar">
                <div 
                  className="rating-fill"
                  style={{ 
                    width: `${(task.likes / (task.likes + task.dislikes)) * 100}%` 
                  }}
                ></div>
              </div>
              <span className="rating-percent">
                {Math.round((task.likes / (task.likes + task.dislikes)) * 100)}%
              </span>
            </div>

            <button className="solve-button">
              Решить задачу →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList; 