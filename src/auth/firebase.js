import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAn8jgGsRL8qiRE15Qv2d2FtF9A1gQyTGk",
    authDomain: "citadyo.firebaseapp.com",
    projectId: "citadyo",
    storageBucket: "citadyo.firebasestorage.app",
    messagingSenderId: "666641289462",
    appId: "1:666641289462:web:fd7ca457d3a527c99fdcd7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);