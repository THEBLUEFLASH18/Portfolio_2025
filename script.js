
// Firebase Configuration
// Production: Netlify 'sed' command replaces "FIREBASE_KEY_PLACEHOLDER" with real env var.
const firebaseConfig = {
    apiKey: "FIREBASE_KEY_PLACEHOLDER",
    authDomain: "portfolio-messaging-53591.firebaseapp.com",
    projectId: "portfolio-messaging-53591",
    storageBucket: "portfolio-messaging-53591.firebasestorage.app",
    messagingSenderId: "96342758934",
    appId: "1:96342758934:web:0ebcf941b940a7a20d4737",
    measurementId: "G-5F0794MX11"
};

const app = initializeApp(firebaseConfig);
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

// Debugging
console.log("Portfolio Script Loaded.");

// Auth Inputs
const emailInput = document.getElementById('auth-email');
const passInput = document.getElementById('auth-password');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');
const btnGoogle = document.getElementById('btn-google');
const btnLogout = document.getElementById('btn-logout');

console.log("Auth Elements Found:", { btnLogin, btnRegister, btnGoogle });

let currentUser = null;
let unsubscribeChat = null;

// --- AUTH EVENT LISTENERS ---

// Page State Helper
const isDashboard = window.location.pathname.includes('dashboard.html');

// Auth State Observer
onAuthStateChanged(auth, (user) => {
    console.log("Auth State Changed:", user);
    currentUser = user;

    if (user) {
        // User is Logged In
        if (!isDashboard) {
            // Redirect to Dashboard if on Index
            console.log("Redirecting to Dashboard...");
            window.location.href = 'dashboard.html';
        } else {
            // We are on Dashboard, Init Chat
            userDisplay.textContent = `USER: ${user.email || 'ANONYMOUS'} // UID: ${user.uid.substring(0, 6)}...`;
            loadMessages(user);
        }
    } else {
        // User is Logged Out
        if (isDashboard) {
            // Redirect to Index if on Dashboard
            console.log("Redirecting to Login...");
            window.location.href = 'index.html';
        }
        // On Index, just show login (which is default in HTML now)
        userDisplay.textContent = 'USER: DISCONNECTED';

        if (unsubscribeChat) unsubscribeChat();
        if (commsLog) commsLog.innerHTML = `<div class="comms-message system-message">> TERMINAL LOCKED. LOGIN REQUIRED.</div>`;
    }
});

// Login (Form Submit)
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Login Form Submitted");
        try {
            await signInWithEmailAndPassword(auth, emailInput.value, passInput.value);
            console.log("Login Success");
        } catch (error) {
            console.error("Login Error", error);
            alert(`LOGIN FAILED: ${error.message}`);
        }
    });
}

// Register
if (btnRegister) {
    btnRegister.addEventListener('click', async () => {
        console.log("Register Clicked");
        try {
            await createUserWithEmailAndPassword(auth, emailInput.value, passInput.value);
            console.log("Register Success");
        } catch (error) {
            console.error("Register Error", error);
            alert(`REGISTRATION FAILED: ${error.message}`);
        }
    });
}

// Google Sign In
if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
        console.log("Google Clicked");
        try {
            await signInWithPopup(auth, googleProvider);
            console.log("Google Success");
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

    // Messaging Logic:
    // conversationId is ALWAYS the Visitor's UID.
    // Visitor queries for conversationId == their IDs.
    // Admin replies by sending a message with conversationId == the specific Visitor's UID.

    const q = query(
        collection(db, "messages"),
        where("conversationId", "==", user.uid),
        orderBy("timestamp", "asc")
    );

    unsubscribeChat = onSnapshot(q, (snapshot) => {
        commsLog.innerHTML = '';

        if (snapshot.empty) {
            commsLog.innerHTML = `<div class="comms-message system-message">> SECURE CHANNEL ESTABLISHED. NO HISTORY.</div>`;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.text) {
                // Formatting: specific color for Admin replies?
                // For now, if senderId != user.uid, assume it's Admin (System).
                const isMe = data.senderId === user.uid;
                appendLog(data.text, isMe ? 'user-message' : 'system-message');
            }
        });

        commsLog.scrollTop = commsLog.scrollHeight;
    }, (error) => {
        console.error("Chat Error:", error);
        // Error handling matches previous logic
    });
}

// Send Message
if (sendBtn && commsInput) {
    const handleSend = async () => {
        const text = commsInput.value.trim();
        if (!text || !currentUser) return;

        commsInput.value = '';

        try {
            await addDoc(collection(db, "messages"), {
                text: text,
                conversationId: currentUser.uid, // The channel ID
                senderId: currentUser.uid,       // Who sent this specific message
                email: currentUser.email,
                timestamp: serverTimestamp(),
                role: 'visitor'
            });
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
