import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import QuoteService from '../services/QuoteService';
import './QuoteHistoryAdvanced.css';
import ConfirmDialog from './ConfirmDialog';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { AiOutlineEye, AiOutlineForm } from "react-icons/ai";
import { FiTrash2 } from "react-icons/fi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const QuoteHistory = () => {
  const navigate = useNavigate();
  
  // State management
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuotes, setSelectedQuotes] = useState(new Set());
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view'); // 'view', 'edit', 'delete', 'compare'
  const [compareQuotes, setCompareQuotes] = useState([]);
  const [showNotification, setShowNotification] = useState({ show: false, message: '', type: '' });

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning',
    confirmText: 'OK',
    cancelText: 'Cancel'
  });

  // Advanced filter and search state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    clientName: '',
    windowType: '',
    dateFrom: '',
    dateTo: '',
    priceFrom: '',
    priceTo: '',
    assignedTo: '',
    priority: '',
    tags: []
  });

  // Pagination and sorting
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [sorting, setSorting] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // View options
  const [viewMode, setViewMode] = useState('table'); // 'table', 'grid', 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Analytics and summary
  const [analytics, setAnalytics] = useState({
    summary: {
      total: 0,
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      totalValue: 0,
      avgValue: 0,
      conversionRate: 0
    },
    trends: {
      daily: [],
      weekly: [],
      monthly: []
    },
    topClients: [],
    topProducts: []
  });

  // Load quotes with advanced filtering
  const loadQuotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const backendAvailable = await QuoteService.isBackendAvailable();
      
      if (!backendAvailable) {
        const localQuotes = JSON.parse(localStorage.getItem('quotationsHistory') || '[]');
        // Don't filter here - let processedQuotes handle filtering
        setQuotes(localQuotes);
        updateAnalytics(localQuotes);
        setLoading(false);
        return;
      }

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder,
        // Don't pass filters to backend for now - let frontend handle filtering
        // ...filters  
      };

      const response = await QuoteService.getAllQuotes(params);
      
      if (response.quotes) {
        setQuotes(response.quotes);
        setPagination(prev => ({
          ...prev,
          total: response.total || response.quotes.length,
          totalPages: response.totalPages || Math.ceil(response.quotes.length / prev.limit)
        }));
        updateAnalytics(response.quotes);
      }
    } catch (err) {
      console.error('Error loading quotes:', err);
      setError('Failed to load quotes. Please try again.');
      showNotificationMessage('Failed to load quotes', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sorting, filters]);

  // Apply local filters for offline mode
  const applyLocalFilters = (quotes) => {
    return quotes.filter(quote => {
      const matchesSearch = !filters.search || 
        quote.quotationNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
        quote.clientInfo?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        quote.clientInfo?.company?.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = !filters.status || quote.status === filters.status;
      const matchesClient = !filters.clientName || 
        quote.clientInfo?.name?.toLowerCase().includes(filters.clientName.toLowerCase());
      
      // Enhanced window type filtering - check all windows in the quotation
      const matchesWindowType = !filters.windowType || (() => {
        const filterTerm = filters.windowType.toLowerCase();
        
        // Window type mapping for better matching
        const windowTypeMapping = {
          'sliding': ['sliding', 'sliding windows'],
          'casement': ['casement', 'casement windows'],
          'bay': ['bay', 'bay windows'],
          'awning': ['awning', 'awning windows'],
          'single': ['single', 'single hung', 'single-hung'],
          'double': ['double', 'double hung', 'double-hung']
        };
        
        // Get all possible terms to match for the selected filter
        const termsToMatch = windowTypeMapping[filterTerm] || [filterTerm];
        
        // Check the primary selectedWindowType
        if (quote.selectedWindowType) {
          const primaryType = quote.selectedWindowType.toLowerCase();
          const primaryMatch = termsToMatch.some(term => primaryType.includes(term) || term.includes(primaryType));
          if (primaryMatch) {
            return true;
          }
        }
        
        // Check all window specs if they exist
        if (quote.windowSpecs && Array.isArray(quote.windowSpecs)) {
          const specsMatch = quote.windowSpecs.some(window => {
            // Check multiple possible fields for window type
            const possibleTypes = [
              window.type,
              window.selectedWindowType,
              window.windowType,
              window.specifications?.type,
              window.specifications?.windowType
            ];
            
            return possibleTypes.some(windowType => {
              if (typeof windowType === 'string' && windowType.trim()) {
                const specType = windowType.toLowerCase();
                const match = termsToMatch.some(term => specType.includes(term) || term.includes(specType));
                return match;
              }
              if (typeof windowType === 'object' && windowType.name) {
                const specTypeName = windowType.name.toLowerCase();
                const match = termsToMatch.some(term => specTypeName.includes(term) || term.includes(specTypeName));
                return match;
              }
              return false;
            });
          });
          if (specsMatch) {
            return true;
          }
        }
        
        // Also check if the quotation has a direct windowType field
        if (quote.windowType) {
          const directType = quote.windowType.toLowerCase();
          const directMatch = termsToMatch.some(term => directType.includes(term) || term.includes(directType));
          if (directMatch) {
            return true;
          }
        }
        
        return false;
      })();
      
      const matchesDateFrom = !filters.dateFrom || 
        new Date(quote.createdAt) >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || 
        new Date(quote.createdAt) <= new Date(filters.dateTo);
      
      const quotePrice = quote.pricing?.total || quote.pricing?.grandTotal || 0;
      const matchesPriceFrom = !filters.priceFrom || quotePrice >= parseFloat(filters.priceFrom);
      const matchesPriceTo = !filters.priceTo || quotePrice <= parseFloat(filters.priceTo);

      return matchesSearch && matchesStatus && matchesClient && matchesWindowType &&
             matchesDateFrom && matchesDateTo && matchesPriceFrom && matchesPriceTo;
    }).sort((a, b) => {
      const aVal = a[sorting.sortBy] || '';
      const bVal = b[sorting.sortBy] || '';
      return sorting.sortOrder === 'asc' ? 
        (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  };

  // Update analytics
  const updateAnalytics = (quotesData) => {
    const summary = {
      total: quotesData.length,
      draft: quotesData.filter(q => q.status === 'draft').length,
      submitted: quotesData.filter(q => q.status === 'submitted').length,
      approved: quotesData.filter(q => q.status === 'approved').length,
      rejected: quotesData.filter(q => q.status === 'rejected').length,
      totalValue: quotesData.reduce((sum, q) => sum + (q.pricing?.total || q.pricing?.grandTotal || 0), 0),
    };
    
    summary.avgValue = summary.total > 0 ? summary.totalValue / summary.total : 0;
    summary.conversionRate = summary.total > 0 ? 
      (summary.approved / (summary.submitted + summary.approved + summary.rejected)) * 100 : 0;

    // Calculate trends (simplified - in real app would be more sophisticated)
    const now = new Date();
    const trends = {
      daily: getDailyTrends(quotesData, now),
      weekly: getWeeklyTrends(quotesData, now),
      monthly: getMonthlyTrends(quotesData, now)
    };

    // Top clients and products
    const topClients = getTopClients(quotesData);
    const topProducts = getTopProducts(quotesData);

    setAnalytics({
      summary,
      trends,
      topClients,
      topProducts
    });
  };

  // Trend calculation helpers
  const getDailyTrends = (quotes, endDate) => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dayQuotes = quotes.filter(q => 
        new Date(q.createdAt).toDateString() === date.toDateString()
      );
      days.push({
        date: date.toISOString().split('T')[0],
        count: dayQuotes.length,
        value: dayQuotes.reduce((sum, q) => sum + (q.pricing?.total || 0), 0)
      });
    }
    return days;
  };

  const getWeeklyTrends = (quotes, endDate) => {
    const weeks = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(endDate);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekQuotes = quotes.filter(q => {
        const quoteDate = new Date(q.createdAt);
        return quoteDate >= weekStart && quoteDate <= weekEnd;
      });
      
      weeks.push({
        week: `Week ${12 - i}`,
        count: weekQuotes.length,
        value: weekQuotes.reduce((sum, q) => sum + (q.pricing?.total || 0), 0)
      });
    }
    return weeks;
  };

  const getMonthlyTrends = (quotes, endDate) => {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(endDate);
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      const monthQuotes = quotes.filter(q => {
        const quoteDate = new Date(q.createdAt);
        return quoteDate >= monthStart && quoteDate <= monthEnd;
      });
      
      months.push({
        month: monthDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
        count: monthQuotes.length,
        value: monthQuotes.reduce((sum, q) => sum + (q.pricing?.total || 0), 0)
      });
    }
    return months;
  };

  const getTopClients = (quotes) => {
    const clientMap = {};
    quotes.forEach(q => {
      const clientName = q.clientInfo?.name || 'Unknown';
      if (!clientMap[clientName]) {
        clientMap[clientName] = { name: clientName, count: 0, value: 0 };
      }
      clientMap[clientName].count++;
      clientMap[clientName].value += q.pricing?.total || 0;
    });
    
    return Object.values(clientMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  // Helper function to extract all window types from a quotation
  const getAllWindowTypes = (quote) => {
    const windowTypes = new Set();
    
    // Add primary selectedWindowType if it exists
    if (quote.selectedWindowType) {
      windowTypes.add(quote.selectedWindowType);
    }
    
    // Add all window types from windowSpecs if they exist
    if (quote.windowSpecs && Array.isArray(quote.windowSpecs)) {
      quote.windowSpecs.forEach((window, index) => {
        const windowType = window.type || window.selectedWindowType || window.windowType;
        if (typeof windowType === 'string' && windowType.trim()) {
          windowTypes.add(windowType);
        } else if (typeof windowType === 'object' && windowType.name) {
          windowTypes.add(windowType.name);
        }
      });
    }
    
    const result = Array.from(windowTypes).filter(type => type && type.trim());
    return result;
  };

  // Helper function to format window types for display
  const formatWindowTypesDisplay = (quote) => {
    const windowTypes = getAllWindowTypes(quote);
    
    if (windowTypes.length === 0) {
      return 'N/A';
    }
    
    // Convert short IDs to full names
    const windowTypeMapping = {
      'sliding': 'Sliding Windows',
      'casement': 'Casement Windows', 
      'bay': 'Bay Windows',
      'awning': 'Awning Windows',
      'single': 'Single Hung',
      'double': 'Double Hung',
      'single-hung': 'Single Hung',
      'double-hung': 'Double Hung'
    };
    
    const formattedTypes = windowTypes.map(type => {
      return windowTypeMapping[type.toLowerCase()] || type;
    });
    
    if (formattedTypes.length === 1) {
      return formattedTypes[0];
    }
    
    // For multiple types, show first two and indicate if there are more
    if (formattedTypes.length <= 2) {
      return formattedTypes.join(', ');
    }
    
    return `${formattedTypes.slice(0, 2).join(', ')} +${formattedTypes.length - 2} more`;
  };

  // Helper function to get formatted tooltip text
  const getWindowTypesTooltip = (quote) => {
    const windowTypes = getAllWindowTypes(quote);
    const windowTypeMapping = {
      'sliding': 'Sliding Windows',
      'casement': 'Casement Windows', 
      'bay': 'Bay Windows',
      'awning': 'Awning Windows',
      'single': 'Single Hung',
      'double': 'Double Hung',
      'single-hung': 'Single Hung',
      'double-hung': 'Double Hung'
    };
    
    return windowTypes.map(type => {
      return windowTypeMapping[type.toLowerCase()] || type;
    }).join(', ');
  };

  const getTopProducts = (quotes) => {
    const productMap = {};
    quotes.forEach(q => {
      const windowType = q.selectedWindowType || 'Unknown';
      if (!productMap[windowType]) {
        productMap[windowType] = { type: windowType, count: 0, value: 0 };
      }
      productMap[windowType].count++;
      productMap[windowType].value += q.pricing?.total || 0;
    });
    
    return Object.values(productMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  // Notification helper
  const showNotificationMessage = (message, type = 'info') => {
    setShowNotification({ show: true, message, type });
    setTimeout(() => setShowNotification({ show: false, message: '', type: '' }), 5000);
  };

  // Helper function to show confirmation dialog
  const showConfirmation = (title, message, onConfirm, type = 'warning', confirmText = 'OK', cancelText = 'Cancel') => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      type,
      confirmText,
      cancelText
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle sorting
  const handleSort = (field) => {
    setSorting(prev => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedQuotes.size === 0) return;
    
    showConfirmation(
      'Delete Multiple Quotes',
      `Are you sure you want to delete ${selectedQuotes.size} quote(s)? This action cannot be undone.`,
      async () => {
        try {
          setLoading(true);
          const deletePromises = Array.from(selectedQuotes).map(id => 
            QuoteService.deleteQuote(id)
          );
          
          await Promise.all(deletePromises);
          setSelectedQuotes(new Set());
          await loadQuotes();
          showNotificationMessage(`Successfully deleted ${selectedQuotes.size} quote(s)`, 'success');
        } catch (error) {
          console.error('Error deleting quotes:', error);
          showNotificationMessage('Failed to delete some quotes', 'error');
        } finally {
          setLoading(false);
        }
      },
      'danger',
      'Yes, Delete All',
      'Cancel'
    );
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedQuotes.size === 0) return;

    showConfirmation(
      'Update Quote Status',
      `Are you sure you want to update ${selectedQuotes.size} quote(s) to status "${newStatus}"?`,
      async () => {
        try {
          setLoading(true);
          const updatePromises = Array.from(selectedQuotes).map(id => 
            QuoteService.updateQuoteStatus(id, newStatus)
          );
          
          await Promise.all(updatePromises);
          setSelectedQuotes(new Set());
          await loadQuotes();
          showNotificationMessage(`Successfully updated ${selectedQuotes.size} quote(s) to ${newStatus}`, 'success');
        } catch (error) {
          console.error('Error updating quote status:', error);
          showNotificationMessage('Failed to update some quotes', 'error');
        } finally {
          setLoading(false);
        }
      },
      'warning',
      'Yes, Update All',
      'Cancel'
    );
  };

  // Individual quote operations
  const handleDeleteQuote = async (quoteId) => {
    showConfirmation(
      'Delete Quote',
      'Are you sure you want to delete this quote? This action cannot be undone.',
      async () => {
        try {
          setLoading(true);
          await QuoteService.deleteQuote(quoteId);
          await loadQuotes();
          showNotificationMessage('Quote deleted successfully', 'success');
        } catch (error) {
          console.error('Error deleting quote:', error);
          showNotificationMessage('Failed to delete quote', 'error');
        } finally {
          setLoading(false);
        }
      },
      'danger',
      'Yes, Delete',
      'Cancel'
    );
  };

  const handleEdit = async (quote) => {
    try {
      setLoading(true);
      // Fetch complete quote data by ID
      const completeQuoteData = await QuoteService.getQuoteById(quote._id);
      console.log('Fetched complete quote data:', completeQuoteData);
      
      // Navigate to quotation page with complete data
      navigate('/quotation-ads', { 
        state: { 
          editMode: true, 
          quoteData: completeQuoteData,
          quoteId: quote._id 
        } 
      });
    } catch (error) {
      console.error('Error fetching quote for edit:', error);
      showNotificationMessage('Failed to fetch quote data for editing', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkExport = async (format = 'csv') => {
    if (selectedQuotes.size === 0) {
      showNotificationMessage('Please select quotes to export', 'warning');
      return;
    }

    try {
      setLoading(true);
      const selectedQuoteIds = Array.from(selectedQuotes);
      const exportData = quotes.filter(q => selectedQuoteIds.includes(q._id));
      
      await downloadExport(exportData, format);
      showNotificationMessage(`Successfully exported ${selectedQuotes.size} quote(s)`, 'success');
    } catch (error) {
      console.error('Error exporting quotes:', error);
      showNotificationMessage('Failed to export quotes', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Export functionality
  const downloadExport = async (data, format) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `quotes_export_${timestamp}`;

    if (format === 'csv') {
      const csv = convertToCSV(data);
      downloadFile(csv, `${filename}.csv`, 'text/csv');
    } else if (format === 'excel') {
      // In a real application, you would use a library like xlsx
      const csv = convertToCSV(data);
      downloadFile(csv, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } else if (format === 'pdf') {
      // Generate PDF report
      await generatePDFReport(data, filename);
    } else {
      // JSON format
      const json = JSON.stringify(data, null, 2);
      downloadFile(json, `${filename}.json`, 'application/json');
    }
  };

  const convertToCSV = (data) => {
    const headers = [
      'Quote Number', 'Client Name', 'Company', 'Status', 'Window Type',
      'Total Amount', 'Created Date', 'Modified Date', 'Notes'
    ];

    const rows = data.map(quote => [
      quote.quotationNumber || '',
      quote.clientInfo?.name || '',
      quote.clientInfo?.company || '',
      quote.status || '',
      quote.selectedWindowType || '',
      quote.pricing?.total || quote.pricing?.grandTotal || 0,
      new Date(quote.createdAt).toLocaleDateString(),
      new Date(quote.updatedAt || quote.lastModifiedDate).toLocaleDateString(),
      quote.notes || ''
    ]);

    return [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generatePDFReport = async (data, filename) => {
    // This would integrate with a PDF generation library
    // For now, we'll create a simple HTML-to-PDF approach
    const htmlContent = generateReportHTML(data);
    
    // In a real app, you'd use libraries like jsPDF, puppeteer, or html2canvas
    // For demo purposes, we'll just download the HTML
    downloadFile(htmlContent, `${filename}.html`, 'text/html');
  };

  const generateReportHTML = (data) => {
    const totalValue = data.reduce((sum, q) => sum + (q.pricing?.total || 0), 0);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Quote History Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .summary { background: #f5f5f5; padding: 15px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .currency { text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Quote History Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Quotes:</strong> ${data.length}</p>
        <p><strong>Total Value:</strong> ${QuoteService.formatCurrency(totalValue)}</p>
        <p><strong>Average Value:</strong> ${QuoteService.formatCurrency(totalValue / data.length)}</p>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Quote #</th>
                <th>Client</th>
                <th>Status</th>
                <th>Window Type</th>
                <th>Amount</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody>
            ${data.map(quote => `
                <tr>
                    <td>${quote.quotationNumber || ''}</td>
                    <td>${quote.clientInfo?.name || ''}</td>
                    <td>${quote.status || ''}</td>
                    <td>${quote.selectedWindowType || ''}</td>
                    <td class="currency">${QuoteService.formatCurrency(quote.pricing?.total || 0)}</td>
                    <td>${new Date(quote.createdAt).toLocaleDateString()}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>
    `;
  };

  // Quote comparison
  const handleCompareQuotes = () => {
    if (selectedQuotes.size < 2) {
      showNotificationMessage('Please select at least 2 quotes to compare', 'warning');
      return;
    }
    
    if (selectedQuotes.size > 5) {
      showNotificationMessage('Please select maximum 5 quotes to compare', 'warning');
      return;
    }

    const quotesToCompare = quotes.filter(q => selectedQuotes.has(q._id));
    setCompareQuotes(quotesToCompare);
    setModalType('compare');
    setShowModal(true);
  };

  // Selection handlers
  const handleSelectQuote = (quoteId) => {
    const newSelected = new Set(selectedQuotes);
    if (newSelected.has(quoteId)) {
      newSelected.delete(quoteId);
    } else {
      newSelected.add(quoteId);
    }
    setSelectedQuotes(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedQuotes.size === quotes.length) {
      setSelectedQuotes(new Set());
    } else {
      setSelectedQuotes(new Set(quotes.map(q => q._id)));
    }
  };

  // Auto-refresh functionality
  useEffect(() => {
    let intervalId;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        loadQuotes();
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, loadQuotes]);

  // Load quotes on component mount and filter changes
  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  // Auto-apply filters when they change (for client-side filtering)
  useEffect(() => {
    // Force re-render of processedQuotes when filters change
    // This is handled by the useMemo dependency, but we can add a small delay for UX
  }, [filters]);

  // Memoized filtered and sorted quotes
  const processedQuotes = useMemo(() => {
    // Apply filters if in offline mode or no backend
    let filteredQuotes = quotes;
    
    // Check if we need to apply local filtering
    // Apply local filters if any filter is set
    const hasFilters = filters.search || filters.status || filters.clientName || 
                      filters.windowType || filters.dateFrom || filters.dateTo || 
                      filters.priceFrom || filters.priceTo;
    
    if (hasFilters) {
      filteredQuotes = applyLocalFilters(quotes);
    }
    
    return filteredQuotes;
  }, [quotes, filters]);

  // Update analytics when processedQuotes changes
  useEffect(() => {
    updateAnalytics(processedQuotes);
  }, [processedQuotes]);

  // Status color mapping
  const getStatusColor = (status) => {
    const colors = {
      draft: '#6c757d',
      submitted: '#007bff',
      approved: '#28a745',
      rejected: '#dc3545',
      archived: '#6f42c1'
    };
    return colors[status] || '#6c757d';
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  // Chart data preparation functions
  const getStatusChartData = () => {
    const statusData = analytics.summary;
    const statuses = ['draft', 'submitted', 'approved', 'rejected'];
    const colors = ['#6c757d', '#007bff', '#28a745', '#dc3545'];
    
    return {
      labels: statuses.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
      datasets: [
        {
          data: statuses.map(status => statusData[status] || 0),
          backgroundColor: colors,
          borderColor: colors.map(color => color),
          borderWidth: 2,
          hoverOffset: 4,
          cutout: '60%',
        },
      ],
    };
  };

  const getTrendsChartData = () => {
    const trendsData = analytics.trends.daily;
    
    return {
      labels: trendsData.map(day => {
        const date = new Date(day.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Quote Count',
          data: trendsData.map(day => day.count),
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#007bff',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
        {
          label: 'Quote Value (₹)',
          data: trendsData.map(day => day.value / 1000), // Convert to thousands
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#28a745',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          yAxisID: 'y1',
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#007bff',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      },
    },
  };

  const trendsChartOptions = {
    ...chartOptions,
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
        title: {
          display: true,
          text: 'Quote Count',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: function(value) {
            return '₹' + value + 'K';
          },
        },
        title: {
          display: true,
          text: 'Value (₹ thousands)',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
    },
  };

  if (loading && quotes.length === 0) {
    return (
      <div className="quote-history">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading quote history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quote-history">
      {/* Notification */}
      {showNotification.show && (
        <div className={`notification notification-${showNotification.type}`}>
          <span>{showNotification.message}</span>
          <button onClick={() => setShowNotification({ show: false, message: '', type: '' })}>×</button>
        </div>
      )}

      {/* Header */}
      <div className="quote-history-header">
        <div className="header-left">
          <h2>Quote History</h2>
          <div className="quick-stats">
            <span className="stat-item">
              <strong>{analytics.summary.total}</strong> Total
            </span>
            <span className="stat-item">
              <strong>{formatCurrency(analytics.summary.totalValue)}</strong> Value
            </span>
            <span className="stat-item">
              <strong>{analytics.summary.conversionRate.toFixed(1)}%</strong> Conversion
            </span>
          </div>
        </div>
        
        <div className="header-right">
          <div className="header-controls">
            <button 
              className={`btn ${showAnalytics ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setShowAnalytics(!showAnalytics)}
              title="Toggle Analytics"
            >
              📊 Analytics
            </button>
            
            <button 
              className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setShowFilters(!showFilters)}
              title="Toggle Filters"
            >
              🔍 Filters
            </button>
            
            <div className="view-mode-selector">
              <button 
                className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                📋
              </button>
              <button 
                className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                ⊞
              </button>
              <button 
                className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                ☰
              </button>
            </div>

            <label className="auto-refresh-toggle">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto Refresh
            </label>

            <button 
              className="btn btn-primary"
              onClick={loadQuotes}
              disabled={loading}
              title="Refresh Data"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <div className="analytics-dashboard">
          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>📊 Status Distribution</h4>
              <div className="chart-container">
                <Doughnut data={getStatusChartData()} options={chartOptions} />
              </div>
              <div className="status-summary">
                {Object.entries(analytics.summary).filter(([key]) => 
                  ['draft', 'submitted', 'approved', 'rejected'].includes(key)
                ).map(([status, count]) => (
                  <div key={status} className="status-item">
                    <span className="status-dot" style={{ backgroundColor: getStatusColor(status) }}></span>
                    <span className="status-name">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    <span className="status-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-card">
              <h4>📈 Daily Trends (Last 7 Days)</h4>
              <div className="chart-container">
                <Line data={getTrendsChartData()} options={trendsChartOptions} />
              </div>
              <div className="trends-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Count</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.trends.daily.slice(-5).map((day, index) => (
                      <tr key={index}>
                        <td>{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                        <td>{day.count}</td>
                        <td>{formatCurrency(day.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="analytics-bottom-section">
            <div className="analytics-card">
              <h4>🏆 Top Clients</h4>
              <div className="top-clients-table">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Client Name</th>
                      <th>Total Value</th>
                      <th>Quotes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topClients.slice(0, 5).map((client, index) => (
                      <tr key={index}>
                        <td>
                          <span className="rank-badge">#{index + 1}</span>
                        </td>
                        <td className="client-name">{client.name}</td>
                        <td className="client-value">{formatCurrency(client.value)}</td>
                        <td className="client-count">{client.count}</td>
                      </tr>
                    ))}
                    {analytics.topClients.length === 0 && (
                      <tr>
                        <td colSpan="4" className="no-data">No client data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="analytics-card">
              <h4>🏠 Popular Window Types</h4>
              <div className="window-types-table">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Window Type</th>
                      <th>Quote Count</th>
                      <th>Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topProducts.slice(0, 5).map((product, index) => (
                      <tr key={index}>
                        <td>
                          <span className="rank-badge">#{index + 1}</span>
                        </td>
                        <td className="product-name">{product.type}</td>
                        <td className="product-count">{product.count} quotes</td>
                        <td className="product-value">{formatCurrency(product.value)}</td>
                      </tr>
                    ))}
                    {analytics.topProducts.length === 0 && (
                      <tr>
                        <td colSpan="4" className="no-data">No product data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && (
        <div className="advanced-filters">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search quotes, clients, companies..."
              />
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Client Name</label>
              <input
                type="text"
                value={filters.clientName}
                onChange={(e) => handleFilterChange('clientName', e.target.value)}
                placeholder="Filter by client name"
              />
            </div>

            <div className="filter-group">
              <label>Window Type</label>
              <select
                value={filters.windowType}
                onChange={(e) => handleFilterChange('windowType', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="sliding">Sliding Windows</option>
                <option value="casement">Casement Windows</option>
                <option value="bay">Bay Windows</option>
                <option value="awning">Awning Windows</option>
                <option value="single">Single Hung</option>
                <option value="double">Double Hung</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Price From</label>
              <input
                type="number"
                value={filters.priceFrom}
                onChange={(e) => handleFilterChange('priceFrom', e.target.value)}
                placeholder="Min price"
              />
            </div>

            <div className="filter-group">
              <label>Price To</label>
              <input
                type="number"
                value={filters.priceTo}
                onChange={(e) => handleFilterChange('priceTo', e.target.value)}
                placeholder="Max price"
              />
            </div>
          </div>

          <div className="filter-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setFilters({
                  search: '', status: '', clientName: '', windowType: '',
                  dateFrom: '', dateTo: '', priceFrom: '', priceTo: '',
                  assignedTo: '', priority: '', tags: []
                });
              }}
            >
              Clear Filters
            </button>
            
            <button 
              className="btn btn-primary"
              onClick={() => {
                setPagination(prev => ({ ...prev, page: 1 }));
                loadQuotes();
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedQuotes.size > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-info">
            <span>{selectedQuotes.size} quote(s) selected</span>
          </div>
          
          <div className="bulk-actions">
            <button className="btn btn-outline" onClick={() => setSelectedQuotes(new Set())}>
              Clear Selection
            </button>
            
            <div className="dropdown">
              <button className="btn btn-outline dropdown-toggle">
                Change Status
              </button>
              <div className="dropdown-menu">
                <button onClick={() => handleBulkStatusChange('draft')}>Set to Draft</button>
                <button onClick={() => handleBulkStatusChange('submitted')}>Set to Submitted</button>
                <button onClick={() => handleBulkStatusChange('approved')}>Set to Approved</button>
                <button onClick={() => handleBulkStatusChange('rejected')}>Set to Rejected</button>
                <button onClick={() => handleBulkStatusChange('archived')}>Set to Archived</button>
              </div>
            </div>

            <div className="dropdown">
              <button className="btn btn-outline dropdown-toggle">
                Export
              </button>
              <div className="dropdown-menu">
                <button onClick={() => handleBulkExport('csv')}>Export as CSV</button>
                <button onClick={() => handleBulkExport('excel')}>Export as Excel</button>
                <button onClick={() => handleBulkExport('pdf')}>Export as PDF</button>
                <button onClick={() => handleBulkExport('json')}>Export as JSON</button>
              </div>
            </div>

            <button 
              className="btn btn-primary"
              onClick={handleCompareQuotes}
              disabled={selectedQuotes.size < 2}
            >
              Compare Quotes
            </button>

            <button 
              className="btn btn-danger"
              onClick={handleBulkDelete}
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="quote-content">
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={loadQuotes} className="btn btn-primary">
              Try Again
            </button>
          </div>
        )}

        {!loading && quotes.length === 0 && (
          <div className="empty-state">
            <h3>No quotes found</h3>
            <p>Try adjusting your filters or create a new quotation to get started.</p>
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && quotes.length > 0 && (
          <div className="quotes-table-container">
            <table className="quotes-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedQuotes.size === quotes.length && quotes.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th onClick={() => handleSort('quotationNumber')} className="sortable">
                    Quote #
                    {sorting.sortBy === 'quotationNumber' && (
                      <span className={`sort-arrow ${sorting.sortOrder}`}></span>
                    )}
                  </th>
                  <th onClick={() => handleSort('clientInfo.name')} className="sortable">
                    Client
                    {sorting.sortBy === 'clientInfo.name' && (
                      <span className={`sort-arrow ${sorting.sortOrder}`}></span>
                    )}
                  </th>
                  <th onClick={() => handleSort('status')} className="sortable">
                    Status
                    {sorting.sortBy === 'status' && (
                      <span className={`sort-arrow ${sorting.sortOrder}`}></span>
                    )}
                  </th>
                  <th onClick={() => handleSort('selectedWindowType')} className="sortable">
                    Window Type
                  </th>
                  <th onClick={() => handleSort('pricing.total')} className="sortable">
                    Amount
                    {sorting.sortBy === 'pricing.total' && (
                      <span className={`sort-arrow ${sorting.sortOrder}`}></span>
                    )}
                  </th>
                  <th onClick={() => handleSort('createdAt')} className="sortable">
                    Created
                    {sorting.sortBy === 'createdAt' && (
                      <span className={`sort-arrow ${sorting.sortOrder}`}></span>
                    )}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedQuotes.map((quote) => (
                  <tr key={quote._id} className={selectedQuotes.has(quote._id) ? 'selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedQuotes.has(quote._id)}
                        onChange={() => handleSelectQuote(quote._id)}
                      />
                    </td>
                    <td>
                      {quote.quotationNumber}
                    </td>
                    <td>
                      {quote.clientInfo?.name || 'N/A'}{quote.clientInfo?.company && ` (${quote.clientInfo.company})`}
                    </td>
                    <td>
                      {quote.status?.charAt(0).toUpperCase() + quote.status?.slice(1).toLowerCase() || 'Draft'}
                    </td>
                    <td>
                      <div className="window-types-cell" title={getWindowTypesTooltip(quote)}>
                        {formatWindowTypesDisplay(quote)}
                      </div>
                    </td>
                    <td>
                      {formatCurrency(quote.pricing?.total || quote.pricing?.grandTotal || 0)}
                    </td>
                    <td>{new Date(quote.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn" 
                          onClick={() => {
                            setSelectedQuote(quote);
                            setModalType('view');
                            setShowModal(true);
                          }}
                          title="View Quote Details"
                        >
                          <AiOutlineEye size={40} />
                        </button>
                        <button 
                          className="action-btn" 
                          onClick={() => handleEdit(quote)}
                          title="Edit Quote"
                        >
                          <AiOutlineForm size={40} />
                        </button>
                        <button 
                          className="action-btn text-red-600" 
                          onClick={() => handleDeleteQuote(quote._id)}
                          title="Delete Quote"
                        >
                          <FiTrash2 size={40} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {quotes.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} quotes
            </div>
            <div className="pagination-controls">
              <button
                className="btn btn-outline"
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                title="Previous Page"
              >
                ← Previous
              </button>
              
              <div className="page-numbers">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNumber = Math.max(1, pagination.page - 2) + i;
                  if (pageNumber <= pagination.totalPages) {
                    return (
                      <button
                        key={pageNumber}
                        className={`btn ${pageNumber === pagination.page ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNumber }))}
                      >
                        {pageNumber}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                className="btn btn-outline"
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                title="Next Page"
              >
                Next →
              </button>
            </div>
            
            <div className="items-per-page">
              <label>
                Items per page:
                <select
                  value={pagination.limit}
                  onChange={(e) => setPagination(prev => ({ 
                    ...prev, 
                    limit: parseInt(e.target.value), 
                    page: 1 
                  }))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && quotes.length > 0 && (
          <div className="quotes-grid">
            {processedQuotes.map((quote) => (
              <div 
                key={quote._id} 
                className={`quote-card ${selectedQuotes.has(quote._id) ? 'selected' : ''}`}
              >
                <div className="quote-card-header">
                  <input
                    type="checkbox"
                    checked={selectedQuotes.has(quote._id)}
                    onChange={() => handleSelectQuote(quote._id)}
                  />
                  <span className="quote-number">{quote.quotationNumber}</span>
                  <span 
                    className={`status-badge status-${quote.status}`}
                    style={{ backgroundColor: getStatusColor(quote.status) }}
                  >
                    {quote.status}
                  </span>
                </div>

                <div className="quote-card-body">
                  <h4>{quote.clientInfo?.name || 'Unknown Client'}</h4>
                  {quote.clientInfo?.company && (
                    <p className="company">{quote.clientInfo.company}</p>
                  )}
                  <div className="window-type-container" title={getWindowTypesTooltip(quote)}>
                    <p className="window-type">{formatWindowTypesDisplay(quote)}</p>
                  </div>
                  <p className="amount">{formatCurrency(quote.pricing?.total || 0)}</p>
                  <p className="date">Created: {new Date(quote.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="quote-card-actions">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      setSelectedQuote(quote);
                      setModalType('view');
                      setShowModal(true);
                    }}
                  >
                    View
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => {
                      setSelectedQuote(quote);
                      setModalType('edit');
                      setShowModal(true);
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && quotes.length > 0 && (
          <div className="quotes-list">
            {processedQuotes.map((quote) => (
              <div 
                key={quote._id} 
                className={`quote-list-item ${selectedQuotes.has(quote._id) ? 'selected' : ''}`}
              >
                <div className="quote-list-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedQuotes.has(quote._id)}
                    onChange={() => handleSelectQuote(quote._id)}
                  />
                </div>

                <div className="quote-list-main">
                  <div className="quote-list-header">
                    <span className="quote-number">#{quote.quotationNumber}</span>
                    <span 
                      className={`status-badge status-${quote.status}`}
                      style={{ backgroundColor: getStatusColor(quote.status) }}
                    >
                      {quote.status}
                    </span>
                    <span className="quote-date">{new Date(quote.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="quote-list-details">
                    <div className="client-details">
                      <strong>{quote.clientInfo?.name || 'Unknown Client'}</strong>
                      {quote.clientInfo?.company && <span> - {quote.clientInfo.company}</span>}
                    </div>
                    <div className="quote-details">
                      <span title={getWindowTypesTooltip(quote)}>{formatWindowTypesDisplay(quote)}</span>
                      <span className="amount">{formatCurrency(quote.pricing?.total || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="quote-list-actions">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => {
                      setSelectedQuote(quote);
                      setModalType('view');
                      setShowModal(true);
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}


      </div>

      {/* Enhanced Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {modalType === 'view' && selectedQuote && (
              <div className="quote-detail-modal">
                <div className="modal-header">
                  <h3>Quote Details - {selectedQuote.quotationNumber}</h3>
                  <div className="modal-header-actions">
                    <button className="btn btn-close" onClick={() => setShowModal(false)}>×</button>
                  </div>
                </div>

                <div className="modal-body">
                  <div className="quote-details-grid">
                    <div className="detail-section">
                      <h4>Basic Information</h4>
                      <div className="detail-row">
                        <label>Quote Number:</label>
                        <span>{selectedQuote.quotationNumber}</span>
                      </div>
                      <div className="detail-row">
                        <label>Status:</label>
                        <span 
                          className={`status-badge status-${selectedQuote.status}`}
                          style={{ backgroundColor: getStatusColor(selectedQuote.status) }}
                        >
                          {selectedQuote.status}
                        </span>
                      </div>
                      <div className="detail-row">
                        <label>Created:</label>
                        <span>{new Date(selectedQuote.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="detail-row">
                        <label>Last Modified:</label>
                        <span>{new Date(selectedQuote.updatedAt || selectedQuote.lastModifiedDate).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h4>Client Information</h4>
                      <div className="detail-row">
                        <label>Name:</label>
                        <span>{selectedQuote.clientInfo?.name || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <label>Company:</label>
                        <span>{selectedQuote.clientInfo?.company || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <label>Email:</label>
                        <span>{selectedQuote.clientInfo?.email || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <label>Phone:</label>
                        <span>{selectedQuote.clientInfo?.phone || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <label>Address:</label>
                        <span>{selectedQuote.clientInfo?.address || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h4>Window Information</h4>
                      <div className="detail-row">
                        <label>Window Type:</label>
                        <span>{selectedQuote.selectedWindowType || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <label>Number of Windows:</label>
                        <span>{(selectedQuote.windowSpecs?.length || selectedQuote.windowSpecifications?.length || 0)}</span>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h4>Pricing Information</h4>
                      <div className="pricing-grid">
                        <div className="detail-row">
                          <label>Subtotal:</label>
                          <span>{formatCurrency(selectedQuote.pricing?.subtotal || 0)}</span>
                        </div>
                        <div className="detail-row">
                          <label>Tax:</label>
                          <span>{formatCurrency(selectedQuote.pricing?.tax || 0)}</span>
                        </div>
                        <div className="detail-row">
                          <label>Discount:</label>
                          <span>{formatCurrency(selectedQuote.pricing?.discount || 0)}</span>
                        </div>
                        <div className="detail-row total-row">
                          <label>Total:</label>
                          <span className="total-amount">
                            {formatCurrency(selectedQuote.pricing?.total || selectedQuote.pricing?.grandTotal || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedQuote.windowSpecs?.length > 0 && (
                      <div className="detail-section full-width">
                        <h4>Window Specifications</h4>
                        <div className="window-specs-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Window</th>
                                <th>Dimensions</th>
                                <th>Type</th>
                                <th>Glass</th>
                                <th>Frame</th>
                                <th>Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedQuote.windowSpecs.map((spec, index) => (
                                <tr key={index}>
                                  <td>{spec.name || `Window ${index + 1}`}</td>
                                  <td>
                                    {spec.dimensions ? 
                                      `${spec.dimensions.width} × ${spec.dimensions.height}` :
                                      `${spec.width || 0} × ${spec.height || 0}`
                                    }
                                  </td>
                                  <td>{spec.type || 'N/A'}</td>
                                  <td>{spec.specifications?.glass || spec.glassType || 'N/A'}</td>
                                  <td>{spec.specifications?.frameMaterial || spec.frameType || 'N/A'}</td>
                                  <td>{formatCurrency(spec.pricing?.total || spec.price || 0)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {selectedQuote.notes && (
                      <div className="detail-section full-width">
                        <h4>Notes</h4>
                        <div className="notes-content">
                          {selectedQuote.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {modalType === 'compare' && compareQuotes.length > 0 && (
              <div className="quote-compare-modal">
                <div className="modal-header">
                  <h3>Compare Quotes ({compareQuotes.length})</h3>
                  <button className="btn btn-close" onClick={() => setShowModal(false)}>×</button>
                </div>

                <div className="modal-body">
                  <div className="compare-table-container">
                    <table className="compare-table">
                      <thead>
                        <tr>
                          <th>Field</th>
                          {compareQuotes.map((quote, index) => (
                            <th key={index}>
                              Quote #{quote.quotationNumber}
                              <div className="quote-status">
                                <span 
                                  className={`status-badge status-${quote.status}`}
                                  style={{ backgroundColor: getStatusColor(quote.status) }}
                                >
                                  {quote.status}
                                </span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>Client</strong></td>
                          {compareQuotes.map((quote, index) => (
                            <td key={index}>{quote.clientInfo?.name || 'N/A'}</td>
                          ))}
                        </tr>
                        <tr>
                          <td><strong>Company</strong></td>
                          {compareQuotes.map((quote, index) => (
                            <td key={index}>{quote.clientInfo?.company || 'N/A'}</td>
                          ))}
                        </tr>
                        <tr>
                          <td><strong>Window Type</strong></td>
                          {compareQuotes.map((quote, index) => (
                            <td key={index} title={getWindowTypesTooltip(quote)}>
                              {formatWindowTypesDisplay(quote)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td><strong>Total Amount</strong></td>
                          {compareQuotes.map((quote, index) => (
                            <td key={index} className="amount">
                              {formatCurrency(quote.pricing?.total || 0)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td><strong>Created Date</strong></td>
                          {compareQuotes.map((quote, index) => (
                            <td key={index}>{new Date(quote.createdAt).toLocaleDateString()}</td>
                          ))}
                        </tr>
                        <tr>
                          <td><strong>Window Count</strong></td>
                          {compareQuotes.map((quote, index) => (
                            <td key={index}>{quote.windowSpecs?.length || 0}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {modalType === 'delete' && selectedQuote && (
              <div className="delete-confirmation-modal">
                <div className="modal-header">
                  <h3>Delete Quote</h3>
                  <button className="btn btn-close" onClick={() => setShowModal(false)}>×</button>
                </div>

                <div className="modal-body">
                  <p>Are you sure you want to delete quote <strong>{selectedQuote.quotationNumber}</strong>?</p>
                  <p>This action cannot be undone.</p>
                  
                  <div className="quote-summary">
                    <p><strong>Client:</strong> {selectedQuote.clientInfo?.name}</p>
                    <p><strong>Amount:</strong> {formatCurrency(selectedQuote.pricing?.total || 0)}</p>
                    <p><strong>Status:</strong> {selectedQuote.status}</p>
                  </div>
                </div>

                <div className="modal-footer">
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={async () => {
                      try {
                        await QuoteService.deleteQuote(selectedQuote._id);
                        await loadQuotes();
                        setShowModal(false);
                        showNotificationMessage('Quote deleted successfully', 'success');
                      } catch (error) {
                        showNotificationMessage('Failed to delete quote', 'error');
                      }
                    }}
                  >
                    Delete Quote
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        type={confirmDialog.type}
      />
    </div>
  );
};

export default QuoteHistory;