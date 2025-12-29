import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

interface ExportData {
  title: string;
  filename: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  summary?: { label: string; value: string }[];
}

export const exportToExcel = (exportData: ExportData) => {
  const { title, filename, columns, data, summary } = exportData;

  // Prepare worksheet data
  const wsData: (string | number)[][] = [];

  // Title row
  wsData.push([title]);
  wsData.push([`Diekspor pada: ${new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`]);
  wsData.push([]); // Empty row

  // Header row
  wsData.push(columns.map((col) => col.header));

  // Data rows
  data.forEach((row) => {
    wsData.push(columns.map((col) => {
      const value = row[col.key];
      if (typeof value === 'number') {
        return value;
      }
      if (value instanceof Date) {
        return value.toLocaleDateString('id-ID');
      }
      return String(value ?? '');
    }));
  });

  // Summary rows
  if (summary && summary.length > 0) {
    wsData.push([]); // Empty row
    summary.forEach((item) => {
      wsData.push([item.label, item.value]);
    });
  }

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const colWidths = columns.map((col) => ({ wch: col.width || 15 }));
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  // Generate file and trigger download
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportToPDF = (exportData: ExportData) => {
  const { title, filename, columns, data, summary } = exportData;

  // Create PDF document
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);

  // Export date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(
    `Diekspor pada: ${new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    14,
    28
  );

  // Reset text color
  doc.setTextColor(0);

  // Table headers
  const headers = columns.map((col) => col.header);

  // Table data
  const tableData = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      const isMoneyField = col.key.includes('amount') || col.key.includes('price') || col.key.includes('revenue') || col.key.includes('totalSpent') || col.key.includes('sales');
      if (typeof value === 'number' && isMoneyField) {
        return formatCurrencySimple(value);
      }
      if (value instanceof Date) {
        return value.toLocaleDateString('id-ID');
      }
      return String(value ?? '');
    })
  );

  // Add table
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 35,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [20, 184, 166],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Add summary if provided
  if (summary && summary.length > 0) {
    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 35;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Ringkasan:', 14, finalY + 15);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    summary.forEach((item, index) => {
      doc.text(`${item.label}: ${item.value}`, 14, finalY + 25 + index * 8);
    });
  }

  // Save PDF
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};

const formatCurrencySimple = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};
