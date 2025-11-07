export async function handler() {
  const url = "https://open-api.coinglass.com/api/futures/openInterest";
  const headers = { "coinglassSecret": "54c4c521-b4fa-481d-a858-3353c1986c2d" };

  try {
    const res = await fetch(url, { headers });
    const json = await res.json();

    if (!json.data || !Array.isArray(json.data)) {
      throw new Error("A API Coinglass não devolveu dados válidos");
    }

    const results = json.data.slice(0, 10).map(d => {
      const signal =
        d.openInterestChangePercent > 0 &&
        d.fundingRate < 0 &&
        d.priceChangePercent24h < 5
          ? "🟢 POSSIBLE SQUEEZE"
          : "-";

      return {
        symbol: d.symbol,
        price: d.price,
        oi: d.openInterestUsd,
        oiChange: d.openInterestChangePercent,
        funding: d.fundingRate,
        change: d.priceChangePercent24h,
        signal,
      };
    });

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2),
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }),
    };
  }
}
