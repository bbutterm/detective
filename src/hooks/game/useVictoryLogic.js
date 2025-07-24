import { useCallback } from 'react';

const useVictoryLogic = (victoryConditions, legacyVictoryText, bonusConditions) => {
  // Универсальная функция оценки условий
  const evaluateCondition = useCallback((queryItem, condition) => {
    const { type, target, query, requiredValue, requiredInQuery, requiredRowCount } = condition;
    const result = queryItem.result;

    switch (type) {
      case 'contains_name':
        return containsWinText(result, target);
      
      case 'row_count':
        return Array.isArray(result) && result.length === target;
      
      case 'row_count_with_value':
        // Проверяем что результат содержит ровно target строк И содержит requiredValue
        if (!Array.isArray(result) || result.length !== target) {
          return false;
        }
        // Дополнительно проверяем что в результате есть требуемое значение
        return result.some(row => 
          typeof row === 'object' && 
          Object.values(row).some(val => String(val).includes(requiredValue))
        );
      
      case 'query_contains_and_result':
        // Проверяем что запрос содержит нужное ключевое слово (или слова)
        const queryUpperCase = queryItem.query.toUpperCase();
        if (requiredInQuery) {
          if (Array.isArray(requiredInQuery)) {
            // Если массив - проверяем что все ключевые слова присутствуют
            const hasAllKeywords = requiredInQuery.every(keyword => 
              queryUpperCase.includes(keyword.toUpperCase())
            );
            if (!hasAllKeywords) {
              return false;
            }
          } else {
            // Если строка - проверяем одно ключевое слово
            if (!queryUpperCase.includes(requiredInQuery.toUpperCase())) {
              return false;
            }
          }
        }
        
        // Проверяем количество строк в результате
        if (!Array.isArray(result) || result.length !== requiredRowCount) {
          return false;
        }
        
        // Проверяем что результат содержит нужное значение
        if (requiredValue) {
          return result.some(row => 
            typeof row === 'object' && 
            Object.values(row).some(val => String(val).includes(requiredValue))
          );
        }
        
        return true;
      
      case 'specific_query':
        // Проверяем точное соответствие запроса (без учета пробелов и регистра)
        const normalizedQuery = queryItem.query.replace(/\s+/g, ' ').trim().toLowerCase();
        const normalizedTarget = query.replace(/\s+/g, ' ').trim().toLowerCase();
        return normalizedQuery === normalizedTarget;
      
      case 'contains_value':
        if (Array.isArray(result)) {
          return result.some(row => 
            typeof row === 'object' && 
            Object.values(row).some(val => String(val).includes(target))
          );
        }
        return false;
      
      case 'column_exists':
        if (Array.isArray(result) && result.length > 0) {
          return Object.keys(result[0]).includes(target);
        }
        return false;
      
      case 'custom_function':
        // Для будущих сложных условий
        if (typeof condition.evaluator === 'function') {
          return condition.evaluator(result, queryItem.query);
        }
        return false;
      
      default:
        return false;
    }
  }, []);

  // Старая функция для обратной совместимости
  const containsWinText = useCallback((result, targetText) => {
    if (typeof result === 'string') return result.includes(targetText);
    if (Array.isArray(result)) {
      return result.some(row =>
        typeof row === 'string' && row.includes(targetText) ||
        typeof row === 'object' && Object.values(row).some(val => String(val).includes(targetText))
      );
    }
    if (typeof result === 'object' && result !== null) {
      return Object.values(result).some(val => String(val).includes(targetText));
    }
    return false;
  }, []);

  // Продвинутая проверка условий победы
  const checkVictoryCondition = useCallback((queryItem) => {
    if (!queryItem.result || queryItem.error) return false;

    // Используем новые условия победы если они есть
    if (victoryConditions) {
      return evaluateCondition(queryItem, victoryConditions);
    }
    
    // Обратная совместимость со старым форматом
    if (legacyVictoryText) {
      return containsWinText(queryItem.result, legacyVictoryText);
    }

    return false;
  }, [victoryConditions, legacyVictoryText, evaluateCondition, containsWinText]);

  // Проверка бонусных условий
  const checkBonusCondition = useCallback((queryItem, bonusCondition) => {
    if (!queryItem.result || queryItem.error) return false;
    return evaluateCondition(queryItem, bonusCondition);
  }, [evaluateCondition]);

  return {
    checkVictoryCondition,
    checkBonusCondition
  };
};

export default useVictoryLogic; 