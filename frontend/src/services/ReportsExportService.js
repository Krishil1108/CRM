import * as XLSX from 'xlsx';

class ReportsExportService {
  
  // Export analytics data to Excel
  static async exportToExcel(exportData, filename) {
    try {
      const workbook = XLSX.utils.book_new();
      
      if (exportData.type === 'clients') {
        this.addClientSheetsToWorkbook(workbook, exportData.data);
      } else if (exportData.type === 'inventory') {
        this.addInventorySheetsToWorkbook(workbook, exportData.data);
      }
      
      // Add metadata sheet
      this.addMetadataSheet(workbook, exportData);
      
      // Write and download the file
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('Failed to export data to Excel');
    }
  }
  
  // Export analytics data to CSV
  static async exportToCSV(exportData, filename) {
    try {
      let csvContent = '';
      
      if (exportData.type === 'clients') {
        csvContent = this.generateClientCSV(exportData.data);
      } else if (exportData.type === 'inventory') {
        csvContent = this.generateInventoryCSV(exportData.data);
      }
      
      // Download CSV file
      this.downloadCSV(csvContent, `${filename}.csv`);
      
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error('Failed to export data to CSV');
    }
  }
  
  // Add client-specific sheets to workbook
  static addClientSheetsToWorkbook(workbook, data) {
    // Timeline data sheet
    if (data.timeline && data.timeline.length > 0) {
      const timelineData = data.timeline.map(item => ({
        'Year': new Date(item.date).getFullYear(),
        'New Clients': item.clients,
        'Date': item.date.toISOString().split('T')[0]
      }));
      
      const timelineSheet = XLSX.utils.json_to_sheet(timelineData);
      XLSX.utils.book_append_sheet(workbook, timelineSheet, 'Client Timeline');
    }
    
    // Type distribution sheet
    if (data.typeDistribution && data.typeDistribution.length > 0) {
      const typeData = data.typeDistribution.map(item => ({
        'Client Type': item.name,
        'Count': item.count,
        'Percentage': ((item.count / data.totalClients) * 100).toFixed(2) + '%'
      }));
      
      const typeSheet = XLSX.utils.json_to_sheet(typeData);
      XLSX.utils.book_append_sheet(workbook, typeSheet, 'Type Distribution');
    }
    
    // Summary sheet
    const summaryData = [
      { 'Metric': 'Total Clients', 'Value': data.totalClients || 0 },
      { 'Metric': 'Active Clients', 'Value': data.activeClients || 0 },
      { 'Metric': 'New Clients This Month', 'Value': data.newClientsThisMonth || 0 },
      { 'Metric': 'Growth Rate', 'Value': data.growthRate || '0%' },
      { 'Metric': 'Most Common Type', 'Value': data.mostCommonType || 'N/A' }
    ];
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  }
  
  // Add inventory-specific sheets to workbook
  static addInventorySheetsToWorkbook(workbook, data) {
    // Timeline data sheet
    if (data.timeline && data.timeline.length > 0) {
      const timelineData = data.timeline.map(item => ({
        'Year': new Date(item.date).getFullYear(),
        'Total Items': item.totalItems,
        'Total Value (₹)': item.totalValue,
        'In Stock': item.inStock,
        'Out of Stock': item.outOfStock,
        'Low Stock': item.lowStock,
        'Date': item.date.toISOString().split('T')[0]
      }));
      
      const timelineSheet = XLSX.utils.json_to_sheet(timelineData);
      XLSX.utils.book_append_sheet(workbook, timelineSheet, 'Inventory Timeline');
    }
    
    // Stock status distribution sheet
    if (data.stockStatus && data.stockStatus.length > 0) {
      const statusData = data.stockStatus.map(item => ({
        'Status': item.status,
        'Count': item.count,
        'Percentage': ((item.count / data.totalItems) * 100).toFixed(2) + '%'
      }));
      
      const statusSheet = XLSX.utils.json_to_sheet(statusData);
      XLSX.utils.book_append_sheet(workbook, statusSheet, 'Stock Status');
    }
    
    // Category distribution sheet
    if (data.categoryDistribution && data.categoryDistribution.length > 0) {
      const categoryData = data.categoryDistribution.map(item => ({
        'Category': item.category,
        'Item Count': item.count,
        'Total Value (₹)': item.totalValue,
        'Average Value (₹)': Math.round(item.totalValue / item.count)
      }));
      
      const categorySheet = XLSX.utils.json_to_sheet(categoryData);
      XLSX.utils.book_append_sheet(workbook, categorySheet, 'Category Analysis');
    }
    
    // Value distribution sheet
    if (data.valueDistribution && data.valueDistribution.length > 0) {
      const valueData = data.valueDistribution.map(item => ({
        'Value Range': item.range,
        'Item Count': item.count,
        'Total Value (₹)': item.totalValue || 0
      }));
      
      const valueSheet = XLSX.utils.json_to_sheet(valueData);
      XLSX.utils.book_append_sheet(workbook, valueSheet, 'Value Distribution');
    }
    
    // Summary sheet
    const summaryData = [
      { 'Metric': 'Total Items', 'Value': data.totalItems || 0 },
      { 'Metric': 'Total Value (₹)', 'Value': (data.totalValue || 0).toLocaleString('en-IN') },
      { 'Metric': 'In Stock Items', 'Value': data.inStockItems || 0 },
      { 'Metric': 'Out of Stock Items', 'Value': data.outOfStockItems || 0 },
      { 'Metric': 'Low Stock Items', 'Value': data.lowStockItems || 0 },
      { 'Metric': 'Top Category', 'Value': data.topCategory || 'N/A' }
    ];
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  }
  
