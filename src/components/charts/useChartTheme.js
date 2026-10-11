import { useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const read = (style, name) => style.getPropertyValue(name).trim();

/**
 * Resolved chart colours for the current theme (Recharts/canvas need real colour
 * values; SVG attributes don't reliably accept var()). Re-reads on theme change.
 *
 * series: fixed-order categorical palette (--chart-1..6). Assign by entity, never by rank;
 *         more than 6 series should fold into "Other".
 */
export function useChartTheme() {
    const { theme } = useTheme();
    return useMemo(() => {
        const s = getComputedStyle(document.documentElement);
        const surface = read(s, '--surface');
        const fg = read(s, '--fg');
        const muted = read(s, '--fg-muted');
        const subtle = read(s, '--fg-subtle');
        const border = read(s, '--border');
        return {
            theme,
            series: [1, 2, 3, 4, 5, 6].map(i => read(s, `--chart-${i}`)),
            success: read(s, '--success'),
            danger: read(s, '--danger'),
            warning: read(s, '--warning'),
            accent: read(s, '--accent'),
            surface, fg, muted, subtle, border,
            grid: border,
            axisTick: { fill: muted, fontSize: 11 },
            tooltip: {
                contentStyle: {
                    background: surface, border: `1px solid ${border}`, borderRadius: 8,
                    boxShadow: read(s, '--elev-pop'), fontSize: 13, color: fg,
                },
                labelStyle: { color: fg, fontWeight: 600 },
                itemStyle: { color: fg },
                cursor: { fill: border, opacity: 0.4 },
            },
            legend: { wrapperStyle: { fontSize: 12, color: muted } },
        };
        // theme drives the .dark class, which changes every variable above
    }, [theme]);
}
