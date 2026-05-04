import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { useQuery } from '@tanstack/react-query';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
    FiEye, FiUsers, FiMousePointer, FiGlobe, FiLayers,
    FiRefreshCw, FiTrendingUp, FiActivity, FiBarChart2,
    FiZap, FiMonitor, FiSmartphone, FiClock, FiCpu,
} from '../../components/icons/FeatherIcons';
import { siteAnalyticsAPI } from '../../api/admin';

// ── Constants ────────────────────────────────────────────────────────────────
const RANGES = [
    { label: '7D',  value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
    { label: 'All', value: 'all' },
];

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

const SOURCE_COLORS = {
    Direct:          '#6366f1',
    'Organic Search': '#10b981',
    'Social Media':  '#f59e0b',
    Referral:        '#8b5cf6',
    Internal:        '#06b6d4',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString();

const fmtDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

const fmtDateTime = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const sessionDuration = (start, end) => {
    if (!start || !end) return '—';
    const secs = Math.round((new Date(end) - new Date(start)) / 1000);
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
};

// ── Subcomponents ────────────────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm ${className}`}>
        {children}
    </div>
);

const SectionTitle = ({ icon, title, subtitle }) => (
    <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
            {icon}
        </div>
        <div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
    </div>
);

const Skeleton = ({ h = 'h-6', w = 'w-full' }) => (
    <div className={`${h} ${w} bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse`} />
);

const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-xl shadow-xl border border-slate-700">
            <p className="font-semibold mb-1 text-slate-300">{label}</p>
            {payload.map((e, i) => (
                <p key={i} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: e.color }} />
                    {e.name}: <span className="font-bold ml-1">{fmt(e.value)}</span>
                </p>
            ))}
        </div>
    );
};

