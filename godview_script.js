document.addEventListener('DOMContentLoaded', function() {
    const locationContentDiv = document.getElementById('god-view-content');

    if (!locationContentDiv) {
        console.error('Error: god-view-content div not found!');
        return;
    }

    // Check if Firebase is available
    if (typeof firebase === 'undefined' || typeof firebase.database === 'undefined') {
        console.error('Firebase SDK not loaded or Realtime Database module missing.');
        locationContentDiv.innerHTML = '<p style="color: red;">Error: Firebase connection not set up. Cannot display locations.</p>';
        return;
    }
    const database = firebase.database();
    const locationsRef = database.ref('locations');

    locationContentDiv.innerHTML = '<p>Loading location data from Firebase...</p>';

    locationsRef.on('value', (snapshot) => {
        const locationsData = snapshot.val();
        if (locationsData) {
            let htmlContent = '<ul>';
            Object.keys(locationsData).forEach(userName => {
                const person = locationsData[userName];
                // Validate essential data for display
                if (!person || typeof person.name === 'undefined') {
                    console.warn('Skipping invalid location entry for key:', userName, person);
                    return; // skip this entry
                }

                htmlContent += `<li>`;
                htmlContent += `<strong>${person.name}</strong><br>`;
                if (person.latitude !== undefined && person.longitude !== undefined && person.latitude !== 0 && person.longitude !== 0) {
                    htmlContent += `Coordinates: ${person.latitude}, ${person.longitude}<br>`;
                    htmlContent += `Accuracy: Approx. ${person.accuracy || 'N/A'} meters<br>`;
                    htmlContent += `<a href="https://www.google.com/maps?q=${person.latitude},${person.longitude}" target="_blank">View on Map</a><br>`;
                } else {
                    htmlContent += `Coordinates: Not Reported or Invalid<br>`;
                }
                htmlContent += `Last Updated: ${person.last_updated ? new Date(person.last_updated).toLocaleString() : 'N/A'}<br>`;
                htmlContent += `Notes: ${person.notes || 'N/A'}`;
                htmlContent += `</li><br>`;
            });
            htmlContent += '</ul>';
            locationContentDiv.innerHTML = htmlContent;
        } else {
            locationContentDiv.innerHTML = '<p>No location data available in Firebase. Waiting for team members to report their locations.</p>';
        }
    }, (error) => {
        console.error('Firebase read error:', error);
        locationContentDiv.innerHTML = `<p style="color: red;">Error fetching data from Firebase: ${error.message}</p>`;
    });
});
