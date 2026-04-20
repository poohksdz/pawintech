// src/slices/copypcbApiSlice.js

import { apiSlice } from "./apiSlice";
import { COPYPCBS_URL } from "../constants";

export const copypcbApiSlice = apiSlice.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    createcopyPCB: builder.mutation({
      query: (orderData) => ({
        url: COPYPCBS_URL,
        method: "POST",
        body: orderData, // รับ object ตรง ๆ ไม่ต้องซ้อน
      }),
      invalidatesTags: ["CopyPCB"],
    }),

    createcopyPCBbyAdmin: builder.mutation({
      query: (orderData) => ({
        url: `${COPYPCBS_URL}/createcopypcbbyadmin`,
        method: "POST",
        body: orderData,
      }),
      invalidatesTags: ["CopyPCB"],
    }),

    getAllcopyPCBs: builder.query({
      query: () => ({
        url: COPYPCBS_URL,
      }),
      providesTags: ["CopyPCB"],
      keepUnusedDataFor: 5,
    }),

    getcopyPCBById: builder.query({
      query: (id) => ({
        url: `${COPYPCBS_URL}/${id}`,
      }),
      providesTags: ["CopyPCB"],
      keepUnusedDataFor: 5,
    }),

    getcopyPCBByOrderId: builder.query({
      query: (id) => ({
        url: `${COPYPCBS_URL}/order/${id}`,
      }),
      providesTags: ["CopyPCB"],
      keepUnusedDataFor: 5,
    }),

    updatecopyPCB: builder.mutation({
      query: ({ id, updatedData }) => ({
        url: `${COPYPCBS_URL}/${id}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: ["CopyPCB"],
    }),

    deletecopyPCB: builder.mutation({
      query: (id) => ({
        url: `${COPYPCBS_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CopyPCB"],
    }),

    updateShippingRates: builder.mutation({
      query: (rateData) => ({
        url: `${COPYPCBS_URL}/shippingrates`,
        method: "PUT",
        body: rateData,
      }),
    }),

    updateDeliverycopyPCB: builder.mutation({
      query: ({ pcborderId, transferedNumber }) => ({
        url: `${COPYPCBS_URL}/delivered/${pcborderId}`,
        method: "PUT",
        body: { transferedNumber },
      }),
      invalidatesTags: ["CopyPCB"],
    }),

    updatePCBManufacture: builder.mutation({
      query: ({ pcborderId, manufactureOrderNumber }) => ({
        url: `${COPYPCBS_URL}/${pcborderId}/pcbmanufacture`,
        method: "PUT",
        body: { manufactureOrderNumber },
      }),
      invalidatesTags: ["CopyPCB"],
    }),

    updatePaymentcopyPCB: builder.mutation({
      query: ({ id, status }) => ({
        url: `${COPYPCBS_URL}/paymentrates/${id}`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["CopyPCB"],
    }),

    getShippingRates: builder.query({
      query: () => ({
        url: `${COPYPCBS_URL}/getshippingrates`,
      }),
      keepUnusedDataFor: 5,
    }),

    getcopyPCBByOrderID: builder.query({
      query: (orderID) => ({
        url: `${COPYPCBS_URL}/byorderid/${orderID}`,
      }),
      providesTags: ["CopyPCB"],
      keepUnusedDataFor: 5,
    }),

    getcopyPCBByUserID: builder.query({
      query: (userId) => ({
        url: `${COPYPCBS_URL}/user/${userId}`,
      }),
      providesTags: ["CopyPCB"],
      keepUnusedDataFor: 5,
    }),

    uploadcopypcbZip: builder.mutation({
      query: (formData) => ({
        url: `${COPYPCBS_URL}/upload/upload-zip`,
        method: "POST",
        body: formData,
      }),
    }),

    uploadMultipleCopyPCBImages: builder.mutation({
      query: (formData) => ({
        url: `${COPYPCBS_URL}/upload/multiplecopypcbimages`,
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

export const {
  useCreatecopyPCBMutation,
  useGetAllcopyPCBsQuery,
  useGetcopyPCBByIdQuery,
  useGetcopyPCBByOrderIdQuery,
  useUpdatecopyPCBMutation,
  useDeletecopyPCBMutation,
  useUpdateShippingRatesMutation,
  useGetShippingRatesQuery,
  useUpdateDeliverycopyPCBMutation,
  useUpdatePCBManufactureMutation,
  useGetcopyPCBByOrderIDQuery,
  useGetcopyPCBByUserIDQuery,
  useUploadcopypcbZipMutation,
  useUploadMultipleCopyPCBImagesMutation,
  useCreatecopyPCBbyAdminMutation,
  useUpdatePaymentcopyPCBMutation,
} = copypcbApiSlice;
