import React, { useState } from 'react';
import { AuthAPI } from '../../lib/supabase';
import './AuthForm.css';

const AuthForm = ({ onSuccess, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email обязателен');
      return false;
    }
    
    if (!formData.email.includes('@')) {
      setError('Введите корректный email');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return false;
    }

    if (!isLogin) {
      if (!formData.username.trim()) {
        setError('Имя пользователя обязательно');
        return false;
      }

      if (formData.username.length < 3) {
        setError('Имя пользователя должно содержать минимум 3 символа');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Пароли не совпадают');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const result = await AuthAPI.signIn(formData.email, formData.password);
        const user = await AuthAPI.getCurrentUser();
        onSuccess(user);
      } else {
        await AuthAPI.signUp(formData.email, formData.password, formData.username);
        setError('✅ Регистрация успешна! Проверьте email для подтверждения аккаунта, затем войдите в систему.');
        
        // Сбрасываем форму и переключаемся на вход
        setFormData({
          email: formData.email, // Оставляем email для удобства
          password: '',
          username: '',
          confirmPassword: ''
        });
        
        // Переключаемся на форму входа через 3 секунды
        setTimeout(() => {
          setIsLogin(true);
          setError('');
        }, 3000);
      }
    } catch (error) {
      console.error('Auth error:', error);
      
      if (error.message.includes('Invalid login credentials')) {
        setError('Неверный email или пароль');
      } else if (error.message.includes('User already registered')) {
        setError('Пользователь с таким email уже существует');
      } else if (error.message.includes('duplicate key value')) {
        setError('Имя пользователя уже занято');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Подтвердите email перед входом в систему');
      } else {
        setError('Произошла ошибка: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      email: '',
      password: '',
      username: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="auth-form">
      <div className="auth-container">
        <button className="back-button" onClick={onBack}>
          ← Главное меню
        </button>

        <div className="auth-card">
          <div className="auth-header">
            <h1>{isLogin ? '🔐 Вход' : '📝 Регистрация'}</h1>
            <p>
              {isLogin 
                ? 'Войдите в свой аккаунт для доступа к рейтинговым задачам'
                : 'Создайте аккаунт для участия в соревнованиях'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form-fields">
            <div className="field-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                required
              />
            </div>

            {!isLogin && (
              <div className="field-group">
                <label htmlFor="username">Имя пользователя</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Уникальное имя"
                  required
                />
              </div>
            )}

            <div className="field-group">
              <label htmlFor="password">Пароль</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Минимум 6 символов"
                required
              />
            </div>

            {!isLogin && (
              <div className="field-group">
                <label htmlFor="confirmPassword">Подтвердите пароль</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Повторите пароль"
                  required
                />
              </div>
            )}

            {error && (
              <div className={`error-message ${error.includes('✅') ? 'success' : ''}`}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? '⏳ Обработка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
            </button>
          </form>

          <div className="auth-switch">
            <p>
              {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
              <button 
                type="button" 
                className="switch-button"
                onClick={switchMode}
              >
                {isLogin ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm; 