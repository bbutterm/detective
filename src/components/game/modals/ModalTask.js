import React from 'react';

const ModalTask = ({ show, onClose, task, victoryConditions }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content task-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
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
  );
};

export default ModalTask; 