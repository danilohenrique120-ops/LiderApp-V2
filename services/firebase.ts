import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyC8vZ1jZrE9wpo_YM3rk2BhMiRSfYsqss8",
    authDomain: "projeto-sistema-lider.firebaseapp.com",
    projectId: "projeto-sistema-lider",
    storageBucket: "projeto-sistema-lider.firebasestorage.app",
    messagingSenderId: "831955890134",
    appId: "1:831955890134:web:b399188528357f7540be77",
    measurementId: "G-0QEGX479FK"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("🔥 FIREBASE INIT (Centralized): SUCCESS");
} else {
    console.log("🔥 FIREBASE INIT (Centralized): ALREADY INITIALIZED");
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export default firebase;
