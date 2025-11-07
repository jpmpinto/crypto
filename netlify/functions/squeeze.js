export async function handler() {
  const url = "https://open-api.coinglass.com/api/futures/openInterest/chart";
  const headers = { "coinglassSecret": "54c4c521-b4fa-481d-a858-3353c1986c2d" };

  try {
    const res = await fetch(url, { headers });
    const json = await res.json();

    if (!json.data || typeof json.data !== "object") {
      throw new Error("Sem dados da API Coinglass");
    }

    const results = Object.entries(json.data)
      .slice(0, 10)
      .map(([symbol, info]) => {
        const latest = info[info.length - 1];
        const oi = latest?.openInterest ?? 0;
        const price = latest?.price ?? 0;
        const change = latest?.priceChangePercent24h ?? 0;
        const funding = latest?.fundingRate ?? 0;
        const oiChange = latest?.openInterestChangePercent ?? 0;

        const signal =
          oiChange > 0 && funding < 0 && change < 5
            ? "🟢 POSSIBLE SQUEEZE"
            : "-";

        return { symbol, price, oi, oiChange, funding, change, signal };
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
