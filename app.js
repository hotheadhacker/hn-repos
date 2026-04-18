const HN_API = 'https://hacker-news.firebaseio.com/v0';
const GITHUB_API = 'https://api.github.com';

const state = {
    posts: [],
    repos: new Map(),
    loading: false,
    daysFilter: 1,
    sortBy: 'upvotes',
    progress: 0,
    loadingStep: 'hn'
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
    totalPosts: document.getElementById('totalPosts'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    currentTime: document.getElementById('currentTime'),
    sortBtns: document.querySelectorAll('.sort-btn')
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
    JSON: '#292929',
    Solidity: '#DA627D',
    PowerShell: '#012456',
    HCL: '#844FBA',
    Starlark: '#76d275',
    'AGS Script': '#b9d9ff',
    'AMPL': '#E6EFBB',
    Glimmer: '#F5835F',
    ABAP: '#E8274B',
    '4D': '#004289',
    Apex: '#1797c0',
    Arc: '#aa2afe',
    ASP: '#6a40fd',
    AspectJ: '#a957b0',
    Augeas: '#9CC134',
    AutoHotkey: '#6594b9',
    AutoIt: '#1C3552',
    Awk: '#c30e9b',
    Ballerina: '#FF5F09',
    BASIC: '#00539C',
    Batchfile: '#C1F12E',
    Befunge: '#efb209',
    Bison: '#6a463f',
    BitBake: '#00bce4',
    Blade: '#f7523f',
    Bluespec: '#12223c',
    Boo: '#d4bec1',
    Brainfuck: '#2F2530',
    Brightscript: '#662D91',
    Ceylon: '#dfa535',
    Chapel: '#8dc63f',
    ChucK: '#3f8000',
    Cirru: '#ccccff',
    Clarion: '#db901e',
    Clean: '#3F85AF',
    Click: '#E4E6F3',
    CLIPS: '#00A300',
    CMake: '#DA3435',
    COBOL: '#2B3856',
    CoffeeScript: '#244776',
    ColdFusion: '#ed2cd6',
    ColdFusion CFC: '#ed2cd6',
    Common Lisp: '#3fb68b',
    Component Pascal: '#B0CE4E',
    Coq: '#d0b68c',
    Crystal: '#000100',
    Cuda: '#3A4E3A',
    Cython: '#fedf5b',
    D: '#ba595e',
    Dafny: '#FFEC25',
    Dart: '#00B4AB',
    DataWeave: '#003a52',
    Dhall: '#dfafff',
    DIGITAL Command Language: '#0532bd',
    DM: '#447265',
    Dogescript: '#cca760',
    DTrace: '#3405b1',
    Dylan: '#6c616e',
    E: '#ccce35',
    eC: '#913960',
    Edje: '#396884',
    Eiffel: '#946d57',
    EJS: '#a91e50',
    Emacs Lisp: '#c065db',
    EmberScript: '#FFF4F3',
    EQ: '#a78649',
    Erlang: '#B83998',
    F#: '#b845fc',
    Factor: '#636746',
    Fancy: '#7b9db4',
    Fantom: '#14253c',
    Filebench WML: '#6d80b6',
    Filterscript: '#0044a5',
    fish: '#4aae47',
    Fluent: '#ffcc33',
    Forth: '#341708',
    Fortran: '#4d41b1',
    FreeMarker: '#0050b2',
    Frege: '#00cafe',
    Game Maker Language: '#71b417',
    GAMS: '#f49a22',
    GAP: '#0000cc',
    GCC Machine Description: '#FFCFAB',
    GDB: '#c5c5c5',
    GDScript: '#355570',
    Genie: '#fb855d',
    Genshi: '#951531',
    Gentoo Ebuild: '#9400ff',
    Gentoo Eclass: '#9400ff',
    Gherkin: '#5B2063',
    GLSL: '#5686a5',
    Gnuplot: '#f0a9f0',
    Go: '#00ADD8',
    Golo: '#88562A',
    Gosu: '#82937f',
    Grace: '#615f8b',
    Gradle: '#02303a',
    Groovy: '#e69f56',
    Groovy Server Pages: '#e69f56',
    Hack: '#878787',
    Haml: '#ece2a9',
    Handlebars: '#f7931e',
    Harbour: '#0e60e3',
    Haskell: '#5e5086',
    Haxe: '#df7900',
    HCL: '#844FBA',
    HiveQL: '#dce200',
    HLSL: '#aace60',
    HolyC: '#ffefaf',
    HTML: '#e34c26',
    Hy: '#7790B2',
    HyPhy: '#3B8311',
    IDL: '#a3522f',
    Idris: '#b30000',
    IGOR Pro: '#0000cc',
    Inform 7: '#623d4a',
    Inno Setup: '#264b99',
    Io: '#a9188d',
    Ioke: '#078193',
    Isabelle: '#FEFE00',
    Isabelle ROOT: '#FEFE00',
    J: '#9EEDFF',
    Jasmin: '#d03600',
    Java: '#b07219',
    Java Server Pages: '#2B5F75',
    JavaScript: '#f1e05a',
    JavaScript+ERB: '#f1e05a',
    JFlex: '#DBCA00',
    Jison: '#56b37d',
    Jison Lex: '#56b37d',
    Jolie: '#843179',
    JSONiq: '#40d47e',
    Jsonnet: '#0064bd',
    JSX: '#3178c6',
    Julia: '#a270ba',
    'Jupyter Notebook': '#DA5B0B',
    Kotlin: '#A97BFF',
    KRL: '#28430A',
    LabVIEW: '#fede06',
    Lasso: '#999999',
    Latte: '#f2a542',
    Lean: '#e30065',
    Less: '#1d365d',
    Lex: '#DBCA00',
    LFE: '#4C3023',
    LilyPond: '#9ccc7c',
    Limbo: '#446968',
    Literate Agda: '#315665',
    'Literate CoffeeScript': '#244776',
    'Literate Haskell': '#5e5086',
    LiveScript: '#499886',
    LLVM: '#185619',
    Logos: '#6f0000',
    Logtalk: '#295b9a',
    LookML: '#652B81',
    LoomScript: '#f56757',
    LSL: '#3d9970',
    Lua: '#000080',
    M: '#28430A',
    M4: '#28430A',
    M4Sugar: '#28430A',
    Macaulay2: '#d8ffff',
    Makefile: '#427819',
    Mako: '#7e858d',
    Markdown: '#083fa1',
    Marko: '#42bff2',
    Mask: '#f97732',
    Mathematica: '#dd1100',
    MATLAB: '#e16737',
    Max: '#c4a79c',
    MAXScript: '#00a6a6',
    mcfunction: '#E22837',
    Mercury: '#ff2b2b',
    Meson: '#007800',
    Metal: '#8f14e9',
    MiniD: '#000000',
    Mirah: '#c7a938',
    Modelica: '#de1d31',
    'Modula-2': '#10253f',
    'Modula-3': '#223388',
    'Module Management System': '#007800',
    Monkey: '#000000',
    Moocode: '#000000',
    MoonScript: '#ff4585',
    MQL4: '#62A8D6',
    MQL5: '#4A76B8',
    MTML: '#b7e1f4',
    MUF: '#3405b1',
    mupad: '#244963',
    Myghty: '#000000',
    NCL: '#28431f',
    Nearley: '#990000',
    Nemerle: '#3d3c6e',
    nesC: '#94B0C7',
    NetLinx: '#0aa0ff',
    'NetLinx+ERB': '#747faa',
    NetLogo: '#ff6375',
    NewLisp: '#87AED7',
    Nextflow: '#3ac486',
    Nim: '#ffc200',
    Nit: '#009917',
    Nix: '#7e7eff',
    NSIS: '#694946',
    Nu: '#c9df40',
    NumPy: '#9C8AF9',
    'Objective-C': '#438eff',
    'Objective-C++': '#6866fb',
    'Objective-J': '#ff0c5a',
    OCaml: '#3be133',
    Omgrofl: '#cabbff',
    ooc: '#b0b77e',
    Opa: '#20ce00',
    Opal: '#f7ede0',
    OpenCL: '#ed2e2d',
    OpenEdge ABL: '#5ce600',
    OpenRC runscript: '#3d3c6e',
    OpenSCAD: '#e5cd45',
    Oz: '#fab738',
    P4: '#7055b5',
    Pan: '#cc0000',
    Papyrus: '#0038a5',
    Parrot: '#f3ca0a',
    'Parrot Assembly': '#000000',
    'Parrot Internal Representation': '#000000',
    Pascal: '#E3F171',
    Pawn: '#dbb284',
    Pep8: '#C76F5B',
    Perl: '#0298c3',
    Perl 6: '#0000fb',
    PHP: '#4F5D95',
    PicoLisp: '#6067af',
    PigLatin: '#fcd7de',
    Pike: '#005390',
    PLpgSQL: '#336790',
    PLSQL: '#dad8d8',
    PogoScript: '#d80074',
    Pony: '#000000',
    PostScript: '#da291c',
    POV-Ray SDL: '#6bac65',
    PowerBuilder: '#8f0f8d',
    PowerShell: '#012456',
    Processing: '#0096D8',
    Prolog: '#74283c',
    'Propeller Spin': '#7fa2a7',
    Pug: '#a86454',
    Puppet: '#302B6D',
    PureBasic: '#5a6986',
    PureScript: '#1D222D',
    Python: '#3572A5',
    'Python console': '#3572A5',
    Q#: '#fed659',
    QMake: '#000000',
    QML: '#44a51c',
    R: '#198CE7',
    Racket: '#3c5caa',
    Ragel: '#9d5200',
    Raku: '#0000fb',
    RAML: '#77d9fb',
    Rascal: '#fffaa0',
    REALbasic: '#000000',
    Reason: '#ff5847',
    Rebol: '#358a5b',
    'Red/System': '#75d1c2',
    Red: '#f50000',
    Ren'Py: '#ff7f7f',
    RenderScript: '#3d3c6e',
    REXX: '#d90e09',
    Ring: '#2D54CB',
    RobotFramework: '#00c0b5',
    Roff: '#ecdebe',
    Rouge: '#cc0088',
    RPC: '#3d3c6e',
    Ruby: '#701516',
    RUNOFF: '#665a4e',
    Rust: '#dea584',
    Sage: '#000000',
    SaltStack: '#646464',
    SAS: '#B34936',
    Sass: '#a53b70',
    Scala: '#c22d40',
    Scheme: '#1e4aec',
    Scilab: '#ca0f21',
    SCSS: '#c6538c',
    sed: '#64b970',
    Self: '#0579aa',
    ShaderLab: '#222c37',
    Shell: '#89e051',
    ShellSession: '#3d3c6e',
    Shen: '#120F14',
    Slash: '#007eff',
    Smali: '#3d3c6e',
    Smalltalk: '#596706',
    Smarty: '#f0c040',
    SmPL: '#c94949',
    SMT: '#3d3c6e',
    Solidity: '#DA627D',
    SourcePawn: '#f69e1d',
    SQF: '#3F3F3F',
    SQLPL: '#e38c00',
    Squirrel: '#800000',
    SRecode Template: '#348a34',
    Stan: '#b2011d',
    'Standard ML': '#dc566d',
    Starlark: '#76d275',
    Stata: '#1a5f91',
    Stylus: '#ff6347',
    SuperCollider: '#46390b',
    Svelte: '#ff3e00',
    SVG: '#ff9900',
    Swift: '#ffac45',
    SWIG: '#3d3c6e',
    SystemVerilog: '#DAE1C2',
    Tcl: '#e4cc98',
    Tcsh: '#3d3c6e',
    Terra: '#00004c',
    TeX: '#3D6117',
    Textile: '#ffe7ac',
    TextMate: '#dfb000',
    Thrift: '#D12127',
    TI Program: '#A0AA87',
    TL-Verilog: '#C40023',
    TLA: '#4b0079',
    TOML: '#9c4221',
    TSX: '#3178c6',
    Turing: '#cf142b',
    TSPLIB: '#3d3c6e',
    Twig: '#c1d026',
    TXL: '#0178b8',
    TypeScript: '#3178c6',
    Unified Parallel: '#4e3617',
    Unix Assembly: '#3d3c6e',
    Uno: '#9933cc',
    UnrealScript: '#a54c4d',
    UrWeb: '#ccccee',
    V: '#4d87c7',
    Vala: '#a56de2',
    VBA: '#867db1',
    VBScript: '#15dcdc',
    VCL: '#148AA8',
    Verilog: '#b2b7f8',
    VHDL: '#adb2cb',
    Vim script: '#199f4b',
    'Vim Snippet': '#199f4b',
    'Visual Basic .NET': '#945db7',
    Volt: '#1A283A',
    Vue: '#41b883',
    wdl: '#42f1f4',
    WebAssembly: '#04133b',
    WebIDL: '#3d3c6e',
    wisp: '#7582D1',
    X10: '#4B6BEF',
    xBase: '#403a40',
    XC: '#99DA07',
    Xojo: '#81bd41',
    XProc: '#3d3c6e',
    XQuery: '#5232e7',
    XS: '#3d3c6e',
    XSLT: '#EB8CEB',
    Xtend: '#24255d',
    Yacc: '#4B6C4B',
    YAML: '#cb171e',
    YARA: '#220000',
    YASnippet: '#32AB90',
    ZAP: '#0d6652',
    Zeek: '#3d3c6e',
    ZenScript: '#0096DB',
    Zephir: '#118f9e',
    Zig: '#ec915c',
    ZIL: '#dc75e5',
    Zimpl: '#d67711'
};

function init() {
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 60000);
    
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
    
    elements.sortBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.sortBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.sortBy = btn.dataset.sort;
            renderRepos();
        });
    });
    
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const max = document.body.scrollHeight - window.innerHeight;
        const percent = (scrolled / max) * 100;
        document.querySelector('.scroll-progress').style.width = percent + '%';
    });
    
    loadData();
}

