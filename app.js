const HN_API = 'https://hacker-news.firebaseio.com/v0';
const GITHUB_API = 'https://api.github.com';

const state = {
    posts: [],
    repos: new Map(),
    loading: false,
    daysFilter: 3,
    sortBy: 'upvotes'
};

const elements = {
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    errorMessage: document.getElementById('errorMessage'),
    content: document.getElementById('content'),
    repoGrid: document.getElementById('repoGrid'),
    refreshBtn: document.getElementById('refreshBtn'),
    retryBtn: document.getElementById('retryBtn'),
    timeFilter: document.getElementById('timeFilter'),
    modal: document.getElementById('modal'),
    modalBody: document.getElementById('modalBody'),
    modalClose: document.getElementById('modalClose'),
    totalRepos: document.getElementById('totalRepos'),
    totalUpvotes: document.getElementById('totalUpvotes'),
    totalPosts: document.getElementById('totalPosts')
};

const languageColors = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python: '#3572A5',
    Rust: '#dea584',
    Go: '#00ADD8',
    Java: '#b07219',
    C: '#555555',
    'C++': '#f34b7d',
    'C#': '#178600',
    Ruby: '#701516',
    Swift: '#ffac45',
    Kotlin: '#A97BFF',
    PHP: '#4F5D95',
    Shell: '#89e051',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Vue: '#41b883',
    Dart: '#00B4AB',
    Jupyter: '#DA5B0B',
    Lua: '#000080',
    Scala: '#c22d40',
    Haskell: '#5e5086',
    Elixir: '#6e4a7e',
    Clojure: '#db5855',
    R: '#198CE7',
    Julia: '#a270ba',
    Objective: '#438eff',
    Assembly: '#6E4C13',
    TeX: '#3D6117',
    Makefile: '#427819',
    Dockerfile: '#384d54',
    YAML: '#cb171e',
    JSON: '#292929'
};

function init() {
    elements.refreshBtn.addEventListener('click', refreshData);
    elements.retryBtn.addEventListener('click', refreshData);
    elements.timeFilter.addEventListener('change', (e) => {
        state.daysFilter = parseInt(e.target.value);
        refreshData();
    });
    elements.modalClose.addEventListener('click', closeModal);
    elements.modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
    
    loadData();
}

async function loadData() {
    if (state.loading) return;
    
    setLoading(true);
    hideError();
    
    try {
        const newPosts = await fetchHNPosts();
        const githubRepos = extractGitHubRepos(newPosts);
        await fetchGitHubDetails(githubRepos);
        updateStats();
        renderRepos();
    } catch (error) {
        showError('Failed to load data. Please try again.');
        console.error('Error:', error);
    } finally {
        setLoading(false);
    }
}

async function fetchHNPosts() {
    const topStories = await fetchJSON(`${HN_API}/topstories.json`);
    const newStories = await fetchJSON(`${HN_API}/newstories.json`);
    
    const allStoryIds = [...topStories, ...newStories];
    const posts = [];
    
    const batchSize = 50;
    for (let i = 0; i < allStoryIds.length; i += batchSize) {
        const batch = allStoryIds.slice(i, i + batchSize);
        const batchPosts = await Promise.all(
            batch.map(id => fetchJSON(`${HN_API}/item/${id}.json`))
        );
        
        for (const post of batchPosts) {
            if (post && post.url && post.score > 0) {
                posts.push(post);
            }
        }
        
        if (posts.length >= 300) break;
    }
    
    const now = Date.now() / 1000;
    const secondsInDay = 24 * 60 * 60;
    const cutoff = now - (state.daysFilter * secondsInDay);
    
    return posts.filter(post => post.time >= cutoff);
}

function extractGitHubRepos(posts) {
    const repoMap = new Map();
    const githubUrlRegex = /github\.com\/([a-zA-Z0-9][a-zA-Z0-9-]*\/[a-zA-Z0-9._-]+)/g;
    
    for (const post of posts) {
        if (!post.url) continue;
        
        const matches = [...post.url.matchAll(githubUrlRegex)];
        
        for (const match of matches) {
            const repoFullName = match[1];
            
            if (repoFullName.includes('/issues/') || 
                repoFullName.includes('/pull/') ||
                repoFullName.includes('/actions/') ||
                repoFullName.includes('/releases/') ||
                repoFullName.includes('/wiki/') ||
                repoFullName.includes('/discussions/')) {
                continue;
            }
            
            const parts = repoFullName.split('/');
            if (parts.length === 2) {
                const [owner, repo] = parts;
                const cleanRepo = repo.replace(/\.git$/, '').replace(/\/$/, '');
                const cleanFullName = `${owner}/${cleanRepo}`;
                
                if (!repoMap.has(cleanFullName)) {
                    repoMap.set(cleanFullName, {
                        fullName: cleanFullName,
                        owner,
                        repo: cleanRepo,
                        posts: [],
                        totalUpvotes: 0
                    });
                }
                
                const repoData = repoMap.get(cleanFullName);
                repoData.posts.push(post);
                repoData.totalUpvotes += post.score;
            }
        }
    }
    
    state.repos = repoMap;
    return Array.from(repoMap.values());
}

