import React, { useState, useEffect } from 'react';
import { BillUploader } from './components/BillUploader';
import { PFDashboard } from './components/PFDashboard';
import { analyzeBill, BillData } from './services/gemini';
import { saveBillData, getBillHistory } from './services/api';
import { Zap, Info, ChevronDown, CheckCircle2, AlertCircle, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

export default function App() {
  const [billData, setBillData] = useState<BillData | null>(null);
  const [history, setHistory] = useState<BillData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTheory, setShowTheory] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await getBillHistory();
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const handleUpload = async (base64: string, mimeType: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyzeBill(base64, mimeType);
      await saveBillData(data);
      setBillData(data);
      fetchHistory(); // Refresh history
    } catch (err: any) {
      setError(err?.message || "Something went wrong while analyzing the bill.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-bg flex flex-col">
      {/* Vibrant Header */}
      <header id="main-header" className="px-10 py-10 bg-white border-b border-border flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 accent-gradient rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
            <Zap className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl tracking-normal text-text mb-0">ElectraPF <span className="text-accent underline decoration-accent/30 decoration-4 underline-offset-4">Pulse</span></h1>
            <span className="text-[10px] text-text-dim uppercase tracking-[3px] font-bold">Intelligent Power Analytics</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-accent-soft rounded-full border border-accent/10">
            <span className="text-[10px] text-accent uppercase tracking-widest font-black">CS Assistant Mode</span>
          </div>
          <div className="px-3 py-1 bg-success/10 rounded-full border border-success/10">
             <span className="text-[10px] text-success uppercase tracking-widest font-black">Live</span>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Uploader Section */}
          <BillUploader onUpload={handleUpload} isLoading={isLoading} />
          
          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-md mx-auto mt-8 p-4 bg-error/10 border border-error/30 rounded-sm text-center text-error text-xs uppercase tracking-widest"
            >
              [ERROR] {error}
            </motion.div>
          )}

          {/* Theory / Guide Section */}
          <div id="theory-wrapper" className="max-w-2xl mx-auto px-4 mt-8">
            <div id="theory-card" className="panel">
              <button 
                id="toggle-theory"
                onClick={() => setShowTheory(!showTheory)}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-bg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Info className="w-4 h-4 text-accent" strokeWidth={1.5} />
                  <span className="text-xs uppercase tracking-widest font-bold">Concept Guide</span>
                </div>
                <ChevronDown className={cn("w-4 h-4 transition-transform text-text-dim", showTheory ? "rotate-180" : "")} />
              </button>
              
              <AnimatePresence>
                {showTheory && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-error/10 border border-error/20 rounded-lg">
                        <h4 className="text-[10px] font-bold text-error uppercase mb-2 tracking-widest">Lagging (Inductive)</h4>
                        <p className="text-[11px] text-text-dim leading-relaxed">
                          Voltage peaks before current. Common in motors and coils. Electricity is delayed by magnetic fields.
                        </p>
                      </div>
                      <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                        <h4 className="text-[10px] font-bold text-success uppercase mb-2 tracking-widest">Leading (Capacitive)</h4>
                        <p className="text-[11px] text-text-dim leading-relaxed">
                          Current peaks before voltage. Usually seen in systems with capacitor banks.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence>
            {billData && !isLoading && (
              <PFDashboard data={billData} history={history} />
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer id="main-footer" className="py-8 border-t border-border text-center">
        <p className="text-text-dim text-[10px] uppercase font-bold tracking-[3px]">
          Intelligence Layer • Analytics Engine 2026
        </p>
      </footer>
    </div>
  );
}
