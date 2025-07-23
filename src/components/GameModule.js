import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import alasql from 'alasql';
import './GameModule.css';

const GameModule = ({ config, onBack, onNextLevel, levelId }) => {
  const { title, description, task, briefing, tables, victoryConditions, bonusConditions, image } = config;
  
  // Поддержка старого формата для обратной совместимости
  const legacyVictoryText = config.victoryText;
  
  // Динамическая загрузка таблиц в зависимости от levelId
  const tablesData = useMemo(() => {
    try {
      // Извлекаем путь к модулю из levelId (например, chapter1_level2)
      const [chapter, level] = levelId.split('_');
      const modulePath = `${chapter}/${level}`;
      
      // Загружаем все JSON файлы из папки tables модуля
      const tablesContext = require.context('../modules/', true, /\.json$/);
      
      return tablesContext.keys()
        .filter(key => key.includes(`/${modulePath}/tables/`))
        .map((key) => {
          const name = key.split('/').pop().replace('.json', '');
          const data = tablesContext(key);
          return { name, data };
        });
    } catch (error) {
      console.error('Ошибка загрузки таблиц:', error);
      return [];
    }
  }, [levelId]);

  const [selectedTable, setSelectedTable] = useState(tablesData[0]);
  const [sql, setSql] = useState('');
  const [error, setError] = useState('');
  const [hoveredTable, setHoveredTable] = useState(null);
  const [history, setHistory] = useState([]);
  const dataOutputRef = useRef(null);
  const sqlInputRef = useRef(null);
  const [win, setWin] = useState(false);
  const [bonusWin, setBonusWin] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [caretVisible, setCaretVisible] = useState(true);
  const [completedBonuses, setCompletedBonuses] = useState([]);

  // Эффект каретки
  useEffect(() => {
    const interval = setInterval(() => {
      setCaretVisible(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Инициализация alasql
  useEffect(() => {
    if (tablesData.length === 0) return;
    
    alasql('DROP DATABASE IF EXISTS adhub');
    alasql('CREATE DATABASE adhub');
    alasql('USE adhub');
    tablesData.forEach(t => {
      alasql('CREATE TABLE ' + t.name);
      alasql.tables[t.name].data = t.data;
    });
  }, [tablesData]);

  // Обновляем selectedTable при изменении tablesData
  useEffect(() => {
    if (tablesData.length > 0 && !selectedTable) {
      setSelectedTable(tablesData[0]);
    }
  }, [tablesData, selectedTable]);

  useEffect(() => {
    if (dataOutputRef.current) {
      dataOutputRef.current.scrollTop = dataOutputRef.current.scrollHeight;
    }
    // Проверка на победу
    for (const item of history) {
      if (item.result && checkVictoryCondition(item)) {
        if (!win) setWin(true);
        break;
      }
      // Проверка бонусных условий
      if (bonusConditions) {
        bonusConditions.forEach((bonus, index) => {
          if (!completedBonuses.includes(index) && checkBonusCondition(item, bonus)) {
            setCompletedBonuses(prev => [...prev, index]);
            setBonusWin(true);
            setTimeout(() => setBonusWin(false), 3000);
          }
        });
      }
    }
  }, [history, win, completedBonuses]);

  // Продвинутая проверка условий победы
  const checkVictoryCondition = useCallback((queryItem) => {
    if (!queryItem.result || queryItem.error) return false;

    // Используем новые условия победы если они есть
    if (victoryConditions) {
      return evaluateCondition(queryItem, victoryConditions);
    }
    
    // Обратная совместимость со старым форматом
    if (legacyVictoryText) {
      return containsWinText(queryItem.result, legacyVictoryText);
    }

    return false;
  }, [victoryConditions, legacyVictoryText]);

  // Проверка бонусных условий
  const checkBonusCondition = useCallback((queryItem, bonusCondition) => {
    if (!queryItem.result || queryItem.error) return false;
    return evaluateCondition(queryItem, bonusCondition);
  }, []);

  // Универсальная функция оценки условий
  const evaluateCondition = (queryItem, condition) => {
    const { type, target, query, requiredValue, requiredInQuery, requiredRowCount } = condition;
    const result = queryItem.result;

    switch (type) {
      case 'contains_name':
        return containsWinText(result, target);
      
      case 'row_count':
        return Array.isArray(result) && result.length === target;
      
      case 'row_count_with_value':
        // Проверяем что результат содержит ровно target строк И содержит requiredValue
        if (!Array.isArray(result) || result.length !== target) {
          return false;
        }
        // Дополнительно проверяем что в результате есть требуемое значение
        return result.some(row => 
          typeof row === 'object' && 
          Object.values(row).some(val => String(val).includes(requiredValue))
        );
      
      case 'query_contains_and_result':
        // Проверяем что запрос содержит нужное ключевое слово (или слова)
        const queryUpperCase = queryItem.query.toUpperCase();
        if (requiredInQuery) {
          if (Array.isArray(requiredInQuery)) {
            // Если массив - проверяем что все ключевые слова присутствуют
            const hasAllKeywords = requiredInQuery.every(keyword => 
              queryUpperCase.includes(keyword.toUpperCase())
            );
            if (!hasAllKeywords) {
              return false;
            }
          } else {
            // Если строка - проверяем одно ключевое слово
            if (!queryUpperCase.includes(requiredInQuery.toUpperCase())) {
              return false;
            }
          }
        }
        
        // Проверяем количество строк в результате
        if (!Array.isArray(result) || result.length !== requiredRowCount) {
          return false;
        }
        
        // Проверяем что результат содержит нужное значение
        if (requiredValue) {
          return result.some(row => 
            typeof row === 'object' && 
            Object.values(row).some(val => String(val).includes(requiredValue))
          );
        }
        
        return true;
      
      case 'specific_query':
        // Проверяем точное соответствие запроса (без учета пробелов и регистра)
        const normalizedQuery = queryItem.query.replace(/\s+/g, ' ').trim().toLowerCase();
        const normalizedTarget = query.replace(/\s+/g, ' ').trim().toLowerCase();
        return normalizedQuery === normalizedTarget;
      
      case 'contains_value':
        if (Array.isArray(result)) {
          return result.some(row => 
            typeof row === 'object' && 
            Object.values(row).some(val => String(val).includes(target))
          );
        }
        return false;
      
      case 'column_exists':
        if (Array.isArray(result) && result.length > 0) {
          return Object.keys(result[0]).includes(target);
        }
        return false;
      
      case 'custom_function':
        // Для будущих сложных условий
        if (typeof condition.evaluator === 'function') {
          return condition.evaluator(result, queryItem.query);
        }
        return false;
      
      default:
        return false;
    }
  };

  // Старая функция для обратной совместимости
  const containsWinText = (result, targetText) => {
    if (typeof result === 'string') return result.includes(targetText);
    if (Array.isArray(result)) {
      return result.some(row =>
        typeof row === 'string' && row.includes(targetText) ||
        typeof row === 'object' && Object.values(row).some(val => String(val).includes(targetText))
      );
    }
    if (typeof result === 'object' && result !== null) {
      return Object.values(result).some(val => String(val).includes(targetText));
    }
    return false;
  };

  const validateSQL = (query) => {
    const forbidden = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'CREATE', 'ALTER'];
    const upperQuery = query.toUpperCase();
    return !forbidden.some(cmd => upperQuery.includes(cmd));
  };

  const handleRun = useCallback(() => {
    if (!sql.trim()) return;
    
    if (!validateSQL(sql)) {
      setHistory(prev => [
        ...prev,
        { query: sql, result: null, error: 'Запрещены команды изменения данных (DROP, DELETE, UPDATE, INSERT, CREATE, ALTER)' }
      ]);
      setSql('');
      return;
    }

    setError('');
    let res = null;
    let err = '';
    try {
      res = alasql(sql);
    } catch (e) {
      err = e.message;
    }
    setHistory(prev => [
      ...prev,
      { query: sql, result: res, error: err }
    ]);
    setSql('');
  }, [sql]);

  const renderResult = (result, error) => {
    if (error) return <div className="error">{error}</div>;
    if (!result) return <div style={{color:'#888'}}>Нет данных.</div>;
    if (Array.isArray(result) && result.length > 0 && typeof result[0] === 'object') {
      const keys = Object.keys(result[0]);
      return (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {keys.map(k => <th key={k}>{k}</th>)}
              </tr>
            </thead>
            <tbody>
              {result.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'even' : 'odd'}>
                  {keys.map(k => <td key={k}>{row[k]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return <pre className="result-text">{JSON.stringify(result, null, 2)}</pre>;
  };

  const getTableColumns = (table) => {
    if (!table.data || table.data.length === 0) return '';
    return Object.keys(table.data[0]).join(', ');
  };

  const handleContinue = () => {
    if (onNextLevel) {
      const hasNextLevel = onNextLevel(levelId);
      if (hasNextLevel) {
        setWin(false);
        // Уровень уже переключен в App.js
      } else {
        // Все уровни завершены, возвращаемся в меню
        setWin(false);
      }
    } else {
      // Старая логика - просто закрыть окно победы
      setWin(false);
    }
  };

  // Проверяем есть ли следующий уровень для отображения правильного текста кнопки
  const hasNextLevel = () => {
    if (!onNextLevel) return false;
    
    const [chapter, level] = levelId.split('_');
    const levelNumber = parseInt(level.replace('level', ''));
    const nextLevelInChapter = `${chapter}_level${levelNumber + 1}`;
    
    // Доступные уровни (можно получить из props или контекста)
    const availableLevels = [
      'chapter1_level1', 'chapter1_level2', 'chapter1_level3',
      'chapter2_level1'
    ];
    
    return availableLevels.includes(nextLevelInChapter) || 
           (chapter === 'chapter1' && availableLevels.includes('chapter2_level1'));
  };

  // Показываем индикатор загрузки, если таблицы еще не загружены
  if (tablesData.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '1.5em',
        fontFamily: 'Consolas, monospace'
      }}>
        Загрузка уровня...
      </div>
    );
  }

  return (
    <div className="container">
      {/* Верхние кнопки */}
      <div className="top-buttons">
        <button className="clear-btn animated-btn" onClick={onBack}>← Назад</button>
        <button className="clear-btn animated-btn" onClick={() => setShowTask(true)}>📋 Задача</button>
        <button className="clear-btn animated-btn" onClick={() => setShowIntro(true)}>📖 Вводные данные</button>
        {victoryConditions?.hints && (
          <button className="clear-btn animated-btn" onClick={() => setShowHints(true)}>💡 Подсказки</button>
        )}
      </div>
      
      {/* Модальное окно задачи */}
      {showTask && (
        <div className="modal-overlay" onClick={() => setShowTask(false)}>
          <div className="modal-content task-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowTask(false)}>✕</button>
            <h3>🎯 Задача</h3>
            <div className="modal-text">{task}</div>
            {victoryConditions?.description && (
              <div className="victory-description">
                <h4>Цель:</h4>
                <p>{victoryConditions.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Модальное окно подсказок */}
      {showHints && victoryConditions?.hints && (
        <div className="modal-overlay" onClick={() => setShowHints(false)}>
          <div className="modal-content hints-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowHints(false)}>✕</button>
            <h3>💡 Подсказки</h3>
            <div className="hints-list">
              {victoryConditions.hints.map((hint, index) => (
                <div key={index} className="hint-item">
                  <span className="hint-number">{index + 1}.</span>
                  <span className="hint-text">{hint}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно вводных данных */}
      {showIntro && (
        <div className="modal-overlay" onClick={() => setShowIntro(false)}>
          <div className="modal-content intro-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowIntro(false)}>✕</button>
            <h3>📖 Вводные данные</h3>
            <div className="modal-text">{briefing}</div>
            {image && <img src={image} alt="Вводные данные" className="intro-image" />}
          </div>
        </div>
      )}
      
      {/* Окно победы */}
      {win && (
        <div className="victory-overlay">
          <div className="victory-content">
            <div className="victory-icon">🎉</div>
            <div className="victory-title">ПОБЕДА!</div>
            <div className="victory-text">
              {victoryConditions?.description ? (
                <span>Цель достигнута: {victoryConditions.description}</span>
              ) : (
                <span>Вы нашли: <span className="victory-name">{legacyVictoryText}</span></span>
              )}
            </div>
            {completedBonuses.length > 0 && (
              <div className="bonus-info">
                🌟 Бонусы выполнены: {completedBonuses.length}
              </div>
            )}
            <div className="victory-buttons">
              <button className="victory-btn" onClick={handleContinue}>
                {hasNextLevel() ? 'Следующий уровень' : 'Завершить'}
              </button>
              <button className="victory-btn secondary" onClick={() => setWin(false)}>
                Остаться здесь
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Уведомление о бонусе */}
      {bonusWin && (
        <div className="bonus-notification">
          <div className="bonus-content">
            <div className="bonus-icon">🌟</div>
            <div className="bonus-text">Бонус выполнен!</div>
          </div>
        </div>
      )}
      
      <div className="tables-section animated-section">
        <h2>AVAILABLE TABLES</h2>
        <div className="tables-list">
          {tablesData.map((table) => (
            <div key={table.name} className="table-item">
              <button
                className={`table-btn${selectedTable?.name === table.name ? ' selected' : ''}`}
                onClick={() => setSelectedTable(table)}
                onMouseEnter={() => setHoveredTable(table.name)}
                onMouseLeave={() => setHoveredTable(null)}
              >
                {table.name}
              </button>
              {hoveredTable === table.name && (
                <div className="tooltip">
                  {getTableColumns(table)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="data-section animated-section">
        <h2>DATA OUTPUT</h2>
        <button className="clear-btn" onClick={() => setHistory([])}>🗑️ Очистить историю</button>
        <div className="data-output" ref={dataOutputRef}>
          {history.length === 0 && <div className="empty-state">Нет данных. Выполните SQL-запрос.</div>}
          {history.map((item, idx) => (
            <div key={idx} className="query-result">
              <div className="query-label">
                <span className="query-number">#{idx+1}</span> 
                <span className="query-text">{item.query}</span>
              </div>
              <div className="result-content">
                {renderResult(item.result, item.error)}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="notes-section animated-section">
        <h2>NOTES</h2>
        <textarea 
          className="notes-area" 
          placeholder="Ваши заметки и выводы..."
          defaultValue=""
        />
      </div>
      
      <div className="sql-section">
        <h2>SQL QUERY</h2>
        <div className="sql-input-container">
          <div className="sql-input-wrapper">
            <textarea
              ref={sqlInputRef}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              placeholder="Введите SQL-запрос..."
              className="sql-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleRun();
                }
              }}
            />
            {sql === '' && (
              <div className="caret-effect" style={{ opacity: caretVisible ? 1 : 0 }}>|</div>
            )}
          </div>
          <button className="run-btn animated-btn" onClick={handleRun} title="Выполнить (Ctrl+Enter)">
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameModule; 