import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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

// ── World Map Heatmap (pure SVG, no external library) ────────────────────────
// Country centroids: [longitude, latitude]
const CENTROIDS = {
    IN:[78.96,20.59],  US:[-95.71,37.09], GB:[-3.44,55.38],  AU:[133.78,-25.27],
    DE:[10.45,51.17],  FR:[2.21,46.23],   CA:[-96.82,56.13],  BR:[-51.93,-14.24],
    CN:[104.20,35.86], JP:[138.25,36.20],  RU:[105.32,61.52],  SG:[103.82,1.35],
    AE:[53.85,23.42],  PK:[69.35,30.38],  BD:[90.36,23.68],   ID:[113.92,-0.79],
    NG:[8.68,9.08],    ZA:[25.08,-29.00],  EG:[30.80,26.82],   SA:[45.08,23.89],
    MX:[-102.55,23.63],PH:[121.77,12.88], TH:[100.99,15.87],  VN:[108.28,14.06],
    TR:[35.24,38.96],  IT:[12.57,41.87],   ES:[-3.75,40.46],   PL:[19.14,51.92],
    NL:[5.29,52.13],   SE:[18.64,60.13],   NO:[8.47,60.47],    DK:[9.50,56.26],
    FI:[25.75,61.92],  CH:[8.23,46.82],    AT:[14.55,47.52],   BE:[4.47,50.50],
    PT:[-8.22,39.40],  GR:[21.82,39.07],   RO:[24.97,45.94],   CZ:[15.47,49.82],
    HU:[19.50,47.16],  UA:[31.17,48.38],   NZ:[172.49,-40.90], AR:[-63.62,-38.42],
    CL:[-71.54,-35.68],CO:[-74.30,4.10],   PE:[-75.02,-9.19],  MY:[109.70,4.21],
    LK:[80.77,7.87],   NP:[84.12,28.39],   KE:[37.91,0.02],    GH:[-1.02,7.95],
    ET:[40.49,9.15],   TZ:[34.89,-6.37],   KR:[127.77,35.91],  IQ:[43.68,33.22],
    IR:[53.69,32.42],  IL:[34.85,31.05],   MA:[-7.09,31.79],   TN:[9.54,33.89],
    DZ:[3.00,28.03],   KW:[47.48,29.31],   QA:[51.18,25.35],   OM:[57.54,21.51],
    BH:[50.64,26.15],  JO:[36.24,31.24],   LB:[35.86,33.85],   SY:[38.30,34.80],
    CU:[-79.52,21.52], DO:[-70.16,18.74],  EC:[-78.18,-1.83],  BO:[-64.62,-16.29],
    VE:[-66.59,6.42],  UY:[-56.02,-32.52], IE:[-8.24,53.41],   SK:[19.70,48.67],
    HR:[15.20,45.10],  RS:[21.01,44.02],   BG:[25.49,42.73],   LT:[23.88,55.17],
    LV:[24.60,56.88],  EE:[25.01,58.60],   IS:[-18.94,64.96],  MK:[21.74,41.61],
    MM:[95.96,21.91],  KH:[104.99,12.56],  LA:[102.50,17.97],  MN:[103.85,46.86],
    AF:[67.71,33.94],  UZ:[64.59,41.38],   KZ:[66.92,48.02],   GE:[43.36,42.32],
    AM:[44.56,40.07],  AZ:[47.58,40.14],   BY:[28.04,53.71],   MD:[28.37,47.41],
    AL:[20.17,41.15],  BA:[17.68,43.92],   MK:[21.74,41.61],   ME:[19.37,42.71],
    XK:[20.90,42.60],  TW:[120.96,23.70],  HK:[114.11,22.40],  MO:[113.55,22.20],
    MU:[57.55,-20.35], LY:[17.23,26.33],   SD:[29.98,12.86],   SS:[31.30,6.88],
    CM:[12.35,5.69],   SN:[-14.45,14.50],  CI:[-5.54,7.54],    TG:[0.82,8.62],
    BJ:[2.32,9.31],    CD:[24.68,-2.88],   AO:[17.87,-11.20],  ZM:[27.85,-13.13],
    ZW:[29.15,-19.02], MZ:[35.53,-18.67],  MG:[46.87,-18.77],  RW:[29.87,-1.94],
    UG:[32.29,1.37],   TZ:[34.89,-6.37],   BW:[24.68,-22.33],  NA:[18.49,-22.96],
};

function worldBubbleColor(t) {
    if (t <= 0)    return null;               // no bubble
    if (t < 0.15)  return '#1d4ed8';          // low – blue
    if (t < 0.40)  return '#7c3aed';          // medium – purple
    if (t < 0.70)  return '#ea580c';          // high – orange
    return '#dc2626';                          // peak – red
}

