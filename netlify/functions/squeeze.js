export async function handler() {
  const symbols = [
    "BTCUSDT", "ETHUSDT", "SOLUSDT",
    "BNBUSDT", "XRPUSDT", "DOGEUSDT",
    "LINKUSDT", "AVAXUSDT", "ADAUSDT"
  ];

  const base = "https://api2.bybit.com/v5/market";
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "application/json"
  };

  try {
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        const [oiRes, fundRes, tickerRes] = await Promise.all([
          fetch(`${base}/open-interest?category=linear&symbol=${symbol}`, { headers }).then(r => r.json()),
          fetch(`${base}/funding-rate?symbol=${symbol}`, { headers }).then(r => r.json()),
          fetch(`${base}/tickers?category=linear&symbol=${symbol}`, { headers }).then(r => r.json())
        ]);

        const oi = parseFloat(oiRes?.result?.list?.[0]?.openInterest || 0);
        const funding = parseFloat(fundRes?.result?.list?.[0]?.fundingRate || 0);
        const change = parseFloat(tickerRes?.result?.list?.[0]?.price24hPcnt || 0) * 100;
        const price = parseFloat(tickerRes?.result?.list?.[0]?.lastPrice || 0);

        const signal =
          oi > 0 && funding < 0 && Math.abs(change) < 5
            ? "🟢 POSSIBLE SQUEEZE"
            : funding > 0 && change > 0
            ? "🔴 COOLING"
            : "-";

        return { symbol, price, oi, funding, change: change.toFixed(2), signal };
      })
    );

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        results,
      }, null, 2),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }),
    };
  }
}
