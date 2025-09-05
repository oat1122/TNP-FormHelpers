// Invoice formatting utilities
export const formatTHB = (value) => {
  const n = Number(value || 0);
  try {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(n);
  } catch (_) {
    return `฿${n.toLocaleString('th-TH', { maximumFractionDigits: 2 })}`;
  }
};

export const formatDate = (d) => {
  if (!d) return '-';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('th-TH');
  } catch { 
    return '-'; 
  }
};

export const formatDateTH = formatDate;

export const joinAttrs = (arr) => (arr || []).filter(Boolean).join(' / ');
