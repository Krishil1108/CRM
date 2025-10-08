const API_BASE_URL = 'http://localhost:5001/api';

class InventoryService {
  static async getAllInventory(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.category && filters.category !== 'all') {
        queryParams.append('category', filters.category);
      }
      
      if (filters.status && filters.status !== 'all') {
        queryParams.append('status', filters.status);
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
      
      const url = `${API_BASE_URL}/inventory${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory items');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  }

  static async getInventoryById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/${id}`);
      
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
      const response = await fetch(`${API_BASE_URL}/inventory`, {
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
      const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
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