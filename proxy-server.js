const http = require('http');
const https = require('https');
const url = require('url');
const net = require('net');
const { createClient } = require('@supabase/supabase-js');

const PORT = 8080;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const server = http.createServer(async (req, res) => {
  const { method, headers } = req;
  const targetUrl = req.url.slice(1);

  if (method === 'CONNECT') {
    handleHttpsRequest(req, targetUrl);
    return;
  }

  const options = url.parse(targetUrl);
  options.method = method;
  options.headers = headers;

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  req.pipe(proxyReq);

  proxyReq.on('error', (error) => {
    console.error('Error in proxy request:', error);
    res.writeHead(500);
    res.end('Proxy Error');
  });
});

function handleHttpsRequest(req, targetUrl) {
  const [hostname, port] = targetUrl.split(':');
  const socket = net.connect(port || 443, hostname, () => {
    req.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    socket.pipe(req);
    req.pipe(socket);
  });

  socket.on('error', (error) => {
    console.error('Error in HTTPS connection:', error);
    req.destroy();
  });
}

server.on('connect', (req, clientSocket, head) => {
  const { port, hostname } = new URL(`http://${req.url}`);
  const serverSocket = net.connect(port || 443, hostname, () => {
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    serverSocket.write(head);
    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });
});

server.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});

// Function to check if blocking is active
async function isBlockingActive(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('block_state')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching block state:', error);
    return false;
  }

  return data.block_state === 'active';
}

// Middleware to inject blocking script
async function injectBlockingScript(req, res) {
  const userId = req.headers['x-user-id'];
  if (!userId) return;

  const isBlocking = await isBlockingActive(userId);
  if (!isBlocking) return;

  const originalWrite = res.write;
  const originalEnd = res.end;

  const chunks = [];

  res.write = function (chunk) {
    chunks.push(chunk);
  };

  res.end = function (chunk) {
    if (chunk) chunks.push(chunk);

    const body = Buffer.concat(chunks).toString('utf8');
    const modifiedBody = injectScript(body);

    originalWrite.call(this, modifiedBody);
    originalEnd.call(this);
  };
}

function injectScript(html) {
  const script = `
    <script>
      (function() {
        function hideElement() {
          var element = document.querySelector('div#bottom-area');
          if (element) {
            element.style.display = 'none';
          }
        }
        hideElement();
        new MutationObserver(hideElement).observe(document.body, {childList: true, subtree: true});
      })();
    </script>
  `;

  return html.replace('</body>', script + '</body>');
}

// Apply the middleware to all requests
server.on('request', injectBlockingScript);