import React from 'react';
import { motion } from 'motion/react';
import { BillData } from '@/src/services/gemini';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { Zap, Info, ArrowUpRight, ArrowDownRight, Activity, User, CreditCard, Gauge, TrendingUp, FileDigit, Percent, AlertCircle, Settings2, Calculator, CheckCircle2, History, FileSpreadsheet, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/src/lib/utils';
import { calculateKVArCorrection, getNearestStandardPF, TARGET_PF_OPTIONS } from '@/src/lib/pfMath';
import { downloadExcelReport } from '@/src/services/api';

interface PFDashboardProps {
  data: BillData;
  history?: BillData[];
}

export const PFDashboard: React.FC<PFDashboardProps> = ({ data, history = [] }) => {
  const [targetPF, setTargetPF] = React.useState(0.99);
  
  const primaryPF = data.calculated_pf;
  const meterPF = data.meter_pf?.toFixed(3);
  
  // Logic Step 1: Match with nearest Standard PF from "Chart Column"
  const nearestStandardPF = getNearestStandardPF(primaryPF);
  
  // Logic Step 4: Multiply by Sanctioned Load (kW)
  const sanctionedLoad = data.sanctioned_load_kw || 0;
  const { factorF, requiredKVAr } = calculateKVArCorrection(nearestStandardPF, targetPF, sanctionedLoad);

  const displayPF = primaryPF.toFixed(3);

  const chartData = [
    { name: 'Active (kWh)', value: data.kWh, fill: '#0B63E5' }, // Accent Blue
    { name: 'Lag (kVARh)', value: data.kVARh_lag, fill: '#EF4444' }, // Error Red
    { name: 'Lead (kVARh)', value: data.kVARh_lead, fill: '#10B981' }, // Success Green
    { name: 'Apparent (kVAh)', value: data.kVAh, fill: '#64748B' }, // Slate
  ];

  const getStatusColor = () => {
    if (data.load_type === 'lagging') return 'text-error border-error bg-error/5';
    if (data.load_type === 'leading') return 'text-success border-success bg-success/5';
    return 'text-accent border-accent bg-accent/5';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-6xl mx-auto mt-16 px-4 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-8"
    >
      {/* Quick Actions Header */}
      <div className="lg:col-span-2 flex justify-between items-center bg-white p-6 rounded-3xl border border-border shadow-sm mb--4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
             <Activity className="w-5 h-5 text-accent" />
          </div>
          <h2 className="font-display font-bold text-xl text-text">Session Analytics</h2>
        </div>
        <button 
          onClick={() => downloadExcelReport()}
          className="flex items-center gap-2 px-5 py-2.5 bg-text text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export History (.xlsx)
        </button>
      </div>
      {/* Panel 02: Account & Demand Analysis */}
      <div id="account-panel" className="panel lg:col-span-2">
        <div className="panel-header">
           <User className="w-4 h-4" />
           02. Account & Demand Profile
        </div>
        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 gap-x-10">
            {/* Row 1: Primary Account Info */}
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-accent/10 rounded-2xl">
                <User className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="data-label">Account Holder</span>
                <span className="font-display text-lg font-bold text-text truncate block">{data.customer_name || 'Not Detected'}</span>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-success/10 rounded-2xl">
                <CreditCard className="w-6 h-6 text-success" />
              </div>
              <div>
                <span className="data-label">Amount Payable</span>
                <span className="font-mono text-lg font-bold text-text block">
                  {data.bill_amount ? `₹${data.bill_amount.toLocaleString()}` : 'Not Detected'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-purple/10 rounded-2xl">
                <Gauge className="w-6 h-6 text-purple" />
              </div>
              <div>
                <span className="data-label">Contract Demand</span>
                <span className="font-mono text-lg font-bold text-text block">
                  {data.sanctioned_demand_kva ? `${data.sanctioned_demand_kva} kVA` : 'Not Detected'}
                </span>
              </div>
            </div>

            {/* Row 2: Specialized Demand Info */}
            <div className="flex items-center gap-5 p-5 bg-bg rounded-2xl border border-border/50 transition-transform hover:scale-[1.02]">
              <div className="p-3.5 bg-white rounded-xl shadow-sm border border-border/20">
                <TrendingUp className="w-6 h-6 text-amber" />
              </div>
              <div>
                <span className="data-label !text-amber">Actual Demand</span>
                <span className="font-mono text-lg font-bold text-text block">
                  {data.billing_demand_kva ? `${data.billing_demand_kva} kVA` : 'Not Detected'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-5 p-5 bg-bg rounded-2xl border border-border/50 transition-transform hover:scale-[1.02]">
              <div className="p-3.5 bg-white rounded-xl shadow-sm border border-border/20">
                <Percent className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <span className="data-label !text-indigo-500">Minimum Demand</span>
                <span className="font-mono text-lg font-bold text-text block">
                  {data.min_demand_kva ? `${data.min_demand_kva} kVA` : 'Not Detected'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-5 p-5 bg-bg rounded-2xl border border-border/50 transition-transform hover:scale-[1.02]">
              <div className="p-3.5 bg-white rounded-xl shadow-sm border border-border/20">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <div>
                <span className="data-label !text-accent">Sanctioned Load</span>
                <span className="font-mono text-lg font-bold text-text block">
                  {data.sanctioned_load_kw ? `${data.sanctioned_load_kw} kW` : 'Not Detected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel 03: Data & Analysis */}
      <div id="data-panel" className="panel">
        <div className="panel-header">
           <Activity className="w-4 h-4" />
           03. Energy Consumption Log
        </div>
        <div id="analysis-grid" className="p-8 grid grid-cols-2 gap-6">
          <div className="metric-card">
            <span className="data-label">Active (kWh)</span>
            <span className="font-mono text-2xl text-text block leading-none">{data.kWh.toLocaleString()}</span>
          </div>
          <div className="metric-card">
            <span className="data-label">Apparent (kVAh)</span>
            <span className="font-mono text-2xl text-text block leading-none">{data.kVAh.toLocaleString()}</span>
          </div>
          <div className="metric-card">
            <span className="data-label">Lag Reactive</span>
            <span className="font-mono text-2xl text-error/80 block leading-none">{data.kVARh_lag.toLocaleString()}</span>
          </div>
          <div className="metric-card">
            <span className="data-label">Lead Reactive</span>
            <span className="font-mono text-2xl text-success/80 block leading-none">{data.kVARh_lead.toLocaleString()}</span>
          </div>
        </div>

        <div className="px-8 pb-8">
          <div className="flex justify-between items-end mb-6 px-2">
             <div className="flex flex-col">
               <span className="text-[10px] text-text-dim uppercase tracking-widest font-black mb-1">Meter PF</span>
               <span className="font-mono text-xl text-text/40">{meterPF || 'N/A'}</span>
             </div>
             <motion.div 
               initial={{ scale: 0.9 }}
               animate={{ scale: 1 }}
               className="flex flex-col text-right"
              >
               <span className="text-[10px] text-accent font-black uppercase tracking-[2px] mb-1">Analyzer PF</span>
               <span className="font-mono text-3xl font-black text-accent drop-shadow-sm">{displayPF}</span>
             </motion.div>
          </div>
          <div className="h-[180px] w-full bg-slate-50 border border-border p-5 rounded-2xl shadow-inner">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(11,99,229,0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white border border-border p-4 rounded-xl shadow-2xl">
                          <p className="text-[10px] font-black text-text-dim uppercase mb-2 tracking-widest">{payload[0].payload.name}</p>
                          <p className="text-xl font-mono font-bold text-accent">{payload[0].value.toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Panel: Historical Trends */}
      <div id="trends-panel" className="panel lg:col-span-2">
        <div className="panel-header">
           <History className="w-4 h-4" />
           04. Power Factor Trajectory (Historical)
        </div>
        <div className="p-10">
          <div className="h-[300px] w-full">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[...history]}>
                  <defs>
                    <linearGradient id="colorPF" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0B63E5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0B63E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="billing_period" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis 
                    domain={[0.8, 1.0]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xl">
                             <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{payload[0].payload.billing_period}</p>
                             <p className="text-lg font-mono font-bold text-blue-600">PF: {payload[0].value.toFixed(3)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="calculated_pf" 
                    stroke="#0B63E5" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorPF)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                <TrendingUp className="w-12 h-12 mb-4" />
                <p className="text-xs uppercase font-black tracking-widest">Insufficient historical data for trend analysis</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel 04: Result */}
      <div id="result-panel" className="panel relative overflow-visible">
        <div className="panel-header">
           <Zap className="w-4 h-4" />
           04. Load Characterization
        </div>
        <div className="p-10 flex flex-col items-center justify-center text-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-48 h-48 rounded-3xl accent-gradient p-[1px] mb-10 shadow-2xl shadow-accent/20"
          >
            <div className="w-full h-full bg-white rounded-[23px] flex flex-col items-center justify-center">
              <span className="font-display text-5xl font-black tracking-tight text-text leading-none mb-2">{displayPF}</span>
              <span className="text-[10px] uppercase text-accent tracking-[3px] font-black">Pulse Score</span>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={cn("px-8 py-3 rounded-2xl text-[12px] font-black uppercase tracking-[3px] border-2 mb-8 shadow-sm", getStatusColor())}
          >
            {data.load_type}
          </motion.div>
          
          {meterPF && Math.abs(primaryPF - parseFloat(meterPF)) > 0.05 && (
            <div className="mb-8 p-4 bg-error/10 border border-error/20 rounded-xl text-[10px] text-error font-black uppercase tracking-[2px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Drift Alert: Check Meter Calibration
            </div>
          )}
          
          <div className="flex items-center gap-3 text-text-dim">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", data.load_type === 'lagging' ? 'bg-error' : 'bg-success')}></div>
            <p className="text-sm font-medium tracking-tight">
              {data.load_type === 'lagging' ? 'Dominant Inductive Signature' : 'Capacitive Leading Phase'}
            </p>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-border mt-auto">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-accent" />
            <h3 className="text-[11px] uppercase font-black text-text tracking-[2px]">Field Insight</h3>
          </div>
          <div className="text-[13px] text-text-dim leading-relaxed font-sans scrollbar-hide overflow-y-auto max-h-[140px] prose prose-blue">
             <ReactMarkdown>{data.explanation}</ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Panel 05: Correction Planner - Only for LEADING loads */}
      {data.load_type === 'lagging' ? (
        <div id="correction-panel" className="panel lg:col-span-2 shadow-xl shadow-accent/5 border-accent/20">
          <div className="panel-header bg-accent-soft/30 border-accent/20 text-accent">
            <Settings2 className="w-4 h-4" />
            05. Optimisation & Capacitor Planner
          </div>
          
          <div className="p-10 grid grid-cols-1 xl:grid-cols-12 gap-12">
            {/* Left Side: Goal Setting */}
            <div className="xl:col-span-7">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-accent" />
                </div>
                <h3 className="font-display text-xl font-bold text-text">Correction Strategy</h3>
              </div>

              <div className="space-y-10">
                {/* Step 1: Matching */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-accent text-white text-[10px] font-bold">1</span>
                    <span className="text-xs uppercase font-black tracking-widest text-text-dim">Match Current Baseline</span>
                  </div>
                  <div className="p-6 bg-bg rounded-2xl border border-border/50 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-text-dim block mb-1">Detected P.F</span>
                      <span className="font-mono text-2xl font-bold text-text leading-none">{displayPF}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-px bg-border my-2"></div>
                      <span className="text-[10px] uppercase font-bold text-accent tracking-tighter">Chart Lookup Value</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-text-dim block mb-1">Standard Reference</span>
                      <span className="font-mono text-2xl font-bold text-accent leading-none">{nearestStandardPF.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Step 2: Goal Selection */}
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-accent text-white text-[10px] font-bold">2</span>
                    <span className="text-xs uppercase font-black tracking-widest text-text-dim">Define Efficiency Goal (Target P.F)</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-11 gap-2">
                    {TARGET_PF_OPTIONS.map((val) => (
                      <button
                        key={val}
                        onClick={() => setTargetPF(val)}
                        className={cn(
                          "py-3 rounded-xl border-2 font-mono text-xs font-bold transition-all duration-300",
                          targetPF === val 
                            ? "bg-accent border-accent text-white shadow-lg shadow-accent/20 scale-105" 
                            : "bg-white border-border/60 text-text-dim hover:border-accent/40 hover:text-accent"
                        )}
                      >
                        {val.toFixed(2)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Results */}
            <div className="xl:col-span-5 flex flex-col justify-center">
              <div className="bg-accent rounded-[2rem] p-10 text-white shadow-2xl shadow-accent/30 relative overflow-hidden group">
                {/* Decorative Pulse */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <Zap className="w-5 h-5 text-accent-soft fill-current" />
                    <span className="text-[10px] uppercase font-black tracking-[4px] text-accent-soft">Calculation Output</span>
                  </div>
                  
                  <div className="mb-8">
                    <span className="text-6xl font-display font-black leading-none block mb-2">
                      {requiredKVAr.toFixed(2)}
                    </span>
                    <span className="text-xl font-display font-bold opacity-80 uppercase tracking-widest">Required kVAr Rating</span>
                  </div>

                  <div className="space-y-4">
                    <div className="p-5 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest opacity-70">Factor F (from Chart)</span>
                        <span className="font-mono font-bold tracking-tighter">{factorF.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold tracking-widest opacity-70">Calculation</span>
                        <span className="font-mono font-bold text-[10px]">{sanctionedLoad}kW × {factorF.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-white text-accent rounded-2xl shadow-xl">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <p className="text-[11px] font-bold leading-tight uppercase">
                        Recommended: Install a {Math.ceil(requiredKVAr)} kVAr Automatic APFC Panel
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-start gap-3 p-4 bg-amber/5 border border-amber/10 rounded-2xl">
                <Info className="w-4 h-4 text-amber shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-900 leading-normal font-medium">
                  <strong>Important:</strong> Correction steps are calculated using the <strong>Standard Tan Phi Displacement Matrix</strong>. Always consult with a licensed electrical engineer before physical installation.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : data.load_type === 'leading' ? (
        <div className="panel lg:col-span-2 p-12 bg-success/5 border-success/20 flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-success/10 rounded-full mb-6">
            <TrendingUp className="w-10 h-10 text-success" />
          </div>
          <h3 className="font-display text-2xl font-bold text-success mb-3">Leading Power Factor Detected</h3>
          <p className="text-sm text-text-dim max-w-2xl mb-8 leading-relaxed">
            Your system is currently in a <strong>Leading (Capacitive)</strong> state. This typically occurs when capacitor banks remain active during low-load periods, or when fixed compensation is oversized. Leading PF can cause voltage swells and unnecessary stress on equipment.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
            <div className="p-5 bg-white border border-border rounded-2xl">
              <span className="text-[10px] font-black uppercase text-accent block mb-2 tracking-widest">Root Cause</span>
              <p className="text-xs text-text font-medium leading-tight">Over-compensation from fixed capacitor banks.</p>
            </div>
            <div className="p-5 bg-white border border-border rounded-2xl">
              <span className="text-[10px] font-black uppercase text-accent block mb-2 tracking-widest">Direct Impact</span>
              <p className="text-xs text-text font-medium leading-tight">Voltage instability and internal grid resonance risks.</p>
            </div>
            <div className="p-5 bg-white border border-border rounded-2xl">
              <span className="text-[10px] font-black uppercase text-accent block mb-2 tracking-widest">Action Step</span>
              <p className="text-xs text-text font-medium leading-tight">Downsize fixed units or calibrate APFC target PF.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="panel lg:col-span-2 p-12 border-dashed border-border border-2 flex flex-col items-center justify-center text-center bg-bg/30">
          <Activity className="w-10 h-10 text-text-dim/20 mb-4" />
          <h3 className="font-display text-xl font-bold text-text-dim">Unity Power Factor (Ideal)</h3>
          <p className="text-sm text-text-dim max-w-md mt-2 leading-relaxed">
            Your system is operating at peak efficiency with a Power Factor near 1.00. No further correction is required for this billing cycle.
          </p>
        </div>
      )}
    </motion.div>
  );
};
