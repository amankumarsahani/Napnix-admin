import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { queryClient } from './lib/queryClient';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import DashboardLayout from './components/layout/DashboardLayout';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ClientsList = React.lazy(() => import('./pages/clients/ClientsList'));
const ClientDetail = React.lazy(() => import('./pages/clients/ClientDetail'));
const ProjectsList = React.lazy(() => import('./pages/projects/ProjectsList'));
const LeadsList = React.lazy(() => import('./pages/leads/LeadsList'));
const LeadDetail = React.lazy(() => import('./pages/leads/LeadDetail'));
const Inquiries = React.lazy(() => import('./pages/Inquiries'));
const InquiryDetail = React.lazy(() => import('./pages/inquiries/InquiryDetail'));
const Team = React.lazy(() => import('./pages/admin/Team'));
const Settings = React.lazy(() => import('./pages/admin/Settings'));
const Transactions = React.lazy(() => import('./pages/admin/Transactions'));
const Templates = React.lazy(() => import('./pages/admin/Templates'));
const Documents = React.lazy(() => import('./pages/admin/Documents'));
const DocumentEdit = React.lazy(() => import('./pages/admin/DocumentEdit'));
const Tenants = React.lazy(() => import('./pages/tenants/Tenants'));
const TenantDetail = React.lazy(() => import('./pages/tenants/TenantDetail'));
const Servers = React.lazy(() => import('./pages/servers/Servers'));
const BackupAccounts = React.lazy(() => import('./pages/backups/BackupAccounts'));
const ApiDocumentation = React.lazy(() => import('./pages/admin/ApiDocumentation'));
const MobileApp = React.lazy(() => import('./pages/admin/MobileApp'));
const Telemetry = React.lazy(() => import('./pages/system/Telemetry'));
const SiteAnalytics = React.lazy(() => import('./pages/system/SiteAnalytics'));
const Campaigns = React.lazy(() => import('./pages/marketing/Campaigns'));
const CampaignDetail = React.lazy(() => import('./pages/marketing/CampaignDetail'));
const SmtpAccounts = React.lazy(() => import('./pages/marketing/SmtpAccounts'));
const Workflows = React.lazy(() => import('./pages/marketing/Workflows'));
const WorkflowEditor = React.lazy(() => import('./pages/marketing/WorkflowEditor'));
const PricingPage = React.lazy(() => import('./pages/marketing/PricingPage'));
const BlogsList = React.lazy(() => import('./pages/blogs/BlogsList'));
const BlogEditor = React.lazy(() => import('./pages/blogs/BlogEditor'));

