# HN GitHub Trends 🔥

> **Autopilot Mode: Fully Vibe-Coded**

Discover what's trending in the developer community. HN GitHub Trends scans Hacker News in real-time to surface the hottest GitHub repositories that developers are talking about.

![Status](https://img.shields.io/badge/status-live-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Built](https://img.shields.io/badge/built%20with-vibes-ff6b35)

## ✨ Features

- **Real-Time Scanning** - Pulls from Hacker News top & new stories
- **Smart Filtering** - Only shows actual repositories (no issues, PRs, or actions)
- **Aggregated Upvotes** - Combines HN points when the same repo appears multiple times
- **GitHub Integration** - Fetches stars, forks, description, and language data
- **Post Type Detection** - Identifies "Ask HN" and "Show HN" posts
- **Trending Indicator** - Highlights repos that popped off in the last 24 hours
- **Multiple Sort Options** - Sort by hot (upvotes), stars, or recent
- **Responsive Design** - Looks fire on mobile and desktop

## 🎨 Tech Stack

- **Pure HTML5** - No frameworks, no build steps
- **Vanilla JavaScript** - ES6+ with async/await
- **Modern CSS3** - Custom properties, grid, animations
- **Hacker News API** - Firebase REST API
- **GitHub API v3** - Repository metadata

## 🚀 Quick Start

### Option 1: GitHub Pages (Recommended)

1. Clone this repo
2. Push to your GitHub repository
3. Enable GitHub Pages in Settings → Pages
4. Visit `https://yourusername.github.io/hn-repos`

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/hn-repos.git
cd hn-repos

# Open with any local server
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

## 🎯 How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Hacker News   │────▶│   Extract &      │────▶│   GitHub API    │
│   API           │     │   Filter Repos   │     │   Fetch Details │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                        │
                               ▼                        ▼
                        ┌─────────────────────────────────┐
                        │      Render Beautiful UI        │
                        │      • Stats Bar                │
                        │      • Repo Cards               │
                        │      • Modal Details            │
                        └─────────────────────────────────┘
```

## 📊 API Rate Limits

- **Hacker News API**: No auth required, generous limits
- **GitHub API**: 60 requests/hour (unauthenticated)

The app includes soft rate limiting with 200ms delays between GitHub requests to stay within limits.

## 🎨 Customization

### Change Color Scheme

Edit the CSS variables in `styles.css`:

```css
:root {
    --accent-orange: #ff6b35;  /* Primary accent */
    --accent-pink: #ec4899;    /* Secondary accent */
    --accent-purple: #8b5cf6;  /* Tertiary accent */
}
```

### Adjust Time Filters

Modify default in `app.js`:

```javascript
const state = {
    daysFilter: 1,  // 1 = 24 hours, 3 = 3 days, 7 = 7 days
};
```

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

This is a vibe-coded passion project. If you find bugs or want to add features:

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a PR

## 📄 License

MIT License - Do whatever you want with it.

## 🙏 Acknowledgments

- [Hacker News](https://news.ycombinator.com) for the amazing community
- [GitHub](https://github.com) for the API
- The dev community for keeping things interesting

---

**Built with ⚡ and good vibes**

[View Live](https://hotheadhacker.github.io/hn-repos) · [Report Issue](https://github.com/hotheadhacker/hn-repos/issues)
