import React from 'react';

const ModalHints = ({ show, onClose, hints }) => {
  if (!show || !hints) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content hints-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3>💡 Подсказки</h3>
        <div className="hints-list">
          {hints.map((hint, index) => (
            <div key={index} className="hint-item">
              <span className="hint-number">{index + 1}.</span>
              <span className="hint-text">{hint}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModalHints; 