import React from 'react';
import './PageContent.css';

const ReportsPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <p>Generate comprehensive reports and analyze your business data</p>
      </div>
      
      <div className="page-content">
        <div className="coming-soon-container">
          <div className="coming-soon-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
          </div>
          
          <h2>Advanced Reporting System</h2>
          <p className="coming-soon-description">
            Our comprehensive reporting and analytics platform is being developed to provide you with 
            powerful insights and data-driven decision making capabilities.
          </p>

          <div className="planned-features">
            <h3>Planned Report Types:</h3>
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A3.002 3.002 0 0 0 17.06 7H16.94c-.4 0-.82.08-1.19.22L13.9 8.5A2.001 2.001 0 0 0 15.69 11L17 10.35V22h3z"/>
                  </svg>
                </div>
                <div className="feature-content">
                  <h4>Client Reports</h4>
                  <p>Detailed client analytics, engagement metrics, and relationship insights</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                  </svg>
                </div>
                <div className="feature-content">
                  <h4>Financial Reports</h4>
                  <p>Revenue analysis, profit margins, expense tracking, and financial forecasting</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z"/>
                  </svg>
                </div>
                <div className="feature-content">
                  <h4>Inventory Reports</h4>
                  <p>Stock levels, movement analysis, valuation reports, and reorder recommendations</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
                  </svg>
                </div>
                <div className="feature-content">
                  <h4>Performance Analytics</h4>
                  <p>KPI tracking, trend analysis, and business performance dashboards</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
                  </svg>
                </div>
                <div className="feature-content">
                  <h4>Time-based Reports</h4>
                  <p>Daily, weekly, monthly, and custom date range reporting capabilities</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                  </svg>
                </div>
                <div className="feature-content">
                  <h4>Export Options</h4>
                  <p>Export reports to PDF, Excel, CSV formats for external sharing and analysis</p>
                </div>
              </div>
            </div>
          </div>

          <div className="report-preview">
            <h3>Sample Report Dashboard</h3>
            <div className="dashboard-preview">
              <div className="preview-chart">
                <div className="chart-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
                  </svg>
                  <p>Interactive Charts</p>
                </div>
              </div>
              <div className="preview-metrics">
                <div className="metric-preview">
                  <div className="metric-value">$45,320</div>
                  <div className="metric-label">Monthly Revenue</div>
                </div>
                <div className="metric-preview">
                  <div className="metric-value">1,247</div>
                  <div className="metric-label">Total Orders</div>
                </div>
                <div className="metric-preview">
                  <div className="metric-value">89%</div>
                  <div className="metric-label">Customer Satisfaction</div>
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
            <p>Advanced reporting features are currently in development and will be available in a future update.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;