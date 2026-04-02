export const NOTEBOOK_QUEUE_SUBROLE_CODES = ["SUPPORT_SALES", "TALESALES"];

export const getSubRoleCodes = (user) =>
  (user?.sub_roles || []).map((subRole) => subRole?.msr_code).filter(Boolean);

export const hasAnySubRole = (user, codes = []) => {
  const subRoleCodes = getSubRoleCodes(user);
  return codes.some((code) => subRoleCodes.includes(code));
};

export const isNotebookQueueUser = (user) => hasAnySubRole(user, NOTEBOOK_QUEUE_SUBROLE_CODES);

export const canReserveNotebookQueue = (user) =>
  Boolean(user) &&
  (isNotebookQueueUser(user) ||
    user?.role === "sale" ||
    user?.role === "admin" ||
    user?.role === "manager");

export const shouldNotebookCreateIntoQueue = (user) => isNotebookQueueUser(user);

export const shouldNotebookCreateIntoMine = (user) =>
  !isNotebookQueueUser(user) && user?.role === "sale";

export const shouldCreateNotebookLead = (user) =>
  shouldNotebookCreateIntoQueue(user) || shouldNotebookCreateIntoMine(user);

export const canCreateCustomerCare = (user) => Boolean(user) && user?.role === "sale";

export const canExportNotebookSelfReport = (user) =>
  isNotebookQueueUser(user) || canCreateCustomerCare(user);

export const canOpenNotebookQuickLeadForm = (user) =>
  shouldCreateNotebookLead(user) || user?.role === "admin";

export const getDefaultNotebookScope = (user) => {
  if (isNotebookQueueUser(user)) {
    return "queue";
  }

  if (user?.role === "sale") {
    return "mine";
  }

  return "all";
};
