import React, { useState } from 'react';
import { useCompany } from './CompanyContext';
import './PageContent.css';

const SettingsPage = () => {
  const { companyInfo, updateCompanyInfo } = useCompany();
  const [formData, setFormData] = useState(companyInfo);
  const [saved, setSaved] = useState(false);

  const logoIcons = {
    building: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
      </svg>
    ),
    rocket: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.19 6.35c-2.04 2.29-3.44 5.58-3.44 5.58s2.12.21 4.91.21c.84 0 1.65-.04 2.34-.07-1.15-2.07-2.59-3.87-3.81-5.72z"/>
        <path d="M11.17 17s-3.29-1.4-5.58-3.44c1.85 1.22 3.65 2.66 5.72 3.81.03-.69.07-1.5.07-2.34 0-2.8-.21-4.91-.21-4.91z"/>
        <path d="M14.94 8.93c-.94-.49-1.69-1.19-2.24-2.03 2.04-2.29 5.58-3.44 5.58-3.44s1.4 3.29 3.44 5.58c-.84-.55-1.54-1.3-2.03-2.24.03-.69.07-1.5.07-2.34 0-2.8-.21-4.91-.21-4.91s-2.12.21-4.91.21c-.84 0-1.65.04-2.34.07z"/>
      </svg>
    ),
    briefcase: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 16V8a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zM20 7h-3V6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM9 6h6v1H9V6z"/>
      </svg>
    ),
    star: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
      </svg>
    ),
    diamond: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 2l2 6h8l2-6H6zm3.5 7L12 22l2.5-13h-5zM2 9l4 1.5L12 22 2 9zm20 0L12 22l6-11.5L22 9z"/>
      </svg>
    ),
    target: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
        <circle cx="12" cy="12" r="5"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    ),
    globe: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
    ),
    chart: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
      </svg>
    )
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e) => {
    const selectedLogo = e.target.value;
    setFormData(prev => ({
      ...prev,
      logo: logoIcons[selectedLogo]
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateCompanyInfo(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setFormData(companyInfo);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your company information and preferences</p>
      </div>
      
      <div className="page-content">
        <div className="settings-sections">
          {/* Company Information Section */}
          <div className="settings-section">
            <h2>Company Information</h2>
            <p>Update your company details that appear throughout the application</p>
            
            <form onSubmit={handleSave} className="settings-form">
              <div className="form-group">
                <label htmlFor="name">Company Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="logo">Company Logo</label>
                <select
                  id="logo"
                  name="logo"
                  value={typeof formData.logo === 'string' ? formData.logo : 'building'}
                  onChange={handleLogoChange}
                  className="logo-select"
                >
                  <option value="building">🏢 Building</option>
                  <option value="rocket">🚀 Rocket</option>
                  <option value="briefcase">💼 Briefcase</option>
                  <option value="star">⭐ Star</option>
                  <option value="diamond">💎 Diamond</option>
                  <option value="target">🎯 Target</option>
                  <option value="globe">🌐 Globe</option>
                  <option value="chart">📊 Chart</option>
                </select>
                <small>Choose from modern professional icons for your company</small>
              </div>

              <div className="form-group">
                <label htmlFor="tagline">Company Tagline</label>
                <input
                  type="text"
                  id="tagline"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleInputChange}
                  placeholder="Enter company tagline"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  Save Changes
                </button>
                <button type="button" onClick={handleReset} className="reset-btn">
                  Reset
                </button>
              </div>

              {saved && (
                <div className="success-message">
                  ✅ Company information saved successfully!
                </div>
              )}
            </form>
          </div>

          {/* Preview Section */}
          <div className="settings-section">
            <h2>Preview</h2>
            <p>This is how your company information will appear on the homepage</p>
            
            <div className="company-preview">
              <div className="preview-header">
                <div className="preview-logo">
                  {typeof formData.logo === 'string' ? formData.logo : formData.logo}
                </div>
                <div className="preview-info">
                  <h3>{formData.name}</h3>
                  <p>{formData.tagline}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;