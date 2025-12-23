import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * API Documentation Page
 * 
 * Interactive OpenAPI documentation for NexCRM API.
 * Dark mode friendly with all 13 industry modules documented.
 */
const ApiDocumentation = () => {
    const { isDark } = useTheme();
    const [expandedCategories, setExpandedCategories] = useState(['Core', 'E-Commerce']);
    const [searchQuery, setSearchQuery] = useState('');

    const toggleCategory = (name) => {
        setExpandedCategories(prev =>
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        );
    };

    const API_CATEGORIES = [
        {
            name: 'Core',
            icon: 'ri-shield-keyhole-line',
            endpoints: [
                { method: 'POST', path: '/lookup', desc: 'Lookup tenant by email (Registry)' },
                { method: 'POST', path: '/api/auth/login', desc: 'User login' },
                { method: 'GET', path: '/api/auth/me', desc: 'Get current user' },
                { method: 'GET', path: '/api/config', desc: 'Get tenant configuration' },
                { method: 'GET', path: '/api/dashboard/stats', desc: 'Dashboard statistics' },
            ]
        },
        {
            name: 'Leads & Clients',
            icon: 'ri-user-star-line',
            endpoints: [
                { method: 'GET', path: '/api/leads', desc: 'List leads' },
                { method: 'POST', path: '/api/leads', desc: 'Create lead' },
                { method: 'GET', path: '/api/leads/:id', desc: 'Get lead by ID' },
                { method: 'PUT', path: '/api/leads/:id', desc: 'Update lead' },
                { method: 'DELETE', path: '/api/leads/:id', desc: 'Delete lead' },
                { method: 'PATCH', path: '/api/leads/:id/assign', desc: 'Assign lead' },
                { method: 'GET', path: '/api/clients', desc: 'List clients' },
                { method: 'POST', path: '/api/clients', desc: 'Create client' },
                { method: 'GET', path: '/api/clients/stats', desc: 'Client statistics' },
            ]
        },
        {
            name: 'E-Commerce',
            icon: 'ri-shopping-bag-3-line',
            industry: 'ecommerce',
            endpoints: [
                { method: 'GET', path: '/api/products', desc: 'List products' },
                { method: 'POST', path: '/api/products', desc: 'Create product' },
                { method: 'GET', path: '/api/products/stats', desc: 'Product stats' },
                { method: 'GET', path: '/api/products/categories', desc: 'List categories' },
                { method: 'GET', path: '/api/orders', desc: 'List orders' },
                { method: 'POST', path: '/api/orders', desc: 'Create order' },
                { method: 'PATCH', path: '/api/orders/:id/status', desc: 'Update order status' },
                { method: 'GET', path: '/api/orders/stats', desc: 'Order statistics' },
            ]
        },
        {
            name: 'Real Estate',
            icon: 'ri-home-4-line',
            industry: 'realestate',
            endpoints: [
                { method: 'GET', path: '/api/properties', desc: 'List properties' },
                { method: 'POST', path: '/api/properties', desc: 'Create property' },
                { method: 'GET', path: '/api/properties/stats', desc: 'Property stats' },
                { method: 'GET', path: '/api/viewings', desc: 'List viewings' },
                { method: 'POST', path: '/api/viewings', desc: 'Schedule viewing' },
            ]
        },
        {
            name: 'Healthcare',
            icon: 'ri-heart-pulse-line',
            industry: 'healthcare',
            endpoints: [
                { method: 'GET', path: '/api/patients', desc: 'List patients' },
                { method: 'POST', path: '/api/patients', desc: 'Register patient' },
                { method: 'GET', path: '/api/patients/stats', desc: 'Patient stats' },
                { method: 'GET', path: '/api/prescriptions', desc: 'List prescriptions' },
                { method: 'POST', path: '/api/prescriptions', desc: 'Create prescription' },
            ]
        },
        {
            name: 'Hospitality',
            icon: 'ri-hotel-line',
            industry: 'hospitality',
            endpoints: [
                { method: 'GET', path: '/api/rooms', desc: 'List rooms' },
                { method: 'POST', path: '/api/rooms', desc: 'Add room' },
                { method: 'GET', path: '/api/rooms/stats', desc: 'Room stats' },
                { method: 'PATCH', path: '/api/rooms/:id/status', desc: 'Update room status' },
                { method: 'GET', path: '/api/reservations', desc: 'List reservations' },
                { method: 'POST', path: '/api/reservations', desc: 'Create reservation' },
                { method: 'GET', path: '/api/guests', desc: 'List guests' },
            ]
        },
        {
            name: 'Education',
            icon: 'ri-book-open-line',
            industry: 'education',
            endpoints: [
                { method: 'GET', path: '/api/courses', desc: 'List courses' },
                { method: 'POST', path: '/api/courses', desc: 'Create course' },
                { method: 'GET', path: '/api/courses/stats', desc: 'Course stats' },
                { method: 'GET', path: '/api/students', desc: 'List students' },
                { method: 'POST', path: '/api/students', desc: 'Enroll student' },
                { method: 'GET', path: '/api/students/stats', desc: 'Student stats' },
            ]
        },
        {
            name: 'Fitness/Gym',
            icon: 'ri-run-line',
            industry: 'fitness',
            endpoints: [
                { method: 'GET', path: '/api/members', desc: 'List gym members' },
                { method: 'POST', path: '/api/members', desc: 'Register member' },
                { method: 'GET', path: '/api/members/stats', desc: 'Member stats' },
                { method: 'GET', path: '/api/members/memberships/all', desc: 'List memberships' },
                { method: 'GET', path: '/api/classes', desc: 'List classes' },
                { method: 'POST', path: '/api/classes/:id/book', desc: 'Book class' },
            ]
        },
        {
            name: 'Legal',
            icon: 'ri-scales-3-line',
            industry: 'legal',
            endpoints: [
                { method: 'GET', path: '/api/cases', desc: 'List cases' },
                { method: 'POST', path: '/api/cases', desc: 'Create case' },
                { method: 'GET', path: '/api/cases/stats', desc: 'Case stats' },
                { method: 'GET', path: '/api/cases/:id/hearings', desc: 'Get hearings' },
                { method: 'POST', path: '/api/cases/:id/hearings', desc: 'Add hearing' },
            ]
        },
        {
            name: 'Manufacturing',
            icon: 'ri-tools-line',
            industry: 'manufacturing',
            endpoints: [
                { method: 'GET', path: '/api/production', desc: 'List production orders' },
                { method: 'POST', path: '/api/production', desc: 'Create order' },
                { method: 'GET', path: '/api/production/stats', desc: 'Production stats' },
                { method: 'PATCH', path: '/api/production/:id/status', desc: 'Update status' },
                { method: 'GET', path: '/api/production/materials', desc: 'List materials' },
            ]
        },
        {
            name: 'Logistics',
            icon: 'ri-truck-line',
            industry: 'logistics',
            endpoints: [
                { method: 'GET', path: '/api/shipments', desc: 'List shipments' },
                { method: 'POST', path: '/api/shipments', desc: 'Create shipment' },
                { method: 'GET', path: '/api/shipments/stats', desc: 'Shipment stats' },
                { method: 'POST', path: '/api/shipments/:id/track', desc: 'Add tracking' },
                { method: 'GET', path: '/api/shipments/:id/tracking', desc: 'Get tracking' },
                { method: 'GET', path: '/api/shipments/vehicles', desc: 'List vehicles' },
            ]
        },
        {
            name: 'Restaurant',
            icon: 'ri-restaurant-line',
            industry: 'restaurant',
            endpoints: [
                { method: 'GET', path: '/api/menu', desc: 'List menu items' },
                { method: 'POST', path: '/api/menu', desc: 'Add menu item' },
                { method: 'GET', path: '/api/menu/categories', desc: 'List categories' },
                { method: 'GET', path: '/api/tables', desc: 'List tables' },
                { method: 'PATCH', path: '/api/tables/:id/status', desc: 'Update table status' },
                { method: 'POST', path: '/api/tables/orders', desc: 'Create order' },
            ]
        },
        {
            name: 'Salon/Spa',
            icon: 'ri-scissors-line',
            industry: 'salon',
            endpoints: [
                { method: 'GET', path: '/api/bookings', desc: 'List appointments' },
                { method: 'POST', path: '/api/bookings', desc: 'Create booking' },
                { method: 'GET', path: '/api/bookings/stats', desc: 'Booking stats' },
                { method: 'GET', path: '/api/bookings/slots', desc: 'Available slots' },
                { method: 'GET', path: '/api/bookings/services', desc: 'List services' },
            ]
        },
        {
            name: 'Services',
            icon: 'ri-calendar-check-line',
            industry: 'services',
            endpoints: [
                { method: 'GET', path: '/api/appointments', desc: 'List appointments' },
                { method: 'POST', path: '/api/appointments', desc: 'Create appointment' },
                { method: 'GET', path: '/api/appointments/stats', desc: 'Appointment stats' },
                { method: 'GET', path: '/api/services', desc: 'List services' },
            ]
        },
    ];

    const MethodBadge = ({ method }) => {
        const colors = {
            GET: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
            POST: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
            PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
            PATCH: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
            DELETE: 'bg-red-500/20 text-red-400 border-red-500/40',
        };
        return (
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold border ${colors[method]}`}>
                {method}
            </span>
        );
    };

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
            <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-b px-6 py-5`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            API Documentation
                        </h1>
                        <p className={`${isDark ? 'text-slate-400' : 'text-gray-500'} text-sm mt-1`}>
                            NexCRM Tenant API Reference • v1.0.0 • 13 Industry Modules
                        </p>
                    </div>
                    <input
                        type="text"
                        placeholder="Search endpoints..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-400'} border px-4 py-2 rounded-lg w-64 focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                    />
                </div>
            </div>

            <div className="p-6">
                {/* Quick Start */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 mb-6 text-white">
                    <h2 className="text-lg font-bold mb-4">Quick Start for Mobile App Developers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                            <div>
                                <h4 className="font-semibold">Lookup Tenant</h4>
                                <code className="text-xs bg-black/20 px-2 py-1 rounded block mt-1">POST registry.nexspiresolutions.co.in/lookup</code>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                            <div>
                                <h4 className="font-semibold">Authenticate</h4>
                                <code className="text-xs bg-black/20 px-2 py-1 rounded block mt-1">POST {'{api}'}/api/auth/login</code>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                            <div>
                                <h4 className="font-semibold">Make Requests</h4>
                                <code className="text-xs bg-black/20 px-2 py-1 rounded block mt-1">Authorization: Bearer {'{token}'}</code>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Base URL & Auth */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border rounded-xl p-4`}>
                        <div className="flex items-center gap-3">
                            <i className={`ri-global-line text-2xl ${isDark ? 'text-blue-400' : 'text-indigo-500'}`}></i>
                            <div>
                                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Base URL</span>
                                <code className={`block font-mono text-sm ${isDark ? 'text-blue-400' : 'text-indigo-600'}`}>
                                    https://{'{tenant}'}-crm-api.nexspiresolutions.co.in
                                </code>
                            </div>
                        </div>
                    </div>
                    <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border rounded-xl p-4`}>
                        <div className="flex items-center gap-3">
                            <i className={`ri-key-2-line text-2xl ${isDark ? 'text-amber-400' : 'text-amber-500'}`}></i>
                            <div>
                                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Authorization Header</span>
                                <code className={`block font-mono text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                    Authorization: Bearer {'{token}'}
                                </code>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="space-y-3">
                    {filteredCategories.map((category) => (
                        <div key={category.name} className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border rounded-xl overflow-hidden`}>
                            <button
                                onClick={() => toggleCategory(category.name)}
                                className={`w-full px-4 py-3 flex items-center justify-between ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'} transition-colors`}
                            >
                                <div className="flex items-center gap-3">
                                    <i className={`${category.icon} text-xl ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`}></i>
                                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{category.name}</span>
                                    {category.industry && (
                                        <span className={`text-xs px-2 py-0.5 ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500'} rounded`}>
                                            {category.industry}
                                        </span>
                                    )}
                                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{category.endpoints.length} endpoints</span>
                                </div>
                                <svg className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'} transition-transform ${expandedCategories.includes(category.name) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {expandedCategories.includes(category.name) && (
                                <div className={`border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
                                    {category.endpoints.map((ep, idx) => (
                                        <div key={idx} className={`px-4 py-3 flex items-center gap-4 ${isDark ? 'border-slate-700/50 hover:bg-slate-700/30' : 'border-gray-50 hover:bg-gray-50'} border-b last:border-b-0`}>
                                            <MethodBadge method={ep.method} />
                                            <code className={`font-mono text-sm flex-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{ep.path}</code>
                                            <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{ep.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className={`mt-8 text-center ${isDark ? 'text-slate-500' : 'text-gray-400'} text-sm`}>
                    <p>Need help? Contact <a href="mailto:support@nexspiresolutions.co.in" className="text-indigo-400 hover:underline">support@nexspiresolutions.co.in</a></p>
                </div>
            </div>
        </div>
    );
};

export default ApiDocumentation;
