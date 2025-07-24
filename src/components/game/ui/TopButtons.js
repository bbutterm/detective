import React from 'react';

const TopButtons = ({ 
  onBack, 
  onShowTask, 
  onShowIntro, 
  onShowHints, 
  hasHints 
}) => {
  return (
    <div className="top-buttons">
      <button className="clear-btn animated-btn" onClick={onBack}>← Назад</button>
      <button className="clear-btn animated-btn" onClick={onShowTask}>📋 Задача</button>
      <button className="clear-btn animated-btn" onClick={onShowIntro}>📖 Вводные данные</button>
      {hasHints && (
        <button className="clear-btn animated-btn" onClick={onShowHints}>💡 Подсказки</button>
      )}
    </div>
  );
};

export default TopButtons; 