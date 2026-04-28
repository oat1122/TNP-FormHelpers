// Resolve a signature image's display URL from its API record + an API base URL.
// Signature images may come back as absolute URLs, protocol-relative, root-relative,
// or as a `path` like "public/quotations/sig.png" — normalise all to absolute.
export function resolveSignatureImageUrl(img, apiBaseUrl) {
  const origin = (() => {
    try {
      if (!apiBaseUrl) return "";
      return new URL(apiBaseUrl).origin;
    } catch {
      return apiBaseUrl.replace(/\/api\b.*$/, "");
    }
  })();

  let candidate = img?.url || "";
  if (!candidate && img?.path) {
    candidate = "storage/" + img.path.replace(/^public\//, "");
  }

  if (!candidate) return "";
  if (/^https?:/i.test(candidate)) return candidate;
  if (candidate.startsWith("//")) return window.location.protocol + candidate;
  if (candidate.startsWith("/")) return origin + candidate;
  if (candidate.startsWith("storage/")) return origin + "/" + candidate;
  return candidate;
}
