import React from 'react';

const ModalIntro = ({ show, onClose, briefing, image }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content intro-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3>📖 Вводные данные</h3>
        <div className="modal-text">{briefing}</div>
        {image && <img src={image} alt="Вводные данные" className="intro-image" />}
      </div>
    </div>
  );
};

export default ModalIntro; 