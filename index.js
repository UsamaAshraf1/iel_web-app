const hamburger = document.querySelector(".md\\:hidden");
const mobileMenu = document.getElementById("mobile-menu");

if (hamburger && mobileMenu) {
  hamburger.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

const symbolInput = document.getElementById("symbolInput");
const dropdown = document.getElementById("symbolDropdown");
const yearSelect = document.getElementById("investmentYear");
let debounceTimer;

function populateYears() {
  const select = document.getElementById("investmentYear");
  const currentYear = new Date().getFullYear();

  for (let i = 1; i <= 5; i++) {
    const year = currentYear - i;
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    option.classList.add("text-[#0B1B0C]");
    select.appendChild(option);
  }

  if (currentYear >= 2024) {
    yearSelect.value = "2024";
  } else {
    yearSelect.value = currentYear.toString(); // fallback
  }
}

populateYears();

// 2. Symbol search with API

symbolInput.addEventListener("input", function () {
  clearTimeout(debounceTimer);

  const query = this.value.trim();

  if (query.length < 2) {
    dropdown.innerHTML = "";
    dropdown.classList.add("hidden");
    return;
  }

  debounceTimer = setTimeout(async () => {
    try {
      const response = await fetch(
        "https://ielapis.u2ventures.io/api/psxApi/search/all-stocks/",
      );

      if (!response.ok) throw new Error("API error");

      const data = await response.json();

      console.log(data);
      // Filter stocks based on search query
      const filtered = data?.stocks.filter((stock) => {
        const search = query.toLowerCase();
        return (
          stock.symbol?.toLowerCase().includes(search) ||
          stock.name?.toLowerCase().includes(search)
        );
      });

      dropdown.innerHTML = "";

      if (filtered.length === 0) {
        dropdown.innerHTML =
          '<div class="p-4 text-gray-400">No matches found</div>';
      } else {
        filtered.slice(0, 20).forEach((stock) => {
          const item = document.createElement("div");
          item.className =
            "px-4 py-3 hover:bg-[#3FB9501A] cursor-pointer transition flex justify-between items-center";

          const symbol = stock.symbol || "N/A";
          const name = stock.name || "Unknown";

          item.innerHTML = `
            <div class="flex justify-between items-center w-full">
              <div class="font-[600] text-[16px] leading-[24px] text-[#0B1B0C]">${symbol}</div>
              <div class="bg-[#3FB9501A] h-[24px] w-[64px] px-[4px] rounded-[6px] flex justify-center items-center text-[#3FB950] font-[600] text-[12px] leading-[18px]">stock</div>
            </div>
          `;

          item.addEventListener("click", () => {
            symbolInput.value = symbol;
            // You can also store more data if needed, e.g.:
            // symbolInput.dataset.companyName = name;
            dropdown.innerHTML = "";
            dropdown.classList.add("hidden");
          });

          dropdown.appendChild(item);
        });
      }

      dropdown.classList.remove("hidden");
    } catch (err) {
      console.error(err);
      dropdown.innerHTML =
        '<div class="p-4 text-red-400">Error loading symbols</div>';
      dropdown.classList.remove("hidden");
    }
  }, 350); // 350ms debounce
});

// Hide dropdown when clicking outside
document.addEventListener("click", function (e) {
  if (!symbolInput.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.add("hidden");
  }
});

// Optional: show dropdown again when focusing input
symbolInput.addEventListener("focus", () => {
  if (symbolInput.value.trim().length >= 2) {
    dropdown.classList.remove("hidden");
  }
});

// 3. When year is selected → fetch API and save to localStorage
yearSelect.addEventListener("change", function () {
  const symbol = symbolInput.value.trim();
  const year = this.value;

  if (!symbol || !year) {
    // Optional: show a message or do nothing
    console.log("Please select both symbol and year");
    return;
  }

  fetchStockHistory(symbol, year);
});

async function fetchStockHistory(symbol, selectedYear) {
  try {
    const url = `https://ielapis.u2ventures.io/api/psxApi/stock-detail/stock-history-graph/?filter=2Y&stock=${encodeURIComponent(symbol)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    // Prepare data to save
    const storageData = {
      symbol: symbol,
      selectedYear: selectedYear,
      timestamp: new Date().toISOString(),
      data: data,
    };

    // Save to localStorage
    localStorage.setItem(
      `stock_history_${symbol}`,
      JSON.stringify(storageData),
    );

    console.log(`Data for ${symbol} saved to localStorage`, storageData);

    // Optional: you can show success message to user
    // alert(`Data for ${symbol} loaded and saved!`);
  } catch (error) {
    console.error("Error fetching stock history:", error);

    // Optional: show error to user
    // alert("Failed to load stock data. Please try again.");
  }
}

// ====================
//   CALCULATE ROI & CHART
// ====================

const calculateBtn = document.getElementById("Calculate_button");
let roiChartInstance = null;

calculateBtn.addEventListener("click", async () => {
  const symbol = symbolInput.value.trim();
  const purchaseYear = yearSelect.value;
  const shares =
    parseFloat(document.querySelector('input[type="number"][min="1"]').value) ||
    0;

  if (!symbol || !purchaseYear || shares <= 0) {
    alert("Please enter symbol, year and number of shares.");
    return;
  }

  // ────────────────────────────────────────────────
  //   Get history (from cache or API)
  // ────────────────────────────────────────────────
  let history = null;
  let stockData = localStorage.getItem(`stock_history_${symbol}`);

  if (stockData) {
    const parsed = JSON.parse(stockData);
    history = parsed.data;
  }

  if (!history) {
    try {
      const url = `https://ielapis.u2ventures.io/api/psxApi/stock-detail/stock-history-graph/?filter=2Y&stock=${encodeURIComponent(symbol)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch stock history");
      const json = await res.json();
      history = json;

      localStorage.setItem(
        `stock_history_${symbol}`,
        JSON.stringify({
          symbol,
          timestamp: new Date().toISOString(),
          data: json,
        }),
      );
    } catch (err) {
      console.error(err);
      alert("Could not load stock history. Please try again later.");
      return;
    }
  }

  // ────────────────────────────────────────────────
  //   Get last closing price of each year
  // ────────────────────────────────────────────────
  const yearlyCloses = getYearlyLastDayCloses(history);

  if (!yearlyCloses[purchaseYear]) {
    alert(`No closing price data found for year ${purchaseYear}`);
    return;
  }

  // ★★★ This is the important change ★★★
  const purchasePricePerShare = yearlyCloses[purchaseYear];
  const initialInvestment = shares * purchasePricePerShare;

  // ────────────────────────────────────────────────
  //   Build return series from purchase year onward
  // ────────────────────────────────────────────────
  const years = Object.keys(yearlyCloses)
    .map(Number)
    .sort((a, b) => a - b);

  const returns = [];

  for (const year of years) {
    if (year < Number(purchaseYear)) continue;

    const closePrice = yearlyCloses[year];
    const currentValue = shares * closePrice;
    const profit = currentValue - initialInvestment;
    const roiPercent =
      initialInvestment > 0 ? (currentValue / initialInvestment - 1) * 100 : 0;

    returns.push({
      year: year.toString(),
      closePrice,
      value: currentValue,
      profit,
      roiPercent,
    });
  }

  if (returns.length === 0) {
    alert("No data available after the purchase year.");
    return;
  }

  // Update total return display
  const latest = returns[returns.length - 1];
  document.getElementById("totalReturn").textContent =
    `PKR ${Math.round(latest.value).toLocaleString()}`;

  // ────────────────────────────────────────────────
  //   Update chart
  // ────────────────────────────────────────────────
  if (roiChartInstance) {
    roiChartInstance.destroy();
  }

  const ctx = document.getElementById("roiChart").getContext("2d");
  roiChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: returns.map((r) => r.year),
      datasets: [
        {
          label: "Portfolio Value",
          data: returns.map((r) => Math.round(r.value)),
          backgroundColor: "#B9B5FF",
          borderColor: "##B9B5FF",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Value (PKR)",
            color: "#ffffff88",
          },
          ticks: {
            color: "#ffffff88",
            callback: (value) => "PKR " + value.toLocaleString(),
          },
          grid: { color: "#ffffff11" },
        },
        x: {
          ticks: { color: "#ffffffcc" },
          grid: { display: false },
        },
      },
    },
  });
});

