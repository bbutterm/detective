import React from 'react';
import TableTooltipPortal from './TableTooltipPortal';

const TablesList = ({ 
  tablesData, 
  selectedTable, 
  onTableSelect,
  hoveredTable,
  hoveredTableData,
  hoveredTableRect,
  onTableHover,
  onTableLeave
}) => {
  return (
    <div className="tables-section animated-section">
      <h2>AVAILABLE TABLES</h2>
      <div className="tables-list">
        {tablesData.map((table) => (
          <div key={table.name} className="table-item">
            <button
              className={`table-btn${selectedTable?.name === table.name ? ' selected' : ''}`}
              onClick={() => onTableSelect(table)}
              onMouseEnter={e => onTableHover(table, e.currentTarget.getBoundingClientRect())}
              onMouseLeave={onTableLeave}
            >
              {table.name}
            </button>
          </div>
        ))}
        <TableTooltipPortal
          visible={!!hoveredTable}
          rect={hoveredTableRect}
          table={hoveredTableData}
          onClose={onTableLeave}
        />
      </div>
    </div>
  );
};

export default TablesList; 