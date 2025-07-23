import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TaskAPI } from '../../lib/supabase';
import alasql from 'alasql';
import './TaskSolver.css';

const TaskSolver = ({ task, user, onComplete, onBack }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  const [taskData, setTaskData] = useState(null);
  const [hoveredTable, setHoveredTable] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [caretVisible, setCaretVisible] = useState(true);
  const [win, setWin] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const dataOutputRef = useRef(null);
  const sqlInputRef = useRef(null);

  // Эффект каретки
  useEffect(() => {
    const interval = setInterval(() => {
      setCaretVisible(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadTaskData();
  }, [task.id]);

  useEffect(() => {
    if (dataOutputRef.current) {
      dataOutputRef.current.scrollTop = dataOutputRef.current.scrollHeight;
    }
    // Проверка на победу
    for (const item of history) {
      if (item.result && !item.error && checkSolution(item)) {
        if (!win) setWin(true);
        break;
      }
    }
  }, [history, win]);

  const loadTaskData = async () => {
    try {
      // Загружаем данные задачи из Supabase
      const taskDetail = await TaskAPI.getTask(task.id);
      
      if (taskDetail) {
        const formattedData = {
          id: taskDetail.id,
          title: taskDetail.title,
          description: taskDetail.description,
          tables: taskDetail.tables_data,
          expected_result: taskDetail.expected_result,
          hints: taskDetail.hints || [],
          solution: taskDetail.solution
        };
        setTaskData(formattedData);
        setupTables(formattedData.tables);
        
        // Устанавливаем первую таблицу как выбранную
        const tablesArray = Object.entries(formattedData.tables).map(([name, data]) => ({ name, data }));
        if (tablesArray.length > 0) {
          setSelectedTable(tablesArray[0]);
        }
      } else {
        // Fallback к локальным файлам
        const taskModule = await import(`../../data/rating-tasks/task_${task.id}.json`);
        setTaskData(taskModule.default);
        setupTables(taskModule.default.tables);
        
        // Устанавливаем первую таблицу как выбранную
        const tablesArray = Object.entries(taskModule.default.tables).map(([name, data]) => ({ name, data }));
        if (tablesArray.length > 0) {
          setSelectedTable(tablesArray[0]);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки задачи:', error);
      // Последняя попытка - локальные файлы
      try {
        const taskModule = await import(`../../data/rating-tasks/task_${task.id}.json`);
        setTaskData(taskModule.default);
        setupTables(taskModule.default.tables);
        
        // Устанавливаем первую таблицу как выбранную
        const tablesArray = Object.entries(taskModule.default.tables).map(([name, data]) => ({ name, data }));
        if (tablesArray.length > 0) {
          setSelectedTable(tablesArray[0]);
        }
      } catch (localError) {
        setError('Не удалось загрузить данные задачи');
      }
    }
  };

  const setupTables = (tables) => {
    // Очищаем предыдущие таблицы
    Object.keys(tables).forEach(tableName => {
      try {
        alasql(`DROP TABLE IF EXISTS ${tableName}`);
      } catch (e) {
        // Игнорируем ошибки при удалении несуществующих таблиц
      }
    });

    // Создаем новые таблицы
    Object.entries(tables).forEach(([tableName, rows]) => {
      if (rows.length > 0) {
        const columns = Object.keys(rows[0]);
        const columnDefs = columns.map(col => {
          const sampleValue = rows[0][col];
          const type = typeof sampleValue === 'number' ? 'INT' : 'STRING';
          return `${col} ${type}`;
        }).join(', ');

        alasql(`CREATE TABLE ${tableName} (${columnDefs})`);
        
        rows.forEach(row => {
          const values = columns.map(col => {
            const value = row[col];
            return typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value;
          }).join(', ');
          alasql(`INSERT INTO ${tableName} VALUES (${values})`);
        });
      }
    });
  };

  const validateSQL = (query) => {
    const forbidden = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'CREATE', 'ALTER'];
    const upperQuery = query.toUpperCase();
    return !forbidden.some(cmd => upperQuery.includes(cmd));
  };

  const executeQuery = useCallback(() => {
    if (!query.trim()) {
      setError('Введите SQL запрос');
      return;
    }

    if (!validateSQL(query)) {
      setHistory(prev => [
        ...prev,
        { query: query, result: null, error: 'Запрещены команды изменения данных (DROP, DELETE, UPDATE, INSERT, CREATE, ALTER)' }
      ]);
      setQuery('');
      return;
    }

    setLoading(true);
    setError('');

    let res = null;
    let err = '';
    try {
      res = alasql(query);
    } catch (e) {
      err = e.message;
    }
    
    setHistory(prev => [
      ...prev,
      { query: query, result: res, error: err }
    ]);
    setQuery('');
    setLoading(false);
  }, [query]);

  const checkSolution = (queryItem) => {
    if (!taskData || !taskData.expected_result || !queryItem.result || queryItem.error) return false;
    
    const isCorrect = JSON.stringify(queryItem.result) === JSON.stringify(taskData.expected_result);
    
    if (isCorrect) {
      // Сохраняем решение в базу
      if (user) {
        TaskAPI.saveSolution({
          user_id: user.id,
          task_id: task.id,
          query_text: queryItem.query,
          is_correct: true,
          time_taken: null // можно добавить таймер
        }).catch(error => {
          console.error('Ошибка сохранения решения:', error);
        });
      }
      
      setTimeout(() => {
        onComplete(task.id, true);
      }, 2000);
      
      return true;
    }
    
    return false;
  };

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

  const getTableColumns = (tableData) => {
    if (!tableData || tableData.length === 0) return '';
    return Object.keys(tableData[0]).join(', ');
  };

  const handleContinue = () => {
    setWin(false);
    if (onComplete) {
      onComplete(task.id, true);
    }
  };

  const showNextHint = () => {
    if (taskData && taskData.hints && currentHint < taskData.hints.length - 1) {
      setCurrentHint(currentHint + 1);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      executeQuery();
    }
  };

  if (!taskData) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '1.5em',
        fontFamily: 'Consolas, monospace'
      }}>
        Загрузка задачи...
      </div>
    );
  }

  // Преобразуем таблицы в формат как в кампании
  const tablesData = Object.entries(taskData.tables).map(([name, data]) => ({ name, data }));

  return (
    <div className="container">
      {/* Верхние кнопки */}
      <div className="top-buttons">
        <button className="clear-btn animated-btn" onClick={onBack}>← Назад</button>
        <button className="clear-btn animated-btn" onClick={() => setShowTask(true)}>📋 Задача</button>
        <button className="clear-btn animated-btn" onClick={() => setShowIntro(true)}>📖 Описание</button>
        {taskData.hints && taskData.hints.length > 0 && (
          <button className="clear-btn animated-btn" onClick={() => setShowHints(true)}>💡 Подсказки</button>
        )}
      </div>
      
      {/* Модальное окно задачи */}
      {showTask && (
        <div className="modal-overlay" onClick={() => setShowTask(false)}>
          <div className="modal-content task-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowTask(false)}>✕</button>
            <h3>🎯 Задача</h3>
            <div className="modal-text">{task.title}</div>
            <div className="task-tags" style={{textAlign: 'center', marginTop: '20px'}}>
              <span className="tag">{'⭐'.repeat(task.difficulty)}</span>
              <span className="tag">Автор: {task.creator}</span>
              {task.tags && task.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно подсказок */}
      {showHints && taskData.hints && (
        <div className="modal-overlay" onClick={() => setShowHints(false)}>
          <div className="modal-content hints-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowHints(false)}>✕</button>
            <h3>💡 Подсказки</h3>
            <div className="hints-list">
              {taskData.hints.slice(0, currentHint + 1).map((hint, index) => (
                <div key={index} className="hint-item">
                  <span className="hint-number">{index + 1}</span>
                  <span className="hint-text">{hint}</span>
                </div>
              ))}
            </div>
            {currentHint < taskData.hints.length - 1 && (
              <div style={{textAlign: 'center', marginTop: '16px'}}>
                <button className="clear-btn" onClick={showNextHint}>
                  Следующая подсказка
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Модальное окно описания */}
      {showIntro && (
        <div className="modal-overlay" onClick={() => setShowIntro(false)}>
          <div className="modal-content intro-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowIntro(false)}>✕</button>
            <h3>📖 Описание задачи</h3>
            <div className="modal-text">{taskData.description}</div>
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
              Задача решена правильно!
            </div>
            <div className="victory-buttons">
              <button className="victory-btn" onClick={handleContinue}>
                Продолжить
              </button>
              <button className="victory-btn secondary" onClick={() => setWin(false)}>
                Остаться здесь
              </button>
            </div>
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
                  {getTableColumns(table.data)}
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
          {loading && <div className="empty-state">⏳ Выполнение SQL запроса...</div>}
          {history.length === 0 && !loading && <div className="empty-state">Нет данных. Выполните SQL-запрос.</div>}
          {history.map((item, idx) => (
            <div key={idx} className="query-result">
              <div className="query-label">
                <span className="query-number">#{idx+1}</span> 
                <span className="query-text">{item.query}</span>
              </div>
              <div className="result-content">
                {renderResult(item.result, item.error)}
                {!item.error && item.result && JSON.stringify(item.result) === JSON.stringify(taskData.expected_result) && (
                  <div className="result-text" style={{background: '#d4edda', color: '#155724', fontWeight: 'bold', marginTop: '8px'}}>
                    🎉 Отлично! Задача решена правильно!
                  </div>
                )}
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Введите SQL-запрос..."
              className="sql-input"
              onKeyDown={handleKeyPress}
            />
            {query === '' && (
              <div className="caret-effect" style={{ opacity: caretVisible ? 1 : 0 }}>|</div>
            )}
          </div>
          <button 
            className="run-btn animated-btn" 
            onClick={executeQuery} 
            disabled={loading}
            title="Выполнить (Ctrl+Enter)"
          >
            {loading ? '⏳' : '▶'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskSolver; 