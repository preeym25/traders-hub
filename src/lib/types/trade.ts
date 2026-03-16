export interface Trade {
  id: string;
  asset: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number | null; // null means active
  quantity: number;
  pnl: number | null; // calculated later or returned from db
  openedAt: string;
  closedAt: string | null;
}
