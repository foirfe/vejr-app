//USER SETTINGS

    const closeBtn = document.getElementById('close-settings');
    const form = document.getElementById('user-settings');
    const nameInput = document.getElementById('input-name');
    const ageInput = document.getElementById('input-age');
    const genderSelect = document.getElementById('select-gender');
    const statusText = document.getElementById('user-status');
    const resetBtn = document.getElementById('btn-reset');

    // Funktion til at gemme data
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      const user = {
        name: nameInput.value,
        age: ageInput.value,
        gender: form.gender.value,
        location: form.allow_location.value,
        clothing: form.clothing_pref.value
      };

      // Hvis brugeren har valgt "Yes" til location
        if (user.location === 'yes') {
            if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                const coords = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                localStorage.setItem('userLocation', JSON.stringify(coords));
                console.log('Location saved:', coords);
                },
                (error) => {
                console.warn('Location error:', error);
                statusText.textContent = 'Could not get location permission.';
                setTimeout(() => (statusText.textContent = ''), 5000);
                }
            );
            } else {
            statusText.textContent = 'Geolocation not supported.';
            setTimeout(() => (statusText.textContent = ''), 5000);
            }
        } else if (user.location === 'no') {
            // Hvis brugeren vælger "No", fjernes tidligere lokation
            localStorage.removeItem('userLocation');
            console.log('Location data removed');
        }

      localStorage.setItem('userData', JSON.stringify(user));

      statusText.textContent = 'Data saved!';
      setTimeout(() => statusText.textContent = '', 5000);
    });

    // Funktion til at hente gemte data fra localStorage
    function loadUserData() {
      const data = localStorage.getItem('userData');
        if (data) {
            const user = JSON.parse(data);

            nameInput.value = user.name || '';
            ageInput.value = user.age || '';
            genderSelect.value = user.gender || '';

        // Sæt valgt location
            if (user.location) {
            const locationInput = document.querySelector(
                `input[name="allow_location"][value="${user.location}"]`
            );
            if (locationInput) locationInput.checked = true;
            }

            // Sæt valgt clothing
            if (user.clothing) {
            const clothInput = document.querySelector(
                `input[name="clothing_pref"][value="${user.clothing}"]`
            );
            if (clothInput) clothInput.checked = true;
            }
        }
    }

// Reset-knap: rydder alt og fjerner fra localStorage
resetBtn.addEventListener('click', () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('userLocation');
    form.reset();
    statusText.textContent = 'All data reset!';
    setTimeout(() => (statusText.textContent = ''), 5000);
});


closeBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
});


// Hent data ved indlæsning
loadUserData();