import React, { useState } from 'react';
import LevelSelector from './components/LevelSelector';
import GameModule from './components/GameModule';
import './App.css';

// Импортируем конфигурации уровней
import { levelConfig as ch1l1Config } from './modules/chapter1/level1/config';
import { levelConfig as ch1l2Config } from './modules/chapter1/level2/config';
import { levelConfig as ch1l3Config } from './modules/chapter1/level3/config';
import { levelConfig as ch1l4Config } from './modules/chapter1/level4/config';
import { levelConfig as ch1l5Config } from './modules/chapter1/level5/config';
import { levelConfig as ch2l1Config } from './modules/chapter2/level1/config';

const levelConfigs = {
  'chapter1_level1': ch1l1Config,
  'chapter1_level2': ch1l2Config,
  'chapter1_level3': ch1l3Config,
  'chapter1_level4': ch1l4Config,
  'chapter1_level5': ch1l5Config,
  'chapter2_level1': ch2l1Config,
  // chapter2_level2: ch2l2Config, // будет добавлено позже
  // и так далее...
};

function App() {
  const [currentLevel, setCurrentLevel] = useState(null);

  const handleLevelSelect = (levelId) => {
    setCurrentLevel(levelId);
  };

  const handleBackToMenu = () => {
    setCurrentLevel(null);
  };

  // Функция для перехода к следующему уровню
  const handleNextLevel = (currentLevelId) => {
    const [chapter, level] = currentLevelId.split('_');
    const levelNumber = parseInt(level.replace('level', ''));
    
    // Сначала пробуем следующий уровень в той же главе
    const nextLevelInChapter = `${chapter}_level${levelNumber + 1}`;
    
    // Доступные уровни
    const availableLevels = Object.keys(levelConfigs);
    
    if (availableLevels.includes(nextLevelInChapter)) {
      setCurrentLevel(nextLevelInChapter);
      return true;
    }
    
    // Если нет следующего уровня в главе, переходим к следующей главе
    if (chapter === 'chapter1' && availableLevels.includes('chapter2_level1')) {
      setCurrentLevel('chapter2_level1');
      return true;
    }
    
    // Если это последний доступный уровень, возвращаемся в меню
    setCurrentLevel(null);
    return false;
  };

  if (!currentLevel) {
    return <LevelSelector onLevelSelect={handleLevelSelect} />;
  }

  const config = levelConfigs[currentLevel];
  if (!config) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '1.5em',
        fontFamily: 'Consolas, monospace',
        textAlign: 'center',
        color: '#666'
      }}>
        <div>
          <h2>🔧 Уровень в разработке</h2>
          <p>Этот уровень скоро будет доступен!</p>
          <button 
            onClick={handleBackToMenu}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              border: '2px solid #222',
              borderRadius: '12px',
              background: '#fff',
              color: '#222',
              fontSize: '1.1em',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            ← Назад к выбору уровня
          </button>
        </div>
      </div>
    );
  }

  return (
    <GameModule 
      config={config} 
      onBack={handleBackToMenu} 
      onNextLevel={handleNextLevel}
      levelId={currentLevel} 
    />
  );
}

export default App;
