const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const Quote = require('../models/Quote');
const Meeting = require('../models/Meeting');
const Activity = require('../models/Activity');
const Note = require('../models/Note');
const InventoryItem = require('../models/InventoryItem');

/**
 * @route   GET /api/search
 * @desc    Search across all entities (clients, quotes, inventory, meetings, activities, notes)
 * @access  Private
 * @query   q - search query string
 */
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        results: [],
        message: 'No search query provided'
      });
    }

    const searchQuery = q.trim();
    const searchRegex = new RegExp(searchQuery, 'i'); // Case-insensitive search

    // Search in parallel across all collections
    const [clients, quotes, meetings, activities, notes, inventoryItems] = await Promise.all([
      // Search Clients
      Client.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { company: searchRegex },
          { address: searchRegex }
        ]
      })
        .limit(10)
        .select('name email phone company address createdAt')
        .lean(),

      // Search Quotes
      Quote.find({
        $or: [
          { quotationNumber: searchRegex },
          { 'clientInfo.name': searchRegex },
          { 'clientInfo.phone': searchRegex },
          { notes: searchRegex },
          { status: searchRegex }
        ]
      })
        .limit(10)
        .select('quotationNumber clientInfo totalPrice status date notes createdAt')
        .lean(),

      // Search Meetings
      Meeting.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { location: searchRegex },
          { 'client.name': searchRegex }
        ]
      })
        .limit(10)
        .select('title description date time location client status createdAt')
        .lean(),

      // Search Activities
      Activity.find({
        $or: [
          { type: searchRegex },
          { description: searchRegex },
          { 'client.name': searchRegex }
        ]
      })
        .limit(10)
        .select('type description date client priority createdAt')
        .lean(),

      // Search Notes
      Note.find({
        $or: [
          { content: searchRegex },
          { 'client.name': searchRegex }
        ]
      })
        .limit(10)
        .select('content client createdAt')
        .lean(),

      // Search Inventory Items
      InventoryItem.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { brand: searchRegex },
          { sku: searchRegex },
          { categoryType: searchRegex }
        ]
      })
        .limit(10)
        .populate('category', 'name')
        .select('name description categoryType brand sku quantity unit price createdAt')
        .lean()
    ]);

    // Format results with category labels
    const results = [
      ...clients.map(item => ({
        id: item._id,
        category: 'Client',
        title: item.name,
        subtitle: item.company || item.email,
        details: item.phone,
        icon: '👤',
        link: `/clients/${item._id}`,
        data: item
      })),
      ...quotes.map(item => ({
        id: item._id,
        category: 'Quotation',
        title: item.quotationNumber,
        subtitle: item.clientInfo?.name || 'Unknown Client',
        details: `${item.status} - ₹${item.totalPrice?.toLocaleString() || 0}`,
        icon: '📄',
        link: `/quote-history`,
        data: item
      })),
      ...meetings.map(item => ({
        id: item._id,
        category: 'Meeting',
        title: item.title,
        subtitle: item.client?.name || 'No client',
        details: `${new Date(item.date).toLocaleDateString()} at ${item.time}`,
        icon: '📅',
        link: `/calendar`,
        data: item
      })),
      ...activities.map(item => ({
        id: item._id,
        category: 'Activity',
        title: item.type,
        subtitle: item.description,
        details: item.client?.name || 'No client',
        icon: '⚡',
        link: `/clients`,
        data: item
      })),
      ...notes.map(item => ({
        id: item._id,
        category: 'Note',
        title: item.content.substring(0, 50) + (item.content.length > 50 ? '...' : ''),
        subtitle: item.client?.name || 'General note',
        details: new Date(item.createdAt).toLocaleDateString(),
        icon: '📝',
        link: `/clients`,
        data: item
      })),
      ...inventoryItems.map(item => ({
        id: item._id,
        category: 'Inventory',
        title: item.name,
        subtitle: item.category?.name || item.categoryType || 'Uncategorized',
        details: `${item.quantity || 0} ${item.unit || 'units'} - ₹${item.price?.toLocaleString() || 0}`,
        icon: '📦',
        link: `/inventory`,
        data: item
      }))
    ];

    // Sort by relevance (exact matches first, then partial matches)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === searchQuery.toLowerCase();
      const bExact = b.title.toLowerCase() === searchQuery.toLowerCase();
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

    res.json({
      success: true,
      query: searchQuery,
      totalResults: results.length,
      results: results.slice(0, 20) // Limit to 20 results total
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing search',
      error: error.message
    });
  }
});

module.exports = router;
