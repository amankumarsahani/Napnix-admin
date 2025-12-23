import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

// Inline SVG Icons (Heroicons style - matching existing project components)
const Icons = {
    shield: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    ),
    users: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    shopping: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
    ),
    home: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    ),
    heart: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    ),
    building: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
    ),
    book: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
    ),
    lightning: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    ),
    scale: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
    ),
    cog: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    truck: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
    ),
    cake: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
        </svg>
    ),
    scissors: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
        </svg>
    ),
    calendar: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    globe: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
    ),
    key: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
    ),
    code: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
    ),
    search: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
    rocket: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    ),
    chevronDown: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    ),
    lock: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    ),
    copy: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    ),
    check: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ),
};

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
            icon: 'shield',
            description: 'Authentication, configuration, and dashboard',
            endpoints: [
                { method: 'POST', path: '/lookup', desc: 'Lookup tenant by email', server: 'registry.nexspiresolutions.co.in', body: { email: 'user@company.com' }, response: { found: true, tenant: { slug: 'acme', api_url: '...' } } },
                { method: 'POST', path: '/api/auth/login', desc: 'User login', body: { email: '...', password: '...' }, response: { success: true, token: 'eyJhbGci...' } },
                { method: 'GET', path: '/api/auth/me', desc: 'Get current user', auth: true, response: { id: 1, email: '...', role: 'admin' } },
                { method: 'GET', path: '/api/config', desc: 'Get tenant configuration', response: { industry: 'ecommerce', plan: 'growth' } },
                { method: 'GET', path: '/api/dashboard/stats', desc: 'Dashboard statistics', auth: true },
            ]
        },
        {
            name: 'Leads & Clients',
            icon: 'users',
            description: 'Lead and client management',
            endpoints: [
                { method: 'GET', path: '/api/leads', desc: 'List leads', auth: true, params: ['page', 'limit', 'status', 'search'] },
                { method: 'POST', path: '/api/leads', desc: 'Create lead', auth: true, body: { name: '...', email: '...', phone: '...' } },
                { method: 'GET', path: '/api/leads/:id', desc: 'Get lead by ID', auth: true },
                { method: 'PUT', path: '/api/leads/:id', desc: 'Update lead', auth: true },
                { method: 'DELETE', path: '/api/leads/:id', desc: 'Delete lead', auth: true },
                { method: 'GET', path: '/api/clients', desc: 'List clients', auth: true },
                { method: 'POST', path: '/api/clients', desc: 'Create client', auth: true },
            ]
        },
        {
            name: 'E-Commerce',
            icon: 'shopping',
            industry: 'ecommerce',
            description: 'Product catalog and orders',
            endpoints: [
                { method: 'GET', path: '/api/products', desc: 'List products', auth: true, params: ['category', 'status'] },
                { method: 'POST', path: '/api/products', desc: 'Create product', auth: true, body: { name: '...', sku: '...', price: 999 } },
                { method: 'GET', path: '/api/products/stats', desc: 'Product stats', auth: true },
                { method: 'GET', path: '/api/orders', desc: 'List orders', auth: true },
                { method: 'POST', path: '/api/orders', desc: 'Create order', auth: true },
                { method: 'PATCH', path: '/api/orders/:id/status', desc: 'Update order status', auth: true, body: { status: 'shipped' } },
            ]
        },
        {
            name: 'Real Estate',
            icon: 'home',
            industry: 'realestate',
            description: 'Property listings and viewings',
            endpoints: [
                { method: 'GET', path: '/api/properties', desc: 'List properties', auth: true },
                { method: 'POST', path: '/api/properties', desc: 'Create property', auth: true },
                { method: 'GET', path: '/api/viewings', desc: 'List viewings', auth: true },
                { method: 'POST', path: '/api/viewings', desc: 'Schedule viewing', auth: true },
            ]
        },
        {
            name: 'Healthcare',
            icon: 'heart',
            industry: 'healthcare',
            description: 'Patient records and prescriptions',
            endpoints: [
                { method: 'GET', path: '/api/patients', desc: 'List patients', auth: true },
                { method: 'POST', path: '/api/patients', desc: 'Register patient', auth: true },
                { method: 'GET', path: '/api/prescriptions', desc: 'List prescriptions', auth: true },
                { method: 'POST', path: '/api/prescriptions', desc: 'Create prescription', auth: true },
            ]
        },
        {
            name: 'Hospitality',
            icon: 'building',
            industry: 'hospitality',
            description: 'Room inventory and reservations',
            endpoints: [
                { method: 'GET', path: '/api/rooms', desc: 'List rooms', auth: true },
                { method: 'POST', path: '/api/rooms', desc: 'Add room', auth: true },
                { method: 'PATCH', path: '/api/rooms/:id/status', desc: 'Update room status', auth: true },
                { method: 'GET', path: '/api/reservations', desc: 'List reservations', auth: true },
                { method: 'POST', path: '/api/reservations', desc: 'Create reservation', auth: true },
            ]
        },
        {
            name: 'Education',
            icon: 'book',
            industry: 'education',
            description: 'Course catalog and enrollment',
            endpoints: [
                { method: 'GET', path: '/api/courses', desc: 'List courses', auth: true },
                { method: 'POST', path: '/api/courses', desc: 'Create course', auth: true },
                { method: 'GET', path: '/api/students', desc: 'List students', auth: true },
                { method: 'POST', path: '/api/students', desc: 'Enroll student', auth: true },
            ]
        },
        {
            name: 'Fitness/Gym',
            icon: 'lightning',
            industry: 'fitness',
            description: 'Member management and classes',
            endpoints: [
                { method: 'GET', path: '/api/members', desc: 'List members', auth: true },
                { method: 'POST', path: '/api/members', desc: 'Register member', auth: true },
                { method: 'GET', path: '/api/classes', desc: 'List classes', auth: true },
                { method: 'POST', path: '/api/classes/:id/book', desc: 'Book class', auth: true },
            ]
        },
        {
            name: 'Legal',
            icon: 'scale',
            industry: 'legal',
            description: 'Case management and hearings',
            endpoints: [
                { method: 'GET', path: '/api/cases', desc: 'List cases', auth: true },
                { method: 'POST', path: '/api/cases', desc: 'Create case', auth: true },
                { method: 'GET', path: '/api/cases/:id/hearings', desc: 'Get hearings', auth: true },
                { method: 'POST', path: '/api/cases/:id/hearings', desc: 'Add hearing', auth: true },
            ]
        },
        {
            name: 'Manufacturing',
            icon: 'cog',
            industry: 'manufacturing',
            description: 'Production orders and inventory',
            endpoints: [
                { method: 'GET', path: '/api/production', desc: 'List production orders', auth: true },
                { method: 'POST', path: '/api/production', desc: 'Create order', auth: true },
                { method: 'PATCH', path: '/api/production/:id/status', desc: 'Update status', auth: true },
                { method: 'GET', path: '/api/production/materials', desc: 'List materials', auth: true },
            ]
        },
        {
            name: 'Logistics',
            icon: 'truck',
            industry: 'logistics',
            description: 'Shipment tracking and fleet',
            endpoints: [
                { method: 'GET', path: '/api/shipments', desc: 'List shipments', auth: true },
                { method: 'POST', path: '/api/shipments', desc: 'Create shipment', auth: true },
                { method: 'POST', path: '/api/shipments/:id/track', desc: 'Add tracking', auth: true },
                { method: 'GET', path: '/api/shipments/:id/tracking', desc: 'Get tracking', auth: true },
            ]
        },
        {
            name: 'Restaurant',
            icon: 'cake',
            industry: 'restaurant',
            description: 'Menu and table management',
            endpoints: [
                { method: 'GET', path: '/api/menu', desc: 'List menu items', auth: true },
                { method: 'POST', path: '/api/menu', desc: 'Add menu item', auth: true },
                { method: 'GET', path: '/api/tables', desc: 'List tables', auth: true },
                { method: 'POST', path: '/api/tables/orders', desc: 'Create order', auth: true },
            ]
        },
        {
            name: 'Salon/Spa',
            icon: 'scissors',
            industry: 'salon',
            description: 'Appointment booking',
            endpoints: [
                { method: 'GET', path: '/api/bookings', desc: 'List appointments', auth: true },
                { method: 'POST', path: '/api/bookings', desc: 'Create booking', auth: true },
                { method: 'GET', path: '/api/bookings/slots', desc: 'Get available slots', auth: true },
                { method: 'GET', path: '/api/bookings/services', desc: 'List services', auth: true },
            ]
        },
        {
            name: 'Services',
            icon: 'calendar',
            industry: 'services',
            description: 'Appointment scheduling',
            endpoints: [
                { method: 'GET', path: '/api/appointments', desc: 'List appointments', auth: true },
                { method: 'POST', path: '/api/appointments', desc: 'Create appointment', auth: true },
                { method: 'GET', path: '/api/services', desc: 'List services', auth: true },
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

    const CodeBlock = ({ title, code }) => (
        <div className={`${isDark ? 'bg-slate-900' : 'bg-gray-900'} rounded-lg overflow-hidden`}>
            <div className="flex items-center justify-between px-3 py-2 bg-black/20">
                <span className="text-xs text-gray-400">{title}</span>
                <button onClick={() => copyToClipboard(JSON.stringify(code, null, 2), title)} className="text-gray-400 hover:text-white">
                    {copiedPath === title ? <span className="text-green-400">{Icons.check}</span> : Icons.copy}
                </button>
            </div>
            <pre className="p-3 text-xs text-gray-300 overflow-x-auto font-mono">{JSON.stringify(code, null, 2)}</pre>
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
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-brand-500/20' : 'bg-brand-50'} flex items-center justify-center text-brand-500`}>
                            {Icons.code}
                        </div>
                        <div>
                            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>API Documentation</h1>
                            <p className={`${isDark ? 'text-slate-400' : 'text-gray-500'} text-sm`}>NexCRM v1.0 • 13 Industries • REST API</p>
                        </div>
                    </div>
                    <div className="relative">
                        <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>{Icons.search}</span>
                        <input
                            type="text"
                            placeholder="Search endpoints..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-400'} border pl-10 pr-4 py-2 rounded-lg w-64 focus:ring-2 focus:ring-brand-500 text-sm`}
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {/* Quick Start */}
                <div className="bg-gradient-to-br from-brand-600 via-purple-600 to-brand-700 rounded-2xl p-6 mb-6 text-white shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                        <span>{Icons.rocket}</span>
                        <h2 className="text-lg font-bold">Quick Start</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold mb-2">1</div>
                            <h4 className="font-semibold">Lookup Tenant</h4>
                            <code className="text-xs bg-black/20 px-2 py-1 rounded block mt-1 font-mono">POST /lookup</code>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold mb-2">2</div>
                            <h4 className="font-semibold">Authenticate</h4>
                            <code className="text-xs bg-black/20 px-2 py-1 rounded block mt-1 font-mono">POST /api/auth/login</code>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold mb-2">3</div>
                            <h4 className="font-semibold">Make Requests</h4>
                            <code className="text-xs bg-black/20 px-2 py-1 rounded block mt-1 font-mono">Bearer {'{token}'}</code>
                        </div>
                    </div>
                </div>

                {/* Connection Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border rounded-xl p-4 flex items-center gap-4`}>
                        <div className={`w-12 h-12 rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-500'} flex items-center justify-center`}>
                            {Icons.globe}
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>BASE URL</span>
                            <code className={`block font-mono text-sm truncate ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                https://{'{tenant}'}-crm-api.nexspiresolutions.co.in
                            </code>
                        </div>
                        <button onClick={() => copyToClipboard('https://{tenant}-crm-api.nexspiresolutions.co.in', 'baseurl')} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-400'}`}>
                            {copiedPath === 'baseurl' ? <span className="text-green-400">{Icons.check}</span> : Icons.copy}
                        </button>
                    </div>
                    <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border rounded-xl p-4 flex items-center gap-4`}>
                        <div className={`w-12 h-12 rounded-lg ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-500'} flex items-center justify-center`}>
                            {Icons.key}
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>AUTHORIZATION</span>
                            <code className={`block font-mono text-sm truncate ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Bearer {'{jwt_token}'}</code>
                        </div>
                        <button onClick={() => copyToClipboard('Authorization: Bearer {token}', 'auth')} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-400'}`}>
                            {copiedPath === 'auth' ? <span className="text-green-400">{Icons.check}</span> : Icons.copy}
                        </button>
                    </div>
                </div>

                {/* Categories */}
                <div className="space-y-4">
                    {filteredCategories.map((category) => (
                        <div key={category.name} className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border rounded-xl overflow-hidden shadow-sm`}>
                            <button onClick={() => toggleCategory(category.name)} className={`w-full px-5 py-4 flex items-center justify-between ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'} transition-colors`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-brand-500/20 text-brand-400' : 'bg-brand-50 text-brand-500'} flex items-center justify-center`}>
                                        {Icons[category.icon]}
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{category.name}</span>
                                            {category.industry && <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-brand-500/20 text-brand-400' : 'bg-brand-50 text-brand-600'}`}>{category.industry}</span>}
                                        </div>
                                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{category.description} • {category.endpoints.length} endpoints</p>
                                    </div>
                                </div>
                                <span className={`transition-transform ${expandedCategories.includes(category.name) ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>{Icons.chevronDown}</span>
                            </button>

                            {expandedCategories.includes(category.name) && (
                                <div className={`border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
                                    {category.endpoints.map((ep, idx) => {
                                        const key = `${category.name}-${idx}`;
                                        const isExpanded = expandedEndpoints[key];
                                        return (
                                            <div key={idx} className={`border-b last:border-b-0 ${isDark ? 'border-slate-700/50' : 'border-gray-50'}`}>
                                                <button onClick={() => toggleEndpoint(key)} className={`w-full px-5 py-3 flex items-center gap-4 ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'} transition-colors`}>
                                                    <MethodBadge method={ep.method} />
                                                    <code className={`font-mono text-sm flex-1 text-left ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{ep.path}</code>
                                                    <span className={`text-sm hidden md:block ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{ep.desc}</span>
                                                    {ep.auth && <span className={isDark ? 'text-amber-400' : 'text-amber-500'}>{Icons.lock}</span>}
                                                    <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''} ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{Icons.chevronDown}</span>
                                                </button>
                                                {isExpanded && (
                                                    <div className={`px-5 py-4 ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} space-y-4`}>
                                                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{ep.desc}</p>
                                                        {ep.server && <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}><span className="font-medium">Server:</span> {ep.server}</div>}
                                                        {ep.params && (
                                                            <div>
                                                                <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Query Parameters:</span>
                                                                <div className="flex flex-wrap gap-2 mt-1">
                                                                    {ep.params.map(p => <span key={p} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-200 text-gray-600'}`}>{p}</span>)}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {ep.body && <CodeBlock title="Request Body" code={ep.body} />}
                                                            {ep.response && <CodeBlock title="Response" code={ep.response} />}
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
                <div className={`mt-8 p-6 text-center text-sm rounded-xl ${isDark ? 'bg-slate-800/50 text-slate-500 border-slate-700' : 'bg-white text-gray-400 border-gray-200'} border`}>
                    <p>Need help? Contact <a href="mailto:support@nexspiresolutions.co.in" className="text-brand-400 hover:underline">support@nexspiresolutions.co.in</a></p>
                    <p className="mt-1 text-xs">© 2024 NexSpire Solutions</p>
                </div>
            </div>
        </div>
    );
};

export default ApiDocumentation;
