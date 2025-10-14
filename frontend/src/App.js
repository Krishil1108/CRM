import React, { useState, useEffect } from 'react';
import './App.css';
import './styles/theme.css';
import { CompanyProvider } from './CompanyContext';
import { AppModeProvider } from './contexts/AppModeContext';
import Sidebar from './Sidebar';
import HomePage from './HomePage';
import ClientsPage from './ClientsPage';
import InventoryPage from './InventoryPage';
import DashboardPage from './DashboardPage';
import ReportsPage from './ReportsPage';
import SettingsPage from './SettingsPage';
import QuotationPage from './QuotationPageADS';
import QuoteHistoryPage from './QuoteHistoryPage';
import ModeSelector from './components/ModeSelector';

function App() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'clients':
        return <ClientsPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'reports':
        return <ReportsPage />;
      case 'quotation':
        return <QuotationPage />;
      case 'quote-history':
        return <QuoteHistoryPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };

  // No need to prevent body scroll since sidebar is always visible
  useEffect(() => {
    // Cleanup on unmount if needed
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, []);

  return (
    <CompanyProvider>
      <AppModeProvider>
        <div className="App">
          <Sidebar 
            isExpanded={isSidebarExpanded} 
            toggleSidebar={toggleSidebar}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
          
          {/* Fixed Mode Selector */}
          <ModeSelector />
          
          {/* Main content area - Dynamic page content */}
          <div className={`main-content ${isSidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
            {renderCurrentPage()}
          </div>
        </div>
      </AppModeProvider>
    </CompanyProvider>
  );
}

export default App;