function getYearlyLastDayCloses(historyData) {
  console.log("History new Data for Usama ", historyData);
  const closesByYear = {};

  if (Array.isArray(historyData?.data)) {
    historyData?.data?.forEach((item) => {
      if (!item.date || !item.close) return;
      const date = new Date(item.date);
      const year = date.getFullYear().toString();
      // Keep the latest price for each year
      if (!closesByYear[year] || date > new Date(closesByYear[year].date)) {
        closesByYear[year] = {
          close: parseFloat(item.close),
          date: item.date,
        };
      }
    });
  } else if (historyData?.data) {
    // or maybe historyData.data is the array
    historyData.data.forEach((item) => {
      if (!item.date || !item.close) return;
      const year = new Date(item.date).getFullYear().toString();
      if (
        !closesByYear[year] ||
        new Date(item.date) > new Date(closesByYear[year].date)
      ) {
        closesByYear[year] = {
          close: parseFloat(item.close),
          date: item.date,
        };
      }
    });
  }

  // Convert to simple year → price map
  const result = {};
  Object.keys(closesByYear).forEach((year) => {
    result[year] = closesByYear[year].close;
  });

  return result;
}

// -----------------Show Chart On Load Page------------
window.addEventListener("load", () => {
  // Small delay to make sure DOM is fully ready
  setTimeout(() => {
    if (symbolInput.value && yearSelect.value ) {
      calculateBtn.click(); // ← this runs your existing calculation
    }
  }, 300);
});
