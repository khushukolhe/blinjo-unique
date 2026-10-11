const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.json': 'application/json'
};

function getPossiblePaths(relativePath) {
  let cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  if (cleanPath === '' || cleanPath === 'admin') {
    cleanPath = cleanPath === 'admin' ? 'admin.html' : 'index.html';
  }
  
  return [
    path.join(process.cwd(), cleanPath),
    path.join(__dirname, cleanPath),
    path.join(process.cwd(), 'public', cleanPath),
    path.join(__dirname, 'public', cleanPath),
    path.resolve(cleanPath)
  ];
}

function handleRequest(req, res) {
  let reqUrl = (req.url || '/').split('?')[0];
  if (reqUrl === '/admin' || reqUrl === '/admin/') {
    reqUrl = '/admin.html';
  }

  const ext = path.extname(reqUrl).toLowerCase() || '.html';
  const contentType = mimeTypes[ext] || 'text/html; charset=utf-8';

  const candidates = getPossiblePaths(reqUrl);

  function tryNext(index) {
    if (index >= candidates.length) {
      // Do not return HTML fallback for missing media/icons/scripts/styles
      if (['.ico', '.png', '.svg', '.jpg', '.jpeg', '.webp', '.css', '.js'].includes(ext)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('404 Not Found');
      }

      const indexCandidates = [
        path.join(process.cwd(), 'index.html'),
        path.join(__dirname, 'index.html'),
        path.join(process.cwd(), 'public', 'index.html'),
        path.join(__dirname, 'public', 'index.html')
      ];
      for (const idxPath of indexCandidates) {
        if (fs.existsSync(idxPath)) {
          const content = fs.readFileSync(idxPath);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end(content);
        }
      }
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end('<h1>404 Not Found</h1>');
    }

    const curPath = candidates[index];
    fs.readFile(curPath, (err, content) => {
      if (!err && content) {
        const cacheControl = ext === '.html' ? 'no-cache' : 'public, max-age=86400';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': cacheControl
        });
        return res.end(content);
      } else {
        tryNext(index + 1);
      }
    });
  }

  tryNext(0);
}

module.exports = handleRequest;

if (require.main === module) {
  const http = require('http');
  const PORT = process.env.PORT || 3000;
  const server = http.createServer(handleRequest);
  server.listen(PORT, () => {
    console.log(`🚀 Blinjo server running on http://localhost:${PORT}`);
  });
}
