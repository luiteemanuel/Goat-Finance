const PLUGGY_BASE_URL = 'https://api.pluggy.ai';

const safeReadJson = async (response) => {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = req.headers['x-api-key'];
  const accountId = req.query.accountId;

  if (!apiKey) {
    return res.status(400).json({ error: 'Missing X-API-KEY header' });
  }
  if (!accountId) {
    return res.status(400).json({ error: 'Missing accountId query param' });
  }

  try {
    const pluggyResponse = await fetch(`${PLUGGY_BASE_URL}/transactions?accountId=${encodeURIComponent(accountId)}`, {
      headers: {
        'X-API-KEY': apiKey,
      },
    });

    const data = await safeReadJson(pluggyResponse);
    return res.status(pluggyResponse.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Pluggy transactions proxy failed', details: String(error) });
  }
};
