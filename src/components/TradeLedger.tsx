import { Trade } from "@/lib/types/trade";
import { formatPnl, formatPrice } from "@/lib/utils/formatters";

interface TradeLedgerProps {
  trades: Trade[];
}

export function TradeLedger({ trades }: TradeLedgerProps) {
  return (
    <div className="w-full overflow-x-auto border border-white/10 rounded-sm bg-[#020617] backdrop-blur-md">
      <table className="w-full text-left text-[10px] sm:text-xs font-mono border-collapse">
        <thead className="bg-white/5 border-b border-white/10 text-white/50 uppercase">
          <tr>
            <th className="py-1 px-1.5 font-semibold tracking-wider">Asset</th>
            <th className="py-1 px-1.5 font-semibold tracking-wider">Dir</th>
            <th className="py-1 px-1.5 font-semibold text-right tracking-wider">Entry</th>
            <th className="py-1 px-1.5 font-semibold text-right tracking-wider">Exit</th>
            <th className="py-1 px-1.5 font-semibold text-right tracking-wider">Qty</th>
            <th className="py-1 px-1.5 font-semibold text-right tracking-wider">P/L</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {trades.map((trade) => {
            const isActive = trade.exitPrice === null;
            const pnl = trade.pnl ?? 0;
            const pnlColor = isActive ? "text-yellow-400" : pnl > 0 ? "text-green-500" : pnl < 0 ? "text-red-500" : "text-white/50";
            
            return (
              <tr key={trade.id} className="hover:bg-white/5 transition-colors group">
                <td className="py-1 px-1.5 text-white/90 font-medium">{trade.asset}</td>
                <td className={`py-1 px-1.5 font-medium ${trade.direction === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>{trade.direction}</td>
                <td className="py-1 px-1.5 text-right text-white/80">{formatPrice(trade.entryPrice)}</td>
                <td className="py-1 px-1.5 text-right text-white/80">{isActive ? "ACTIVE" : formatPrice(trade.exitPrice!)}</td>
                <td className="py-1 px-1.5 text-right text-white/80">{trade.quantity}</td>
                <td className={`py-1 px-1.5 text-right font-medium ${pnlColor}`}>
                  {isActive ? "---" : (pnl > 0 ? "+" : "") + formatPnl(pnl)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
