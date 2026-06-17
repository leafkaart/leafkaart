import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const dealerDashboardApi = createApi({
  reducerPath: "dealerDashboardApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_BACKEND_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState()?.auth?.token || localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["DealerDashboard"],
  endpoints: (builder) => ({
    getDealerDashboard: builder.query({
      query: () => "/dealer/dashboard/overview",
      providesTags: ["DealerDashboard"],
    }),
  }),
});

export const { useGetDealerDashboardQuery } = dealerDashboardApi;
