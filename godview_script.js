// Simple God View implementation that plots all reported locations on a grid
// using Firebase Realtime Database to share coordinates between users.

document.addEventListener('DOMContentLoaded', function() {
    const statusDiv = document.getElementById('self-location-status');
    const canvas = document.getElementById('god-grid');
    const ctx = canvas.getContext('2d');

    let currentUserName = '';

    function setStatus(msg, isError = false) {
        if (statusDiv) {
            statusDiv.textContent = msg;
            statusDiv.style.color = isError ? 'red' : 'green';
        }
    }

    function drawBaseGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#ccc';
        const stepX = canvas.width / 10;
        const stepY = canvas.height / 10;
        for (let i = 0; i <= 10; i++) {
            ctx.beginPath();
            ctx.moveTo(i * stepX, 0);
            ctx.lineTo(i * stepX, canvas.height);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * stepY);
            ctx.lineTo(canvas.width, i * stepY);
            ctx.stroke();
        }
    }
    drawBaseGrid();

    function lonToX(lon) {
        return ((lon + 180) / 360) * canvas.width;
    }

    function latToY(lat) {
        return canvas.height - ((lat + 90) / 180) * canvas.height;
    }

    function renderLocations(data) {
        drawBaseGrid();
        if (!data) return;
        ctx.fillStyle = 'blue';
        ctx.font = '12px sans-serif';
        Object.keys(data).forEach(key => {
            const p = data[key];
            if (!p || p.latitude === undefined || p.longitude === undefined || !p.name) return;
            const x = lonToX(p.longitude);
            const y = latToY(p.latitude);
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillText(p.name, x + 6, y - 6);
        });
    }

    function requestLocation() {
        if (!navigator.geolocation) {
            setStatus('Geolocation is not supported by this browser.', true);
            return;
        }
        setStatus('Requesting location...');
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const locationData = {
                name: currentUserName,
                latitude: lat,
                longitude: lon,
                last_updated: new Date().toISOString()
            };
            firebase.database().ref('locations/' + currentUserName).set(locationData)
                .then(() => setStatus('Location shared.'))
                .catch(err => setStatus('Error sharing location: ' + err.message, true));
        }, () => {
            setStatus('Unable to retrieve your location.', true);
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    }

    if (typeof firebase === 'undefined' || typeof firebase.database === 'undefined') {
        setStatus('Firebase not loaded.', true);
        return;
    }

    const database = firebase.database();
    const locationsRef = database.ref('locations');

    locationsRef.on('value', snapshot => {
        renderLocations(snapshot.val());
    });

    currentUserName = prompt('Please enter your name:','');
    if (currentUserName && currentUserName.trim() !== '') {
        currentUserName = currentUserName.trim();
        requestLocation();
    } else {
        setStatus('Name not provided. Location will not be shared.', true);
    }
});
