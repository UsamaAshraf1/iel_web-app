const supabaseUrl = "https://bfxmfaakufrmzcxhtgfw.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmeG1mYWFrdWZybXpjeGh0Z2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MTQzMTIsImV4cCI6MjA3NTM5MDMxMn0.qtNn0qXNhn8ol8fTSb2Hp9nQkYfFA2Y_Zec4LuISPZQ";

let supabaseClient = null;

function initSupabase() {
  if (typeof supabase === "undefined") {
    console.warn("supabase global not ready yet, waiting...");
    setTimeout(initSupabase, 100);
    return;
  }

  const { createClient } = supabase;
  supabaseClient = createClient(supabaseUrl, supabaseKey);
  console.log("Supabase client initialized!", supabaseClient);
}

initSupabase();

function formatVolume(volume) {
  if (volume == null || isNaN(volume)) {
    return "—"; // or "N/A" or ""
  }

  const abs = Math.abs(volume);

  if (abs >= 1_000_000_000) {
    return (volume / 1_000_000_000).toFixed(2) + "B";
  }
  if (abs >= 1_000_000) {
    return (volume / 1_000_000).toFixed(2) + "M";
  }
  if (abs >= 1_000) {
    return (volume / 1_000).toFixed(1) + "K";
  }

  // Small numbers → just comma-separated
  return volume.toLocaleString();
}
async function getTopStocks() {
  try {
    const { data, error } = await supabaseClient
      .from("stock_volumes")
      .select("*")
      .order("timestamp", { ascending: false }) // newest first
      .limit(10);

    if (error) {
      console.error("Error fetching messages:", error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data, error: null };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: err.message, data: null };
  }
}

// ────────────────────────────────────────────────
// Render the stocks inside the card
// ────────────────────────────────────────────────
async function loadTopStocks() {
  const container = document.getElementById("stocks-container");
  container.innerHTML =
    '<p class="text-center text-gray-500 py-10">Loading...</p>';

  const result = await getTopStocks();

  if (!result.success) {
    container.innerHTML = `<p class="text-red-600 text-center py-10">Error: ${result.error}</p>`;
    return;
  }

  if (result.data.length === 0) {
    container.innerHTML =
      '<p class="text-center text-gray-500 py-10">No recent stock data found</p>';
    return;
  }

  // Clear and build list
  container.innerHTML = "";

  result.data.forEach((stock) => {
    // Placeholder change % (you can compute real change if you store prev price)
    // For demo: random-ish based on volume or fixed
    const Volume = stock?.volume; // -10% to +10%
    const formattedVolume = formatVolume(Volume);
    const isPositive = parseFloat(Volume) >= 0;

    function getColorFromSymbol(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const colors = [
        "#3B82F6",
        "#8B5CF6",
        "#EC4899",
        "#F59E0B",
        "#10B981",
        "#6366F1",
        "#EF4444",
        "#14B8A6",
        "#F97316",
        "#06B6D4",
        "#A855F7",
        "#22D3EE",
        "#84CC16",
        "#F43F5E",
        "#06B6D4",
        "#6366F1",
      ];
      return colors[Math.abs(hash) % colors.length];
    }

    const symbolClean = (stock.symbol || "?")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    const displayText = symbolClean.length > 0 ? symbolClean : "N/A";

    // Adjust font size based on length (similar logic to React Native version)
    const logoSize = 52;
    let fontSize = logoSize * 0.35;
    if (displayText.length === 4) fontSize = logoSize * 0.28;
    else if (displayText.length > 4) fontSize = logoSize * 0.22;

    const bgColor = getColorFromSymbol(symbolClean || "UNKNOWN");

    const item = document.createElement("div");
    item.className = `flex justify-between items-center mt-[12px] px-[12px] py-[18px] border-x-[0.58px] border-t-[0.58px] md:border-x-0 md:border-t-0 border-b-[0.56px] border-[#F0F0F0] rounded-[14px] md:rounded-none last:border-b-0`;

    item.innerHTML = `
            <div class="flex items-center">
             <div style="
        width: ${logoSize}px;
        height: ${logoSize}px;
        background-color: ${bgColor};
        border-radius: 9999px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        flex-shrink: 0;
      ">
        <span style="
          color: white;
          font-weight: 600;
          font-size: ${fontSize}px;
          line-height: 1;
          letter-spacing: -0.5px;
        ">${displayText}</span>
      </div>
              <p class="ml-[14px] font-[600] text-[16px] leading-[24px] text-[#0B1B0C]">
                ${stock.symbol}
              </p>
            </div>
            <div class="flex flex-col justify-end items-end">
              <p class="font-[600] text-[16px] leading-[24px] text-[#0B1B0C]">
                PKR ${(stock.close_price || 0).toFixed(2)}
              </p>
              <div class="flex justify-center items-center font-[600] text-[12px] leading-[18px] mt-[8px]  py-[3px] rounded-[6px] ${
                isPositive ? "text-[#3FB950] " : "text-[#E00000]"
              }">
            
                ${formattedVolume}
              </div>
            </div>
          `;

    container.appendChild(item);
  });
}

loadTopStocks();
