export async function handler() {
  const url = "https://open-api.coinglass.com/public/v2/futures";
  const headers = { "coinglassSecret": "54c4c521-b4fa-481d-a858-3353c1986c2d" };

  try {
    const res = await fetch(`${url}/openInterest`, { headers });
    const json = await res.json();
    if (!json.data) throw new Error("Sem dados da API Coinglass");

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
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
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
