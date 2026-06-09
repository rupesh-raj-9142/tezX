import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  XAxis,
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ReferenceDot
} from 'recharts';

const renderCustomDotLabel = (props) => {
  const { cx, cy } = props;
  return (
    <g>
      {/* Tooltip bubble background */}
      <rect x={cx - 18} y={cy - 28} width="36" height="18" rx="5" fill="#111111" />
      {/* Bubble little arrow */}
      <polygon points={`${cx - 4},${cy - 10} ${cx + 4},${cy - 10} ${cx},${cy - 6}`} fill="#111111" />
      {/* Tooltip text */}
      <text x={cx} y={cy - 16} fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="0.05em">
        MAX
      </text>
    </g>
  );
};

function AnalyticsChart({ leads = [], projects = [] }) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

  // Initialize counts for each month
  const monthlyCounts = months.reduce((acc, m) => {
    acc[m] = { purple: 0, blue: 0 }; // purple = leads, blue = projects
    return acc;
  }, {});

  // Aggregate leads (purple) by month from created_at
  leads.forEach(l => {
    const dateStr = l.created_at || l.time;
    if (!dateStr) return;
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const mName = date.toLocaleString('en-US', { month: 'short' });
      if (monthlyCounts[mName]) {
        monthlyCounts[mName].purple += 1;
      }
    }
  });

  // Aggregate projects (blue) by month from created_at
  projects.forEach(p => {
    const dateStr = p.created_at || p.deadline;
    if (!dateStr) return;
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const mName = date.toLocaleString('en-US', { month: 'short' });
      if (monthlyCounts[mName]) {
        monthlyCounts[mName].blue += 1;
      }
    }
  });

  // Map to Recharts DATA format
  const chartData = months.map(name => ({
    name,
    purple: monthlyCounts[name].purple,
    blue: monthlyCounts[name].blue
  }));

  // Find peak (max purple value) dynamically for ReferenceDot positioning
  let maxPurpleVal = 0;
  let maxPurpleMonth = null;
  chartData.forEach(d => {
    if (d.purple > maxPurpleVal) {
      maxPurpleVal = d.purple;
      maxPurpleMonth = d.name;
    }
  });

  return (
    <div className="flex flex-col items-start w-full text-left pt-6">
      {/* Title */}
      <h3 className="text-[18px] font-bold text-[#111111] mb-1">Statistics</h3>
      <p className="text-[13px] text-[#8f8f95] leading-relaxed mb-6">
        Track the statistics of your projects and leads.
      </p>

      {/* Chart Canvas */}
      <div className="w-full h-[220px] relative -ml-6">
        <ResponsiveContainer width="105%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            {/* Soft Gradients */}
            <defs>
              <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6d3df5" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#6d3df5" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1769ff" stopOpacity={0.05}/>
                <stop offset="95%" stopColor="#1769ff" stopOpacity={0.0}/>
              </linearGradient>
            </defs>

            {/* Custom Grid */}
            <CartesianGrid 
              stroke="#ececec" 
              strokeWidth={1} 
              vertical={false} 
              strokeDasharray="4 4" 
            />

            {/* X-Axis */}
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#8f8f95', fontSize: 11, fontWeight: 500 }} 
              dy={10}
            />

            {/* Y-Axis */}
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#8f8f95', fontSize: 11, fontWeight: 500 }} 
              dx={-5}
            />

            {/* Tooltip */}
            <Tooltip
              contentStyle={{
                backgroundColor: '#111111',
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              }}
              labelStyle={{ fontWeight: 'bold', fontSize: '12px', color: '#ffffff', marginBottom: '4px' }}
              itemStyle={{ fontSize: '12px', color: '#e2dfff' }}
            />

            {/* Purple Area Chart (Leads) */}
            <Area 
              type="monotone" 
              dataKey="purple" 
              name="Leads"
              stroke="#6d3df5" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#purpleGrad)" 
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#6d3df5' }}
            />

            {/* Blue Line Chart (Projects) */}
            <Area 
              type="monotone" 
              dataKey="blue" 
              name="Projects"
              stroke="#1769ff" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#blueGrad)" 
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#1769ff' }}
            />

            {/* Highlight Peak Dot conditionally */}
            {maxPurpleVal > 0 && (
              <ReferenceDot
                x={maxPurpleMonth}
                y={maxPurpleVal}
                r={5}
                fill="#111111"
                stroke="#ffffff"
                strokeWidth={2.5}
                label={renderCustomDotLabel}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AnalyticsChart;
