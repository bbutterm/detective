import React, { useState, useEffect, useRef, useCallback } from 'react';
import alasql from 'alasql';
import './GameModule.css';

// Импорт новых компонентов
import { 
  TablesList, 
  DataOutput, 
  Notes, 
  SqlInput, 
  TopButtons 
} from './game/ui';
import { 
  ModalTask, 
  ModalIntro, 
  ModalHints 
} from './game/modals';
import { 
  VictoryOverlay, 
  BonusNotification 
} from './game/notifications';

// Импорт хуков
import { 
  useTablesData, 
  useVictoryLogic 
} from '../hooks/game';

const GameModule = ({ config, onBack, onNextLevel, levelId }) => {
  const { title, description, task, briefing, tables, victoryConditions, bonusConditions, image } = config;
  
  // Поддержка старого формата для обратной совместимости
  const legacyVictoryText = config.victoryText;
  
  // Используем хуки
  const tablesData = useTablesData(levelId);
  const { checkVictoryCondition, checkBonusCondition } = useVictoryLogic(
    victoryConditions, 
    legacyVictoryText, 
    bonusConditions
  );

  // Состояния компонента
  const [selectedTable, setSelectedTable] = useState(null);
  const [sql, setSql] = useState('');
  const [error, setError] = useState('');
  const [hoveredTable, setHoveredTable] = useState(null);
  const [hoveredTableRect, setHoveredTableRect] = useState(null);
  const [hoveredTableData, setHoveredTableData] = useState(null);
  const [history, setHistory] = useState([]);
  const [win, setWin] = useState(false);
  const [bonusWin, setBonusWin] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [caretVisible, setCaretVisible] = useState(true);
  const [completedBonuses, setCompletedBonuses] = useState([]);

  // Refs
  const dataOutputRef = useRef(null);
  const sqlInputRef = useRef(null);

  // Эффект каретки
  useEffect(() => {
    const interval = setInterval(() => {
      setCaretVisible(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Обновляем selectedTable при изменении tablesData
  useEffect(() => {
    if (tablesData.length > 0 && !selectedTable) {
      setSelectedTable(tablesData[0]);
    }
  }, [tablesData, selectedTable]);

  // Проверка условий победы и бонусов
  useEffect(() => {
    if (dataOutputRef.current) {
      dataOutputRef.current.scrollTop = dataOutputRef.current.scrollHeight;
    }
    
    // Проверка на победу
    for (const item of history) {
      if (item.result && checkVictoryCondition(item)) {
        if (!win) setWin(true);
        break;
      }
      // Проверка бонусных условий
      if (bonusConditions) {
        bonusConditions.forEach((bonus, index) => {
          if (!completedBonuses.includes(index) && checkBonusCondition(item, bonus)) {
            setCompletedBonuses(prev => [...prev, index]);
            setBonusWin(true);
            setTimeout(() => setBonusWin(false), 3000);
          }
        });
      }
    }
  }, [history, win, completedBonuses, checkVictoryCondition, checkBonusCondition, bonusConditions]);

  // Валидация SQL
  const validateSQL = (query) => {
    const forbidden = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'CREATE', 'ALTER'];
    const upperQuery = query.toUpperCase();
    return !forbidden.some(cmd => upperQuery.includes(cmd));
  };

  // Выполнение SQL запроса
  const handleRun = useCallback(() => {
    if (!sql.trim()) return;
    
    if (!validateSQL(sql)) {
      setHistory(prev => [
        ...prev,
        { query: sql, result: null, error: 'Запрещены команды изменения данных (DROP, DELETE, UPDATE, INSERT, CREATE, ALTER)' }
      ]);
      setSql('');
      return;
    }

    setError('');
    let res = null;
    let err = '';
    try {
      res = alasql(sql);
    } catch (e) {
      err = e.message;
    }
    setHistory(prev => [
      ...prev,
      { query: sql, result: res, error: err }
    ]);
    setSql('');
  }, [sql]);

  // Обработчики для таблиц
  const handleTableSelect = (table) => {
    setSelectedTable(table);
  };

  const handleTableHover = (table, rect) => {
    setHoveredTable(table.name);
    setHoveredTableData(table);
    setHoveredTableRect(rect);
  };

  const handleTableLeave = () => {
    setHoveredTable(null);
    setHoveredTableData(null);
    setHoveredTableRect(null);
  };

  // Обработчик кнопки "Продолжить" в окне победы
  const handleContinue = () => {
    if (onNextLevel) {
      const hasNextLevel = onNextLevel(levelId);
      if (hasNextLevel) {
        setWin(false);
        // Уровень уже переключен в App.js
      } else {
        // Все уровни завершены, возвращаемся в меню
        setWin(false);
      }
    } else {
      // Старая логика - просто закрыть окно победы
      setWin(false);
    }
  };

  // Проверяем есть ли следующий уровень для отображения правильного текста кнопки
  const hasNextLevel = () => {
    if (!onNextLevel) return false;
    
    const [chapter, level] = levelId.split('_');
    const levelNumber = parseInt(level.replace('level', ''));
    const nextLevelInChapter = `${chapter}_level${levelNumber + 1}`;
    
    // Доступные уровни (можно получить из props или контекста)
    const availableLevels = [
      'chapter1_level1', 'chapter1_level2', 'chapter1_level3',
      'chapter2_level1'
    ];
    
    return availableLevels.includes(nextLevelInChapter) || 
           (chapter === 'chapter1' && availableLevels.includes('chapter2_level1'));
  };

  // Показываем индикатор загрузки, если таблицы еще не загружены
  if (tablesData.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '1.5em',
        fontFamily: 'Consolas, monospace'
      }}>
        Загрузка уровня...
      </div>
    );
  }

  return (
    <div className="container">
      <TopButtons
        onBack={onBack}
        onShowTask={() => setShowTask(true)}
        onShowIntro={() => setShowIntro(true)}
        onShowHints={() => setShowHints(true)}
        hasHints={!!victoryConditions?.hints}
      />
      
      <ModalTask
        show={showTask}
        onClose={() => setShowTask(false)}
        task={task}
        victoryConditions={victoryConditions}
      />
      
      <ModalIntro
        show={showIntro}
        onClose={() => setShowIntro(false)}
        briefing={briefing}
        image={image}
      />
      
      <ModalHints
        show={showHints}
        onClose={() => setShowHints(false)}
        hints={victoryConditions?.hints}
      />
      
      <VictoryOverlay
        show={win}
        onContinue={handleContinue}
        onStayHere={() => setWin(false)}
        victoryConditions={victoryConditions}
        legacyVictoryText={legacyVictoryText}
        completedBonuses={completedBonuses}
        hasNextLevel={hasNextLevel()}
      />
      
      <BonusNotification show={bonusWin} />
      
      <TablesList
        tablesData={tablesData}
        selectedTable={selectedTable}
        onTableSelect={handleTableSelect}
        hoveredTable={hoveredTable}
        hoveredTableData={hoveredTableData}
        hoveredTableRect={hoveredTableRect}
        onTableHover={handleTableHover}
        onTableLeave={handleTableLeave}
      />
      
      <DataOutput
        history={history}
        onClearHistory={() => setHistory([])}
        dataOutputRef={dataOutputRef}
      />
      
      <Notes />
      
      <SqlInput
        sql={sql}
        setSql={setSql}
        onRun={handleRun}
        sqlInputRef={sqlInputRef}
        caretVisible={caretVisible}
      />
    </div>
  );
};

export default GameModule; 