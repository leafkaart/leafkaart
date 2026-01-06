import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  useGetOrderQuery,
  useGetDealersByPincodeQuery,
  useAssignDealerToOrderMutation,
  useUnassignOrderToDealerMutation,
} from "../../store/api/ordersApi";
import {
  ChevronLeft,
  Package,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Truck,
  Search,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function OrderDetail() {
  const { orderId } = useParams();
  console.log("Order ID:", orderId);
  const { data: order, isLoading, error, refetch } = useGetOrderQuery(orderId);
  const [unassignDealer, { isLoading: isUnassigning }] =
    useUnassignOrderToDealerMutation();

  const [showDealerPanel, setShowDealerPanel] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [assignNotes, setAssignNotes] = useState("");
  const [searchPincode, setSearchPincode] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "admin";

  // Fetch dealers by pincode
  const {
    data: dealersData,
    isLoading: dealersLoading,
    refetch: refetchDealers,
  } = useGetDealersByPincodeQuery(searchPincode, {
    skip: !searchPincode || searchPincode.length < 6,
  });

  const [assignDealer, { isLoading: isAssigning }] =
    useAssignDealerToOrderMutation();

  const handleSearchDealers = () => {
    if (order?.address?.pincode) {
      setSearchPincode(order.address.pincode);
      setShowDealerPanel(true);
      refetchDealers();
    }
  };

  const handleAssignDealer = async () => {
    if (!selectedDealer) {
      alert("Please select a dealer");
      return;
    }

    try {
      await assignDealer({
        orderId,
        dealerId: selectedDealer._id,
        notes: assignNotes,
      }).unwrap();

      alert("Dealer assigned successfully!");
      setShowDealerPanel(false);
      setSelectedDealer(null);
      setAssignNotes("");
      refetch();
    } catch (error) {
      console.error("Failed to assign dealer:", error);
      alert(
        error?.data?.message || "Failed to assign dealer. Please try again."
      );
    }
  };

  const handleUnassignDealer = async () => {
    if (
      !window.confirm("Are you sure you want to remove the assigned dealer?")
    ) {
      return;
    }

    try {
      await unassignDealer(orderId).unwrap();
      alert("Dealer unassigned successfully!");
      refetch();
    } catch (error) {
      console.error("Failed to unassign dealer:", error);
      alert(
        error?.data?.message || "Failed to unassign dealer. Please try again."
      );
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      order_placed: "bg-blue-100 text-blue-700",
      processing: "bg-yellow-100 text-yellow-700",
      packed: "bg-purple-100 text-purple-700",
      ready_for_dispatch: "bg-indigo-100 text-indigo-700",
      shipped: "bg-cyan-100 text-cyan-700",
      out_for_delivery: "bg-orange-100 text-orange-700",
      delivered: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
      returned: "bg-gray-100 text-gray-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const formatStatus = (status) => {
    return status
      ?.split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Order Not Found
          </h2>
          <p className="text-gray-600">
            The order you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Orders
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Header */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Order #{order.orderNumber}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Placed on{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {formatStatus(order.status)}
                </span>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                    order.isPaid
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  {order.isPaid ? "Paid" : "Payment Pending"}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Items
              </h2>
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Package className="w-8 h-8 text-amber-700 opacity-50" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {item.title}
                      </h3>
                      {item.sku && (
                        <p className="text-sm text-gray-600 font-mono">
                          SKU: {item.sku}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        Quantity: {item.qty}
                      </p>
                      {item.dealer && (
                        <p className="text-sm text-amber-700 font-medium">
                          Dealer: {item.dealer.name || "Assigned"}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ₹{item.price.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Total: ₹{item.total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned Dealer */}
            {isAdmin && !order.dealerAssign && (
              <div className="bg-white rounded-lg border p-6 flex items-center justify-between">
                <p className="text-gray-700">
                  No dealer assigned to this order yet.
                </p>
                <button
                  onClick={handleSearchDealers}
                  className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg font-medium shadow-lg transition"
                >
                  <Search className="w-4 h-4" />
                  Find Dealers
                </button>
              </div>
            )}
            {order.dealerAssign && (
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Assigned Dealer
                  </h2>
                  {isAdmin && (
                    <button
                      onClick={handleUnassignDealer}
                      disabled={isUnassigning}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUnassigning ? "Removing..." : "Remove Dealer"}
                    </button>
                  )}
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-green-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {order.dealerAssign.dealer?.name || "Dealer"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.dealerAssign.dealer?.email}
                        </p>
                        {order.dealerAssign.notes && (
                          <p className="text-xs text-gray-500 mt-1">
                            Note: {order.dealerAssign.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <p>Assigned by: {order.dealerAssign.assignedBy?.name}</p>
                      <p className="text-xs">
                        {new Date(
                          order.dealerAssign.assignedAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Timeline */}
            {order.timeline && order.timeline.length > 0 && (
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Timeline
                </h2>
                <div className="space-y-4">
                  {order.timeline.map((event, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-blue-700" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {formatStatus(event.status)}
                        </p>
                        {event.notes && (
                          <p className="text-sm text-gray-600">{event.notes}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(event.at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Customer & Payment Info */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Customer Information
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">
                      {order.user?.name || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">
                      {order.user?.email || "N/A"}
                    </p>
                  </div>
                </div>
                {order.user?.mobile && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">
                        {order.user.mobile}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Delivery Address
              </h2>
              <div className="text-gray-700">
                {order.address?.fullName && (
                  <p className="font-medium">{order.address.fullName}</p>
                )}
                {order.address?.addressLine1 && (
                  <p>{order.address.addressLine1}</p>
                )}
                {order.address?.addressLine2 && (
                  <p>{order.address.addressLine2}</p>
                )}
                <p>
                  {order.address?.city}, {order.address?.state}
                </p>
                <p className="font-medium">PIN: {order.address?.pincode}</p>
                {order.address?.mobile && (
                  <p className="mt-2 text-sm">
                    <Phone className="w-4 h-4 inline mr-1" />
                    {order.address.mobile}
                  </p>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>₹{order.subTotal?.toLocaleString()}</span>
                </div>
                {order.shippingCharges > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Shipping</span>
                    <span>₹{order.shippingCharges?.toLocaleString()}</span>
                  </div>
                )}
                {order.taxAmount > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Tax</span>
                    <span>₹{order.taxAmount?.toLocaleString()}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{order.discount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg text-gray-900 pt-3 border-t">
                  <span>Grand Total</span>
                  <span>₹{order.grandTotal?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dealer Assignment Panel */}

      {showDealerPanel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Assign Dealer
                </h3>
                <p className="text-sm text-gray-600">
                  Pincode: {order.address?.pincode}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDealerPanel(false);
                  setSelectedDealer(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {dealersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                </div>
              ) : !dealersData?.data || dealersData.data.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No dealers found for this pincode
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dealersData.data.map((dealerObj) => (
                    <div
                      key={dealerObj.dealer._id}
                      className={`border rounded-lg p-4 cursor-pointer transition ${
                        selectedDealer?._id === dealerObj.dealer._id
                          ? "border-amber-700 bg-amber-50"
                          : "border-gray-200 hover:border-amber-300"
                      }`}
                      onClick={() => setSelectedDealer(dealerObj.dealer)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                            <User className="w-6 h-6 text-amber-700" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {dealerObj.dealer.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {dealerObj.dealer.email}
                            </p>
                            {dealerObj.dealer.storeName && (
                              <p className="text-sm text-gray-500">
                                Store: {dealerObj.dealer.storeName}
                              </p>
                            )}
                          </div>
                        </div>
                        {selectedDealer?._id === dealerObj.dealer._id && (
                          <CheckCircle className="w-6 h-6 text-amber-700" />
                        )}
                      </div>

                      {dealerObj.products && dealerObj.products.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Available Products ({dealerObj.products.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {dealerObj.products.slice(0, 3).map((product) => (
                              <span
                                key={product._id}
                                className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
                              >
                                {product.title}
                              </span>
                            ))}
                            {dealerObj.products.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
                                +{dealerObj.products.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedDealer && (
              <div className="border-t p-5 bg-gray-50 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Add any notes for the dealer..."
                    rows="2"
                  />
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDealerPanel(false);
                      setSelectedDealer(null);
                      setAssignNotes("");
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignDealer}
                    disabled={isAssigning}
                    className="px-6 py-2 text-sm font-medium bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAssigning ? "Assigning..." : "Assign Dealer"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
