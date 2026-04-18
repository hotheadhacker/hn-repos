const HN_API = 'https://hacker-news.firebaseio.com/v0';
const GITHUB_API = 'https://api.github.com';

const state = {
    repos: new Map(),
    loading: false,
    daysFilter: 1,
    sortBy: 'upvotes',
    progress: 0,
    detailRepo: null,
    loadingPhase: '',
    msgTimer: null
};

const waitingMessages = {
    hn: [
        'Scanning top stories on Hacker News...',
        'Checking what the community is talking about...',
        'Fetching story IDs from the HN API...',
        'Looking for trending discussions...',
        'Still loading — HN serves data in batches...',
        'Processing story scores and timestamps...',
        'Filtering for recent posts...',
        'Almost there with the HN data...'
    ],
    github: [
        'Contacting the GitHub API for repo details...',
        'Fetching stars, forks, and descriptions...',
        'Looking up repository metadata...',
        'This takes a moment — one repo at a time...',
        'Building the full picture for each project...',
        'Cross-referencing HN posts with GitHub repos...',
        'Still fetching — GitHub API handles one request at a time...',
        'Adding language and license info...'
    ],
    render: [
        'Building the results page...',
        'Almost ready — putting it all together...',
        'Sorting repositories by popularity...',
        'Rendering repository cards...',
        'Finishing up — just a sec...'
    ]
};

const $ = id => document.getElementById(id);

const el = {
    loadingView: $('loadingView'),
    loadingText: $('loadingText'),
    loadingBarFill: $('loadingBarFill'),
    errorView: $('errorView'),
    errorText: $('errorText'),
    retryBtn: $('retryBtn'),
    mainView: $('mainView'),
    repoList: $('repoList'),
    detailView: $('detailView'),
    detailContent: $('detailContent'),
    detailBack: $('detailBack'),
    refreshBtn: $('refreshBtn'),
    timeFilter: $('timeFilter'),
    logoBtn: $('logoBtn'),
    statRepos: $('statRepos'),
    statVotes: $('statVotes'),
    statPosts: $('statPosts'),
    infoModal: $('infoModal'),
    modalContent: $('modalContent'),
    modalCloseBtn: $('modalCloseBtn'),
    sortPills: document.querySelectorAll('.sort-pill')
};

const langColors = {
    JavaScript:'#f1e05a',TypeScript:'#3178c6',Python:'#3572A5',Rust:'#dea584',Go:'#00ADD8',
    Java:'#b07219',C:'#555555','C++':'#f34b7d','C#':'178600',Ruby:'#701516',Swift:'#ffac45',
    Kotlin:'#A97BFF',PHP:'#4F5D95',Shell:'#89e051',HTML:'#e34c26',CSS:'#563d7c',Vue:'#41b883',
    Dart:'#00B4AB',Haskell:'#5e5086',Elixir:'#6e4a7e',Clojure:'#db5855',Scala:'#c22d40',
    R:'#198CE7',Julia:'#a270ba',Objective:'#438eff',Solidity:'#DA627D',Dockerfile:'#384d54',
    Lua:'#000080',Jupyter:'#DA5B0B',TeX:'#3D6117',Makefile:'#427819',Nim:'#ffc200',
    Zig:'#ec915c',Svelte:'#ff3e00'
};

