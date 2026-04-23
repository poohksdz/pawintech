import { apiSlice } from "./apiSlice";

const NOTIFICATION_URL = "/api/notifications";

export const notificationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: () => ({
        url: NOTIFICATION_URL,
        method: "GET",
      }),
    }),
    createNotification: builder.mutation({
      query: (notificationData) => ({
        url: `${NOTIFICATION_URL}/create`,
        method: "POST",
        body: notificationData,
      }),
    }),
    markAsRead: builder.mutation({
      query: ({ id, scope }) => ({
        url: `${NOTIFICATION_URL}/${id}/read`,
        method: "PUT",
        body: { scope },
      }),
    }),
    markAllAsRead: builder.mutation({
      query: () => ({
        url: `${NOTIFICATION_URL}/read-all`,
        method: "PUT",
      }),
    }),
    deleteNotification: builder.mutation({
      query: ({ id, scope }) => ({
        url: `${NOTIFICATION_URL}/${id}?scope=${scope || "personal"}`,
        method: "DELETE",
      }),
    }),
    deleteAllNotifications: builder.mutation({
      query: () => ({
        url: `${NOTIFICATION_URL}/delete-all`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useCreateNotificationMutation,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
} = notificationApiSlice;
