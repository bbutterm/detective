import React from 'react';

const VictoryOverlay = ({ 
  show, 
  onContinue, 
  onStayHere, 
  victoryConditions, 
  legacyVictoryText, 
  completedBonuses, 
  hasNextLevel 
}) => {
  if (!show) return null;

  return (
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
          <button className="victory-btn" onClick={onContinue}>
            {hasNextLevel ? 'Следующий уровень' : 'Завершить'}
          </button>
          <button className="victory-btn secondary" onClick={onStayHere}>
            Остаться здесь
          </button>
        </div>
      </div>
    </div>
  );
};

export default VictoryOverlay; 