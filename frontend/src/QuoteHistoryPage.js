import React, { useState, useEffect } from 'react';
import './QuoteHistoryPage.css';

const QuoteHistoryPage = () => {
  const [quotations, setQuotations] = useState([]);
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadQuotations();
  }, []);

  useEffect(() => {
    filterAndSortQuotations();
  }, [quotations, searchTerm, sortBy, sortOrder]);

  const loadQuotations = () => {
    const savedQuotes = JSON.parse(localStorage.getItem('savedQuotations') || '[]');
    setQuotations(savedQuotes);
  };

  const filterAndSortQuotations = () => {
    let filtered = quotations.filter(quote => 
      quote.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.clientDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.project.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdDate);
          bValue = new Date(b.createdDate);
          break;
        case 'client':
          aValue = a.clientDetails.name.toLowerCase();
          bValue = b.clientDetails.name.toLowerCase();
          break;
        case 'amount':
          aValue = a.totalAmount || 0;
          bValue = b.totalAmount || 0;
          break;
        case 'project':
          aValue = a.project.toLowerCase();
          bValue = b.project.toLowerCase();
          break;
        default:
          aValue = a.quotationNumber;
          bValue = b.quotationNumber;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredQuotations(filtered);
  };

  const deleteQuotation = (quotationNumber) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      const updatedQuotations = quotations.filter(q => q.quotationNumber !== quotationNumber);
      localStorage.setItem('savedQuotations', JSON.stringify(updatedQuotations));
      setQuotations(updatedQuotations);
    }
  };

  const duplicateQuotation = (quotation) => {
    const newQuotation = {
      ...quotation,
      quotationNumber: `${quotation.quotationNumber}-COPY-${Date.now()}`,
      createdDate: new Date().toISOString()
    };
    
    const updatedQuotations = [...quotations, newQuotation];
    localStorage.setItem('savedQuotations', JSON.stringify(updatedQuotations));
    setQuotations(updatedQuotations);
  };

  const exportQuotation = (quotation) => {
    const dataStr = JSON.stringify(quotation, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `quotation-${quotation.quotationNumber}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const viewQuotationDetails = (quotation) => {
    setSelectedQuotation(quotation);
    setShowDetails(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (date) => {
    const quotationDate = new Date(date);
    const now = new Date();
    const daysDiff = Math.floor((now - quotationDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 7) return 'status-new';
    if (daysDiff < 30) return 'status-recent';
    return 'status-old';
  };

  if (showDetails && selectedQuotation) {
    return (
      <div className="quotation-details-container">
        <div className="details-header">
          <button 
            className="btn-back" 
            onClick={() => setShowDetails(false)}
          >
            ← Back to History
          </button>
          <h2>Quotation Details - {selectedQuotation.quotationNumber}</h2>
        </div>
        
        <div className="quotation-details-content">
          <div className="details-section">
            <h3>Basic Information</h3>
            <div className="details-grid">
              <div><strong>Quote Number:</strong> {selectedQuotation.quotationNumber}</div>
              <div><strong>Project:</strong> {selectedQuotation.project}</div>
              <div><strong>Date:</strong> {selectedQuotation.date}</div>
              <div><strong>Created:</strong> {formatDate(selectedQuotation.createdDate)}</div>
            </div>
          </div>

          <div className="details-section">
            <h3>Client Information</h3>
            <div><strong>Name:</strong> {selectedQuotation.clientDetails.name}</div>
            <div><strong>Address:</strong></div>
            <pre>{selectedQuotation.clientDetails.address}</pre>
          </div>

          <div className="details-section">
            <h3>Window Specifications ({selectedQuotation.windowSpecs.length})</h3>
            <div className="windows-details-list">
              {selectedQuotation.windowSpecs.map((window, index) => (
                <div key={index} className="window-detail-card">
                  <h4>{window.name} - {window.location}</h4>
                  <div className="window-detail-grid">
                    <div><strong>Type:</strong> {window.type}</div>
                    <div><strong>Dimensions:</strong> {window.dimensions.width} × {window.dimensions.height} mm</div>
                    <div><strong>Area:</strong> {window.computedValues.sqFtPerWindow.toFixed(2)} sq.ft</div>
                    <div><strong>Glass:</strong> {window.specifications.glass}</div>
                    <div><strong>Frame:</strong> {window.specifications.frame.material}</div>
                    <div><strong>Quantity:</strong> {window.pricing.quantity}</div>
                    <div><strong>Price:</strong> ₹{window.computedValues.totalPrice.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="details-section">
            <h3>Pricing Summary</h3>
            <div className="pricing-summary">
              <div className="price-row">
                <span>Subtotal:</span>
                <span>₹{(selectedQuotation.totalAmount / 1.18 - 2000).toFixed(2)}</span>
              </div>
              <div className="price-row">
                <span>Transport & Loading:</span>
                <span>₹2,000.00</span>
              </div>
              <div className="price-row">
                <span>GST (18%):</span>
                <span>₹{((selectedQuotation.totalAmount - 2000) * 0.18 / 1.18).toFixed(2)}</span>
              </div>
              <div className="price-row total">
                <span><strong>Grand Total:</strong></span>
                <span><strong>₹{selectedQuotation.totalAmount.toFixed(2)}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quote-history-container">
      <div className="history-header">
        <h1>📊 Quote History</h1>
        <div className="history-stats">
          <div className="stat-card">
            <div className="stat-number">{quotations.length}</div>
            <div className="stat-label">Total Quotes</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              ₹{quotations.reduce((sum, q) => sum + (q.totalAmount || 0), 0).toFixed(0)}
            </div>
            <div className="stat-label">Total Value</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {quotations.filter(q => {
                const date = new Date(q.createdDate);
                const now = new Date();
                return (now - date) / (1000 * 60 * 60 * 24) < 30;
              }).length}
            </div>
            <div className="stat-label">This Month</div>
          </div>
        </div>
      </div>

      <div className="history-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search by quote number, client name, or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="sort-section">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="date">Sort by Date</option>
            <option value="client">Sort by Client</option>
            <option value="amount">Sort by Amount</option>
            <option value="project">Sort by Project</option>
          </select>
          
          <button
            className={`sort-order-btn ${sortOrder}`}
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      <div className="quotations-list">
        {filteredQuotations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No quotations found</h3>
            <p>
              {quotations.length === 0 
                ? "You haven't created any quotations yet." 
                : "No quotations match your search criteria."
              }
            </p>
          </div>
        ) : (
          filteredQuotations.map((quotation) => (
            <div key={quotation.quotationNumber} className="quotation-card">
              <div className="quotation-card-header">
                <div className="quotation-main-info">
                  <h3>{quotation.quotationNumber}</h3>
                  <div className={`quotation-status ${getStatusColor(quotation.createdDate)}`}>
                    {getStatusColor(quotation.createdDate).replace('status-', '')}
                  </div>
                </div>
                <div className="quotation-amount">
                  ₹{quotation.totalAmount?.toFixed(2) || '0.00'}
                </div>
              </div>

              <div className="quotation-card-body">
                <div className="quotation-info-grid">
                  <div className="info-item">
                    <span className="info-label">Client:</span>
                    <span className="info-value">{quotation.clientDetails.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Project:</span>
                    <span className="info-value">{quotation.project || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Windows:</span>
                    <span className="info-value">{quotation.windowSpecs.length} items</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Created:</span>
                    <span className="info-value">{formatDate(quotation.createdDate)}</span>
                  </div>
                </div>

                <div className="window-types-summary">
                  {quotation.windowSpecs.slice(0, 3).map((window, index) => (
                    <span key={index} className="window-type-tag">
                      {window.name}
                    </span>
                  ))}
                  {quotation.windowSpecs.length > 3 && (
                    <span className="more-windows">+{quotation.windowSpecs.length - 3} more</span>
                  )}
                </div>
              </div>

              <div className="quotation-card-actions">
                <button
                  className="btn-view"
                  onClick={() => viewQuotationDetails(quotation)}
                >
                  👁️ View
                </button>
                <button
                  className="btn-duplicate"
                  onClick={() => duplicateQuotation(quotation)}
                >
                  📋 Copy
                </button>
                <button
                  className="btn-export"
                  onClick={() => exportQuotation(quotation)}
                >
                  📤 Export
                </button>
                <button
                  className="btn-delete"
                  onClick={() => deleteQuotation(quotation.quotationNumber)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuoteHistoryPage;