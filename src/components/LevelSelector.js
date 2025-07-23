import React, { useState } from 'react';
import './LevelSelector.css';

const LevelSelector = ({ onLevelSelect, onBack }) => {
  const [selectedChapter, setSelectedChapter] = useState(null);

  const chapters = [
    {
      id: 'chapter1',
      title: '📚 ГЛАВА 1: ОСНОВЫ SELECT',
      subtitle: 'Кража в музее',
      description: 'Изучите основы SQL через расследование кражи византийской иконы',
      levels: [
        { id: 'level1', name: '🏛️ Кража в музее', description: 'Поиск подозреваемого среди посетителей', status: 'ready' },
        { id: 'level2', name: '🔍 Внутреннее расследование', description: 'Анализ персонала и доступов', status: 'ready' },
        { id: 'level3', name: '👁️ Показания свидетелей', description: 'Проверка показаний и алиби', status: 'ready' },
        { id: 'level4', name: '🤝 Раскрытие сговора', description: 'Поиск доказательств сотрудничества', status: 'ready' },
        { id: 'level5', name: '🎯 Финальное раскрытие', description: 'Поиск украденной иконы', status: 'ready' }
      ]
    },
    {
      id: 'chapter2',
      title: '🔍 ГЛАВА 2: ФИЛЬТРАЦИЯ И ЛОГИКА',
      subtitle: 'Банковское ограбление',
      description: 'WHERE, AND, OR, IN - логические операторы',
      levels: [
        { id: 'level1', name: '🏦 Кибератака на банк', description: 'Поиск следов киберпреступников', status: 'ready' },
        { id: 'level2', name: '💰 Подозрительные суммы', description: 'Числовые условия', status: 'development' },
        { id: 'level3', name: '⏰ Временные рамки', description: 'Логические операторы', status: 'development' },
        { id: 'level4', name: '🎭 Маски и алиби', description: 'Сложные условия', status: 'development' },
        { id: 'level5', name: '🕵️ Поиск преступника', description: 'IN, LIKE операторы', status: 'development' }
      ]
    },
    {
      id: 'chapter3',
      title: '📊 ГЛАВА 3: АГРЕГАЦИИ И ГРУППИРОВКИ',
      subtitle: 'Корпоративный шпионаж',
      description: 'COUNT, SUM, GROUP BY - анализ больших данных',
      levels: [
        { id: 'level1', name: '📈 Статистика продаж', description: 'COUNT и SUM', status: 'development' },
        { id: 'level2', name: '🔢 Группировка данных', description: 'GROUP BY основы', status: 'development' },
        { id: 'level3', name: '📋 Отчеты по отделам', description: 'HAVING условия', status: 'development' },
        { id: 'level4', name: '🎯 Финальный анализ', description: 'Сложные агрегации', status: 'development' }
      ]
    }
  ];

  if (selectedChapter) {
    const chapter = chapters.find(c => c.id === selectedChapter);
    return (
      <div className="level-selector">
        <button className="back-btn" onClick={() => setSelectedChapter(null)}>
          ← Назад к главам
        </button>
        
        <div className="chapter-header">
          <h1>{chapter.title}</h1>
          <h2>{chapter.subtitle}</h2>
          <p className="chapter-description">{chapter.description}</p>
        </div>

        <div className="levels-grid">
          {chapter.levels.map((level) => (
            <div key={level.id} className={`level-card ${level.status}`}>
              <h3>{level.name}</h3>
              <p>{level.description}</p>
              <div className="level-status">
                {level.status === 'ready' && <span className="status-ready">✅ Готов</span>}
                {level.status === 'development' && <span className="status-dev">🔧 В разработке</span>}
                {level.status === 'locked' && <span className="status-locked">🔒 Заблокирован</span>}
              </div>
              <button 
                className={`level-btn ${level.status !== 'ready' ? 'disabled' : ''}`}
                onClick={() => level.status === 'ready' && onLevelSelect(`${selectedChapter}_${level.id}`)}
                disabled={level.status !== 'ready'}
              >
                {level.status === 'ready' ? 'Играть' : level.status === 'development' ? 'Скоро' : 'Заблокировано'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="level-selector">
      {onBack && (
        <button className="back-to-menu-button" onClick={onBack}>
          ← Главное меню
        </button>
      )}
      <h1>🕵️ adHUB — SQL-квест</h1>
      <p className="main-subtitle">Изучайте SQL через детективные расследования</p>
      
      <div className="chapters-grid">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="chapter-card">
            <h2>{chapter.title}</h2>
            <h3>{chapter.subtitle}</h3>
            <p>{chapter.description}</p>
            <div className="chapter-progress">
              {chapter.levels.filter(l => l.status === 'ready').length} из {chapter.levels.length} уровней готово
            </div>
            <button 
              className="chapter-btn"
              onClick={() => setSelectedChapter(chapter.id)}
            >
              Открыть главу
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LevelSelector; 