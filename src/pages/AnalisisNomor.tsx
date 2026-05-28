import React, { useMemo, useState } from "react";
import { Flame, Snowflake, Star, BarChart2 } from "lucide-react";

interface ResultRow { hari: string; tanggal: string; [slot: string]: string; }

const TIME_SLOTS = ["00:01","13:00","16:00","19:00","22:00","23:00"];

export default function AnalisisNomor({
  resultData, customNumbers, isDark,
}: {
  resultData: ResultRow[];
  customNumbers: string;
  isDark: boolean;
}) {
  const [viewMode, setViewMode] = useState<"heatmap" | "list">("heatmap");
  const [days, setDays] = useState(30);

  const bettingNums = useMemo(() => new Set(customNumbers.split("*").filter(Boolean)), [customNumbers]);

  const { freq, maxFreq, totalDraws } = useMemo(() => {
    const f: Record<string, number> = {};
    let total = 0;
    resultData.slice(0, days).forEach(row => {
      TIME_SLOTS.forEach(s => {
        const v = String(row[s] || "");
        if (v.length === 4 && /^\d{4}$/.test(v)) {
          const last2 = v.slice(-2);
          f[last2] = (f[last2] || 0) + 1;
          total++;
        }
      });
    });
    const max = Math.max(0, ...Object.values(f));
    return { freq: f, maxFreq: max, totalDraws: total };
  }, [resultData, days]);

  const sorted = useMemo(() =>
    Object.entries(freq).sort((a, b) => b[1] - a[1]),
  [freq]);

  const hotNums  = sorted.slice(0, 10);
  const coldNums = sorted.slice(-10).reverse();

  function getColor(num: string): string {
    const f = freq[num] || 0;
    if (f === 0) return isDark ? "bg-slate-800/60" : "bg-slate-100";
    const pct = f / maxFreq;
    if (pct >= 0.8) return "bg-red-500";
    if (pct >= 0.6) return "bg-orange-500";
    if (pct >= 0.4) return "bg-yellow-500";
    if (pct >= 0.2) return "bg-green-500";
    return isDark ? "bg-blue-900" : "bg-blue-100";
  }

  function getTextColor(num: string): string {
    const f = freq[num] || 0;
    if (f === 0) return isDark ? "text-white/20" : "text-slate-300";
    const pct = f / maxFreq;
    if (pct >= 0.2) return "text-white";
    return isDark ? "text-white/60" : "text-slate-600";
  }

  const card = isDark
    ? "bg-slate-900/80 border border-white/10 rounded-[20px]"
    : "bg-white border border-slate-200 rounded-[20px] shadow-sm";

  return (
    <div className="animate-slide-up space-y-4">
      <div className={`${card} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-black">Analisis Frekuensi Nomor</h2>
            <p className={`text-xs mt-0.5 ${isDark ? "text-white/40" : "text-slate-400"}`}>
              {totalDraws} result · {sorted.length} nomor berbeda · {days} hari terakhir
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select value={days} onChange={e => setDays(+e.target.value)}
              className={`text-xs font-bold px-2 py-1.5 rounded-xl outline-none ${isDark ? "bg-white/10 border border-white/20 text-white" : "bg-slate-100 border border-slate-200 text-slate-700"}`}>
              {[7, 14, 30, 60].map(d => <option key={d} value={d}>{d} hari</option>)}
            </select>
            <div className={`flex rounded-xl overflow-hidden border ${isDark ? "border-white/10" : "border-slate-200"}`}>
              {(["heatmap","list"] as const).map(m => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={`px-3 py-1.5 text-xs font-bold transition-all capitalize ${viewMode === m ? "bg-blue-600 text-white" : isDark ? "bg-white/5 text-white/60" : "bg-white text-slate-500"}`}>
                  {m === "heatmap" ? "Grid" : "List"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {viewMode === "heatmap" ? (
          <>
            <div className="flex gap-3 mb-3 text-xs flex-wrap">
              {[
                { color:"bg-red-500",    label:"Sangat panas (80%+)" },
                { color:"bg-orange-500", label:"Panas (60-80%)" },
                { color:"bg-yellow-500", label:"Sedang (40-60%)" },
                { color:"bg-green-500",  label:"Dingin (20-40%)" },
                { color:isDark?"bg-blue-900":"bg-blue-100", label:"Sangat dingin" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded ${l.color}`}/>
                  <span className={isDark ? "text-white/40" : "text-slate-400"}>{l.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border-2 border-yellow-400"/>
                <span className={isDark ? "text-white/40" : "text-slate-400"}>Nomor kamu</span>
              </div>
            </div>

            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: 100 }, (_, i) => {
                const num = String(i).padStart(2, "0");
                const isBetting = bettingNums.has(num);
                const f = freq[num] || 0;
                const pct = maxFreq > 0 ? Math.round((f / maxFreq) * 100) : 0;

                return (
                  <div key={num} title={`${num}: ${f}x (${pct}%)`}
                    className={`relative flex flex-col items-center justify-center rounded-lg aspect-square text-[10px] font-black transition-all cursor-default
                      ${getColor(num)} ${getTextColor(num)}
                      ${isBetting ? "ring-2 ring-yellow-400 ring-offset-1 " + (isDark ? "ring-offset-slate-900" : "ring-offset-white") : ""}
                    `}>
                    <span>{num}</span>
                    {f > 0 && <span className="text-[7px] opacity-70 leading-none">{f}x</span>}
                    {isBetting && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-400 flex items-center justify-center">
                        <Star className="w-1.5 h-1.5 text-yellow-900"/>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-xs ${isDark ? "text-white/40" : "text-slate-400"}`}>
                  <th className="pb-2 text-left">#</th>
                  <th className="pb-2 text-left">Nomor</th>
                  <th className="pb-2 text-center">Frekuensi</th>
                  <th className="pb-2 text-center">Persentase</th>
                  <th className="pb-2 text-left">Bar</th>
                  <th className="pb-2 text-center">Pasang?</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(([num, f], i) => {
                  const pct = maxFreq > 0 ? Math.round((f / maxFreq) * 100) : 0;
                  const isBetting = bettingNums.has(num);
                  return (
                    <tr key={num} className={`border-t ${isDark ? "border-white/5" : "border-slate-50"}`}>
                      <td className={`py-1.5 text-xs ${isDark ? "text-white/30" : "text-slate-300"}`}>{i+1}</td>
                      <td className="py-1.5 font-black tabular-nums">{num}</td>
                      <td className="py-1.5 text-center font-bold">{f}x</td>
                      <td className={`py-1.5 text-center font-bold ${pct >= 80 ? "text-red-400" : pct >= 60 ? "text-orange-400" : pct >= 40 ? "text-yellow-400" : "text-blue-400"}`}>{pct}%</td>
                      <td className="py-1.5 pr-4">
                        <div className={`h-2 rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
                          <div className={`h-2 rounded-full ${pct >= 80 ? "bg-red-500" : pct >= 60 ? "bg-orange-500" : pct >= 40 ? "bg-yellow-500" : "bg-blue-500"}`} style={{ width:`${pct}%` }}/>
                        </div>
                      </td>
                      <td className="py-1.5 text-center">
                        {isBetting ? <Star className="w-3.5 h-3.5 text-yellow-400 mx-auto"/> : <span className={`text-xs ${isDark ? "text-white/20" : "text-slate-200"}`}>—</span>}
                      </td>
                    </tr>
                  );
                })}
                {sorted.length === 0 && (
                  <tr><td colSpan={6} className="py-10 text-center opacity-40">Data result belum tersedia</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`${card} p-5`}>
          <h3 className="font-black mb-3 flex items-center gap-2 text-sm">
            <Flame className="w-4 h-4 text-orange-400"/>Nomor Terpanas (Top 10)
          </h3>
          <div className="space-y-2">
            {hotNums.map(([num, f], i) => {
              const isBetting = bettingNums.has(num);
              const pct = maxFreq > 0 ? Math.round((f / maxFreq) * 100) : 0;
              return (
                <div key={num} className="flex items-center gap-2">
                  <span className={`w-4 text-[10px] text-right ${isDark ? "text-white/30" : "text-slate-300"}`}>{i+1}</span>
                  <span className={`w-9 text-center text-sm font-black rounded-lg py-0.5 ${isBetting ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40" : isDark ? "bg-white/10" : "bg-slate-100 text-slate-700"}`}>{num}</span>
                  {isBetting && <Star className="w-3 h-3 text-yellow-400 flex-shrink-0"/>}
                  <div className={`flex-1 rounded-full h-1.5 ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500" style={{ width:`${pct}%` }}/>
                  </div>
                  <span className="text-xs font-bold text-orange-400 w-8 text-right">{f}x</span>
                </div>
              );
            })}
            {hotNums.length === 0 && <p className={`text-sm opacity-40 text-center py-4`}>Tidak ada data</p>}
          </div>
        </div>

        <div className={`${card} p-5`}>
          <h3 className="font-black mb-3 flex items-center gap-2 text-sm">
            <Snowflake className="w-4 h-4 text-cyan-400"/>Nomor Terdingin (Jarang Keluar)
          </h3>
          <div className="space-y-2">
            {coldNums.map(([num, f], i) => {
              const isBetting = bettingNums.has(num);
              const pct = maxFreq > 0 ? Math.round((f / maxFreq) * 100) : 0;
              return (
                <div key={num} className="flex items-center gap-2">
                  <span className={`w-4 text-[10px] text-right ${isDark ? "text-white/30" : "text-slate-300"}`}>{i+1}</span>
                  <span className={`w-9 text-center text-sm font-black rounded-lg py-0.5 ${isBetting ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40" : isDark ? "bg-white/10" : "bg-slate-100 text-slate-700"}`}>{num}</span>
                  {isBetting && <Star className="w-3 h-3 text-yellow-400 flex-shrink-0"/>}
                  <div className={`flex-1 rounded-full h-1.5 ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width:`${pct}%` }}/>
                  </div>
                  <span className="text-xs font-bold text-cyan-400 w-8 text-right">{f}x</span>
                </div>
              );
            })}
            {coldNums.length === 0 && <p className={`text-sm opacity-40 text-center py-4`}>Tidak ada data</p>}
          </div>
        </div>
      </div>

      <div className={`${card} p-5`}>
        <h3 className="font-black mb-3 flex items-center gap-2 text-sm">
          <BarChart2 className="w-4 h-4 text-blue-400"/>Analisis Nomor Taruhan Kamu
        </h3>
        {bettingNums.size === 0 ? (
          <p className="opacity-40 text-sm text-center py-4">Tidak ada nomor taruhan yang dikonfigurasi</p>
        ) : (
          <div className="space-y-2">
            {(() => {
              const bettingStats = Array.from(bettingNums).map(num => ({
                num, freq: freq[num] || 0, pct: maxFreq > 0 ? Math.round(((freq[num] || 0) / maxFreq) * 100) : 0
              })).sort((a, b) => b.freq - a.freq);
              const avgFreq = bettingStats.reduce((s, x) => s + x.freq, 0) / bettingStats.length;
              const allAvg = Object.values(freq).reduce((s, v) => s + v, 0) / Math.max(1, Object.keys(freq).length);
              return (
                <>
                  <div className={`grid grid-cols-3 gap-3 mb-4 text-center`}>
                    <div className={`p-3 rounded-xl ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                      <div className={`text-xs ${isDark ? "text-white/40" : "text-slate-400"}`}>Rata-rata Frekuensi</div>
                      <div className="text-xl font-black text-blue-400">{avgFreq.toFixed(1)}x</div>
                    </div>
                    <div className={`p-3 rounded-xl ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                      <div className={`text-xs ${isDark ? "text-white/40" : "text-slate-400"}`}>vs Rata-rata Semua</div>
                      <div className={`text-xl font-black ${avgFreq >= allAvg ? "text-green-400" : "text-red-400"}`}>{avgFreq >= allAvg ? "+" : ""}{(avgFreq - allAvg).toFixed(1)}x</div>
                    </div>
                    <div className={`p-3 rounded-xl ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                      <div className={`text-xs ${isDark ? "text-white/40" : "text-slate-400"}`}>Jumlah Nomor</div>
                      <div className="text-xl font-black text-yellow-400">{bettingNums.size}</div>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-48">
                    <div className="grid grid-cols-5 gap-1">
                      {bettingStats.map(({ num, freq: f, pct }) => (
                        <div key={num} title={`${num}: ${f}x`}
                          className={`flex flex-col items-center justify-center rounded-xl p-1.5 ${getFreqBg(pct, isDark)}`}>
                          <span className={`text-xs font-black ${getFreqText(pct, isDark)}`}>{num}</span>
                          <span className={`text-[9px] ${getFreqText(pct, isDark)} opacity-70`}>{f}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

function getFreqBg(pct: number, dark: boolean) {
  if (pct >= 80) return "bg-red-500/30";
  if (pct >= 60) return "bg-orange-500/30";
  if (pct >= 40) return "bg-yellow-500/30";
  if (pct >= 20) return "bg-green-500/20";
  return dark ? "bg-white/5" : "bg-slate-50";
}

function getFreqText(pct: number, dark: boolean) {
  if (pct >= 80) return "text-red-400";
  if (pct >= 60) return "text-orange-400";
  if (pct >= 40) return "text-yellow-400";
  if (pct >= 20) return "text-green-400";
  return dark ? "text-white/40" : "text-slate-400";
}
