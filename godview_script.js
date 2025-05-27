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
        if (selfLocationStatusDiv) {
            selfLocationStatusDiv.innerHTML = message;
            selfLocationStatusDiv.style.color = isError ? 'red' : 'green';
        } else {
            // Fallback if div not yet there (though it should be by the time this is called if plan followed)
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

    // --- Start of existing godview_script.js logic ---
    if (!locationContentDiv) {
        console.error('Error: god-view-content div not found!');
        return; // Critical error for main functionality
    }

    if (typeof firebase === 'undefined' || typeof firebase.database === 'undefined') {
        console.error('Firebase SDK not loaded or Realtime Database module missing.');
        locationContentDiv.innerHTML = '<p style="color: red;">Error: Firebase connection not set up. Cannot display locations.</p>';
        if (selfLocationStatusDiv) selfLocationStatusDiv.innerHTML = ''; // Clear any self-status if main fails
        return; // Critical error for main functionality
    }
    const database = firebase.database();
    const locationsRef = database.ref('locations');
    const messagesRef = database.ref('messages');

    // Attempt to share self location first
    shareSelfLocation(); // Call the new function to attempt self-location sharing

    // Then proceed with displaying all locations
    locationContentDiv.innerHTML = '<p>Loading all location data from Firebase...</p>';

    locationsRef.on('value', (snapshot) => {
        const locationsData = snapshot.val();
        // ... (rest of the existing locationsRef.on('value', ...) logic remains unchanged) ...
        // Make sure this existing logic correctly clears and rebuilds the list.
        // For example, ensure it starts with locationContentDiv.innerHTML = ''; or similar if locationsData is present.
        if (locationsData) {
            let htmlContent = '<ul>';
            Object.keys(locationsData).forEach(keyName => { // Changed userName to keyName to avoid conflict
                const person = locationsData[keyName];
                if (!person || typeof person.name === 'undefined') {
                    console.warn('Skipping invalid location entry for key:', keyName, person);
                    return; 
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
            locationContentDiv.innerHTML = '<p>No location data available in Firebase. Waiting for team members to report their locations (or for you to share yours).</p>';
        }
    }, (error) => {
        console.error('Firebase read error (all locations):', error);
        locationContentDiv.innerHTML = `<p style="color: red;">Error fetching data from Firebase: ${error.message}</p>`;
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
