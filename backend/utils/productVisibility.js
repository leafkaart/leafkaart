const ADMIN_CREATOR = /^admin$/i;
const STAFF_PRODUCT = { createdByRole: ADMIN_CREATOR };

const customerCatalog = { isActive: { $ne: false }, isApproved: true };
const dealerCatalog = (userId) => ({
  isActive: { $ne: false },
  dealerVisible: { $ne: false },
  $or: [{ dealerId: userId }, { ...STAFF_PRODUCT, isApproved: true }],
});

function catalogFor(user) {
  if (user?.role === "dealer") return dealerCatalog(user._id);
  if (["admin", "employee"].includes(user?.role)) return {};
  return customerCatalog;
}

function approvedCatalogFor(user) {
  return { $and: [customerCatalog, catalogFor(user)] };
}

module.exports = { STAFF_PRODUCT, customerCatalog, dealerCatalog, catalogFor, approvedCatalogFor };
