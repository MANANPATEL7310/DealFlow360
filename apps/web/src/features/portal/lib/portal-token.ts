const PORTAL_STORAGE_KEY = "dealflow360.portal_token";
let inMemoryToken: string | null = null;

/**
 * Reads token from URL ?token=... on initial mount, saves to sessionStorage,
 * and strips the query parameter from the address bar to prevent leaking in history/screenshots.
 */
export function initPortalToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const url = new URL(window.location.href);
    const tokenFromUrl = url.searchParams.get("token");

    if (tokenFromUrl) {
      inMemoryToken = tokenFromUrl;
      sessionStorage.setItem(PORTAL_STORAGE_KEY, tokenFromUrl);

      // Scrub token from address bar
      url.searchParams.delete("token");
      window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
      return tokenFromUrl;
    }

    if (inMemoryToken) {
      return inMemoryToken;
    }

    const saved = sessionStorage.getItem(PORTAL_STORAGE_KEY);
    inMemoryToken = saved;
    return saved;
  } catch {
    return inMemoryToken;
  }
}

export function getPortalToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  if (typeof window === "undefined") return null;

  try {
    inMemoryToken = sessionStorage.getItem(PORTAL_STORAGE_KEY);
    return inMemoryToken;
  } catch {
    return null;
  }
}

export function setPortalToken(token: string): void {
  inMemoryToken = token;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(PORTAL_STORAGE_KEY, token);
    } catch {
      // Ignore quota errors in private mode
    }
  }
}

export function clearPortalToken(): void {
  inMemoryToken = null;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(PORTAL_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}
