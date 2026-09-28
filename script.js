// script.js — public page behaviour. Firebase (auth + chat) lives in comms.js
// and is imported only when it is actually needed, so the public page paints
// without downloading ~300 KB of Firebase.

import { MatrixText } from "./matrix.js";

// GitHub API Logic
// Cards that carry a data-repo attribute get their last-commit date and
// activity status from the GitHub API. Everything else on the card is
// authored in the HTML so crawlers and LLMs see real content without JS.
document.addEventListener('DOMContentLoaded', () => {
    const username = 'THEBLUEFLASH18';
    const cards = document.querySelectorAll('.experiment-card[data-repo]');

    cards.forEach(card => {
        const repo = card.dataset.repo;
        fetch(`https://api.github.com/repos/${username}/${repo}`)
            .then(response => {
                if (!response.ok) throw new Error(`GitHub API Error: ${response.statusText}`);
                return response.json();
            })
            .then(data => updateCard(card, data))
            .catch(error => console.error(`Error fetching ${repo}:`, error));
    });

    function updateCard(card, repo) {
        const row = card.querySelector('[data-row="last-commit"]');
        if (row && repo.pushed_at) {
            const date = new Date(repo.pushed_at);
            row.querySelector('.detail-value').textContent = date.toISOString().split('T')[0];
            row.hidden = false;
        }

        const statusValEl = findDetailValue(card, 'STATUS:');
        if (statusValEl && repo.pushed_at) {
            const diffDays = (Date.now() - new Date(repo.pushed_at)) / (1000 * 60 * 60 * 24);
            if (diffDays < 30) {
                statusValEl.textContent = 'ACTIVE';
                statusValEl.className = 'detail-value status-active';
            }
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

// Matrix name reveal
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('matrix-identity')) {
        new MatrixText("matrix-identity", {
            letterAnimationDuration: 500,
            letterInterval: 100
        });
    }
});

// Comms // Uplink: load Firebase on demand
(() => {
    const isDashboard = window.location.pathname.includes('dashboard.html');
    let loaded = false;
    const loadComms = () => {
        if (loaded) return;
        loaded = true;
        import('./comms.js').catch((err) => console.error('Comms failed to load:', err));
    };

    if (isDashboard) { loadComms(); return; }

    const section = document.getElementById('comms-uplink');
    if (!section) return;

    // Any interaction with the auth form loads immediately.
    ['focusin', 'pointerdown'].forEach((evt) => section.addEventListener(evt, loadComms, { once: true, passive: true }));

    // Otherwise load once the section is close to the viewport.
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) { loadComms(); io.disconnect(); }
        }, { rootMargin: '600px 0px' });
        io.observe(section);
    } else {
        loadComms();
    }
})();
