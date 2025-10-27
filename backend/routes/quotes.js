const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');

// Get all quotes with pagination, filtering, and sorting
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      clientName = '',
      windowType = '',
      priceFrom = '',
      priceTo = '',
      dateFrom = '',
      dateTo = ''
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { quotationNumber: new RegExp(search, 'i') },
        { 'clientInfo.name': new RegExp(search, 'i') },
        { 'clientInfo.email': new RegExp(search, 'i') },
        { 'clientInfo.phone': new RegExp(search, 'i') },
        { 'clientInfo.company': new RegExp(search, 'i') }
      ];
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (clientName) {
      filter['clientInfo.name'] = new RegExp(clientName, 'i');
    }

    if (windowType) {
      filter.selectedWindowType = windowType;
    }
    
    if (priceFrom || priceTo) {
      filter['pricing.total'] = {};
      if (priceFrom) filter['pricing.total'].$gte = parseFloat(priceFrom);
      if (priceTo) filter['pricing.total'].$lte = parseFloat(priceTo);
    }
    
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const quotes = await Quote.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const total = await Quote.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.json({
      quotes,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        hasNext,
        hasPrev,
        totalRecords: total
      }
    });

  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ message: 'Error fetching quotes', error: error.message });
  }
});

// Get quote by ID
router.get('/:id', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }
    res.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ message: 'Error fetching quote', error: error.message });
  }
});

// Get quote by quotation number
router.get('/number/:quotationNumber', async (req, res) => {
  try {
    const quote = await Quote.findOne({ quotationNumber: req.params.quotationNumber });
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }
    res.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ message: 'Error fetching quote', error: error.message });
  }
});

// Create new quote
router.post('/', async (req, res) => {
  try {
    const quoteData = req.body;
    
    // Validate required fields
    if (!quoteData.quotationNumber || !quoteData.clientInfo?.name) {
      return res.status(400).json({ 
        message: 'Missing required fields: quotationNumber and clientInfo.name' 
      });
    }

    // Check if quotation number already exists
    const existingQuote = await Quote.findOne({ quotationNumber: quoteData.quotationNumber });
    if (existingQuote) {
      return res.status(400).json({ 
        message: 'Quotation number already exists' 
      });
    }

    const quote = new Quote(quoteData);
    await quote.save();
    
    res.status(201).json(quote);
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ message: 'Error creating quote', error: error.message });
  }
});

// Update quote
router.put('/:id', async (req, res) => {
  try {
    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastModifiedDate: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }
    
    res.json(quote);
  } catch (error) {
    console.error('Error updating quote:', error);
    res.status(500).json({ message: 'Error updating quote', error: error.message });
  }
});

// Update quote status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, userId = 'System User' } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    await quote.updateStatus(status, userId);
    res.json(quote);
  } catch (error) {
    console.error('Error updating quote status:', error);
    res.status(500).json({ message: 'Error updating quote status', error: error.message });
  }
});

// Submit quote (change status to submitted)
router.patch('/:id/submit', async (req, res) => {
  try {
    const { userId = 'System User' } = req.body;
    
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    if (quote.status === 'submitted') {
      return res.status(400).json({ message: 'Quote is already submitted' });
    }

    await quote.updateStatus('submitted', userId);
    res.json({ message: 'Quote submitted successfully', quote });
  } catch (error) {
    console.error('Error submitting quote:', error);
    res.status(500).json({ message: 'Error submitting quote', error: error.message });
  }
});

// Duplicate quote
router.post('/:id/duplicate', async (req, res) => {
  try {
    const originalQuote = await Quote.findById(req.params.id);
    if (!originalQuote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Create new quote data
    const quoteData = originalQuote.toObject();
    delete quoteData._id;
    delete quoteData.createdAt;
    delete quoteData.updatedAt;
    delete quoteData.submittedDate;
    
    // Generate new quotation number
    const timestamp = Date.now();
    quoteData.quotationNumber = `${originalQuote.quotationNumber}-COPY-${timestamp}`;
    quoteData.status = 'draft';
    quoteData.date = new Date();
    quoteData.pdfGenerated = false;
    quoteData.pdfPath = null;

    const newQuote = new Quote(quoteData);
    await newQuote.save();
    
    res.status(201).json(newQuote);
  } catch (error) {
    console.error('Error duplicating quote:', error);
    res.status(500).json({ message: 'Error duplicating quote', error: error.message });
  }
});

// Delete quote
router.delete('/:id', async (req, res) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }
    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({ message: 'Error deleting quote', error: error.message });
  }
});

