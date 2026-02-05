import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import ClientsList from './pages/clients/ClientsList';
import ClientDetail from './pages/clients/ClientDetail';
import ProjectsList from './pages/projects/ProjectsList';
import LeadsList from './pages/leads/LeadsList';
import LeadDetail from './pages/leads/LeadDetail';
import Inquiries from './pages/Inquiries';
import InquiryDetail from './pages/inquiries/InquiryDetail';
import PlaceholderPage from './pages/PlaceholderPage';

import Team from './pages/admin/Team';
import Settings from './pages/admin/Settings';
import Transactions from './pages/admin/Transactions'; // Added
import Templates from './pages/admin/Templates';
import Documents from './pages/admin/Documents';
import DocumentEdit from './pages/admin/DocumentEdit';
import Tenants from './pages/tenants/Tenants';
import TenantDetail from './pages/tenants/TenantDetail';
import Servers from './pages/servers/Servers';
import BackupAccounts from './pages/backups/BackupAccounts';
import ApiDocumentation from './pages/admin/ApiDocumentation';
import Campaigns from './pages/marketing/Campaigns';
import CampaignDetail from './pages/marketing/CampaignDetail';
import SmtpAccounts from './pages/marketing/SmtpAccounts';
import Workflows from './pages/marketing/Workflows';
import WorkflowEditor from './pages/marketing/WorkflowEditor';
import PricingPage from './pages/marketing/PricingPage';
// Lazy load Blog components to isolate ReactQuill dependencies
const BlogsList = React.lazy(() => import('./pages/blogs/BlogsList'));
const BlogEditor = React.lazy(() => import('./pages/blogs/BlogEditor'));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);


function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected Routes Wrapper */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'sales_operator', 'user']} />}>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<ClientsList />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="projects" element={<ProjectsList />} />

          {/* Leads - accessible by admin and sales_operator */}
          <Route path="leads" element={<LeadsList />} />
          <Route path="leads/:id" element={<LeadDetail />} />

          {/* Inquiries - accessible by admin and sales_operator */}
          <Route path="inquiries" element={<Inquiries />} />
          <Route path="inquiries/:id" element={<InquiryDetail />} />

          {/* Documents - accessible by admin and sales_operator */}
          <Route path="documents" element={<Documents />} />
          <Route path="documents/:id/edit" element={<DocumentEdit />} />

          {/* Admin Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="templates" element={<Templates />} />
            <Route path="team" element={<Team />} />
            <Route path="settings" element={<Settings />} />
            <Route path="transactions" element={<Transactions />} /> // Added
            <Route path="tenants" element={<Tenants />} />
            <Route path="tenants/:id" element={<TenantDetail />} />
            <Route path="infrastructure/servers" element={<Servers />} />
            <Route path="infrastructure/backups" element={<BackupAccounts />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="campaigns/:id" element={<CampaignDetail />} />
            <Route path="smtp-accounts" element={<SmtpAccounts />} />
            <Route path="workflows" element={<Workflows />} />
            <Route path="workflows/new" element={<WorkflowEditor />} />
            <Route path="workflows/:id" element={<Workflows />} />
            <Route path="workflows/:id/edit" element={<WorkflowEditor />} />
            <Route path="api-docs" element={<ApiDocumentation />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="blogs" element={
              <Suspense fallback={<PageLoader />}>
                <BlogsList />
              </Suspense>
            } />
            <Route path="blogs/new" element={
              <Suspense fallback={<PageLoader />}>
                <BlogEditor />
              </Suspense>
            } />
            <Route path="blogs/:id/edit" element={
              <Suspense fallback={<PageLoader />}>
                <BlogEditor />
              </Suspense>
            } />

          </Route>
        </Route>
      </Route>

      {/* Catch-all 404 - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#4f46e5',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '14px 18px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)',
              },
              success: {
                style: {
                  background: '#10b981',
                  boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
                },
                iconTheme: {
                  primary: '#ffffff',
                  secondary: '#10b981',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                  boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)',
                },
                iconTheme: {
                  primary: '#ffffff',
                  secondary: '#ef4444',
                },
                duration: 5000,
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
