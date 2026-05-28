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

const DATA = [
  { name: 'Jan', purple: 25, blue: 40 },
  { name: 'Feb', purple: 45, blue: 32 },
  { name: 'Mar', purple: 35, blue: 48 },
  { name: 'Apr', purple: 58, blue: 42 },
  { name: 'May', purple: 48, blue: 62 },
  { name: 'Jun', purple: 78, blue: 52 }, // Peak for purple!
  { name: 'Jul', purple: 62, blue: 68 },
];

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

function AnalyticsChart() {
  return (
    <div className="flex flex-col items-start w-full text-left pt-6">
      {/* Title */}
      <h3 className="text-[18px] font-bold text-[#111111] mb-1">Statistics</h3>
      <p className="text-[13px] text-[#8f8f95] leading-relaxed mb-6">
        Track the statistics of your projects.
      </p>

      {/* Chart Canvas */}
      <div className="w-full h-[220px] relative -ml-6">
        <ResponsiveContainer width="105%" height="100%">
          <AreaChart data={DATA} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
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

            {/* Purple Area Chart (Muted fill) */}
            <Area 
              type="monotone" 
              dataKey="purple" 
              stroke="#6d3df5" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#purpleGrad)" 
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#6d3df5' }}
            />

            {/* Blue Line Chart */}
            <Area 
              type="monotone" 
              dataKey="blue" 
              stroke="#1769ff" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#blueGrad)" 
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#1769ff' }}
            />

            {/* Highlight Peak Dot */}
            <ReferenceDot
              x="Jun"
              y={78}
              r={5}
              fill="#111111"
              stroke="#ffffff"
              strokeWidth={2.5}
              label={renderCustomDotLabel}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AnalyticsChart;
