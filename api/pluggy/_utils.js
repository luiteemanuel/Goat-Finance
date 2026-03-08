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

module.exports = {
  normalizeSecret,
  safeReadBody,
  safeReadJson,
};
