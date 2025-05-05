// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAonQ7yZGzcllCUjLUz6CVfx4CpSdTUHkg",
    authDomain: "ito-online-test.firebaseapp.com",
    projectId: "ito-online-test",
    storageBucket: "ito-online-test.firebasestorage.app",
    messagingSenderId: "943786504123",
    appId: "1:943786504123:web:13c7ccf3c0d609d3945e9e",
    measurementId: "G-HXCQHQ97LF"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
