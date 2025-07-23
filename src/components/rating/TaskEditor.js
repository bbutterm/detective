import React, { useState } from 'react';
import { TaskAPI } from '../../lib/supabase';
import './TaskEditor.css';

const TaskEditor = ({ user, onTaskCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 1,
    tags: [],
    solution: '',
    hints: ['']
  });
  
  const [tables, setTables] = useState({
    employees: [
      { id: 1, name: 'Иван Иванов', department: 'IT', salary: 100000 }
    ]
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTag, setCurrentTag] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleTagAdd = (e) => {
    e.preventDefault();
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleHintChange = (index, value) => {
    const newHints = [...formData.hints];
    newHints[index] = value;
    setFormData(prev => ({
      ...prev,
      hints: newHints
    }));
  };

  const addHint = () => {
    setFormData(prev => ({
      ...prev,
      hints: [...prev.hints, '']
    }));
  };

  const removeHint = (index) => {
    if (formData.hints.length > 1) {
      setFormData(prev => ({
        ...prev,
        hints: prev.hints.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Название задачи обязательно');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('Описание задачи обязательно');
      return;
    }
    
    if (!formData.solution.trim()) {
      setError('Правильное решение обязательно');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        difficulty: formData.difficulty,
        tags: formData.tags,
        tables_data: tables,
        solution: formData.solution,
        expected_result: [], // TODO: выполнить запрос для получения ожидаемого результата
        hints: formData.hints.filter(hint => hint.trim()),
        created_by: user.id,
        is_approved: false // требует модерации
      };

      const newTask = await TaskAPI.createTask(taskData);
      onTaskCreated(newTask);
    } catch (error) {
      console.error('Ошибка создания задачи:', error);
      setError('Произошла ошибка при создании задачи: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-editor">
      <div className="editor-header">
        <button className="back-button" onClick={onCancel}>
          ← Отмена
        </button>
        
        <div className="editor-title">
          <h1>✏️ Создание новой задачи</h1>
          <p>Создайте интересную SQL задачу для других пользователей</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="editor-form">
        <div className="form-section">
          <h2>📝 Основная информация</h2>
          
          <div className="field-group">
            <label htmlFor="title">Название задачи *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Краткое и понятное название"
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="description">Описание задачи *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Подробно опишите, что нужно сделать..."
              rows={4}
              required
            />
          </div>

          <div className="field-row">
            <div className="field-group">
              <label htmlFor="difficulty">Сложность</label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
              >
                <option value={1}>⭐ Легкая</option>
                <option value={2}>⭐⭐ Средняя</option>
                <option value={3}>⭐⭐⭐ Сложная</option>
                <option value={4}>⭐⭐⭐⭐ Очень сложная</option>
                <option value={5}>⭐⭐⭐⭐⭐ Экстремальная</option>
              </select>
            </div>
          </div>

          <div className="field-group">
            <label>Теги</label>
            <div className="tags-input">
              <div className="current-tags">
                {formData.tags.map(tag => (
                  <span key={tag} className="tag">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>×</button>
                  </span>
                ))}
              </div>
              <div className="add-tag">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  placeholder="Добавить тег..."
                  onKeyPress={(e) => e.key === 'Enter' && handleTagAdd(e)}
                />
                <button type="button" onClick={handleTagAdd}>
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>🗃️ Данные (упрощенно)</h2>
          <p>В текущей версии используется пример таблицы. В будущем можно будет загружать CSV файлы.</p>
          
          <div className="table-preview">
            <h3>employees</h3>
            <table>
              <thead>
                <tr>
                  <th>id</th>
                  <th>name</th>
                  <th>department</th>
                  <th>salary</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>Иван Иванов</td>
                  <td>IT</td>
                  <td>100000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="form-section">
          <h2>✅ Правильное решение</h2>
          
          <div className="field-group">
            <label htmlFor="solution">SQL запрос-решение *</label>
            <textarea
              id="solution"
              name="solution"
              value={formData.solution}
              onChange={handleInputChange}
              placeholder="SELECT * FROM employees WHERE..."
              rows={4}
              required
            />
            <small>Этот запрос будет использоваться для проверки правильности решений</small>
          </div>
        </div>

        <div className="form-section">
          <h2>💡 Подсказки</h2>
          
          {formData.hints.map((hint, index) => (
            <div key={index} className="hint-input">
              <input
                type="text"
                value={hint}
                onChange={(e) => handleHintChange(index, e.target.value)}
                placeholder={`Подсказка ${index + 1}...`}
              />
              {formData.hints.length > 1 && (
                <button type="button" onClick={() => removeHint(index)}>
                  Удалить
                </button>
              )}
            </div>
          ))}
          
          <button type="button" className="add-hint-btn" onClick={addHint}>
            + Добавить подсказку
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Отмена
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '⏳ Создание...' : '✅ Создать задачу'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskEditor; 