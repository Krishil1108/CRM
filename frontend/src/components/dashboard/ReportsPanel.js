import React from 'react';
import ClientReports from './ClientReports';
import InventoryReports from './InventoryReports';

const ReportsPanel = ({
  activeTab,
  onTabChange,
  graphType,
  clientData,
  inventoryData,
  dateRange,
  clientFilters,
  inventoryFilters,
  loading,
  error
}) => {
  
  const tabs = [
    { id: 'clients', label: 'Client Reports', icon: '👥' },
    { id: 'inventory', label: 'Inventory Reports', icon: '📦' }
  ];

  if (loading) {
    return (
      <div className="reports-panel">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-panel">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-panel">
      {/* Tab Navigation */}
      <div className="reports-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Filter Status Indicator */}
      {((activeTab === 'clients' && (clientFilters?.status !== 'all' || clientFilters?.type !== 'all')) ||
        (activeTab === 'inventory' && (inventoryFilters?.status !== 'all' || inventoryFilters?.category !== 'all'))) && (
        <div className="filter-status">
          <span className="filter-indicator">🔍 Filters Applied:</span>
          {activeTab === 'clients' ? (
            <>
              {clientFilters?.status !== 'all' && (
                <span className="filter-tag">Status: {clientFilters.status}</span>
              )}
              {clientFilters?.type !== 'all' && (
                <span className="filter-tag">Type: {clientFilters.type}</span>
              )}
            </>
          ) : (
            <>
              {inventoryFilters?.status !== 'all' && (
                <span className="filter-tag">
                  Status: {inventoryFilters.status === 'inStock' ? 'In Stock' : 
                           inventoryFilters.status === 'outOfStock' ? 'Out of Stock' : 'Low Stock'}
                </span>
              )}
              {inventoryFilters?.category !== 'all' && (
                <span className="filter-tag">Category: {inventoryFilters.category}</span>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab Content */}
      <div className="reports-content">
        {activeTab === 'clients' ? (
          <ClientReports
            data={clientData}
            graphType={graphType}
            dateRange={dateRange}
          />
        ) : (
          <InventoryReports
            data={inventoryData}
            graphType={graphType}
            dateRange={dateRange}
          />
        )}
      </div>

      {/* Reports Summary */}
      <div className="reports-summary">
        <div className="summary-stats">
          {activeTab === 'clients' ? (
            <>
              <div className="stat-item">
                <span className="stat-value">{clientData?.totalClients || 0}</span>
                <span className="stat-label">
                  {clientFilters?.status !== 'all' ? `${clientFilters.status.charAt(0).toUpperCase() + clientFilters.status.slice(1)} Clients` : 'Total Clients'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{clientData?.activeClients || 0}</span>
                <span className="stat-label">Active Clients</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{clientData?.newClientsThisMonth || 0}</span>
                <span className="stat-label">New This Month</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{clientData?.growthRate || '0%'}</span>
                <span className="stat-label">Growth Rate</span>
              </div>
            </>
          ) : (
            <>
              <div className="stat-item">
                <span className="stat-value">{inventoryData?.totalItems || 0}</span>
                <span className="stat-label">
                  {inventoryFilters?.status !== 'all' ? 
                    `${inventoryFilters.status === 'inStock' ? 'In Stock' : 
                      inventoryFilters.status === 'outOfStock' ? 'Out of Stock' : 'Low Stock'} Items` : 
                    'Total Items'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{inventoryData?.inStockItems || 0}</span>
                <span className="stat-label">In Stock</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{inventoryData?.lowStockItems || 0}</span>
                <span className="stat-label">Low Stock</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">₹{inventoryData?.totalValue?.toLocaleString('en-IN') || '0'}</span>
                <span className="stat-label">Total Value</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPanel;