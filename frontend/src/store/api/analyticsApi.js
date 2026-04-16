import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const analyticsApi = createApi({
  reducerPath: "analyticsApi",

  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:1200/api/admin",
    prepareHeaders: (headers, { getState }) => {
      const token = getState()?.auth?.token;
      console.log("TOKEN:", token);
      return headers;
    },
  }),

  tagTypes: ["Dashboard"],

  endpoints: (builder) => ({
    getDashboard: builder.query({
      query: ({ from, to, groupBy } = {}) => {
        const params = new URLSearchParams();
      
        if (from) params.append("from", from);
        if (to) params.append("to", to);
        if (groupBy) params.append("groupBy", groupBy);
      
        return {
          url: "/dashboard/completeDashboard",
          params,
        };
      },

      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetDashboardQuery } = analyticsApi;