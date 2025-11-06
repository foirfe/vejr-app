//GLOBAL
var apiUrl = `https://api.weatherapi.com/v1/forecast.json`
var apiKey = "9dee96c4230c4dd0b1180923250511"

//GETS CURRENT DATE
function formatDate() {
  const date = new Date();
  const month = date.toLocaleString("en-US", { month: "long" });
  const day = date.getDate();
  const suffix = (n) =>
    n % 10 === 1 && n !== 11 ? "st" :
    n % 10 === 2 && n !== 12 ? "nd" :
    n % 10 === 3 && n !== 13 ? "rd" : "th";
  return `${month} ${day}${suffix(day)}`;
}
document.getElementById("current-date").textContent = formatDate();


//USER DATA
//CHECKS IF USER DATA IS ON LOCALSTORAGE
function loadUserName() {
    var stored = localStorage.getItem("userData");
    if (!stored) return; // NOTHING IS SAVED YET
    try {
        var data = JSON.parse(stored);
        if (data.name && data.name.trim() !== "") {
            var span = document.getElementById("userName");
            if (span) span.textContent = data.name;
        }
    } catch(error) {
        console.log("Could not read userData:", error);
    }
}
loadUserName();