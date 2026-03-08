const PLUGGY_BASE_URL = 'https://api.pluggy.ai';
const { safeReadBody, safeReadJson } = require('./_utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(400).json({ error: 'Missing X-API-KEY header' });
  }

  try {
    const body = await safeReadBody(req);
    const pluggyResponse = await fetch(`${PLUGGY_BASE_URL}/connect_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await safeReadJson(pluggyResponse);
    return res.status(pluggyResponse.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Pluggy connect token proxy failed', details: String(error) });
  }
};
