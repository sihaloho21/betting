import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, TrendingUp, TrendingDown } from "lucide-react";

interface Histori {
  id: string; tanggal: string; hasil: "MENANG" | "KALAH";
  putaran: number; profit: number; rugi: number;
}

function parseIdDate(tanggal: string): Date {
  const m = tanggal.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  const d = new Date(tanggal);
  return isNaN(d.getTime()) ? new Date() : d;
}

const HARI  = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function formatRupiahLocal(v: number) { return new Intl.NumberFormat("id-ID").format(v || 0); }

export default function Kalender({ histori, isDark }: { histori: Histori[]; isDark: boolean }) {
  const [month, setMonth] = useState(() => new Date());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const year = month.getFullYear();
  const mi   = month.getMonth();

  const sessionMap = useMemo(() => {
    const map: Record<string, Histori[]> = {};
    histori.forEach(h => {
      const d = parseIdDate(h.tanggal);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(h);
    });
    return map;
  }, [histori]);

  function dayKey(d: number) { return `${year}-${mi}-${d}`; }
  function daySessions(d: number) { return sessionMap[dayKey(d)] || []; }
  function dayStatus(d: number) {
    const s = daySessions(d);
    if (!s.length) return "none";
    const w = s.some(x => x.hasil === "MENANG");
    const l = s.some(x => x.hasil === "KALAH");
    if (w && l) return "mixed";
    return w ? "menang" : "kalah";
  }

  const firstDay    = new Date(year, mi, 1).getDay();
  const daysInMonth = new Date(year, mi + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = (() => { const t = new Date(); return `${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`; })();

  const selectedSessions = selectedKey ? (sessionMap[selectedKey] || []) : [];

  const monthlyStats = useMemo(() => {
    let menang = 0, kalah = 0, profit = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      daySessions(d).forEach(s => {
        if (s.hasil === "MENANG") { menang++; profit += s.profit; }
        else { kalah++; profit -= s.rugi; }
      });
    }
    return { menang, kalah, profit };
  }, [sessionMap, year, mi, daysInMonth]);

  const card = isDark
    ? "bg-slate-900/80 border border-white/10 rounded-[20px]"
    : "bg-white border border-slate-200 rounded-[20px] shadow-sm";

  return (
    <div className="animate-slide-up space-y-4">
      <div className={`${card} p-5`}>
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => setMonth(new Date(year, mi - 1, 1))} className={`p-2 rounded-xl ${isDark ? "bg-white/10 hover:bg-white/20" : "bg-slate-100 hover:bg-slate-200"}`}>
            <ChevronLeft className="w-5 h-5"/>
          </button>
          <div className="text-center">
            <h2 className="text-xl font-black">{BULAN[mi]} {year}</h2>
            <div className={`text-xs mt-0.5 flex items-center justify-center gap-3 ${isDark ? "text-white/40" : "text-slate-400"}`}>
              <span className="text-green-400 font-bold">{monthlyStats.menang}W</span>
              <span className="text-red-400 font-bold">{monthlyStats.kalah}L</span>
              <span className={`font-bold ${monthlyStats.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                {monthlyStats.profit >= 0 ? "+" : ""}Rp {formatRupiahLocal(Math.abs(monthlyStats.profit))}
              </span>
            </div>
          </div>
          <button onClick={() => setMonth(new Date(year, mi + 1, 1))} className={`p-2 rounded-xl ${isDark ? "bg-white/10 hover:bg-white/20" : "bg-slate-100 hover:bg-slate-200"}`}>
            <ChevronRight className="w-5 h-5"/>
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {HARI.map(h => (
            <div key={h} className={`text-center text-[11px] font-bold py-1 ${isDark ? "text-white/30" : "text-slate-400"}`}>{h}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const status  = dayStatus(day);
            const dk      = dayKey(day);
            const isToday = dk === todayKey;
            const isSel   = selectedKey === dk;
            const count   = daySessions(day).length;
            const dayProfit = daySessions(day).reduce((s, h) => s + (h.hasil === "MENANG" ? h.profit : -h.rugi), 0);

            return (
              <button key={i} onClick={() => setSelectedKey(isSel ? null : dk)}
                className={`relative flex flex-col items-center justify-center rounded-xl py-2 transition-all min-h-[50px]
                  ${isSel ? "ring-2 ring-blue-500" : ""}
                  ${status === "menang" ? isDark ? "bg-green-500/20 hover:bg-green-500/30" : "bg-green-50 hover:bg-green-100" :
                    status === "kalah"  ? isDark ? "bg-red-500/20 hover:bg-red-500/30"     : "bg-red-50 hover:bg-red-100" :
                    status === "mixed"  ? isDark ? "bg-yellow-500/20 hover:bg-yellow-500/30" : "bg-yellow-50 hover:bg-yellow-100" :
                    isDark ? "hover:bg-white/5" : "hover:bg-slate-50"}`}>
                <span className={`text-sm font-bold ${
                  isToday ? "text-blue-400" :
                  status === "menang" ? "text-green-400" :
                  status === "kalah"  ? "text-red-400" :
                  status === "mixed"  ? "text-yellow-400" :
                  isDark ? "text-white/60" : "text-slate-600"
                }`}>{day}</span>
                {count > 0 && (
                  <span className={`text-[9px] font-black leading-none mt-0.5 ${
                    status === "menang" ? "text-green-400" : status === "kalah" ? "text-red-400" : "text-yellow-400"
                  }`}>{count}x</span>
                )}
                {count > 0 && (
                  <span className={`text-[8px] leading-none ${dayProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {dayProfit >= 0 ? "+" : ""}{Math.abs(dayProfit) >= 1000 ? `${Math.round(dayProfit/1000)}k` : dayProfit}
                  </span>
                )}
                {isToday && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-400"/>}
              </button>
            );
          })}
        </div>

        <div className="flex gap-4 mt-4 pt-3 border-t border-current/10 text-xs">
          {[
            { dot:"bg-green-500", label:"Menang" },
            { dot:"bg-red-500",   label:"Kalah" },
            { dot:"bg-yellow-500",label:"Campuran" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${l.dot} opacity-70`}/>
              <span className={isDark ? "text-white/40" : "text-slate-400"}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedKey && (
        <div className={`${card} p-5 animate-slide-up`}>
          <h3 className="font-black mb-3 text-sm">{
            (() => { const parts = selectedKey.split("-"); return `${parseInt(parts[2])} ${BULAN[parseInt(parts[1])]} ${parts[0]}`; })()
          }</h3>
          {selectedSessions.length === 0 ? (
            <p className={`text-sm opacity-50 text-center py-6`}>Tidak ada sesi</p>
          ) : (
            <div className="space-y-2">
              {selectedSessions.map((s, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                  <div className="flex items-center gap-2">
                    {s.hasil === "MENANG"
                      ? <CheckCircle className="w-4 h-4 text-green-400"/>
                      : <XCircle className="w-4 h-4 text-red-400"/>}
                    <span className={`text-xs font-bold ${s.hasil === "MENANG" ? "text-green-400" : "text-red-400"}`}>{s.hasil}</span>
                    <span className={`text-xs ${isDark ? "text-white/50" : "text-slate-500"}`}>P{s.putaran} · {s.tanggal.split(",")[1]?.trim() || ""}</span>
                  </div>
                  <span className={`text-sm font-black ${s.hasil === "MENANG" ? "text-green-400" : "text-red-400"}`}>
                    {s.hasil === "MENANG" ? "+" : "-"}Rp {formatRupiahLocal(s.hasil === "MENANG" ? s.profit : s.rugi)}
                  </span>
                </div>
              ))}
              <div className={`flex justify-between pt-2 border-t ${isDark ? "border-white/10" : "border-slate-100"} text-sm font-black`}>
                <span className={isDark ? "text-white/60" : "text-slate-500"}>Total hari ini</span>
                <span className={selectedSessions.reduce((s, h) => s + (h.hasil === "MENANG" ? h.profit : -h.rugi), 0) >= 0 ? "text-green-400" : "text-red-400"}>
                  {(() => { const tot = selectedSessions.reduce((s, h) => s + (h.hasil === "MENANG" ? h.profit : -h.rugi), 0); return `${tot >= 0 ? "+" : ""}Rp ${formatRupiahLocal(Math.abs(tot))}`; })()}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {histori.length === 0 && (
        <div className={`${card} p-12 text-center`}>
          <TrendingUp className="w-12 h-12 mx-auto opacity-20 mb-3"/>
          <p className={`text-sm ${isDark ? "opacity-50" : "text-slate-400"}`}>Belum ada data. Mulai bermain untuk melihat riwayat kalender.</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label:"Hari Menang", val:Object.keys(sessionMap).filter(k => { const s = sessionMap[k]; return s.every(x => x.hasil === "MENANG"); }).length, color:"text-green-400", icon:<CheckCircle className="w-4 h-4"/> },
          { label:"Hari Kalah",  val:Object.keys(sessionMap).filter(k => { const s = sessionMap[k]; return s.every(x => x.hasil === "KALAH"); }).length,  color:"text-red-400",   icon:<XCircle className="w-4 h-4"/> },
          { label:"Hari Aktif",  val:Object.keys(sessionMap).length, color:"text-blue-400", icon:<TrendingDown className="w-4 h-4"/> },
        ].map((s, i) => (
          <div key={i} className={`${card} p-4 flex flex-col gap-1`}>
            <div className={`flex items-center gap-1.5 text-xs ${isDark ? "text-white/40" : "text-slate-500"}`}>{s.icon}{s.label}</div>
            <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
