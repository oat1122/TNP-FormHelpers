// Utility to format a user display string from various shapes
// Accepts either a User object or a Quotation-like object that may contain creator fields
export function formatUserDisplay(source) {
  const d = source || {};
  // Try nested creator object first
  const u = d.creator || d.created_by_user || d.created_user || d;
  const username = d.created_by_username || u.username || u.user_name || '';
  const firstname = d.created_by_firstname || d.created_by_user_firstname || u.user_firstname || '';
  const lastname = d.created_by_lastname || d.created_by_user_lastname || u.user_lastname || '';
  const fullName = [firstname, lastname].filter(Boolean).join(' ').trim();
  if (username && fullName) return `${username} (${fullName})`;
  if (fullName) return fullName;
  if (username) return username;
  return d.created_by_name || '-';
}
