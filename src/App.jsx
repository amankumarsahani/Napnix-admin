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
import { isFullEdition, FEATURE_NAPMAIL, FEATURE_WHATSAPP } from './config/edition';

// Each excluded page is guarded by a plain ternary rather than a helper call.
// That matters: the condition folds to a literal at build time, so Rollup can
// prove the import() unreachable and drop the chunk. Routed through a helper the
// loader closure stays reachable and the agency screens ship in the partner
// bundle anyway - which defeats the point.

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ClientsList = isFullEdition ? React.lazy(() => import('./pages/clients/ClientsList')) : null;
const ClientDetail = isFullEdition ? React.lazy(() => import('./pages/clients/ClientDetail')) : null;
const ProjectsList = isFullEdition ? React.lazy(() => import('./pages/projects/ProjectsList')) : null;
const LeadsList = isFullEdition ? React.lazy(() => import('./pages/leads/LeadsList')) : null;
const LeadDetail = isFullEdition ? React.lazy(() => import('./pages/leads/LeadDetail')) : null;
const Inquiries = isFullEdition ? React.lazy(() => import('./pages/Inquiries')) : null;
const InquiryDetail = isFullEdition ? React.lazy(() => import('./pages/inquiries/InquiryDetail')) : null;
const Team = React.lazy(() => import('./pages/admin/Team'));
const Settings = React.lazy(() => import('./pages/admin/Settings'));
const Transactions = isFullEdition ? React.lazy(() => import('./pages/admin/Transactions')) : null;
const Templates = isFullEdition ? React.lazy(() => import('./pages/admin/Templates')) : null;
const Documents = isFullEdition ? React.lazy(() => import('./pages/admin/Documents')) : null;
const DocumentEdit = isFullEdition ? React.lazy(() => import('./pages/admin/DocumentEdit')) : null;
const Tenants = React.lazy(() => import('./pages/tenants/Tenants'));
const TenantDetail = React.lazy(() => import('./pages/tenants/TenantDetail'));
const Servers = React.lazy(() => import('./pages/servers/Servers'));
const BackupAccounts = isFullEdition ? React.lazy(() => import('./pages/backups/BackupAccounts')) : null;
const ApiDocumentation = React.lazy(() => import('./pages/admin/ApiDocumentation'));
const MobileApp = React.lazy(() => import('./pages/admin/MobileApp'));
const Telemetry = isFullEdition ? React.lazy(() => import('./pages/system/Telemetry')) : null;
const SiteAnalytics = isFullEdition ? React.lazy(() => import('./pages/system/SiteAnalytics')) : null;
const Campaigns = isFullEdition ? React.lazy(() => import('./pages/marketing/Campaigns')) : null;
const CampaignDetail = isFullEdition ? React.lazy(() => import('./pages/marketing/CampaignDetail')) : null;
const SmtpAccounts = isFullEdition ? React.lazy(() => import('./pages/marketing/SmtpAccounts')) : null;
const Workflows = isFullEdition ? React.lazy(() => import('./pages/marketing/Workflows')) : null;
const WorkflowEditor = isFullEdition ? React.lazy(() => import('./pages/marketing/WorkflowEditor')) : null;
const PricingPage = isFullEdition ? React.lazy(() => import('./pages/marketing/PricingPage')) : null;
const BlogsList = isFullEdition ? React.lazy(() => import('./pages/blogs/BlogsList')) : null;
const BlogEditor = isFullEdition ? React.lazy(() => import('./pages/blogs/BlogEditor')) : null;
const PortfolioList = isFullEdition ? React.lazy(() => import('./pages/portfolio/PortfolioList')) : null;
const PortfolioEditor = isFullEdition ? React.lazy(() => import('./pages/portfolio/PortfolioEditor')) : null;
const CaseStudiesList = isFullEdition ? React.lazy(() => import('./pages/caseStudies/CaseStudiesList')) : null;
const CaseStudyEditor = isFullEdition ? React.lazy(() => import('./pages/caseStudies/CaseStudyEditor')) : null;

