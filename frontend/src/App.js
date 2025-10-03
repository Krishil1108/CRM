import React, { useState, useEffect } from 'react';
import './App.css';
import { CompanyProvider } from './CompanyContext';
import Sidebar from './Sidebar';
import HomePage from './HomePage';
import ClientsPage from './ClientsPage';
import InventoryPage from './InventoryPage';
import ReportsPage from './ReportsPage';
import SettingsPage from './SettingsPage';

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
      case 'reports':
        return <ReportsPage />;
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
      <div className="App">
        <Sidebar 
          isExpanded={isSidebarExpanded} 
          toggleSidebar={toggleSidebar}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
        
        {/* Main content area - Dynamic page content */}
        <div className={`main-content ${isSidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
          {renderCurrentPage()}
        </div>
      </div>
    </CompanyProvider>
  );
}

export default App;