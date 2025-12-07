// Import Firebase from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { firebaseConfig } from "./firebase-config.js";
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// UI Elements
const authContainer = document.getElementById('auth-container');
const chatContainer = document.getElementById('chat-container');
const userDisplay = document.getElementById('user-display');
const commsLog = document.getElementById('comms-log');
const commsInput = document.getElementById('comms-input');
const sendBtn = document.getElementById('comms-send-btn');

// Auth Inputs
const emailInput = document.getElementById('auth-email');
const passInput = document.getElementById('auth-password');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');
const btnGoogle = document.getElementById('btn-google');
const btnLogout = document.getElementById('btn-logout');

let currentUser = null;
let unsubscribeChat = null;

// --- AUTH EVENT LISTENERS ---

// Auth State Observer
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        // User Logged In
        authContainer.style.display = 'none';
        chatContainer.style.display = 'block';
        userDisplay.textContent = `USER: ${user.email || 'ANONYMOUS'} // UID: ${user.uid.substring(0, 6)}...`;

        loadMessages(user);
    } else {
        // User Logged Out
        authContainer.style.display = 'block';
        chatContainer.style.display = 'none';
        userDisplay.textContent = 'USER: DISCONNECTED';

        if (unsubscribeChat) unsubscribeChat();
        commsLog.innerHTML = `<div class="comms-message system-message">> TERMINAL LOCKED. LOGIN REQUIRED.</div>`;
    }
});

// Login
if (btnLogin) {
    btnLogin.addEventListener('click', async () => {
        try {
            await signInWithEmailAndPassword(auth, emailInput.value, passInput.value);
        } catch (error) {
            alert(`LOGIN FAILED: ${error.message}`);
        }
    });
}

// Register
if (btnRegister) {
    btnRegister.addEventListener('click', async () => {
        try {
            await createUserWithEmailAndPassword(auth, emailInput.value, passInput.value);
        } catch (error) {
            alert(`REGISTRATION FAILED: ${error.message}`);
        }
    });
}

// Google Sign In
if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error(error);
            alert(`GOOGLE SIGN-IN FAILED: ${error.message}`);
        }
    });
}

// Logout
if (btnLogout) {
    btnLogout.addEventListener('click', () => signOut(auth));
}

// --- CHAT LOGIC ---

async function loadMessages(user) {
    commsLog.innerHTML = `<div class="comms-message system-message">> ESTABLISHING SECURE CHANNEL...</div>`;

    // Note: This query requires an Index on [uid, timestamp]. 
    // If it fails, check console for the link to create it.
    // For now, we will just filter by UID and sort in Client side if needed, 
    // BUT 'orderBy' is safer done in query. 
    // Let's try simple query first.

    const q = query(
        collection(db, "messages"),
        where("uid", "==", user.uid),
        orderBy("timestamp", "asc")
    );

    unsubscribeChat = onSnapshot(q, (snapshot) => {
        commsLog.innerHTML = ''; // Clear to rebuild or we can append smart
        // Rebuilding is safer for sync issues but less efficient. 
        // For a simple portfolio chat, it's fine.

        if (snapshot.empty) {
            commsLog.innerHTML = `<div class="comms-message system-message">> NO PREVIOUS TRANSMISSIONS FOUND.</div>`;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            // Don't show null text
            if (data.text) {
                appendLog(data.text, data.role === 'admin' ? 'system-message' : 'user-message');
            }
        });

        // Auto scroll
        commsLog.scrollTop = commsLog.scrollHeight;
    }, (error) => {
        console.error("Chat Error:", error);
        if (error.code === 'failed-precondition') {
            commsLog.innerHTML += `<div class="comms-message system-message" style="color:red">> ERROR: MISSING DATABASE INDEX. Check Console.</div>`;
        }
    });
}

