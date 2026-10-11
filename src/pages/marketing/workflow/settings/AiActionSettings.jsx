import { LABEL_CLS, CONTROL_CLS } from './controls';

export default function AiActionSettings({ selectedNode, localConfig, setLocalConfig }) {
    return (
        <>
                        {/* AI Post Blog Config */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'ai_post_blog' && (
                            <>
                                <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-100 dark:border-red-800">
                                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300 mb-1">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        <span className="font-semibold text-sm">Post Blog</span>
                                    </div>
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                        Publishes the generated blog to Napnix website.
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Category
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.category || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, category: e.target.value })}
                                        placeholder="General"
                                        className={CONTROL_CLS}
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Author
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.author || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, author: e.target.value })}
                                        placeholder="AI Writer"
                                        className={CONTROL_CLS}
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Publish Status
                                    </label>
                                    <select
                                        value={localConfig?.status || 'draft'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, status: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="draft">Draft (Review First)</option>
                                        <option value="published">Published (Auto-Publish)</option>
                                    </select>
                                </div>
                                <div className="p-2 bg-surface-2 rounded text-xs text-fg-muted">
                                    <strong>Uses:</strong> blog_title, blog_excerpt, blog_content, blog_image<br />
                                    <strong>Outputs:</strong> blog_posted, blog_id, blog_slug
                                </div>
                            </>
                        )}

                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'ai_agent' && (
                            <>
                                <div className="p-3 bg-violet-50 dark:bg-violet-900/30 rounded-lg border border-violet-100 dark:border-violet-800">
                                    <span className="font-semibold text-sm text-violet-700 dark:text-violet-300">AI Agent</span>
                                    <p className="text-xs text-violet-600 dark:text-violet-400">
                                        Give it a goal. It decides which tools to call, reads the results and repeats until done.
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>Goal</label>
                                    <textarea rows={5} value={localConfig?.goal || ''} onChange={(e) => setLocalConfig({ ...localConfig, goal: e.target.value })} placeholder="Find one keyword clinic owners search that we rank 8-20 for or don't cover yet, check our existing posts to avoid duplicates, then write one draft targeting it." className={CONTROL_CLS} />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>Tools</label>
                                    {[
                                        ['keyword_research', 'Keyword research (Google Autocomplete)'],
                                        ['gsc_opportunities', 'Search Console opportunities'],
                                        ['list_blog_posts', 'List our blog posts'],
                                        ['write_blog_draft', 'Write blog post'],
                                        ['http_get', 'HTTP GET (allowlisted hosts only)'],
                                    ].map(([id, label]) => {
                                        const tools = localConfig?.tools || ['keyword_research', 'gsc_opportunities', 'list_blog_posts', 'write_blog_draft'];
                                        const required = localConfig?.require_tools || [];
                                        return (
                                            <div key={id} className="flex items-center justify-between gap-2 text-sm text-fg">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={tools.includes(id)}
                                                        onChange={(e) => setLocalConfig({ ...localConfig, tools: e.target.checked ? [...tools, id] : tools.filter(t => t !== id) })}
                                                    />
                                                    {label}
                                                </label>
                                                {tools.includes(id) && (
                                                    <label className="flex items-center gap-1 text-xs text-fg-muted" title="The agent cannot finish until this tool has run successfully">
                                                        <input
                                                            type="checkbox"
                                                            checked={required.includes(id)}
                                                            onChange={(e) => setLocalConfig({ ...localConfig, require_tools: e.target.checked ? [...required, id] : required.filter(t => t !== id) })}
                                                        />
                                                        must use
                                                    </label>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {(localConfig?.tools || []).includes('http_get') && (
                                    <div>
                                        <label className={LABEL_CLS}>Allowed Hosts</label>
                                        <input type="text" value={localConfig?.allowed_hosts || ''} onChange={(e) => setLocalConfig({ ...localConfig, allowed_hosts: e.target.value })} placeholder="api.napnix.in, napnix.in" className={CONTROL_CLS} />
                                        <p className="text-xs text-fg-muted mt-1">Fetched pages can contain instructions aimed at the agent; only list sites you trust.</p>
                                    </div>
                                )}
                                {(localConfig?.tools || ['write_blog_draft']).includes('write_blog_draft') && (
                                    <label className="flex items-start gap-2 text-sm text-fg">
                                        <input type="checkbox" className="mt-0.5" checked={localConfig?.publish === true} onChange={(e) => setLocalConfig({ ...localConfig, publish: e.target.checked })} />
                                        <span>
                                            Publish blog posts automatically
                                            <span className="block text-xs text-fg-muted">Off = saved as drafts for review. On = live on the website immediately and submitted for indexing.</span>
                                        </span>
                                    </label>
                                )}
                                <div>
                                    <label className={LABEL_CLS}>Brand Context (for blog posts)</label>
                                    <textarea rows={4} value={localConfig?.brand_context || ''} onChange={(e) => setLocalConfig({ ...localConfig, brand_context: e.target.value })} placeholder="Leave empty to use the default Napnix context." className={CONTROL_CLS} />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className={LABEL_CLS}>Max Steps</label>
                                        <input type="number" min={1} max={15} value={localConfig?.max_steps || 6} onChange={(e) => setLocalConfig({ ...localConfig, max_steps: parseInt(e.target.value) || 6 })} className={CONTROL_CLS} />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLS}>Max Posts</label>
                                        <input type="number" min={1} max={5} value={localConfig?.max_drafts || 1} onChange={(e) => setLocalConfig({ ...localConfig, max_drafts: parseInt(e.target.value) || 1 })} className={CONTROL_CLS} />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLS}>Save As</label>
                                        <input type="text" value={localConfig?.output_variable || ''} onChange={(e) => setLocalConfig({ ...localConfig, output_variable: e.target.value })} placeholder="agent_result" className={CONTROL_CLS} />
                                    </div>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>AI Model (optional)</label>
                                    <input type="text" value={localConfig?.model || ''} onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })} placeholder="Default model with provider fallback" className={CONTROL_CLS} />
                                </div>
                                <div className="p-2 bg-surface-2 rounded text-xs text-fg-muted">
                                    <strong>Outputs:</strong> {'{{agent_result}}'} (final answer), {'{{agent_result_steps}}'} (every tool call and result, also in the run log)
                                </div>
                            </>
                        )}

                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'http_request' && (
                            <>
                                <div className="p-3 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg border border-cyan-100 dark:border-cyan-800">
                                    <span className="font-semibold text-sm text-cyan-700 dark:text-cyan-300">HTTP Request</span>
                                    <p className="text-xs text-cyan-600 dark:text-cyan-400">
                                        Call any API. Every field accepts {'{{variables}}'} from earlier nodes, e.g. {'{{email}}'} or {'{{api.items.0.title}}'}.
                                    </p>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className={LABEL_CLS}>Method</label>
                                        <select value={localConfig?.method || 'GET'} onChange={(e) => setLocalConfig({ ...localConfig, method: e.target.value })} className={CONTROL_CLS}>
                                            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className={LABEL_CLS}>URL</label>
                                        <input type="text" value={localConfig?.url || ''} onChange={(e) => setLocalConfig({ ...localConfig, url: e.target.value })} placeholder="https://api.example.com/items?q={{company}}" className={CONTROL_CLS} />
                                    </div>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>Headers (one per line)</label>
                                    <textarea rows={3} value={typeof localConfig?.headers === 'string' ? localConfig.headers : ''} onChange={(e) => setLocalConfig({ ...localConfig, headers: e.target.value })} placeholder="Authorization: Bearer YOUR_TOKEN" className="w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500 text-xs font-mono" />
                                    <p className="text-xs text-amber-600 mt-1">Stored in the workflow config as plain text. Use a scoped, revocable token.</p>
                                </div>
                                {(localConfig?.method || 'GET') !== 'GET' && (
                                    <div>
                                        <label className={LABEL_CLS}>Body</label>
                                        <select value={localConfig?.body_mode || 'custom'} onChange={(e) => setLocalConfig({ ...localConfig, body_mode: e.target.value })} className="w-full mb-2 px-3 py-2 border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500 text-sm">
                                            <option value="custom">Custom body</option>
                                            <option value="context">Send all workflow data as JSON</option>
                                        </select>
                                        {(localConfig?.body_mode || 'custom') === 'custom' && (
                                            <textarea rows={5} value={localConfig?.body || ''} onChange={(e) => setLocalConfig({ ...localConfig, body: e.target.value })} placeholder={'{"email": "{{email}}", "name": "{{name}}"}'} className="w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500 text-xs font-mono" />
                                        )}
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={LABEL_CLS}>Save Response As</label>
                                        <input type="text" value={localConfig?.response_variable || ''} onChange={(e) => setLocalConfig({ ...localConfig, response_variable: e.target.value })} placeholder="http_response" className={CONTROL_CLS} />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLS}>Timeout (sec)</label>
                                        <input type="number" value={localConfig?.timeout_seconds || 30} onChange={(e) => setLocalConfig({ ...localConfig, timeout_seconds: parseInt(e.target.value) || 30 })} className={CONTROL_CLS} />
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 text-sm text-fg">
                                    <input type="checkbox" checked={localConfig?.fail_on_error !== false} onChange={(e) => setLocalConfig({ ...localConfig, fail_on_error: e.target.checked })} />
                                    Stop workflow on non-2xx response
                                </label>
                                <div className="p-2 bg-surface-2 rounded text-xs text-fg-muted">
                                    <strong>Outputs:</strong> {'{{<name>}}'} (parsed JSON or text), {'{{<name>_status}}'}
                                </div>
                            </>
                        )}

                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'keyword_research' && (
                            <>
                                <div className="p-3 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg border border-cyan-100 dark:border-cyan-800">
                                    <span className="font-semibold text-sm text-cyan-700 dark:text-cyan-300">Keyword Research</span>
                                    <p className="text-xs text-cyan-600 dark:text-cyan-400">
                                        Pulls real Google Autocomplete searches for your seed keywords. Free, no API key.
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>Seed Keywords (one per line)</label>
                                    <textarea
                                        rows={5}
                                        value={localConfig?.seeds || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, seeds: e.target.value })}
                                        placeholder={'crm for clinic\nlead follow up\nrestaurant billing software'}
                                        className={CONTROL_CLS}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={LABEL_CLS}>Country</label>
                                        <input type="text" value={localConfig?.country || 'in'} onChange={(e) => setLocalConfig({ ...localConfig, country: e.target.value })} className={CONTROL_CLS} />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLS}>Max Ideas</label>
                                        <input type="number" value={localConfig?.limit || 40} onChange={(e) => setLocalConfig({ ...localConfig, limit: parseInt(e.target.value) || 40 })} className={CONTROL_CLS} />
                                    </div>
                                </div>
                                <div className="p-2 bg-surface-2 rounded text-xs text-fg-muted">
                                    <strong>Outputs:</strong> keyword_suggestions[], seo_keyword_ideas[] (used by AI Pick Topic)
                                </div>
                            </>
                        )}

                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'gsc_opportunities' && (
                            <>
                                <div className="p-3 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg border border-cyan-100 dark:border-cyan-800">
                                    <span className="font-semibold text-sm text-cyan-700 dark:text-cyan-300">Search Console Opportunities</span>
                                    <p className="text-xs text-cyan-600 dark:text-cyan-400">
                                        Queries Google already shows your site for at positions 4 to 20. Uses the global Google service account; add its email as a user on the Search Console property.
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>Property</label>
                                    <input type="text" value={localConfig?.property || ''} onChange={(e) => setLocalConfig({ ...localConfig, property: e.target.value })} placeholder="Default: sc-domain:<website host>" className={CONTROL_CLS} />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className={LABEL_CLS}>Days</label>
                                        <input type="number" value={localConfig?.days || 28} onChange={(e) => setLocalConfig({ ...localConfig, days: parseInt(e.target.value) || 28 })} className={CONTROL_CLS} />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLS}>Min Impr.</label>
                                        <input type="number" value={localConfig?.min_impressions || 5} onChange={(e) => setLocalConfig({ ...localConfig, min_impressions: parseInt(e.target.value) || 5 })} className={CONTROL_CLS} />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLS}>Max Pos.</label>
                                        <input type="number" value={localConfig?.max_position || 20} onChange={(e) => setLocalConfig({ ...localConfig, max_position: parseInt(e.target.value) || 20 })} className={CONTROL_CLS} />
                                    </div>
                                </div>
                                <div className="p-2 bg-surface-2 rounded text-xs text-fg-muted">
                                    <strong>Outputs:</strong> gsc_opportunities[] (query, page, impressions, position), seo_keyword_ideas[]
                                </div>
                            </>
                        )}

                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'index_url' && (
                            <>
                                <div className="p-3 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg border border-cyan-100 dark:border-cyan-800">
                                    <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300 mb-1">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <span className="font-semibold text-sm">Search Engine Indexing</span>
                                    </div>
                                    <p className="text-xs text-cyan-600 dark:text-cyan-400">
                                        Submits URLs to Google, Bing, Yandex for faster indexing.
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        URL to Index (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.url || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, url: e.target.value })}
                                        placeholder="https://yoursite.com/page or {{blog_slug}}"
                                        className={CONTROL_CLS}
                                    />
                                    <p className="text-xs text-fg-muted mt-1">Leave blank to auto-detect from previous nodes (blog_slug, page_slug).</p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Search Engines
                                    </label>
                                    <div className="space-y-2 mt-1">
                                        {[
                                            { key: 'indexnow', label: 'IndexNow (Bing, Yandex, Naver)' },
                                            { key: 'google', label: 'Google Indexing API' },
                                            { key: 'websub', label: 'WebSub (RSS notification)' },
                                        ].map(engine => (
                                            <label key={engine.key} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={(localConfig?.engines || ['indexnow', 'google', 'websub']).includes(engine.key)}
                                                    onChange={(e) => {
                                                        const current = localConfig?.engines || ['indexnow', 'google', 'websub'];
                                                        const updated = e.target.checked ? [...current, engine.key] : current.filter(k => k !== engine.key);
                                                        setLocalConfig({ ...localConfig, engines: updated });
                                                    }}
                                                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                                                />
                                                <span className="text-sm text-fg">{engine.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-2 bg-surface-2 rounded text-xs text-fg-muted">
                                    <strong>Auto-detects:</strong> blog_slug, page_slug, product_id<br />
                                    <strong>Best after:</strong> Post Blog
                                </div>
                                <div className="border-t border-border pt-3 mt-1">
                                    <label className="block text-xs font-semibold text-fg-muted mb-2 uppercase tracking-wider">Credentials (optional — falls back to global settings)</label>
                                    <div className="space-y-3">
                                        <div>
                                            <label className={LABEL_CLS}>Website URL</label>
                                            <input type="text" value={localConfig?.websiteUrl || ''} onChange={(e) => setLocalConfig({ ...localConfig, websiteUrl: e.target.value })} placeholder="https://yoursite.com (uses global if empty)" className={CONTROL_CLS} />
                                        </div>
                                        <div>
                                            <label className={LABEL_CLS}>IndexNow API Key</label>
                                            <input type="text" value={localConfig?.indexnowKey || ''} onChange={(e) => setLocalConfig({ ...localConfig, indexnowKey: e.target.value })} placeholder="Uses global key if empty" className={CONTROL_CLS} />
                                        </div>
                                        <div>
                                            <label className={LABEL_CLS}>Google Service Account JSON</label>
                                            <textarea value={localConfig?.googleServiceAccountJson || ''} onChange={(e) => setLocalConfig({ ...localConfig, googleServiceAccountJson: e.target.value })} placeholder='Paste service account JSON (uses global if empty)' rows={3} className="w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500 text-xs font-mono" />
                                            <p className="text-xs text-fg-muted mt-1">Required for Google Indexing API. Add the service account as a site owner in Google Search Console.</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
        </>
    );
}
