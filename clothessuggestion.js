//JSON DATA
var CLOTHES_DATA_URL = "/data/clothes.json";

// READS USER LOCALSTORAGE
function getUserClothingMode() {
  var raw = localStorage.getItem("userData");
  if (!raw) return { mode: "neutral", gender: "neutral" };
  try {
    var data = JSON.parse(raw);
    var clothing = (data.clothing || "all").toLowerCase();
    var gender = (data.gender || "neutral").toLowerCase(); 
    if (clothing === "gender_based") {
      if (gender !== "male" && gender !== "female") gender = "neutral";
      return { mode: gender, gender: gender }; 
    }
    if (clothing === "gender_neutral") {
      return { mode: "neutral", gender: gender };
    }
    // "all"
    return { mode: "all", gender: gender };
  } catch (e) {
   return { mode: "neutral", gender: "neutral" };
  }
}

// FILTER
function filterByMode(items, mode) {
  if (mode === "neutral") {
    return items.filter(function (x) { return x.gender === "neutral"; });
  }
  if (mode === "male") {
    return items.filter(function (x) { return x.gender === "male" || x.gender === "neutral"; });
  }
  if (mode === "female") {
    return items.filter(function (x) { return x.gender === "female" || x.gender === "neutral"; });
  }
  return items; //ALL
}

//MAPS WeatherAPI DATA TO SIMPLE FLAGS
function getWeatherFlags(apiData) {
  var code = apiData.current.condition.code;
  var isDay = apiData.current.is_day === 1;
  var temp = apiData.current.temp_c;
  var uv = apiData.current.uv;
  var wind = apiData.current.wind_kph;
  var cloud = apiData.current.cloud;
  var chanceRain = apiData.forecast.forecastday[0].day.daily_chance_of_rain;
  var rainCodes = [1063,1150,1153,1180,1183,1186,1189,1192,1195,1240,1243,1246];
  var snowCodes = [1066,1114,1117,1210,1213,1216,1219,1222,1225,1255,1258,1237];
  var flags = {
    rain: chanceRain >= 50 || rainCodes.indexOf(code) !== -1,
    snow: snowCodes.indexOf(code) !== -1,
    windy: wind >= 35,
    hot: temp >= 23,
    cold: temp <= 8,
    sunny: isDay && uv >= 5 && cloud <= 30
  };
  flags.mild = !flags.hot && !flags.cold && !flags.snow;
  return flags;
}
// CHOOSE ITEMS BASED ON THEIR TAGS
function chooseClothes(items, flags) {
  var activeTags = [];
  if (flags.rain) activeTags.push("rain");
  if (flags.snow) activeTags.push("snow");
  if (flags.sunny) activeTags.push("sunny");
  if (flags.windy) activeTags.push("windy");
  if (flags.hot) activeTags.push("hot");
  if (flags.cold) activeTags.push("cold");
  if (flags.mild) activeTags.push("mild");
  var pool = items.filter(function (item) {
    if (item.tags && item.tags.length > 0) {
      return item.tags.some(function (t) { return activeTags.indexOf(t) !== -1; });
    }
    return true;
  });
  var chosen = [];
  function pick(type) {
    var found = pool.find(function (item) { return item.type === type; });
    if (found) chosen.push(found);
  }
  var onepiece = pool.find(function (item) { return item.type === "onepiece"; });
  pick("top");
  if (!onepiece) pick("bottom");
  pick("outer");
  pick("footwear");
  if (onepiece) chosen.push(onepiece);
  var accessories = pool.filter(function (item) { return item.type === "accessory"; }).slice(0, 2);
  chosen = chosen.concat(accessories);
  return chosen;
}

// GET CLOTHES. CALLED AFTER WEATHER IS FETCHED
function getClothesAdvice(apiData) {
  var userPref = getUserClothingMode(); // { mode, gender }
  return fetch(CLOTHES_DATA_URL)
    .then(function (r) { return r.json(); })
    .then(function (db) {
      var items = db.items || [];
      var filtered = filterByMode(items, userPref.mode);
      var flags = getWeatherFlags(apiData);
      var picks = chooseClothes(filtered, flags);
      return picks;
    });
}

// RENDERS CLOTHSUGGESTION INTO THE BOX
function renderClothesSuggestions(items) {
  var box = document.getElementById("clothes-suggestions");
  if (!box) return;
  box.innerHTML = "";
  items.forEach(function (item) {
    var el = document.createElement("div");
    el.className = "clothes-item";
    el.innerHTML = '<img src="' + item.image + '" alt="' + item.name + '"><p>' + item.name + '</p>';
    box.appendChild(el);
  });
}
var clothesBox = document.getElementById("clothes-suggestions");
// FETCHES TODAY WEATHER
async function fetchWeather(lat, lon) {
  var q = lat + "," + lon;
  var url = apiUrl + "?key=" + encodeURIComponent(apiKey) + "&q=" + encodeURIComponent(q) + "&days=1&aqi=no&alerts=no";
  const r = await fetch(url);
    return await r.json();
}
//RENDER HELPER
function updateClothesSuggestions(apiData) {
  getClothesAdvice(apiData).then(function (items) {
    renderClothesSuggestions(items); 
  }).catch(function (err) {
    console.log("Clothes advice error:", err);
  });
}
// HANDLES CHANGE OF CITY (FROM search.js)
document.getElementById("location-and-search").addEventListener("city:changed", function (e) {
  var city = e.detail; 
  if (city && city.lat != null && city.lon != null) {
    fetchWeather(city.lat, city.lon).then(function (data) {
      updateClothesSuggestions(data);
    }).catch(function (err) {
      console.log("Weather fetch error:", err);
    });
  }
});

//RUNS ON LOAD
document.addEventListener("DOMContentLoaded", function () {
  var savedCity = null;
  try { savedCity = JSON.parse(localStorage.getItem("currentCity")); } catch {}
  if (savedCity && savedCity.lat != null && savedCity.lon != null) {
    fetchWeather(savedCity.lat, savedCity.lon)
      .then(updateClothesSuggestions)
      .catch(function (err) { console.log("Weather fetch error:", err); });
    return;
  }

  // FALLBACK: Use first option in the dropdown if it has coordinates
  var locationBox = document.getElementById("location");
  if (!locationBox) return;
  var citySelect = locationBox.querySelector("select[name='cities']");
  if (!citySelect || !citySelect.options.length) return;
  var opt = citySelect.options[0];
  var lat = opt.dataset.lat ? parseFloat(opt.dataset.lat) : null;
  var lon = opt.dataset.lon ? parseFloat(opt.dataset.lon) : null;
  if (lat != null && lon != null) {
    fetchWeather(lat, lon)
      .then(updateClothesSuggestions)
      .catch(function (err) { console.log("Weather fetch error:", err); });
  }})