import React, { useState, useEffect } from 'react';
import MainMenu from './components/MainMenu';
import LevelSelector from './components/LevelSelector';
import GameModule from './components/GameModule';
import RatingMode from './components/rating/RatingMode';
import AuthForm from './components/auth/AuthForm';
import { AuthAPI } from './lib/supabase';
import './App.css';

// Импортируем конфигурации уровней
import { levelConfig as ch1l1Config } from './modules/chapter1/level1/config';
import { levelConfig as ch1l2Config } from './modules/chapter1/level2/config';
import { levelConfig as ch1l3Config } from './modules/chapter1/level3/config';
import { levelConfig as ch1l4Config } from './modules/chapter1/level4/config';
import { levelConfig as ch1l5Config } from './modules/chapter1/level5/config';

const levelConfigs = {
  'chapter1_level1': ch1l1Config,
  'chapter1_level2': ch1l2Config,
  'chapter1_level3': ch1l3Config,
  'chapter1_level4': ch1l4Config,
  'chapter1_level5': ch1l5Config,
  // chapter2 levels will be added later
};

function App() {
  const [currentMode, setCurrentMode] = useState('menu'); // menu, campaign, rating, auth, profile
  const [currentLevel, setCurrentLevel] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await AuthAPI.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.log('No user logged in:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModeSelect = (mode) => {
    if (mode === 'campaign') {
      setCurrentMode('campaign');
    } else if (mode === 'rating') {
      setCurrentMode('rating');
    } else if (mode === 'auth') {
      setCurrentMode('auth');
    } else if (mode === 'profile') {
      setCurrentMode('profile');
    }
  };

  const handleLevelSelect = (levelId) => {
    setCurrentLevel(levelId);
  };

  const handleBackToMenu = () => {
    setCurrentLevel(null);
    setCurrentMode('menu');
  };

  const handleBackToCampaign = () => {
    setCurrentLevel(null);
    // Остаемся в режиме кампании
  };

  const handleAuthSuccess = (loggedUser) => {
    setUser(loggedUser);
    setCurrentMode('menu');
  };

  const handleLogout = async () => {
    try {
      await AuthAPI.signOut();
      setUser(null);
      setCurrentMode('menu');
    } catch (error) {
      console.error('Logout error:', error);
    }
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
    
    // Если это последний доступный уровень, возвращаемся в selector
    setCurrentLevel(null);
    return false;
  };

  if (loading) {
    return (
      <div className="App loading">
        <div className="loading-container">
          <h2>⏳ Загрузка adHUB...</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // Главное меню
  if (currentMode === 'menu') {
    return (
      <div className="App">
        <MainMenu 
          onModeSelect={handleModeSelect}
          user={user}
        />
      </div>
    );
  }
  
  // Режим кампании - селектор уровней
  if (currentMode === 'campaign' && !currentLevel) {
    return (
      <div className="App">
        <LevelSelector 
          onLevelSelect={handleLevelSelect} 
          onBack={handleBackToMenu}
        />
      </div>
    );
  }
  
  // Режим кампании - игровой уровень
  if (currentMode === 'campaign' && currentLevel) {
    const config = levelConfigs[currentLevel];
    
    if (!config) {
      return (
        <div className="App">
          <div className="level-not-found">
            <h2>🔧 Уровень в разработке</h2>
            <p>Этот уровень скоро будет доступен!</p>
            <button onClick={handleBackToCampaign}>
              ← Назад к выбору уровня
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="App">
        <GameModule 
          config={config} 
          onBack={handleBackToCampaign} 
          onNextLevel={handleNextLevel}
          levelId={currentLevel} 
        />
      </div>
    );
  }
  
  // Рейтинговый режим
  if (currentMode === 'rating') {
    return (
      <div className="App">
        <RatingMode 
          user={user}
          onBack={handleBackToMenu}
        />
      </div>
    );
  }
  
  // Авторизация
  if (currentMode === 'auth') {
    return (
      <div className="App">
        <AuthForm 
          onSuccess={handleAuthSuccess}
          onBack={handleBackToMenu}
        />
      </div>
    );
  }
  
  // Личный кабинет
  if (currentMode === 'profile' && user) {
    return (
      <div className="App">
        <div className="profile-mode">
          <div className="profile-container">
            <button className="back-button" onClick={handleBackToMenu}>
              ← Главное меню
            </button>
            
            <div className="profile-content">
              <h1>👤 Личный кабинет</h1>
              <div className="user-info">
                <h2>Добро пожаловать, {user.profile?.username}!</h2>
                <p>Email: {user.email}</p>
                <p>Рейтинг: {user.profile?.rating_points || 0} очков</p>
              </div>
              
              <div className="profile-actions">
                <button className="logout-button" onClick={handleLogout}>
                  🚪 Выйти из аккаунта
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback - возврат в главное меню
  return (
    <div className="App">
      <MainMenu 
        onModeSelect={handleModeSelect}
        user={user}
      />
    </div>
  );
}

export default App;
