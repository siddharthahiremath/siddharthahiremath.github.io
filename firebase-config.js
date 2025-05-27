// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAodAVJtFBoCoWVhraqvEPhw0kwdJI0ua0",
  authDomain: "scioly-280c5.firebaseapp.com",
  databaseURL: "https://scioly-280c5-default-rtdb.firebaseio.com",
  projectId: "scioly-280c5",
  storageBucket: "scioly-280c5.firebasestorage.app", // Corrected from firebasestorage.app
  messagingSenderId: "750532561279",
  appId: "1:750532561279:web:278e0b84ec108aba98324a",
  measurementId: "G-ER3QVVSDGK"
};

// Initialize Firebase
try {
  if (firebase.app()) { // Check if Firebase has already been initialized
    // Do nothing if already initialized to prevent re-initialization errors
  }
} catch (e) { // If firebase.app() throws an error, it means it's not initialized
  firebase.initializeApp(firebaseConfig);
}


// Optional: If you plan to use Analytics, you can keep this.
// For this project, analytics might not be strictly necessary unless you want to track usage.
// import { getAnalytics } from "firebase/analytics";
// const analytics = getAnalytics(app);

// Make the database reference available if needed globally by other scripts,
// though it's often better to get it specifically where needed.
// const database = firebase.database();