function updateTimeDisplay() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    elements.currentTime.textContent = `${hours}:${minutes}`;
}

async function loadData() {
    if (state.loading) return;
    
    setLoading(true);
    hideError();
    updateLoadingStep('hn');
    updateProgress(5);
    
    try {
        const newPosts = await fetchHNPosts();
        updateProgress(35);
        updateLoadingStep('github');
        
        const githubRepos = extractGitHubRepos(newPosts);
        await fetchGitHubDetails(githubRepos);
        updateProgress(85);
        updateLoadingStep('render');
        
        updateStats();
        renderRepos();
        updateProgress(100);
        
        setTimeout(() => {
            setLoading(false);
        }, 500);
    } catch (error) {
        showError('Failed to load data. Please try again.');
        console.error('Error:', error);
        setLoading(false);
    }
}

function updateLoadingStep(step) {
    state.loadingStep = step;
    document.querySelectorAll('.loading-step').forEach(el => {
        el.classList.remove('active', 'completed');
    });
    
    const steps = ['hn', 'github', 'render'];
    const currentIndex = steps.indexOf(step);
    
    steps.forEach((s, i) => {
        const el = document.querySelector(`.loading-step[data-step="${s}"]`);
        if (i < currentIndex) {
            el.classList.add('completed');
        } else if (i === currentIndex) {
            el.classList.add('active');
        }
    });
}

