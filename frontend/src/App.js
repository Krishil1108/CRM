import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './styles/theme.css';
import { CompanyProvider } from './CompanyContext';
import { AppModeProvider } from './contexts/AppModeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from './LoginPage';
import Sidebar from './Sidebar';
import HomePage from './HomePage';
import ClientsPage from './ClientsPage';
import InventoryPage from './InventoryPage';
import DashboardPage from './DashboardPage';
import SettingsPage from './SettingsPage';
import QuotationPage from './QuotationPageADS';
import QuoteHistoryPage from './QuoteHistoryPage';
import UserManagementPage from './UserManagementPage';
import RoleManagementPage from './RoleManagementPage';

function App() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  return (
    <Router>
      <AuthProvider>
        <CompanyProvider>
          <AppModeProvider>
            <ToastProvider>
              <Routes>
                {/* Public route - Login */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* Protected routes with layout */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <div className="App">
                        <Sidebar 
                          isExpanded={isSidebarExpanded} 
                          toggleSidebar={toggleSidebar}
                        />
                        
                        <div className={`main-content ${isSidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
                          <Routes>
                            <Route path="/" element={<Navigate to="/home" replace />} />
                            
                            <Route 
                              path="/home" 
                              element={
                                <ProtectedRoute requireModule="home">
                                  <HomePage />
                                </ProtectedRoute>
                              } 
                            />
                            
                            <Route 
                              path="/clients" 
                              element={
                                <ProtectedRoute requireModule="clients">
                                  <ClientsPage />
                                </ProtectedRoute>
                              } 
                            />
                            
                            <Route 
                              path="/inventory" 
                              element={
                                <ProtectedRoute requireModule="inventory">
                                  <InventoryPage />
                                </ProtectedRoute>
                              } 
                            />
                            
                            <Route 
                              path="/dashboard" 
                              element={
                                <ProtectedRoute requireModule="dashboard">
                                  <DashboardPage />
                                </ProtectedRoute>
                              } 
                            />
                            
                            <Route 
                              path="/quotation-ads" 
                              element={
                                <ProtectedRoute requireModule="quotation">
                                  <QuotationPage />
                                </ProtectedRoute>
                              } 
                            />
                            
                            <Route 
                              path="/quote-history" 
                              element={
                                <ProtectedRoute requireModule="quoteHistory">
                                  <QuoteHistoryPage />
                                </ProtectedRoute>
                              } 
                            />
                            
                            <Route 
                              path="/settings" 
                              element={
                                <ProtectedRoute requireModule="settings">
                                  <SettingsPage />
                                </ProtectedRoute>
                              } 
                            />
                            
                            <Route 
                              path="/user-management" 
                              element={
                                <ProtectedRoute requireAdmin>
                                  <UserManagementPage />
                                </ProtectedRoute>
                              } 
                            />
                            
                            <Route 
                              path="/role-management" 
                              element={
                                <ProtectedRoute requireAdmin>
                                  <RoleManagementPage />
                                </ProtectedRoute>
                              } 
                            />
                            
                            <Route path="*" element={<Navigate to="/home" replace />} />
                          </Routes>
                        </div>
                      </div>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </ToastProvider>
          </AppModeProvider>
        </CompanyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;