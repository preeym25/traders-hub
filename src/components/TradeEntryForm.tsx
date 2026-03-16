"use client";

import { useState } from "react";
import { Trade } from "@/lib/types/trade";

export function TradeEntryForm({ onSubmit }: { onSubmit: (trade: Omit<Trade, "id" | "exitPrice" | "pnl" | "openedAt" | "closedAt">) => void }) {
  const [asset, setAsset] = useState("");
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [entryPrice, setEntryPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      asset: asset.toUpperCase(),
      direction,
      entryPrice: parseFloat(entryPrice),
      quantity: parseFloat(quantity),
    });
    setAsset("");
    setEntryPrice("");
    setQuantity("");
  };

  return (
    <form onSubmit={handleSubmit} className="px-2 py-1.5 border border-white/10 rounded-sm bg-[#020617] backdrop-blur-md flex flex-wrap gap-2 items-end font-mono text-[10px] sm:text-xs">
      <label className="flex flex-col gap-0.5 w-20 flex-1 min-w-[80px]">
        <span className="text-white/40 uppercase tracking-widest text-[9px] font-bold">Asset</span>
        <input required value={asset} onChange={e => setAsset(e.target.value)} placeholder="BTC/USD" className="bg-transparent border-b border-white/10 px-0.5 py-0.5 text-white/90 outline-none focus:border-green-500 uppercase placeholder:text-white/20 transition-colors"/>
      </label>
      
      <label className="flex flex-col gap-0.5 w-16">
        <span className="text-white/40 uppercase tracking-widest text-[9px] font-bold">Dir</span>
        <select value={direction} onChange={e => setDirection(e.target.value as "LONG" | "SHORT")} className="bg-[#020617] border-b border-white/10 px-0.5 py-0.5 text-white/90 outline-none focus:border-green-500 cursor-pointer">
          <option value="LONG" className="text-green-500">LONG</option>
          <option value="SHORT" className="text-red-500">SHORT</option>
        </select>
      </label>

      <label className="flex flex-col gap-0.5 w-24">
        <span className="text-white/40 uppercase tracking-widest text-[9px] font-bold">Entry Price</span>
        <input required type="number" step="0.0001" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} placeholder="0.0000" className="bg-transparent border-b border-white/10 px-0.5 py-0.5 text-white/90 outline-none focus:border-green-500 placeholder:text-white/20 text-right appearance-none"/>
      </label>

      <label className="flex flex-col gap-0.5 w-20">
        <span className="text-white/40 uppercase tracking-widest text-[9px] font-bold">Size (Qty)</span>
        <input required type="number" step="0.0001" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0.00" className="bg-transparent border-b border-white/10 px-0.5 py-0.5 text-white/90 outline-none focus:border-green-500 placeholder:text-white/20 text-right appearance-none"/>
      </label>

      <button type="submit" className="ml-auto bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 px-4 py-1.5 uppercase tracking-widest transition-colors active:scale-95 font-bold rounded-sm h-[26px] flex items-center justify-center">
        Exe
      </button>
    </form>
  );
}