function updateProgress(percent) {
    state.progress = percent;
    elements.progressFill.style.width = percent + '%';
    elements.progressText.textContent = percent + '%';
}

async function fetchHNPosts() {
    const topStories = await fetchJSON(`${HN_API}/topstories.json`);
    const newStories = await fetchJSON(`${HN_API}/newstories.json`);
    
    const allStoryIds = [...topStories.slice(0, 200), ...newStories.slice(0, 100)];
    const posts = [];
    
    const batchSize = 40;
    for (let i = 0; i < allStoryIds.length; i += batchSize) {
        const batch = allStoryIds.slice(i, i + batchSize);
        const batchPosts = await Promise.all(
            batch.map(async id => {
                try {
                    return await fetchJSON(`${HN_API}/item/${id}.json`);
                } catch {
                    return null;
                }
            })
        );
        
        for (const post of batchPosts) {
            if (post && post.url && post.score > 0) {
                posts.push(post);
            }
        }
        
        const progress = 35 + Math.min((i / allStoryIds.length) * 50, 50);
        updateProgress(Math.floor(progress));
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
    const batchSize = 8;
    let fetched = 0;
    
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
                } else if (response.status === 403) {
                    const resetTime = response.headers.get('X-RateLimit-Reset');
                    if (resetTime) {
                        const waitTime = (parseInt(resetTime) - Date.now() / 1000) * 1000;
                        console.warn(`Rate limited. Waiting ${Math.ceil(waitTime / 1000)}s`);
                        await sleep(Math.min(waitTime, 10000));
                    }
                }
            } catch (error) {
                console.warn(`Failed to fetch details for ${repoData.fullName}:`, error);
            }
            
            fetched++;
            const progress = 35 + 50 + Math.floor((fetched / repos.length) * 15);
            updateProgress(Math.min(progress, 95));
            
            await sleep(200);
        });
        
        await Promise.all(promises);
    }
}

