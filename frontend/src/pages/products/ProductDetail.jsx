import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  useGetProductByIdQuery,
  useGetProductsQuery,
} from "../../store/api/productsApi";
import {
  ChevronLeft,
  Package,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Save,
  ShieldCheck,
  CircleDot,
  Tag,
  Image as ImageIcon,
} from "lucide-react";
import axios from "axios";
import { ToastContainer } from "../Toast/Toast"; // Adjust path as needed
import { useToast } from "../../hooks/useToast"; // Adjust path as needed

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

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const isObjectIdLike = (value) =>
  typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

const formatAuditValue = (value, action = "") => {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  if (isObjectIdLike(value)) {
    return "Updated";
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
      return formatCurrency(value);
    }
    return value.toLocaleString("en-IN");
  }

  if (typeof value === "object") {
    if (value.name) return value.name;
    if (value.title) return value.title;
    if (value.url) return "Image";

    const entries = Object.entries(value)
      .filter(([key]) => key !== "_id")
      .map(([key, item]) => `${key}: ${formatAuditValue(item, action)}`)
      .filter(Boolean);

    return entries.length ? entries.join(", ") : "Updated";
  }

  return String(value);
};

const getActivityTone = (action = "") => {
  const normalized = action.toLowerCase();

  if (
    normalized.includes("approved") ||
    normalized.includes("activated") ||
    normalized.includes("created")
  ) {
    return {
      icon: <ShieldCheck className="h-4 w-4" />,
      wrap: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }

  if (normalized.includes("rejected") || normalized.includes("deactivated")) {
    return {
      icon: <XCircle className="h-4 w-4" />,
      wrap: "bg-red-50 text-red-700 border-red-200",
    };
  }

  if (
    normalized.includes("price") ||
    normalized.includes("commission") ||
    normalized.includes("margin")
  ) {
    return {
      icon: <Tag className="h-4 w-4" />,
      wrap: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  if (normalized.includes("image")) {
    return {
      icon: <ImageIcon className="h-4 w-4" />,
      wrap: "bg-violet-50 text-violet-700 border-violet-200",
    };
  }

  if (normalized.includes("stock")) {
    return {
      icon: <Package className="h-4 w-4" />,
      wrap: "bg-sky-50 text-sky-700 border-sky-200",
    };
  }

  return {
    icon: <CircleDot className="h-4 w-4" />,
    wrap: "bg-slate-50 text-slate-700 border-slate-200",
  };
};

const formatActionLabel = (action = "") =>
  String(action)
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export default function ProductDetail() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    sku: "",
    brand: "",
    serialNumber: "",
    modelNumber: "",
    dealerPrice: "",
    stock: "",
    categoryId: "",
    subCategoryId: "",
  });
  const { toasts, addToast, removeToast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isDealer = user?.role === "dealer";
  const userRole = user?.role || "customer";
  const { productId } = useParams();
  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = useGetProductByIdQuery(productId);
  const canEdit =
    !isDealer ||
    product?.dealerId?._id === user._id ||
    product?.dealerId === user._id;
  const [selectedImage, setSelectedImage] = useState(0);
  const [commission, setCommission] = useState(0);
  const [isEditingCommission, setIsEditingCommission] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getPriceBreakdown = () => {
    const customerPrice = Number(product?.customerPrice ?? product?.dealerPrice ?? 0);
    const dealerPrice = Number(product?.dealerPrice ?? 0);
    const commission = Number(product?.commission ?? Math.max(customerPrice - dealerPrice, 0));
    const margin = Number(customerPrice - dealerPrice);
    return { customerPrice, dealerPrice, commission, margin };
  };

  const renderPriceCards = () => {
    const price = getPriceBreakdown();

    if (userRole === "customer") {
      return (
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-gray-500">Final Selling Price</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            ₹{price.customerPrice.toLocaleString()}
          </p>
        </div>
      );
    }

    if (userRole === "dealer") {
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          <PriceTile label="Own Product Cost" value={`₹${price.dealerPrice.toLocaleString()}`} />
          <PriceTile label="Own Margin" value={`₹${price.margin.toLocaleString()}`} tone="text-emerald-600" />
          <PriceTile label="Customer Selling Price" value={`₹${price.customerPrice.toLocaleString()}`} />
        </div>
      );
    }

    if (userRole === "employee") {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <PriceTile label="Customer Price" value={`₹${price.customerPrice.toLocaleString()}`} />
          <PriceTile label="Dealer Price" value={`₹${price.dealerPrice.toLocaleString()}`} />
          <PriceTile label="Margin" value={`₹${price.margin.toLocaleString()}`} tone="text-emerald-600" />
          <PriceTile label="Commission" value={`₹${price.commission.toLocaleString()}`} tone="text-amber-700" />
        </div>
      );
    }

    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <PriceTile label="Customer Price" value={`₹${price.customerPrice.toLocaleString()}`} />
        <PriceTile label="Dealer Price" value={`₹${price.dealerPrice.toLocaleString()}`} />
        <PriceTile label="Margin" value={`₹${price.margin.toLocaleString()}`} tone="text-emerald-600" />
        <PriceTile label="Commission" value={`₹${price.commission.toLocaleString()}`} tone="text-amber-700" />
      </div>
    );
  };

  useEffect(() => {
    if (product) {
      setCommission(product.commission || 0);
      setFormData({
        title: product.title || "",
        shortDescription: product.shortDescription || "",
        sku: product.sku || "",
        brand: product.brand || "",
        serialNumber: product.serialNumber || "",
        modelNumber: product.modelNumber || "",
        dealerPrice: product.dealerPrice || "",
        stock: product.stock || "",
        categoryId: product.categoryId || "",
        subCategoryId: product.subCategoryId || "",
      });
    }
  }, [product]);

  //console.log("Product Data:", product);

  const handleUpdateProduct = async () => {
    setIsSaving(true);
    try {
      const response = await axios.patch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/dealer/products/updateProduct/${productId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.status === 200) {
        setIsEditMode(false);
        addToast("Product updated successfully!", "success");
        refetch();
      }
    } catch (error) {
      console.error("Failed to update product:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Error updating product. Please try again.";
      addToast(errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Product Not Found
          </h2>
          <p className="text-gray-600">
            The product you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const handleCommissionUpdate = async () => {
    setIsSaving(true);
    try {
      const response = await axios.patch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/employee/products/commission/${productId}`,
        {
          commission: parseFloat(commission),
          customerPrice: product.dealerPrice + parseFloat(commission),
        }
      );

      if (response.status === 200 || response.status === 201) {
        setIsEditingCommission(false);
        addToast("Commission updated successfully!", "success");
        refetch();
      }
    } catch (error) {
      console.error("Failed to update commission:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Error updating commission. Please try again.";
      addToast(errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const isPrivilegedViewer = userRole === "admin" || userRole === "employee";
  const activityItems = [...(product?.activityLog || [])].sort((a, b) => {
    const aTime = new Date(a?.createdAt || 0).getTime();
    const bTime = new Date(b?.createdAt || 0).getTime();
    return aTime - bTime;
  });
  const firstActivity = activityItems[0];
  const lastActivity = activityItems[activityItems.length - 1];
  const createdByName =
    product?.createdByName ||
    product?.dealerId?.name ||
    product?.employeeId?.name ||
    firstActivity?.performedByName ||
    "System";
  const createdByRole =
    product?.createdByRole ||
    firstActivity?.performedByRole ||
    (product?.dealerId?.name ? "Dealer" : "System");
  const createdOn = formatDateTime(product?.createdAt);
  const lastModifiedByName =
    product?.lastModifiedByName ||
    lastActivity?.performedByName ||
    "System";
  const lastModifiedByRole =
    product?.lastModifiedByRole ||
    lastActivity?.performedByRole ||
    "System";
  const lastModifiedOn = formatDateTime(
    product?.lastModifiedAt || lastActivity?.createdAt || product?.updatedAt
  );
  const lastAction = product?.lastAction || lastActivity?.action || "Product Created";

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back to Products
            </button>

            {canEdit && (
              <div className="flex gap-2">
                {isEditMode ? (
                  <>
                    <button
                      onClick={handleUpdateProduct}
                      disabled={isSaving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                      {isSaving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditMode(false);
                        setFormData({
                          title: product.title || "",
                          shortDescription: product.shortDescription || "",
                          sku: product.sku || "",
                          brand: product.brand || "",
                          serialNumber: product.serialNumber || "",
                          modelNumber: product.modelNumber || "",
                          dealerPrice: product.dealerPrice || "",
                          stock: product.stock || "",
                          categoryId: product.categoryId?._id || "",
                          subCategoryId: product.subCategoryId?._id || "",
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Edit Product
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="aspect-square flex items-center justify-center p-8">
                  <img
                    src={
                      product.images[selectedImage]?.url || "/placeholder.png"
                    }
                    alt={product.images[selectedImage]?.alt || product.title}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>

              {/* Thumbnail Images */}
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={image._id}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden transition-all ${
                        selectedImage === index
                          ? "border-blue-600"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side - Product Details */}
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {product.isApproved ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approved
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    <XCircle className="w-4 h-4 mr-1" />
                    Pending Approval
                  </span>
                )}
                {product.isActive && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Active
                  </span>
                )}
              </div>

              {/* Title */}
              <div>
                {isEditMode ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                          handleInputChange("title", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Short Description
                      </label>
                      <textarea
                        value={formData.shortDescription}
                        onChange={(e) =>
                          handleInputChange("shortDescription", e.target.value)
                        }
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                      {product.title}
                    </h1>
                    <p className="text-gray-600">{product.shortDescription}</p>
                  </>
                )}
              </div>

              {isPrivilegedViewer && (
                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-amber-700">
                        Product Activity Snapshot
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-gray-900">
                        Last Modified Information
                      </h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {formatActionLabel(lastAction)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <InfoTile label="Created By" value={createdByName} />
                    <InfoTile label="Created On" value={createdOn.full} />
                    <InfoTile label="Created Role" value={createdByRole} />
                    <InfoTile label="Last Modified By" value={lastModifiedByName} />
                    <InfoTile label="Last Modified On" value={lastModifiedOn.full} />
                    <InfoTile label="Last Modified Role" value={lastModifiedByRole} />
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="space-y-4 rounded-2xl border bg-gray-50 p-5">
                {isEditMode ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dealer Price
                    </label>
                    <input
                      type="number"
                      value={formData.dealerPrice}
                      onChange={(e) =>
                        handleInputChange("dealerPrice", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  renderPriceCards()
                )}

                {!isDealer && !isEditMode && (
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Commission
                      </label>
                      {!isEditingCommission && (
                        <button
                          onClick={() => setIsEditingCommission(true)}
                          className="text-sm text-blue-900 font-semibold hover:text-blue-700"
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {isEditingCommission ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={commission}
                          onChange={(e) => setCommission(e.target.value)}
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter commission"
                        />
                        <button
                          onClick={handleCommissionUpdate}
                          disabled={isSaving}
                          className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isSaving ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Save className="mr-1 w-4 h-4" />
                              Save
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setCommission(product.commission || 0);
                            setIsEditingCommission(false);
                          }}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="text-lg font-semibold text-gray-900">
                        ₹{(commission || 0).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Product Information */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Product Information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Brand</p>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) =>
                          handleInputChange("brand", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="font-medium text-gray-900">
                        {product.brand}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">SKU</p>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) =>
                          handleInputChange("sku", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="font-medium text-gray-900">{product.sku}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Serial Number</p>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={formData.serialNumber}
                        onChange={(e) =>
                          handleInputChange("serialNumber", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="font-medium text-gray-900">
                        {product.serialNumber || "N/A"}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Model Number</p>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={formData.modelNumber}
                        onChange={(e) =>
                          handleInputChange("modelNumber", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="font-medium text-gray-900">
                        {product.modelNumber || "N/A"}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-medium text-gray-900">
                      {product.categoryId.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Sub Category</p>
                    <p className="font-medium text-gray-900">
                      {product.subCategoryId.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Stock</p>
                    {isEditMode ? (
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) =>
                          handleInputChange("stock", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="font-medium text-gray-900 flex items-center">
                        <Package className="w-4 h-4 mr-1" />
                        {product.stock} units
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dealer Information */}
              {(userRole === "admin" || userRole === "employee") && (
                <div className="border-t pt-6 space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Dealer Information
                </h3>

                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Dealer Name</p>
                      <p className="font-medium text-gray-900">
                        {product.dealerId.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 ml-7">Email: </span>
                    <span className="font-medium text-gray-900 ml-2">
                      {product.dealerId.email}
                    </span>
                  </div>
                </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t pt-6 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Created:{" "}
                  {new Date(product.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                {product.approvedAt && (
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approved:{" "}
                    {new Date(product.approvedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>

              {isPrivilegedViewer && (
                <div className="border-t pt-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Product Activity
                    </h3>
                    <p className="text-sm text-gray-500">
                      Chronological audit trail for product changes.
                    </p>
                  </div>

                  {activityItems.length === 0 ? (
                    <div className="rounded-2xl border bg-white p-5 text-sm text-gray-500">
                      No product activity recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activityItems.map((event, index) => {
                        const tone = getActivityTone(event.action);
                        const timestamp = formatDateTime(event.createdAt);
                        const hasPrevious =
                          event.previousValue !== null &&
                          event.previousValue !== undefined &&
                          event.previousValue !== "";
                        const hasNew =
                          event.newValue !== null &&
                          event.newValue !== undefined &&
                          event.newValue !== "";

                        return (
                          <article
                            key={`${event.action}-${event.createdAt}-${index}`}
                            className="rounded-2xl border bg-white p-4 shadow-sm"
                          >
                            <div className="flex items-start gap-4">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tone.wrap}`}
                              >
                                {tone.icon}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <h4 className="text-base font-semibold text-gray-900">
                                      {formatActionLabel(event.action)}
                                    </h4>
                                    <div className="mt-1 flex flex-wrap gap-2 text-sm text-gray-600">
                                      <span>
                                        <span className="font-medium text-gray-900">
                                          Performed By:
                                        </span>{" "}
                                        {event.performedByName || "System"}
                                      </span>
                                      <span>
                                        <span className="font-medium text-gray-900">
                                          Role:
                                        </span>{" "}
                                        {event.performedByRole || "System"}
                                      </span>
                                      <span>
                                        <span className="font-medium text-gray-900">
                                          Date &amp; Time:
                                        </span>{" "}
                                        {timestamp.full}
                                      </span>
                                    </div>
                                  </div>

                                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                    #{index + 1}
                                  </span>
                                </div>

                                {event.remarks && (
                                  <p className="mt-3 text-sm text-gray-600">
                                    <span className="font-medium text-gray-900">
                                      Remarks:
                                    </span>{" "}
                                    {event.remarks}
                                  </p>
                                )}

                                {(hasPrevious || hasNew) && (
                                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    {hasPrevious && (
                                      <ValueTile
                                        label="Previous Value"
                                        value={formatAuditValue(
                                          event.previousValue,
                                          event.action
                                        )}
                                      />
                                    )}
                                    {hasNew && (
                                      <ValueTile
                                        label="New Value"
                                        value={formatAuditValue(
                                          event.newValue,
                                          event.action
                                        )}
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function PriceTile({ label, value, tone = "text-gray-900" }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function ValueTile({ label, value }) {
  return (
    <div className="rounded-xl border bg-gray-50 p-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}
