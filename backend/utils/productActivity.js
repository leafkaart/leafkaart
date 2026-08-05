const toTitleCase = (value = "") =>
  String(value)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeActor = (actor) => {
  if (!actor) {
    return {
      performedById: null,
      performedByName: "System",
      performedByRole: "System",
    };
  }

  const rawRole = actor.role ? String(actor.role) : "System";
  return {
    performedById: actor._id || actor.id || null,
    performedByName: actor.name || "System",
    performedByRole: toTitleCase(rawRole),
  };
};

const buildActivityEntry = ({
  action,
  actor,
  previousValue = null,
  newValue = null,
  remarks = "",
}) => {
  const snapshot = normalizeActor(actor);
  const createdAt = new Date();

  return {
    performedById: snapshot.performedById,
    performedByName: snapshot.performedByName,
    performedByRole: snapshot.performedByRole,
    action: String(action || "").trim(),
    previousValue,
    newValue,
    remarks: String(remarks || "").trim(),
    createdAt,
  };
};

const appendProductActivity = (product, activity) => {
  const entry = buildActivityEntry(activity);

  if (!Array.isArray(product.activityLog)) {
    product.activityLog = [];
  }

  product.activityLog.push(entry);
  product.lastModifiedById = entry.performedById;
  product.lastModifiedByName = entry.performedByName;
  product.lastModifiedByRole = entry.performedByRole;
  product.lastModifiedAt = entry.createdAt;
  product.lastAction = entry.action;

  if (!product.createdByName && entry.action === "Product Created") {
    product.createdById = entry.performedById;
    product.createdByName = entry.performedByName;
    product.createdByRole = entry.performedByRole;
  }

  return entry;
};

const isAdminOrEmployee = (user) =>
  Boolean(user && ["admin", "employee"].includes(String(user.role || "").toLowerCase()));

const formatNumberish = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const formatAuditValue = (value, action = "") => {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    const normalizedAction = String(action).toLowerCase();
    if (
      normalizedAction.includes("price") ||
      normalizedAction.includes("commission") ||
      normalizedAction.includes("margin") ||
      normalizedAction.includes("payment")
    ) {
      return `₹${value.toLocaleString("en-IN")}`;
    }

    return value.toLocaleString("en-IN");
  }

  if (typeof value === "object") {
    if ("url" in value) {
      return "1 image";
    }

    return JSON.stringify(value);
  }

  return String(value);
};

module.exports = {
  appendProductActivity,
  buildActivityEntry,
  formatAuditValue,
  formatNumberish,
  isAdminOrEmployee,
  normalizeActor,
};
