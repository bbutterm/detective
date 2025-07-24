import { useMemo, useEffect } from 'react';
import alasql from 'alasql';

const useTablesData = (levelId) => {
  // Динамическая загрузка таблиц в зависимости от levelId
  const tablesData = useMemo(() => {
    try {
      // Извлекаем путь к модулю из levelId (например, chapter1_level2)
      const [chapter, level] = levelId.split('_');
      const modulePath = `${chapter}/${level}`;
      
      // Загружаем все JSON файлы из папки tables модуля
      const tablesContext = require.context('../../modules/', true, /\.json$/);
      
      return tablesContext.keys()
        .filter(key => key.includes(`/${modulePath}/tables/`))
        .map((key) => {
          const name = key.split('/').pop().replace('.json', '');
          const data = tablesContext(key);
          return { name, data };
        });
    } catch (error) {
      console.error('Ошибка загрузки таблиц:', error);
      return [];
    }
  }, [levelId]);

  // Инициализация alasql
  useEffect(() => {
    if (tablesData.length === 0) return;
    
    alasql('DROP DATABASE IF EXISTS adhub');
    alasql('CREATE DATABASE adhub');
    alasql('USE adhub');
    tablesData.forEach(t => {
      alasql('CREATE TABLE ' + t.name);
      alasql.tables[t.name].data = t.data;
    });
  }, [tablesData]);

  return tablesData;
};

export default useTablesData; 