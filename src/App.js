import React, { useState } from 'react';
import LevelSelector from './components/LevelSelector';
import GameModule from './components/GameModule';
import './App.css';

// Импортируем конфигурации уровней
import { levelConfig as q01Config } from './modules/q01/config';

const levelConfigs = {
  q01: q01Config,
  // q02: q02Config, // будет добавлено позже
  // q03: q03Config, // будет добавлено позже
};

function App() {
  const [currentLevel, setCurrentLevel] = useState(null);

  const handleLevelSelect = (levelId) => {
    setCurrentLevel(levelId);
  };

  const handleBackToMenu = () => {
    setCurrentLevel(null);
  };

  if (!currentLevel) {
    return <LevelSelector onLevelSelect={handleLevelSelect} />;
  }

  const config = levelConfigs[currentLevel];
  if (!config) {
    return <div>Уровень не найден</div>;
  }

  return <GameModule config={config} onBack={handleBackToMenu} />;
}

export default App;
