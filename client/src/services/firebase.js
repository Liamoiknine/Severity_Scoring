// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore }   from "firebase/firestore";
import config             from "../config/firebaseConfig";

const firebaseApp = initializeApp(config);
const db = getFirestore(firebaseApp);

export { db };