const KpiCard = ({ icon, label, value, sub, color = 'indigo', loading }) => {
    const colors = {
        indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-950',  text: 'text-indigo-600 dark:text-indigo-400' },
        emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-600 dark:text-emerald-400' },
        amber:   { bg: 'bg-amber-50 dark:bg-amber-950',    text: 'text-amber-600 dark:text-amber-400' },
        purple:  { bg: 'bg-purple-50 dark:bg-purple-950',  text: 'text-purple-600 dark:text-purple-400' },
        cyan:    { bg: 'bg-cyan-50 dark:bg-cyan-950',      text: 'text-cyan-600 dark:text-cyan-400' },
        rose:    { bg: 'bg-rose-50 dark:bg-rose-950',      text: 'text-rose-600 dark:text-rose-400' },
    };
    const c = colors[color] || colors.indigo;

    return (
        <Card className="p-5">
            <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center ${c.text}`}>
                    {icon}
                </div>
            </div>
            <div className="mt-3">
                {loading ? (
                    <><Skeleton h="h-7" w="w-20" /><Skeleton h="h-4" w="w-24 mt-1" /></>
                ) : (
                    <>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub || label}</p>
                    </>
                )}
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">{label}</p>
            </div>
        </Card>
    );
};

// ── Mini pie ─────────────────────────────────────────────────────────────────
const MiniPie = ({ data, loading, title }) => {
    const total = data?.reduce((s, d) => s + Number(d.count), 0) || 0;
    return (
        <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">{title}</p>
            {loading ? (
                <div className="space-y-2">
                    {[1,2,3].map(i => <Skeleton key={i} h="h-5" />)}
                </div>
            ) : (
                <div className="space-y-2">
                    {(data || []).slice(0, 6).map((d, i) => {
                        const pct = total > 0 ? Math.round((Number(d.count) / total) * 100) : 0;
                        return (
                            <div key={i}>
                                <div className="flex items-center justify-between text-xs mb-0.5">
                                    <span className="text-slate-600 dark:text-slate-300 truncate max-w-[140px]">{d.label}</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{pct}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                                    <div
                                        className="h-1.5 rounded-full"
                                        style={{ width: `${pct}%`, background: PALETTE[i % PALETTE.length] }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ── AI Insights Renderer ──────────────────────────────────────────────────────
const renderInsight = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
        if (line.startsWith('## ')) {
            return <h3 key={i} className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mt-4 mb-1 first:mt-0">{line.slice(3)}</h3>;
        }
        if (line.startsWith('# ')) {
            return <h2 key={i} className="text-base font-bold text-slate-800 dark:text-white mt-3 mb-1">{line.slice(2)}</h2>;
        }
        if (/^\d+\.\s/.test(line)) {
            return <p key={i} className="text-sm text-slate-700 dark:text-slate-200 ml-3 mb-1 leading-relaxed">{line}</p>;
        }
        if (line.startsWith('- ')) {
            return (
                <p key={i} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2 ml-2 mb-0.5 leading-relaxed">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>{line.slice(2)}</span>
                </p>
            );
        }
        if (line.trim() === '---') return <hr key={i} className="border-slate-200 dark:border-slate-700 my-3" />;
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{line}</p>;
    });
};

// ── Heatmap Canvas ────────────────────────────────────────────────────────────
function HeatmapCanvas({ data }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;

        const refW = data?.viewportWidth  || 1280;
        const refH = data?.viewportHeight || 800;
        const scaleX = W / refW;
        const scaleY = H / refH;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#080c14';
        ctx.fillRect(0, 0, W, H);

        if (!data?.points?.length) {
            ctx.fillStyle = 'rgba(100, 116, 139, 0.45)';
            ctx.font = '13px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('No click data for this page in the selected range', W / 2, H / 2);
            return;
        }

        const maxCount = Math.max(...data.points.map(p => p.count), 1);

        // ── Glow layer (large blurred blobs) ──
        ctx.save();
        ctx.filter = 'blur(48px)';
        for (const pt of data.points) {
            const x = pt.x * scaleX;
            const y = pt.y * scaleY;
            const t = pt.count / maxCount;          // 0..1
            const hue    = Math.round((1 - t) * 215); // 215=blue → 0=red
            const radius = (70 + t * 110) * Math.min(scaleX, scaleY);

            const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
            g.addColorStop(0,    `hsla(${hue},100%,58%,${0.7 + t * 0.25})`);
            g.addColorStop(0.35, `hsla(${hue},100%,52%,${0.35 * t})`);
            g.addColorStop(1,    `hsla(${hue},100%,48%,0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // ── Sharp inner core (unblurred) ──
        for (const pt of data.points) {
            const x = pt.x * scaleX;
            const y = pt.y * scaleY;
            const t = pt.count / maxCount;
            const hue    = Math.round((1 - t) * 215);
            const radius = (12 + t * 22) * Math.min(scaleX, scaleY);
            const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
            g.addColorStop(0,   `hsla(${hue},100%,72%,${0.5 + t * 0.4})`);
            g.addColorStop(0.6, `hsla(${hue},100%,58%,${0.2 * t})`);
            g.addColorStop(1,   'transparent');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // ── Labels: white dot + pill for top 8 hotspots ──
        const top = data.points.slice(0, 8);
        ctx.font = 'bold 10px system-ui, sans-serif';
        for (const pt of top) {
            const x   = pt.x * scaleX;
            const y   = pt.y * scaleY;
            const lbl = (pt.text || pt.element || '?').slice(0, 22);

            // Dot
            ctx.beginPath();
            ctx.arc(x, y, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            // Pill
            ctx.textAlign = 'center';
            const tw  = ctx.measureText(lbl).width;
            const pw  = tw + 10;
            const ph  = 16;
            const px  = x - pw / 2;
            const py  = y - ph - 8;
            ctx.fillStyle = 'rgba(8, 12, 20, 0.85)';
            ctx.beginPath();
            ctx.roundRect(px, py, pw, ph, 4);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.93)';
            ctx.fillText(lbl, x, py + 11);
        }

        // ── Legend (top-right) ──
        const items = [
            { hue: 215, label: 'Low' },
            { hue: 115, label: 'Mid' },
            { hue: 28,  label: 'High' },
            { hue: 0,   label: 'Peak' },
        ];
        let ly = 14;
        const lx = W - 56;
        for (const { hue, label } of items) {
            ctx.beginPath();
            ctx.arc(lx, ly + 5, 5, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${hue},100%,55%)`;
            ctx.fill();
            ctx.font = '9.5px system-ui';
            ctx.fillStyle = 'rgba(255,255,255,0.65)';
            ctx.textAlign = 'left';
            ctx.fillText(label, lx + 9, ly + 9);
            ly += 18;
        }
    }, [data]);

    return (
        <canvas
            ref={canvasRef}
            width={1200}
            height={680}
            className="w-full rounded-xl"
            style={{ background: '#080c14' }}
        />
    );
}

// ── World Map Heatmap ─────────────────────────────────────────────────────────
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// ISO 3166-1 numeric → alpha-2 (covers 170+ countries)
const ISO_NUM_A2 = {
    '4':'AF','8':'AL','12':'DZ','24':'AO','32':'AR','36':'AU','40':'AT',
    '50':'BD','56':'BE','64':'BT','68':'BO','76':'BR','100':'BG','104':'MM',
    '116':'KH','120':'CM','124':'CA','144':'LK','152':'CL','156':'CN',
    '170':'CO','180':'CD','191':'HR','192':'CU','196':'CY','203':'CZ',
    '208':'DK','214':'DO','218':'EC','818':'EG','231':'ET','233':'EE',
    '246':'FI','250':'FR','276':'DE','288':'GH','300':'GR','320':'GT',
    '332':'HT','340':'HN','348':'HU','356':'IN','360':'ID','364':'IR',
    '368':'IQ','372':'IE','376':'IL','380':'IT','392':'JP','400':'JO',
    '404':'KE','408':'KP','410':'KR','414':'KW','418':'LA','422':'LB',
    '428':'LV','434':'LY','440':'LT','442':'LU','458':'MY','484':'MX',
    '496':'MN','504':'MA','508':'MZ','516':'NA','524':'NP','528':'NL',
    '554':'NZ','558':'NI','562':'NE','566':'NG','578':'NO','586':'PK',
    '591':'PA','598':'PG','604':'PE','608':'PH','616':'PL','620':'PT',
    '630':'PR','634':'QA','642':'RO','643':'RU','646':'RW','682':'SA',
    '686':'SN','694':'SL','703':'SK','705':'SI','706':'SO','710':'ZA',
    '716':'ZW','724':'ES','729':'SD','740':'SR','752':'SE','756':'CH',
    '760':'SY','762':'TJ','764':'TH','768':'TG','780':'TT','788':'TN',
    '792':'TR','800':'UG','804':'UA','784':'AE','826':'GB','834':'TZ',
    '840':'US','858':'UY','860':'UZ','862':'VE','704':'VN','887':'YE',
    '894':'ZM','275':'PS','076':'BR','032':'AR','076':'BR',
};

function worldHeatColor(t) {
    // t: 0 = no traffic, 1 = peak
    if (t <= 0)   return '#111d2e';           // dark slate – no data
    if (t < 0.08) return '#1e3a5f';           // very low – dark blue
    if (t < 0.25) return '#1d4ed8';           // low – blue
    if (t < 0.5)  return '#7c3aed';           // medium – purple
    if (t < 0.75) return '#ea580c';           // high – orange
    return '#dc2626';                          // peak – red
}

function WorldMapHeatmap({ data, loading }) {
    const [tooltip, setTooltip] = useState(null);

    const maxEvents = useMemo(
        () => Math.max(...(data?.countries || []).map(c => c.events), 1),
        [data]
    );

    const byCode = useMemo(() => {
        const m = {};
        for (const c of (data?.countries || [])) m[c.country] = c;
        return m;
    }, [data]);

    if (loading) return <div className="h-72 bg-[#0d1829] rounded-xl animate-pulse" />;

    return (
        <div className="relative rounded-xl overflow-hidden bg-[#0a0f1e] border border-slate-700/40">
            <ComposableMap
                projection="geoNaturalEarth1"
                width={900}
                height={440}
                style={{ width: '100%', height: 'auto' }}
            >
                <ZoomableGroup zoom={1}>
                    <Geographies geography={GEO_URL}>
                        {({ geographies }) =>
                            geographies.map(geo => {
                                const a2  = ISO_NUM_A2[String(geo.id)];
                                const row = a2 ? byCode[a2] : null;
                                const t   = row ? row.events / maxEvents : 0;
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={worldHeatColor(t)}
                                        stroke="#0a0f1e"
                                        strokeWidth={0.4}
                                        style={{
                                            default:  { outline: 'none' },
                                            hover:    { fill: t > 0 ? worldHeatColor(Math.min(t * 1.5, 1)) : '#1e3a5f', outline: 'none', cursor: row ? 'pointer' : 'default' },
                                            pressed:  { outline: 'none' },
                                        }}
                                        onMouseMove={(evt) => {
                                            if (!row) return;
                                            setTooltip({ a2, events: row.events, sessions: row.sessions, x: evt.clientX, y: evt.clientY });
                                        }}
                                        onMouseLeave={() => setTooltip(null)}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                {[
                    { color: '#1d4ed8', label: 'Low' },
                    { color: '#7c3aed', label: 'Mid' },
                    { color: '#ea580c', label: 'High' },
                    { color: '#dc2626', label: 'Peak' },
                ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                        <span className="text-[10px] text-slate-400">{label}</span>
                    </div>
                ))}
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="fixed z-50 pointer-events-none bg-slate-900 border border-slate-700 text-white text-xs px-3 py-2 rounded-xl shadow-2xl"
                    style={{ left: tooltip.x + 14, top: tooltip.y - 44 }}
                >
                    <p className="font-bold text-slate-100 mb-0.5">{tooltip.a2}</p>
                    <p className="text-slate-300">{fmt(tooltip.events)} events · {fmt(tooltip.sessions)} sessions</p>
                </div>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SiteAnalytics() {
    const [range, setRange]           = useState('30d');
    const [aiInsight, setAiInsight]   = useState(null);
    const [aiLoading, setAiLoading]   = useState(false);
    const [aiError, setAiError]       = useState(null);
    const [expandedSession, setExpandedSession] = useState(null);
    const [heatmapPage, setHeatmapPage] = useState('');

    const qOpts = (key) => ({
        queryKey: [key, range],
        queryFn:  () => siteAnalyticsAPI[key](range),
        staleTime: 2 * 60 * 1000,
    });

    const { data: overview,  isLoading: ovLoading,  refetch: refetchOv }  = useQuery({ ...qOpts('getOverview'), queryFn: () => siteAnalyticsAPI.getOverview(range) });
    const { data: timeSeries, isLoading: tsLoading }                        = useQuery({ queryKey: ['getTimeSeries', range],  queryFn: () => siteAnalyticsAPI.getTimeSeries(range) });
    const { data: pages,      isLoading: pgLoading }                        = useQuery({ queryKey: ['getPages', range],       queryFn: () => siteAnalyticsAPI.getPages(range) });
    const { data: sources,    isLoading: srcLoading }                       = useQuery({ queryKey: ['getTrafficSources', range], queryFn: () => siteAnalyticsAPI.getTrafficSources(range) });
    const { data: devices,    isLoading: devLoading }                       = useQuery({ queryKey: ['getDevices', range],     queryFn: () => siteAnalyticsAPI.getDevices(range) });
    const { data: geography,  isLoading: geoLoading }                       = useQuery({ queryKey: ['getGeography', range],  queryFn: () => siteAnalyticsAPI.getGeography(range) });
    const { data: journey,    isLoading: jrLoading }                        = useQuery({ queryKey: ['getJourney', range],    queryFn: () => siteAnalyticsAPI.getJourney(range) });
    const { data: events,     isLoading: evLoading }                        = useQuery({ queryKey: ['getEvents', range],     queryFn: () => siteAnalyticsAPI.getEvents(range) });
    const { data: heatmapData, isLoading: hmLoading, refetch: refetchHm }  = useQuery({
        queryKey: ['getHeatmap', heatmapPage, range],
        queryFn:  () => siteAnalyticsAPI.getHeatmap(heatmapPage || undefined, range),
        staleTime: 5 * 60 * 1000,
    });
    // Auto-select the first page with clicks once data arrives
    useEffect(() => {
        if (!heatmapPage && heatmapData?.availablePages?.length) {
            setHeatmapPage(heatmapData.availablePages[0].path);
        }
    }, [heatmapData, heatmapPage]);

    const handleRefresh = useCallback(() => refetchOv(), [refetchOv]);

    const handleAIAnalysis = async () => {
        setAiLoading(true);
        setAiError(null);
        setAiInsight(null);
        try {
            const result = await siteAnalyticsAPI.getAIInsights({
                range,
                overview,
                pages: pages?.slice(0, 10),
                sources,
                devices,
                geography,
                journeySessions: journey?.sessions?.slice(0, 10),
                topElements: events?.topElements?.slice(0, 10),
            });
            setAiInsight(result.insight);
        } catch (err) {
            setAiError(err?.response?.data?.error || 'AI analysis failed. Check AI provider settings.');
        } finally {
            setAiLoading(false);
        }
    };

    const maxPageViews = Math.max(...(pages || []).map(p => Number(p.views)), 1);
    const maxCountry   = Math.max(...(geography?.countries || []).map(c => Number(c.events)), 1);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 lg:p-6 space-y-6">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FiBarChart2 size={24} className="text-indigo-600" />
                        Site Analytics
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Visitor intelligence · nexspiresolutions.co.in
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Date range */}
                    <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 gap-1">
                        {RANGES.map(r => (
                            <button
                                key={r.value}
                                onClick={() => setRange(r.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    range === r.value
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors"
                        title="Refresh"
                    >
                        <FiRefreshCw size={16} className={ovLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* ── KPI Row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
                <KpiCard icon={<FiEye size={18} />}          label="Page Views"      color="indigo"  loading={ovLoading} value={fmt(overview?.pageViews)}          sub={`${fmt(overview?.pageViews)} total views`} />
                <KpiCard icon={<FiUsers size={18} />}         label="Sessions"        color="emerald" loading={ovLoading} value={fmt(overview?.uniqueSessions)}      sub="Unique visits" />
                <KpiCard icon={<FiMousePointer size={18} />}  label="Click Events"    color="amber"   loading={ovLoading} value={fmt(overview?.clickEvents)}         sub="User interactions" />
                <KpiCard icon={<FiGlobe size={18} />}         label="Countries"       color="purple"  loading={ovLoading} value={fmt(overview?.uniqueCountries)}     sub={`Top: ${overview?.topCountry || '—'}`} />
                <KpiCard icon={<FiLayers size={18} />}        label="Pages/Session"   color="cyan"    loading={ovLoading} value={overview?.avgPagesPerSession ?? '—'} sub="Avg depth" />
                <KpiCard icon={<FiActivity size={18} />}      label="Bounce Rate"     color="rose"    loading={ovLoading} value={overview?.bounceRate != null ? `${overview.bounceRate}%` : '—'} sub="Single-page sessions" />
            </div>

            {/* ── Traffic Timeline ── */}
            <Card className="p-5">
                <SectionTitle icon={<FiTrendingUp size={16} />} title="Traffic Over Time" subtitle="Daily page views and click events" />
                {tsLoading ? (
                    <Skeleton h="h-56" />
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={timeSeries || []} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                            <defs>
                                <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gClicks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                            <Tooltip content={<ChartTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Area type="monotone" dataKey="views"  name="Page Views"   stroke="#6366f1" fill="url(#gViews)"  strokeWidth={2} dot={false} />
                            <Area type="monotone" dataKey="clicks" name="Click Events" stroke="#10b981" fill="url(#gClicks)" strokeWidth={2} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </Card>

            {/* ── Pages + Sources Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Pages */}
                <Card className="lg:col-span-2 p-5">
                    <SectionTitle icon={<FiEye size={16} />} title="Top Pages" subtitle="By page view count" />
                    {pgLoading ? (
                        <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} h="h-8" />)}</div>
                    ) : (
                        <div className="space-y-2">
                            {(pages || []).slice(0, 10).map((p, i) => {
                                const pct = Math.round((Number(p.views) / maxPageViews) * 100);
                                return (
                                    <div key={i} className="group">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="font-mono text-slate-600 dark:text-slate-300 truncate max-w-[60%]">{p.path || '/'}</span>
                                            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                                <span><span className="font-semibold text-slate-700 dark:text-slate-200">{fmt(p.views)}</span> views</span>
                                                <span className="hidden sm:inline">{fmt(p.unique_sessions)} sessions</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full transition-all"
                                                style={{ width: `${pct}%`, background: PALETTE[i % PALETTE.length] }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>

                {/* Traffic Sources */}
                <Card className="p-5">
                    <SectionTitle icon={<FiGlobe size={16} />} title="Traffic Sources" />
                    {srcLoading ? (
                        <Skeleton h="h-52" />
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie
                                        data={sources || []}
                                        dataKey="count"
                                        nameKey="source"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        paddingAngle={3}
                                    >
                                        {(sources || []).map((s, i) => (
                                            <Cell key={i} fill={SOURCE_COLORS[s.source] || PALETTE[i % PALETTE.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v) => [fmt(v), 'Events']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-1.5 mt-2">
                                {(sources || []).map((s, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: SOURCE_COLORS[s.source] || PALETTE[i] }} />
                                            <span className="text-slate-600 dark:text-slate-300">{s.source}</span>
                                        </div>
                                        <div className="text-slate-500 dark:text-slate-400">
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">{fmt(s.count)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </Card>
            </div>

            {/* ── Device Breakdown ── */}
            <Card className="p-5">
                <SectionTitle icon={<FiMonitor size={16} />} title="Device Intelligence" subtitle="Browser, OS, and device type distribution" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MiniPie title="Device Type"      data={devices?.deviceTypes}       loading={devLoading} />
                    <MiniPie title="Browser"           data={devices?.browsers}          loading={devLoading} />
                    <MiniPie title="Operating System"  data={devices?.operatingSystems}  loading={devLoading} />
                    <MiniPie title="Screen Size"       data={devices?.screenSizes}       loading={devLoading} />
                </div>
            </Card>

            {/* ── Geography + World Map ── */}
            <Card className="p-5">
                <SectionTitle icon={<FiGlobe size={16} />} title="Geographic Distribution" subtitle="Where your visitors are coming from · hover a country for details" />

                {/* World map heatmap */}
                <div className="mb-5">
                    <WorldMapHeatmap data={geography} loading={geoLoading} />
                </div>

                {/* Country table */}
                <div className="overflow-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-slate-400 dark:text-slate-500 uppercase tracking-wide border-b border-slate-100 dark:border-slate-700">
                                <th className="text-left pb-2 font-semibold">#</th>
                                <th className="text-left pb-2 font-semibold">Country</th>
                                <th className="text-right pb-2 font-semibold">Sessions</th>
                                <th className="text-right pb-2 font-semibold">Events</th>
                                <th className="text-right pb-2 font-semibold w-24">Share</th>
                            </tr>
                        </thead>
                        <tbody>
                            {geoLoading ? (
                                [...Array(6)].map((_, i) => (
                                    <tr key={i}><td colSpan={5} className="py-1"><Skeleton h="h-6" /></td></tr>
                                ))
                            ) : (
                                (geography?.countries || []).slice(0, 15).map((c, i) => {
                                    const pct = Math.round((Number(c.events) / maxCountry) * 100);
                                    return (
                                        <tr key={i} className="border-b border-slate-50 dark:border-slate-700/40 hover:bg-slate-50 dark:hover:bg-slate-700/20">
                                            <td className="py-1.5 text-slate-400 pr-2">{i + 1}</td>
                                            <td className="py-1.5 font-medium text-slate-700 dark:text-slate-200 pr-2">{c.country}</td>
                                            <td className="py-1.5 text-right text-slate-500 pr-2">{fmt(c.sessions)}</td>
                                            <td className="py-1.5 text-right font-semibold text-slate-700 dark:text-slate-200 pr-2">{fmt(c.events)}</td>
                                            <td className="py-1.5 pr-2">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-16 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                                                        <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <span className="text-indigo-500 w-8 text-right">{pct}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* ── Entry / Exit Pages ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-5">
                    <SectionTitle icon={<FiActivity size={16} />} title="Top Entry Pages" subtitle="Where visitors start their journey" />
                    <div className="space-y-2">
                        {jrLoading ? (
                            [...Array(5)].map((_, i) => <Skeleton key={i} h="h-7" />)
                        ) : (
                            (journey?.entryPages || []).map((p, i) => (
                                <div key={i} className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                                    <span className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate max-w-[70%]">{p.path}</span>
                                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{fmt(p.count)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                <Card className="p-5">
                    <SectionTitle icon={<FiActivity size={16} />} title="Top Exit Pages" subtitle="Where visitors leave the site" />
                    <div className="space-y-2">
                        {jrLoading ? (
                            [...Array(5)].map((_, i) => <Skeleton key={i} h="h-7" />)
                        ) : (
                            (journey?.exitPages || []).map((p, i) => (
                                <div key={i} className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                                    <span className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate max-w-[70%]">{p.path}</span>
                                    <span className="text-xs font-semibold text-rose-500 dark:text-rose-400">{fmt(p.count)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            {/* ── User Sessions / Journey ── */}
            <Card className="p-5">
                <SectionTitle icon={<FiClock size={16} />} title="User Sessions" subtitle="Recent visitor journeys through the site" />
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-slate-400 dark:text-slate-500 uppercase tracking-wide border-b border-slate-100 dark:border-slate-700">
                                <th className="text-left pb-2 font-semibold">Session</th>
                                <th className="text-left pb-2 font-semibold">Journey</th>
                                <th className="text-left pb-2 font-semibold hidden md:table-cell">Browser</th>
                                <th className="text-left pb-2 font-semibold hidden lg:table-cell">Country</th>
                                <th className="text-right pb-2 font-semibold">Duration</th>
                                <th className="text-right pb-2 font-semibold">Events</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jrLoading ? (
                                [...Array(8)].map((_, i) => (
                                    <tr key={i}><td colSpan={6} className="py-1"><Skeleton h="h-7" /></td></tr>
                                ))
                            ) : (
                                (journey?.sessions || []).slice(0, 15).map((s, i) => {
                                    const isExpanded = expandedSession === s.session_id;
                                    return (
                                        <React.Fragment key={i}>
                                            <tr
                                                className="border-b border-slate-50 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-700/20 cursor-pointer transition-colors"
                                                onClick={() => setExpandedSession(isExpanded ? null : s.session_id)}
                                            >
                                                <td className="py-2 pr-2">
                                                    <span className="font-mono text-indigo-500 text-[10px]">
                                                        {s.session_id?.slice(0, 8)}…
                                                    </span>
                                                </td>
                                                <td className="py-2 pr-2 max-w-[200px]">
                                                    <span className="truncate block text-slate-600 dark:text-slate-300">
                                                        {s.journey ? s.journey.split(' → ').slice(0,3).join(' → ') : '—'}
                                                        {s.journey?.split(' → ').length > 3 ? ' …' : ''}
                                                    </span>
                                                </td>
                                                <td className="py-2 pr-2 hidden md:table-cell text-slate-500">{s.browser}</td>
                                                <td className="py-2 pr-2 hidden lg:table-cell text-slate-500">{s.country}</td>
                                                <td className="py-2 text-right text-slate-500">{sessionDuration(s.session_start, s.session_end)}</td>
                                                <td className="py-2 text-right font-semibold text-slate-700 dark:text-slate-200">{fmt(s.total_events)}</td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-indigo-50 dark:bg-indigo-950/30">
                                                    <td colSpan={6} className="px-4 py-3">
                                                        <p className="text-[11px] text-slate-500 mb-1 font-semibold uppercase tracking-wide">Full Journey</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {(s.journey || '').split(' → ').filter(Boolean).map((step, si) => (
                                                                <span key={si} className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-800 rounded text-[11px] font-mono text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                                                                    {si > 0 && <span className="text-slate-300">→</span>}
                                                                    {step}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="flex gap-4 mt-2 text-[11px] text-slate-400">
                                                            <span>{fmtDateTime(s.session_start)}</span>
                                                            <span>Device: {s.device_type}</span>
                                                            <span>OS: {s.os}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* ── Top Click Elements ── */}
            <Card className="p-5">
                <SectionTitle icon={<FiMousePointer size={16} />} title="Top Clicked Elements" subtitle="What visitors interact with most" />
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-slate-400 dark:text-slate-500 uppercase tracking-wide border-b border-slate-100 dark:border-slate-700 pb-2">
                                <th className="text-left pb-2 font-semibold">Element</th>
                                <th className="text-left pb-2 font-semibold">Text</th>
                                <th className="text-left pb-2 font-semibold hidden md:table-cell">Page</th>
                                <th className="text-left pb-2 font-semibold hidden lg:table-cell">Link</th>
                                <th className="text-right pb-2 font-semibold">Clicks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {evLoading ? (
                                [...Array(6)].map((_, i) => <tr key={i}><td colSpan={5} className="py-1"><Skeleton h="h-7" /></td></tr>)
                            ) : (
                                (events?.topElements || []).map((e, i) => (
                                    <tr key={i} className="border-b border-slate-50 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-700/20">
                                        <td className="py-2 pr-2">
                                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-mono text-slate-600 dark:text-slate-300">
                                                {e.element}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-2 text-slate-600 dark:text-slate-300 max-w-[160px] truncate">{e.text || '—'}</td>
                                        <td className="py-2 pr-2 hidden md:table-cell font-mono text-slate-400 max-w-[120px] truncate">{e.path}</td>
                                        <td className="py-2 pr-2 hidden lg:table-cell">
                                            {e.href ? (
                                                <span className="text-indigo-500 truncate max-w-[140px] block">
                                                    {e.href.replace('https://nexspiresolutions.co.in', '')}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="py-2 text-right font-bold text-indigo-600 dark:text-indigo-400">{fmt(e.count)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* ── Recent Events Feed ── */}
            <Card className="p-5">
                <SectionTitle icon={<FiActivity size={16} />} title="Live Events Feed" subtitle="Most recent click interactions" />
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-slate-400 dark:text-slate-500 uppercase tracking-wide border-b border-slate-100 dark:border-slate-700">
                                <th className="text-left pb-2 font-semibold">Type</th>
                                <th className="text-left pb-2 font-semibold">Page</th>
                                <th className="text-left pb-2 font-semibold hidden md:table-cell">Element</th>
                                <th className="text-left pb-2 font-semibold hidden lg:table-cell">Browser</th>
                                <th className="text-left pb-2 font-semibold hidden lg:table-cell">Country</th>
                                <th className="text-right pb-2 font-semibold">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {evLoading ? (
                                [...Array(8)].map((_, i) => <tr key={i}><td colSpan={6} className="py-1"><Skeleton h="h-6" /></td></tr>)
                            ) : (
                                (events?.recentEvents || []).slice(0, 20).map((ev, i) => (
                                    <tr key={i} className="border-b border-slate-50 dark:border-slate-700/30">
                                        <td className="py-1.5 pr-2">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                ev.event_type === 'click'
                                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                                    : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                                            }`}>
                                                {ev.event_type}
                                            </span>
                                        </td>
                                        <td className="py-1.5 pr-2 font-mono text-slate-500 max-w-[100px] truncate">{ev.path}</td>
                                        <td className="py-1.5 pr-2 hidden md:table-cell text-slate-600 dark:text-slate-300 max-w-[140px] truncate">
                                            {ev.metadata?.text || ev.metadata?.element || '—'}
                                        </td>
                                        <td className="py-1.5 pr-2 hidden lg:table-cell text-slate-400">{ev.browser || '—'}</td>
                                        <td className="py-1.5 pr-2 hidden lg:table-cell text-slate-400">{ev.country || '—'}</td>
                                        <td className="py-1.5 text-right text-slate-400">{fmtDateTime(ev.created_at)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* ── AI Insights ── */}
            <Card className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <SectionTitle
                        icon={<FiZap size={16} />}
                        title="AI Journey Intelligence"
                        subtitle="Let AI analyze your visitor data and recommend lead-capturing improvements"
                    />
                    <button
                        onClick={handleAIAnalysis}
                        disabled={aiLoading || ovLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-500/25"
                    >
                        {aiLoading ? (
                            <>
                                <FiCpu size={15} className="animate-pulse" />
                                Analysing…
                            </>
                        ) : (
                            <>
                                <FiZap size={15} />
                                Analyse My Site
                            </>
                        )}
                    </button>
                </div>

                {!aiInsight && !aiLoading && !aiError && (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                        <FiZap size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Click <strong>Analyse My Site</strong> to get AI-powered recommendations</p>
                        <p className="text-xs mt-1">Uses your configured AI provider (OpenAI, Gemini, Groq, or Grok)</p>
                    </div>
                )}

                {aiLoading && (
                    <div className="space-y-3 py-4">
                        <div className="flex items-center gap-3 text-indigo-600 mb-4">
                            <FiCpu size={18} className="animate-spin" />
                            <span className="text-sm font-medium">AI is analysing your visitor data…</span>
                        </div>
                        <Skeleton h="h-4" w="w-3/4" />
                        <Skeleton h="h-4" />
                        <Skeleton h="h-4" w="w-5/6" />
                        <Skeleton h="h-4" w="w-2/3" />
                        <Skeleton h="h-4" />
                        <Skeleton h="h-4" w="w-4/5" />
                    </div>
                )}

                {aiError && (
                    <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 rounded-xl p-4 text-sm text-rose-700 dark:text-rose-400">
                        <strong>Error:</strong> {aiError}
                    </div>
                )}

                {aiInsight && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">AI Analysis Complete</span>
                            <span className="text-xs text-slate-400">· {RANGES.find(r => r.value === range)?.label || range} data</span>
                        </div>
                        <div className="prose-sm max-w-none">
                            {renderInsight(aiInsight)}
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                            <button
                                onClick={handleAIAnalysis}
                                className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                            >
                                Regenerate
                            </button>
                        </div>
                    </div>
                )}
            </Card>

            {/* ── Click Heatmap ── */}
            <Card className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <SectionTitle
                        icon={<FiMonitor size={16} />}
                        title="Click Heatmap"
                        subtitle="Visualise where visitors click on each page"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Page selector */}
                        <select
                            value={heatmapPage}
                            onChange={e => setHeatmapPage(e.target.value)}
                            className="text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {!heatmapData?.availablePages?.length && (
                                <option value="">Loading pages…</option>
                            )}
                            {(heatmapData?.availablePages || []).map(p => (
                                <option key={p.path} value={p.path}>
                                    {p.path} ({fmt(p.clicks)} clicks)
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => refetchHm()}
                            className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 hover:text-indigo-600"
                            title="Refresh heatmap"
                        >
                            <FiRefreshCw size={13} className={hmLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Stats row */}
                {heatmapData?.totalClicks > 0 && (
                    <div className="flex gap-4 mb-3 text-xs text-slate-500 dark:text-slate-400">
                        <span><strong className="text-slate-700 dark:text-slate-200">{fmt(heatmapData.totalClicks)}</strong> total clicks</span>
                        <span><strong className="text-slate-700 dark:text-slate-200">{heatmapData.points?.length}</strong> unique positions</span>
                        <span>Reference viewport: <strong className="text-slate-700 dark:text-slate-200">{heatmapData.viewportWidth}×{heatmapData.viewportHeight}</strong></span>
                    </div>
                )}

                {/* Canvas */}
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    {hmLoading && (
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center z-10 rounded-xl">
                            <div className="flex items-center gap-2 text-white text-sm">
                                <FiRefreshCw size={16} className="animate-spin" />
                                Loading heatmap…
                            </div>
                        </div>
                    )}
                    <HeatmapCanvas data={heatmapPage ? heatmapData : null} />
                </div>

                {/* Legend note */}
                <p className="text-[10px] text-slate-400 mt-2">
                    Coordinates are viewport-relative (normalised to the most common screen size for this page).
                    Red/orange = high click frequency · Blue/purple = low frequency.
                </p>

                {/* Top click list */}
                {heatmapData?.points?.length > 0 && (
                    <div className="mt-4">
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Top Hot Spots</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                            {heatmapData.points.slice(0, 10).map((pt, i) => (
                                <div key={i} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 text-xs border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-mono text-[10px] text-slate-400">{pt.x},{pt.y}</span>
                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{fmt(pt.count)}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 truncate">{pt.text || pt.element}</p>
                                    {pt.href && (
                                        <p className="text-indigo-400 truncate text-[10px]">{pt.href.replace('https://nexspiresolutions.co.in', '')}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>

        </div>
    );
}
