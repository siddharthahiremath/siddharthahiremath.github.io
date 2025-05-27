document.addEventListener('DOMContentLoaded', function() {
    const locationContentDiv = document.getElementById('god-view-content');

    if (!locationContentDiv) {
        console.error('Error: god-view-content div not found!');
        return;
    }

    if (typeof locations === 'undefined' || locations.length === 0) {
        locationContentDiv.innerHTML = '<p>No location data available or locations.js is not loaded correctly.</p>';
        console.warn('locations array is undefined or empty. Ensure locations.js is loaded before godview_script.js and contains data.');
        return;
    }

    let htmlContent = '<ul>';
    locations.forEach(person => {
        htmlContent += `<li>`;
        htmlContent += `<strong>${person.name}</strong><br>`;
        if (person.latitude !== 0 && person.longitude !== 0) {
            htmlContent += `Coordinates: ${person.latitude}, ${person.longitude}<br>`;
            // Basic link to Google Maps for easy checking
            htmlContent += `<a href="https://www.google.com/maps?q=${person.latitude},${person.longitude}" target="_blank">View on Map</a><br>`;
        } else {
            htmlContent += `Coordinates: Not Reported<br>`;
        }
        htmlContent += `Last Updated: ${person.last_updated}<br>`;
        htmlContent += `Notes: ${person.notes || 'N/A'}`;
        htmlContent += `</li><br>`; // Added <br> for better visual separation
    });
    htmlContent += '</ul>';

    locationContentDiv.innerHTML = htmlContent;
});
