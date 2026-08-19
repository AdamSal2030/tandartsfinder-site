// Local preview: node dev.js → http://localhost:3457 (static files + /api/lead, like Vercel)
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname;
const lead = require(ROOT + '/api/lead.js');

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg' };
http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/api/lead') {
    let body = ''; req.on('data', c => body += c); req.on('end', () => {
      res.status = c => { res.statusCode = c; return res; };
      res.json = o => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
      try { req.body = JSON.parse(body || '{}'); } catch (e) { return res.status(400).json({ error: 'invalid' }); }
      lead(req, res);
    }); return;
  }
  let p = path.join(ROOT, url);
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  else if (!path.extname(p) && fs.existsSync(p + '.html')) p += '.html';
  if (!fs.existsSync(p)) { res.statusCode = 404; return res.end('404 ' + url); }
  res.setHeader('Content-Type', types[path.extname(p)] || 'application/octet-stream');
  fs.createReadStream(p).pipe(res);
}).listen(3457, () => console.log('http://localhost:3457'));
