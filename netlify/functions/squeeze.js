export async function handler(event, context) {
  const base = "https://fapi.binance.com/fapi/v1";
  const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT"];
  const results = [];

  try {
    for (const symbol of symbols) {
      const [priceRes, fundRes, oiRes, changeRes] = await Promise.all([
        fetch(`${base}/ticker/price?symbol=${symbol}`, { headers: { "User-Agent": "Mozilla/5.0" } }).then(r => r.json()),
        fetch(`${base}/fundingRate?symbol=${symbol}&limit=1`, { headers: { "User-Agent": "Mozilla/5.0" } }).then(r => r.json()),
        fetch(`${base}/openInterest?symbol=${symbol}`, { headers: { "User-Agent": "Mozilla/5.0" } }).then(r => r.json()),
        fetch(`${base}/ticker/24hr?symbol=${symbol}`, { headers: { "User-Agent": "Mozilla/5.0" } }).then(r => r.json())
      ]);

      const funding = parseFloat(fundRes[0]?.fundingRate || 0);
      const oi = parseFloat(oiRes.openInterest || 0);
      const change = parseFloat(changeRes.priceChangePercent || 0);
      const price = parseFloat(priceRes.price || 0);

      const signal = (funding < 0 && change < 5)
        ? "🟢 POSSIBLE SQUEEZE"
        : "-";

      results.push({ symbol, price, funding, oi, change, signal });
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message })
    };
  }
}
