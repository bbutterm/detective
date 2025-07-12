import './App.css';
import { useState, useEffect, useRef } from 'react';
import alasql from 'alasql';

// Глобальная переменная для победного текста
const WIN_TEXT = 'Роман Глухов';

// Текст задачи и вводных данных
const TASK_TEXT = 'Найти имя преступника, написав SQL-запрос, который выведет только его имя.';
const INTRO_TEXT = 'В музее произошло преступление — пропала антикварная ваза с постамента в главном зале.\n\nУ вас есть доступ к базе данных охраны, которая содержит:\n- списки посетителей,\n- записи с камер наблюдения,\n- расписание охранников,\n- метки времени входа/выхода.';
const INTRO_IMAGE = 'level1.png';

// Автоматически подгружаем все json из папки tables
const tablesContext = require.context('./tables', false, /\.json$/);
const tables = tablesContext.keys().map((key) => {
  const name = key.replace('./', '').replace('.json', '');
  const data = tablesContext(key);
  return { name, data };
});

function App() {
  const [selectedTable, setSelectedTable] = useState(tables[0]);
  const [sql, setSql] = useState('');
  const [error, setError] = useState('');
  const [hoveredTable, setHoveredTable] = useState(null);
  const [history, setHistory] = useState([]); // [{query, result, error}]
  const dataOutputRef = useRef(null);
  const [win, setWin] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    alasql('DROP DATABASE IF EXISTS adhub');
    alasql('CREATE DATABASE adhub');
    alasql('USE adhub');
    tables.forEach(t => {
      alasql('CREATE TABLE ' + t.name);
      alasql.tables[t.name].data = t.data;
    });
  }, []);

  useEffect(() => {
    if (dataOutputRef.current) {
      dataOutputRef.current.scrollTop = dataOutputRef.current.scrollHeight;
    }
    // Проверка на победу
    for (const item of history) {
      if (item.result && containsWinText(item.result)) {
        setWin(true);
        break;
      }
    }
  }, [history]);

  const containsWinText = (result) => {
    if (typeof result === 'string') return result.includes(WIN_TEXT);
    if (Array.isArray(result)) {
      return result.some(row =>
        typeof row === 'string' && row.includes(WIN_TEXT) ||
        typeof row === 'object' && Object.values(row).some(val => String(val).includes(WIN_TEXT))
      );
    }
    if (typeof result === 'object' && result !== null) {
      return Object.values(result).some(val => String(val).includes(WIN_TEXT));
    }
    return false;
  };

  const handleRun = () => {
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
  };

  const renderResult = (result, error) => {
    if (error) return <div style={{color:'red'}}>{error}</div>;
    if (!result) return <div style={{color:'#888'}}>Нет данных.</div>;
    if (Array.isArray(result) && result.length > 0 && typeof result[0] === 'object') {
      const keys = Object.keys(result[0]);
      return (
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:'1em'}}>
          <thead>
            <tr>
              {keys.map(k => <th key={k} style={{border:'1.5px solid #222', padding:'7px 10px', background:'#fff'}}>{k}</th>)}
            </tr>
          </thead>
          <tbody>
            {result.map((row, i) => (
              <tr key={i}>
                {keys.map(k => <td key={k} style={{border:'1.5px solid #222', padding:'7px 10px'}}>{row[k]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    return <pre style={{margin:0, fontSize:'1em'}}>{JSON.stringify(result, null, 2)}</pre>;
  };

  const getTableColumns = (table) => {
    if (!table.data || table.data.length === 0) return '';
    return Object.keys(table.data[0]).join(', ');
  };

  return (
    <div className="container">
      {/* Верхние кнопки */}
      <div style={{position:'fixed', top:24, left:0, width:'100vw', display:'flex', justifyContent:'center', gap:24, zIndex:100}}>
        <button className="clear-btn" onClick={() => alert('Выход в меню (заглушка)')}>Назад</button>
        <button className="clear-btn" onClick={() => setShowTask(true)}>Задача</button>
        <button className="clear-btn" onClick={() => setShowIntro(true)}>Вводные данные</button>
      </div>
      {/* Модальное окно задачи */}
      {showTask && (
        <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(255,255,255,0.97)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{background:'#fff', border:'2px solid #222', borderRadius:16, padding:36, minWidth:320, fontSize:'1.3em', textAlign:'center', position:'relative'}}>
            <button onClick={() => setShowTask(false)} style={{position:'absolute', top:10, right:16, fontSize:'1.2em', border:'none', background:'none', cursor:'pointer'}}>✕</button>
            {TASK_TEXT}
          </div>
        </div>
      )}
      {/* Модальное окно вводных данных */}
      {showIntro && (
        <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(255,255,255,0.97)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{background:'#fff', border:'2px solid #222', borderRadius:20, padding:48, minWidth:400, maxWidth:600, fontSize:'1.18em', textAlign:'center', position:'relative'}}>
            <button onClick={() => setShowIntro(false)} style={{position:'absolute', top:10, right:16, fontSize:'1.2em', border:'none', background:'none', cursor:'pointer'}}>✕</button>
            <div style={{marginBottom:24, whiteSpace:'pre-line'}}>{INTRO_TEXT}</div>
            <img src={INTRO_IMAGE} alt="Вводные данные" style={{maxWidth:'95%', height:'auto', borderRadius:18, border:'2.5px solid #222', marginTop:10}} />
          </div>
        </div>
      )}
      {win && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(255,255,255,0.95)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          fontSize: '2.5em',
          fontWeight: 'bold',
          color: '#222',
          letterSpacing: '2px',
        }}>
          Победа!<br/>Вы нашли: <span style={{color:'#0a0'}}>{WIN_TEXT}</span>
        </div>
      )}
      <div className="tables-section">
        <h2>AVAILABLE TABLES</h2>
        <div className="tables-list">
          {tables.map((table) => (
            <div key={table.name} style={{position:'relative'}}>
              <button
                className={`table-btn${selectedTable.name === table.name ? ' selected' : ''}`}
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
      <div className="data-section">
        <h2>DATA</h2>
        <button className="clear-btn" onClick={() => setHistory([])}>Очистить историю</button>
        <div className="data-output" ref={dataOutputRef}>
          {history.length === 0 && <div style={{color:'#888'}}>Нет данных. Выполните SQL-запрос.</div>}
          {history.map((item, idx) => (
            <div key={idx} style={{borderBottom:'1px solid #eee', paddingBottom:8}}>
              <div className="query-label">
                <b>#{idx+1}</b> <span>{item.query}</span>
              </div>
              {item.error
                ? <div className="error">{item.error}</div>
                : renderResult(item.result, null)
              }
            </div>
          ))}
        </div>
      </div>
      <div className="notes-section">
        <h2>USER NOTES</h2>
        <textarea className="notes-area" placeholder="Ваши заметки..." />
      </div>
      <div className="input-section">
        <input
          className="sql-input"
          placeholder="USER INPUT"
          value={sql}
          onChange={e => setSql(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleRun(); }}
        />
        <button className="run-btn" onClick={handleRun}>▶</button>
      </div>
    </div>
  );
}

export default App;
