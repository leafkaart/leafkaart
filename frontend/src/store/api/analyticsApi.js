import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const analyticsApi = createApi({
  reducerPath: "analyticsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_BACKEND_URL || "http://localhost:1200/api/admin/dashboard",
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Analytics", "SalesReport", "ProductReport"],

  endpoints: (builder) => ({
    // Get dashboard overview
    getOverview: builder.query({
      query: () => "/api/admin/dashboard/overview",
      providesTags: ["Analytics"],
    }),

    // Get sales report with filters
    getSalesReport: builder.query({
      query: ({ from, to, groupBy = "day" } = {}) => {
        const params = new URLSearchParams();
        if (from) params.append("from", from);
        if (to) params.append("to", to);
        params.append("groupBy", groupBy);
        return `/api/admin/dashboard/salesReport?${params.toString()}`;
      },
      providesTags: ["SalesReport"],
    }),

    // Get product report
    getProductReport: builder.query({
      query: (productId) => `/api/admin/dashboard/productReport/${productId}`,
      providesTags: (result, error, productId) => [
        { type: "ProductReport", id: productId },
      ],
    }),
  }),
});

export const {
  useGetOverviewQuery,
  useGetSalesReportQuery,
  useGetProductReportQuery,
} = analyticsApi;