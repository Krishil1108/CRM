const API_BASE_URL = 'http://localhost:5000/api';

class ClientService {
  // Get all clients
  static async getAllClients() {
    try {
      const response = await fetch(`${API_BASE_URL}/clients`);
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  }

  // Create a new client
  static async createClient(clientData) {
    try {
      const response = await fetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create client');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  // Update a client
  static async updateClient(clientId, updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update client');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  // Delete a client
  static async deleteClient(clientId) {
    try {
      const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete client');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }

  // Get a single client
  static async getClient(clientId) {
    try {
      const response = await fetch(`${API_BASE_URL}/clients/${clientId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch client');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching client:', error);
      throw error;
    }
  }
}

export default ClientService;