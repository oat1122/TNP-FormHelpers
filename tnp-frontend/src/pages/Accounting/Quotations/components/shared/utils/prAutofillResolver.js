// Resolve a PR group's display fields from the group itself, falling back to
// PR autofill data. Pure function — no hooks, no side-effects.
export function resolvePRGroupFields(group, prAutofillData) {
  const pr = prAutofillData || {};
  return {
    name: group?.name && group.name !== "-" ? group.name : pr.pr_work_name || pr.work_name || "-",
    pattern: group?.pattern || pr.pr_pattern || "",
    fabric: group?.fabricType || pr.pr_fabric_type || "",
    color: group?.color || pr.pr_color || "",
    size: group?.size || pr.pr_sizes || "",
  };
}
