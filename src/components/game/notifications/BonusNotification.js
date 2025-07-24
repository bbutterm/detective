import React from 'react';

const BonusNotification = ({ show }) => {
  if (!show) return null;

  return (
    <div className="bonus-notification">
      <div className="bonus-content">
        <div className="bonus-icon">🌟</div>
        <div className="bonus-text">Бонус выполнен!</div>
      </div>
    </div>
  );
};

export default BonusNotification; 