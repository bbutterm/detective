import React from 'react';

const Notes = () => {
  return (
    <div className="notes-section animated-section">
      <h2>NOTES</h2>
      <textarea 
        className="notes-area" 
        placeholder="Ваши заметки и выводы..."
        defaultValue=""
      />
    </div>
  );
};

export default Notes; 