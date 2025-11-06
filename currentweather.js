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
  let query;
  if (typeof cityOrCoords === "object") {
    query = cityOrCoords.lat + "," + cityOrCoords.lon;
  } else {
    query = cityOrCoords;
  }

  const url = `${apiUrl}?key=${apiKey}&q=${query}&days=2`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
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
      const windSpeed = Math.round(data.current.wind_kph / 3.6);
      windEl.textContent = "Wind: " + windSpeed + " m/s";
      uvEl.textContent = "UV index: " + data.current.uv;
      humidityEl.textContent = "Humidity: " + data.current.humidity + "%";
      visibilityEl.textContent = "Visibility: " + data.current.vis_km + " km";

      // Hourly forecast
      hourlyContainer.innerHTML = "";
      const now = new Date();
      const currentTime = now.getTime();

      // Hent timer fra dag 0 og dag 1 for at kunne vise de næste 24 timer
      const allHours = [
        ...data.forecast.forecastday[0].hour,
        ...(data.forecast.forecastday[1]?.hour || [])
      ];

      const next24Hours = allHours.filter(hourData => {
        const hourTime = new Date(hourData.time).getTime();
        return hourTime >= currentTime && hourTime <= currentTime + 24 * 60 * 60 * 1000;
      });

      next24Hours.forEach(hourData => {
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