// Send Message
if (sendBtn && commsInput) {
    const handleSend = async () => {
        const text = commsInput.value.trim();
        if (!text || !currentUser) return;

        commsInput.value = ''; // Clear input immediately

        try {
            await addDoc(collection(db, "messages"), {
                text: text,
                uid: currentUser.uid,
                email: currentUser.email,
                timestamp: serverTimestamp(),
                role: 'visitor'
            });
            // Snapshot listener will update UI
        } catch (e) {
            console.error("Send Error:", e);
            appendLog(`> TRANSMISSION ERROR`, 'system-message');
        }
    };

    sendBtn.addEventListener('click', handleSend);
    commsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
}

function appendLog(message, className) {
    const div = document.createElement('div');
    div.className = `comms-message ${className || ''}`;
    div.textContent = `> ${message}`;
    commsLog.appendChild(div);
}

// GitHub API Logic
document.addEventListener('DOMContentLoaded', () => {
    const username = 'THEBLUEFLASH18';
    const apiUrl = `https://api.github.com/users/${username}/repos?sort=updated&direction=desc`;

    const cards = document.querySelectorAll('.experiment-card');

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`GitHub API Error: ${response.statusText}`);
            }
            return response.json();
        })
        .then(repos => {
            // Filter out forks if desired, or just take the top 3
            // const myRepos = repos.filter(repo => !repo.fork).slice(0, 3);
            const myRepos = repos.slice(0, 6); // Just take the top 6 most recently updated for now

            myRepos.forEach((repo, index) => {
                if (index < cards.length) {
                    const card = cards[index];
                    updateCard(card, repo);
                }
            });
        })
        .catch(error => {
            console.error('Error fetching repositories:', error);
            // Optional: Update UI to show error state in cards
        });

    function updateCard(card, repo) {
        // Update URL
        card.href = repo.html_url;

        // Update Title - Using a generic "Project // [Repo Name]" format
        const titleEl = card.querySelector('.card-title');
        if (titleEl) titleEl.textContent = `PROJECT // ${repo.name}`;

        // Update Project Name
        const nameValEl = findDetailValue(card, 'PROJECT NAME:');
        if (nameValEl) nameValEl.textContent = repo.name.toUpperCase();

        // Update Language
        const langValEl = findDetailValue(card, 'LANGUAGE:');
        if (langValEl) langValEl.textContent = (repo.language || 'UNKNOWN').toUpperCase();

        // Update Status - logic can be customized. 
        // For now, let's say "ACTIVE" if pushed in last 30 days, else "ARCHIVED"
        const statusValEl = findDetailValue(card, 'STATUS:');
        if (statusValEl) {
            const lastPush = new Date(repo.pushed_at);
            const now = new Date();
            const diffDays = (now - lastPush) / (1000 * 60 * 60 * 24);

            if (diffDays < 30) {
                statusValEl.textContent = 'ACTIVE';
                statusValEl.className = 'detail-value status-active';
            } else {
                statusValEl.textContent = 'ONLINE'; // Default online
                statusValEl.className = 'detail-value status-online';
            }
        }

        // Update Version - Finding latest tag is a separate API call per repo. 
        // For efficiency, we might skip this or set a default. 
        // Or we use 'default_branch' or size as a proxy for "version" if not fetching releases.
        // Let's check releases if we want to be thorough, but strict rate limits apply.
        // For now, let's use a placeholder or "v1.0" 
        const verValEl = findDetailValue(card, 'VERSION:');
        if (verValEl) verValEl.textContent = 'v1.0.0'; // Placeholder as release fetch is expensive

        // Update Last Commit
        const commitValEl = findDetailValue(card, 'LAST COMMIT:');
        if (commitValEl) {
            const date = new Date(repo.pushed_at);
            commitValEl.textContent = date.toISOString().split('T')[0];
        }
    }

    function findDetailValue(card, labelText) {
        const rows = card.querySelectorAll('.detail-row');
        for (const row of rows) {
            const label = row.querySelector('.detail-label');
            if (label && label.textContent.includes(labelText)) {
                return row.querySelector('.detail-value');
            }
        }
        return null;
    }
});