const MAP_W = 900, MAP_H = 430;
function projectEq(lon, lat) {
    // Equirectangular: simple and dependency-free
    return [
        ((lon + 180) / 360) * MAP_W,
        ((90 - lat)  / 180) * MAP_H,
    ];
}

function WorldMapHeatmap({ data, loading }) {
    const [tooltip, setTooltip] = useState(null);

    const maxEvents = useMemo(
        () => Math.max(...(data?.countries || []).map(c => c.events), 1),
        [data]
    );

    const points = useMemo(() => {
        return (data?.countries || [])
            .filter(c => CENTROIDS[c.country])
            .map(c => {
                const t = c.events / maxEvents;
                const [x, y] = projectEq(...CENTROIDS[c.country]);
                const r = 5 + t * 32;
                return { ...c, x, y, r, t, color: worldBubbleColor(t) };
            })
            .filter(p => p.color);
    }, [data, maxEvents]);

    if (loading) return <div className="h-64 bg-[#080c14] rounded-xl animate-pulse" />;

    // Lat/lon grid lines
    const latLines = [-60, -30, 0, 30, 60].map(lat => {
        const [, y] = projectEq(0, lat);
        return { y, eq: lat === 0 };
    });
    const lonLines = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map(lon => {
        const [x] = projectEq(lon, 0);
        return { x, pm: lon === 0 };
    });

    return (
        <div
            className="relative rounded-xl overflow-hidden bg-[#080c14] border border-slate-700/40 select-none"
            onMouseLeave={() => setTooltip(null)}
        >
            <svg
                viewBox={`0 0 ${MAP_W} ${MAP_H}`}
                className="w-full"
                style={{ display: 'block', height: 'auto' }}
            >
                {/* Ocean background */}
                <rect width={MAP_W} height={MAP_H} fill="#080c14" />

                {/* Grid */}
                {latLines.map(({ y, eq }) => (
                    <line key={y} x1={0} y1={y} x2={MAP_W} y2={y}
                        stroke={eq ? 'rgba(148,163,184,0.14)' : 'rgba(148,163,184,0.05)'}
                        strokeWidth={eq ? 0.8 : 0.5} />
                ))}
                {lonLines.map(({ x, pm }) => (
                    <line key={x} x1={x} y1={0} x2={x} y2={MAP_H}
                        stroke={pm ? 'rgba(148,163,184,0.14)' : 'rgba(148,163,184,0.05)'}
                        strokeWidth={pm ? 0.8 : 0.5} />
                ))}

                {/* Glow blobs (outer) */}
                {points.map(p => (
                    <circle key={`g-${p.country}`}
                        cx={p.x} cy={p.y} r={p.r * 3}
                        fill={p.color} opacity={0.10 + p.t * 0.08}
                    />
                ))}

                {/* Mid glow */}
                {points.map(p => (
                    <circle key={`m-${p.country}`}
                        cx={p.x} cy={p.y} r={p.r * 1.8}
                        fill={p.color} opacity={0.22 + p.t * 0.1}
                    />
                ))}

                {/* Core */}
                {points.map(p => (
                    <circle key={`c-${p.country}`}
                        cx={p.x} cy={p.y} r={p.r}
                        fill={p.color} opacity={0.85}
                        className="cursor-pointer"
                        onMouseEnter={(e) => setTooltip({ ...p, mx: e.clientX, my: e.clientY })}
                        onMouseMove={(e)  => setTooltip(t => t ? { ...t, mx: e.clientX, my: e.clientY } : t)}
                        onMouseLeave={() => setTooltip(null)}
                    />
                ))}

                {/* Country labels for top 6 */}
                {points.slice(0, 6).map(p => (
                    <text key={`l-${p.country}`}
                        x={p.x} y={p.y - p.r - 5}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.72)"
                        fontSize={9}
                        fontFamily="system-ui, sans-serif"
                        fontWeight="600"
                        pointerEvents="none"
                    >
                        {p.country}
                    </text>
                ))}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-lg">
                {[['#1d4ed8','Low'],['#7c3aed','Mid'],['#ea580c','High'],['#dc2626','Peak']].map(([color, label]) => (
                    <div key={label} className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="text-[10px] text-slate-400">{label}</span>
                    </div>
                ))}
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="fixed z-50 pointer-events-none bg-slate-900 border border-slate-700 text-white text-xs px-3 py-2 rounded-xl shadow-2xl"
                    style={{ left: tooltip.mx + 14, top: tooltip.my - 48 }}
                >
                    <p className="font-bold text-slate-100">{tooltip.country}</p>
                    <p className="text-slate-400 mt-0.5">{fmt(tooltip.events)} events · {fmt(tooltip.sessions)} sessions</p>
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
