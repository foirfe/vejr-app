
// Find elementerne i HTML

const tempEl = document.getElementById("current-temp");
const conditionEl = document.getElementById("condition");
const feelsLikeEl = document.getElementById("temp-feels-like");
const iconEl = document.querySelector("#weather-temp-condition img");

const hourlyContainer = document.getElementById("hourly-forecast");

const windEl = document.getElementById("wind-information");
const uvEl = document.getElementById("uv-information");
const humidityEl = document.getElementById("humidity-information");
const visibilityEl = document.getElementById("visibility-information");


// Funktion til at hente og vise vejret

function getCurrentWeather(cityOrCoords) {
  // Hvis vi får et objekt med lat/lon, konverter til "lat,lon"
  let query;
  if (typeof cityOrCoords === "object") {
    query = cityOrCoords.lat + "," + cityOrCoords.lon;
  } else {
    query = cityOrCoords; // ellers er det bare et bynavn
  }

  const url = `${apiUrl}?key=${apiKey}&q=${query}&days=1`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      // Tjek om API returnerede en fejl
      if (data.error) {
        console.error("API-fejl:", data.error.message);
        return;
      }

      // Current weather
      tempEl.textContent = data.current.temp_c + "°C";
      conditionEl.textContent = data.current.condition.text;
      feelsLikeEl.textContent = "Feels like: " + data.current.feelslike_c + "°C";
      iconEl.src = "https:" + data.current.condition.icon;
      iconEl.alt = data.current.condition.text;

      // Ekstra information
      windEl.textContent = "Wind: " + data.current.wind_kph + " kph";
      uvEl.textContent = "UV index: " + data.current.uv;
      humidityEl.textContent = "Humidity: " + data.current.humidity + "%";
      visibilityEl.textContent = "Visibility: " + data.current.vis_km + " km";

      // Hourly forecast
      hourlyContainer.innerHTML = ""; // ryd container først
      data.forecast.forecastday[0].hour.forEach(hourData => {
        const hourDiv = document.createElement("div");
        hourDiv.classList.add("hourly-weather");
        hourDiv.innerHTML = `
          <p>${hourData.time.split(" ")[1]}</p>
          <img src="https:${hourData.condition.icon}" alt="${hourData.condition.text}">
          <p>${hourData.temp_c}°C</p>
        `;
        hourlyContainer.appendChild(hourDiv);
      });
    })
    .catch(error => console.error("Noget gik galt:", error));
}


// Vis Kolding som default

getCurrentWeather("Kolding");


// Lyt på ændringer fra search-systemet

document.getElementById("location-and-search").addEventListener("city:changed", function(e) {
  const city = e.detail; 
  getCurrentWeather(city);
});
