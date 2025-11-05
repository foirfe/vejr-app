(function () {
  // CONFIG
  const searchApi = "https://api.weatherapi.com/v1/search.json";
  const MIN_CHARS = 3;       // SEARCH STARTS FIRST AFTER THIS MANY CHARACTERS
  const DEBOUNCE_MS = 300;   // WAIT TIME BEFORE CALLING THE SEARCH API
  //DOM ELEMENTS
  const locationBox = document.getElementById("location");
  const citySelect = locationBox.querySelector("select[name='cities']");
  const searchInput = locationBox.querySelector("#search input[type='search']");
  const favoriteIcon = locationBox.querySelector(".fa-star");
  // LOCAL STORAGE KEYS 
  const LS_FAVORITES = "favorites";   // ARRAY OF FAVORITE CITIES
  const LS_CURRENT = "currentCity";       //CURRENT SELECTED CITY
  const LS_ASKED_LOCATION = "asked_location"; //HAS THE USER BEEN ASKED FOR GEOLOCATION
  // STATE 
  let favorites = readLocalStorage(LS_FAVORITES) || [];
  let currentCity = readLocalStorage(LS_CURRENT) || null;
  // HELPERS FUNCTIONS
  //READS LOCAL STORAGE
  function readLocalStorage(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }
  // WRITES TO LOCAL STORAGE
  function writeLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function cityId(city) {
    return `${city.name}|${city.region}|${city.country}`.toLowerCase();
  }
  //USED TO MAP THE DATA GIVEN FROM THE API
  function normalizeCity(apiCity) {
    return {
      id: cityId(apiCity),
      name: apiCity.name,
      region: apiCity.region || "",
      country: apiCity.country || "",
      lat: apiCity.lat,
      lon: apiCity.lon
    };
  }
  //USED TO MINIMIZE THE API CALLS WHENEVER USER 
  function debounce(fn, wait) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  //WEATHERAPI SEARCH
  async function searchCities(query) {
    const url = `${searchApi}?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Search failed");
    const data = await res.json();
    return data.map(normalizeCity);
  }

  //AUTOCOMPLETE UI
  let resultsList = null;
  function ensureResultsList() {
    if (resultsList) return resultsList;
    resultsList = document.createElement("ul");
    resultsList.id = "autocomplete-results";
    resultsList.setAttribute("role", "listbox");
    const holder = locationBox.querySelector("#search");
    holder.style.position = "relative";
    holder.appendChild(resultsList);
    // Styling for resultlist
    Object.assign(resultsList.style, {
      position: "absolute",
      left: 0,
      right: 0,
      top: "calc(100% + 6px)",
      background: `var(--main-bg-color),`,
      border: "1px solid rgba(0,0,0,.15)",
      borderRadius: "8px",
      listStyle: "none",
      margin: 0,
      padding: 0,
      maxHeight: "220px",
      overflowY: "auto",
      display: "none",
      zIndex: 1000
    });
    return resultsList;
  }
  function showAutocomplete(items) {
    const list = ensureResultsList();
    list.innerHTML = "";
    if (!items.length) {
      list.style.display = "none";
      return;
    }
    items.slice(0, 8).forEach((city) => {
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.dataset.id = city.id;
      li.style.padding = "8px 10px";
      li.style.cursor = "pointer";
      li.innerHTML = `
        <div style="font-weight:600">${city.name}</div>
        <div style="font-size:12px;opacity:.7">${[city.region, city.country].filter(Boolean).join(", ")}</div>
      `;
      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
        chooseCity(city);
      });
      list.appendChild(li);
    });
    list.style.display = "block";
  }

  function hideAutocomplete() {
    if (resultsList) resultsList.style.display = "none";
  }

  const runAutocomplete = debounce(async function () {
    const q = (searchInput.value || "").trim();
    if (q.length < MIN_CHARS) { hideAutocomplete(); return; }
    try {
      const cities = await searchCities(q);
      showAutocomplete(cities);
    } catch {
      hideAutocomplete();
    }
  }, DEBOUNCE_MS);

  //FAVORITES + DROPDOWN
  function renderDropdown() {
    const options = [];
    if (currentCity) options.push(makeOption(currentCity, true));
    favorites
      .filter(f => !currentCity || f.id !== currentCity.id)
      .forEach(f => options.push(makeOption(f, false)));

    // If nothing shows up yet, keep existing options
    if (!options.length && citySelect.options.length) return;
    citySelect.innerHTML = "";
    options.forEach(o => citySelect.appendChild(o));
  }
//USER MAKES SELECTION OF CITY
  function makeOption(city, selected) {
    const opt = document.createElement("option");
    opt.value = city.id;
    opt.textContent = city.name;
    if (selected) opt.selected = true;
    opt.dataset.lat = city.lat;
    opt.dataset.lon = city.lon;
    opt.dataset.region = city.region;
    opt.dataset.country = city.country;
    return opt;
  }

  function isFavorite(city = currentCity) {
    if (!city) return false;
    return favorites.some(f => f.id === city.id);
  }
//UPDATES THE STAR ICON TO FILL AND SHOW FEEDBACK DEPENDING ON FAVORITE OR NOT
  function updateFavoriteIcon() {
    if (!favoriteIcon) return;
    if (isFavorite()) {
      favoriteIcon.classList.remove("fa-regular");
      favoriteIcon.classList.add("fa-solid");
      favoriteIcon.title = "Remove from favorites";
    } else {
      favoriteIcon.classList.remove("fa-solid");
      favoriteIcon.classList.add("fa-regular");
      favoriteIcon.title = "Add to favorites";
    }
  }
//ADDS FAVORITE TO LOCALSTORAGE/UPDATES DROPDOWN/UPDATES FAVORITEICON
  function addFavorite(city = currentCity) {
    if (!city || isFavorite(city)) return;
    favorites.push(city);
    writeLocalStorage(LS_FAVORITES, favorites);
    renderDropdown();
    updateFavoriteIcon();
  }
//REMOVES FAVORITE FROM LOCALSTORAGE/UPDATES DROPDOWN/UPDATES FAVORITEICON
  function removeFavorite(city = currentCity) {
    if (!city) return;
    favorites = favorites.filter(f => f.id !== city.id);
    writeLocalStorage(LS_FAVORITES, favorites);
    renderDropdown();
    updateFavoriteIcon();
  }

  function chooseCity(city) {
    currentCity = city;
    writeLocalStorage(LS_CURRENT, currentCity);
    renderDropdown();
    updateFavoriteIcon();
    searchInput.value = city.name;
    hideAutocomplete();
    // CUSTOM EVENT USED ACROSS THE SCRIPTS FOR WHEN A CITY IS CHANGED
    document.getElementById("location-and-search")
      .dispatchEvent(new CustomEvent("city:changed", { detail: city }));
  }

  // ====== FIRST VISIT: ASK FOR LOCATION ONCE ======
  async function askForLocationOnce() {
    if (localStorage.getItem(LS_ASKED_LOCATION) === "1") return;
    localStorage.setItem(LS_ASKED_LOCATION, "1");
    if (!navigator.geolocation) return;
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 8000
        })
      );
      const q = `${pos.coords.latitude.toFixed(3)},${pos.coords.longitude.toFixed(3)}`;
      const list = await searchCities(q);
      if (list[0]) chooseCity(list[0]);
    } catch {
      // User denied or timed out → keeps whatever is in the dropdown
    }
  }

  // ====== EVENTS ======
  searchInput.addEventListener("input", runAutocomplete);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideAutocomplete();
  });
  document.addEventListener("click", (e) => {
    const box = ensureResultsList();
    if (!box.contains(e.target) && e.target !== searchInput) hideAutocomplete();
  });
  citySelect.addEventListener("change", () => {
    const opt = citySelect.options[citySelect.selectedIndex];
    const city = {
      id: opt.value,
      name: opt.textContent,
      region: opt.dataset.region || "",
      country: opt.dataset.country || "",
      lat: parseFloat(opt.dataset.lat),
      lon: parseFloat(opt.dataset.lon)
    };
    chooseCity(city);
  });
  if (favoriteIcon) {
    favoriteIcon.style.cursor = "pointer";
    favoriteIcon.addEventListener("click", () => {
      if (isFavorite()) removeFavorite();
      else addFavorite();
    });
  }
  // INIT 
  (function init() {
    // If there’s a saved city, use that; else use first option in the dropdown
    if (!currentCity && citySelect.options.length) {
      const opt = citySelect.options[0];
      currentCity = {
        id: opt.value || cityId({ name: opt.textContent, region: "", country: "" }),
        name: opt.textContent,
        region: opt.dataset.region || "",
        country: opt.dataset.country || "",
        lat: opt.dataset.lat ? parseFloat(opt.dataset.lat) : undefined,
        lon: opt.dataset.lon ? parseFloat(opt.dataset.lon) : undefined
      };
      writeLocalStorage(LS_CURRENT, currentCity);
    }
    renderDropdown();
    updateFavoriteIcon();
    askForLocationOnce();
  })();
})();