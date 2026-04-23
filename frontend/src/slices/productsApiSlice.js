import { PRODUCTS_URL } from "../constants";
import { apiSlice } from "./apiSlice";

export const productsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: ({ keyword, pageNumber }) => ({
        url: PRODUCTS_URL,
        params: { keyword, pageNumber },
      }),
      //  แก้ไข: เพิ่มเวลาเก็บ Cache เป็น 300 วินาที (5 นาที)
      // เพื่อไม่ให้มันวิ่งไปหา Database ทุกครั้งที่เปลี่ยนหน้า
      keepUnusedDataFor: 300,
      providesTags: ["Products"],
    }),
    getProductDetails: builder.query({
      query: (productId) => ({
        url: `${PRODUCTS_URL}/${productId}`,
      }),
      // ลดเวลา Cache เพื่อให้ refetch ทำงานได้ดีขึ้น
      keepUnusedDataFor: 60,
      providesTags: (result, error, productId) => [
        { type: "Products", id: productId },
      ],
    }),
    createProduct: builder.mutation({
      query: (data) => ({
        url: `${PRODUCTS_URL}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Products"],
    }),
    updateProduct: builder.mutation({
      query: (data) => ({
        url: `${PRODUCTS_URL}/${data.productId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Products"],
    }),
    updateShowFrontProduct: builder.mutation({
      query: (data) => ({
        url: `${PRODUCTS_URL}/${data.productId}/showfront`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Products"],
    }),
    uploadProductImage: builder.mutation({
      query: (data) => ({
        url: `/api/images`,
        method: "POST",
        body: data,
      }),
    }),
    uploadProductMutipleImage: builder.mutation({
      query: (data) => ({
        url: `/api/multipleimages`,
        method: "POST",
        body: data,
      }),
    }),
    uploadProductDatasheet: builder.mutation({
      query: (data) => ({
        url: `/api/datasheets`,
        method: "POST",
        body: data,
      }),
    }),
    uploadProductManual: builder.mutation({
      query: (data) => ({
        url: `/api/manuals`,
        method: "POST",
        body: data,
      }),
    }),
    deleteProduct: builder.mutation({
      query: (productId) => ({
        url: `${PRODUCTS_URL}/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Products"],
    }),
    createReview: builder.mutation({
      query: (data) => ({
        url: `${PRODUCTS_URL}/${data.productId}/reviews`,
        method: "POST",
        body: data,
      }),
      // Invalidate the specific product's cache so it refetches
      invalidatesTags: (result, error, data) => [
        { type: "Products", id: data.productId },
      ],
    }),
    updateReview: builder.mutation({
      query: (data) => ({
        url: `${PRODUCTS_URL}/${data.productId}/reviews/${data.reviewId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, data) => [
        { type: "Products", id: data.productId },
      ],
    }),
    deleteReview: builder.mutation({
      query: (data) => ({
        url: `${PRODUCTS_URL}/${data.productId}/reviews/${data.reviewId}`,
        method: "DELETE",
        body: { reviewId: data.reviewId },
      }),
      invalidatesTags: (result, error, data) => [
        { type: "Products", id: data.productId },
      ],
    }),
    getTopProducts: builder.query({
      query: () => `${PRODUCTS_URL}/top`,
      //  แก้ไข: เพิ่มเวลา Cache
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductDetailsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUpdateShowFrontProductMutation,
  useUploadProductImageMutation,
  useUploadProductMutipleImageMutation,
  useUploadProductDatasheetMutation,
  useUploadProductManualMutation,
  useDeleteProductMutation,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useGetTopProductsQuery,
} = productsApiSlice;