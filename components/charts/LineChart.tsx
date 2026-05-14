'use client';
import dynamic from 'next/dynamic';
import type { Layout, Data } from 'plotly.js';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface LineChartProps {
  labels: string[];
  datasets: { name: string; values: number[]; color: string; dash?: 'solid' | 'dash' | 'dot' }[];
  title?: string;
  height?: number;
  yAxisPrefix?: string;
}

const BASE_LAYOUT: Partial<Layout> = {
  paper_bgcolor: '#ffffff',
  plot_bgcolor: '#ffffff',
  font: { family: 'Inter, sans-serif', color: '#374151' },
  margin: { t: 24, r: 16, b: 48, l: 72 },
  legend: { orientation: 'h', y: -0.2 },
  xaxis: { showgrid: false, tickfont: { size: 11 } },
  yaxis: { gridcolor: '#f3f4f6', tickfont: { size: 11 } },
};

export default function LineChart({
  labels,
  datasets,
  title,
  height = 300,
  yAxisPrefix = '$',
}: LineChartProps) {
  const traces: Data[] = datasets.map((ds) => ({
    type: 'scatter',
    mode: 'lines+markers',
    name: ds.name,
    x: labels,
    y: ds.values,
    line: { color: ds.color, dash: ds.dash ?? 'solid', width: 2 },
    marker: { color: ds.color, size: 5 },
  }));

  return (
    <Plot
      data={traces}
      layout={{
        ...BASE_LAYOUT,
        title: title ? { text: title, font: { size: 14 } } : undefined,
        height,
        yaxis: { ...BASE_LAYOUT.yaxis, tickprefix: yAxisPrefix },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}
