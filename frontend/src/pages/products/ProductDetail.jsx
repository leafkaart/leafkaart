import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  useGetProductByIdQuery,
} from "../../store/api/productsApi";
import {
  ChevronLeft,
  Package,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Save,
  Tag,
  Image as ImageIcon,
} from "lucide-react";
import axios from "axios";
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

export default function ProductDetail() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmEdit, setConfirmEdit] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    warranty: "",
    sku: "",
    brand: "",
    serialNumber: "",
    modelNumber: "",
    dealerPrice: "",
    stock: "",
    categoryId: "",
    subCategoryId: "",
  });
  const { addToast } = useToast();
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
  const isAdmin = userRole === "admin";
  const canManageInventory = isAdmin ||
    (userRole === "employee" && product?.createdByRole?.toLowerCase() === "admin");
  const canEdit = canManageInventory || (
    isDealer && (product?.dealerId?._id === user._id || product?.dealerId === user._id)
  );
  const [selectedImage, setSelectedImage] = useState(0);
  const [commission, setCommission] = useState(0);
  const [isEditingCommission, setIsEditingCommission] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

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
        <div className="grid gap-3 sm:grid-cols-1">
          <PriceTile label="Own Product Cost" value={`₹${price.dealerPrice.toLocaleString()}`} />
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
      setExistingImages(product.images || []);
      setFormData({
        title: product.title || "",
        shortDescription: product.shortDescription || "",
        warranty: product.warranty || "",
        sku: product.sku || "",
        brand: product.brand || "",
        serialNumber: product.serialNumber || "",
        modelNumber: product.modelNumber || "",
        dealerPrice: product.dealerPrice ?? "",
        stock: product.stock ?? 0,
        dealerVisible: product.dealerVisible !== false,
        isActive: product.isActive !== false,
        categoryId: product.categoryId?._id || product.categoryId || "",
        subCategoryId: product.subCategoryId?._id || product.subCategoryId || "",
      });
    }
  }, [product]);

  //console.log("Product Data:", product);

  const clearNewImages = () => {
    newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setNewImages([]);
    setNewImagePreviews([]);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    if (files.some((file) => !["image/jpeg", "image/png"].includes(file.type))) {
      addToast("Upload PNG or JPEG product images.", "error");
      return;
    }
    if (files.some((file) => file.size > 10 * 1024 * 1024)) {
      addToast("Each product image must be 10 MB or smaller.", "error");
      return;
    }

    const remainingSlots = Math.max(
      0,
      6 - existingImages.length - newImages.length
    );
    if (files.length > remainingSlots) {
      addToast("You can upload maximum 6 images in total", "error");
    }
    const accepted = files.slice(0, remainingSlots);
    if (!accepted.length) return;

    const combined = [...newImages, ...accepted];
    setNewImages(combined);
    setNewImagePreviews((prev) => [
      ...prev,
      ...accepted.map((file) => URL.createObjectURL(file)),
    ]);
  };

  const handleRemoveNewImage = (index) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveExistingImage = (index, direction) => {
    setExistingImages((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const handleUpdateProduct = async () => {
    setIsSaving(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null &&
            (value !== "" || !["categoryId", "subCategoryId"].includes(key)) &&
            (canManageInventory || !["dealerVisible", "isActive"].includes(key))) {
          payload.append(key, value);
        }
      });

      if (canEdit) {
        payload.append(
          "existingImages",
          JSON.stringify(existingImages.map((image) => image._id))
        );
        newImages.forEach((file) => payload.append("images", file));
      }

      const endpointBase = isDealer ? "/dealer/products" : "/admin/products";
      const response = await axios.patch(
        `${import.meta.env.VITE_BACKEND_URL}${endpointBase}/updateProduct/${productId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.status === 200) {
        setIsEditMode(false);
        clearNewImages();
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
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
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
  const approvalActivity = [...activityItems]
    .reverse()
    .find((event) => event.action === "Product Approved");
  const commissionActivities = activityItems.filter(
    (event) => event.action === "Commission Updated"
  );
  const commissionAddedActivity = commissionActivities[0];
  const commissionChangedActivity =
    commissionActivities.length > 1
      ? commissionActivities[commissionActivities.length - 1]
      : null;

  return (
    <>

      <div className="min-h-screen bg-gray-50">
      {confirmEdit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-product-edit"
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 id="confirm-product-edit" className="text-lg font-semibold">Save changes to this product?</h2>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="rounded-lg border px-4 py-2"
                onClick={() => setConfirmEdit(false)}>Cancel</button>
              <button type="button" className="rounded-lg bg-amber-700 px-4 py-2 text-white" onClick={() => {
                setConfirmEdit(false);
                handleUpdateProduct();
              }}>Save changes</button>
            </div>
          </div>
        </div>
      )}
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
                      onClick={() => isAdmin ? setConfirmEdit(true) : handleUpdateProduct()}
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
                        clearNewImages();
                        setExistingImages(product.images || []);
                        setFormData({
                          title: product.title || "",
                          shortDescription: product.shortDescription || "",
                          warranty: product.warranty || "",
                          sku: product.sku || "",
                          brand: product.brand || "",
                          serialNumber: product.serialNumber || "",
                          modelNumber: product.modelNumber || "",
                          dealerPrice: product.dealerPrice ?? "",
                          stock: product.stock ?? 0,
                          dealerVisible: product.dealerVisible !== false,
                          isActive: product.isActive !== false,
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
              {isEditMode && canEdit ? (
                existingImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {existingImages.map((image, index) => (
                      <div
                        key={image._id || image.url}
                        className="relative w-20 h-20"
                      >
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="w-full h-full object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(index)}
                          className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 shadow"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                        <div className="absolute inset-x-0 bottom-0 flex justify-between p-0.5">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveExistingImage(index, -1)}
                            className="rounded bg-white/90 px-1 text-xs font-bold text-gray-700 disabled:opacity-30"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            disabled={index === existingImages.length - 1}
                            onClick={() => handleMoveExistingImage(index, 1)}
                            className="rounded bg-white/90 px-1 text-xs font-bold text-gray-700 disabled:opacity-30"
                          >
                            →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                product.images.length > 1 && (
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
                )
              )}

              {/* Edit Mode - Add Photos (dealer only) */}
              {isEditMode && canEdit && (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      Add Product Photos
                    </p>
                    <label className="cursor-pointer text-sm text-blue-700 font-semibold hover:text-blue-800 flex items-center">
                      <ImageIcon className="w-4 h-4 mr-1" />
                      Choose Photos
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        multiple
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Remove or reorder photos above using the × and arrow
                    buttons, and add new ones here (max 6 total).
                  </p>
                  {newImagePreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newImagePreviews.map((url, index) => (
                        <div key={url} className="relative w-20 h-20">
                          <img
                            src={url}
                            alt={`New upload ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveNewImage(index)}
                            className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 shadow"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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

              {isPrivilegedViewer && (approvalActivity || commissionAddedActivity) && (
                <div className="rounded-xl border bg-white p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Product Activity
                  </p>
                  <div className="space-y-1.5">
                    {approvalActivity && (
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>
                          Approved by{" "}
                          <span className="font-medium text-gray-900">
                            {approvalActivity.performedByName}
                          </span>{" "}
                          on {formatDateTime(approvalActivity.createdAt).full}
                        </span>
                      </div>
                    )}
                    {commissionAddedActivity && (
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <Tag className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                        <span>
                          Commission added by{" "}
                          <span className="font-medium text-gray-900">
                            {commissionAddedActivity.performedByName}
                          </span>{" "}
                          on {formatDateTime(commissionAddedActivity.createdAt).full}
                        </span>
                      </div>
                    )}
                    {commissionChangedActivity && (
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <Tag className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                        <span>
                          Commission last changed by{" "}
                          <span className="font-medium text-gray-900">
                            {commissionChangedActivity.performedByName}
                          </span>{" "}
                          on {formatDateTime(commissionChangedActivity.createdAt).full}{" "}
                          (
                          {formatAuditValue(
                            commissionChangedActivity.previousValue,
                            commissionChangedActivity.action
                          )}{" "}
                          →{" "}
                          {formatAuditValue(
                            commissionChangedActivity.newValue,
                            commissionChangedActivity.action
                          )}
                          )
                        </span>
                      </div>
                    )}
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

                {isPrivilegedViewer && (
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
                    {isEditMode ? (
                      <>
                        <label htmlFor="product-warranty" className="block text-sm text-gray-600 mb-1">
                          Warranty (optional)
                        </label>
                        <input
                          id="product-warranty"
                          type="text"
                          value={formData.warranty}
                          onChange={(e) => handleInputChange("warranty", e.target.value)}
                          placeholder="e.g., 1 year manufacturer warranty"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 mb-1">Warranty</p>
                        <p className="break-words font-medium text-gray-900">
                          {product.warranty || "Not specified"}
                        </p>
                      </>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-medium text-gray-900">
                      {product.categoryId?.name || "Unassigned"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Sub Category</p>
                    <p className="font-medium text-gray-900">
                      {product.subCategoryId?.name || "Unassigned"}
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

              {isEditMode && canManageInventory && (
                <div className="flex flex-wrap gap-5 border-t pt-4">
                  {[["isActive", "Active catalog product"], ["dealerVisible", "Visible to dealers"]]
                    .map(([field, label]) => (
                      <label key={field} className="flex items-center gap-2 text-sm font-medium">
                        <input type="checkbox" checked={formData[field] ?? true}
                          onChange={(event) => handleInputChange(field, event.target.checked)} />
                        {label}
                      </label>
                    ))}
                </div>
              )}

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
                        {product.dealerId?.name || "Admin inventory"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 ml-7">Email: </span>
                    <span className="font-medium text-gray-900 ml-2">
                      {product.dealerId?.email || "—"}
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
