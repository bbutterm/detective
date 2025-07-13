import React from 'react';
import './LevelSelector.css';

const LevelSelector = ({ onLevelSelect }) => {
  const levels = [
    { id: 'q01', name: 'Уровень 1', description: 'Музейное преступление' },
    { id: 'q02', name: 'Уровень 2', description: 'В разработке' },
    { id: 'q03', name: 'Уровень 3', description: 'В разработке' },
  ];

  return (
    <div className="level-selector">
      <h1>adHUB — SQL-квест</h1>
      <div className="levels-grid">
        {levels.map((level) => (
          <div key={level.id} className="level-card">
            <h3>{level.name}</h3>
            <p>{level.description}</p>
            <button 
              className="level-btn"
              onClick={() => onLevelSelect(level.id)}
              disabled={level.id !== 'q01'}
            >
              {level.id === 'q01' ? 'Играть' : 'Скоро'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LevelSelector; 