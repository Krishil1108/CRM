import axios from 'axios';

const API_URL = 'http://localhost:5000/api/search';

const SearchService = {
  /**
   * Perform a global search across all entities
   * @param {string} query - Search query string
   * @returns {Promise} Promise with search results
   */
  searchAll: async (query) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_URL, {
        params: { q: query },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Search error:', error);
      throw error.response?.data || { message: 'Failed to perform search' };
    }
  },

  /**
   * Filter search results by category
   * @param {Array} results - Array of search results
   * @param {string} category - Category to filter by
   * @returns {Array} Filtered results
   */
  filterByCategory: (results, category) => {
    if (!category || category === 'All') {
      return results;
    }
    return results.filter(result => result.category === category);
  },

  /**
   * Get unique categories from search results
   * @param {Array} results - Array of search results
   * @returns {Array} Array of unique category names
   */
  getCategories: (results) => {
    const categories = new Set(results.map(result => result.category));
    return ['All', ...Array.from(categories)];
  },

  /**
   * Group results by category
   * @param {Array} results - Array of search results
   * @returns {Object} Results grouped by category
   */
  groupByCategory: (results) => {
    return results.reduce((acc, result) => {
      if (!acc[result.category]) {
        acc[result.category] = [];
      }
      acc[result.category].push(result);
      return acc;
    }, {});
  }
};

export default SearchService;