const EmailMarketingDashboard = FEATURE_NAPMAIL ? React.lazy(() => import('./pages/email-marketing/Dashboard')) : null;
const EmailContacts = FEATURE_NAPMAIL ? React.lazy(() => import('./pages/email-marketing/Contacts')) : null;
const EmailContactDetail = FEATURE_NAPMAIL ? React.lazy(() => import('./pages/email-marketing/ContactDetail')) : null;
const EmailTemplates = FEATURE_NAPMAIL ? React.lazy(() => import('./pages/email-marketing/Templates')) : null;
const TemplateEditor = FEATURE_NAPMAIL ? React.lazy(() => import('./pages/email-marketing/TemplateEditor')) : null;
const EmailCampaigns = FEATURE_NAPMAIL ? React.lazy(() => import('./pages/email-marketing/Campaigns')) : null;
const CampaignWizard = FEATURE_NAPMAIL ? React.lazy(() => import('./pages/email-marketing/CampaignWizard')) : null;
const EmailCampaignDetail = FEATURE_NAPMAIL ? React.lazy(() => import('./pages/email-marketing/CampaignDetail')) : null;
const EmailAutomations = FEATURE_NAPMAIL ? React.lazy(() => import('./pages/email-marketing/Automations')) : null;
const AutomationEditor = FEATURE_NAPMAIL ? React.lazy(() => import('./pages/email-marketing/AutomationEditor')) : null;
const EmailSmtp = FEATURE_NAPMAIL ? React.lazy(() => import('./pages/email-marketing/SmtpAccounts')) : null;
const EmailDomains = FEATURE_NAPMAIL ? React.lazy(() => import('./pages/email-marketing/Domains')) : null;
const ToolRegistry = isFullEdition ? React.lazy(() => import('./pages/tools/ToolRegistry')) : null;
const Expenses = isFullEdition ? React.lazy(() => import('./pages/expenses/Expenses')) : null;
const SupportInbox = React.lazy(() => import('./pages/support/SupportInbox'));
const WhatsAppSettings = FEATURE_WHATSAPP ? React.lazy(() => import('./pages/whatsapp/WhatsAppSettings')) : null;
const WhatsAppDetail = FEATURE_WHATSAPP ? React.lazy(() => import('./pages/whatsapp/WhatsAppDetail')) : null;

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

          {/* Our own agency CRM. Absent from a partner build. */}
          {isFullEdition && (
            <>
              <Route path="clients" element={<LazyRoute element={<ClientsList />} />} />
              <Route path="clients/:id" element={<LazyRoute element={<ClientDetail />} />} />
              <Route path="projects" element={<LazyRoute element={<ProjectsList />} />} />
              <Route path="leads" element={<LazyRoute element={<LeadsList />} />} />
              <Route path="leads/:id" element={<LazyRoute element={<LeadDetail />} />} />
              <Route path="inquiries" element={<LazyRoute element={<Inquiries />} />} />
              <Route path="inquiries/:id" element={<LazyRoute element={<InquiryDetail />} />} />
              <Route path="documents" element={<LazyRoute element={<Documents />} />} />
              <Route path="documents/:id/edit" element={<LazyRoute element={<DocumentEdit />} />} />
            </>
          )}

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            {/* Control plane - both editions */}
            <Route path="team" element={<LazyRoute element={<Team />} />} />
            <Route path="settings" element={<LazyRoute element={<Settings />} />} />
            <Route path="tenants" element={<LazyRoute element={<Tenants />} />} />
            <Route path="tenants/:id" element={<LazyRoute element={<TenantDetail />} />} />
            <Route path="api-docs" element={<LazyRoute element={<ApiDocumentation />} />} />
            <Route path="mobile-app" element={<LazyRoute element={<MobileApp />} />} />
            <Route path="support" element={<LazyRoute element={<SupportInbox />} />} />

            {/* A partner operates their own instance, so they see its servers.
                What they do not get is the per-tenant infrastructure detail
                (process name, port, DB name, raw PM2 logs) - decision D3. Those
                three panels are not wired into TenantDetail yet; when they are,
                gate them on showInfraDetail from config/edition. */}
            <Route path="infrastructure/servers" element={<LazyRoute element={<Servers />} />} />

            {/* Agency operations: our documents, our money, our marketing site,
                our website telemetry, our internal tooling. */}
            {isFullEdition && (
              <>
                <Route path="templates" element={<LazyRoute element={<Templates />} />} />
                <Route path="transactions" element={<LazyRoute element={<Transactions />} />} />
                <Route path="infrastructure/backups" element={<LazyRoute element={<BackupAccounts />} />} />
                <Route path="campaigns" element={<LazyRoute element={<Campaigns />} />} />
                <Route path="campaigns/:id" element={<LazyRoute element={<CampaignDetail />} />} />
                <Route path="smtp-accounts" element={<LazyRoute element={<SmtpAccounts />} />} />
                <Route path="workflows" element={<LazyRoute element={<Workflows />} />} />
                <Route path="workflows/new" element={<LazyRoute element={<WorkflowEditor />} />} />
                <Route path="workflows/:id" element={<LazyRoute element={<Workflows />} />} />
                <Route path="workflows/:id/edit" element={<LazyRoute element={<WorkflowEditor />} />} />
                <Route path="telemetry" element={<LazyRoute element={<Telemetry />} />} />
                <Route path="site-analytics" element={<LazyRoute element={<SiteAnalytics />} />} />
                <Route path="pricing" element={<LazyRoute element={<PricingPage />} />} />
                <Route path="blogs" element={<LazyRoute element={<BlogsList />} />} />
                <Route path="blogs/new" element={<LazyRoute element={<BlogEditor />} />} />
                <Route path="blogs/:id/edit" element={<LazyRoute element={<BlogEditor />} />} />
                <Route path="portfolio" element={<LazyRoute element={<PortfolioList />} />} />
                <Route path="portfolio/new" element={<LazyRoute element={<PortfolioEditor />} />} />
                <Route path="portfolio/:id/edit" element={<LazyRoute element={<PortfolioEditor />} />} />
                <Route path="case-studies" element={<LazyRoute element={<CaseStudiesList />} />} />
                <Route path="case-studies/new" element={<LazyRoute element={<CaseStudyEditor />} />} />
                <Route path="case-studies/:id/edit" element={<LazyRoute element={<CaseStudyEditor />} />} />
                <Route path="tools" element={<LazyRoute element={<ToolRegistry />} />} />
                <Route path="expenses" element={<LazyRoute element={<Expenses />} />} />
              </>
            )}

            {/* WhatsApp Business - add-on (decision D4) */}
            {FEATURE_WHATSAPP && (
              <>
                <Route path="whatsapp" element={<LazyRoute element={<WhatsAppSettings />} />} />
                <Route path="whatsapp/:id" element={<LazyRoute element={<WhatsAppDetail />} />} />
              </>
            )}

            {/* NapMail - add-on (decision D4) */}
            {FEATURE_NAPMAIL && (
              <>
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
              </>
            )}
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
