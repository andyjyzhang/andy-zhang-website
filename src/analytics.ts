// Keep the existing Vercel analytics integration without fetching a nonexistent
// insights endpoint from local previews or a non-Vercel static host.
export function initializeAnalytics() {
  if (['localhost', '127.0.0.1', '::1'].includes(location.hostname)) return;
  const script = document.createElement('script'); script.src = '/_vercel/insights/script.js'; script.defer = true;
  document.head.append(script);
}
