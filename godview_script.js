// Global map-related variables
let map;
let markers = [];

// Globally accessible initMap function
window.initMap = function() {
    const initialCenter = { lat: 34.0522, lng: -118.2437 }; // Default center (e.g., Los Angeles)
    const mapDiv = document.getElementById('god-view-content');
    if (!mapDiv) {
        console.error("Map container 'god-view-content' not found during initMap.");
        // Attempt to set a temporary message if mapDiv is not found
        document.body.innerHTML = "Error: Map container 'god-view-content' not found. Cannot initialize map. " + document.body.innerHTML;
        return;
    }
    map = new google.maps.Map(mapDiv, {
        center: initialCenter,
        zoom: 12, // Adjust default zoom as needed
    });
    
    // After map is initialized, if there's a pending need to render data,
    // this could be a place to trigger it. However, the Firebase `on('value')`
    // event will likely fire and handle rendering markers.
};

// Helper function to clear markers
function clearMarkers() {
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null); // Remove marker from map
    }
    markers = []; // Clear the array
}
document.addEventListener('DOMContentLoaded', function() {
    const locationContentDiv = document.getElementById('god-view-content');
    // Prepare for a status div (will be added to index.html in next step)
    // For now, we can assume it might exist, or messages can be logged if it doesn't.
    // A better approach is to get this element in the next step when it's created.
    // For this subtask, we'll focus on the logic and assume a 'self-location-status' div.
    const selfLocationStatusDiv = document.getElementById('self-location-status'); // Will be added in HTML later
    const messagesArea = document.getElementById('messages-area');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    let currentUserName = ''; // Variable to store the user's name

function updateSelfLocationStatus(message, isError = false) {
    // Ensure selfLocationStatusDiv is fetched correctly, possibly inside DOMContentLoaded
    const selfLocationStatusDiv = document.getElementById('self-location-status');
        if (selfLocationStatusDiv) {
            selfLocationStatusDiv.innerHTML = message;
            selfLocationStatusDiv.style.color = isError ? 'red' : 'green';
        } else {
            // Fallback if div not yet there
            isError ? console.error(message) : console.log(message);
        }
    }

    function shareSelfLocation() {
        if (!currentUserName) {
            const promptedName = prompt("Please enter your name to share your location on the God View:", "");
            if (!promptedName || promptedName.trim() === "") {
                updateSelfLocationStatus("Name not provided. Your location will not be shared.", true);
                return;
            }
            currentUserName = promptedName.trim();
        // Ensure selfLocationStatusDiv is fetched correctly, possibly inside DOMContentLoaded
        // const selfLocationStatusDiv = document.getElementById('self-location-status'); // Redundant if already in updateSelfLocationStatus or globally
        const userName = prompt("Please enter your name to share your location on the God View:", "");
        if (!userName || userName.trim() === "") {
            updateSelfLocationStatus("Name not provided. Your location will not be shared.", true);
            return;
        }

        if (navigator.geolocation) {
            updateSelfLocationStatus(`Attempting to share your location as ${currentUserName}...`);
            navigator.geolocation.getCurrentPosition(
                (position) => handleSelfPosition(position, currentUserName),
                handleSelfError,
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            updateSelfLocationStatus("Geolocation is not supported by this browser. Cannot share your location.", true);
        }
    }

    // Note: The userName parameter in handleSelfPosition is now currentUserName passed from shareSelfLocation
    function handleSelfPosition(position, userName) { 
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const acc = position.coords.accuracy;
        const timestamp = new Date().toISOString();

        const locationData = {
            name: userName, // This will be currentUserName
            latitude: lat,
            longitude: lon,
            accuracy: acc,
            last_updated: timestamp,
            notes: "User of God View" // Optional note
        };

        // Use currentUserName for the Firebase path
        firebase.database().ref('locations/' + currentUserName).set(locationData)
            .then(() => {
                updateSelfLocationStatus(`Your location as ${currentUserName} is now being shared.`, false);
            })
            .catch((error) => {
                console.error('Firebase write error (self-location):', error);
                updateSelfLocationStatus(`Error sharing your location: ${error.message}`, true);
            });
    }

    function handleSelfError(error) {
        let message = '';
        switch(error.code) {
            case error.PERMISSION_DENIED: message = "Permission denied for Geolocation."; break;
            case error.POSITION_UNAVAILABLE: message = "Location information unavailable."; break;
            case error.TIMEOUT: message = "Geolocation request timed out."; break;
            default: message = "An unknown error occurred during geolocation."; break;
        }
        updateSelfLocationStatus(`Could not share your location: ${message}`, true);
    }

document.addEventListener('DOMContentLoaded', function() {
    const locationContentDiv = document.getElementById('god-view-content');
    const selfLocationStatusDiv = document.getElementById('self-location-status'); // Ensure it's used or defined

    // (The self-location related functions are now defined globally or will be called from here)

    if (!locationContentDiv) {
        console.error('Error: god-view-content div not found!');
        if (selfLocationStatusDiv) selfLocationStatusDiv.innerHTML = '<p style="color: red;">Critical Error: Map display area missing.</p>';
        return; 
    }

    if (typeof firebase === 'undefined' || typeof firebase.database === 'undefined') {
        console.error('Firebase SDK not loaded or Realtime Database module missing.');
        locationContentDiv.innerHTML = '<p style="color: red;">Error: Firebase connection not set up. Cannot display locations.</p>';
        if (selfLocationStatusDiv) selfLocationStatusDiv.innerHTML = ''; 
        return;
    }
    const database = firebase.database();
    const locationsRef = database.ref('locations');
    const messagesRef = database.ref('messages');

    // Attempt to share self location (existing call)
    shareSelfLocation(); 

    // Firebase 'on value' listener for locations
    locationsRef.on('value', (snapshot) => {
        clearMarkers(); // Clear existing markers
        // const locationContentDiv = document.getElementById('god-view-content'); // Already fetched above

        if (!map) { // `map` is the global variable that initMap is supposed to set.
            console.log("Map object not ready yet. Waiting for Google Maps API callback 'initMap'.");
            if (locationContentDiv) {
                locationContentDiv.innerHTML = '<p>Map is loading... If this message persists, ensure the Google Maps API key in index.html is correct and the `initMap` callback is working.</p>';
            }
            return; // Don't try to add markers if map isn't ready
        }
        // If map is ready, ensure the div is clear for the map, not showing text.
        if (locationContentDiv) locationContentDiv.innerHTML = ''; 

        const locationsData = snapshot.val();

        if (locationsData) {
            Object.keys(locationsData).forEach(keyName => {
                const person = locationsData[keyName];
                if (!person || typeof person.name === 'undefined' || person.latitude === undefined || person.longitude === undefined || person.latitude === 0 || person.longitude === 0) {
                    console.warn('Skipping invalid or incomplete location entry for key:', keyName, person);
                    return; 
                }

                const position = { lat: person.latitude, lng: person.longitude };
                const marker = new google.maps.Marker({
                    position: position,
                    map: map,
                    title: person.name
                });

                let infoWindowContent = `<strong>${person.name}</strong><br>`;
                infoWindowContent += `Coordinates: ${person.latitude.toFixed(5)}, ${person.longitude.toFixed(5)}<br>`;
                if (person.accuracy) {
                    infoWindowContent += `Accuracy: Approx. ${person.accuracy} meters<br>`;
                }
                infoWindowContent += `Last Updated: ${person.last_updated ? new Date(person.last_updated).toLocaleString() : 'N/A'}<br>`;
                infoWindowContent += `Notes: ${person.notes || 'N/A'}`;

                const infoWindow = new google.maps.InfoWindow({
                    content: infoWindowContent
                });

                marker.addListener('click', () => {
                    infoWindow.open(map, marker);
                });
                markers.push(marker); // Add to our tracking array
            });

            // Optional: Adjust map bounds to fit all markers
            if (markers.length > 0) {
                const bounds = new google.maps.LatLngBounds();
                markers.forEach(marker => bounds.extend(marker.getPosition()));
                map.fitBounds(bounds);
                // Prevent over-zooming if only one marker or if bounds are very small
                if (markers.length === 1 || (bounds.getNorthEast().equals(bounds.getSouthWest()))) {
                    map.setZoom(15); // Or your preferred zoom level
                }
            }

        } else {
            // No location data
            if (locationContentDiv) { 
                 // If map is initialized, show message inside map container, or clear it.
                 // If map is not initialized, this was handled by the `if (!map)` block earlier.
                 // Map is guaranteed to be initialized here due to the check above.
                 locationContentDiv.innerHTML = '<p>No location data available in Firebase. Waiting for team members to report their locations.</p>';
            }
        }
    }, (error) => {
        console.error('Firebase read error (all locations):', error);
        if (locationContentDiv) {
            locationContentDiv.innerHTML = `<p style="color: red;">Error fetching data from Firebase: ${error.message}</p>`;
        }
        // Also update self-location status in case of error
        updateSelfLocationStatus(`Error fetching Firebase data: ${error.message}`, true);
    });

    // Messaging functionality
    if (sendButton && messageInput && messagesArea) {
        sendButton.addEventListener('click', () => {
            const messageText = messageInput.value.trim();
            if (messageText === "") {
                return;
            }

            if (!currentUserName) {
                const promptedName = prompt("Please enter your name to send a message:", "");
                if (!promptedName || promptedName.trim() === "") {
                    alert("Name not provided. Message not sent.");
                    return;
                }
                currentUserName = promptedName.trim();
            }

            const messageObject = {
                name: currentUserName, // Use currentUserName
                text: messageText,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };

            messagesRef.push(messageObject)
                .then(() => {
                    messageInput.value = '';
                })
                .catch((error) => {
                    console.error('Error sending message:', error);
                    alert(`Error sending message: ${error.message}`);
                });
        });

        messagesRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            if (message && message.text && message.name && message.timestamp) {
                const messageDate = new Date(message.timestamp);
                const formattedTime = messageDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                const messageElement = document.createElement('div');
                messageElement.textContent = `${formattedTime} - ${message.name}: ${message.text}`;
                messagesArea.appendChild(messageElement);
                messagesArea.scrollTop = messagesArea.scrollHeight;
            }
        });
    } else {
        console.error('Messaging UI elements not found. Messaging functionality will not work.');
    }
});
