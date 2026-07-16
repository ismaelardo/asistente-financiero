'use client';
import dynamic from 'next/dynamic';
import type { Layout, Data } from 'plotly.js';

// Plotly uses window — must be loaded client-side only
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface BarChartProps {
  labels: string[];
  datasets: { name: string; values: number[]; color: string }[];
  title?: string;
  height?: number;
}

const BASE_LAYOUT: Partial<Layout> = {
  paper_bgcolor: '#ffffff',
  plot_bgcolor: '#ffffff',
  font: { family: 'Inter, sans-serif', color: '#374151' },
  margin: { t: 24, r: 16, b: 48, l: 64 },
  legend: { orientation: 'h', y: -0.2 },
  xaxis: { showgrid: false, tickfont: { size: 11 }, type: 'category' },
  yaxis: { gridcolor: '#f3f4f6', tickfont: { size: 11 } },
};

export default function BarChart({ labels, datasets, title, height = 300 }: BarChartProps) {
  const traces: Data[] = datasets.map((ds) => ({
    type: 'bar',
    name: ds.name,
    x: labels,
    y: ds.values,
    marker: { color: ds.color },
  }));

  return (
    <Plot
      data={traces}
      layout={{ ...BASE_LAYOUT, title: title ? { text: title, font: { size: 14 } } : undefined, height }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}
