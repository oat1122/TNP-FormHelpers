/**
 * Shared auth cookie — cross-origin handoff to sibling TNP apps.
 *
 * tnp-frontend is the issuer (owns login). Sibling apps that run on the
 * same parent domain (dev: localhost; prod: .tnp.com) read this cookie
 * via their own server-side middleware. tnp-ceo-report's middleware does
 * exactly that — see tnp-ceo-report/src/middleware.ts.
 *
 * localStorage stays the primary store for this app's own RTK Query +
 * Axios interceptor (per shared rule auth-flow.md). This cookie is an
 * additional handoff channel — it never replaces localStorage.
 *
 * Why: localStorage is origin-scoped (host+port), so :5173 storage is
 * invisible to :3001. A cookie scoped Domain=localhost (no port) is
 * sent to every localhost port by the browser.
 *
 * Domain priority:
 *   1. VITE_SHARED_AUTH_COOKIE_DOMAIN  (explicit override — prod uses .tnp.com)
 *   2. "localhost"                     (dev fallback)
 *   3. skip                            (prod with no env → noop, Laravel
 *                                      sets the production cookie itself)
 */

const COOKIE_NAME = "authToken";
const MAX_AGE_SECONDS = 60 * 60 * 24;

function getCookieDomain() {
  const explicit = import.meta.env.VITE_SHARED_AUTH_COOKIE_DOMAIN;
  if (explicit) return explicit;
  if (import.meta.env.DEV) return "localhost";
  return null;
}

export function setSharedAuthCookie(token) {
  const domain = getCookieDomain();
  if (!domain || !token) return;
  document.cookie =
    `${COOKIE_NAME}=${encodeURIComponent(token)}` +
    `; domain=${domain}` +
    `; path=/` +
    `; max-age=${MAX_AGE_SECONDS}` +
    `; samesite=lax`;
}

export function clearSharedAuthCookie() {
  const domain = getCookieDomain();
  if (!domain) return;
  document.cookie =
    `${COOKIE_NAME}=` +
    `; domain=${domain}` +
    `; path=/` +
    `; max-age=0` +
    `; samesite=lax`;
}
