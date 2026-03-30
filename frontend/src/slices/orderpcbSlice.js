// src/slices/orderpcbSlice.js

import { apiSlice } from "./apiSlice";
import { ORDERPCBS_URL } from "../constants";

export const orderpcbApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOrderPCB: builder.mutation({
      query: (orderData) => ({
        url: ORDERPCBS_URL,
        method: "POST",
        body: orderData,
      }),
    }),
    createOrderPCBbyAdmin: builder.mutation({
      query: (orderData) => ({
        url: `${ORDERPCBS_URL}/createorderpcbbyadmin`,
        method: "POST",
        body: orderData,
      }),
    }),
    getAllOrderPCBs: builder.query({
      query: () => ({
        url: ORDERPCBS_URL,
      }),
      transformResponse: (response) => response.data || response.orders || [],
      keepUnusedDataFor: 5,
    }),
    getOrderPCBById: builder.query({
      query: (id) => ({
        url: `${ORDERPCBS_URL}/${id}`,
      }),
      transformResponse: (response) => response.data || response,
      keepUnusedDataFor: 5,
    }),
    updateOrderPCB: builder.mutation({
      query: ({ id, updatedData }) => ({
        url: `${ORDERPCBS_URL}/${id}`,
        method: "PUT",
        body: updatedData,
      }),
    }),
    deleteOrderPCB: builder.mutation({
      query: (id) => ({
        url: `${ORDERPCBS_URL}/${id}`,
        method: "DELETE",
      }),
    }),
    // updateOrderPCB: builder.mutation({
    //   query: ({ id, updatedShippingRateData }) => ({
    //     url: `${ORDERPCBS_URL}/shippingrates`,
    //     method: 'PUT',
    //     body: updatedShippingRateData,
    //   }),
    // }),

    // With this corrected and clearly named one:
    updateShippingRates: builder.mutation({
      query: (rateData) => ({
        url: `${ORDERPCBS_URL}/shippingrates`,
        method: "PUT",
        body: rateData,
      }),
    }),

    updateDeliveryPCBOrder: builder.mutation({
      query: ({ pcborderId, transferedNumber }) => ({
        url: `${ORDERPCBS_URL}/${pcborderId}/deliver`,
        method: "PUT",
        body: { transferedNumber },
      }),
    }),

    updatePCBManufactureing: builder.mutation({
      query: ({ pcborderId, manufactureOrderNumber }) => ({
        url: `${ORDERPCBS_URL}/${pcborderId}/verify-payment`,
        method: "PUT",
        body: { manufactureOrderNumber },
      }),
    }),

    getOwnShippingRates: builder.query({
      query: () => ({
        url: `${ORDERPCBS_URL}/getownshippingrates`,
      }),
      keepUnusedDataFor: 5,
    }),

    getOrderPCBByorderID: builder.query({
      query: (orderID) => ({
        url: `${ORDERPCBS_URL}/byorderid/${orderID}`,
      }),
      transformResponse: (response) => response.data || response,
      keepUnusedDataFor: 5,
    }),

    getOrderPCBByorderpaymentID: builder.query({
      query: (paymentComfirmID) => ({
        url: `${ORDERPCBS_URL}/byorderpayid/${paymentComfirmID}`,
      }),
      transformResponse: (response) =>
        response.data || response.orders || response,
      keepUnusedDataFor: 5,
    }),
  }),
});

export const {
  useCreateOrderPCBMutation,
  useGetAllOrderPCBsQuery,
  useGetOrderPCBByIdQuery,
  useUpdateOrderPCBMutation,
  useDeleteOrderPCBMutation,
  useUpdateShippingRatesMutation,
  useGetOwnShippingRatesQuery,
  useUpdateDeliveryPCBOrderMutation,
  useUpdatePCBManufactureingMutation,
  useGetOrderPCBByorderIDQuery,
  useGetOrderPCBByorderpaymentIDQuery,
  useCreateOrderPCBbyAdminMutation,
} = orderpcbApiSlice;
