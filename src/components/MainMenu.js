import React, { useState } from 'react';
import './MainMenu.css';

const MainMenu = ({ onModeSelect, user }) => {
  const [hoveredCard, setHoveredCard] = useState(null);

  const handleCardEnter = (cardType) => {
    if (cardType === 'rating' || cardType === 'auth') {
      setHoveredCard(cardType);
    }
  };

  const handleCardLeave = () => {
    setHoveredCard(null);
  };

  return (
    <div className="main-menu">
      <div className="menu-container">
        <h1 className="game-title">🕵️ Data Detective</h1>
        <p className="game-subtitle">Платформа для изучения SQL через детективные расследования</p>
        
        <div className="menu-options">
          <div className="menu-card" onClick={() => onModeSelect('campaign')}>
            <div className="card-icon">🕵️</div>
            <h3>Кампания</h3>
            <p>Детективная история с расследованиями</p>
            <div className="card-footer">Главы и уровни</div>
          </div>

          <div 
            className="menu-card rating-card" 
            onClick={() => onModeSelect('rating')}
            onMouseEnter={() => handleCardEnter('rating')}
            onMouseLeave={handleCardLeave}
          >
            <div className="card-icon">🏆</div>
            <h3>Рейтинг</h3>
            <p>Пользовательские SQL задачи</p>
            <div className="card-footer">Соревнование и лидерборд</div>
            
            {hoveredCard === 'rating' && (
              <div className="warning-tooltip">
                <div className="tooltip-content">
                  <div className="tooltip-icon">⚠️</div>
                  <div className="tooltip-text">
                    <strong>Модуль в разработке</strong>
                    <p>Может вести себя непредсказуемо</p>
                  </div>
                </div>
                <div className="tooltip-arrow"></div>
              </div>
            )}
          </div>

          {user ? (
            <div className="menu-card" onClick={() => onModeSelect('profile')}>
              <div className="card-icon">👤</div>
              <h3>Личный кабинет</h3>
              <p>Профиль и статистика</p>
              <div className="card-footer">{user.username}</div>
            </div>
          ) : (
            <div 
              className="menu-card auth-card" 
              onClick={() => onModeSelect('auth')}
              onMouseEnter={() => handleCardEnter('auth')}
              onMouseLeave={handleCardLeave}
            >
              <div className="card-icon">🔐</div>
              <h3>Войти / Регистрация</h3>
              <p>Создание аккаунта и авторизация</p>
              <div className="card-footer">Создать аккаунт</div>
              
              {hoveredCard === 'auth' && (
                <div className="warning-tooltip">
                  <div className="tooltip-content">
                    <div className="tooltip-icon">⚠️</div>
                    <div className="tooltip-text">
                      <strong>Модуль в разработке</strong>
                      <p>Может вести себя непредсказуемо</p>
                    </div>
                  </div>
                  <div className="tooltip-arrow"></div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="menu-stats">
          <div className="stat">
            <span className="stat-number">14</span>
            <span className="stat-label">Уровней кампании</span>
          </div>
          <div className="stat">
            <span className="stat-number">∞</span>
            <span className="stat-label">Пользовательских задач</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu; 