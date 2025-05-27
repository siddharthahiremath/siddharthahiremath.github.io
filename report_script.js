document.addEventListener('DOMContentLoaded', function() {
    const getLocationBtn = document.getElementById('getLocationBtn');
    const locationDisplayDiv = document.getElementById('location-display');

    if (!getLocationBtn || !locationDisplayDiv) {
        console.error('Error: Essential HTML elements (button or display div) not found!');
        if (locationDisplayDiv) {
            locationDisplayDiv.innerHTML = '<p style="color: red;">Page error. Contact support.</p>';
        }
        return;
    }

    // Check if Firebase is available
    if (typeof firebase === 'undefined' || typeof firebase.database === 'undefined') {
        console.error('Firebase SDK not loaded or Realtime Database module missing.');
        locationDisplayDiv.innerHTML = '<p style="color: red;">Error: Firebase connection not set up. Cannot report location.</p>';
        return;
    }
    const database = firebase.database();

    getLocationBtn.addEventListener('click', function() {
        const userName = prompt("Please enter your name to report your location:", "");
        if (!userName || userName.trim() === "") {
            locationDisplayDiv.innerHTML = '<p style="color: orange;">Name is required to report location. Please try again.</p>';
            return;
        }

        if (navigator.geolocation) {
            locationDisplayDiv.innerHTML = '<p>Fetching location... Please wait and approve the request if prompted.</p>';
            navigator.geolocation.getCurrentPosition(
                (position) => showPosition(position, userName.trim()), // Pass userName to showPosition
                showError,
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            locationDisplayDiv.innerHTML = '<p style="color: red;">Geolocation is not supported by this browser.</p>';
        }
    });

    function showPosition(position, userName) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const acc = position.coords.accuracy;
        const timestamp = new Date().toISOString(); // Use ISO string for consistent server-side/Firebase storage

        const locationData = {
            name: userName,
            latitude: lat,
            longitude: lon,
            accuracy: acc,
            last_updated: timestamp,
            notes: "" // Initialize notes, can be updated via God View later if needed
        };

        // Write to Firebase
        database.ref('locations/' + userName).set(locationData)
            .then(() => {
                locationDisplayDiv.innerHTML = `
                    <p style="color: green;"><strong>Location for ${userName} sent successfully!</strong></p>
                    <ul>
                        <li><strong>Latitude:</strong> ${lat}</li>
                        <li><strong>Longitude:</strong> ${lon}</li>
                        <li><strong>Accuracy:</strong> Approximately ${acc} meters</li>
                        <li><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</li>
                    </ul>
                    <p>This has been updated in the God View.</p>`;
            })
            .catch((error) => {
                console.error('Firebase write error:', error);
                locationDisplayDiv.innerHTML = `
                    <p style="color: red;"><strong>Could not send location to server. Please try again.</strong></p>
                    <p>Details: ${error.message}</p>
                    <p>Your current location: Lat: ${lat}, Lon: ${lon}</p>`;
            });
    }

    function showError(error) {
        let message = '';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = "User denied the request for Geolocation.";
                break;
            case error.POSITION_UNAVAILABLE:
                message = "Location information is unavailable.";
                break;
            case error.TIMEOUT:
                message = "The request to get user location timed out.";
                break;
            case error.UNKNOWN_ERROR:
                message = "An unknown error occurred.";
                break;
        }
        locationDisplayDiv.innerHTML = `<p style="color: red;">Error getting location: ${message}</p><p>Please ensure you have location services enabled and have granted permission.</p>`;
    }
});
