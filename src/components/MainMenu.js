import React from 'react';
import './MainMenu.css';

const MainMenu = ({ onModeSelect, user }) => {
  return (
    <div className="main-menu">
      <div className="menu-container">
        <h1 className="game-title">adHUB</h1>
        <p className="game-subtitle">SQL Детективное Агентство</p>
        
        <div className="menu-options">
          <div className="menu-card" onClick={() => onModeSelect('campaign')}>
            <div className="card-icon">🕵️</div>
            <h3>Кампания</h3>
            <p>Детективная история с расследованиями</p>
            <div className="card-footer">Главы и уровни</div>
          </div>

          <div className="menu-card" onClick={() => onModeSelect('rating')}>
            <div className="card-icon">🏆</div>
            <h3>Рейтинг</h3>
            <p>Пользовательские SQL задачи</p>
            <div className="card-footer">Соревнование и лидерборд</div>
          </div>

          {user ? (
            <div className="menu-card" onClick={() => onModeSelect('profile')}>
              <div className="card-icon">👤</div>
              <h3>Личный кабинет</h3>
              <p>Профиль и статистика</p>
              <div className="card-footer">{user.username}</div>
            </div>
          ) : (
            <div className="menu-card auth-card" onClick={() => onModeSelect('auth')}>
              <div className="card-icon">🔐</div>
              <h3>Войти</h3>
              <p>Регистрация и авторизация</p>
              <div className="card-footer">Создать аккаунт</div>
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