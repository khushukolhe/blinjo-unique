const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
};

function handleRequest(req, res) {
  let reqUrl = (req.url || '/').split('?')[0];
  if (reqUrl === '/admin' || reqUrl === '/admin/') {
    reqUrl = '/admin.html';
  }

  let relativePath = reqUrl === '/' ? 'index.html' : reqUrl;
  let filePath = path.join(__dirname, relativePath);
  filePath = decodeURIComponent(filePath);

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'text/html';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      // Check if file exists in public/ or fallback to index.html
      const publicFilePath = path.join(__dirname, 'public', relativePath);
      fs.readFile(publicFilePath, (errPublic, contentPublic) => {
        if (!errPublic) {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(contentPublic);
        } else {
          fs.readFile(path.join(__dirname, 'index.html'), (errFallback, fallbackContent) => {
            if (!errFallback) {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(fallbackContent);
            } else {
              res.writeHead(404, { 'Content-Type': 'text/html' });
              res.end('<h1>404 Not Found</h1>');
            }
          });
        }
      });
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

// Export Vercel Serverless Function Handler
module.exports = handleRequest;

// Standalone Local Node Server execution
if (require.main === module) {
  const http = require('http');
  const PORT = process.env.PORT || 3000;
  const server = http.createServer(handleRequest);
  server.listen(PORT, () => {
    console.log(`🚀 Blinjo server running on http://localhost:${PORT}`);
  });
}
