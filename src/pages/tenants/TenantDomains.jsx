import { useState } from 'react';
import { FiGlobe, FiExternalLink } from '../../components/icons/FeatherIcons';

const TenantDomains = ({
    tenant,
    domain,
    customDomains,
    setCustomDomains,
    domainLoading,
    showDomainModal,
    setShowDomainModal,
    onSetupDomain,
    onOpenDomainModal,
}) => {
    const [showDomainHelp, setShowDomainHelp] = useState(false);

    return (
        <>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <FiGlobe className="w-5 h-5 text-slate-500" />
                    Domains
                    <button onClick={onOpenDomainModal} className="ml-auto text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Configure
                    </button>
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                    {/* CRM Dashboard */}
                    <div className="p-4 border rounded-xl flex items-center justify-between group hover:border-indigo-200 dark:border-slate-600 dark:hover:border-indigo-500 transition">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600">
                                <FiGlobe />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">CRM Dashboard</p>
                                <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{tenant.custom_domain_crm || `${tenant.slug}-crm.${domain}`}</p>
                                {tenant.custom_domain_crm ? (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tenant.custom_domain_verified ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                        {tenant.custom_domain_verified ? 'Verified' : 'Pending DNS'}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-slate-400">Default</span>
                                )}
                            </div>
                        </div>
                        <a href={tenant.custom_domain_crm ? `https://${tenant.custom_domain_crm}` : `https://${tenant.slug}-crm.${domain}`} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-indigo-600 transition">
                            <FiExternalLink />
                        </a>
                    </div>
                    {/* API (always uses default nexspiresolutions domain) */}
                    <div className="p-4 border rounded-xl flex items-center justify-between group hover:border-indigo-200 dark:border-slate-600 dark:hover:border-indigo-500 transition">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500">
                                <FiGlobe />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">API</p>
                                <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{tenant.slug}-crm-api.{domain}</p>
                                <span className="text-[10px] text-slate-400">Managed by NexSpire</span>
                            </div>
                        </div>
                        <a href={`https://${tenant.slug}-crm-api.${domain}`} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-indigo-600 transition">
                            <FiExternalLink />
                        </a>
                    </div>
                    {/* Storefront */}
                    <div className="p-4 border rounded-xl flex items-center justify-between group hover:border-indigo-200 dark:border-slate-600 dark:hover:border-indigo-500 transition">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600">
                                <FiGlobe />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Storefront</p>
                                <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{tenant.custom_domain_storefront || `${tenant.slug}.${domain}`}</p>
                                {tenant.custom_domain_storefront ? (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tenant.custom_domain_verified ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                        {tenant.custom_domain_verified ? 'Verified' : 'Pending DNS'}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-slate-400">Default</span>
                                )}
                            </div>
                        </div>
                        <a href={tenant.custom_domain_storefront ? `https://${tenant.custom_domain_storefront}` : `https://${tenant.slug}.${domain}`} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-indigo-600 transition">
                            <FiExternalLink />
                        </a>
                    </div>
                </div>
            </div>

            {/* Custom Domain Modal */}
            {showDomainModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6 my-8">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Configure Custom Domains</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Point the tenant's custom domains to Cloudflare Pages. The API always stays on <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 rounded">{tenant.slug}-crm-api.{domain}</code>.
                        </p>

                        {/* CRM Domain */}
                        <div className="mb-4 p-3 border rounded-lg dark:border-slate-600">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CRM Dashboard</label>
                            <input
                                type="text"
                                value={customDomains.crm}
                                onChange={(e) => setCustomDomains(prev => ({ ...prev, crm: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                placeholder="crm.yourbrand.com"
                            />
                            <p className="text-xs text-slate-500 mt-1">CNAME Target: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">nexcrm-frontend.pages.dev</code></p>
                        </div>

                        {/* Storefront Domain */}
                        <div className="mb-4 p-3 border rounded-lg dark:border-slate-600">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Storefront</label>
                            <input
                                type="text"
                                value={customDomains.storefront}
                                onChange={(e) => setCustomDomains(prev => ({ ...prev, storefront: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                placeholder="yourbrand.com or store.yourbrand.com"
                            />
                            <p className="text-xs text-slate-500 mt-1">CNAME Target: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">nexcrm-storefront.pages.dev</code></p>
                        </div>

                        {/* Setup Help Section */}
                        <div className="mb-4 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setShowDomainHelp(prev => !prev)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    How to set up a custom domain
                                </span>
                                <svg className={`w-4 h-4 transition-transform ${showDomainHelp ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {showDomainHelp && (
                                <div className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 space-y-3 bg-white dark:bg-slate-800">
                                    <div className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">1</span>
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">Enter the tenant's custom domains above</p>
                                            <p className="text-xs mt-0.5">CRM and Storefront are both optional. You can set up one or both.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">2</span>
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">Click "Save Domains"</p>
                                            <p className="text-xs mt-0.5">This registers the custom domains with Cloudflare Pages automatically.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">3</span>
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">Tenant adds CNAME records in their DNS provider</p>
                                            <p className="text-xs mt-0.5">The tenant goes to their domain registrar (GoDaddy, Namecheap, etc.) and adds CNAME records:</p>
                                            <div className="mt-2 bg-slate-50 dark:bg-slate-900 rounded-md p-2 text-xs font-mono space-y-1">
                                                <p><span className="text-slate-400">CRM:</span> CNAME <span className="text-emerald-600 dark:text-emerald-400">crm.yourbrand.com</span> &rarr; <span className="text-blue-600 dark:text-blue-400">nexcrm-frontend.pages.dev</span></p>
                                                <p><span className="text-slate-400">Storefront:</span> CNAME <span className="text-emerald-600 dark:text-emerald-400">store.yourbrand.com</span> &rarr; <span className="text-blue-600 dark:text-blue-400">nexcrm-storefront.pages.dev</span></p>
                                            </div>
                                            <p className="text-xs mt-1.5 text-slate-500">Works with any DNS provider — no Cloudflare account needed for the tenant.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">4</span>
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">Wait for DNS propagation</p>
                                            <p className="text-xs mt-0.5">Usually takes a few minutes. Cloudflare Pages handles SSL certificates automatically.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">5</span>
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">Done!</p>
                                            <p className="text-xs mt-0.5">The storefront will automatically detect the custom domain and load the correct tenant. The API stays on <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">{domain}</code> under the hood — customers never see it.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowDomainModal(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                            <button
                                onClick={onSetupDomain}
                                disabled={domainLoading}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                            >
                                {domainLoading ? 'Configuring...' : 'Save Domains'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TenantDomains;
