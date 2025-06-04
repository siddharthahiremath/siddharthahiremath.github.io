// Simple chat functionality using Firebase Realtime Database

document.addEventListener('DOMContentLoaded', function() {
    const messagesArea = document.getElementById('messages-area');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    if (!messagesArea || !messageInput || !sendButton) {
        console.error('Chat elements not found');
        return;
    }

    if (typeof firebase === 'undefined' || typeof firebase.database === 'undefined') {
        console.error('Firebase not loaded');
        return;
    }

    const database = firebase.database();
    const messagesRef = database.ref('messages');

    let currentUserName = '';

    sendButton.addEventListener('click', function() {
        const text = messageInput.value.trim();
        if (text === '') return;

        if (!currentUserName) {
            const prompted = prompt('Please enter your name to send messages:', '');
            if (!prompted || prompted.trim() === '') return;
            currentUserName = prompted.trim();
        }

        const messageObj = {
            name: currentUserName,
            text: text,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        messagesRef.push(messageObj).then(() => {
            messageInput.value = '';
        }).catch((error) => {
            console.error('Error sending message:', error);
        });
    });

    messagesRef.on('child_added', function(snapshot) {
        const msg = snapshot.val();
        if (!msg || !msg.text || !msg.name) return;

        const time = new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const el = document.createElement('div');
        el.textContent = `${time} - ${msg.name}: ${msg.text}`;
        messagesArea.appendChild(el);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    });
});
