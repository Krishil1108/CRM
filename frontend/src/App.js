import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './styles/theme.css';
import { CompanyProvider } from './CompanyContext';
import { AppModeProvider } from './contexts/AppModeContext';
import Sidebar from './Sidebar';
import HomePage from './HomePage';
import ClientsPage from './ClientsPage';
import InventoryPage from './InventoryPage';
import DashboardPage from './DashboardPage';
import SettingsPage from './SettingsPage';
import QuotationPage from './QuotationPageADS';
import QuoteHistoryPage from './QuoteHistoryPage';

function App() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  return (
    <Router>
      <CompanyProvider>
        <AppModeProvider>
          <div className="App">
            <Sidebar 
              isExpanded={isSidebarExpanded} 
              toggleSidebar={toggleSidebar}
            />
            
            {/* Main content area - Dynamic page content */}
            <div className={`main-content ${isSidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
              <Routes>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/quotation-ads" element={<QuotationPage />} />
                <Route path="/quote-history" element={<QuoteHistoryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                {/* Fallback route for any unmatched paths */}
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </div>
          </div>
        </AppModeProvider>
      </CompanyProvider>
    </Router>
  );
}

export default App;