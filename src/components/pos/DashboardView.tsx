import React, { useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  Layers, 
  AlertTriangle
} from 'lucide-react';
import { DashboardStats, Order } from '../../types';

interface DashboardViewProps {
  stats: DashboardStats | null;
  orders: Order[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats
}) => {
  const trendCanvasRef = useRef<HTMLCanvasElement>(null);
  const channelCanvasRef = useRef<HTMLCanvasElement>(null);

  const fmt = (n: number) => 'QR ' + Number(n || 0).toFixed(2);

  // Render 7-day trend chart
  useEffect(() => {
    if (!stats || !trendCanvasRef.current) return;
    const canvas = trendCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const padding = { top: 20, bottom: 30, left: 45, right: 15 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;

    ctx.clearRect(0, 0, W, H);

    const data = stats.daysTrend || [];
    const maxVal = Math.max(...data.map(d => d.revenue), 10);

    // Draw horizontal grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + chartH - (i / 4) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = '#5E5F64';
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(fmt((i / 4) * maxVal), padding.left - 6, y + 3);
    }

    // Draw bars
    if (data.length > 0) {
      const barWidth = Math.min((chartW / data.length) * 0.5, 28);
      const gap = chartW / data.length;

      data.forEach((d, i) => {
        const barH = (d.revenue / maxVal) * chartH;
        const x = padding.left + i * gap + (gap - barWidth) / 2;
        const y = padding.top + chartH - barH;

        // Gradient bar
        const grad = ctx.createLinearGradient(0, y, 0, y + barH);
        grad.addColorStop(0, '#39FFB0');
        grad.addColorStop(1, '#17C98A');

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barH);

        // Date label
        ctx.fillStyle = '#9C9DA3';
        ctx.font = '9px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.label.split(',')[0], padding.left + i * gap + gap / 2, padding.top + chartH + 16);
      });
    }
  }, [stats]);

  // Render Channel Breakdown Chart
  useEffect(() => {
    if (!stats || !channelCanvasRef.current) return;
    const canvas = channelCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const padding = { top: 20, bottom: 30, left: 30, right: 30 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;

    ctx.clearRect(0, 0, W, H);

    const online = stats.channelBreakdown?.online || 0;
    const instore = stats.channelBreakdown?.instore || 0;
    const maxVal = Math.max(online, instore, 10);

    const channels = [
      { label: 'In-Store', val: instore, color: '#39FFB0' },
      { label: 'Online / WA', val: online, color: '#39B0FF' }
    ];

    const barWidth = Math.min(chartW * 0.25, 45);
    const gap = chartW * 0.3;

    channels.forEach((c, i) => {
      const x = padding.left + i * (barWidth + gap) + (chartW - (barWidth * 2 + gap)) / 2;
      const barH = (c.val / maxVal) * chartH;
      const y = padding.top + chartH - barH;

      ctx.fillStyle = c.color;
      ctx.fillRect(x, y, barWidth, barH);

      ctx.fillStyle = '#9C9DA3';
      ctx.font = '11px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.label, x + barWidth / 2, padding.top + chartH + 18);

      ctx.fillStyle = '#F5F5F4';
      ctx.font = '11px "IBM Plex Mono", monospace';
      ctx.fillText(fmt(c.val), x + barWidth / 2, y - 6);
    });
  }, [stats]);

  if (!stats) {
    return (
      <div className="py-20 text-center text-[#5E5F64] font-mono">
        Loading real-time analytics from backend...
      </div>
    );
  }

  const sortedCategories: [string, number][] = Object.entries(stats.categoryRevenue || {})
    .map(([cat, rev]) => [cat, Number(rev)] as [string, number])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="pb-2 border-b border-[#1E1E21]">
        <h2 className="font-display font-semibold text-2xl text-[#F5F5F4]">Executive Dashboard</h2>
        <p className="text-xs text-[#9C9DA3] mt-0.5">Live store sales performance, top revenue categories & stock health.</p>
      </div>

      {/* KPI Stats Row (5 metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        
        <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#5E5F64]">Total Revenue</span>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#39FFB0]">
            {fmt(stats.revenue)}
          </div>
        </div>

        <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#5E5F64]">Total Sales</span>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#F5F5F4]">
            {stats.salesCount}
          </div>
        </div>

        <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#5E5F64]">Avg Order</span>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#39B0FF]">
            {fmt(stats.avgOrder)}
          </div>
        </div>

        <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#5E5F64]">Items Sold</span>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#B039FF]">
            {stats.itemsSold}
          </div>
        </div>

        <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-xl p-4 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#5E5F64]">Pending Orders</span>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#FFB039]">
            {stats.pendingOrders}
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* 7 Days Sales Trend */}
        <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-xl p-4.5 space-y-3">
          <h3 className="font-display font-semibold text-base text-[#F5F5F4] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#39FFB0]" />
            <span>Sales Trend (Last 7 Days)</span>
          </h3>
          <div className="w-full h-44 relative">
            <canvas ref={trendCanvasRef} className="w-full h-full" />
          </div>
        </div>

        {/* Revenue by Channel */}
        <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-xl p-4.5 space-y-3">
          <h3 className="font-display font-semibold text-base text-[#F5F5F4] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#39B0FF]" />
            <span>Revenue by Channel</span>
          </h3>
          <div className="w-full h-44 relative">
            <canvas ref={channelCanvasRef} className="w-full h-full" />
          </div>
        </div>

      </div>

      {/* Breakdown Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Top Categories */}
        <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-xl p-4.5 space-y-3">
          <h3 className="font-display font-semibold text-base text-[#F5F5F4]">Top Revenue Categories</h3>
          {sortedCategories.length === 0 ? (
            <div className="text-xs text-[#5E5F64] py-6 text-center">No category sales data yet.</div>
          ) : (
            <div className="divide-y divide-[#1E1E21]">
              {sortedCategories.map(([cat, rev]) => (
                <div key={cat} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-[#F5F5F4]">{cat}</span>
                  <span className="font-mono font-semibold text-[#39FFB0]">{fmt(rev)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-xl p-4.5 space-y-3">
          <h3 className="font-display font-semibold text-base text-[#F5F5F4] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#FFB039]" />
            <span>Low Stock Re-order Alerts</span>
          </h3>
          {stats.lowStock.length === 0 ? (
            <div className="text-xs text-[#39FFB0] py-6 text-center">All inventory levels are healthy!</div>
          ) : (
            <div className="divide-y divide-[#1E1E21]">
              {stats.lowStock.map(p => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-medium text-[#F5F5F4]">{p.name}</p>
                    <span className="text-[10px] text-[#5E5F64] font-mono">{p.sku || 'No SKU'}</span>
                  </div>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    p.stock <= 0 ? 'bg-[#FF5E5E]/15 text-[#FF5E5E]' : 'bg-[#FFB039]/15 text-[#FFB039]'
                  }`}>
                    {p.stock <= 0 ? 'Out of stock' : `${p.stock} remaining`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
