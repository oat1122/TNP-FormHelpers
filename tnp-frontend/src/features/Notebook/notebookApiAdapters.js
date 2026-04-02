export const normalizeNotebookListResponse = (response) => {
  const rows = Array.isArray(response?.data) ? response.data : [];

  return {
    rows,
    total: response?.total ?? rows.length,
    meta: {
      currentPage: response?.current_page ?? 1,
      perPage: response?.per_page ?? rows.length,
      lastPage: response?.last_page ?? 1,
    },
  };
};

export const normalizeNotebookExportResponse = (response) =>
  Array.isArray(response) ? response : [];

export const normalizeCustomerCareSourceResponse = (response) => {
  const rows = Array.isArray(response?.data) ? response.data : [];

  return {
    rows,
    total: response?.total ?? rows.length,
    meta: {
      currentPage: response?.current_page ?? 1,
      perPage: response?.per_page ?? rows.length,
      lastPage: response?.last_page ?? 1,
    },
  };
};
