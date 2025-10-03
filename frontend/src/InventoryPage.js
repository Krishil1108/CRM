import React from 'react';
import './PageContent.css';

const InventoryPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Inventory Management</h1>
        <p>Manage your products, stock levels, and inventory operations</p>
      </div>
      
      <div className="page-content">
        <div className="coming-soon-container">
          <div className="coming-soon-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H18V9.5h1.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
          </div>
          
          <h2>Inventory Management System</h2>
          <p className="coming-soon-description">
            This comprehensive inventory management system is currently under development. 
            It will include powerful features to help you manage your products and stock efficiently.
          </p>

          <div className="planned-features">
            <h3>Planned Features:</h3>
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div className="feature-content">
                  <h4>Product Catalog</h4>
                  <p>Add, edit, and organize your product inventory with detailed information</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                  </svg>
                </div>
                <div className="feature-content">
                  <h4>Stock Management</h4>
                  <p>Track stock levels, receive alerts for low inventory, and manage restocking</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2-7h-3V2h-4v2H5v2h14V4zM6 7v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6z"/>
                  </svg>
                </div>
                <div className="feature-content">
                  <h4>Barcode Scanning</h4>
                  <p>Quick product identification and inventory updates using barcode technology</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                  </svg>
                </div>
                <div className="feature-content">
                  <h4>Inventory Reports</h4>
                  <p>Generate detailed reports on stock movement, valuation, and performance metrics</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
                  </svg>
                </div>
                <div className="feature-content">
                  <h4>Order Management</h4>
                  <p>Track purchase orders, supplier management, and automated reordering</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="feature-content">
                  <h4>Multi-location Support</h4>
                  <p>Manage inventory across multiple warehouses and locations</p>
                </div>
              </div>
            </div>
          </div>

          <div className="development-status">
            <div className="status-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Coming Soon
            </div>
            <p>This feature is currently in development and will be available in a future update.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;