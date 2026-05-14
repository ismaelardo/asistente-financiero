'use client';
import dynamic from 'next/dynamic';
import type { Layout, Data } from 'plotly.js';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface PieChartProps {
  labels: string[];
  values: number[];
  title?: string;
  height?: number;
}

const PALETTE = [
  '#2563eb', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#6b7280',
];

const BASE_LAYOUT: Partial<Layout> = {
  paper_bgcolor: '#ffffff',
  font: { family: 'Inter, sans-serif', color: '#374151' },
  margin: { t: 24, r: 16, b: 16, l: 16 },
  legend: { orientation: 'v', font: { size: 11 } },
  showlegend: true,
};

export default function PieChart({ labels, values, title, height = 300 }: PieChartProps) {
  const traces: Data[] = [
    {
      type: 'pie',
      labels,
      values,
      marker: { colors: PALETTE },
      textinfo: 'percent',
      hovertemplate: '%{label}: $%{value:,.0f}<extra></extra>',
      hole: 0.4,
    },
  ];

  return (
    <Plot
      data={traces}
      layout={{
        ...BASE_LAYOUT,
        title: title ? { text: title, font: { size: 14 } } : undefined,
        height,
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}
