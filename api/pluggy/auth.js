const PLUGGY_BASE_URL = 'https://api.pluggy.ai';

const normalizeSecret = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const safeReadBody = async (req) => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
};

const safeReadJson = async (response) => {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = await safeReadBody(req);
    const clientId = normalizeSecret(
      body.clientId || process.env.PLUGGY_CLIENT_ID || process.env.VITE_PLUGGY_CLIENT_ID
    );
    const clientSecret = normalizeSecret(
      body.clientSecret || process.env.PLUGGY_CLIENT_SECRET || process.env.VITE_PLUGGY_CLIENT_SECRET
    );

    if (!clientId || !clientSecret) {
      return res.status(400).json({
        error: 'Missing Pluggy credentials. Configure PLUGGY_CLIENT_ID and PLUGGY_CLIENT_SECRET.',
      });
    }

    const pluggyResponse = await fetch(`${PLUGGY_BASE_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    });

    const data = await safeReadJson(pluggyResponse);
    return res.status(pluggyResponse.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Pluggy auth proxy failed', details: String(error) });
  }
}
