export async function handler(event, context) {
  const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT"];
  const results = [];

  try {
    for (const symbol of symbols) {
      const [priceRes, fundRes, oiRes, changeRes] = await Promise.all([
        fetch(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`).then(r => r.json()),
        fetch(`https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}&limit=1`).then(r => r.json()),
        fetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`).then(r => r.json()),
        fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`).then(r => r.json())
      ]);

      const funding = parseFloat(fundRes[0]?.fundingRate || 0);
      const oi = parseFloat(oiRes.openInterest || 0);
      const change = parseFloat(changeRes.priceChangePercent || 0);

      const signal = (funding < 0 && change < 5)
        ? "🟢 POSSIBLE SQUEEZE"
        : "-";

      results.push({
        symbol,
        price: priceRes.price,
        funding,
        oi,
        change,
        signal
      });
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