const EmailMarketingDashboard = React.lazy(() => import('./pages/email-marketing/Dashboard'));
const EmailContacts = React.lazy(() => import('./pages/email-marketing/Contacts'));
const EmailContactDetail = React.lazy(() => import('./pages/email-marketing/ContactDetail'));
const EmailTemplates = React.lazy(() => import('./pages/email-marketing/Templates'));
const TemplateEditor = React.lazy(() => import('./pages/email-marketing/TemplateEditor'));
const EmailCampaigns = React.lazy(() => import('./pages/email-marketing/Campaigns'));
const CampaignWizard = React.lazy(() => import('./pages/email-marketing/CampaignWizard'));
const EmailCampaignDetail = React.lazy(() => import('./pages/email-marketing/CampaignDetail'));
const EmailAutomations = React.lazy(() => import('./pages/email-marketing/Automations'));
const AutomationEditor = React.lazy(() => import('./pages/email-marketing/AutomationEditor'));
const EmailSmtp = React.lazy(() => import('./pages/email-marketing/SmtpAccounts'));
const EmailDomains = React.lazy(() => import('./pages/email-marketing/Domains'));
const ToolRegistry = React.lazy(() => import('./pages/tools/ToolRegistry'));
const Expenses = React.lazy(() => import('./pages/expenses/Expenses'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
  </div>
);

function LazyRoute({ element }) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'sales_operator', 'user']} />}>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<LazyRoute element={<Dashboard />} />} />
          <Route path="clients" element={<LazyRoute element={<ClientsList />} />} />
          <Route path="clients/:id" element={<LazyRoute element={<ClientDetail />} />} />
          <Route path="projects" element={<LazyRoute element={<ProjectsList />} />} />
          <Route path="leads" element={<LazyRoute element={<LeadsList />} />} />
          <Route path="leads/:id" element={<LazyRoute element={<LeadDetail />} />} />
          <Route path="inquiries" element={<LazyRoute element={<Inquiries />} />} />
          <Route path="inquiries/:id" element={<LazyRoute element={<InquiryDetail />} />} />
          <Route path="documents" element={<LazyRoute element={<Documents />} />} />
          <Route path="documents/:id/edit" element={<LazyRoute element={<DocumentEdit />} />} />

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="templates" element={<LazyRoute element={<Templates />} />} />
            <Route path="team" element={<LazyRoute element={<Team />} />} />
            <Route path="settings" element={<LazyRoute element={<Settings />} />} />
            <Route path="transactions" element={<LazyRoute element={<Transactions />} />} />
            <Route path="tenants" element={<LazyRoute element={<Tenants />} />} />
            <Route path="tenants/:id" element={<LazyRoute element={<TenantDetail />} />} />
            <Route path="infrastructure/servers" element={<LazyRoute element={<Servers />} />} />
            <Route path="infrastructure/backups" element={<LazyRoute element={<BackupAccounts />} />} />
            <Route path="campaigns" element={<LazyRoute element={<Campaigns />} />} />
            <Route path="campaigns/:id" element={<LazyRoute element={<CampaignDetail />} />} />
            <Route path="smtp-accounts" element={<LazyRoute element={<SmtpAccounts />} />} />
            <Route path="workflows" element={<LazyRoute element={<Workflows />} />} />
            <Route path="workflows/new" element={<LazyRoute element={<WorkflowEditor />} />} />
            <Route path="workflows/:id" element={<LazyRoute element={<Workflows />} />} />
            <Route path="workflows/:id/edit" element={<LazyRoute element={<WorkflowEditor />} />} />
            <Route path="api-docs" element={<LazyRoute element={<ApiDocumentation />} />} />
            <Route path="mobile-app" element={<LazyRoute element={<MobileApp />} />} />
            <Route path="telemetry" element={<LazyRoute element={<Telemetry />} />} />
            <Route path="site-analytics" element={<LazyRoute element={<SiteAnalytics />} />} />
            <Route path="pricing" element={<LazyRoute element={<PricingPage />} />} />
            <Route path="blogs" element={<LazyRoute element={<BlogsList />} />} />
            <Route path="blogs/new" element={<LazyRoute element={<BlogEditor />} />} />
            <Route path="blogs/:id/edit" element={<LazyRoute element={<BlogEditor />} />} />
            <Route path="tools" element={<LazyRoute element={<ToolRegistry />} />} />
            <Route path="expenses" element={<LazyRoute element={<Expenses />} />} />
            <Route path="email-marketing" element={<LazyRoute element={<EmailMarketingDashboard />} />} />
            <Route path="email-marketing/contacts" element={<LazyRoute element={<EmailContacts />} />} />
            <Route path="email-marketing/contacts/:id" element={<LazyRoute element={<EmailContactDetail />} />} />
            <Route path="email-marketing/templates" element={<LazyRoute element={<EmailTemplates />} />} />
            <Route path="email-marketing/templates/new" element={<LazyRoute element={<TemplateEditor />} />} />
            <Route path="email-marketing/templates/:id/edit" element={<LazyRoute element={<TemplateEditor />} />} />
            <Route path="email-marketing/campaigns" element={<LazyRoute element={<EmailCampaigns />} />} />
            <Route path="email-marketing/campaigns/new" element={<LazyRoute element={<CampaignWizard />} />} />
            <Route path="email-marketing/campaigns/:id" element={<LazyRoute element={<EmailCampaignDetail />} />} />
            <Route path="email-marketing/automations" element={<LazyRoute element={<EmailAutomations />} />} />
            <Route path="email-marketing/automations/new" element={<LazyRoute element={<AutomationEditor />} />} />
            <Route path="email-marketing/automations/:id/edit" element={<LazyRoute element={<AutomationEditor />} />} />
            <Route path="email-marketing/smtp" element={<LazyRoute element={<EmailSmtp />} />} />
            <Route path="email-marketing/domains" element={<LazyRoute element={<EmailDomains />} />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
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
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
