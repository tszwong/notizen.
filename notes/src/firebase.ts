import { initializeApp } from "firebase/app";
import { getAuth, GithubAuthProvider, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCFyzB5xxp6AOCxH8g70ZD5wpc_-VTmSFY",
    authDomain: "notes-87cc8.firebaseapp.com",
    projectId: "notes-87cc8",
    storageBucket: "notes-87cc8.firebasestorage.app",
    messagingSenderId: "513707185699",
    appId: "1:513707185699:web:fe8e05a787bfb0582f0396",
    measurementId: "G-E4E5641P1L"
};
  
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

export const db = getFirestore(app);