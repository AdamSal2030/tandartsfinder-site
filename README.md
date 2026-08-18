# tandartsfinder.nl — homepage

Static homepage (NL + EN): hero with city filter → practice cards → how it works → FAQ → for dentists.

```
index.html, en/index.html   pages
data/practices.js           the practice list — add an object per practice, that's it
assets/style.css            shared design system (copy of the practice page's)
assets/home.css, home.js    homepage-only styles + card rendering / city filter
privacy.html                → /privacy
```

Deploy: separate Vercel project (preset Other), domain `tandartsfinder.nl` + `www`. Local: `node dev.js` → http://localhost:3457
