const ADDRESS_DETAIL_PATTERNS = [/^(.+?)(?:\s+แขวง)/, /^(.+?)(?:\s+ตำบล)/, /^(.+?)(?:\s+ต\.)/];

export const parseAddressDetail = (fullAddress) => {
  if (!fullAddress) return "";
  for (const pattern of ADDRESS_DETAIL_PATTERNS) {
    const match = fullAddress.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return fullAddress;
};
