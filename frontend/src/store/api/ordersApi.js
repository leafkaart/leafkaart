// store/api/ordersApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const ordersApi = createApi({
  reducerPath: "ordersApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.token || localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Orders"],
  endpoints: (builder) => ({
    // Get all orders
    getOrders: builder.query({
      query: () => "/admin/orders/listOrders",
      providesTags: ["Orders"],
      transformResponse: (response) => response.data.orders || [],
    }),

    // Get single order
    getOrder: builder.query({
      query: (id) => `/admin/orders/getOrder/${id}`,
      providesTags: (result, error, id) => [{ type: "Orders", id }],
      transformResponse: (response) => response.data,
    }),

    // Create order
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: "/createOrder",
        method: "POST",
        body: orderData,
      }),
      invalidatesTags: ["Orders"],
    }),

    updateOrderStatus: builder.mutation({
      query: ({ orderId, status }) => ({
        url: `admin/orders/updateOrderStatus/${orderId}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Order"],
    }),
    updatePaymentStatus: builder.mutation({
      query: ({ orderId, paymentStatus }) => ({
        url: `admin/orders/updatePaymentStatus/${orderId}`,
        method: "PATCH",
        body: { paymentStatus },
      }),
      invalidatesTags: ["Order"],
    }),
    getDealersByPincode: builder.query({
      query: (pinCode) => `/admin/products/dealers-by-pincode/${pinCode}`,
      transformResponse: (response) => response,
    }),

    // Assign dealer to order
    assignDealerToOrder: builder.mutation({
      query: ({ orderId, dealerId, notes }) => ({
        url: `/admin/orders/assignOrderToDealer/${orderId}`,
        method: "POST",
        body: { dealerId, notes },
      }),
      invalidatesTags: ["Orders"],
    }),
    unassignOrderToDealer: builder.mutation({
      query: (orderId) => ({
        url: `/admin/orders/unassignOrderToDealer/${orderId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Orders"],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useAssignDealerToOrderMutation,
  useGetDealersByPincodeQuery,
  useUnassignOrderToDealerMutation,
  useUpdateOrderStatusMutation,
  useUpdatePaymentStatusMutation,
} = ordersApi;
