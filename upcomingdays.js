
//DOM SELECTORS
let upcomingDaysSection = document.getElementById("upcoming-days-forecast");
let locationAndSearch = document.getElementById("location-and-search");
// KILOMETERS PER HOUR TO METERS PER SECOND
function renderForecast(days) {
  // REMOVES PLACEHOLDERS THAT WERE USED FOR STYLING
  let oldItems = upcomingDaysSection.querySelectorAll(".upcoming-day");
  oldItems.forEach(function (el) { el.remove(); });
  //FOREACH LOOP THAT RENDERS THE DAYS
  days.forEach(function(day) {
    let date = new Date(day.date);
        weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    let icon = day.day.condition.icon;
    let rain = day.day.daily_chance_of_rain + "%";
    let wind = Math.round(day.day.maxwind_kph / 3.6) + " m/s";
    let tempMin = Math.round(day.day.mintemp_c) + "°";
    let tempMax = Math.round(day.day.maxtemp_c) + "°";
    let item = document.createElement("div");
    item.className = "upcoming-day";
    item.innerHTML = `
        <p>${weekday}</p>
        <img src="${icon}" alt="">
        <p>${rain}</p>
        <p>${wind}</p>
        <p>${tempMin}</p>
        <p>${tempMax}</p>
    `;
    upcomingDaysSection.appendChild(item);
});
}
//FETCHES UPCOMING DAYS
function getUpcomingDays(searchQuery) {
  fetch(apiUrl + `?key=${apiKey}&q=${searchQuery}&days=5`)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      renderForecast(data.forecast.forecastday);
    })
    .catch(function (err) {
      console.log("Error fetching forecast:", err);
    });
}
// INITAL CITY IF SAVED
function readSavedCity() {
  try { return JSON.parse(localStorage.getItem("currentCity")); } catch { return null; }
}

// IF NO LAT/LON ON FIRST OPTION IT FALLBACKS TO SEARCHING BY NAME
function lookupCityByName(name) {
  let url = `https://api.weatherapi.com/v1/search.json?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(name)}`;
  return fetch(url)
    .then(function (r) { return r.json(); })
    .then(function (list) {
      if (!list || !list.length) return null;
      let c = list[0];
      return { name: c.name, region: c.region || "", country: c.country || "", lat: c.lat, lon: c.lon };
    })
    .catch(function () { return null; });
}
//RENDERS THE FORECAST ON LOADUP
function loadForecastOnStartup() {
  let saved = readSavedCity();
  if (saved && saved.lat != null && saved.lon != null) {
    let q = saved.lat + "," + saved.lon;
    getUpcomingDays(q);
    return;
  }
  // FALLBACK: First option in the dropdown
  if (!citySelect || !citySelect.options.length) return;
  let first = citySelect.options[0];
  let name = first.textContent;
  let lat = first.dataset.lat ? parseFloat(first.dataset.lat) : null;
  let lon = first.dataset.lon ? parseFloat(first.dataset.lon) : null;
  if (lat != null && lon != null) {
    getUpcomingDays(lat + "," + lon);
  } else {
    //RESOLVES THE LAT/LON FROM CITYNAME
    lookupCityByName(name).then(function (city) {
      if (city) getUpcomingDays(city.lat + "," + city.lon);
    });
  }
}

// REACT TO USER CHANGING CITY (FROM search.js)
locationAndSearch.addEventListener("city:changed", function (e) {
  let city = e.detail; 
  let q = city.lat + "," + city.lon;
  getUpcomingDays(q);
});

// INIT ON FIRST LOAD
document.addEventListener("DOMContentLoaded", function () {
  loadForecastOnStartup();
});
