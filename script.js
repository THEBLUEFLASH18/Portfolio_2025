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
            const myRepos = repos.slice(0, 3); // Just take the top 3 most recently updated for now

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