function init() {
    el.refreshBtn.addEventListener('click', refreshData);
    el.retryBtn.addEventListener('click', refreshData);
    el.timeFilter.addEventListener('change', e => { state.daysFilter = +e.target.value; refreshData(); });
    el.logoBtn.addEventListener('click', e => { e.preventDefault(); showMain(); });
    el.detailBack.addEventListener('click', showMain);
    el.modalCloseBtn.addEventListener('click', closeModal);
    el.infoModal.addEventListener('click', e => { if (e.target === el.infoModal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
    el.sortPills.forEach(btn => btn.addEventListener('click', () => {
        el.sortPills.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.sortBy = btn.dataset.sort;
        renderList();
    }));
    loadData();
}

function setProgress(pct, text) {
    state.progress = pct;
    el.loadingBarFill.style.width = pct + '%';
    if (text) el.loadingText.textContent = text;
}

function startWaitingMessages(phase) {
    stopWaitingMessages();
    state.loadingPhase = phase;
    const msgs = waitingMessages[phase];
    if (!msgs) return;
    let idx = 0;
    el.loadingText.textContent = msgs[0];
    state.msgTimer = setInterval(() => {
        idx++;
        if (idx < msgs.length) {
            el.loadingText.textContent = msgs[idx];
        } else {
            el.loadingText.textContent = msgs[msgs.length - 1];
        }
    }, 3000);
}

function stopWaitingMessages() {
    if (state.msgTimer) { clearInterval(state.msgTimer); state.msgTimer = null; }
}

function showView(name) {
    el.loadingView.classList.toggle('hidden', name !== 'loading');
    el.errorView.classList.toggle('hidden', name !== 'error');
    el.mainView.classList.toggle('hidden', name !== 'main');
    el.detailView.classList.toggle('hidden', name !== 'detail');
}

function showMain() {
    state.detailRepo = null;
    showView('main');
    window.scrollTo(0, 0);
}

function closeModal() { el.infoModal.classList.add('hidden'); }

async function loadData() {
    if (state.loading) return;
    state.loading = true;
    el.refreshBtn.classList.add('loading');
    showView('loading');
    setProgress(5, '');
    startWaitingMessages('hn');

    try {
        const posts = await fetchHNPosts();
        setProgress(40, '');
        startWaitingMessages('github');
        const repoList = extractGitHubRepos(posts);
        setProgress(55, '');
        await fetchGitHubDetails(repoList);
        stopWaitingMessages();
        setProgress(90, '');
        startWaitingMessages('render');
        updateStats();
        renderList();
        stopWaitingMessages();
        setProgress(100, 'Done!');
        setTimeout(() => { showView('main'); state.loading = false; el.refreshBtn.classList.remove('loading'); }, 300);
    } catch (err) {
        stopWaitingMessages();
        el.errorText.textContent = 'Failed to load data. ' + err.message;
        showView('error');
        state.loading = false;
        el.refreshBtn.classList.remove('loading');
    }
}

async function fetchHNPosts() {
    const [topIds, newIds] = await Promise.all([
        fetchJSON(`${HN_API}/topstories.json`),
        fetchJSON(`${HN_API}/newstories.json`)
    ]);
    const allIds = [...topIds.slice(0, 200), ...newIds.slice(0, 100)];
    const seen = new Set();
    const deduped = allIds.filter(id => { if (seen.has(id)) return false; seen.add(id); return true; });

    const posts = [];
    const batch = 50;
    for (let i = 0; i < deduped.length; i += batch) {
        const chunk = deduped.slice(i, i + batch);
        const results = await Promise.all(chunk.map(id => fetchJSON(`${HN_API}/item/${id}.json`).catch(() => null)));
        for (const p of results) {
            if (p && p.url && p.score > 0) posts.push(p);
        }
        setProgress(5 + Math.floor((i / deduped.length) * 35), 'Loading from Hacker News...');
    }
    const now = Date.now() / 1000;
    return posts.filter(p => p.time >= now - state.daysFilter * 86400);
}

function extractGitHubRepos(posts) {
    const repoMap = new Map();
    for (const post of posts) {
        if (!post.url) continue;
        const m = post.url.match(/github\.com\/([a-zA-Z0-9][\w.-]*\/[a-zA-Z0-9._-]+)/);
        if (!m) continue;
        const fullName = m[1];
        if (/\/(issues|pull|actions|releases|wiki|discussions|commit|tree|blob|compare)\//.test(fullName)) continue;
        const parts = fullName.split('/');
        if (parts.length !== 2) continue;
        const clean = parts[0] + '/' + parts[1].replace(/\.git$/, '').replace(/\/$/, '');
        if (!repoMap.has(clean)) repoMap.set(clean, { fullName: clean, owner: parts[0], repo: parts[1].replace(/\.git$/, ''), posts: [], totalUpvotes: 0 });
        const r = repoMap.get(clean);
        r.posts.push(post);
        r.totalUpvotes += post.score;
    }
    state.repos = repoMap;
    return [...repoMap.values()];
}

async function fetchGitHubDetails(repos) {
    const batch = 10;
    for (let i = 0; i < repos.length; i += batch) {
        const chunk = repos.slice(i, i + batch);
        await Promise.all(chunk.map(async r => {
            try {
                const res = await fetch(`${GITHUB_API}/repos/${r.fullName}`, { headers: { Accept: 'application/vnd.github.v3+json' } });
                if (res.ok) r.details = await res.json();
                else if (res.status === 404) r.notFound = true;
            } catch {}
        }));
        const pct = 55 + Math.floor(((i + batch) / repos.length) * 35);
        setProgress(Math.min(pct, 90), 'Fetching GitHub repository details...');
    }
}

function updateStats() {
    const valid = [...state.repos.values()].filter(r => !r.notFound && r.details);
    el.statRepos.textContent = valid.length;
    el.statVotes.textContent = fmt(valid.reduce((s, r) => s + r.totalUpvotes, 0));
    el.statPosts.textContent = valid.reduce((s, r) => s + r.posts.length, 0);
}

function renderList() {
    const valid = [...state.repos.values()]
        .filter(r => !r.notFound && r.details)
        .sort((a, b) => {
            if (state.sortBy === 'stars') return (b.details?.stargazers_count || 0) - (a.details?.stargazers_count || 0);
            if (state.sortBy === 'recent') return Math.max(...b.posts.map(p => p.time)) - Math.max(...a.posts.map(p => p.time));
            return b.totalUpvotes - a.totalUpvotes;
        });

    if (!valid.length) {
        el.repoList.innerHTML = '<div class="empty-state"><p>No GitHub repositories found in recent HN posts.</p></div>';
        return;
    }

    const now = Date.now() / 1000;
    const oneDay = 86400;

    el.repoList.innerHTML = valid.map(r => {
        const d = r.details;
        const isToday = r.posts.some(p => p.time >= now - oneDay);
        const latestPost = r.posts.reduce((mx, p) => p.time > mx.time ? p : mx, r.posts[0]);
        const types = getTypes(r.posts);
        const timeAgo = fmtTime(now - latestPost.time);
        const commentCount = r.posts.reduce((s, p) => s + (p.descendants || 0), 0);

        return `
        <div class="repo-card ${isToday ? 'trending' : ''}" data-repo="${r.fullName}">
            <div class="card-top">
                <div class="card-title-row">
                    <a class="card-owner" href="https://github.com/${d.owner?.login || r.owner}" target="_blank" rel="noopener">${d.owner?.login || r.owner}</a>
                    <span class="card-slash">/</span>
                    <a class="card-repo" href="https://github.com/${r.fullName}" target="_blank" rel="noopener">${d.name || r.repo}</a>
                    ${d.private ? '<span class="card-visibility">Private</span>' : '<span class="card-visibility">Public</span>'}
                    ${types.map(t => `<span class="badge badge-${t}">${t === 'ask' ? 'Ask HN' : 'Show HN'}</span>`).join('')}
                </div>
                <div class="card-actions">
                    <button class="card-info-btn" data-info="${r.fullName}" title="HN Discussion">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-2.5h3a.75.75 0 010 1.5H8.56l-1.5 5.65a.75.75 0 01-1.44-.4l1.38-5.25H6.5a.75.75 0 010-1.5z"/></svg>
                    </button>
                </div>
            </div>
            <p class="card-desc">${d.description || ''}</p>
            <div class="card-bottom">
                ${d.language ? `<span class="card-tag"><span class="lang-dot" style="background:${langColors[d.language] || '#8b949e'}"></span>${d.language}</span>` : ''}
                <span class="card-tag"><svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg> <strong>${fmt(d.stargazers_count)}</strong></span>
                <span class="card-hn">
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3l-2-1.5V5h1.5v3.75L10.5 10 9 11z"/></svg>
                    ${fmt(r.totalUpvotes)} upvotes
                </span>
                ${commentCount > 0 ? `<span class="card-comments"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 2h13a.5.5 0 01.5.5v8a.5.5 0 01-.5.5H5.21l-3.44 3.44A.5.5 0 011 13.5v-11a.5.5 0 01.5-.5zm0-1A1.5 1.5 0 000 2.5v11a1.5 1.5 0 002.56 1.06L5.56 11H14.5a1.5 1.5 0 001.5-1.5v-8A1.5 1.5 0 0014.5 0h-13z"/></svg> ${fmt(commentCount)} comments</span>` : ''}
                <span class="card-updated">${timeAgo}</span>
                ${r.posts.length > 1 ? `<span class="card-tag">${r.posts.length} posts</span>` : ''}
            </div>
        </div>`;
    }).join('');

    el.repoList.querySelectorAll('.repo-card').forEach(card => {
        const fullName = card.dataset.repo;
        const infoBtn = card.querySelector('.card-info-btn');

        infoBtn.addEventListener('click', e => {
            e.stopPropagation();
            openInfoModal(fullName);
        });

        card.addEventListener('click', e => {
            if (e.target.closest('.card-info-btn') || e.target.closest('a')) return;
            openDetail(fullName);
        });
    });
}

function getTypes(posts) {
    const types = [];
    for (const p of posts) {
        const t = (p.title || '').toLowerCase();
        if (t.startsWith('ask') || t.includes('ask hn')) { if (!types.includes('ask')) types.push('ask'); }
        else if (t.startsWith('show') || t.includes('show hn')) { if (!types.includes('show')) types.push('show'); }
    }
    return types;
}

function openInfoModal(fullName) {
    const repo = state.repos.get(fullName);
    if (!repo) return;
    const sorted = [...repo.posts].sort((a, b) => b.time - a.time);

    el.modalContent.innerHTML = sorted.map(p => `
        <div class="modal-hn-item">
            <div class="modal-hn-title"><a href="https://news.ycombinator.com/item?id=${p.id}" target="_blank" rel="noopener">${esc(p.title)}</a></div>
            <div class="modal-hn-meta">
                <span>🔥 ${p.score} points</span>
                <span>💬 ${p.descendants || 0} comments</span>
                <span>${fmtTime(Date.now()/1000 - p.time)}</span>
            </div>
        </div>
    `).join('');

    el.infoModal.classList.remove('hidden');
}

async function openDetail(fullName) {
    const repo = state.repos.get(fullName);
    if (!repo || !repo.details) return;
    state.detailRepo = repo;
    showView('detail');
    window.scrollTo(0, 0);

    const d = repo.details;
    const sorted = [...repo.posts].sort((a, b) => b.time - a.time);
    const types = getTypes(repo.posts);

    el.detailContent.innerHTML = `
        <div class="detail-header">
            <div class="detail-avatar">
                ${d.owner?.avatar_url ? `<img src="${d.owner.avatar_url}" alt="" loading="lazy">` : ''}
            </div>
            <div class="detail-title-area">
                <div class="detail-title">
                    <a class="detail-owner-link" href="https://github.com/${d.owner?.login || repo.owner}" target="_blank" rel="noopener">${d.owner?.login || repo.owner}</a>
                    /
                    <a class="detail-repo-link" href="${d.html_url}" target="_blank" rel="noopener">${d.name || repo.repo}</a>
                    ${types.map(t => `<span class="badge badge-${t}">${t === 'ask' ? 'Ask HN' : 'Show HN'}</span>`).join('')}
                </div>
                <p class="detail-desc">${d.description || 'No description'}</p>
            </div>
        </div>

        <div class="detail-tags">
            ${d.language ? `<span class="detail-tag"><span class="lang-dot" style="background:${langColors[d.language] || '#8b949e'}"></span> ${d.language}</span>` : ''}
            <span class="detail-tag">⭐ ${fmt(d.stargazers_count)} stars</span>
            <span class="detail-tag">🔱 ${fmt(d.forks_count)} forks</span>
            <span class="detail-tag">🔥 ${fmt(repo.totalUpvotes)} HN upvotes</span>
            ${d.license?.spdx_id ? `<span class="detail-tag">⚖️ ${d.license.spdx_id}</span>` : ''}
            ${d.size ? `<span class="detail-tag">📦 ${fmtSize(d.size)}</span>` : ''}
        </div>

        <div class="detail-section">
            <div class="detail-section-head">
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3l-2-1.5V5h1.5v3.75L10.5 10 9 11z"/></svg>
                Hacker News Discussion
                <span class="section-count">${sorted.length} post${sorted.length > 1 ? 's' : ''}</span>
            </div>
            ${sorted.map(p => `
                <div class="hn-post-item">
                    <div class="hn-post-score">${p.score}</div>
                    <div class="hn-post-body">
                        <div class="hn-post-title"><a href="https://news.ycombinator.com/item?id=${p.id}" target="_blank" rel="noopener">${esc(p.title)}</a></div>
                        <div class="hn-post-meta">
                            <span>💬 ${p.descendants || 0} comments</span>
                            <span>${fmtTime(Date.now()/1000 - p.time)}</span>
                            <a href="https://news.ycombinator.com/item?id=${p.id}" target="_blank" rel="noopener">View on HN →</a>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="detail-section">
            <div class="readme-head">
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 3.5A1.5 1.5 0 012.5 2h3.879a1.5 1.5 0 011.06.44l1.122 1.12A1.5 1.5 0 009.62 4H13.5A1.5 1.5 0 0115 5.5v8a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 13.5v-10z"/></svg>
                README
            </div>
            <div class="readme-body" id="readmeBody">
                <div class="readme-empty">Loading README...</div>
            </div>
        </div>
    `;

    fetchReadme(repo.fullName);
}

async function fetchReadme(fullName) {
    const readmeBody = $('readmeBody');
    try {
        const res = await fetch(`https://api.github.com/repos/${fullName}/readme`, {
            headers: { Accept: 'application/vnd.github.v3.raw' }
        });
        if (!res.ok) throw new Error('No README');
        const md = await res.text();
        readmeBody.innerHTML = `<div class="markdown-body">${marked.parse(md)}</div>`;
        readmeBody.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
        });
        readmeBody.querySelectorAll('a').forEach(a => {
            if (a.href && !a.href.startsWith(location.origin)) {
                a.target = '_blank';
                a.rel = 'noopener';
            }
        });
        const imgProxy = (src) => {
            if (!src) return src;
            if (src.startsWith('http')) return src;
            return `https://raw.githubusercontent.com/${fullName}/${state.detailRepo?.details?.default_branch || 'main'}/${src.replace(/^\.?\/?/, '')}`;
        };
        readmeBody.querySelectorAll('img').forEach(img => {
            if (img.src && !img.src.startsWith('http')) {
                const fixed = imgProxy(img.getAttribute('src'));
                if (fixed) img.src = fixed;
            }
            img.loading = 'lazy';
        });
    } catch {
        readmeBody.innerHTML = '<div class="readme-empty">No README available for this repository.</div>';
    }
}

async function fetchJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
}

function fmt(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
}

function fmtSize(kb) {
    if (kb >= 1e6) return (kb / 1e6).toFixed(1) + ' GB';
    if (kb >= 1e3) return (kb / 1e3).toFixed(1) + ' MB';
    return kb + ' KB';
}

function fmtTime(s) {
    s = Math.floor(s);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    if (s < 604800) return Math.floor(s / 86400) + 'd ago';
    return Math.floor(s / 604800) + 'w ago';
}

function esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

async function refreshData() {
    el.repoList.innerHTML = '';
    await loadData();
}

init();