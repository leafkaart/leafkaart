import { useState } from "react";
import {
  useGetCategoriesQuery,
  useGetProductsQuery,
  useApproveProductMutation,
  useRejectProductMutation,
  useGetSubCategoriesByCategoryQuery,
} from "../../store/api/productsApi";
import {
  ChevronDown,
  Filter,
  Package,
  Plus,
  Search,
  CheckCircle,
  XCircle,
} from "lucide-react";
import AddProductPage from "./AddProductPage";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast"; // Adjust path as needed

function ProductList() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const { addToast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user?.role;
  const isDealer = user?.role === "dealer";
  const isAdmin = userRole === "admin";
  const navigate = useNavigate();
  // New product form state
  const [showAddForm, setShowAddForm] = useState(false);

  // RTK Query hooks
  const { data: categoriesResponse, isLoading: categoriesLoading } =
    useGetCategoriesQuery();
  const categories = categoriesResponse?.data ?? [];

  // Subcategories for filter dropdown
  const { data: subCategoriesResponse, isLoading: subCategoriesLoading } =
    useGetSubCategoriesByCategoryQuery(selectedCategory, {
      skip: !selectedCategory,
    });
  const subCategories = subCategoriesResponse || [];


  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
  } = useGetProductsQuery({
    categoryId: selectedCategory,
    subCategoryId: selectedSubCategory,
    search,
    view,
  });

  const [approveProduct] =
    useApproveProductMutation();
  const [rejectProduct] =
    useRejectProductMutation();

  const sortedProducts = [...products].sort((a, b) => {
    const aTime = new Date(a?.createdAt || 0).getTime();
    const bTime = new Date(b?.createdAt || 0).getTime();
    return bTime - aTime;
  });

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedSubCategory("");
  };

  const formatCurrency = (value) => {
    const amount = Number(value ?? 0);
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const getFinalSellingPrice = (product) => {
    if (product?.customerPrice != null) {
      return product.customerPrice;
    }

    if (product?.finalSellingPrice != null) {
      return product.finalSellingPrice;
    }

    return product?.dealerPrice ?? 0;
  };

  const handleApprove = async (productId) => {
    try {
      await approveProduct(productId).unwrap();
      addToast("Product approved successfully!", "success");
    } catch (error) {
      console.error("Failed to approve product:", error);
      addToast("Failed to approve product.", "error");
    }
  };

  const handleDecline = async (productId) => {
    try {
      await rejectProduct(productId).unwrap();
      addToast("Product rejected successfully!", "success");
    } catch (error) {
      console.error("Failed to reject product:", error);
      addToast("Failed to reject product.", "error");
    }
  };

  if (showAddForm) {
    return (
      <AddProductPage
        onBack={() => setShowAddForm(false)}
        categories={categories}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <>

      <div className="h-screen bg-gray-50 flex flex-col">
        <main className=" px-6 py-2 flex-1 flex flex-col overflow-hidden">
          {/* Title Bar with Search, Filter, Add Product */}
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <h2 className="text-2xl font-bold text-gray-800">Product List</h2>

            <div className="flex items-center gap-3 flex-1 justify-end flex-wrap">
              <select
                aria-label="Product view"
                value={view}
                onChange={(event) => setView(event.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <option value="all">All products</option>
                <option value="admin">Admin products only</option>
                <option value="available">Available products</option>
              </select>
              {/* Search */}
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  disabled={categoriesLoading}
                  className="appearance-none bg-white border border-gray-200 rounded-lg pl-10 pr-8 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer disabled:opacity-50"
                >
                  <option value="">All Categories</option>
                  {categories?.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat?.name}
                    </option>
                  ))}
                </select>
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* SubCategory Filter */}
              {selectedCategory && (
                <div className="relative">
                  <select
                    value={selectedSubCategory}
                    onChange={(e) => setSelectedSubCategory(e.target.value)}
                    disabled={subCategoriesLoading}
                    className="appearance-none bg-white border border-gray-200 rounded-lg pl-10 pr-8 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer disabled:opacity-50"
                  >
                    <option value="">All Subcategories</option>
                    {subCategories?.length === 0 && !subCategoriesLoading ? (
                      <option disabled>No subcategories available</option>
                    ) : (
                      subCategories?.map((sub) => (
                        <option
                          key={sub._id || sub.id}
                          value={sub._id || sub.id}
                        >
                          {sub?.name}
                        </option>
                      ))
                    )}
                  </select>
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              )}

              {(isDealer || isAdmin) && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-6 py-3 rounded-lg font-medium transition shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  Add Product
                </button>
              )}
            </div>
          </div>

          {/* Products Count */}
          {productsLoading ? (
            <p className="text-sm text-gray-500 mb-4">Loading products...</p>
          ) : productsError ? (
            <p className="text-sm text-red-500 mb-4">Error loading products</p>
          ) : (
            <p className="text-sm text-gray-500 mb-4">
              {sortedProducts.length} products found
            </p>
          )}

          {/* Products Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 flex-1 min-h-0 flex flex-col">
            <div className="overflow-x-auto flex-1 min-h-0 overflow-y-auto">
              <table className="min-w-full w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4 font-medium text-gray-600 text-sm">
                      Product
                    </th>
                    <th className="py-3 px-4 font-medium text-gray-600 text-sm">
                      Category
                    </th>
                    {!isDealer && (
                      <th className="py-3 px-4 font-medium text-gray-600 text-sm text-center">
                        Dealer
                      </th>
                    )}

                    {/* <th className="py-3 px-4 font-medium text-gray-600 text-sm">
                      SKU
                    </th> */}
                    <th className="py-3 px-4 font-medium text-gray-600 text-sm">
                      Final Selling Price
                    </th>
                    <th className="py-3 px-4 font-medium text-gray-600 text-sm">
                      Stock
                    </th>
                    <th className="py-3 px-4 font-medium text-gray-600 text-sm">
                      Status
                    </th>
                    {!isDealer && (
                      <th className="py-3 px-4 font-medium text-gray-600 text-sm text-center">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {productsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-t border-gray-50">
                        <td
                          colSpan={!isDealer ? "6" : "5"}
                          className="py-4 px-4"
                        >
                          <div className="animate-pulse flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : sortedProducts.length === 0 ? (
                    <tr className="h-full">
                      <td
                        colSpan={!isDealer ? "6" : "5"}
                        className="h-full p-0"
                      >
                        <div
                          className="flex flex-col items-center justify-center w-full h-full"
                          style={{ minHeight: "calc(100vh - 350px)" }}
                        >
                          <Package className="w-16 h-16 text-gray-300 mb-4" />
                          <p className="text-gray-500">No products found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedProducts.map((product) => (
                      <tr
                        key={product._id || product.id}
                        className="border-t border-gray-50 hover:bg-gray-100 transition"
                      >
                        {/* Product Info */}
                        <td className="py-3 px-4">
                          <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => {
                              navigate(`${product._id || product.id}`);
                            }}
                          >
                            <div className="min-w-11 min-h-11 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                              <img
                                src={product.images?.[0]?.url}
                                alt={product.title}
                                className="w-10 h-10 object-cover rounded-lg"
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 text-sm line-clamp-1">
                                {product.title}
                              </p>
                              <p className="text-xs text-gray-400 line-clamp-1">
                                {product.shortDescription}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-600">
                            <p className="font-medium">
                              {product?.categoryId?.name || product.categoryId}
                            </p>
                            {/* <p className="text-xs text-gray-400">
                            {product?.subCategoryId?.name ||
                              product.subCategory}
                          </p> */}
                          </div>
                        </td>

                        {!isDealer && (
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600">
                              {product?.dealerId?.name || product.dealerId}
                            </span>
                          </td>
                        )}

                        {/* SKU */}
                        {/* <td className="py-4 px-4">
                          <span className="text-sm text-gray-600 font-mono">
                            {product.sku || "N/A"}
                          </span>
                        </td> */}

                        {/* Price */}
                        <td className="py-3 px-4">
                          <span
                            className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-gray-900 whitespace-nowrap"
                            title="Final Selling Price"
                          >
                            {formatCurrency(getFinalSellingPrice(product))}
                          </span>
                        </td>

                        {/* Stock */}
                        <td className="py-3 px-4">
                          <span
                            className={`text-sm ${
                              product.stock > 0
                                ? "text-green-600"
                                : "text-red-500"
                            }`}
                          >
                            {product.stock > 0
                              ? `${product.stock}`
                              : "Out of stock"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {product.isApproved === true ? "Approved" : "Pending"}
                        </td>

                        {/* Actions - Only for Admin */}
                        {!isDealer && (
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  handleApprove(product._id || product.id)
                                }
                                className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDecline(product._id || product.id)
                                }
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                                title="Decline"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

      </div>
    </>
  );
}

export default ProductList;
