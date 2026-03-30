import { apiSlice } from "./apiSlice";
import { ORDERASSEMBLYCARTS_URL } from "../constants";

export const assemblypcbCartApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Create a new Assembly PCB cart
    createAssemblycart: builder.mutation({
      query: (orderData) => ({
        url: ORDERASSEMBLYCARTS_URL,
        method: "POST",
        body: orderData,
      }),
    }),

    // Get all PCB Assembly carts
    getAllAssemblycarts: builder.query({
      query: () => ({
        url: ORDERASSEMBLYCARTS_URL,
      }),
      keepUnusedDataFor: 5,
    }),

    // Get all PCB Assembly carts of accepted
    getAllAssemblycartsAccepted: builder.query({
      query: () => ({
        url: ORDERASSEMBLYCARTS_URL,
      }),
      keepUnusedDataFor: 5,
    }),

    // Get cart by ID
    getAssemblycartById: builder.query({
      query: (id) => ({
        url: `${ORDERASSEMBLYCARTS_URL}/${id}`,
      }),
      keepUnusedDataFor: 5,
    }),

    // Get cart default
    getAssemblycartDefault: builder.query({
      query: (id) => ({
        url: `${ORDERASSEMBLYCARTS_URL}/default`,
      }),
      keepUnusedDataFor: 5,
    }),

    // Update cart defaultby ID
    updateAssemblycartDefaultById: builder.mutation({
      query: ({ id, updatedData }) => ({
        url: `${ORDERASSEMBLYCARTS_URL}/default/${id}`,
        method: "PUT",
        body: updatedData,
      }),
    }),

    // Get carts by user ID
    getAssemblyCartByUserID: builder.query({
      query: (userID) => ({
        url: `${ORDERASSEMBLYCARTS_URL}/user/${userID}`,
      }),
      keepUnusedDataFor: 5,
    }),

    // Update a Assembly cart
    updateAssemblycart: builder.mutation({
      query: ({ id, updatedData }) => ({
        url: `${ORDERASSEMBLYCARTS_URL}/${id}`,
        method: "PUT",
        body: updatedData,
      }),
    }),

    // Update cart amount
    updateAmountAssemblycart: builder.mutation({
      query: ({ id }) => ({
        url: `${ORDERASSEMBLYCARTS_URL}/amount/${id}`,
        method: "PUT",
      }),
    }),

    // Update confirm status and price
    updateAssemblycartComfirmStatus: builder.mutation({
      query: ({ id, updatedData }) => ({
        url: `${ORDERASSEMBLYCARTS_URL}/status/${id}`,
        method: "PUT",
        body: updatedData,
      }),
    }),

    // Update shipping rates
    updateAssemblyShippingRates: builder.mutation({
      query: ({ orderId, rateData }) => ({
        url: `${ORDERASSEMBLYCARTS_URL}/Assemblyshippingrates/${orderId}`,
        method: "PUT",
        body: rateData,
      }),
    }),

    // Update payment rates
    updatePaymentRates: builder.mutation({
      query: ({ orderId, paymentData }) => ({
        url: `${ORDERASSEMBLYCARTS_URL}/paymentrates/${orderId}`,
        method: "PUT",
        body: paymentData,
      }),
    }),

    // Update delivery transfer number
    updateDeliveryAssemblycart: builder.mutation({
      query: ({ pcborderId, transferedNumber }) => ({
        url: `${ORDERASSEMBLYCARTS_URL}/delivered/${pcborderId}`,
        method: "PUT",
        body: { transferedNumber },
      }),
    }),

    // Delete a Assembly cart
    deleteAssemblycart: builder.mutation({
      query: (id) => ({
        url: `${ORDERASSEMBLYCARTS_URL}/${id}`,
        method: "DELETE",
      }),
    }),

    // Get shipping rates (company-wide, for display)
    getShippingAssemblyRates: builder.query({
      query: () => ({
        url: `${ORDERASSEMBLYCARTS_URL}/getshippingrates`,
      }),
      keepUnusedDataFor: 5,
    }),

    uploadGerberAssemblyZip: builder.mutation({
      query: (formData) => ({
        url: `${ORDERASSEMBLYCARTS_URL}/upload/uploadgerber-zip`,
        method: "POST",
        body: formData,
      }),
    }),

    // Upload multiple image files
    uploadAssemblyMultipleImages: builder.mutation({
      query: (formData) => ({
        url: `${ORDERASSEMBLYCARTS_URL}/upload/multipleimages`,
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

export const {
  useCreateAssemblycartMutation,
  useGetAllAssemblycartsQuery,
  useGetAllAssemblycartsAcceptedQuery,
  useGetAssemblycartByIdQuery,
  useGetAssemblyCartByUserIDQuery,
  useUpdateAssemblycartMutation,
  useUpdateAmountAssemblycartMutation,
  useUpdateAssemblycartComfirmStatusMutation,
  useUpdateAssemblyShippingRatesMutation,
  useUpdateDeliveryAssemblycartMutation,
  useDeleteAssemblycartMutation,
  useGetShippingAssemblyRatesQuery,
  useUploadGerberAssemblyZipMutation,
  useUploadAssemblyMultipleImagesMutation,
  useUpdatePaymentRatesMutation,
  useGetAssemblycartDefaultQuery,
  useUpdateAssemblycartDefaultByIdMutation,
} = assemblypcbCartApiSlice;
