import { apiSlice } from "./apiSlice";

export const notificationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: () => ({
        url: "/api/notifications",
      }),
      providesTags: ["Notification"],
    }),
    markAsRead: builder.mutation({
      query: ({ id, scope }) => ({
        url: `/api/notifications/${id}/read`,
        method: "PUT",
        body: { scope },
      }),
      invalidatesTags: ["Notification"],
    }),
    markAllAsRead: builder.mutation({
      query: () => ({
        url: "/api/notifications/read-all",
        method: "PUT",
      }),
      invalidatesTags: ["Notification"],
    }),
    sendTestNotification: builder.mutation({
      query: (data) => ({
        url: "/api/notifications/test",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Notification"],
    }),
    deleteNotification: builder.mutation({
      query: ({ id, scope }) => ({
        url: `/api/notifications/${id}`,
        method: "DELETE",
        body: { scope },
      }),
      invalidatesTags: ["Notification"],
    }),
    deleteAllNotifications: builder.mutation({
      query: () => ({
        url: "/api/notifications/delete-all",
        method: "DELETE",
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useSendTestNotificationMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
} = notificationApiSlice;
