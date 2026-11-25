import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const notificationApi = createApi({
  reducerPath: "notificationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/notification`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Notifications"],
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: () => "/listNotifications?unread=true",
      providesTags: (_result, _error, userId) => [{ type: "Notifications", id: userId }],
    }),
    markNotificationAsRead: builder.mutation({
      query: ({ notificationId }) => ({
        url: `/readNotification/${notificationId}`,
        method: "PATCH",
        body: { notificationId },
      }),
      async onQueryStarted({ notificationId, userId }, { dispatch, queryFulfilled }) {
        dispatch(notificationApi.util.updateQueryData("getNotifications", userId, (draft) => {
          draft.notifications = draft.notifications.filter((item) => item._id !== notificationId);
        }));
        try {
          await queryFulfilled;
        } catch {
          // Reload the persisted state, including any successful reads from other tabs.
          dispatch(notificationApi.util.invalidateTags([{ type: "Notifications", id: userId }]));
        }
      },
    }),
  }),
});

export const { useGetNotificationsQuery, useMarkNotificationAsReadMutation } =  notificationApi;
