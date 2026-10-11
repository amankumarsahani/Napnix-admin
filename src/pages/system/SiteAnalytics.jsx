import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature as topoFeature } from 'topojson-client';
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
import { useChartTheme } from '../../components/charts/useChartTheme';
import { Button, Skeleton as UiSkeleton, StatCard, cx } from '../../components/ui';

// ── Constants ────────────────────────────────────────────────────────────────
const RANGES = [
    { label: '7D',  value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
    { label: 'All', value: 'all' },
];

// Traffic source -> fixed series slot (colour follows the source, not its rank)
const SOURCE_SLOT = { Direct: 0, 'Organic Search': 2, 'Social Media': 3, Referral: 1, Internal: 4 };

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

// ── Subcomponents (thin wrappers over the UI kit) ────────────────────────────
const Card = ({ children, className = '' }) => (
    <section className={cx('rounded-md border border-border bg-surface', className)}>{children}</section>
);

const SectionTitle = ({ icon, title, subtitle }) => (
    <div className="flex items-center gap-3 mb-4">
        <span aria-hidden="true" className="size-8 rounded-sm bg-accent-soft grid place-items-center text-accent">{icon}</span>
        <div>
            <h2 className="text-sm font-semibold text-fg">{title}</h2>
            {subtitle && <p className="text-xs text-fg-subtle">{subtitle}</p>}
        </div>
    </div>
);

const Skeleton = ({ h = 'h-6', w = 'w-full' }) => <UiSkeleton className={`${h} ${w}`} />;

const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-sm border border-border bg-surface px-3 py-2 text-xs text-fg shadow-pop">
            <p className="font-semibold mb-1">{label}</p>
            {payload.map((e, i) => (
                <p key={i} className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="size-2 rounded-full inline-block" style={{ background: e.color }} />
                    {e.name}: <span className="font-mono tabular-nums font-semibold ml-1">{fmt(e.value)}</span>
                </p>
            ))}
        </div>
    );
};

// KPI tile: the UI kit StatCard (colour-coded icon chips dropped; the label carries meaning)
const KpiCard = ({ icon, label, value, sub, loading }) => (
    loading
        ? <UiSkeleton className="h-[104px] rounded-md" />
        : <StatCard label={label} value={value} hint={sub} icon={icon} />
);

