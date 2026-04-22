export const NOTEBOOK_QUEUE_SUBROLE_CODES = ["SUPPORT_SALES", "TALESALES"];
export const NOTEBOOK_QUEUE_VIEW_SUBROLE_CODES = [...NOTEBOOK_QUEUE_SUBROLE_CODES, "HEAD_OFFLINE"];
export const NOTEBOOK_QUEUE_ASSIGN_SUBROLE_CODES = ["SUPPORT_SALES", "HEAD_OFFLINE"];
export const NOTEBOOK_ALL_SCOPE_SUBROLE_CODES = ["SUPPORT_SALES", "HEAD_OFFLINE"];
export const NOTEBOOK_ASSIGN_TARGET_SUBROLE_CODES = ["SALES_OFFLINE"];
export const NOTEBOOK_ASSIGN_TARGET_SUPPORT_SUBROLE_CODES = ["SALES_OFFLINE", "HEAD_OFFLINE"];

export const getSubRoleCodes = (user) =>
  (user?.sub_roles || []).map((subRole) => subRole?.msr_code).filter(Boolean);

export const hasAnySubRole = (user, codes = []) => {
  const subRoleCodes = getSubRoleCodes(user);
  return codes.some((code) => subRoleCodes.includes(code));
};

export const isSupportSalesUser = (user) => hasAnySubRole(user, ["SUPPORT_SALES"]);

export const isSalesOnlineUser = (user) => hasAnySubRole(user, ["SALES_ONLINE"]);

export const shouldHideNotebookStatusSection = (user) =>
  hasAnySubRole(user, ["SALES_ONLINE", "SUPPORT_SALES"]);

export const isNotebookQueueUser = (user) => hasAnySubRole(user, NOTEBOOK_QUEUE_SUBROLE_CODES);

export const canViewNotebookQueue = (user) =>
  Boolean(user) &&
  (user?.role === "admin" ||
    user?.role === "manager" ||
    user?.role === "sale" ||
    hasAnySubRole(user, NOTEBOOK_QUEUE_VIEW_SUBROLE_CODES));

export const canViewAllNotebookScope = (user) =>
  Boolean(user) &&
  (user?.role === "admin" ||
    user?.role === "manager" ||
    hasAnySubRole(user, NOTEBOOK_ALL_SCOPE_SUBROLE_CODES));

export const canReserveNotebookQueue = (user) =>
  Boolean(user) &&
  (user?.role === "admin" || hasAnySubRole(user, NOTEBOOK_QUEUE_ASSIGN_SUBROLE_CODES));

export const canAssignNotebookQueue = (user) =>
  Boolean(user) &&
  (user?.role === "admin" || hasAnySubRole(user, NOTEBOOK_QUEUE_ASSIGN_SUBROLE_CODES));

export const getNotebookAssignTargetSubRoleCodes = (user) =>
  hasAnySubRole(user, ["SUPPORT_SALES"])
    ? NOTEBOOK_ASSIGN_TARGET_SUPPORT_SUBROLE_CODES
    : NOTEBOOK_ASSIGN_TARGET_SUBROLE_CODES;

export const shouldNotebookCreateIntoQueue = (user, targetScope = null) => {
  if (targetScope === "queue") {
    return isNotebookQueueUser(user);
  }

  if (targetScope === "mine") {
    return false;
  }

  return isNotebookQueueUser(user);
};

export const shouldNotebookCreateIntoMine = (user, targetScope = null) => {
  if (targetScope === "mine") {
    return Boolean(user) && (user?.role === "sale" || isSupportSalesUser(user));
  }

  if (targetScope === "queue") {
    return false;
  }

  return !isNotebookQueueUser(user) && user?.role === "sale";
};

export const shouldCreateNotebookLead = (user, targetScope = null) =>
  shouldNotebookCreateIntoQueue(user, targetScope) ||
  shouldNotebookCreateIntoMine(user, targetScope);

export const canCreateNotebookIntoMine = (user) => shouldNotebookCreateIntoMine(user, "mine");

export const canCreateCustomerCare = (user) => Boolean(user) && user?.role === "sale";

export const canExportNotebookSelfReport = (user) =>
  isNotebookQueueUser(user) || canCreateCustomerCare(user);

export const canOpenNotebookQuickLeadForm = (user) =>
  shouldCreateNotebookLead(user) || user?.role === "admin";

export const getNotebookQueueActionMode = (user) => {
  if (canAssignNotebookQueue(user)) {
    return "assign";
  }

  if (canReserveNotebookQueue(user)) {
    return "reserve";
  }

  return null;
};

export const getDefaultNotebookScope = (user) => {
  if (canAssignNotebookQueue(user) || isNotebookQueueUser(user)) {
    return "queue";
  }

  if (user?.role === "sale") {
    return "mine";
  }

  return "all";
};
