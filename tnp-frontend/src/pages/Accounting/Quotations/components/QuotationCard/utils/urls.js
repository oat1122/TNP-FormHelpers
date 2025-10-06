export const getPricingViewUrl = (prId) => {
  const encodedId = encodeURIComponent(prId);
  if (import.meta.env.DEV) {
    return `/pricing/view/${encodedId}`;
  }

  const apiBase = import.meta.env.VITE_END_POINT_URL;
  try {
    if (apiBase) {
      const u = new URL(apiBase);
      const cleanedHost = u.host.replace(/^api\./, "tnp.");
      return `${u.protocol}//${cleanedHost}/pricing/view/${encodedId}`;
    }
  } catch (_) {
    // ignore malformed URL
  }

  return `/pricing/view/${encodedId}`;
};
