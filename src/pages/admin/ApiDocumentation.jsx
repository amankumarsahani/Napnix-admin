import React, { useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

/**
 * API Documentation Page
 * 
 * Interactive OpenAPI documentation for NexCRM API using Swagger UI.
 * Accessible from admin panel for developer reference.
 */
const ApiDocumentation = () => {
    const [selectedApi, setSelectedApi] = useState('tenant');

    // OpenAPI spec URLs
    const apiSpecs = {
        tenant: {
            name: 'Tenant CRM API',
            description: 'Multi-tenant CRM API for leads, clients, products, orders',
            spec: '/openapi/tenant.yaml'
        },
        registry: {
            name: 'Registry Service',
            description: 'Tenant lookup service for mobile app authentication',
            spec: '/openapi/registry.yaml'
        },
        admin: {
            name: 'Admin API',
            description: 'NexSpire admin panel API',
            spec: '/openapi/admin.yaml'
        }
    };

    return (
        <div className="api-documentation">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1>API Documentation</h1>
                    <p className="subtitle">
                        Interactive API documentation for NexCRM.
                        Use this reference for mobile app and third-party integrations.
                    </p>
                </div>
                <div className="header-actions">
                    <a
                        href="/openapi/tenant.yaml"
                        download
                        className="btn btn-outline"
                    >
                        <i className="fas fa-download"></i>
                        Download OpenAPI Spec
                    </a>
                </div>
            </div>

            {/* Quick Start Guide */}
            <div className="quick-start-card">
                <h2>Quick Start for Mobile App Developers</h2>
                <div className="steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <div className="step-content">
                            <h4>Lookup Tenant</h4>
                            <code>POST registry.nexspiresolutions.co.in/lookup</code>
                            <p>Get tenant API URL by user email</p>
                        </div>
                    </div>
                    <div className="step">
                        <div className="step-number">2</div>
                        <div className="step-content">
                            <h4>Authenticate</h4>
                            <code>POST {'{tenant_api}'}/api/auth/login</code>
                            <p>Login with email/password, get JWT token</p>
                        </div>
                    </div>
                    <div className="step">
                        <div className="step-number">3</div>
                        <div className="step-content">
                            <h4>Make Requests</h4>
                            <code>Authorization: Bearer {'{token}'}</code>
                            <p>Include token in all API requests</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* API Selector */}
            <div className="api-selector">
                {Object.entries(apiSpecs).map(([key, api]) => (
                    <button
                        key={key}
                        className={`api-tab ${selectedApi === key ? 'active' : ''}`}
                        onClick={() => setSelectedApi(key)}
                    >
                        <span className="api-name">{api.name}</span>
                        <span className="api-desc">{api.description}</span>
                    </button>
                ))}
            </div>

            {/* Inline OpenAPI Spec for Swagger UI */}
            <div className="swagger-container">
                <SwaggerUI
                    spec={openApiSpec}
                    docExpansion="list"
                    defaultModelsExpandDepth={-1}
                    displayOperationId={false}
                    filter={true}
                />
            </div>

            <style>{`
                .api-documentation {
                    padding: 24px;
                    background: var(--bg-primary);
                    min-height: 100vh;
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 24px;
                    padding-bottom: 24px;
                    border-bottom: 1px solid var(--border-color);
                }

                .page-header h1 {
                    font-size: 28px;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0;
                }

                .subtitle {
                    color: var(--text-secondary);
                    margin-top: 8px;
                }

                .btn-outline {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    border: 1px solid var(--primary-color);
                    color: var(--primary-color);
                    background: transparent;
                    border-radius: 8px;
                    cursor: pointer;
                    text-decoration: none;
                    transition: all 0.2s;
                }

                .btn-outline:hover {
                    background: var(--primary-color);
                    color: white;
                }

                .quick-start-card {
                    background: linear-gradient(135deg, var(--primary-color) 0%, #6366f1 100%);
                    border-radius: 16px;
                    padding: 24px 32px;
                    margin-bottom: 24px;
                    color: white;
                }

                .quick-start-card h2 {
                    margin: 0 0 20px 0;
                    font-size: 20px;
                }

                .steps {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                }

                .step {
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                }

                .step-number {
                    width: 32px;
                    height: 32px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    flex-shrink: 0;
                }

                .step-content h4 {
                    margin: 0 0 4px 0;
                    font-size: 16px;
                }

                .step-content code {
                    display: block;
                    background: rgba(0,0,0,0.2);
                    padding: 6px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    margin: 8px 0;
                    word-break: break-all;
                }

                .step-content p {
                    margin: 0;
                    font-size: 13px;
                    opacity: 0.9;
                }

                .api-selector {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                }

                .api-tab {
                    padding: 16px 20px;
                    background: var(--bg-secondary);
                    border: 2px solid var(--border-color);
                    border-radius: 12px;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s;
                    flex: 1;
                    min-width: 200px;
                }

                .api-tab:hover {
                    border-color: var(--primary-color);
                }

                .api-tab.active {
                    border-color: var(--primary-color);
                    background: var(--primary-light);
                }

                .api-name {
                    display: block;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 4px;
                }

                .api-desc {
                    display: block;
                    font-size: 13px;
                    color: var(--text-secondary);
                }

                .swagger-container {
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                /* Swagger UI Theme Overrides */
                .swagger-ui {
                    font-family: inherit !important;
                }

                .swagger-ui .info {
                    margin: 0;
                }

                .swagger-ui .opblock-tag {
                    border-bottom: 1px solid #e5e7eb;
                }

                .swagger-ui .opblock {
                    border-radius: 8px;
                    margin-bottom: 12px;
                }

                .swagger-ui .opblock-summary {
                    border-radius: 8px;
                }

                .swagger-ui .btn {
                    border-radius: 6px;
                }
            `}</style>
        </div>
    );
};

