import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Search, BarChart } from 'lucide-react';
import CSVTable from './components/CSVTable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface CSVData {
  headers: string[];
  rows: (string | number)[][];
}

function App() {
  const [csvData, setCSVData] = useState<CSVData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const savedData = localStorage.getItem('csvData');
    if (savedData) {
      setCSVData(JSON.parse(savedData));
    }
  }, []);

  useEffect(() => {
    if (csvData) {
      localStorage.setItem('csvData', JSON.stringify(csvData));
    }
  }, [csvData]);

  const parseCSVLine = (line: string): string[] => {
    const values = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    return values;
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const lines = content.split('\n');
        const headers = parseCSVLine(lines[0]);
        const rows = lines.slice(1).map(line => parseCSVLine(line));

        headers.push('Stock Real', 'Diferencia Uds', 'Diferencia €');
        const newRows = rows.map(row => [...row, 0, 0, 0]);

        setCSVData({ headers, rows: newRows });
      };
      reader.readAsText(file);
    }
  }, []);

  const generatePDF = (data: CSVData) => {
    const doc = new jsPDF();
    doc.text('Informe de Barcode', 14, 15);
    doc.autoTable({
      head: [data.headers],
      body: data.rows,
      startY: 20,
    });
    doc.save('barcode_report.pdf');
  };

  const handleFinishBarcode = () => {
    if (window.confirm('¿Está seguro de que desea finalizar el barcode? Se generará un PDF y los datos se borrarán.')) {
      if (csvData) {
        generatePDF(csvData);
      }
      localStorage.removeItem('csvData');
      setCSVData(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-full mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Barcode</h1>
        <div className="mb-6 flex justify-between gap-4">
          <label htmlFor="csv-upload" className="flex-1">
            <div className="flex items-center justify-center p-4 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition duration-300">
              <Upload className="mr-2" />
              <span>Subir Archivo CSV</span>
            </div>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={handleFinishBarcode}
            className="flex-1 flex items-center justify-center p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300"
          >
            <BarChart className="mr-2" />
            <span>Finalizar Barcode</span>
          </button>
        </div>
        {csvData && (
          <div className="mb-6 relative">
            <input
              type="text"
              placeholder="Buscar por código o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        )}
        {csvData && <CSVTable data={csvData} setData={setCSVData} searchTerm={searchTerm} />}
      </div>
    </div>
  );
}

export default App;