// Share bars: one measure per row, so one colour (the accent)
const MiniPie = ({ data, loading, title }) => {
    const total = data?.reduce((s, d) => s + Number(d.count), 0) || 0;
    return (
        <div>
            <p className="text-xs font-medium text-fg-muted mb-3">{title}</p>
            {loading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} h="h-5" />)}</div>
            ) : (
                <div className="space-y-2">
                    {(data || []).slice(0, 6).map((d, i) => {
                        const pct = total > 0 ? Math.round((Number(d.count) / total) * 100) : 0;
                        return (
                            <div key={i}>
                                <div className="flex items-center justify-between text-xs mb-0.5">
                                    <span className="text-fg-muted truncate max-w-[140px]">{d.label}</span>
                                    <span className="font-mono tabular-nums text-fg">{pct}%</span>
                                </div>
                                <div className="w-full bg-surface-3 rounded-full h-1.5">
                                    <div className="h-1.5 rounded-full bg-accent" style={{ width: `${pct}%` }} />
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
            return <h3 key={i} className="text-sm font-bold text-brand-700 dark:text-brand-300 mt-4 mb-1 first:mt-0">{line.slice(3)}</h3>;
        }
        if (line.startsWith('# ')) {
            return <h2 key={i} className="text-base font-bold text-fg mt-3 mb-1">{line.slice(2)}</h2>;
        }
        if (/^\d+\.\s/.test(line)) {
            return <p key={i} className="text-sm text-fg ml-3 mb-1 leading-relaxed">{line}</p>;
        }
        if (line.startsWith('- ')) {
            return (
                <p key={i} className="text-sm text-fg-muted flex gap-2 ml-2 mb-0.5 leading-relaxed">
                    <span className="text-brand-400 mt-0.5">•</span>
                    <span>{line.slice(2)}</span>
                </p>
            );
        }
        if (line.trim() === '---') return <hr key={i} className="border-border my-3" />;
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i} className="text-sm text-fg-muted leading-relaxed">{line}</p>;
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
            className="w-full rounded-md"
            style={{ background: '#080c14' }}
        />
    );
}

// ── World Map Heatmap (canvas + d3-geo + topojson) ────────────────────────────
// ISO 3166-1 numeric → alpha-2
const NUM_TO_A2 = {
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
    '634':'QA','642':'RO','643':'RU','646':'RW','682':'SA','686':'SN',
    '694':'SL','703':'SK','705':'SI','706':'SO','710':'ZA','716':'ZW',
    '724':'ES','729':'SD','740':'SR','752':'SE','756':'CH','760':'SY',
    '762':'TJ','764':'TH','768':'TG','788':'TN','792':'TR',
    '800':'UG','804':'UA','784':'AE','826':'GB','834':'TZ','840':'US',
    '858':'UY','860':'UZ','862':'VE','704':'VN','887':'YE','894':'ZM',
    '275':'PS','882':'WS','780':'TT','050':'BD','076':'BR',
};

const TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
let _topoCache = null;
const getTopo = () => {
    if (!_topoCache) _topoCache = fetch(TOPO_URL).then(r => r.json());
    return _topoCache;
};

// Sequential blue ramp (dataviz reference steps); light: low->high = light->dark, dark: the reverse
const MAP_RAMP = {
    light: { none: '#e6e9ef', stroke: '#ffffff', steps: ['#cde2fb', '#9ec5f4', '#5598e7', '#256abf', '#104281'] },
    dark: { none: '#232834', stroke: '#13161d', steps: ['#184f95', '#256abf', '#3987e5', '#6da7ec', '#b7d3f6'] },
};
const MAP_LEGEND = ['Low', '', 'Mid', '', 'Peak'];

function mapFillColor(t, ramp) {
    if (t <= 0) return ramp.none;
    if (t < 0.08) return ramp.steps[0];
    if (t < 0.25) return ramp.steps[1];
    if (t < 0.55) return ramp.steps[2];
    if (t < 0.80) return ramp.steps[3];
    return ramp.steps[4];
}

function WorldMapHeatmap({ data, loading }) {
    const chart = useChartTheme();
    const ramp = MAP_RAMP[chart.theme === 'dark' ? 'dark' : 'light'];
    const mainRef  = useRef(null);
    const pickRef  = useRef(null);
    const featsRef = useRef([]);
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

    useEffect(() => {
        const canvas = mainRef.current;
        const pick   = pickRef.current;
        if (!canvas || !pick) return;

        const W = canvas.width;
        const H = canvas.height;
        const ctx  = canvas.getContext('2d');
        const pCtx = pick.getContext('2d');

        ctx.fillStyle = chart.surface;
        ctx.fillRect(0, 0, W, H);

        let cancelled = false;

        getTopo().then(topology => {
            if (cancelled) return;
            const countries = topoFeature(topology, topology.objects.countries);

            const proj = geoNaturalEarth1()
                .scale(W / 5.8)
                .translate([W / 2, H / 2 + 24]);

            const pathMain = geoPath(proj, ctx);
            const pathPick = geoPath(proj, pCtx);

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = chart.surface;
            ctx.fillRect(0, 0, W, H);
            pCtx.clearRect(0, 0, W, H);

            const feats = [];

            countries.features.forEach((geo, i) => {
                const a2  = NUM_TO_A2[String(geo.id)];
                const row = a2 ? byCode[a2] : null;
                const t   = row ? row.events / maxEvents : 0;

                // Main canvas — actual country shape
                ctx.beginPath();
                pathMain(geo);
                ctx.fillStyle = mapFillColor(t, ramp);
                ctx.fill();
                ctx.strokeStyle = ramp.stroke;
                ctx.lineWidth = 0.4;
                ctx.stroke();

                // Pick buffer — unique color per country that has data
                if (row) {
                    const idx = i + 1;
                    pCtx.beginPath();
                    pathPick(geo);
                    pCtx.fillStyle = `rgb(${(idx >> 16) & 255},${(idx >> 8) & 255},${idx & 255})`;
                    pCtx.fill();
                    feats.push({ idx, a2, events: row.events, sessions: row.sessions });
                }
            });

            featsRef.current = feats;
        }).catch(() => {
            ctx.fillStyle = chart.subtle;
            ctx.font = '13px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('World map unavailable — check network', W / 2, H / 2);
        });

        return () => { cancelled = true; };
    }, [data, loading, byCode, maxEvents, chart.surface, ramp]);

    const handleMouseMove = useCallback((e) => {
        const main = mainRef.current;
        const pick = pickRef.current;
        if (!main || !pick || !featsRef.current.length) { setTooltip(null); return; }

        const rect   = main.getBoundingClientRect();
        const scaleX = pick.width  / rect.width;
        const scaleY = pick.height / rect.height;
        const px = Math.round((e.clientX - rect.left) * scaleX);
        const py = Math.round((e.clientY - rect.top)  * scaleY);

        const px4 = pick.getContext('2d').getImageData(px, py, 1, 1).data;
        const idx  = (px4[0] << 16) | (px4[1] << 8) | px4[2];
        if (idx === 0) { setTooltip(null); return; }

        const feat = featsRef.current.find(f => f.idx === idx);
        setTooltip(feat ? { ...feat, mx: e.clientX, my: e.clientY } : null);
    }, []);

    if (loading) return <UiSkeleton className="h-72 rounded-md" />;

    return (
        <div
            className="relative rounded-md overflow-hidden bg-surface border border-border"
            onMouseLeave={() => setTooltip(null)}
        >
            <canvas
                ref={mainRef}
                width={960}
                height={480}
                className="w-full block"
                onMouseMove={handleMouseMove}
            />
            <canvas ref={pickRef} width={960} height={480} style={{ display: 'none' }} />

            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-sm border border-border bg-surface/90 px-2.5 py-1.5" aria-label="Map legend: fewer to more events">
                <span className="flex items-center gap-1 text-2xs text-fg-subtle"><span className="size-2 rounded-sm" style={{ background: ramp.none }} />None</span>
                {ramp.steps.map((c, i) => (
                    <span key={c} className="flex items-center gap-1 text-2xs text-fg-subtle">
                        <span className="size-2 rounded-sm" style={{ background: c }} />{MAP_LEGEND[i]}
                    </span>
                ))}
            </div>

            {tooltip && (
                <div
                    className="fixed z-50 pointer-events-none rounded-sm border border-border bg-surface px-3 py-2 text-xs text-fg shadow-pop"
                    style={{ left: tooltip.mx + 14, top: tooltip.my - 52 }}
                >
                    <p className="font-semibold">{tooltip.a2}</p>
                    <p className="text-fg-muted mt-0.5">{fmt(tooltip.events)} events · {fmt(tooltip.sessions)} sessions</p>
                </div>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SiteAnalytics() {
    const chart = useChartTheme();
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

    const { data: overview,  isLoading: ovLoading,  refetch: refetchOv, isError: ovErr }  = useQuery({ ...qOpts('getOverview'), queryFn: () => siteAnalyticsAPI.getOverview(range) });
    const { data: timeSeries, isLoading: tsLoading, refetch: refetchTs, isError: tsErr }   = useQuery({ queryKey: ['getTimeSeries', range],  queryFn: () => siteAnalyticsAPI.getTimeSeries(range) });
    const { data: pages,      isLoading: pgLoading, refetch: refetchPg, isError: pgErr }   = useQuery({ queryKey: ['getPages', range],       queryFn: () => siteAnalyticsAPI.getPages(range) });
    const { data: sources,    isLoading: srcLoading, refetch: refetchSrc, isError: srcErr } = useQuery({ queryKey: ['getTrafficSources', range], queryFn: () => siteAnalyticsAPI.getTrafficSources(range) });
    const { data: devices,    isLoading: devLoading, refetch: refetchDev, isError: devErr } = useQuery({ queryKey: ['getDevices', range],     queryFn: () => siteAnalyticsAPI.getDevices(range) });
    const { data: geography,  isLoading: geoLoading, refetch: refetchGeo, isError: geoErr } = useQuery({ queryKey: ['getGeography', range],  queryFn: () => siteAnalyticsAPI.getGeography(range) });
    const { data: journey,    isLoading: jrLoading, refetch: refetchJr, isError: jrErr }   = useQuery({ queryKey: ['getJourney', range],    queryFn: () => siteAnalyticsAPI.getJourney(range) });
    const { data: events,     isLoading: evLoading, refetch: refetchEv, isError: evErr }   = useQuery({ queryKey: ['getEvents', range],     queryFn: () => siteAnalyticsAPI.getEvents(range) });
    const { data: heatmapData, isLoading: hmLoading, refetch: refetchHm, isError: hmErr }  = useQuery({
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

    useEffect(() => {
        setAiInsight(null);
        setAiError(null);
    }, [range]);

    const failedSections = [['Overview', ovErr], ['Traffic over time', tsErr], ['Top pages', pgErr], ['Traffic sources', srcErr], ['Devices', devErr], ['Geography', geoErr], ['Journeys', jrErr], ['Events', evErr], ['Click heatmap', hmErr]].filter(([, e]) => e).map(([name]) => name);
    const handleRefresh = useCallback(() => Promise.all([
        refetchOv(),
        refetchTs(),
        refetchPg(),
        refetchSrc(),
        refetchDev(),
        refetchGeo(),
        refetchJr(),
        refetchEv(),
        refetchHm(),
    ]), [refetchDev, refetchEv, refetchGeo, refetchHm, refetchJr, refetchOv, refetchPg, refetchSrc, refetchTs]);

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
    const nexmailPage  = (pages || []).find((p) => p.path === '/napmail' || p.path?.startsWith('/napmail?'));
    const nexmailEntry = (journey?.entryPages || []).find((p) => p.path?.startsWith('/napmail'));
    const nexmailExit  = (journey?.exitPages || []).find((p) => p.path?.startsWith('/napmail'));
    const nexmailClicks = (events?.topElements || [])
        .filter((item) => item.path?.startsWith('/napmail'))
        .sort((a, b) => b.count - a.count);
    const anyLoading = ovLoading || tsLoading || pgLoading || srcLoading || devLoading || geoLoading || jrLoading || evLoading || hmLoading;

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            {failedSections.length > 0 && (
                <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-sm">
                    <span className="text-fg">Couldn't load: <strong>{failedSections.join(', ')}</strong>. Other sections are up to date.</span>
                    <Button size="sm" onClick={handleRefresh}>Retry</Button>
                </div>
            )}

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
                        <FiBarChart2 size={24} className="text-brand-600" />
                        Site Analytics
                    </h1>
                    <p className="text-sm text-fg-muted mt-0.5">
                        Visitor intelligence · napnix.in
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Date range */}
                    <div className="flex bg-surface border border-border rounded-md p-1 gap-1">
                        {RANGES.map(r => (
                            <button
                                key={r.value}
                                onClick={() => setRange(r.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    range === r.value
                                        ? 'bg-brand-600 text-white shadow-sm'
                                        : 'text-fg-muted hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="p-2 bg-surface border border-border rounded-md text-fg-muted hover:text-brand-600 transition-colors"
                        title="Refresh"
                    >
                        <FiRefreshCw size={16} className={anyLoading ? 'animate-spin' : ''} />
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
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div>
                        <SectionTitle icon={<FiZap size={16} />} title="NapMail Landing Snapshot" subtitle="Focused analysis for the public /napmail route" />
                        <p className="text-xs text-fg-muted max-w-2xl">
                            This block follows the selected date range and gives a quick read on how the NapMail landing page is performing inside the current analytics window.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-surface-2 border border-border rounded-md px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">Views</p>
                            <p className="mt-1 text-xl font-bold text-fg">{fmt(nexmailPage?.views)}</p>
                        </div>
                        <div className="bg-surface-2 border border-border rounded-md px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">Sessions</p>
                            <p className="mt-1 text-xl font-bold text-fg">{fmt(nexmailPage?.unique_sessions)}</p>
                        </div>
                        <div className="bg-surface-2 border border-border rounded-md px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">Entries</p>
                            <p className="mt-1 text-xl font-bold text-fg">{fmt(nexmailEntry?.count)}</p>
                        </div>
                        <div className="bg-surface-2 border border-border rounded-md px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">Exits</p>
                            <p className="mt-1 text-xl font-bold text-fg">{fmt(nexmailExit?.count)}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
                    <div className="bg-surface border border-border rounded-md p-4">
                        <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">Top CTA interaction</p>
                        {nexmailClicks[0] ? (
                            <>
                                <p className="text-sm font-bold text-fg">{nexmailClicks[0].text || nexmailClicks[0].element}</p>
                                <p className="text-xs text-fg-muted mt-1">{fmt(nexmailClicks[0].count)} clicks in the selected range</p>
                            </>
                        ) : (
                            <p className="text-sm text-fg-muted">No recorded click interactions yet for /napmail in this range.</p>
                        )}
                    </div>
                    <div className="bg-surface border border-border rounded-md p-4">
                        <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">Entry signal</p>
                        <p className="text-sm text-fg">
                            {nexmailEntry?.count
                                ? `/napmail started ${fmt(nexmailEntry.count)} visitor journeys in this window.`
                                : 'No direct entry sessions to /napmail are recorded in this window yet.'}
                        </p>
                    </div>
                    <div className="bg-surface border border-border rounded-md p-4">
                        <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">Exit signal</p>
                        <p className="text-sm text-fg">
                            {nexmailExit?.count
                                ? `/napmail was the final viewed page in ${fmt(nexmailExit.count)} sessions.`
                                : 'No exit-session concentration on /napmail is visible in this window yet.'}
                        </p>
                    </div>
                </div>
            </Card>

            <Card className="p-5">
                <SectionTitle icon={<FiTrendingUp size={16} />} title="Traffic Over Time" subtitle="Daily page views and click events" />
                {tsLoading ? (
                    <Skeleton h="h-56" />
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={timeSeries || []} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                            <defs>
                                <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor={chart.series[0]} stopOpacity={0.25} />
                                    <stop offset="95%" stopColor={chart.series[0]} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gClicks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor={chart.series[2]} stopOpacity={0.25} />
                                    <stop offset="95%" stopColor={chart.series[2]} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke={chart.grid} />
                            <XAxis dataKey="date" tickFormatter={fmtDate} tick={chart.axisTick} tickLine={false} axisLine={false} />
                            <YAxis tick={chart.axisTick} tickLine={false} axisLine={false} />
                            <Tooltip content={<ChartTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Area type="monotone" dataKey="views"  name="Page Views"   stroke={chart.series[0]} fill="url(#gViews)"  strokeWidth={2} dot={false} />
                            <Area type="monotone" dataKey="clicks" name="Click Events" stroke={chart.series[2]} fill="url(#gClicks)" strokeWidth={2} dot={false} />
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
                                            <span className="font-mono text-fg-muted truncate max-w-[60%]">{p.path || '/'}</span>
                                            <div className="flex items-center gap-3 text-fg-muted">
                                                <span><span className="font-semibold text-fg">{fmt(p.views)}</span> views</span>
                                                <span className="hidden sm:inline">{fmt(p.unique_sessions)} sessions</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-surface-3 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full transition-all"
                                                style={{ width: `${pct}%`, background: chart.accent }}
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
                                            <Cell key={i} fill={SOURCE_SLOT[s.source] != null ? chart.series[SOURCE_SLOT[s.source]] : chart.series[5]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v) => [fmt(v), 'Events']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-1.5 mt-2">
                                {(sources || []).map((s, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: SOURCE_SLOT[s.source] != null ? chart.series[SOURCE_SLOT[s.source]] : chart.series[5] }} />
                                            <span className="text-fg-muted">{s.source}</span>
                                        </div>
                                        <div className="text-fg-muted">
                                            <span className="font-semibold text-fg">{fmt(s.count)}</span>
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
                            <tr className="text-fg-subtle uppercase tracking-wide border-b border-border">
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
                                        <tr key={i} className="border-b border-slate-50 dark:border-slate-700/40 hover:bg-surface-2">
                                            <td className="py-1.5 text-fg-subtle pr-2">{i + 1}</td>
                                            <td className="py-1.5 font-medium text-fg pr-2">{c.country}</td>
                                            <td className="py-1.5 text-right text-fg-muted pr-2">{fmt(c.sessions)}</td>
                                            <td className="py-1.5 text-right font-semibold text-fg pr-2">{fmt(c.events)}</td>
                                            <td className="py-1.5 pr-2">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-16 bg-surface-3 rounded-full h-1.5">
                                                        <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <span className="text-brand-500 w-8 text-right">{pct}%</span>
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
                                    <span className="text-xs font-mono text-fg-muted truncate max-w-[70%]">{p.path}</span>
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
                                    <span className="text-xs font-mono text-fg-muted truncate max-w-[70%]">{p.path}</span>
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
                            <tr className="text-fg-subtle uppercase tracking-wide border-b border-border">
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
                                                className="border-b border-slate-50 dark:border-slate-700/30 hover:bg-surface-2 cursor-pointer transition-colors"
                                                onClick={() => setExpandedSession(isExpanded ? null : s.session_id)}
                                            >
                                                <td className="py-2 pr-2">
                                                    <span className="font-mono text-brand-500 text-[10px]">
                                                        {s.session_id?.slice(0, 8)}…
                                                    </span>
                                                </td>
                                                <td className="py-2 pr-2 max-w-[200px]">
                                                    <span className="truncate block text-fg-muted">
                                                        {s.journey ? s.journey.split(' → ').slice(0,3).join(' → ') : '—'}
                                                        {s.journey?.split(' → ').length > 3 ? ' …' : ''}
                                                    </span>
                                                </td>
                                                <td className="py-2 pr-2 hidden md:table-cell text-fg-muted">{s.browser}</td>
                                                <td className="py-2 pr-2 hidden lg:table-cell text-fg-muted">{s.country}</td>
                                                <td className="py-2 text-right text-fg-muted">{sessionDuration(s.session_start, s.session_end)}</td>
                                                <td className="py-2 text-right font-semibold text-fg">{fmt(s.total_events)}</td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-brand-50 dark:bg-brand-950/30">
                                                    <td colSpan={6} className="px-4 py-3">
                                                        <p className="text-[11px] text-fg-muted mb-1 font-semibold uppercase tracking-wide">Full Journey</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {(s.journey || '').split(' → ').filter(Boolean).map((step, si) => (
                                                                <span key={si} className="px-2 py-0.5 bg-surface border border-brand-100 dark:border-brand-800 rounded text-[11px] font-mono text-brand-700 dark:text-brand-300 flex items-center gap-1">
                                                                    {si > 0 && <span className="text-slate-300">→</span>}
                                                                    {step}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="flex gap-4 mt-2 text-[11px] text-fg-subtle">
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
                            <tr className="text-fg-subtle uppercase tracking-wide border-b border-border pb-2">
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
                                    <tr key={i} className="border-b border-slate-50 dark:border-slate-700/30 hover:bg-surface-2">
                                        <td className="py-2 pr-2">
                                            <span className="px-1.5 py-0.5 bg-surface-3 rounded text-[10px] font-mono text-fg-muted">
                                                {e.element}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-2 text-fg-muted max-w-[160px] truncate">{e.text || '—'}</td>
                                        <td className="py-2 pr-2 hidden md:table-cell font-mono text-fg-subtle max-w-[120px] truncate">{e.path}</td>
                                        <td className="py-2 pr-2 hidden lg:table-cell">
                                            {e.href ? (
                                                <span className="text-brand-500 truncate max-w-[140px] block">
                                                    {e.href.replace('https://napnix.in', '')}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="py-2 text-right font-bold text-brand-600 dark:text-brand-400">{fmt(e.count)}</td>
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
                            <tr className="text-fg-subtle uppercase tracking-wide border-b border-border">
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
                                                    : 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-400'
                                            }`}>
                                                {ev.event_type}
                                            </span>
                                        </td>
                                        <td className="py-1.5 pr-2 font-mono text-fg-muted max-w-[100px] truncate">{ev.path}</td>
                                        <td className="py-1.5 pr-2 hidden md:table-cell text-fg-muted max-w-[140px] truncate">
                                            {ev.metadata?.text || ev.metadata?.element || '—'}
                                        </td>
                                        <td className="py-1.5 pr-2 hidden lg:table-cell text-fg-subtle">{ev.browser || '—'}</td>
                                        <td className="py-1.5 pr-2 hidden lg:table-cell text-fg-subtle">{ev.country || '—'}</td>
                                        <td className="py-1.5 text-right text-fg-subtle">{fmtDateTime(ev.created_at)}</td>
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
                        className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-md transition-colors shadow-sm shadow-brand-500/25"
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
                    <div className="text-center py-12 text-fg-subtle">
                        <FiZap size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Click <strong>Analyse My Site</strong> to get AI-powered recommendations</p>
                        <p className="text-xs mt-1">Uses your configured AI provider (OpenAI, Gemini, Groq, or Grok)</p>
                    </div>
                )}

                {aiLoading && (
                    <div className="space-y-3 py-4">
                        <div className="flex items-center gap-3 text-brand-600 mb-4">
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
                    <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 rounded-md p-4 text-sm text-rose-700 dark:text-rose-400">
                        <strong>Error:</strong> {aiError}
                    </div>
                )}

                {aiInsight && (
                    <div className="bg-surface-2 rounded-md p-5 border border-border">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wide">AI Analysis Complete</span>
                            <span className="text-xs text-fg-subtle">· {RANGES.find(r => r.value === range)?.label || range} data</span>
                        </div>
                        <div className="prose-sm max-w-none">
                            {renderInsight(aiInsight)}
                        </div>
                        <div className="mt-4 pt-3 border-t border-border flex gap-2">
                            <button
                                onClick={handleAIAnalysis}
                                className="text-xs text-brand-500 hover:text-brand-700 font-medium"
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
                            className="text-xs bg-surface border border-border rounded-lg px-3 py-1.5 text-fg font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                            className="p-1.5 bg-surface-3 rounded-lg text-fg-muted hover:text-brand-600"
                            title="Refresh heatmap"
                        >
                            <FiRefreshCw size={13} className={hmLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Stats row */}
                {heatmapData?.totalClicks > 0 && (
                    <div className="flex gap-4 mb-3 text-xs text-fg-muted">
                        <span><strong className="text-fg">{fmt(heatmapData.totalClicks)}</strong> total clicks</span>
                        <span><strong className="text-fg">{heatmapData.points?.length}</strong> unique positions</span>
                        <span>Reference viewport: <strong className="text-fg">{heatmapData.viewportWidth}×{heatmapData.viewportHeight}</strong></span>
                    </div>
                )}

                {/* Canvas */}
                <div className="relative rounded-md overflow-hidden border border-border">
                    {hmLoading && (
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center z-10 rounded-md">
                            <div className="flex items-center gap-2 text-white text-sm">
                                <FiRefreshCw size={16} className="animate-spin" />
                                Loading heatmap…
                            </div>
                        </div>
                    )}
                    <HeatmapCanvas data={heatmapPage ? heatmapData : null} />
                </div>

                {/* Legend note */}
                <p className="text-[10px] text-fg-subtle mt-2">
                    Coordinates are viewport-relative (normalised to the most common screen size for this page).
                    Red/orange = high click frequency · Blue/purple = low frequency.
                </p>

                {/* Top click list */}
                {heatmapData?.points?.length > 0 && (
                    <div className="mt-4">
                        <p className="text-[11px] font-semibold text-fg-muted uppercase tracking-wide mb-2">Top Hot Spots</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                            {heatmapData.points.slice(0, 10).map((pt, i) => (
                                <div key={i} className="bg-surface-2 rounded-lg p-2 text-xs border border-border">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-mono text-[10px] text-fg-subtle">{pt.x},{pt.y}</span>
                                        <span className="font-bold text-brand-600 dark:text-brand-400">{fmt(pt.count)}</span>
                                    </div>
                                    <p className="text-fg-muted truncate">{pt.text || pt.element}</p>
                                    {pt.href && (
                                        <p className="text-brand-400 truncate text-[10px]">{pt.href.replace('https://napnix.in', '')}</p>
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
