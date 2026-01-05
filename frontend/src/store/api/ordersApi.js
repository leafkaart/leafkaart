// store/api/ordersApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/orders`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.token || localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Orders'],
  endpoints: (builder) => ({
    // Get all orders
    getOrders: builder.query({
      query: () => '/listOrders',
      providesTags: ['Orders'],
      transformResponse: (response) => response.orders || [],
    }),

    // Get single order
    getOrder: builder.query({
      query: (id) => `/getOrder/${id}`,
      providesTags: (result, error, id) => [{ type: 'Orders', id }],
      transformResponse: (response) => response.order,
    }),

    // Create order
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: '/createOrder',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['Orders'],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
} = ordersApi;