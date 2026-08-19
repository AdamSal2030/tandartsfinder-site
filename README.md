# tandartsfinder.nl — homepage

Static homepage (NL + EN): hero (2 CTAs) → featured practice card → patient form "Ik zoek een tandarts" → clinic form "Meld uw praktijk aan" → how it works → FAQ. Both forms POST JSON to `/api/lead` (type patient|clinic).

```
index.html, en/index.html   pages
data/practices.js           the practice list — add an object per practice, that's it
assets/style.css            shared design system (copy of the practice page's)
assets/home.css, home.js    homepage-only styles + card rendering + lead forms (validation, POST /api/lead)
privacy.html                → /privacy
```

Deploy: separate Vercel project (preset Other), domain `tandartsfinder.nl` + `www`. Local: `node dev.js` → http://localhost:3457
