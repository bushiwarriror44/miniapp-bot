const CRYPTO_IDS = ["bitcoin", "ethereum", "the-open-network", "solana", "binancecoin"] as const;

export type CryptoId = (typeof CRYPTO_IDS)[number];

export type CryptoPriceItem = {
  id: CryptoId;
  symbol: string;
  name: string;
  usd: number;
  usd_24h_change?: number;
};

const META: Record<CryptoId, { symbol: string; name: string }> = {
  bitcoin: { symbol: "BTC", name: "Bitcoin" },
  ethereum: { symbol: "ETH", name: "Ethereum" },
  "the-open-network": { symbol: "TON", name: "Toncoin" },
  solana: { symbol: "SOL", name: "Solana" },
  binancecoin: { symbol: "BNB", name: "BNB" },
};

/** Символы пар на Binance (USDT) */
const BINANCE_SYMBOLS: Record<CryptoId, string> = {
  bitcoin: "BTCUSDT",
  ethereum: "ETHUSDT",
  "the-open-network": "TONUSDT",
  solana: "SOLUSDT",
  binancecoin: "BNBUSDT",
};

type BinanceTickerRow = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
};

export async function fetchCryptoPrices(): Promise<CryptoPriceItem[]> {
  const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
  if (!res.ok) throw new Error("Failed to fetch crypto prices");
  const rows = (await res.json()) as BinanceTickerRow[];
  const bySymbol = Object.fromEntries(rows.map((r) => [r.symbol, r]));

  return CRYPTO_IDS.map((id) => {
    const row = bySymbol[BINANCE_SYMBOLS[id]];
    const meta = META[id];
    const usd = row ? parseFloat(row.lastPrice) : 0;
    const pct = row?.priceChangePercent ? parseFloat(row.priceChangePercent) : undefined;
    return {
      id,
      symbol: meta.symbol,
      name: meta.name,
      usd,
      usd_24h_change: pct,
    };
  });
}
