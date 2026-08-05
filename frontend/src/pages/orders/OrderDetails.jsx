import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  useGetOrderQuery,
  useGetDealersByPincodeQuery,
  useAssignDealerToOrderMutation,
  useUnassignOrderToDealerMutation,
  useUpdateOrderStatusMutation,
  useUpdatePaymentStatusMutation,
  useHandleReturnRequestMutation,
} from "../../store/api/ordersApi";
import {
  ChevronLeft,
  Package,
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Truck,
  Search,
  CheckCircle,
  XCircle,
  Clock3,
  ShieldCheck,
  CircleDot,
} from "lucide-react";
import { ToastContainer } from "../Toast/Toast";
import { useToast } from "../../hooks/useToast";

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return {
    date: date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    full: date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

const statusLabelMap = {
  pending: "Pending",
  confirmed: "Confirmed",
  assigned: "Assigned",
  payment_approved: "Payment Approved",
  order_placed: "Order Created",
  processing: "Processing",
  dispatched: "Dispatched",
  in_transit: "In Transit",
  packed: "Packed",
  ready_for_dispatch: "Ready for Dispatch",
  shipped: "Shipment Updated",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  refunded: "Refunded",
  return_requested: "Return Requested",
  replace_requested: "Replacement Requested",
  cancel_requested: "Cancellation Requested",
  return_approved: "Return Approved",
  return_rejected: "Return Rejected",
  replace_approved: "Replacement Approved",
  replace_rejected: "Replacement Rejected",
  cancel_approved: "Cancellation Approved",
  cancel_rejected: "Cancellation Rejected",
};

const getLabel = (value) =>
  statusLabelMap[value] ||
  String(value || "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const getStatusColor = (status) => {
  const colors = {
    order_placed: "bg-sky-100 text-sky-700",
    processing: "bg-amber-100 text-amber-700",
    packed: "bg-violet-100 text-violet-700",
    ready_for_dispatch: "bg-indigo-100 text-indigo-700",
    shipped: "bg-cyan-100 text-cyan-700",
    out_for_delivery: "bg-orange-100 text-orange-700",
    delivered: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
    returned: "bg-slate-100 text-slate-700",
    return_requested: "bg-orange-100 text-orange-700",
    replace_requested: "bg-orange-100 text-orange-700",
    cancel_requested: "bg-orange-100 text-orange-700",
    return_approved: "bg-emerald-100 text-emerald-700",
    return_rejected: "bg-red-100 text-red-700",
    replace_approved: "bg-blue-100 text-blue-700",
    replace_rejected: "bg-red-100 text-red-700",
    cancel_approved: "bg-slate-100 text-slate-700",
    cancel_rejected: "bg-red-100 text-red-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
};

const getActivityTone = (action = "") => {
  const normalized = action.toLowerCase();
  if (normalized.includes("approve") || normalized.includes("assigned")) {
    return {
      icon: <ShieldCheck className="w-4 h-4" />,
      wrap: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }
  if (normalized.includes("reject") || normalized.includes("cancel")) {
    return {
      icon: <XCircle className="w-4 h-4" />,
      wrap: "bg-red-50 text-red-700 border-red-200",
    };
  }
  if (normalized.includes("shipment") || normalized.includes("status")) {
    return {
      icon: <Truck className="w-4 h-4" />,
      wrap: "bg-blue-50 text-blue-700 border-blue-200",
    };
  }
  return {
    icon: <CircleDot className="w-4 h-4" />,
    wrap: "bg-slate-50 text-slate-700 border-slate-200",
  };
};

const getOrderPricing = (order) => {
  const customerPrice = Number(order?.grandTotal || 0);
  const dealerPrice = Number(order?.dealerShowGrandTotal || 0);
  const margin = Number(customerPrice - dealerPrice);
  const commission = Number(
    order?.items?.reduce((sum, item) => {
      const itemMargin = Number(item?.price || 0) - Number(item?.dealerPrice || 0);
      return sum + Math.max(itemMargin, 0);
    }, 0) || 0
  );

  return {
    customerPrice,
    dealerPrice,
    margin,
    commission,
    shippingCharges: Number(order?.shippingCharges || 0),
    taxAmount: Number(order?.taxAmount || 0),
    discount: Number(order?.discount || 0),
  };
};

export default function OrderDetail() {
  const { orderId } = useParams();
  const { data: order, isLoading, error, refetch } = useGetOrderQuery(orderId);
  const { toasts, addToast, removeToast } = useToast();
  const [showDealerPanel, setShowDealerPanel] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [assignNotes, setAssignNotes] = useState("");
  const [searchPincode, setSearchPincode] = useState("");
  const [showPaymentProof, setShowPaymentProof] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    utrNumber: "",
    description: "",
    remarks: "",
  });
  const [returnAdminMessage, setReturnAdminMessage] = useState("");
  const [emiPreview, setEmiPreview] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user?.role || "customer";
  const isAdmin = user?.role === "admin";
  const isEmployee = user?.role === "employee";
  const isDealer = user?.role === "dealer";

  const [assignDealer, { isLoading: isAssigning }] =
    useAssignDealerToOrderMutation();
  const [unassignDealer, { isLoading: isUnassigning }] =
    useUnassignOrderToDealerMutation();
  const [updateOrderStatus, { isLoading: isUpdatingStatus }] =
    useUpdateOrderStatusMutation();
  const [updatePaymentStatus, { isLoading: isUpdatingPayment }] =
    useUpdatePaymentStatusMutation();
  const [handleReturnRequest, { isLoading: isHandlingReturn }] =
    useHandleReturnRequestMutation();

  const {
    data: dealersData,
    isLoading: dealersLoading,
    refetch: refetchDealers,
  } = useGetDealersByPincodeQuery(searchPincode, {
    skip: !searchPincode || searchPincode.length < 6,
  });

  const activityItems = [...(order?.timeline || [])].sort((a, b) => {
    const aTime = new Date(a?.createdAt || a?.timestamp || a?.at || 0).getTime();
    const bTime = new Date(b?.createdAt || b?.timestamp || b?.at || 0).getTime();
    return aTime - bTime;
  });

  const handleSearchDealers = () => {
    if (!order?.address?.pincode) return;
    setSearchPincode(String(order.address.pincode));
    setShowDealerPanel(true);
    refetchDealers();
  };

  const handleAssignDealer = async () => {
    if (!selectedDealer) {
      addToast("Please select a dealer", "error");
      return;
    }

    try {
      await assignDealer({
        orderId,
        dealerId: selectedDealer._id,
        notes: assignNotes,
      }).unwrap();
      addToast("Dealer assigned successfully!", "success");
      setShowDealerPanel(false);
      setSelectedDealer(null);
      setAssignNotes("");
      refetch();
    } catch (errorInfo) {
      addToast(
        errorInfo?.data?.message || "Failed to assign dealer. Please try again.",
        "error"
      );
    }
  };

  const handleUnassignDealer = async () => {
    if (!window.confirm("Remove the assigned dealer from this order?")) return;

    try {
      await unassignDealer(orderId).unwrap();
      addToast("Dealer unassigned successfully!", "success");
      refetch();
    } catch (errorInfo) {
      addToast(
        errorInfo?.data?.message || "Failed to unassign dealer. Please try again.",
        "error"
      );
    }
  };

  const handleUpdateOrderStatus = async () => {
    if (!newStatus) {
      addToast("Please select a status", "error");
      return;
    }

    try {
      await updateOrderStatus({ orderId, status: newStatus }).unwrap();
      addToast("Order status updated successfully!", "success");
      setShowStatusModal(false);
      setNewStatus("");
      refetch();
    } catch (errorInfo) {
      addToast(
        errorInfo?.data?.message || "Failed to update status. Please try again.",
        "error"
      );
    }
  };

  const openPaymentApproval = () => {
    setPaymentForm({
      utrNumber: "",
      description: "",
      remarks: "",
    });
    setShowPaymentModal(true);
  };

  const handleApprovePayment = async () => {
    if (!paymentForm.utrNumber.trim() || !paymentForm.description.trim()) {
      addToast("UTR number and description are required.", "error");
      return;
    }

    try {
      await updatePaymentStatus({
        orderId,
        action: "approve",
        utrNumber: paymentForm.utrNumber.trim(),
        description: paymentForm.description.trim(),
        remarks: paymentForm.remarks.trim() || paymentForm.description.trim(),
      }).unwrap();
      addToast("Payment approved successfully!", "success");
      setShowPaymentModal(false);
      refetch();
    } catch (errorInfo) {
      addToast(
        errorInfo?.data?.message || "Failed to approve payment.",
        "error"
      );
    }
  };

  const handleRejectPayment = async () => {
    const remarks = window.prompt("Optional remarks for payment rejection:") || "";

    try {
      await updatePaymentStatus({
        orderId,
        action: "reject",
        remarks,
      }).unwrap();
      addToast("Payment rejected successfully!", "success");
      refetch();
    } catch (errorInfo) {
      addToast(
        errorInfo?.data?.message || "Failed to reject payment.",
        "error"
      );
    }
  };

  const handleReturnApproval = async (status) => {
    try {
      await handleReturnRequest({
        orderId,
        status,
        message: returnAdminMessage,
      }).unwrap();
      addToast(`Request ${status} successfully!`, "success");
      setReturnAdminMessage("");
      refetch();
    } catch (errorInfo) {
      addToast(
        errorInfo?.data?.message || "Failed to process request.",
        "error"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-amber-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Order Not Found
          </h2>
          <p className="text-gray-600">
            The order you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  const paymentReview = order.paymentReview || {};
  const latestPaymentTime = paymentReview.reviewedAt || order.latestAction?.createdAt || order.latestAction?.timestamp;
  const orderPricing = getOrderPricing(order);

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="mr-1 h-5 w-5" />
              Back to Orders
            </button>
            <span className={`rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(order.status)}`}>
              {getLabel(order.status)}
            </span>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-amber-700">
                      Order Details
                    </p>
                    <h1 className="mt-2 text-2xl font-bold text-gray-900">
                      Order #{order.orderNumber}
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                      Placed on {formatDateTime(order.createdAt).full}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                      order.isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      <CreditCard className="h-3.5 w-3.5" />
                      {order.isPaid ? "Paid" : "Payment Pending"}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                      paymentReview.status === "approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : paymentReview.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {paymentReview.status === "approved" ? (
                        <CheckCircle className="h-3.5 w-3.5" />
                      ) : paymentReview.status === "rejected" ? (
                        <XCircle className="h-3.5 w-3.5" />
                      ) : (
                        <Clock3 className="h-3.5 w-3.5" />
                      )}
                      {paymentReview.status === "approved"
                        ? "Payment Approved"
                        : paymentReview.status === "rejected"
                        ? "Payment Rejected"
                        : "Payment Pending"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 border-t pt-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700">
                      <CreditCard className="h-3.5 w-3.5" />
                      {order.paymentMethod}
                    </span>
                    {order.returnRequest?.type && order.returnRequest?.status !== "none" && (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                        order.returnRequest.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : order.returnRequest.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                      }`}>
                        {order.returnRequest.status === "approved" ? (
                          <CheckCircle className="h-3.5 w-3.5" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        {getLabel(`${order.returnRequest.type}_${order.returnRequest.status}`)}
                      </span>
                    )}
                  </div>

                  {(isAdmin || isEmployee) && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {(order.paymentMethod === "QR" || order.paymentMethod === "EMI") && order.paymentImage && (
                        <button
                          onClick={() => setShowPaymentProof(true)}
                          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-black"
                        >
                          <Package className="h-4 w-4" />
                          {order.paymentMethod === "EMI" ? "View Payment Document" : "View Payment Screenshot"}
                        </button>
                      )}
                      <button
                        onClick={openPaymentApproval}
                        className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-800"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve Payment
                      </button>
                      <button
                        onClick={handleRejectPayment}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject Payment
                      </button>
                      <button
                        onClick={() => {
                          setNewStatus(order.status);
                          setShowStatusModal(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                      >
                        <Truck className="h-4 w-4" />
                        Update Status
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
                    <p className="text-sm text-gray-500">
                      Screenshot, approval metadata, and current payment state.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="overflow-hidden rounded-2xl border bg-gray-50">
                    {order.paymentImage ? (
                      <button
                        onClick={() => setShowPaymentProof(true)}
                        className="block w-full"
                      >
                        <img
                          src={order.paymentImage}
                          alt="Payment proof"
                          className="h-64 w-full object-cover"
                        />
                      </button>
                    ) : (
                      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
                        No payment screenshot uploaded
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoTile label="Current Payment Status" value={paymentReview.status ? getLabel(paymentReview.status) : "Pending"} />
                    <InfoTile label="Approved By" value={paymentReview.reviewedByName || paymentReview.approvedByName || "N/A"} />
                    <InfoTile label="Approved Time" value={latestPaymentTime ? formatDateTime(latestPaymentTime).full : "N/A"} />
                    <InfoTile label="UTR Number" value={paymentReview.utrNumber || "N/A"} mono />
                    <div className="sm:col-span-2 rounded-xl border bg-white p-4">
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {paymentReview.description || "N/A"}
                      </p>
                    </div>
                    <div className="sm:col-span-2 rounded-xl border bg-white p-4">
                      <p className="text-sm text-gray-500">Remarks</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {paymentReview.remarks || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {order.paymentMethod === "EMI" && (
                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">EMI Documents</h2>
                      <p className="text-sm text-gray-500">
                        Aadhaar, PAN, and supporting documents uploaded with the EMI request.
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      order.emiDocuments?.status === "verified"
                        ? "bg-emerald-100 text-emerald-700"
                        : order.emiDocuments?.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {getLabel(order.emiDocuments?.status || "pending")}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <DocumentCard
                      title="Aadhaar Front"
                      preview={order.emiDocuments?.aadhaarFront || order.addharfrontimage}
                      uploadedAt={order.emiDocuments?.uploadedAt || order.createdAt}
                      onPreview={() => setEmiPreview({
                        title: "Aadhaar Front",
                        url: order.emiDocuments?.aadhaarFront || order.addharfrontimage,
                      })}
                    />
                    <DocumentCard
                      title="Aadhaar Back"
                      preview={order.emiDocuments?.aadhaarBack || order.aadharbackimage}
                      uploadedAt={order.emiDocuments?.uploadedAt || order.createdAt}
                      onPreview={() => setEmiPreview({
                        title: "Aadhaar Back",
                        url: order.emiDocuments?.aadhaarBack || order.aadharbackimage,
                      })}
                    />
                    <DocumentCard
                      title="PAN Card"
                      preview={order.emiDocuments?.panCard || order.pancardimage}
                      uploadedAt={order.emiDocuments?.uploadedAt || order.createdAt}
                      onPreview={() => setEmiPreview({
                        title: "PAN Card",
                        url: order.emiDocuments?.panCard || order.pancardimage,
                      })}
                    />
                    {Array.isArray(order.emiDocuments?.otherDocuments) &&
                      order.emiDocuments.otherDocuments.map((doc, index) => (
                        <DocumentCard
                          key={`${doc.url}-${index}`}
                          title={doc.name || `Other Document ${index + 1}`}
                          preview={doc.url}
                          uploadedAt={order.emiDocuments?.uploadedAt || order.createdAt}
                          onPreview={() => setEmiPreview({
                            title: doc.name || `Other Document ${index + 1}`,
                            url: doc.url,
                          })}
                        />
                      ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Items</h2>
                <div className="space-y-4">
                  {order.items?.map((item, index) => {
                    const itemPrice = isAdmin || isEmployee ? item.price : item.dealerPrice || 0;
                    const itemTotal =
                      isAdmin || isEmployee ? item.total : (item.dealerPrice || 0) * (item.qty || 0);

                    return (
                      <div key={index} className="flex gap-4 rounded-2xl bg-gray-50 p-4">
                        <div className="h-20 w-20 overflow-hidden rounded-xl bg-white">
                          {item.product?.images?.[0]?.url ? (
                            <img
                              src={item.product.images[0].url}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                              <Package className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-600">Quantity: {item.qty}</p>
                          <p className="text-xs text-gray-500">SKU: {item.sku || "N/A"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₹{Number(itemPrice || 0).toLocaleString()}</p>
                          <p className="text-sm text-gray-600">Total: ₹{Number(itemTotal || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {isAdmin && !order.dealerAssign && (
                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Dealer Assignment</h2>
                      <p className="text-sm text-gray-600">
                        No dealer has been assigned to this order yet.
                      </p>
                    </div>
                    <button
                      onClick={handleSearchDealers}
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-800"
                    >
                      <Search className="h-4 w-4" />
                      Find Dealers
                    </button>
                  </div>
                </div>
              )}

              {order.dealerAssign && (
                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Assigned Dealer</h2>
                    {isAdmin && (
                      <button
                        onClick={handleUnassignDealer}
                        disabled={isUnassigning}
                        className="rounded-xl border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isUnassigning ? "Removing..." : "Remove Dealer"}
                      </button>
                    )}
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100">
                          <User className="h-5 w-5 text-emerald-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {order.dealerAssign.dealer?.name || "Dealer"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.dealerAssign.dealer?.email || "N/A"}
                          </p>
                          {order.dealerAssign.notes && (
                            <p className="mt-1 text-sm text-gray-600">
                              Remarks: {order.dealerAssign.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Assigned by: {order.dealerAssign.assignedBy?.name || "N/A"}</p>
                        <p>{formatDateTime(order.dealerAssign.assignedAt).full}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(isAdmin || isEmployee) && order.returnRequest?.status === "requested" && (
                <div className="rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-orange-500" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {order.returnRequest.type === "cancel" && "Cancellation Request"}
                      {order.returnRequest.type === "return" && "Return Request"}
                      {order.returnRequest.type === "replace" && "Replacement Request"}
                    </h2>
                  </div>

                  <div className="mb-4 rounded-2xl bg-orange-50 p-4">
                    {order.returnRequest.reason && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Reason:</span> {order.returnRequest.reason}
                      </p>
                    )}
                    {order.returnRequest.serialNumber && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Serial No:</span> {order.returnRequest.serialNumber}
                      </p>
                    )}
                    {order.returnRequest.modelNumber && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Model No:</span> {order.returnRequest.modelNumber}
                      </p>
                    )}
                    {order.returnRequest.requestedAt && (
                      <p className="mt-2 text-xs text-gray-500">
                        Requested at: {formatDateTime(order.returnRequest.requestedAt).full}
                      </p>
                    )}
                  </div>

                  {order.returnRequest.images?.length > 0 && (
                    <div className="mb-4">
                      <p className="mb-2 text-sm font-medium text-gray-700">Attached Images</p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {order.returnRequest.images.map((img, index) => (
                          <a key={index} href={img} target="_blank" rel="noreferrer">
                            <img
                              src={img}
                              alt={`proof-${index}`}
                              className="h-24 w-full rounded-xl border object-cover transition hover:opacity-80"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Message to Customer
                    </label>
                    <textarea
                      value={returnAdminMessage}
                      onChange={(e) => setReturnAdminMessage(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Reason for approval or rejection..."
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleReturnApproval("approved")}
                      disabled={isHandlingReturn}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReturnApproval("rejected")}
                      disabled={isHandlingReturn}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {(isAdmin || isEmployee) &&
                order.returnRequest?.type &&
                ["approved", "rejected"].includes(order.returnRequest?.status) && (
                  <div className={`rounded-2xl border bg-white p-6 shadow-sm ${
                    order.returnRequest.status === "approved"
                      ? "border-emerald-200"
                      : "border-red-200"
                  }`}>
                    <div className="mb-3 flex items-center gap-2">
                      {order.returnRequest.status === "approved" ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <h2 className="text-lg font-semibold text-gray-900">
                        {getLabel(`${order.returnRequest.type}_${order.returnRequest.status}`)}
                      </h2>
                    </div>

                    {order.returnRequest.reason && (
                      <p className="mb-2 text-sm text-gray-600">
                        <span className="font-medium">Customer Reason:</span> {order.returnRequest.reason}
                      </p>
                    )}

                    {order.returnRequest.adminMessage && (
                      <p className="mb-2 text-sm text-gray-600">
                        <span className="font-medium">Admin Message:</span> {order.returnRequest.adminMessage}
                      </p>
                    )}

                    {order.returnRequest.updatedAt && (
                      <p className="text-xs text-gray-400">
                        Resolved at: {formatDateTime(order.returnRequest.updatedAt).full}
                      </p>
                    )}
                  </div>
                )}

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <Clock3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Order Activity</h2>
                    <p className="text-sm text-gray-500">Read-only audit trail for every important order action.</p>
                  </div>
                </div>

                {activityItems.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                    No activity recorded yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activityItems.map((event, index) => {
                      const tone = getActivityTone(event.action || event.actionPerformed || event.status);
                      const timeValue = event.createdAt || event.timestamp || event.at;
                      const actionTitle = event.action || event.actionPerformed || getLabel(event.status);
                      const performerName = event.performedByName || event.employeeName || "System";
                      const performerRole = event.performedByRole || event.employeeRole || "System";
                      const time = formatDateTime(timeValue);
                      return (
                        <div key={`${event.actionPerformed || event.status}-${index}`} className={`rounded-2xl border p-4 ${tone.wrap}`}>
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/80">
                                {tone.icon}
                              </div>
                              <div>
                                <p className="font-semibold">{actionTitle}</p>
                                <p className="text-sm opacity-90">
                                  Performed By: {performerName}
                                </p>
                                <p className="text-xs opacity-80">
                                  Role: {performerRole}
                                </p>
                              </div>
                            </div>

                            <div className="text-sm">
                              <p className="font-medium">{time.date}</p>
                              <p className="text-xs opacity-80">{time.time}</p>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <InfoTile label="Performed By" value={performerName} />
                            <InfoTile label="Role" value={performerRole} />
                            <InfoTile label="Action" value={actionTitle} />
                            <InfoTile label="Date / Time" value={time.full} />
                          </div>

                          <div className="mt-3 rounded-xl bg-white/70 p-3">
                            <p className="text-xs uppercase tracking-[0.15em] text-gray-500">Remarks</p>
                            <p className="mt-1 text-sm text-gray-900">
                              {event.remarks || event.notes || "N/A"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Customer Information</h2>
                <div className="space-y-3">
                  <SideInfoRow icon={<User className="h-5 w-5" />} label="Name" value={order.user?.name || "N/A"} />
                  <SideInfoRow icon={<Mail className="h-5 w-5" />} label="Email" value={order.user?.email || "N/A"} />
                  <SideInfoRow icon={<Phone className="h-5 w-5" />} label="Phone" value={order.user?.mobile || "N/A"} />
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <MapPin className="h-5 w-5" />
                  Delivery Address
                </h2>
                <div className="space-y-1 text-gray-700">
                  {order.address?.fullName && <p className="font-medium">{order.address.fullName}</p>}
                  {order.address?.addressLine1 && <p>{order.address.addressLine1}</p>}
                  {order.address?.addressLine2 && <p>{order.address.addressLine2}</p>}
                  <p>
                    {order.address?.city}, {order.address?.state}
                  </p>
                  <p className="font-medium">PIN: {order.address?.pincode}</p>
                  {order.address?.mobile && <p className="text-sm">{order.address.mobile}</p>}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Shipment Information</h2>
                <div className="space-y-3">
                  <SideInfoRow
                    icon={<Truck className="h-5 w-5" />}
                    label="Current Status"
                    value={getLabel(order.status)}
                  />
                  <SideInfoRow
                    icon={<Clock3 className="h-5 w-5" />}
                    label="Last Updated"
                    value={formatDateTime(order.latestAction?.timestamp || order.updatedAt).full}
                  />
                  <SideInfoRow
                    icon={<User className="h-5 w-5" />}
                    label="Updated By"
                    value={order.latestAction?.performedByName || order.latestAction?.employeeName || "System"}
                  />
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Summary</h2>
                <div className="space-y-3 text-sm">
                  {(isAdmin || isEmployee) && (
                    <>
                      <SummaryRow label="Subtotal" value={`₹${Number(order.subTotal || 0).toLocaleString()}`} />
                      <SummaryRow label="Shipping" value={`₹${Number(orderPricing.shippingCharges || 0).toLocaleString()}`} />
                      <SummaryRow label="Tax" value={`₹${Number(orderPricing.taxAmount || 0).toLocaleString()}`} />
                      <SummaryRow label="Discount" value={`-₹${Number(orderPricing.discount || 0).toLocaleString()}`} tone="text-emerald-600" />
                    </>
                  )}
                  {isDealer && (
                    <>
                      <SummaryRow label="Dealer Cost" value={`₹${Number(order.dealerShowSubTotal || 0).toLocaleString()}`} />
                      <SummaryRow label="Dealer Grand Total" value={`₹${Number(order.dealerShowGrandTotal || 0).toLocaleString()}`} />
                    </>
                  )}
                  {!isAdmin && !isEmployee && !isDealer && (
                    <SummaryRow label="Final Selling Total" value={`₹${Number(orderPricing.customerPrice).toLocaleString()}`} />
                  )}
                  <div className="flex items-center justify-between border-t pt-3 text-base font-semibold text-gray-900">
                    <span>Grand Total</span>
                    <span>
                      {isDealer
                        ? `₹${Number(order.dealerShowGrandTotal || 0).toLocaleString()}`
                        : isAdmin || isEmployee
                        ? `₹${Number(order.grandTotal || 0).toLocaleString()}`
                        : `₹${Number(orderPricing.customerPrice || 0).toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showPaymentProof && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Payment Proof</h3>
                  <p className="text-sm text-gray-500">
                    {order.paymentMethod === "EMI" ? "Supporting payment document" : "Uploaded payment screenshot"}
                  </p>
                </div>
                <button
                  onClick={() => setShowPaymentProof(false)}
                  className="rounded-lg p-2 hover:bg-gray-100"
                >
                  <XCircle className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="flex flex-1 items-center justify-center overflow-y-auto bg-gray-50 p-4">
                <img
                  src={order.paymentImage}
                  alt="Payment proof"
                  className="max-h-[70vh] w-full rounded-xl object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {emiPreview?.url && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{emiPreview.title}</h3>
                  <p className="text-sm text-gray-500">Preview and download the EMI document.</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={emiPreview.url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => setEmiPreview(null)}
                    className="rounded-lg p-2 hover:bg-gray-100"
                  >
                    <XCircle className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="flex flex-1 items-center justify-center overflow-y-auto bg-gray-50 p-4">
                <img
                  src={emiPreview.url}
                  alt={emiPreview.title}
                  className="max-h-[70vh] w-full rounded-xl object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {showStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b p-5">
                <h3 className="text-lg font-bold text-gray-800">Update Order Status</h3>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setNewStatus("");
                  }}
                  className="rounded-lg p-1 hover:bg-gray-100"
                >
                  <XCircle className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="p-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="assigned">Assigned</option>
                  <option value="payment_approved">Payment Approved</option>
                  <option value="processing">Processing</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="in_transit">In Transit</option>
                  <option value="packed">Packed</option>
                  <option value="ready_for_dispatch">Ready for Dispatch</option>
                  <option value="shipped">Shipped</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="returned">Returned</option>
                  <option value="refunded">Refunded</option>
                </select>
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowStatusModal(false);
                      setNewStatus("");
                    }}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateOrderStatus}
                    disabled={isUpdatingStatus}
                    className="rounded-xl bg-amber-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUpdatingStatus ? "Updating..." : "Update Status"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Approve Payment</h3>
                  <p className="text-sm text-gray-500">
                    Transaction / UTR number and description are required.
                  </p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="rounded-lg p-1 hover:bg-gray-100"
                >
                  <XCircle className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Transaction / UTR Number
                  </label>
                  <input
                    value={paymentForm.utrNumber}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({ ...prev, utrNumber: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="UTR983748292"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={paymentForm.description}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={4}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Payment verified with bank."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Remarks
                  </label>
                  <textarea
                    value={paymentForm.remarks}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({ ...prev, remarks: e.target.value }))
                    }
                    rows={2}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Optional internal remarks"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApprovePayment}
                    disabled={isUpdatingPayment}
                    className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUpdatingPayment ? "Approving..." : "Approve Payment"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDealerPanel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Assign Dealer</h3>
                  <p className="text-sm text-gray-600">Pincode: {order.address?.pincode}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDealerPanel(false);
                    setSelectedDealer(null);
                  }}
                  className="rounded-lg p-1 hover:bg-gray-100"
                >
                  <XCircle className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {dealersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-amber-600" />
                  </div>
                ) : !dealersData?.data || dealersData.data.length === 0 ? (
                  <div className="py-12 text-center">
                    <Package className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                    <p className="text-gray-600">No dealers found for this pincode</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {dealersData.data.map((dealerObj) => {
                      const isSelected = selectedDealer?._id === dealerObj.dealer._id;
                      return (
                        <button
                          key={dealerObj.dealer._id}
                          onClick={() => setSelectedDealer(dealerObj.dealer)}
                          className={`rounded-2xl border p-4 text-left transition ${
                            isSelected
                              ? "border-amber-700 bg-amber-50"
                              : "border-gray-200 bg-gray-50 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                                <User className="h-6 w-6 text-amber-700" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {dealerObj.dealer.name}
                                </h4>
                                <p className="text-sm text-gray-600">{dealerObj.dealer.email}</p>
                                {dealerObj.dealer.storeName && (
                                  <p className="text-sm text-gray-500">
                                    Store: {dealerObj.dealer.storeName}
                                  </p>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                                Selected
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t bg-gray-50 p-5">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Add any notes for the dealer..."
                  rows={2}
                />
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDealerPanel(false);
                      setSelectedDealer(null);
                      setAssignNotes("");
                    }}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignDealer}
                    disabled={!selectedDealer || isAssigning}
                    className="rounded-xl bg-amber-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isAssigning ? "Assigning..." : "Assign Dealer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function InfoTile({ label, value, mono = false }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-sm font-medium text-gray-900 ${mono ? "font-mono" : ""}`}>
        {value || "N/A"}
      </p>
    </div>
  );
}

function SideInfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-gray-400">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, tone = "text-gray-700" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className={`font-medium ${tone}`}>{value}</span>
    </div>
  );
}

function DocumentCard({ title, preview, uploadedAt, onPreview }) {
  return (
    <div className="rounded-2xl border bg-gray-50 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">
            Uploaded: {formatDateTime(uploadedAt).full}
          </p>
        </div>
        <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${
          preview ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
        }`}>
          {preview ? "Available" : "Missing"}
        </span>
      </div>

      <div className="mb-3 overflow-hidden rounded-xl border bg-white">
        {preview ? (
          <img src={preview} alt={title} className="h-40 w-full object-cover" />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-gray-500">
            No document uploaded
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!preview}
          onClick={onPreview}
          className="flex-1 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          Preview
        </button>
        {preview && (
          <a
            href={preview}
            download
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Download
          </a>
        )}
      </div>
    </div>
  );
}
