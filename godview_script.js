// Global map-related variables have been removed.

document.addEventListener('DOMContentLoaded', function() {
    // The main container for location entries is now location-list-content
    const locationListDiv = document.getElementById('location-list-content'); 
    const selfLocationStatusDiv = document.getElementById('self-location-status');
    const messagesArea = document.getElementById('messages-area');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    let currentUserName = ''; // Variable to store the user's name

function updateSelfLocationStatus(message, isError = false) {
    // Ensure selfLocationStatusDiv is fetched correctly, possibly inside DOMContentLoaded
    // const selfLocationStatusDiv = document.getElementById('self-location-status'); // Removed redundant declaration
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
        // const userName = prompt("Please enter your name to share your location on the God View:", ""); // Removed redundant declaration
        // if (!userName || userName.trim() === "") { // Associated check also removed
        //     updateSelfLocationStatus("Name not provided. Your location will not be shared.", true);
        //     return;
        // }

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

    // (The self-location related functions are now defined globally or will be called from here)

    // Adjusted to check for locationListDiv
    if (!locationListDiv) {
        console.error('Error: location-list-content div not found!');
        if (selfLocationStatusDiv) selfLocationStatusDiv.innerHTML = '<p style="color: red;">Critical Error: Location list display area missing.</p>';
        return; 
    }

    if (typeof firebase === 'undefined' || typeof firebase.database === 'undefined') {
        console.error('Firebase SDK not loaded or Realtime Database module missing.');
        // Adjusted to use locationListDiv
        locationListDiv.innerHTML = '<p style="color: red;">Error: Firebase connection not set up. Cannot display locations.</p>';
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
        // Get the div where locations will be listed. This is re-fetched here to ensure it's available.
        // const locationListDiv = document.getElementById('location-list-content'); // Removed duplicate declaration
        if (!locationListDiv) {
            console.error("Critical: 'location-list-content' div not found for rendering locations.");
            return; // Cannot proceed without the container
        }

        locationListDiv.innerHTML = ''; // Clear previous list content

        const locationsData = snapshot.val();

        if (locationsData) {
            Object.keys(locationsData).forEach(keyName => {
                const person = locationsData[keyName];
                // Validate essential data, including name, latitude, and longitude.
                if (!person || typeof person.name === 'undefined' || person.latitude === undefined || person.longitude === undefined || person.latitude === 0 || person.longitude === 0) {
                    console.warn('Skipping invalid or incomplete location entry for key:', keyName, person);
                    return; 
                }

                const personDiv = document.createElement('div');
                personDiv.className = 'location-entry'; // Optional: for styling

                let content = `<h3>${person.name}</h3>`;
                content += `<p>Coordinates: ${person.latitude.toFixed(5)}, ${person.longitude.toFixed(5)}</p>`;
                if (person.accuracy) {
                    content += `<p>Accuracy: Approx. ${person.accuracy} meters</p>`;
                }
                content += `<p>Last Updated: ${person.last_updated ? new Date(person.last_updated).toLocaleString() : 'N/A'}</p>`;
                content += `<p>Notes: ${person.notes || 'N/A'}</p>`;
                
                personDiv.innerHTML = content;
                locationListDiv.appendChild(personDiv);
            });
        } else {
            // No location data
            locationListDiv.innerHTML = '<p>No location data available in Firebase. Waiting for team members to report their locations.</p>';
        }
    }, // Correctly closing the snapshot callback body before the comma
    (error) => {
        console.error('Firebase read error (all locations):', error);
        // Ensure locationListDiv is targeted for error messages too
        // const locationListDiv = document.getElementById('location-list-content'); // Removed duplicate declaration
        if (locationListDiv) {
            locationListDiv.innerHTML = `<p style="color: red;">Error fetching data from Firebase: ${error.message}</p>`;
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
