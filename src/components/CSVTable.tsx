import React, { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';

interface CSVTableProps {
  data: {
    headers: string[];
    rows: (string | number)[][];
  };
  setData: React.Dispatch<React.SetStateAction<{
    headers: string[];
    rows: (string | number)[][];
  } | null>>;
  searchTerm: string;
}

const CSVTable: React.FC<CSVTableProps> = ({ data, setData, searchTerm }) => {
  const [rows, setRows] = useState(data.rows);
  const [totalDifference, setTotalDifference] = useState(0);
  const [filteredRows, setFilteredRows] = useState(data.rows);

  useEffect(() => {
    const updatedRows = data.rows.map(row => {
      const stockUds = parseNumber(row[4]);
      const stockReal = parseNumber(row[row.length - 3]);
      const pvpPrecio = parseNumber(row[7]);
      const diferenciaUds = stockReal - stockUds;
      const diferenciaEuros = diferenciaUds * pvpPrecio;
      
      return [
        ...row.slice(0, -3),
        stockReal,
        diferenciaUds,
        diferenciaEuros.toFixed(2)
      ];
    });

    setRows(updatedRows);
    calculateTotalDifference(updatedRows);
  }, [data.rows]);

  useEffect(() => {
    const filtered = rows.filter(row => 
      row[0].toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      row[1].toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRows(filtered);
    calculateTotalDifference(filtered);
  }, [rows, searchTerm]);

  const parseNumber = (value: string | number): number => {
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value.toString().replace(',', '.').replace('€', '').trim());
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleStockRealChange = (rowIndex: number, value: number) => {
    const newRows = rows.map((row, index) => {
      if (index !== rowIndex) return row;

      const stockUds = parseNumber(row[4]);
      const pvpPrecio = parseNumber(row[7]);
      
      const diferenciaUds = value - stockUds;
      const diferenciaEuros = diferenciaUds * pvpPrecio;
      
      return [
        ...row.slice(0, -3),
        value,
        diferenciaUds,
        diferenciaEuros.toFixed(2)
      ];
    });
    
    setRows(newRows);
    calculateTotalDifference(newRows);
    setData({ ...data, rows: newRows });
  };

  const calculateTotalDifference = (currentRows: (string | number)[][]) => {
    const total = currentRows.reduce((sum, row) => sum + parseNumber(row[row.length - 1]), 0);
    setTotalDifference(total);
  };

  const formatCell = (value: string | number): string => {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return value.toString();
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            {data.headers.map((header, index) => (
              <th key={index} className="py-2 px-4 border-b">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-50' : ''}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="py-2 px-4 border-b">
                  {cellIndex === row.length - 3 ? (
                    <div className="flex items-center">
                      <button
                        onClick={() => handleStockRealChange(rowIndex, parseNumber(cell) - 1)}
                        className="p-1 bg-red-500 text-white rounded-l"
                      >
                        <Minus size={16} />
                      </button>
                      <input
                        type="number"
                        value={cell}
                        onChange={(e) => handleStockRealChange(rowIndex, parseNumber(e.target.value))}
                        className="w-16 text-center border-t border-b"
                      />
                      <button
                        onClick={() => handleStockRealChange(rowIndex, parseNumber(cell) + 1)}
                        className="p-1 bg-green-500 text-white rounded-r"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ) : (
                    formatCell(cell)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-bold">
            <td colSpan={data.headers.length - 1} className="py-2 px-4 text-right">
              Diferencia Total €:
            </td>
            <td className="py-2 px-4">{totalDifference.toFixed(2)} €</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default CSVTable;