// Inline OpenAPI Spec (for standalone usage without server)
const openApiSpec = {
    openapi: "3.0.3",
    info: {
        title: "NexCRM Tenant API",
        version: "1.0.0",
        description: "Multi-tenant CRM API for managing leads, clients, projects, and industry-specific modules."
    },
    servers: [
        { url: "https://{tenant}-crm-api.nexspiresolutions.co.in/api", description: "Tenant API" },
        { url: "https://registry.nexspiresolutions.co.in", description: "Registry Service" }
    ],
    tags: [
        { name: "Registry", description: "Tenant lookup for mobile apps" },
        { name: "Auth", description: "Authentication" },
        { name: "Leads", description: "Lead management" },
        { name: "Clients", description: "Client management" },
        { name: "Products", description: "E-commerce products" },
        { name: "Orders", description: "E-commerce orders" }
    ],
    paths: {
        "/lookup": {
            post: {
                tags: ["Registry"],
                summary: "Lookup tenant by email",
                requestBody: {
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    email: { type: "string", example: "user@acme.com" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "200": { description: "Tenant found" },
                    "404": { description: "Not found" }
                }
            }
        },
        "/api/auth/login": {
            post: {
                tags: ["Auth"],
                summary: "User login",
                requestBody: {
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    email: { type: "string" },
                                    password: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "200": { description: "Login successful" }
                }
            }
        },
        "/api/leads": {
            get: {
                tags: ["Leads"],
                summary: "List leads",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "page", in: "query", schema: { type: "integer" } },
                    { name: "limit", in: "query", schema: { type: "integer" } },
                    { name: "status", in: "query", schema: { type: "string" } }
                ],
                responses: { "200": { description: "Lead list" } }
            },
            post: {
                tags: ["Leads"],
                summary: "Create lead",
                security: [{ bearerAuth: [] }],
                responses: { "201": { description: "Created" } }
            }
        },
        "/api/clients": {
            get: {
                tags: ["Clients"],
                summary: "List clients",
                security: [{ bearerAuth: [] }],
                responses: { "200": { description: "Client list" } }
            }
        },
        "/api/products": {
            get: {
                tags: ["Products"],
                summary: "List products (e-commerce)",
                security: [{ bearerAuth: [] }],
                responses: { "200": { description: "Product list" } }
            }
        },
        "/api/orders": {
            get: {
                tags: ["Orders"],
                summary: "List orders (e-commerce)",
                security: [{ bearerAuth: [] }],
                responses: { "200": { description: "Order list" } }
            }
        }
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT"
            }
        }
    }
};

export default ApiDocumentation;
