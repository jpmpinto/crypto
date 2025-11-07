export async function handler() {
  const API_KEY = "54c4c521-b4fa-481d-a858-3353c1986c2d";
  const symbols = [
    "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT",
    "DOGEUSDT", "ADAUSDT", "AVAXUSDT", "LINKUSDT", "MATICUSDT"
  ];

  const headers = { "coinglassSecret": API_KEY };

  try {
    // Executa todas as chamadas em paralelo com Promise.allSettled (não falha se uma falhar)
    const responses = await Promise.allSettled(
      symbols.map(sym =>
        fetch(`https://open-api.coinglass.com/api/futures/openInterest/chart?symbol=${sym}`, { headers })
          .then(r => r.ok ? r.json() : Promise.reject(`Erro HTTP ${r.status}`))
      )
    );

    const results = responses.map((res, i) => {
      const symbol = symbols[i];
      if (res.status !== "fulfilled" || !res.value?.data?.length) {
        return { symbol, error: "Sem dados válidos" };
      }

      // Extrai último valor da série
      const latest = res.value.data.at(-1) || {};
      const oi = Number(latest.openInterest || 0);
      const funding = Number(latest.fundingRate || 0);
      const change = Number(latest.priceChangePercent24h || 0);
      const oiChange = Number(latest.openInterestChangePercent || 0);
      const price = Number(latest.price || 0);

      // Regras do sinal
      const signal =
        oiChange > 0 && funding < 0 && change < 5
          ? "🟢 POSSIBLE SQUEEZE"
          : funding > 0 && oiChange < 0
          ? "🔴 COOLING"
          : "-";

      return { symbol, price, oi, oiChange, funding, change, signal };
    });

    // Remove linhas totalmente vazias
    const filtered = results.filter(r => !r.error || r.error !== "Sem dados válidos");

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          total: filtered.length,
          results: filtered,
        },
        null,
        2
      ),
    };

  } catch (error) {
    // Captura qualquer erro imprevisto
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Erro crítico: " + error.message || error }),
    };
  }
}
