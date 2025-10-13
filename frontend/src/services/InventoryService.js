const API_BASE_URL = 'http://localhost:5000/api';

class InventoryService {
  // Get all inventory items with enhanced filtering
  static async getAllInventory(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.category && filters.category !== 'all') {
        queryParams.append('category', filters.category);
      }
      
      if (filters.categoryType && filters.categoryType !== 'all') {
        queryParams.append('categoryType', filters.categoryType);
      }
      
      if (filters.status && filters.status !== 'all') {
        queryParams.append('status', filters.status);
      }
      
      if (filters.windowType) {
        queryParams.append('windowType', filters.windowType);
      }
      
      if (filters.glassType) {
        queryParams.append('glassType', filters.glassType);
      }
      
      if (filters.frameMaterial) {
        queryParams.append('frameMaterial', filters.frameMaterial);
      }
      
      if (filters.lowStock) {
        queryParams.append('lowStock', 'true');
      }
      
      if (filters.search) {
        queryParams.append('search', filters.search);
      }
      
      if (filters.sortBy) {
        queryParams.append('sortBy', filters.sortBy);
      }
      
      if (filters.sortOrder) {
        queryParams.append('sortOrder', filters.sortOrder);
      }
      
      if (filters.page) {
        queryParams.append('page', filters.page);
      }
      
      if (filters.limit) {
        queryParams.append('limit', filters.limit);
      }
      
      const url = `${API_BASE_URL}/inventory/items${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory items');
      }
      
      const data = await response.json();
      return data.items || data; // Handle both paginated and non-paginated responses
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  }

  // Get all inventory categories
  static async getAllCategories(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.type) {
        queryParams.append('type', filters.type);
      }
      
      if (filters.active !== undefined) {
        queryParams.append('active', filters.active);
      }
      
      const url = `${API_BASE_URL}/inventory/categories/list${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Create new category
  // Alias methods for compatibility
  static async getAllItems(filters = {}) {
    return this.getAllInventory(filters);
  }

  static async createItem(itemData) {
    return this.createInventoryItem(itemData);
  }

  static async updateItem(id, itemData) {
    return this.updateInventoryItem(id, itemData);
  }

  static async deleteItem(id) {
    return this.deleteInventoryItem(id);
  }

  // Get all categories
  static async getCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/categories`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  static async createCategory(categoryData) {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create category');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  static async getInventoryById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/items/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory item');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      throw error;
    }
  }

  static async createInventoryItem(itemData) {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create inventory item');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  static async updateInventoryItem(id, itemData) {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update inventory item');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  // Stock management methods
  static async addStock(id, stockData) {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/items/${id}/stock/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stockData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add stock');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding stock:', error);
      throw error;
    }
  }

  static async consumeStock(id, stockData) {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/items/${id}/stock/consume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stockData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to consume stock');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error consuming stock:', error);
      throw error;
    }
  }

  static async reserveStock(id, stockData) {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/items/${id}/stock/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stockData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reserve stock');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error reserving stock:', error);
      throw error;
    }
  }

  // Get inventory dashboard stats
  static async getDashboardStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/dashboard/stats`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // Get low stock report
  static async getLowStockItems() {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/reports/low-stock`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch low stock items');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  }

  static async deleteInventoryItem(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete inventory item');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }

  static async bulkUpdateQuantities(updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/bulk-update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to bulk update inventory');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error bulk updating inventory:', error);
      throw error;
    }
  }

  static async getInventoryStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/stats/summary`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory statistics');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      throw error;
    }
  }

  // Utility methods
  static calculateTotalValue(quantity, unitPrice) {
    // Use precise calculation to avoid floating-point precision issues
    return Math.round(((quantity || 0) * (unitPrice || 0)) * 100) / 100;
  }

  static determineStatus(quantity, reorderLevel = 10) {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= reorderLevel) return 'Low Stock';
    return 'In Stock';
  }

  static formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  }

  static generateSKU(name, category) {
    const namePart = name.substring(0, 3).toUpperCase();
    const categoryPart = category.substring(0, 2).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${namePart}-${categoryPart}-${randomPart}`;
  }
}

export default InventoryService;