async function fetchGitHubDetails(repos) {
    const batchSize = 10;
    
    for (let i = 0; i < repos.length; i += batchSize) {
        const batch = repos.slice(i, i + batchSize);
        
        const promises = batch.map(async (repoData) => {
            try {
                const response = await fetch(`${GITHUB_API}/repos/${repoData.fullName}`, {
                    headers: {
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (response.ok) {
                    const details = await response.json();
                    repoData.details = details;
                } else if (response.status === 404) {
                    repoData.notFound = true;
                }
            } catch (error) {
                console.warn(`Failed to fetch details for ${repoData.fullName}:`, error);
            }
            
            await sleep(100);
        });
        
        await Promise.all(promises);
    }
}

function updateStats() {
    const validRepos = Array.from(state.repos.values()).filter(r => !r.notFound);
    
    const totalUpvotes = validRepos.reduce((sum, r) => sum + r.totalUpvotes, 0);
    
    elements.totalRepos.textContent = validRepos.length;
    elements.totalUpvotes.textContent = formatNumber(totalUpvotes);
    elements.totalPosts.textContent = validRepos.reduce((sum, r) => sum + r.posts.length, 0);
}

function renderRepos() {
    const validRepos = Array.from(state.repos.values())
        .filter(r => !r.notFound && r.details)
        .sort((a, b) => {
            if (state.sortBy === 'upvotes') {
                return b.totalUpvotes - a.totalUpvotes;
            } else if (state.sortBy === 'stars') {
                return (b.details?.stargazers_count || 0) - (a.details?.stargazers_count || 0);
            } else if (state.sortBy === 'recent') {
                const aMaxTime = Math.max(...a.posts.map(p => p.time));
                const bMaxTime = Math.max(...b.posts.map(p => p.time));
                return bMaxTime - aMaxTime;
            }
            return 0;
        });
    
    if (validRepos.length === 0) {
        elements.repoGrid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M3 7.90624C3 6.30089 3 5.49821 3.4036 4.93605C3.59265 4.67174 3.83817 4.45345 4.125 4.29365C4.73305 3.95492 5.63946 3.95492 7.45228 3.95492H16.5477C18.3605 3.95492 19.2669 3.95492 19.875 4.29365C20.1618 4.45345 20.4074 4.67174 20.5964 4.93605C21 5.49821 21 6.30089 21 7.90624V16.0938C21 17.6991 21 18.5018 20.5964 19.0639C20.4074 19.3283 20.1618 19.5466 19.875 19.7064C19.2669 20.0451 18.3605 20.0451 16.5477 20.0451H7.45228C5.63946 20.0451 4.73305 20.0451 4.125 19.7064C3.83817 19.5466 3.59265 19.3283 3.4036 19.0639C3 18.5018 3 17.6991 3 16.0938V7.90624Z"/>
                    <path d="M9 17C9 18.1046 9.89543 19 11 19H13C14.1046 19 15 18.1046 15 17V15C15 13.8954 14.1046 13 13 13H11C9.89543 13 9 13.8954 9 15V17Z"/>
                    <path d="M9 7H15"/>
                </svg>
                <h3>No repositories found</h3>
                <p>Try adjusting your time filter or check back later for trending GitHub repositories.</p>
            </div>
        `;
        return;
    }
    
    const now = Date.now() / 1000;
    const oneDayAgo = now - (24 * 60 * 60);
    
    elements.repoGrid.innerHTML = validRepos.map(repo => {
        const details = repo.details;
        const isToday = repo.posts.some(p => p.time >= oneDayAgo);
        const postTypes = getPostTypes(repo.posts);
        const latestPost = repo.posts.reduce((latest, p) => p.time > latest.time ? p : latest, repo.posts[0]);
        const maxPostTime = Math.max(...repo.posts.map(p => p.time));
        const daysAgo = Math.floor((now - maxPostTime) / (24 * 60 * 60));
        
        return `
            <div class="repo-card ${isToday ? 'trending' : ''}" data-repo="${repo.fullName}">
                ${isToday ? '<span class="day-badge">Today</span>' : ''}
                <div class="repo-header">
                    <div class="repo-icon">
                        ${details?.owner?.avatar_url 
                            ? `<img src="${details.owner.avatar_url}" alt="${details.owner.login}">`
                            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`
                        }
                    </div>
                    <div class="repo-info">
                        <div class="repo-name">
                            <span class="repo-name-text">${details?.full_name || repo.fullName}</span>
                            ${postTypes.length > 0 ? `<span class="badge badge-${postTypes[0]}">${postTypes[0]}</span>` : ''}
                        </div>
                    </div>
                </div>
                <p class="repo-description">${details?.description || 'No description available'}</p>
                <div class="repo-meta">
                    ${details?.language ? `
                        <span class="meta-item">
                            <span class="language-dot" style="background-color: ${languageColors[details.language] || '#71717a'}"></span>
                            ${details.language}
                        </span>
                    ` : ''}
                    ${details?.stargazers_count !== undefined ? `
                        <span class="meta-item">
                            <strong>${formatNumber(details.stargazers_count)}</strong> stars
                        </span>
                    ` : ''}
                    ${details?.forks_count !== undefined ? `
                        <span class="meta-item">
                            <strong>${formatNumber(details.forks_count)}</strong> forks
                        </span>
                    ` : ''}
                </div>
                <div class="repo-stats">
                    <div class="hn-stats">
                        <span class="hn-stat">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <strong>${formatNumber(repo.totalUpvotes)}</strong> upvotes
                        </span>
                        <span class="hn-stat">
                            <strong>${repo.posts.length}</strong> post${repo.posts.length > 1 ? 's' : ''}
                        </span>
                    </div>
                    <a href="https://news.ycombinator.com/item?id=${latestPost.id}" target="_blank" class="hn-link">
                        View on HN
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                            <polyline points="15,3 21,3 21,9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                    </a>
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.repo-card').forEach(card => {
        card.addEventListener('click', () => {
            const repoName = card.dataset.repo;
            const repo = state.repos.get(repoName);
            if (repo) showRepoModal(repo);
        });
    });
}

function getPostTypes(posts) {
    const types = [];
    
    for (const post of posts) {
        const title = (post.title || '').toLowerCase();
        
        if (title.startsWith('ask') || title.includes('ask hn')) {
            if (!types.includes('ask')) types.push('ask');
        } else if (title.startsWith('show') || title.includes('show hn')) {
            if (!types.includes('show')) types.push('show');
        }
    }
    
    return types;
}

function showRepoModal(repo) {
    const details = repo.details;
    const sortedPosts = [...repo.posts].sort((a, b) => b.time - a.time);
    
    elements.modalBody.innerHTML = `
        <div class="modal-header">
            <div class="modal-repo-icon">
                ${details?.owner?.avatar_url 
                    ? `<img src="${details.owner.avatar_url}" alt="${details.owner.login}">`
                    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`
                }
            </div>
            <div class="modal-repo-info">
                <h2 class="modal-repo-name">
                    <a href="${details?.html_url || `https://github.com/${repo.fullName}`}" target="_blank">
                        ${details?.full_name || repo.fullName}
                    </a>
                    ${getPostTypes(repo.posts).map(type => `<span class="badge badge-${type}">${type}</span>`).join('')}
                </h2>
                <p class="modal-repo-description">${details?.description || 'No description available'}</p>
            </div>
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">Repository Stats</h3>
            <div class="modal-stats">
                <div class="modal-stat">
                    <div class="modal-stat-value">${formatNumber(details?.stargazers_count || 0)}</div>
                    <div class="modal-stat-label">Stars</div>
                </div>
                <div class="modal-stat">
                    <div class="modal-stat-value">${formatNumber(details?.forks_count || 0)}</div>
                    <div class="modal-stat-label">Forks</div>
                </div>
                <div class="modal-stat">
                    <div class="modal-stat-value">${formatNumber(repo.totalUpvotes)}</div>
                    <div class="modal-stat-label">HN Upvotes</div>
                </div>
            </div>
        </div>
        
        ${details?.language ? `
        <div class="modal-section">
            <h3 class="modal-section-title">Language</h3>
            <div class="meta-item">
                <span class="language-dot" style="background-color: ${languageColors[details.language] || '#71717a'}"></span>
                ${details.language}
            </div>
        </div>
        ` : ''}
        
        <div class="modal-section">
            <h3 class="modal-section-title">Hacker News Posts (${sortedPosts.length})</h3>
            <div class="modal-hn-posts">
                ${sortedPosts.map(post => `
                    <div class="modal-hn-post">
                        <h4 class="modal-hn-post-title">
                            <a href="https://news.ycombinator.com/item?id=${post.id}" target="_blank">
                                ${escapeHtml(post.title || 'Untitled')}
                            </a>
                        </h4>
                        <div class="modal-hn-post-meta">
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                <strong>${post.score}</strong> points
                            </span>
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                                </svg>
                                ${post.descendants || 0} comments
                            </span>
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12,6 12,12 16,14"/>
                                </svg>
                                ${timeAgo(post.time)}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    elements.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    elements.modal.classList.add('hidden');
    document.body.style.overflow = '';
}

function setLoading(loading) {
    state.loading = loading;
    elements.loading.classList.toggle('hidden', !loading);
    elements.content.classList.toggle('hidden', loading);
    elements.error.classList.toggle('hidden', loading || !state.error);
    elements.refreshBtn.classList.toggle('loading', loading);
}

function showError(message) {
    state.error = true;
    elements.errorMessage.textContent = message;
    elements.error.classList.remove('hidden');
    elements.loading.classList.add('hidden');
    elements.content.classList.add('hidden');
}

function hideError() {
    state.error = false;
    elements.error.classList.add('hidden');
}

async function refreshData() {
    elements.repoGrid.innerHTML = '';
    await loadData();
}

async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function timeAgo(timestamp) {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

init();
