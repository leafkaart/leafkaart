const normalizeActor = (actor) => {
  if (!actor) {
    return {
      performedById: null,
      performedByName: "System",
      performedByRole: "System",
    };
  }

  return {
    performedById: actor._id || actor.id || null,
    performedByName: actor.name || "System",
    performedByRole:
      actor.role ? String(actor.role).charAt(0).toUpperCase() + String(actor.role).slice(1) : "System",
  };
};

const formatActionLabel = (label) =>
  label
    ? String(label)
        .trim()
        .replace(/\s+/g, " ")
    : "";

const appendOrderActivity = (order, { action, actionPerformed, remarks = "", actor, status } = {}) => {
  const snapshot = normalizeActor(actor);
  const timestamp = new Date();
  const resolvedAction = formatActionLabel(action || actionPerformed);
  const entry = {
    status: status || order.status,
    action: resolvedAction,
    performedById: snapshot.performedById,
    performedByName: snapshot.performedByName,
    performedByRole: snapshot.performedByRole,
    remarks: remarks || "",
    createdAt: timestamp,
    // Legacy aliases kept for backwards compatibility.
    actionPerformed: resolvedAction,
    employeeId: snapshot.performedById,
    employeeName: snapshot.performedByName,
    employeeRole: snapshot.performedByRole,
    updatedBy: snapshot.performedById,
    notes: remarks || "",
    changedBy: snapshot.performedById,
    timestamp,
    at: timestamp,
  };

  if (!Array.isArray(order.timeline)) {
    order.timeline = [];
  }

  order.timeline.push(entry);
  order.latestAction = {
    action: entry.action,
    performedById: entry.performedById,
    performedByName: entry.performedByName,
    performedByRole: entry.performedByRole,
    remarks: entry.remarks,
    createdAt: timestamp,
    // Legacy aliases kept for backwards compatibility.
    actionPerformed: entry.actionPerformed,
    employeeId: entry.employeeId,
    employeeName: entry.employeeName,
    employeeRole: entry.employeeRole,
    updatedBy: entry.updatedBy,
    timestamp,
  };

  return entry;
};

module.exports = {
  appendOrderActivity,
  normalizeActor,
};
