import React from 'react';
import Calendar from './Calendar';
import { useCompany } from './CompanyContext';
import './CRMDashboard.css';

const HomePage = () => {
  const { companyInfo } = useCompany();

  return (
    <div className="page-container">
      <div className="crm-header">
        <div className="company-header">
          <div className="company-logo">
            {typeof companyInfo.logo === 'string' ? companyInfo.logo : companyInfo.logo}
          </div>
          <div className="company-info">
            <h1 className="company-name">{companyInfo.name}</h1>
            <p className="company-tagline">{companyInfo.tagline}</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="action-btn primary">+ Add new</button>
          <button className="action-btn">Export</button>
        </div>
      </div>
      
      <div className="crm-content">
        {/* Top Navigation Tabs */}
        <div className="crm-tabs">
          <div className="tab active">Overview</div>
          <div className="tab">Processing</div>
          <div className="tab">Opportunity stages</div>
          <div className="tab">Products</div>
          <div className="tab">History</div>
          <div className="tab">News</div>
        </div>

        {/* Main Dashboard Content */}
        <div className="crm-dashboard">
          {/* Left Section - Calendar and Metrics */}
          <div className="dashboard-sidebar">
            <div className="calendar-section">
              <Calendar />
            </div>
            
            <div className="activity-section">
              <h3>Last activity</h3>
              <div className="activity-entry">
                <span className="activity-time">10/03/2025 3:15 PM</span>
                <p>Updated opportunity stage from "Initial contact" to "Proposal sent"</p>
              </div>
              <div className="activity-entry">
                <span className="activity-time">10/02/2025 2:10 PM</span>
                <p>Added new lead: Sarah Johnson</p>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="dashboard-main">
            {/* Metric Cards */}
            <div className="metrics-grid">
              <div className="metric-card blue">
                <div className="metric-header">
                  <span className="metric-label">Days in funnel</span>
                </div>
                <div className="metric-number">16</div>
                <div className="metric-footer">
                  <span>Marketing management...</span>
                  <span className="metric-status">Andrew Baker</span>
                </div>
              </div>

              <div className="metric-card blue-dark">
                <div className="metric-header">
                  <span className="metric-label">Days at current stage</span>
                </div>
                <div className="metric-number">14</div>
                <div className="metric-footer">
                  <span>Real-time</span>
                  <span className="metric-status">Andrew Baker</span>
                </div>
              </div>

              <div className="metric-card orange">
                <div className="metric-header">
                  <span className="metric-label">Leads won</span>
                </div>
                <div className="metric-number">6</div>
                <div className="metric-footer">
                  <span>Account</span>
                  <span className="metric-status">Corner</span>
                </div>
              </div>

              <div className="metric-card green">
                <div className="metric-header">
                  <span className="metric-label">Outgoing calls</span>
                </div>
                <div className="metric-number">4</div>
                <div className="metric-footer">
                  <span>6/1/2025 2:25 PM</span>
                  <span className="metric-status">Direct call</span>
                </div>
              </div>
            </div>

            {/* Overview Section */}
            <div className="overview-section">
              <div className="section-header">
                <h3>Overview</h3>
                <div className="section-actions">
                  <button className="icon-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
                    </svg>
                  </button>
                  <button className="icon-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="overview-content">
                <div className="progress-item">
                  <span className="progress-label">Marketing management system and licenses</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '75%'}}></div>
                  </div>
                  <span className="progress-value">75%</span>
                </div>
                
                <div className="progress-item">
                  <span className="progress-label">Marketing software solutions</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '60%'}}></div>
                  </div>
                  <span className="progress-value">60%</span>
                </div>
                
                <div className="overview-notes">
                  <p><strong>Comments:</strong></p>
                  <p>New client: First task, The client needs marketing system and licenses.</p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="next-steps">
              <h4>Next Steps</h4>
              <div className="step-item">
                <span className="step-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </span>
                <span>Assign opportunity owner</span>
              </div>
              <div className="step-item">
                <span className="step-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                </span>
                <span>Real Peterson - 16.12.2021</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;