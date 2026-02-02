const hamburger = document.querySelector(".md\\:hidden");
const mobileMenu = document.getElementById("mobile-menu");

if (hamburger && mobileMenu) {
  hamburger.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

function populateYears() {
  const select = document.getElementById("investmentYear");
  const currentYear = new Date().getFullYear();

  for (let i = 0; i <= 5; i++) {
    const year = currentYear - i;
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    select.appendChild(option);
  }
}

populateYears();

// 2. Symbol search with API
const symbolInput = document.getElementById("symbolInput");
const dropdown = document.getElementById("symbolDropdown");

let debounceTimer;

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




