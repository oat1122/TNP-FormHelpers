export const onlyNums = (value) => {
  return value.replace(/[^0-9]/g, "");
};

export const onlyFloat = (value) => {
  const numericString = value.replace(/[^0-9.]|([^.]*\.)\./g, (match, beforeDot) => {
    // Allow only one decimal point if one doesn't exist before the current match
    return beforeDot ? "" : match;
  });
  return numericString;
};
