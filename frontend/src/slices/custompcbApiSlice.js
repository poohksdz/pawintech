// src/slices/custompcbSlice.js

import { apiSlice } from './apiSlice'
import { CUSTOMPCBS_URL } from '../constants'

export const custompcbApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createCustomPCB: builder.mutation({
      query: (orderData) => ({
        url: CUSTOMPCBS_URL,
        method: 'POST',
        body: orderData,
      }),
    }),
    createCustomPCBbyAdmin: builder.mutation({
      query: (orderData) => ({
        url: `${CUSTOMPCBS_URL}/createcustompcbbyadmin`,
        method: 'POST',
        body: orderData,
      }),
    }),
    getAllCustomPCBs: builder.query({
      query: () => ({
        url: CUSTOMPCBS_URL,
      }),
      keepUnusedDataFor: 5,
    }),
    getCustomPCBById: builder.query({
      query: (id) => ({
        url: `${CUSTOMPCBS_URL}/${id}`,
      }),
      keepUnusedDataFor: 5,
    }),
    getCustomPCBByOrderId: builder.query({
      query: (orderID) => ({
        url: `${CUSTOMPCBS_URL}/byorderid/${orderID}`,
      }),
      keepUnusedDataFor: 5,
    }),
    updateCustomPCB: builder.mutation({
      query: ({ id, updatedData }) => ({
        url: `${CUSTOMPCBS_URL}/${id}`,
        method: 'PUT',
        body: updatedData,
      }),
    }),
    deleteCustomPCB: builder.mutation({
      query: (id) => ({
        url: `${CUSTOMPCBS_URL}/${id}`,
        method: 'DELETE',
      }),
    }),
    updateShippingRates: builder.mutation({
      query: (rateData) => ({
        url: `${CUSTOMPCBS_URL}/shippingrates`,
        method: 'PUT',
        body: rateData,
      }),
    }),
    updateDeliveryCustomPCB: builder.mutation({
      query: ({ pcborderId, transferedNumber }) => ({
        url: `${CUSTOMPCBS_URL}/delivered/${pcborderId}`,
        method: 'PUT',
        body: { transferedNumber },
      }),
    }),
    updatePCBManufacture: builder.mutation({
      query: ({ pcborderId, manufactureOrderNumber }) => ({
        url: `${CUSTOMPCBS_URL}/${pcborderId}/pcbmaunufacture`,
        method: 'PUT',
        body: { manufactureOrderNumber },
      }),
    }),
    getShippingRates: builder.query({
      query: () => ({
        url: `${CUSTOMPCBS_URL}/getshippingrates`,
      }),
      keepUnusedDataFor: 5,
    }),
    getCustomPCBByOrderID: builder.query({
      query: (orderID) => ({
        url: `${CUSTOMPCBS_URL}/byorderid/${orderID}`,
      }),
      keepUnusedDataFor: 5,
    }),
    getCustomPCBByUserID: builder.query({
      query: (userId) => ({
        url: `${CUSTOMPCBS_URL}/user/${userId}`,
      }),
      keepUnusedDataFor: 5,
    }),

    // Upload diagram .zip file
    uploadDiagramZip: builder.mutation({
      query: (formData) => ({
        url: `${CUSTOMPCBS_URL}/upload/upload-zip`,
        method: 'POST',
        body: formData,
      }),
    }),

    // Upload multiple image files
    uploadMultipleImages: builder.mutation({
      query: (formData) => ({
        url: `${CUSTOMPCBS_URL}/upload/multipleimages`,
        method: 'POST',
        body: formData,
      }),
    }),
  }),
})

export const {
  useCreateCustomPCBMutation,
  useGetAllCustomPCBsQuery,
  useGetCustomPCBByIdQuery,
  useGetCustomPCBByOrderIdQuery,
  useUpdateCustomPCBMutation,
  useDeleteCustomPCBMutation,
  useUpdateShippingRatesMutation,
  useGetShippingRatesQuery,
  useUpdateDeliveryCustomPCBMutation,
  useUpdatePCBManufactureMutation,
  useGetCustomPCBByOrderIDQuery,
  useGetCustomPCBByUserIDQuery,
  useUploadDiagramZipMutation,
  useUploadMultipleImagesMutation,
  useCreateCustomPCBbyAdminMutation,
} = custompcbApiSlice
