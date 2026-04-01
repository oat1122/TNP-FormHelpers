export const NOTEBOOK_STATUS_OPTIONS = [
  {
    value: "\u0e1e\u0e34\u0e08\u0e32\u0e23\u0e13\u0e32",
    label: "\u0e1e\u0e34\u0e08\u0e32\u0e23\u0e13\u0e32",
    color: "warning",
  },
  {
    value: "\u0e44\u0e14\u0e49\u0e07\u0e32\u0e19",
    label: "\u0e44\u0e14\u0e49\u0e07\u0e32\u0e19",
    color: "success",
  },
  {
    value: "\u0e2b\u0e25\u0e38\u0e14",
    label: "\u0e2b\u0e25\u0e38\u0e14",
    color: "error",
  },
  {
    value: "\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49\u0e07\u0e32\u0e19",
    label: "\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49\u0e07\u0e32\u0e19",
    color: "default",
  },
  {
    value: "\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e41\u0e1c\u0e19\u0e17\u0e33",
    label: "\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e41\u0e1c\u0e19\u0e17\u0e33",
    color: "info",
  },
];

export const NOTEBOOK_ACTION_OPTIONS = [
  {
    value: "\u0e42\u0e17\u0e23",
    label: "\u0e42\u0e17\u0e23",
    quickLabel: "Call",
    shortLabel: "Call",
    kind: "primary",
  },
  {
    value: "\u0e2a\u0e48\u0e07\u0e40\u0e21\u0e25\u0e4c/Company Profile",
    label: "\u0e2a\u0e48\u0e07\u0e40\u0e21\u0e25\u0e4c/Company Profile",
    quickLabel: "Email",
    shortLabel: "Email",
    kind: "primary",
  },
  {
    value: "\u0e44\u0e14\u0e49\u0e40\u0e02\u0e49\u0e32\u0e1e\u0e1a",
    label: "\u0e44\u0e14\u0e49\u0e40\u0e02\u0e49\u0e32\u0e1e\u0e1a",
    quickLabel: "Meeting",
    shortLabel: "Meeting",
    kind: "primary",
  },
  {
    value: "\u0e25\u0e39\u0e01\u0e04\u0e49\u0e32\u0e21\u0e32\u0e1e\u0e1a",
    label: "\u0e25\u0e39\u0e01\u0e04\u0e49\u0e32\u0e21\u0e32\u0e1e\u0e1a",
    quickLabel: "Customer visit",
    shortLabel: "Visit",
    kind: "secondary",
  },
  {
    value: "\u0e2a\u0e48\u0e07\u0e07\u0e32\u0e19\u0e21\u0e32",
    label: "\u0e2a\u0e48\u0e07\u0e07\u0e32\u0e19\u0e21\u0e32",
    quickLabel: "Work received",
    shortLabel: "Work",
    kind: "secondary",
  },
];

export const NOTEBOOK_PRIMARY_ACTIONS = NOTEBOOK_ACTION_OPTIONS.filter(
  (option) => option.kind === "primary"
);

export const NOTEBOOK_HISTORY_FIELD_LABELS = {
  nb_status: "Status",
  nb_action: "Next action",
  nb_additional_info: "Interaction notes",
  nb_remarks: "Internal notes",
  nb_customer_name: "Customer / lead",
  nb_contact_person: "Contact person",
  nb_contact_number: "Phone",
  nb_email: "Email",
  nb_manage_by: "Sales owner",
  nb_is_online: "Source",
};

export const getNotebookStatusOption = (value) =>
  NOTEBOOK_STATUS_OPTIONS.find((option) => option.value === value) || null;

export const getNotebookActionOption = (value) =>
  NOTEBOOK_ACTION_OPTIONS.find((option) => option.value === value) || null;

export const getNotebookActionLabel = (value) =>
  getNotebookActionOption(value)?.label || value || "Next action not set";

export const getNotebookStatusLabel = (value) =>
  getNotebookStatusOption(value)?.label || value || "Status not set";

export const getNotebookSourceMeta = (isOnline) =>
  isOnline ? { label: "Online", color: "success" } : { label: "On-site", color: "warning" };

export const formatNotebookHistoryValue = (fieldName, value) => {
  if (fieldName === "nb_is_online") {
    return value ? "Online" : "On-site";
  }

  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
};
