import http from 'http';

function count(urlObj, label) {
  return new Promise((resolve) => {
    const req = http.get(urlObj, (r) => {
      let b = '';
      r.on('data', (d) => (b += d));
      r.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(b); } catch (e) { console.log(label, 'HTTP', r.statusCode, 'no parse', e.message); }
        if (Array.isArray(parsed)) {
          console.log(label, 'HTTP', r.statusCode, 'count=', parsed.length,
            'first=', parsed[0]?.name, 'last=', parsed[parsed.length - 1]?.name);
        } else if (parsed && typeof parsed === 'object') {
          console.log(label, 'HTTP', r.statusCode, 'keys=', Object.keys(parsed));
        } else {
          console.log(label, 'HTTP', r.statusCode, 'len', b.length, b.slice(0, 120));
        }
        resolve();
      });
    });
    req.on('error', (e) => { console.log(label, 'no server / error:', e.message); resolve(); });
    req.on('timeout', () => { console.log(label, 'timeout'); req.destroy(); resolve(); });
    req.setTimeout(5000);
  });
}

(async () => {
  await count({ host: 'localhost', port: 3001, path: '/players', method: 'GET' }, 'LOCAL:3001/players');
  await count({ host: 'localhost', port: 3000, path: '/players', method: 'GET' }, 'LOCAL:3000/players');
  await count({ host: 'localhost', port: 8080, path: '/players', method: 'GET' }, 'LOCAL:8080/players');
})();