function updateStats() {
    const validRepos = Array.from(state.repos.values()).filter(r => !r.notFound);
    
    const totalUpvotes = validRepos.reduce((sum, r) => sum + r.totalUpvotes, 0);
    
    animateValue(elements.totalRepos, 0, validRepos.length, 1000);
    animateValue(elements.totalUpvotes, 0, totalUpvotes, 1000);
    animateValue(elements.totalPosts, 0, validRepos.reduce((sum, r) => sum + r.posts.length, 0), 1000);
}

function animateValue(element, start, end, duration) {
    const range = end - start;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + range * easeOutQuart);
        
        element.textContent = formatNumber(current);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
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
                <div class="empty-state-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                    </svg>
                </div>
                <h3>No repositories found</h3>
                <p>Try adjusting your time filter or check back later for trending GitHub repositories.</p>
            </div>
        `;
        return;
    }
    
    const now = Date.now() / 1000;
    const oneDayAgo = now - (24 * 60 * 60);
    
    elements.repoGrid.innerHTML = validRepos.map((repo, index) => {
        const details = repo.details;
        const isToday = repo.posts.some(p => p.time >= oneDayAgo);
        const postTypes = getPostTypes(repo.posts);
        const latestPost = repo.posts.reduce((latest, p) => p.time > latest.time ? p : latest, repo.posts[0]);
        
        return `
            <div class="repo-card ${isToday ? 'trending' : ''}" data-repo="${repo.fullName}" style="animation-delay: ${index * 50}ms">
                ${isToday ? '<span class="day-badge">🔥 Hot</span>' : ''}
                <div class="repo-header">
                    <div class="repo-icon">
                        ${details?.owner?.avatar_url 
                            ? `<img src="${details.owner.avatar_url}" alt="${details.owner.login}" loading="lazy">`
                            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`
                        }
                    </div>
                    <div class="repo-info">
                        <div class="repo-name">
                            <span class="repo-name-text">${details?.full_name || repo.fullName}</span>
                            ${postTypes.map(type => `<span class="badge badge-${type}">${type}</span>`).join('')}
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
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <strong>${formatNumber(details.stargazers_count)}</strong>
                        </span>
                    ` : ''}
                    ${details?.forks_count !== undefined ? `
                        <span class="meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                                <path d="M2 17l10 5 10-5"/>
                                <path d="M2 12l10 5 10-5"/>
                            </svg>
                            <strong>${formatNumber(details.forks_count)}</strong>
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
                    <a href="https://news.ycombinator.com/item?id=${latestPost.id}" target="_blank" rel="noopener" class="hn-link">
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
                    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`
                }
            </div>
            <div class="modal-repo-info">
                <h2 class="modal-repo-name">
                    <a href="${details?.html_url || `https://github.com/${repo.fullName}`}" target="_blank" rel="noopener">
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
                            <a href="https://news.ycombinator.com/item?id=${post.id}" target="_blank" rel="noopener">
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
