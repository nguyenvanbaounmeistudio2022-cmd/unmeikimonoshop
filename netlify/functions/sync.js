const https = require('https');

exports.handler = async (event) => {
  if(event.httpMethod !== 'POST'){
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const TOKEN = process.env.GITHUB_TOKEN;
  const REPO = 'nguyenvanbaounmeistudio2022-cmd/unmeikimonoshop';
  const FILE = 'data.json';

  try {
    const { content } = JSON.parse(event.body);

    // Get current SHA
    const sha = await new Promise((resolve) => {
      const req = https.request({
        hostname: 'api.github.com',
        path: `/repos/${REPO}/contents/${FILE}`,
        method: 'GET',
        headers: {
          'Authorization': `token ${TOKEN}`,
          'User-Agent': 'unmei-kimono',
          'Accept': 'application/vnd.github.v3+json'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(data).sha || null); }
          catch(e) { resolve(null); }
        });
      });
      req.on('error', () => resolve(null));
      req.end();
    });

    // Put file
    const body = JSON.stringify({
      message: 'Update kimono data',
      content: content,
      ...(sha ? { sha } : {})
    });

    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.github.com',
        path: `/repos/${REPO}/contents/${FILE}`,
        method: 'PUT',
        headers: {
          'Authorization': `token ${TOKEN}`,
          'User-Agent': 'unmei-kimono',
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
          'Content-Length': Buffer.byteLength(body)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    if(result.status === 200 || result.status === 201){
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    } else {
      return { statusCode: 500, body: JSON.stringify({ ok: false, detail: result.data }) };
    }
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};
