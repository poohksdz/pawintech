import { apiSlice } from "./apiSlice";

//  URL Hardcode (ต้องตรงกับ server.js)
const COPYPCBCARTS_URL = "/api/copycartpcbs";

export const copypcbCartApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ----------------------------------------------------------------
    //  Create & Read
    // ----------------------------------------------------------------

    createcopycart: builder.mutation({
      query: (orderData) => ({
        url: COPYPCBCARTS_URL,
        method: "POST",
        body: orderData,
      }),
    }),

    getAllcopycarts: builder.query({
      query: () => ({
        url: COPYPCBCARTS_URL,
      }),
      keepUnusedDataFor: 5,
      providesTags: ["CopyPCBCart"],
    }),

    getcopycartById: builder.query({
      query: (id) => ({
        url: `${COPYPCBCARTS_URL}/${id}`,
      }),
      keepUnusedDataFor: 5,
    }),

    getcopyCartByUserID: builder.query({
      query: (userID) => ({
        url: `${COPYPCBCARTS_URL}/user/${userID}`,
      }),
      keepUnusedDataFor: 5,
    }),

    // ----------------------------------------------------------------
    //  Updates
    // ----------------------------------------------------------------

    updatecopycart: builder.mutation({
      query: ({ id, updatedData }) => ({
        url: `${COPYPCBCARTS_URL}/${id}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: ["CopyPCBCart"],
    }),

    updateAmountcopycart: builder.mutation({
      query: ({ id }) => ({
        url: `${COPYPCBCARTS_URL}/amount/${id}`,
        method: "PUT",
      }),
    }),

    // ชื่อสะกด Comfirm ตามที่ใช้ในหน้าจอ Frontend เดิม
    updatecopycartComfirmStatus: builder.mutation({
      query: ({ id, updatedData }) => ({
        url: `${COPYPCBCARTS_URL}/status/${id}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: ["CopyPCBCart"],
    }),

    updatecopyShippingRates: builder.mutation({
      query: ({ orderId, rateData }) => ({
        url: `${COPYPCBCARTS_URL}/shippingrates/${orderId}`,
        method: "PUT",
        body: rateData,
      }),
      invalidatesTags: ["CopyPCBCart"],
    }),

    updatePaymentRates: builder.mutation({
      query: ({ orderId, paymentData }) => ({
        url: `${COPYPCBCARTS_URL}/paymentrates/${orderId}`,
        method: "PUT",
        body: paymentData,
      }),
      invalidatesTags: ["CopyPCBCart"],
    }),

    updateDeliveryCopyCart: builder.mutation({
      query: ({ pcborderId, transferedNumber }) => ({
        url: `${COPYPCBCARTS_URL}/delivered/${pcborderId}`,
        method: "PUT",
        body: { transferedNumber },
      }),
      invalidatesTags: ["CopyPCBCart"],
    }),

    updatePCBCopyManufacture: builder.mutation({
      query: ({ pcborderId, manufactureOrderNumber }) => ({
        url: `${COPYPCBCARTS_URL}/${pcborderId}/pcbmanufacture`,
        method: "PUT",
        body: { manufactureOrderNumber },
      }),
      invalidatesTags: ["CopyPCBCart"],
    }),

    // ----------------------------------------------------------------
    // ️ Delete
    // ----------------------------------------------------------------

    deletecopycart: builder.mutation({
      query: (id) => ({
        url: `${COPYPCBCARTS_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CopyPCBCart"],
    }),

    // ----------------------------------------------------------------
    //  Uploads
    // ----------------------------------------------------------------

    uploadMultipleCopyPCBImages: builder.mutation({
      query: (formData) => ({
        url: `${COPYPCBCARTS_URL}/upload/multipleimages`,
        method: "POST",
        body: formData,
      }),
    }),

    uploadcopypcbZip: builder.mutation({
      query: (formData) => ({
        url: `${COPYPCBCARTS_URL}/upload/upload-zip`,
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

export const {
  useCreatecopycartMutation,
  useGetAllcopycartsQuery,
  useGetcopycartByIdQuery,
  useGetcopyCartByUserIDQuery,
  useUpdatecopycartMutation,
  useUpdateAmountcopycartMutation,
  useUpdatecopycartComfirmStatusMutation,
  useUpdatecopyShippingRatesMutation,
  useUpdatePaymentRatesMutation,
  useUpdateDeliveryCopyCartMutation,
  useUpdatePCBCopyManufactureMutation,
  useDeletecopycartMutation,
  useUploadMultipleCopyPCBImagesMutation,
  useUploadcopypcbZipMutation,
} = copypcbCartApiSlice;
