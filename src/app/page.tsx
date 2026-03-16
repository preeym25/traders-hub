"use client";

import { useState } from "react";
import { Trade } from "@/lib/types/trade";
import { TradeLedger } from "@/components/TradeLedger";
import { TradeEntryForm } from "@/components/TradeEntryForm";

const MOCK_TRADES: Trade[] = [
  { id: "1", asset: "BTC/USD", direction: "LONG", entryPrice: 67432.1250, exitPrice: 69100.5000, quantity: 0.5, pnl: 834.1875, openedAt: "2026-03-10T09:00:00Z", closedAt: "2026-03-11T14:30:00Z" },
  { id: "2", asset: "ETH/USD", direction: "SHORT", entryPrice: 3812.4400, exitPrice: 3650.2200, quantity: 2.0, pnl: 324.4400, openedAt: "2026-03-09T11:00:00Z", closedAt: "2026-03-10T08:15:00Z" },
  { id: "3", asset: "SOL/USD", direction: "LONG", entryPrice: 142.8800, exitPrice: 138.1200, quantity: 10, pnl: -47.6000, openedAt: "2026-03-08T16:00:00Z", closedAt: "2026-03-09T03:00:00Z" },
  { id: "4", asset: "AAPL", direction: "LONG", entryPrice: 178.2300, exitPrice: 182.9100, quantity: 15, pnl: 70.2000, openedAt: "2026-03-07T14:30:00Z", closedAt: "2026-03-08T20:00:00Z" },
  { id: "5", asset: "TSLA", direction: "SHORT", entryPrice: 245.6700, exitPrice: 252.1100, quantity: 5, pnl: -32.2000, openedAt: "2026-03-06T09:30:00Z", closedAt: "2026-03-07T15:00:00Z" },
  { id: "6", asset: "EUR/USD", direction: "LONG", entryPrice: 1.0832, exitPrice: 1.0891, quantity: 10000, pnl: 59.0000, openedAt: "2026-03-05T07:00:00Z", closedAt: "2026-03-05T19:00:00Z" },
  { id: "7", asset: "GBP/JPY", direction: "SHORT", entryPrice: 191.4500, exitPrice: 189.8200, quantity: 5000, pnl: 8150.0000, openedAt: "2026-03-04T03:00:00Z", closedAt: "2026-03-04T22:00:00Z" },
  { id: "8", asset: "NVDA", direction: "LONG", entryPrice: 875.3200, exitPrice: 901.4400, quantity: 3, pnl: 78.3600, openedAt: "2026-03-03T14:30:00Z", closedAt: "2026-03-04T20:00:00Z" },
  { id: "9", asset: "XAU/USD", direction: "LONG", entryPrice: 2165.4000, exitPrice: 2198.8000, quantity: 1, pnl: 33.4000, openedAt: "2026-03-02T08:00:00Z", closedAt: "2026-03-03T16:00:00Z" },
  { id: "10", asset: "BTC/USD", direction: "SHORT", entryPrice: 69200.0000, exitPrice: null, quantity: 0.25, pnl: null, openedAt: "2026-03-12T10:00:00Z", closedAt: null },
  { id: "11", asset: "DOGE/USD", direction: "LONG", entryPrice: 0.1423, exitPrice: null, quantity: 50000, pnl: null, openedAt: "2026-03-13T12:00:00Z", closedAt: null },
  { id: "12", asset: "META", direction: "LONG", entryPrice: 502.1100, exitPrice: 515.6700, quantity: 4, pnl: 54.2400, openedAt: "2026-03-01T14:30:00Z", closedAt: "2026-03-02T20:00:00Z" },
  { id: "13", asset: "AMZN", direction: "SHORT", entryPrice: 182.5500, exitPrice: 179.3300, quantity: 8, pnl: 25.7600, openedAt: "2026-02-28T09:30:00Z", closedAt: "2026-03-01T15:00:00Z" },
  { id: "14", asset: "CL/USD", direction: "LONG", entryPrice: 78.4200, exitPrice: 76.9100, quantity: 100, pnl: -151.0000, openedAt: "2026-02-27T07:00:00Z", closedAt: "2026-02-28T19:00:00Z" },
  { id: "15", asset: "NQ/USD", direction: "LONG", entryPrice: 18245.5000, exitPrice: 18412.2500, quantity: 2, pnl: 333.5000, openedAt: "2026-02-26T14:30:00Z", closedAt: "2026-02-27T20:00:00Z" },
  { id: "16", asset: "ADA/USD", direction: "SHORT", entryPrice: 0.6230, exitPrice: 0.5980, quantity: 20000, pnl: 500.0000, openedAt: "2026-02-25T11:00:00Z", closedAt: "2026-02-26T08:00:00Z" },
];

export default function Home() {
  const [trades, setTrades] = useState<Trade[]>(MOCK_TRADES);

  const handleNewTrade = (data: Omit<Trade, "id" | "exitPrice" | "pnl" | "openedAt" | "closedAt">) => {
    const newTrade: Trade = {
      ...data,
      id: crypto.randomUUID(),
      exitPrice: null,
      pnl: null,
      openedAt: new Date().toISOString(),
      closedAt: null,
    };
    setTrades((prev) => [newTrade, ...prev]);
  };

  return (
    <div className="flex flex-col gap-2 p-2 sm:p-4 max-w-5xl mx-auto font-mono">
      <header className="flex items-center justify-between py-1 px-1.5 border-b border-white/10">
        <h1 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-white/70">
          Traders Hub <span className="text-green-500">/ Ledger</span>
        </h1>
        <span className="text-[9px] sm:text-[10px] text-white/30 uppercase tracking-wider">
          {trades.length} trades
        </span>
      </header>

      <TradeEntryForm onSubmit={handleNewTrade} />
      <TradeLedger trades={trades} />
    </div>
  );
}
