const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const dist = path.join(__dirname, 'dist');

app.use((req, res, next) => {
    // 1. Clean URLs behavior
    if (req.path.endsWith('/') && req.path.length > 1) {
        const query = req.url.slice(req.path.length);
        return res.redirect(301, req.path.slice(0, -1) + query);
    }
    next();
});

// 2. Try serving static file first
app.use(express.static(dist, { redirect: false }));

// 3. Vercel SPA rewrites mimic
// If the path wasn't handled by static, we match our rules
const subApps = ['app', 'partner', 'driver', 'admin'];

app.use((req, res, next) => {
    const p = req.path;
    
    for (const sub of subApps) {
        if (p === `/${sub}` || p.startsWith(`/${sub}/`)) {
            return res.sendFile(path.join(dist, sub, 'index.html'));
        }
    }
    
    // Default fallback
    const rootIndex = path.join(dist, 'index.html');
    if (fs.existsSync(rootIndex)) {
        res.sendFile(rootIndex);
    } else {
        res.status(404).send('404 Not Found - Run build-all.js first');
    }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Local test server running on http://localhost:${PORT}`);
  console.log(`Open this link in your browser to test the unified Vercel-like routing.\n`);
});