// Get quotes summary/statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const summary = await Quote.getSummary();
    
    // Get total quotes count
    const totalQuotes = await Quote.countDocuments();
    
    // Get recent quotes (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentQuotes = await Quote.countDocuments({ 
      createdAt: { $gte: sevenDaysAgo } 
    });

    res.json({
      summary,
      totalQuotes,
      recentQuotes
    });
  } catch (error) {
    console.error('Error fetching quotes summary:', error);
    res.status(500).json({ message: 'Error fetching quotes summary', error: error.message });
  }
});

// Export quotes data (for reporting)
router.get('/export/data', async (req, res) => {
  try {
    const { format = 'json', ...filters } = req.query;
    
    // Build filter similar to main GET route
    const filter = {};
    if (filters.status) filter.status = filters.status;
    if (filters.clientName) filter['clientInfo.name'] = new RegExp(filters.clientName, 'i');
    if (filters.dateFrom || filters.dateTo) {
      filter.date = {};
      if (filters.dateFrom) filter.date.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) filter.date.$lte = new Date(filters.dateTo);
    }

    const quotes = await Quote.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(quotes);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=quotes.csv');
      return res.send(csv);
    }

    res.json(quotes);
  } catch (error) {
    console.error('Error exporting quotes:', error);
    res.status(500).json({ message: 'Error exporting quotes', error: error.message });
  }
});

// Helper function to convert to CSV
function convertToCSV(quotes) {
  if (!quotes.length) return '';

  const headers = [
    'Quotation Number',
    'Client Name',
    'Client Phone',
    'Client Email',
    'Status',
    'Total Amount',
    'Date Created',
    'Last Modified'
  ];

  const csvRows = [headers.join(',')];

  quotes.forEach(quote => {
    const row = [
      quote.quotationNumber,
      quote.clientInfo?.name || '',
      quote.clientInfo?.phone || '',
      quote.clientInfo?.email || '',
      quote.status,
      quote.pricing?.total || 0,
      new Date(quote.date).toLocaleDateString(),
      new Date(quote.lastModifiedDate || quote.updatedAt).toLocaleDateString()
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

// Advanced Analytics Endpoint
router.get('/analytics', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.createdAt.$lte = new Date(dateTo);
    }

    // Get basic counts and totals
    const totalQuotes = await Quote.countDocuments(dateFilter);
    const statusCounts = await Quote.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: '$pricing.total' } } }
    ]);

    // Get top clients
    const topClients = await Quote.aggregate([
      { $match: dateFilter },
      { $group: { 
        _id: '$clientInfo.name', 
        count: { $sum: 1 }, 
        totalValue: { $sum: '$pricing.total' },
        avgValue: { $avg: '$pricing.total' }
      }},
      { $sort: { totalValue: -1 } },
      { $limit: 10 }
    ]);

    // Get window type distribution
    const windowTypes = await Quote.aggregate([
      { $match: dateFilter },
      { $group: { 
        _id: '$selectedWindowType', 
        count: { $sum: 1 }, 
        totalValue: { $sum: '$pricing.total' }
      }},
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get daily trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyTrends = await Quote.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { 
        _id: { 
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 },
        totalValue: { $sum: '$pricing.total' }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Calculate conversion rate
    const submittedCount = statusCounts.find(s => s._id === 'submitted')?.count || 0;
    const approvedCount = statusCounts.find(s => s._id === 'approved')?.count || 0;
    const rejectedCount = statusCounts.find(s => s._id === 'rejected')?.count || 0;
    const conversionRate = (submittedCount + approvedCount + rejectedCount) > 0 ? 
      (approvedCount / (submittedCount + approvedCount + rejectedCount)) * 100 : 0;

    // Calculate total value
    const totalValue = statusCounts.reduce((sum, status) => sum + (status.totalValue || 0), 0);
    const avgValue = totalQuotes > 0 ? totalValue / totalQuotes : 0;

    res.json({
      summary: {
        total: totalQuotes,
        draft: statusCounts.find(s => s._id === 'draft')?.count || 0,
        submitted: submittedCount,
        approved: approvedCount,
        rejected: rejectedCount,
        totalValue,
        avgValue,
        conversionRate: Math.round(conversionRate * 100) / 100
      },
      trends: {
        daily: dailyTrends
      },
      topClients: topClients.map(client => ({
        name: client._id || 'Unknown',
        count: client.count,
        value: client.totalValue,
        avgValue: client.avgValue
      })),
      topProducts: windowTypes.map(type => ({
        type: type._id || 'Unknown',
        count: type.count,
        value: type.totalValue
      }))
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ message: 'Error retrieving analytics', error: error.message });
  }
});

