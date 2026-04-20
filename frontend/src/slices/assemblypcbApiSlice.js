// src/slices/AssemblypcbSlice.js

import { apiSlice } from "./apiSlice";
import { ORDERASSEMBLYS_URL } from "../constants";

export const assemblypcbApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createAssemblyPCB: builder.mutation({
      query: (orderData) => ({
        url: ORDERASSEMBLYS_URL,
        method: "POST",
        body: orderData,
      }),
    }),
    createAssemblyPCBbyAdmin: builder.mutation({
      query: (orderData) => ({
        url: `${ORDERASSEMBLYS_URL}/createassemblypcbbyadmin`,
        method: "POST",
        body: orderData,
      }),
    }),
    getAllAssemblyPCBs: builder.query({
      query: () => ({
        url: ORDERASSEMBLYS_URL,
      }),
      keepUnusedDataFor: 5,
    }),
    getAssemblyPCBById: builder.query({
      query: (id) => ({
        url: `${ORDERASSEMBLYS_URL}/${id}`,
      }),
      keepUnusedDataFor: 5,
    }),
    updateAssemblyPCB: builder.mutation({
      query: ({ id, updatedData }) => ({
        url: `${ORDERASSEMBLYS_URL}/${id}`,
        method: "PUT",
        body: updatedData,
      }),
    }),
    deleteAssemblyPCB: builder.mutation({
      query: (id) => ({
        url: `${ORDERASSEMBLYS_URL}/${id}`,
        method: "DELETE",
      }),
    }),
    updateAssemblyShippingRates: builder.mutation({
      query: (rateData) => ({
        url: `${ORDERASSEMBLYS_URL}/shippingrates`,
        method: "PUT",
        body: rateData,
      }),
    }),
    updateDeliveryAssemblyPCB: builder.mutation({
      query: ({ pcborderId, transferedNumber }) => ({
        url: `${ORDERASSEMBLYS_URL}/delivery/${pcborderId}`,
        method: "PUT",
        body: { transferedNumber },
      }),
    }),
    getAssemblyShippingRates: builder.query({
      query: () => ({
        url: `${ORDERASSEMBLYS_URL}/getshippingrates`,
      }),
      keepUnusedDataFor: 5,
    }),
    getAssemblyPCBByOrderId: builder.query({
      query: (orderId) => ({
        url: `${ORDERASSEMBLYS_URL}/byorderid/${orderId}`,
      }),
      keepUnusedDataFor: 5,
    }),
    getAssemblyPCBByUserID: builder.query({
      query: (userId) => ({
        url: `${ORDERASSEMBLYS_URL}/user/${userId}`,
      }),
      keepUnusedDataFor: 5,
    }),

    uploadGerberAssemblyZip: builder.mutation({
      query: (formData) => ({
        url: `${ORDERASSEMBLYS_URL}/upload/uploadgerber-zip`,
        method: "POST",
        body: formData,
      }),
    }),

    // Upload multiple image files
    uploadAssemblyMultipleImages: builder.mutation({
      query: (formData) => ({
        url: `${ORDERASSEMBLYS_URL}/upload/multipleimages`,
        method: "POST",
        body: formData,
      }),
    }),

    updatePCBManufactureAssembly: builder.mutation({
      query: ({ pcborderId, manufactureOrderNumber }) => ({
        url: `${ORDERASSEMBLYS_URL}/${pcborderId}/pcbmanufacture`,
        method: "PUT",
        body: { manufactureOrderNumber },
      }),
      invalidatesTags: ["AssemblyPCB"],
    }),

    updatePaymentassemblyPCB: builder.mutation({
      query: ({ id, status }) => ({
        url: `${ORDERASSEMBLYS_URL}/paymentrates/${id}`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["AssemblyPCB"],
    }),
  }),
});

export const {
  useCreateAssemblyPCBMutation,
  useGetAllAssemblyPCBsQuery,
  useGetAssemblyPCBByIdQuery,
  useUpdateAssemblyPCBMutation,
  useDeleteAssemblyPCBMutation,
  useUpdateAssemblyShippingRatesMutation,
  useGetAssemblyShippingRatesQuery,
  useUpdateDeliveryAssemblyPCBMutation,
  useGetAssemblyPCBByOrderIdQuery,
  useGetAssemblyPCBByUserIDQuery,
  useCreateAssemblyPCBbyAdminMutation,
  useUploadGerberAssemblyZipMutation,
  useUploadAssemblyMultipleImagesMutation,
  useUpdatePCBManufactureAssemblyMutation,
  useUpdatePaymentassemblyPCBMutation,
} = assemblypcbApiSlice;
