const fs = require('fs');

const firebaseConfig = `export const firebaseConfig = {
    apiKey: "${process.env.FIREBASE_KEY || 'PLACEHOLDER_KEY'}",
    authDomain: "portfolio-messaging-53591.firebaseapp.com",
    projectId: "portfolio-messaging-53591",
    storageBucket: "portfolio-messaging-53591.firebasestorage.app",
    messagingSenderId: "96342758934",
    appId: "1:96342758934:web:0ebcf941b940a7a20d4737",
    measurementId: "G-5F0794MX11"
};`;

fs.writeFileSync('./firebase-config.js', firebaseConfig);
console.log('firebase-config.js generated successfully.');
