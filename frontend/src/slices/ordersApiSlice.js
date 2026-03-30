import { apiSlice } from "./apiSlice";
import { ORDERS_URL } from "../constants";

export const orderApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation({
      query: (order) => ({
        url: ORDERS_URL,
        method: "POST",
        body: order,
      }),
    }),
    getAllUnifiedOrders: builder.query({
      query: () => ({ url: `${ORDERS_URL}/all-types` }),
      keepUnusedDataFor: 5,
    }),
    getOrderDetails: builder.query({
      query: (id) => ({
        url: `${ORDERS_URL}/${id}`,
      }),
      keepUnusedDataFor: 5,
    }),
    updateOrderToReceivePlace: builder.mutation({
      query: ({ orderId, details }) => ({
        url: `${ORDERS_URL}/${orderId}/receiveplace`,
        method: "PUT",
        body: details,
      }),
    }),

    //  จุดที่แก้ไข (FIXED) 
    // เปลี่ยนให้รับค่าเป็น Object { orderId, details } ให้ตรงกับที่ Modal ส่งมา
    payOrder: builder.mutation({
      query: ({ orderId, details }) => ({
        url: `${ORDERS_URL}/${orderId}/pay`,
        method: "PUT",
        body: details, // ตอนนี้ส่ง body ได้แล้ว
      }),
    }),
    // ------------------------------------

    transferPayOrder: builder.mutation({
      query: ({ orderId, details }) => ({
        url: `${ORDERS_URL}/${orderId}/pay`,
        method: "PUT",
        body: details,
      }),
    }),
    getMyOrders: builder.query({
      query: () => ({
        url: `${ORDERS_URL}/mine`,
      }),
      keepUnusedDataFor: 5,
    }),
    getOrders: builder.query({
      query: () => ({
        url: ORDERS_URL,
      }),
      keepUnusedDataFor: 5,
    }),
    deliverOrder: builder.mutation({
      query: ({ orderId, transferedNumber }) => ({
        url: `${ORDERS_URL}/${orderId}/deliver`,
        method: "PUT",
        body: { transferedNumber },
      }),
    }),
    getTransportationPrice: builder.query({
      query: () => ({
        url: `${ORDERS_URL}/1/gettransportationprice`,
      }),
      keepUnusedDataFor: 5,
    }),
    updateTransportationPrice: builder.mutation({
      query: ({ transportationPriceId, transportationPrice }) => ({
        url: `${ORDERS_URL}/${transportationPriceId}/updatetransportationprice`,
        method: "PUT",
        body: { transportationPrice },
      }),
    }),
    uploadPaymentSlipImage: builder.mutation({
      query: (data) => ({
        url: `/api/paymentSlipImages`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useGetAllUnifiedOrdersQuery,
  useGetOrderDetailsQuery,
  useUpdateOrderToReceivePlaceMutation,
  usePayOrderMutation,
  useTransferPayOrderMutation,
  useGetMyOrdersQuery,
  useGetOrdersQuery,
  useDeliverOrderMutation,
  useUploadPaymentSlipImageMutation,
  useGetTransportationPriceQuery,
  useUpdateTransportationPriceMutation,
} = orderApiSlice;
