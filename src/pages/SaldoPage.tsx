import React, { useState, useMemo, useEffect } from "react";
import { PlusCircle, MinusCircle, Wallet, TrendingUp, TrendingDown, Trash2, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

interface Histori {
  id: string; tanggal: string; hasil: "MENANG" | "KALAH";
  putaran: number; profit: number; rugi: number;
}

interface Transaction {
  id: string; type: "deposit" | "withdraw"; amount: number;
  note: string; tanggal: string;
}

function fmt(v: number) { return new Intl.NumberFormat("id-ID").format(v || 0); }
function ls<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export default function SaldoPage({
  saldo, onSaldoChange, histori, isDark,
}: {
  saldo: number;
  onSaldoChange: (v: number) => void;
  histori: Histori[];
  isDark: boolean;
}) {
  const [txList, setTxList]       = useState<Transaction[]>(() => ls("saldo_tx", []));
  const [txType, setTxType]       = useState<"deposit" | "withdraw">("deposit");
  const [txAmount, setTxAmount]   = useState("");
  const [txNote, setTxNote]       = useState("");
  const [filterType, setFilterType] = useState<"all" | "deposit" | "withdraw">("all");

  useEffect(() => { lsSet("saldo_tx", txList); }, [txList]);

  const totalDeposit   = txList.filter(t => t.type === "deposit").reduce((s, t) => s + t.amount, 0);
  const totalWithdraw  = txList.filter(t => t.type === "withdraw").reduce((s, t) => s + t.amount, 0);
  const totalProfit    = histori.reduce((s, h) => s + (h.hasil === "MENANG" ? h.profit : -h.rugi), 0);
  const netModal       = totalDeposit - totalWithdraw;
  const roi            = netModal > 0 ? ((totalProfit / netModal) * 100).toFixed(1) : "—";

  const chartData = useMemo(() => {
    const events: { date: string; delta: number; balance: number }[] = [];
    let bal = 0;
    [...txList].reverse().forEach(t => {
      bal += t.type === "deposit" ? t.amount : -t.amount;
      events.push({ date: t.tanggal.split(",")[0] || t.tanggal, delta: t.type === "deposit" ? t.amount : -t.amount, balance: bal });
    });
    return events.slice(-20);
  }, [txList]);

  function addTx() {
    const amount = parseInt(txAmount.replace(/\D/g, ""));
    if (!amount || amount <= 0) { toast.error("Masukkan nominal yang valid"); return; }
    if (txType === "withdraw" && amount > saldo) { toast.error("Nominal melebihi saldo"); return; }
    const tx: Transaction = {
      id: Date.now().toString(), type: txType, amount,
      note: txNote || (txType === "deposit" ? "Deposit" : "Withdraw"),
      tanggal: new Date().toLocaleString("id-ID"),
    };
    setTxList(prev => [tx, ...prev]);
    onSaldoChange(txType === "deposit" ? saldo + amount : saldo - amount);
    toast.success(`${txType === "deposit" ? "Deposit" : "Withdraw"} Rp ${fmt(amount)} berhasil`);
    setTxAmount(""); setTxNote("");
  }

  function deleteTx(id: string) {
    const tx = txList.find(t => t.id === id);
    if (!tx) return;
    if (!confirm(`Hapus transaksi ${tx.type} Rp ${fmt(tx.amount)}? Saldo tidak akan diubah.`)) return;
    setTxList(prev => prev.filter(t => t.id !== id));
    toast.success("Transaksi dihapus");
  }

  const card = isDark
    ? "bg-slate-900/80 border border-white/10 rounded-[20px]"
    : "bg-white border border-slate-200 rounded-[20px] shadow-sm";

  const filtered = txList.filter(t => filterType === "all" || t.type === filterType);

  return (
    <div className="animate-slide-up space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:"Saldo Saat Ini", val:`Rp ${fmt(saldo)}`, color:"bg-gradient-to-br from-green-600 to-emerald-700 text-white", big:true },
          { label:"Total Deposit",  val:`Rp ${fmt(totalDeposit)}`,  color:"text-blue-400", big:false },
          { label:"Total Withdraw", val:`Rp ${fmt(totalWithdraw)}`, color:"text-orange-400", big:false },
          { label:"ROI Taruhan",    val:roi === "—" ? "—" : `${roi}%`, color: typeof roi === "string" && roi !== "—" && +roi >= 0 ? "text-green-400" : "text-red-400", big:false },
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-[20px] ${i === 0 ? s.color : card}`}>
            <div className={`text-xs font-bold ${i === 0 ? "text-white/70" : isDark ? "opacity-50" : "text-slate-500"}`}>{s.label}</div>
            <div className={`text-xl font-black mt-1 ${i === 0 ? "" : s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`${card} p-5`}>
          <h3 className="font-black mb-4 text-sm">Deposit / Withdraw</h3>
          <div className={`flex gap-0 rounded-xl overflow-hidden border mb-4 ${isDark ? "border-white/10" : "border-slate-200"}`}>
            {(["deposit","withdraw"] as const).map(t => (
              <button key={t} onClick={() => setTxType(t)}
                className={`flex-1 py-2.5 font-bold text-xs capitalize transition-all flex items-center justify-center gap-1.5
                  ${txType === t ? t === "deposit" ? "bg-blue-600 text-white" : "bg-red-600 text-white" : isDark ? "bg-white/5 text-white/50" : "text-slate-400"}`}>
                {t === "deposit" ? <ArrowDownLeft className="w-3.5 h-3.5"/> : <ArrowUpRight className="w-3.5 h-3.5"/>}
                {t === "deposit" ? "Deposit" : "Withdraw"}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <div>
              <label className={`text-xs font-bold block mb-1 ${isDark ? "text-white/50" : "text-slate-500"}`}>Nominal (Rp)</label>
              <input type="text" inputMode="numeric" value={txAmount} placeholder="0"
                onChange={e => setTxAmount(e.target.value.replace(/\D/g, ""))}
                className={`w-full rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? "bg-white/10 border border-white/20 text-white" : "bg-slate-50 border border-slate-300 text-slate-900"}`}/>
              {txAmount && (
                <div className={`text-xs mt-1 font-bold ${isDark ? "text-white/40" : "text-slate-400"}`}>
                  Rp {fmt(parseInt(txAmount.replace(/\D/g, "") || "0"))}
                </div>
              )}
            </div>
            <div>
              <label className={`text-xs font-bold block mb-1 ${isDark ? "text-white/50" : "text-slate-500"}`}>Keterangan (opsional)</label>
              <input type="text" value={txNote} placeholder={txType === "deposit" ? "Isi saldo" : "Tarik saldo"} onChange={e => setTxNote(e.target.value)}
                className={`w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? "bg-white/10 border border-white/20 text-white" : "bg-slate-50 border border-slate-300 text-slate-900"}`}/>
            </div>
            <button onClick={addTx}
              className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95
                ${txType === "deposit" ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white" : "bg-gradient-to-r from-red-600 to-orange-600 text-white"}`}>
              {txType === "deposit" ? <><PlusCircle className="w-4 h-4"/>Tambah Deposit</> : <><MinusCircle className="w-4 h-4"/>Withdraw</>}
            </button>
          </div>
        </div>

        <div className={`${card} p-5`}>
          <h3 className="font-black mb-3 text-sm">Ringkasan Keuangan</h3>
          <div className="space-y-2.5">
            {[
              { label:"Total Modal Masuk", val:`Rp ${fmt(totalDeposit)}`, color:"text-blue-400", icon:<ArrowDownLeft className="w-3.5 h-3.5 text-blue-400"/> },
              { label:"Total Modal Keluar", val:`Rp ${fmt(totalWithdraw)}`, color:"text-orange-400", icon:<ArrowUpRight className="w-3.5 h-3.5 text-orange-400"/> },
              { label:"Modal Bersih (Deposited - Withdrawn)", val:`Rp ${fmt(netModal)}`, color:netModal >= 0 ? "text-green-400" : "text-red-400", icon:<Wallet className="w-3.5 h-3.5"/> },
              { label:"Profit Dari Taruhan", val:`${totalProfit >= 0 ? "+" : ""}Rp ${fmt(Math.abs(totalProfit))}`, color:totalProfit >= 0 ? "text-green-400" : "text-red-400", icon:totalProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-green-400"/> : <TrendingDown className="w-3.5 h-3.5 text-red-400"/> },
              { label:"Saldo Saat Ini", val:`Rp ${fmt(saldo)}`, color:"text-white", icon:<Wallet className="w-3.5 h-3.5"/> },
            ].map((s, i) => (
              <div key={i} className={`flex justify-between items-center py-2 ${i < 4 ? "border-b " + (isDark ? "border-white/5" : "border-slate-50") : "font-black"}`}>
                <div className="flex items-center gap-1.5">
                  {s.icon}
                  <span className={`text-xs ${isDark ? "text-white/50" : "text-slate-500"}`}>{s.label}</span>
                </div>
                <span className={`text-sm font-bold ${s.color}`}>{s.val}</span>
              </div>
            ))}
          </div>
          {chartData.length > 0 && (
            <div className="mt-4">
              <div className={`text-xs font-bold mb-2 ${isDark ? "text-white/40" : "text-slate-400"}`}>Riwayat Saldo</div>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}/>
                  <XAxis dataKey="date" hide/>
                  <YAxis hide/>
                  <Tooltip contentStyle={{ background:isDark?"#1e293b":"#fff", border:"1px solid rgba(99,102,241,0.3)", borderRadius:8, fontSize:11 }} formatter={(v:number) => [`Rp ${fmt(v)}`, "Saldo"]}/>
                  <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className={`${card} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-sm">Riwayat Transaksi ({txList.length})</h3>
          <div className={`flex rounded-xl overflow-hidden border ${isDark ? "border-white/10" : "border-slate-200"}`}>
            {(["all","deposit","withdraw"] as const).map(f => (
              <button key={f} onClick={() => setFilterType(f)}
                className={`px-3 py-1.5 text-xs font-bold transition-all capitalize ${filterType === f ? "bg-blue-600 text-white" : isDark ? "bg-white/5 text-white/50" : "text-slate-400"}`}>
                {f === "all" ? "Semua" : f === "deposit" ? "Deposit" : "Withdraw"}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <div className="text-center py-10 opacity-40 text-sm">Belum ada transaksi</div>
          )}
          {filtered.map(tx => (
            <div key={tx.id} className={`flex items-center justify-between p-3 rounded-xl group ${isDark ? "bg-white/5 hover:bg-white/8" : "bg-slate-50 hover:bg-slate-100"}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === "deposit" ? "bg-blue-500/20" : "bg-red-500/20"}`}>
                  {tx.type === "deposit" ? <ArrowDownLeft className="w-4 h-4 text-blue-400"/> : <ArrowUpRight className="w-4 h-4 text-red-400"/>}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{tx.note}</div>
                  <div className={`text-[10px] ${isDark ? "text-white/30" : "text-slate-400"}`}>{tx.tanggal}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-sm font-black ${tx.type === "deposit" ? "text-blue-400" : "text-red-400"}`}>
                  {tx.type === "deposit" ? "+" : "-"}Rp {fmt(tx.amount)}
                </span>
                <button onClick={() => deleteTx(tx.id)}
                  className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all ${isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-slate-200 text-slate-400"}`}>
                  <Trash2 className="w-3.5 h-3.5"/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
