import React from 'react';

const DataOutput = ({ history, onClearHistory, dataOutputRef }) => {
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

  return (
    <div className="data-section animated-section">
      <h2>DATA OUTPUT</h2>
      <button className="clear-btn" onClick={onClearHistory}>🗑️ Очистить историю</button>
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
  );
};

export default DataOutput; 