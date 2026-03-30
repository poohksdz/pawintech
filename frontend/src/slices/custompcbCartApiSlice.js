import { apiSlice } from "./apiSlice";

//  Base URL สำหรับ Cart (ต้องมีคำว่า customcartpcbs)
const CUSTOMPCBCARTS_URL = "/api/customcartpcbs";

//  Base URL สำหรับสร้าง Order (แยกกัน)
const CUSTOMPCB_ORDERS_URL = "/api/custompcbs";

export const custompcbCartApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ----------------------------------------------------------------
    //  Create & Read
    // ----------------------------------------------------------------

    // 1. สร้างตะกร้า (Cart)
    createCustomcart: builder.mutation({
      query: (orderData) => ({
        url: CUSTOMPCBCARTS_URL,
        method: "POST",
        body: orderData,
      }),
      invalidatesTags: ["CustomPCBCart"],
    }),

    // 2. สร้างออเดอร์ (Convert Cart -> Order)
    createCustomOrder: builder.mutation({
      query: (orderData) => ({
        url: CUSTOMPCB_ORDERS_URL, // ยิงไปที่ Controller สร้างออเดอร์
        method: "POST",
        body: orderData,
      }),
    }),

    getAllCustomcarts: builder.query({
      query: () => ({
        url: CUSTOMPCBCARTS_URL,
      }),
      keepUnusedDataFor: 5,
      providesTags: ["CustomPCBCart"],
    }),

    getAllCustomcartsAccepted: builder.query({
      query: () => ({
        url: `${CUSTOMPCBCARTS_URL}/accepted`,
      }),
      keepUnusedDataFor: 5,
    }),

    //  ฟังก์ชันพระเอกของเรา (ดึงข้อมูลตะกร้าตาม ID)
    getCustomcartById: builder.query({
      query: (id) => ({
        url: `${CUSTOMPCBCARTS_URL}/${id}`, // ผลลัพธ์: /api/customcartpcbs/35
      }),
      keepUnusedDataFor: 5,
    }),

    getCustomCartByUserID: builder.query({
      query: (userID) => ({
        url: `${CUSTOMPCBCARTS_URL}/user/${userID}`,
      }),
      keepUnusedDataFor: 5,
    }),

    // ----------------------------------------------------------------
    //  Updates
    // ----------------------------------------------------------------

    //  แก้ไข: เปลี่ยน updatedData -> data ให้ตรงกับหน้าบ้าน
    updateCustomcart: builder.mutation({
      query: ({ id, data }) => ({
        url: `${CUSTOMPCBCARTS_URL}/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["CustomPCBCart"],
    }),

    updateAmountCustomcart: builder.mutation({
      query: ({ id }) => ({
        url: `${CUSTOMPCBCARTS_URL}/amount/${id}`,
        method: "PUT",
      }),
    }),

    //  แก้ไขจุดสำคัญ: เปลี่ยน updatedData -> data
    // เพื่อให้รับค่า { id: ..., data: { status: ... } } จากหน้าบ้านได้ถูกต้อง
    updateCustomcartComfirmStatus: builder.mutation({
      query: ({ id, data }) => ({
        url: `${CUSTOMPCBCARTS_URL}/status/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["CustomPCBCart"],
    }),

    updateCustomShippingRates: builder.mutation({
      query: ({ orderId, rateData }) => ({
        url: `${CUSTOMPCBCARTS_URL}/customshippingrates/${orderId}`,
        method: "PUT",
        body: rateData,
      }),
      invalidatesTags: ["CustomPCBCart"],
    }),

    updatePaymentRates: builder.mutation({
      query: ({ orderId, paymentData }) => ({
        url: `${CUSTOMPCBCARTS_URL}/paymentrates/${orderId}`,
        method: "PUT",
        body: paymentData,
      }),
      invalidatesTags: ["CustomPCBCart"],
    }),

    updateDeliveryCustomcart: builder.mutation({
      query: ({ pcborderId, transferedNumber }) => ({
        url: `${CUSTOMPCBCARTS_URL}/delivered/${pcborderId}`,
        method: "PUT",
        body: { transferedNumber },
      }),
      invalidatesTags: ["CustomPCBCart"],
    }),

    updatePCBManufacture: builder.mutation({
      query: ({ pcborderId, manufactureOrderNumber }) => ({
        url: `${CUSTOMPCBCARTS_URL}/${pcborderId}/pcbmanufacture`,
        method: "PUT",
        body: { manufactureOrderNumber },
      }),
      invalidatesTags: ["CustomPCBCart"],
    }),

    // ----------------------------------------------------------------
    // ️ Delete & Utils
    // ----------------------------------------------------------------

    deleteCustomcart: builder.mutation({
      query: (id) => ({
        url: `${CUSTOMPCBCARTS_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CustomPCBCart"],
    }),

    getShippingRates: builder.query({
      query: () => ({
        url: `${CUSTOMPCBCARTS_URL}/getshippingrates`,
      }),
      keepUnusedDataFor: 5,
    }),

    // ----------------------------------------------------------------
    //  Uploads
    // ----------------------------------------------------------------

    uploadCustomCartDiagramZip: builder.mutation({
      query: (formData) => ({
        url: `${CUSTOMPCBCARTS_URL}/upload/upload-zip`,
        method: "POST",
        body: formData,
      }),
    }),

    uploadCustomCartMultipleImages: builder.mutation({
      query: (formData) => ({
        url: `${CUSTOMPCBCARTS_URL}/upload/multipleimages`,
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

export const {
  useCreateCustomcartMutation,
  useCreateCustomOrderMutation,
  useGetAllCustomcartsQuery,
  useGetAllCustomcartsAcceptedQuery,
  useGetCustomcartByIdQuery,
  useGetCustomCartByUserIDQuery,
  useUpdateCustomcartMutation,
  useUpdateAmountCustomcartMutation,
  useUpdateCustomcartComfirmStatusMutation,
  useUpdateCustomShippingRatesMutation,
  useUpdateDeliveryCustomcartMutation,
  useUpdatePCBManufactureMutation,
  useDeleteCustomcartMutation,
  useGetShippingRatesQuery,
  useUploadCustomCartDiagramZipMutation,
  useUploadCustomCartMultipleImagesMutation,
  useUpdatePaymentRatesMutation,
} = custompcbCartApiSlice;