// Bulk Operations
router.post('/bulk/delete', async (req, res) => {
  try {
    const { quoteIds } = req.body;
    
    if (!quoteIds || !Array.isArray(quoteIds) || quoteIds.length === 0) {
      return res.status(400).json({ message: 'Quote IDs array is required' });
    }

    const result = await Quote.deleteMany({ _id: { $in: quoteIds } });
    
    res.json({ 
      message: `Successfully deleted ${result.deletedCount} quotes`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({ message: 'Error deleting quotes', error: error.message });
  }
});

router.post('/bulk/status', async (req, res) => {
  try {
    const { quoteIds, status, userId = 'System User' } = req.body;
    
    if (!quoteIds || !Array.isArray(quoteIds) || quoteIds.length === 0) {
      return res.status(400).json({ message: 'Quote IDs array is required' });
    }

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const updateData = {
      status,
      lastModifiedBy: userId,
      lastModifiedDate: new Date()
    };

    // Add status-specific fields
    if (status === 'submitted') {
      updateData.submittedAt = new Date();
      updateData.submittedBy = userId;
    } else if (status === 'approved') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = userId;
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
      updateData.rejectedBy = userId;
    }

    const result = await Quote.updateMany(
      { _id: { $in: quoteIds } },
      updateData
    );
    
    res.json({ 
      message: `Successfully updated ${result.modifiedCount} quotes to ${status}`,
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Error in bulk status update:', error);
    res.status(500).json({ message: 'Error updating quote status', error: error.message });
  }
});

// Quote Comparison
router.post('/compare', async (req, res) => {
  try {
    const { quoteIds } = req.body;
    
    if (!quoteIds || !Array.isArray(quoteIds) || quoteIds.length < 2) {
      return res.status(400).json({ message: 'At least 2 quote IDs are required for comparison' });
    }

    if (quoteIds.length > 5) {
      return res.status(400).json({ message: 'Maximum 5 quotes can be compared at once' });
    }

    const quotes = await Quote.find({ _id: { $in: quoteIds } });
    
    if (quotes.length !== quoteIds.length) {
      return res.status(404).json({ message: 'Some quotes were not found' });
    }

    // Generate comparison data
    const comparison = {
      quotes: quotes,
      differences: analyzeQuoteDifferences(quotes),
      similarities: analyzeQuoteSimilarities(quotes)
    };
    
    res.json(comparison);
  } catch (error) {
    console.error('Error comparing quotes:', error);
    res.status(500).json({ message: 'Error comparing quotes', error: error.message });
  }
});

// Helper function to analyze quote differences
function analyzeQuoteDifferences(quotes) {
  const differences = {};
  const fields = ['status', 'selectedWindowType', 'pricing.total', 'clientInfo.name'];
  
  fields.forEach(field => {
    const values = quotes.map(quote => getNestedValue(quote, field));
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

// Helper function to analyze quote similarities
function analyzeQuoteSimilarities(quotes) {
  const similarities = {};
  const fields = ['selectedWindowType', 'clientInfo.company', 'status'];
  
  fields.forEach(field => {
    const values = quotes.map(quote => getNestedValue(quote, field));
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

// Helper function to get nested object values
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current && current[key], obj);
}

// Quote Duplicate with Revisions
router.post('/:id/duplicate', async (req, res) => {
  try {
    const originalQuote = await Quote.findById(req.params.id);
    if (!originalQuote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Create new quotation number
    const lastQuote = await Quote.findOne().sort({ quotationNumber: -1 });
    const lastNumber = lastQuote ? parseInt(lastQuote.quotationNumber.split('-')[1]) : 0;
    const newQuotationNumber = `QT-${String(lastNumber + 1).padStart(4, '0')}`;

    // Create duplicate with new number and reset status
    const duplicateData = {
      ...originalQuote.toObject(),
      _id: undefined,
      quotationNumber: newQuotationNumber,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      submittedAt: null,
      submittedBy: null,
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      originalQuoteId: originalQuote._id, // Reference to original
      revisionOf: originalQuote.quotationNumber
    };

    const duplicatedQuote = new Quote(duplicateData);
    await duplicatedQuote.save();

    res.status(201).json(duplicatedQuote);
  } catch (error) {
    console.error('Error duplicating quote:', error);
    res.status(500).json({ message: 'Error duplicating quote', error: error.message });
  }
});

// Get Quote Revisions/Versions
router.get('/:id/revisions', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Find all revisions (quotes that reference this one or have the same original)
    const revisions = await Quote.find({
      $or: [
        { originalQuoteId: req.params.id },
        { originalQuoteId: quote.originalQuoteId },
        { _id: quote.originalQuoteId }
      ]
    }).sort({ createdAt: 1 });

    res.json(revisions);
  } catch (error) {
    console.error('Error getting quote revisions:', error);
    res.status(500).json({ message: 'Error retrieving quote revisions', error: error.message });
  }
});

module.exports = router;