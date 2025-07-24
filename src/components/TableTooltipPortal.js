import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './GameModule.css';

const TableTooltipPortal = ({ visible, rect, table, onClose }) => {
  const tooltipRef = useRef();

  useEffect(() => {
    if (!visible) return;
    const handleScroll = () => onClose();
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [visible, onClose]);

  // Показываем только если rect уже есть (нет дёргания)
  if (!visible || !rect || !table) return null;

  // Позиционируем tooltip справа от кнопки, по центру
  const style = {
    position: 'fixed',
    top: rect.top + rect.height / 2,
    left: rect.right + 16,
    transform: 'translateY(-50%)',
    zIndex: 9999,
    pointerEvents: 'none',
    opacity: 1,
    animation: 'tooltipFadeIn 0.18s cubic-bezier(0.4,0,0.2,1)',
  };

  // Получаем колонки
  const columns = table.data && table.data.length > 0 ? Object.keys(table.data[0]) : [];

  return ReactDOM.createPortal(
    <div className="tooltip" style={style} ref={tooltipRef}>
      <div className="table-structure">
        <div className="structure-title">📊 Структура таблицы {table.name}:</div>
        <div className="columns-list">
          {columns.length === 0 ? (
            <div className="column-item">Нет данных</div>
          ) : (
            columns.map((col, idx) => (
              <div className="column-item" key={idx}>📋 {col}</div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TableTooltipPortal; 