  // Add metadata sheet to workbook
  static addMetadataSheet(workbook, exportData) {
    const metadataData = [
      { 'Property': 'Export Type', 'Value': exportData.type === 'clients' ? 'Client Analytics' : 'Inventory Analytics' },
      { 'Property': 'Export Date', 'Value': new Date().toISOString().split('T')[0] },
      { 'Property': 'Export Time', 'Value': new Date().toLocaleTimeString() },
      { 'Property': 'Filters Applied', 'Value': JSON.stringify(exportData.filters) },
      { 'Property': 'Generated By', 'Value': 'CRM Dashboard System' }
    ];
    
    const metadataSheet = XLSX.utils.json_to_sheet(metadataData);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Export Info');
  }
  
  // Generate CSV content for client data
  static generateClientCSV(data) {
    let csv = 'Client Analytics Export\n\n';
    
    // Summary section
    csv += 'SUMMARY\n';
    csv += 'Metric,Value\n';
    csv += `Total Clients,${data.totalClients || 0}\n`;
    csv += `Active Clients,${data.activeClients || 0}\n`;
    csv += `New Clients This Month,${data.newClientsThisMonth || 0}\n`;
    csv += `Growth Rate,${data.growthRate || '0%'}\n`;
    csv += `Most Common Type,${data.mostCommonType || 'N/A'}\n\n`;
    
    // Timeline section
    if (data.timeline && data.timeline.length > 0) {
      csv += 'CLIENT TIMELINE\n';
      csv += 'Year,New Clients,Date\n';
      data.timeline.forEach(item => {
        csv += `${new Date(item.date).getFullYear()},${item.clients},${item.date.toISOString().split('T')[0]}\n`;
      });
      csv += '\n';
    }
    
    // Type distribution section
    if (data.typeDistribution && data.typeDistribution.length > 0) {
      csv += 'TYPE DISTRIBUTION\n';
      csv += 'Client Type,Count,Percentage\n';
      data.typeDistribution.forEach(item => {
        const percentage = ((item.count / data.totalClients) * 100).toFixed(2);
        csv += `${item.name},${item.count},${percentage}%\n`;
      });
    }
    
    return csv;
  }
  
  // Generate CSV content for inventory data
  static generateInventoryCSV(data) {
    let csv = 'Inventory Analytics Export\n\n';
    
    // Summary section
    csv += 'SUMMARY\n';
    csv += 'Metric,Value\n';
    csv += `Total Items,${data.totalItems || 0}\n`;
    csv += `Total Value (₹),${(data.totalValue || 0).toLocaleString('en-IN')}\n`;
    csv += `In Stock Items,${data.inStockItems || 0}\n`;
    csv += `Out of Stock Items,${data.outOfStockItems || 0}\n`;
    csv += `Low Stock Items,${data.lowStockItems || 0}\n`;
    csv += `Top Category,${data.topCategory || 'N/A'}\n\n`;
    
    // Timeline section
    if (data.timeline && data.timeline.length > 0) {
      csv += 'INVENTORY TIMELINE\n';
      csv += 'Year,Total Items,Total Value (₹),In Stock,Out of Stock,Low Stock,Date\n';
      data.timeline.forEach(item => {
        csv += `${new Date(item.date).getFullYear()},${item.totalItems},${item.totalValue},${item.inStock},${item.outOfStock},${item.lowStock},${item.date.toISOString().split('T')[0]}\n`;
      });
      csv += '\n';
    }
    
    // Stock status section
    if (data.stockStatus && data.stockStatus.length > 0) {
      csv += 'STOCK STATUS DISTRIBUTION\n';
      csv += 'Status,Count,Percentage\n';
      data.stockStatus.forEach(item => {
        const percentage = ((item.count / data.totalItems) * 100).toFixed(2);
        csv += `${item.status},${item.count},${percentage}%\n`;
      });
      csv += '\n';
    }
    
    // Category distribution section
    if (data.categoryDistribution && data.categoryDistribution.length > 0) {
      csv += 'CATEGORY ANALYSIS\n';
      csv += 'Category,Item Count,Total Value (₹),Average Value (₹)\n';
      data.categoryDistribution.forEach(item => {
        const avgValue = Math.round(item.totalValue / item.count);
        csv += `${item.category},${item.count},${item.totalValue},${avgValue}\n`;
      });
    }
    
    return csv;
  }
  
  // Download CSV file
  static downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

export default ReportsExportService;