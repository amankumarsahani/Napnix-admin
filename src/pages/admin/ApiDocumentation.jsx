import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * API Documentation Page - Professional Developer Reference
 * Features: Dark mode, expandable endpoints, request/response examples, copy functionality
 */
const ApiDocumentation = () => {
    const { isDark } = useTheme();
    const [expandedCategories, setExpandedCategories] = useState(['Core']);
    const [expandedEndpoints, setExpandedEndpoints] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedPath, setCopiedPath] = useState(null);

    const toggleCategory = (name) => {
        setExpandedCategories(prev =>
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        );
    };

    const toggleEndpoint = (key) => {
        setExpandedEndpoints(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const copyToClipboard = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopiedPath(key);
        setTimeout(() => setCopiedPath(null), 2000);
    };

    const API_CATEGORIES = [
        {
            name: 'Core',
            icon: 'ri-shield-keyhole-line',
            description: 'Authentication, configuration, and dashboard',
            endpoints: [
                {
                    method: 'POST',
                    path: '/lookup',
                    desc: 'Lookup tenant by email',
                    server: 'registry.nexspiresolutions.co.in',
                    body: { email: 'user@company.com' },
                    response: { found: true, tenant: { slug: 'acme', api_url: 'https://acme-crm-api.nexspiresolutions.co.in' } }
                },
                {
                    method: 'POST',
                    path: '/api/auth/login',
                    desc: 'User login',
                    body: { email: 'admin@company.com', password: '********' },
                    response: { success: true, token: 'eyJhbGci...', user: { id: 1, role: 'admin' } }
                },
                { method: 'GET', path: '/api/auth/me', desc: 'Get current user', auth: true, response: { success: true, user: { id: 1, email: '...', role: 'admin' } } },
                { method: 'GET', path: '/api/config', desc: 'Get tenant configuration', response: { industry: 'ecommerce', plan: 'growth', modules: ['leads', 'products'] } },
                { method: 'GET', path: '/api/dashboard/stats', desc: 'Dashboard statistics', auth: true, response: { totalLeads: 150, totalClients: 45, revenue: 125000 } },
            ]
        },
        {
            name: 'Leads & Clients',
            icon: 'ri-user-star-line',
            description: 'Lead and client management endpoints',
            endpoints: [
                { method: 'GET', path: '/api/leads', desc: 'List leads', auth: true, params: ['page', 'limit', 'status', 'search'], response: { data: [], pagination: { total: 100 } } },
                { method: 'POST', path: '/api/leads', desc: 'Create lead', auth: true, body: { name: 'John Doe', email: 'john@example.com', phone: '+91...', source: 'website' }, response: { success: true, id: 123 } },
                { method: 'GET', path: '/api/leads/:id', desc: 'Get lead by ID', auth: true, response: { id: 1, name: '...', status: 'qualified' } },
                { method: 'PUT', path: '/api/leads/:id', desc: 'Update lead', auth: true, body: { status: 'converted', notes: '...' } },
                { method: 'DELETE', path: '/api/leads/:id', desc: 'Delete lead', auth: true },
                { method: 'PATCH', path: '/api/leads/:id/assign', desc: 'Assign lead to user', auth: true, body: { userId: 5 } },
                { method: 'GET', path: '/api/clients', desc: 'List clients', auth: true, response: { data: [], pagination: {} } },
                { method: 'POST', path: '/api/clients', desc: 'Create client', auth: true, body: { name: '...', email: '...', companyName: '...' } },
                { method: 'GET', path: '/api/clients/stats', desc: 'Client statistics', auth: true },
            ]
        },
        {
            name: 'E-Commerce',
            icon: 'ri-shopping-bag-3-line',
            industry: 'ecommerce',
            description: 'Product catalog and order management',
            endpoints: [
                { method: 'GET', path: '/api/products', desc: 'List products', auth: true, params: ['category', 'status', 'search'], response: { data: [], total: 50 } },
                { method: 'POST', path: '/api/products', desc: 'Create product', auth: true, body: { name: '...', sku: 'SKU-001', price: 999, stock: 100, category: '...' } },
                { method: 'GET', path: '/api/products/stats', desc: 'Product statistics', auth: true },
                { method: 'GET', path: '/api/products/categories', desc: 'List categories', auth: true },
                { method: 'GET', path: '/api/orders', desc: 'List orders', auth: true, params: ['status', 'dateFrom', 'dateTo'] },
                { method: 'POST', path: '/api/orders', desc: 'Create order', auth: true, body: { clientId: 1, items: [{ productId: 1, quantity: 2 }] } },
                { method: 'PATCH', path: '/api/orders/:id/status', desc: 'Update order status', auth: true, body: { status: 'shipped' } },
                { method: 'GET', path: '/api/orders/stats', desc: 'Order statistics', auth: true },
            ]
        },
        {
            name: 'Real Estate',
            icon: 'ri-home-4-line',
            industry: 'realestate',
            description: 'Property listings and viewing management',
            endpoints: [
                { method: 'GET', path: '/api/properties', desc: 'List properties', auth: true, params: ['type', 'city', 'minPrice', 'maxPrice'] },
                { method: 'POST', path: '/api/properties', desc: 'Create property', auth: true, body: { title: '...', type: 'apartment', price: 5000000, bedrooms: 2 } },
                { method: 'GET', path: '/api/properties/stats', desc: 'Property statistics', auth: true },
                { method: 'GET', path: '/api/viewings', desc: 'List scheduled viewings', auth: true },
                { method: 'POST', path: '/api/viewings', desc: 'Schedule property viewing', auth: true, body: { propertyId: 1, clientName: '...', date: '2024-01-20' } },
            ]
        },
        {
            name: 'Healthcare',
            icon: 'ri-heart-pulse-line',
            industry: 'healthcare',
            description: 'Patient records and prescriptions',
            endpoints: [
                { method: 'GET', path: '/api/patients', desc: 'List patients', auth: true },
                { method: 'POST', path: '/api/patients', desc: 'Register patient', auth: true, body: { firstName: '...', lastName: '...', dateOfBirth: '1990-01-01', bloodGroup: 'O+' } },
                { method: 'GET', path: '/api/patients/stats', desc: 'Patient statistics', auth: true },
                { method: 'GET', path: '/api/prescriptions', desc: 'List prescriptions', auth: true },
                { method: 'POST', path: '/api/prescriptions', desc: 'Create prescription', auth: true },
            ]
        },
        {
            name: 'Hospitality',
            icon: 'ri-hotel-line',
            industry: 'hospitality',
            description: 'Room inventory and reservations',
            endpoints: [
                { method: 'GET', path: '/api/rooms', desc: 'List rooms', auth: true, params: ['status', 'type'] },
                { method: 'POST', path: '/api/rooms', desc: 'Add room', auth: true },
                { method: 'PATCH', path: '/api/rooms/:id/status', desc: 'Update room status', auth: true, body: { status: 'occupied' } },
                { method: 'GET', path: '/api/reservations', desc: 'List reservations', auth: true },
                { method: 'POST', path: '/api/reservations', desc: 'Create reservation', auth: true },
                { method: 'GET', path: '/api/guests', desc: 'List guests', auth: true },
            ]
        },
        {
            name: 'Education',
            icon: 'ri-book-open-line',
            industry: 'education',
            description: 'Course catalog and student enrollment',
            endpoints: [
                { method: 'GET', path: '/api/courses', desc: 'List courses', auth: true },
                { method: 'POST', path: '/api/courses', desc: 'Create course', auth: true, body: { name: '...', code: 'CS101', fee: 25000, duration: '3 months' } },
                { method: 'GET', path: '/api/students', desc: 'List students', auth: true },
                { method: 'POST', path: '/api/students', desc: 'Enroll student', auth: true },
                { method: 'GET', path: '/api/students/stats', desc: 'Student statistics', auth: true },
            ]
        },
        {
            name: 'Fitness/Gym',
            icon: 'ri-run-line',
            industry: 'fitness',
            description: 'Member management and class scheduling',
            endpoints: [
                { method: 'GET', path: '/api/members', desc: 'List gym members', auth: true },
                { method: 'POST', path: '/api/members', desc: 'Register member', auth: true },
                { method: 'GET', path: '/api/members/memberships/all', desc: 'List membership plans', auth: true },
                { method: 'GET', path: '/api/classes', desc: 'List fitness classes', auth: true },
                { method: 'POST', path: '/api/classes/:id/book', desc: 'Book class slot', auth: true },
            ]
        },
        {
            name: 'Legal',
            icon: 'ri-scales-3-line',
            industry: 'legal',
            description: 'Case management and court hearings',
            endpoints: [
                { method: 'GET', path: '/api/cases', desc: 'List cases', auth: true, params: ['status', 'type'] },
                { method: 'POST', path: '/api/cases', desc: 'Create case', auth: true, body: { title: '...', caseNumber: 'CASE-001', type: 'civil', clientId: 1 } },
                { method: 'GET', path: '/api/cases/:id/hearings', desc: 'Get case hearings', auth: true },
                { method: 'POST', path: '/api/cases/:id/hearings', desc: 'Add court hearing', auth: true, body: { date: '2024-02-15', courtName: 'High Court' } },
            ]
        },
        {
            name: 'Manufacturing',
            icon: 'ri-tools-line',
            industry: 'manufacturing',
            description: 'Production orders and inventory',
            endpoints: [
                { method: 'GET', path: '/api/production', desc: 'List production orders', auth: true },
                { method: 'POST', path: '/api/production', desc: 'Create production order', auth: true },
                { method: 'PATCH', path: '/api/production/:id/status', desc: 'Update production status', auth: true },
                { method: 'GET', path: '/api/production/materials', desc: 'List raw materials', auth: true },
            ]
        },
        {
            name: 'Logistics',
            icon: 'ri-truck-line',
            industry: 'logistics',
            description: 'Shipment tracking and fleet management',
            endpoints: [
                { method: 'GET', path: '/api/shipments', desc: 'List shipments', auth: true },
                { method: 'POST', path: '/api/shipments', desc: 'Create shipment', auth: true },
                { method: 'POST', path: '/api/shipments/:id/track', desc: 'Add tracking update', auth: true },
                { method: 'GET', path: '/api/shipments/:id/tracking', desc: 'Get tracking history', auth: true },
                { method: 'GET', path: '/api/shipments/vehicles', desc: 'List vehicles', auth: true },
            ]
        },
        {
            name: 'Restaurant',
            icon: 'ri-restaurant-line',
            industry: 'restaurant',
            description: 'Menu management and table orders',
            endpoints: [
                { method: 'GET', path: '/api/menu', desc: 'List menu items', auth: true },
                { method: 'POST', path: '/api/menu', desc: 'Add menu item', auth: true, body: { name: '...', price: 350, category: 'main', isVeg: false } },
                { method: 'GET', path: '/api/tables', desc: 'List tables', auth: true },
                { method: 'PATCH', path: '/api/tables/:id/status', desc: 'Update table status', auth: true },
                { method: 'POST', path: '/api/tables/orders', desc: 'Create table order', auth: true },
            ]
        },
        {
            name: 'Salon/Spa',
            icon: 'ri-scissors-line',
            industry: 'salon',
            description: 'Appointment booking and services',
            endpoints: [
                { method: 'GET', path: '/api/bookings', desc: 'List appointments', auth: true, params: ['date', 'staffId'] },
                { method: 'POST', path: '/api/bookings', desc: 'Create booking', auth: true, body: { clientName: '...', staffId: 1, services: [1, 2], date: '2024-01-20', time: '10:00' } },
                { method: 'GET', path: '/api/bookings/slots', desc: 'Get available slots', auth: true },
                { method: 'GET', path: '/api/bookings/services', desc: 'List services', auth: true },
            ]
        },
        {
            name: 'Services',
            icon: 'ri-calendar-check-line',
            industry: 'services',
            description: 'Service appointments and scheduling',
            endpoints: [
                { method: 'GET', path: '/api/appointments', desc: 'List appointments', auth: true },
                { method: 'POST', path: '/api/appointments', desc: 'Create appointment', auth: true },
                { method: 'GET', path: '/api/appointments/stats', desc: 'Appointment statistics', auth: true },
                { method: 'GET', path: '/api/services', desc: 'List services offered', auth: true },
            ]
        },
    ];

    const MethodBadge = ({ method }) => {
        const styles = {
            GET: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
            POST: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
            PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
            PATCH: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
            DELETE: 'bg-red-500/20 text-red-400 border-red-500/40',
        };
        return (
            <span className={`inline-flex items-center justify-center w-16 px-2 py-1 rounded text-xs font-mono font-bold border ${styles[method]}`}>
                {method}
            </span>
        );
    };

    const CodeBlock = ({ title, code, isDark }) => (
        <div className={`${isDark ? 'bg-slate-900' : 'bg-gray-900'} rounded-lg overflow-hidden`}>
            <div className="flex items-center justify-between px-3 py-2 bg-black/20">
                <span className="text-xs text-gray-400">{title}</span>
                <button
                    onClick={() => copyToClipboard(JSON.stringify(code, null, 2), title)}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                    {copiedPath === title ? <i className="ri-check-line text-green-400"></i> : <i className="ri-file-copy-line"></i>}
                </button>
            </div>
            <pre className="p-3 text-xs text-gray-300 overflow-x-auto font-mono">
                {JSON.stringify(code, null, 2)}
            </pre>
        </div>
    );

    const filteredCategories = API_CATEGORIES.map(cat => ({
        ...cat,
        endpoints: cat.endpoints.filter(ep =>
            searchQuery === '' ||
            ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ep.desc.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat => cat.endpoints.length > 0);

    return (
        <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
            {/* Header */}
            <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'} border-b px-6 py-5 sticky top-0 z-10 backdrop-blur-sm`}>
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'} flex items-center justify-center`}>
                                <i className={`ri-code-s-slash-line text-xl ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}></i>
                            </div>
                            <div>
                                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    API Documentation
                                </h1>
                                <p className={`${isDark ? 'text-slate-400' : 'text-gray-500'} text-sm`}>
                                    NexCRM v1.0 • 13 Industries • REST API
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <i className={`ri-search-line absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-gray-400'}`}></i>
                            <input
                                type="text"
                                placeholder="Search endpoints..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-400'} border pl-10 pr-4 py-2 rounded-lg w-64 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm`}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {/* Quick Start */}
                <div className={`bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 mb-6 text-white shadow-xl shadow-indigo-500/20`}>
                    <div className="flex items-center gap-2 mb-4">
                        <i className="ri-rocket-line text-xl"></i>
                        <h2 className="text-lg font-bold">Quick Start</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                                <h4 className="font-semibold">Lookup Tenant</h4>
                            </div>
                            <code className="text-xs bg-black/20 px-3 py-2 rounded-lg block font-mono">POST /lookup</code>
                            <p className="text-xs text-white/70 mt-2">Get tenant API URL by user email</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                                <h4 className="font-semibold">Authenticate</h4>
                            </div>
                            <code className="text-xs bg-black/20 px-3 py-2 rounded-lg block font-mono">POST /api/auth/login</code>
                            <p className="text-xs text-white/70 mt-2">Login and get JWT token</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                                <h4 className="font-semibold">Make Requests</h4>
                            </div>
                            <code className="text-xs bg-black/20 px-3 py-2 rounded-lg block font-mono">Bearer {'{token}'}</code>
                            <p className="text-xs text-white/70 mt-2">Include token in Authorization header</p>
                        </div>
                    </div>
                </div>

                {/* Connection Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border rounded-xl p-4 flex items-center gap-4`}>
                        <div className={`w-12 h-12 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'} flex items-center justify-center`}>
                            <i className={`ri-global-line text-2xl ${isDark ? 'text-blue-400' : 'text-blue-500'}`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>BASE URL</span>
                            <code className={`block font-mono text-sm truncate ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                https://{'{tenant}'}-crm-api.nexspiresolutions.co.in
                            </code>
                        </div>
                        <button onClick={() => copyToClipboard('https://{tenant}-crm-api.nexspiresolutions.co.in', 'baseurl')} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                            {copiedPath === 'baseurl' ? <i className="ri-check-line text-green-400"></i> : <i className={`ri-file-copy-line ${isDark ? 'text-slate-400' : 'text-gray-400'}`}></i>}
                        </button>
                    </div>
                    <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border rounded-xl p-4 flex items-center gap-4`}>
                        <div className={`w-12 h-12 rounded-lg ${isDark ? 'bg-amber-500/20' : 'bg-amber-50'} flex items-center justify-center`}>
                            <i className={`ri-key-2-line text-2xl ${isDark ? 'text-amber-400' : 'text-amber-500'}`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>AUTHORIZATION</span>
                            <code className={`block font-mono text-sm truncate ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                Bearer {'{jwt_token}'}
                            </code>
                        </div>
                        <button onClick={() => copyToClipboard('Authorization: Bearer {token}', 'auth')} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                            {copiedPath === 'auth' ? <i className="ri-check-line text-green-400"></i> : <i className={`ri-file-copy-line ${isDark ? 'text-slate-400' : 'text-gray-400'}`}></i>}
                        </button>
                    </div>
                </div>

                {/* Categories */}
                <div className="space-y-4">
                    {filteredCategories.map((category) => (
                        <div key={category.name} className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border rounded-xl overflow-hidden shadow-sm`}>
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(category.name)}
                                className={`w-full px-5 py-4 flex items-center justify-between ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'} transition-colors`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-50'} flex items-center justify-center`}>
                                        <i className={`${category.icon} text-xl ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`}></i>
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{category.name}</span>
                                            {category.industry && (
                                                <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                                    {category.industry}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{category.description} • {category.endpoints.length} endpoints</p>
                                    </div>
                                </div>
                                <i className={`ri-arrow-down-s-line text-xl ${isDark ? 'text-slate-400' : 'text-gray-400'} transition-transform ${expandedCategories.includes(category.name) ? 'rotate-180' : ''}`}></i>
                            </button>

                            {/* Endpoints */}
                            {expandedCategories.includes(category.name) && (
                                <div className={`border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
                                    {category.endpoints.map((ep, idx) => {
                                        const endpointKey = `${category.name}-${idx}`;
                                        const isExpanded = expandedEndpoints[endpointKey];

                                        return (
                                            <div key={idx} className={`${isDark ? 'border-slate-700/50' : 'border-gray-50'} border-b last:border-b-0`}>
                                                {/* Endpoint Row */}
                                                <button
                                                    onClick={() => toggleEndpoint(endpointKey)}
                                                    className={`w-full px-5 py-3 flex items-center gap-4 ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'} transition-colors`}
                                                >
                                                    <MethodBadge method={ep.method} />
                                                    <code className={`font-mono text-sm flex-1 text-left ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{ep.path}</code>
                                                    <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'} hidden md:block`}>{ep.desc}</span>
                                                    {ep.auth && <i className={`ri-lock-line ${isDark ? 'text-amber-400' : 'text-amber-500'}`} title="Requires authentication"></i>}
                                                    <i className={`ri-arrow-down-s-line ${isDark ? 'text-slate-500' : 'text-gray-400'} transition-transform ${isExpanded ? 'rotate-180' : ''}`}></i>
                                                </button>

                                                {/* Expanded Details */}
                                                {isExpanded && (
                                                    <div className={`px-5 py-4 ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} space-y-4`}>
                                                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{ep.desc}</p>

                                                        {ep.server && (
                                                            <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                                                <span className="font-medium">Server:</span> {ep.server}
                                                            </div>
                                                        )}

                                                        {ep.params && (
                                                            <div>
                                                                <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Query Parameters:</span>
                                                                <div className="flex flex-wrap gap-2 mt-1">
                                                                    {ep.params.map(p => (
                                                                        <span key={p} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-200 text-gray-600'}`}>{p}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {ep.body && <CodeBlock title="Request Body" code={ep.body} isDark={isDark} />}
                                                            {ep.response && <CodeBlock title="Response" code={ep.response} isDark={isDark} />}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className={`mt-8 p-6 text-center ${isDark ? 'text-slate-500' : 'text-gray-400'} text-sm rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                    <p>Need help integrating? Contact <a href="mailto:support@nexspiresolutions.co.in" className="text-indigo-400 hover:underline">support@nexspiresolutions.co.in</a></p>
                    <p className="mt-1 text-xs">© 2024 NexSpire Solutions. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default ApiDocumentation;
