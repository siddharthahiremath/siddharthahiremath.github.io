document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const signUpButton = document.getElementById('sign-up');
    const signInButton = document.getElementById('sign-in');
    const statusDiv = document.getElementById('status');

    async function hashPassword(password) {
        const enc = new TextEncoder();
        const buffer = await crypto.subtle.digest('SHA-256', enc.encode(password));
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    signUpButton.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        if (!email || !password) {
            statusDiv.textContent = 'Email and password required.';
            statusDiv.style.color = 'red';
            return;
        }
        try {
            const hashed = await hashPassword(password);
            await firebase.auth().createUserWithEmailAndPassword(email, hashed);
            statusDiv.textContent = 'Sign-up successful.';
            statusDiv.style.color = 'green';
        } catch (err) {
            statusDiv.textContent = 'Error: ' + err.message;
            statusDiv.style.color = 'red';
        }
    });

    signInButton.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        if (!email || !password) {
            statusDiv.textContent = 'Email and password required.';
            statusDiv.style.color = 'red';
            return;
        }
        try {
            const hashed = await hashPassword(password);
            await firebase.auth().signInWithEmailAndPassword(email, hashed);
            statusDiv.textContent = 'Sign-in successful. Redirecting...';
            statusDiv.style.color = 'green';
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (err) {
            statusDiv.textContent = 'Error: ' + err.message;
            statusDiv.style.color = 'red';
        }
    });
});
