import React from 'react';

const SqlInput = ({ 
  sql, 
  setSql, 
  onRun, 
  sqlInputRef, 
  caretVisible 
}) => {
  return (
    <div className="sql-section">
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
                onRun();
              }
            }}
          />
          {sql === '' && (
            <div className="caret-effect" style={{ opacity: caretVisible ? 1 : 0 }}>|</div>
          )}
        </div>
        <button className="run-btn animated-btn" onClick={onRun} title="Выполнить (Ctrl+Enter)">
          ▶
        </button>
      </div>
    </div>
  );
};

export default SqlInput; 