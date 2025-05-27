document.addEventListener('DOMContentLoaded', function() {
    const getLocationBtn = document.getElementById('getLocationBtn');
    const locationDisplayDiv = document.getElementById('location-display');

    if (!getLocationBtn) {
        console.error('Error: getLocationBtn not found!');
        if (locationDisplayDiv) {
            locationDisplayDiv.innerHTML = '<p style="color: red;">Error: Button to get location not found. Please contact support.</p>';
        }
        return;
    }

    if (!locationDisplayDiv) {
        console.error('Error: location-display div not found!');
        // No easy way to inform user if this is missing, besides console.
        return;
    }

    getLocationBtn.addEventListener('click', function() {
        if (navigator.geolocation) {
            locationDisplayDiv.innerHTML = '<p>Fetching location... Please wait and approve the request if prompted.</p>';
            navigator.geolocation.getCurrentPosition(showPosition, showError, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
        } else {
            locationDisplayDiv.innerHTML = '<p style="color: red;">Geolocation is not supported by this browser.</p>';
        }
    });

    function showPosition(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const acc = position.coords.accuracy;
        const timestamp = new Date(position.timestamp).toLocaleString(); // More readable timestamp

        locationDisplayDiv.innerHTML = `
            <p><strong>Location Found:</strong></p>
            <ul>
                <li><strong>Latitude:</strong> ${lat}</li>
                <li><strong>Longitude:</strong> ${lon}</li>
                <li><strong>Accuracy:</strong> Approximately ${acc} meters</li>
                <li><strong>Time:</strong> ${timestamp}</li>
            </ul>
            <p><strong>How to report:</strong></p>
            <p>Copy the details above (Latitude, Longitude, Time) and send them to your team coordinator along with your name.</p>
            <p><em>Example: Name: Alice, Location: ${lat}, ${lon}, Time: ${timestamp}</em></p>
        `;
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
        locationDisplayDiv.innerHTML = `<p style="color: red;">Error: ${message}</p><p>Please ensure you have location services enabled and have granted permission.</p>`;
    }
});
