//GLOBAL
var apiUrl = `https://api.weatherapi.com/v1/forecast.json`
var apiKey = "9dee96c4230c4dd0b1180923250511"

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