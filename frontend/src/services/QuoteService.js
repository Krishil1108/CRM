const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to make authenticated fetch calls
const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
};

class QuoteService {
  // Check if backend is available
  static async isBackendAvailable() {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/quotes?limit=1`, {
        method: 'HEAD',
        mode: 'cors'
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Get all quotes with filters and pagination
  static async getAllQuotes(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination parameters
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      // Add search and filter parameters
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.clientName) queryParams.append('clientName', params.clientName);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      
      // Add sorting parameters
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await authenticatedFetch(`${API_BASE_URL}/quotes?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching quotes:', error);
      throw error;
    }
  }

  // Get quote by ID
  static async getQuoteById(id) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/quotes/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching quote:', error);
      throw error;
    }
  }

  // Get quote by quotation number
  static async getQuoteByNumber(quotationNumber) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/quotes/number/${quotationNumber}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching quote by number:', error);
      throw error;
    }
  }

  // Create new quote
  static async createQuote(quoteData) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  }

  // Update quote
  static async updateQuote(id, quoteData) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/quotes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating quote:', error);
      throw error;
    }
  }

  // Update quote status
  static async updateQuoteStatus(id, status, userId = 'System User') {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/quotes/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, userId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating quote status:', error);
      throw error;
    }
  }

  // Submit quote
  static async submitQuote(id, userId = 'System User') {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/quotes/${id}/submit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle already submitted quotes gracefully
        if (response.status === 400 && errorData.message === 'Quote is already submitted') {
          console.log('Quote is already submitted, fetching current quote');
          // Return the existing quote instead of throwing an error
          return await this.getQuote(id);
        }
        
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error submitting quote:', error);
      throw error;
    }
  }

  // Duplicate quote
  static async duplicateQuote(id) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/quotes/${id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error duplicating quote:', error);
      throw error;
    }
  }

  // Delete quote
  static async deleteQuote(id) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/quotes/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting quote:', error);
      throw error;
    }
  }

  // Get quotes summary/statistics
  static async getQuotesSummary() {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/quotes/stats/summary`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching quotes summary:', error);
      throw error;
    }
  }

  // Export quotes data
  static async exportQuotes(filters = {}, format = 'json') {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.clientName) queryParams.append('clientName', filters.clientName);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);

      const response = await authenticatedFetch(`${API_BASE_URL}/quotes/export/data?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (format === 'csv') {
        const blob = await response.blob();
        return blob;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error exporting quotes:', error);
      throw error;
    }
  }

  // Save quotation (create or update based on existence)
  static async saveQuotation(quotationData) {
    try {
      // Check if backend is available
      const backendAvailable = await this.isBackendAvailable();
      
      if (!backendAvailable) {
        console.warn('Backend is not available. Quote will only be saved locally.');
        // Fallback to localStorage only
        const quotes = JSON.parse(localStorage.getItem('quotationsHistory') || '[]');
        const newQuote = {
          ...quotationData,
          _id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        quotes.push(newQuote);
        localStorage.setItem('quotationsHistory', JSON.stringify(quotes));
        return newQuote;
      }

      // First check if quotation exists
      const existingQuote = await this.getQuoteByNumber(quotationData.quotationNumber)
        .catch(() => null); // If not found, return null

      if (existingQuote) {
        // Update existing quote
        return await this.updateQuote(existingQuote._id, quotationData);
      } else {
        // Create new quote
        return await this.createQuote(quotationData);
      }
    } catch (error) {
      console.error('Error saving quotation:', error);
      throw error;
    }
  }

  // Submit quotation (save first, then submit)
  static async submitQuotation(quotationData, userId = 'System User') {
    try {
      // Check if backend is available
      const backendAvailable = await this.isBackendAvailable();
      
      if (!backendAvailable) {
        console.warn('Backend is not available. Quote will only be saved locally with submitted status.');
        // Fallback to localStorage only
        const quotes = JSON.parse(localStorage.getItem('quotationsHistory') || '[]');
        const newQuote = {
          ...quotationData,
          _id: Date.now().toString(),
          status: 'submitted',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          submittedAt: new Date().toISOString(),
          submittedBy: userId
        };
        quotes.push(newQuote);
        localStorage.setItem('quotationsHistory', JSON.stringify(quotes));
        return newQuote;
      }

      // First save/update the quotation
      const savedQuote = await this.saveQuotation(quotationData);
      
      // Check if the quote is already submitted
      if (savedQuote.status === 'submitted') {
        console.log('Quote is already submitted, returning existing quote');
        return savedQuote;
      }
      
      // Then submit it
      return await this.submitQuote(savedQuote._id, userId);
    } catch (error) {
      console.error('Error submitting quotation:', error);
      throw error;
    }
  }

  // Get status options for filtering
  static getStatusOptions() {
    return [
      { value: 'draft', label: 'Draft', color: '#6c757d' },
      { value: 'submitted', label: 'Submitted', color: '#007bff' },
      { value: 'approved', label: 'Approved', color: '#28a745' },
      { value: 'rejected', label: 'Rejected', color: '#dc3545' },
      { value: 'archived', label: 'Archived', color: '#6f42c1' }
    ];
  }

  // Format currency for display
  static formatCurrency(amount, currency = 'INR') {
    if (amount == null || isNaN(amount)) return '₹0.00';
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency === 'INR' ? 'INR' : 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Format date for display
  static formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Get status badge class for styling
  static getStatusBadgeClass(status) {
    const statusClasses = {
      draft: 'badge-secondary',
      submitted: 'badge-primary',
      approved: 'badge-success',
      rejected: 'badge-danger',
      archived: 'badge-dark'
    };
    return statusClasses[status] || 'badge-secondary';
  }

  // Advanced Analytics
  static async getAdvancedAnalytics(filters = {}) {
    try {
      const backendAvailable = await this.isBackendAvailable();
      
      if (!backendAvailable) {
        // Fallback to localStorage analytics
        const quotes = JSON.parse(localStorage.getItem('quotationsHistory') || '[]');
        return this.calculateLocalAnalytics(quotes, filters);
      }

      const queryParams = new URLSearchParams();
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);

      const response = await authenticatedFetch(`${API_BASE_URL}/quotes/analytics?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }

  // Calculate analytics from local storage
  static calculateLocalAnalytics(quotes, filters) {
    // Apply date filters
    let filteredQuotes = quotes;
    if (filters.dateFrom || filters.dateTo) {
      filteredQuotes = quotes.filter(quote => {
        const quoteDate = new Date(quote.createdAt);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
        
        return (!fromDate || quoteDate >= fromDate) && (!toDate || quoteDate <= toDate);
      });
    }

    const summary = {
      total: filteredQuotes.length,
      draft: filteredQuotes.filter(q => q.status === 'draft').length,
      submitted: filteredQuotes.filter(q => q.status === 'submitted').length,
      approved: filteredQuotes.filter(q => q.status === 'approved').length,
      rejected: filteredQuotes.filter(q => q.status === 'rejected').length,
      totalValue: filteredQuotes.reduce((sum, q) => sum + (q.pricing?.total || 0), 0),
    };
    
    summary.avgValue = summary.total > 0 ? summary.totalValue / summary.total : 0;
    summary.conversionRate = summary.total > 0 ? 
      (summary.approved / (summary.submitted + summary.approved + summary.rejected)) * 100 : 0;

    // Top clients
    const clientMap = {};
    filteredQuotes.forEach(q => {
      const clientName = q.clientInfo?.name || 'Unknown';
      if (!clientMap[clientName]) {
        clientMap[clientName] = { name: clientName, count: 0, value: 0 };
      }
      clientMap[clientName].count++;
      clientMap[clientName].value += q.pricing?.total || 0;
    });
    
    const topClients = Object.values(clientMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Top products
    const productMap = {};
    filteredQuotes.forEach(q => {
      const windowType = q.selectedWindowType || 'Unknown';
      if (!productMap[windowType]) {
        productMap[windowType] = { type: windowType, count: 0, value: 0 };
      }
      productMap[windowType].count++;
      productMap[windowType].value += q.pricing?.total || 0;
    });
    
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      summary,
      trends: { daily: [] }, // Simplified for local storage
      topClients,
      topProducts
    };
  }

  // Bulk Delete
  static async bulkDeleteQuotes(quoteIds) {
    try {
      const backendAvailable = await this.isBackendAvailable();
      
      if (!backendAvailable) {
        // Handle localStorage bulk delete
        const quotes = JSON.parse(localStorage.getItem('quotationsHistory') || '[]');
        const filteredQuotes = quotes.filter(q => !quoteIds.includes(q._id));
        localStorage.setItem('quotationsHistory', JSON.stringify(filteredQuotes));
        return { deletedCount: quoteIds.length };
      }

      const response = await authenticatedFetch(`${API_BASE_URL}/quotes/bulk/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quoteIds }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in bulk delete:', error);
      throw error;
    }
  }

  // Bulk Status Update
  static async bulkUpdateStatus(quoteIds, status, userId = 'System User') {
    try {
      const backendAvailable = await this.isBackendAvailable();
      
      if (!backendAvailable) {
        // Handle localStorage bulk status update
        const quotes = JSON.parse(localStorage.getItem('quotationsHistory') || '[]');
        const updatedQuotes = quotes.map(q => {
          if (quoteIds.includes(q._id)) {
            return {
              ...q,
              status,
              lastModifiedBy: userId,
              lastModifiedDate: new Date().toISOString()
            };
          }
          return q;
        });
        localStorage.setItem('quotationsHistory', JSON.stringify(updatedQuotes));
        return { modifiedCount: quoteIds.length };
      }

      const response = await authenticatedFetch(`${API_BASE_URL}/quotes/bulk/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quoteIds, status, userId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in bulk status update:', error);
      throw error;
    }
  }

  // Compare Quotes
  static async compareQuotes(quoteIds) {
    try {
      const backendAvailable = await this.isBackendAvailable();
      
      if (!backendAvailable) {
        // Handle localStorage comparison
        const quotes = JSON.parse(localStorage.getItem('quotationsHistory') || '[]');
        const quotesToCompare = quotes.filter(q => quoteIds.includes(q._id));
        return {
          quotes: quotesToCompare,
          differences: this.analyzeLocalDifferences(quotesToCompare),
          similarities: this.analyzeLocalSimilarities(quotesToCompare)
        };
      }

      const response = await authenticatedFetch(`${API_BASE_URL}/quotes/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quoteIds }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error comparing quotes:', error);
      throw error;
    }
  }

  // Local comparison helpers
  static analyzeLocalDifferences(quotes) {
    const differences = {};
    const fields = ['status', 'selectedWindowType', 'pricing.total', 'clientInfo.name'];
    
    fields.forEach(field => {
      const values = quotes.map(quote => this.getNestedValue(quote, field));
      const uniqueValues = [...new Set(values)];
      
      if (uniqueValues.length > 1) {
        differences[field] = {
          field: field,
          values: quotes.map((quote, index) => ({
            quoteId: quote._id,
            quotationNumber: quote.quotationNumber,
            value: values[index]
          }))
        };
      }
    });
    
    return differences;
  }

  static analyzeLocalSimilarities(quotes) {
    const similarities = {};
    const fields = ['selectedWindowType', 'clientInfo.company', 'status'];
    
    fields.forEach(field => {
      const values = quotes.map(quote => this.getNestedValue(quote, field));
      const uniqueValues = [...new Set(values)];
      
      if (uniqueValues.length === 1) {
        similarities[field] = {
          field: field,
          value: uniqueValues[0]
        };
      }
    });
    
    return similarities;
  }

  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  // Get Quote Revisions
  static async getQuoteRevisions(quoteId) {
    try {
      const backendAvailable = await this.isBackendAvailable();
      
      if (!backendAvailable) {
        // For localStorage, we don't track revisions
        return [];
      }

      const response = await authenticatedFetch(`${API_BASE_URL}/quotes/${quoteId}/revisions`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting quote revisions:', error);
      throw error;
    }
  }
}

export default QuoteService;
