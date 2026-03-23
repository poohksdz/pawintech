import { apiSlice } from './apiSlice';
import { STOCK_PRODUCT_URL } from '../constants'; // ตรวจสอบ path นี้ให้ถูกต้องตามโปรเจค

export const stockProductApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET all stock products
    getStockProducts: builder.query({
      query: () => ({
        url: STOCK_PRODUCT_URL,
        method: 'GET',
      }),
      providesTags: ['StockProduct'],
    }),

    // GET single product by ID
    getStockProductById: builder.query({
      query: (id) => ({
        url: `${STOCK_PRODUCT_URL}/${id}`,
        method: 'GET',
      }),
      providesTags: ['StockProduct'],
    }),

    // POST create new stock product
    createStockProduct: builder.mutation({
      query: (data) => ({
        url: STOCK_PRODUCT_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['StockProduct'],
    }),

    // PUT update stock product
    updateStockProduct: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${STOCK_PRODUCT_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['StockProduct'],
    }),

    // DELETE stock product
    deleteStockProduct: builder.mutation({
      query: (id) => ({
        url: `${STOCK_PRODUCT_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['StockProduct'],
    }),

    // PUT update quantity by ID
    updateStockProductQty: builder.mutation({
      query: ({ id, qty }) => ({
        url: `${STOCK_PRODUCT_URL}/updateQty/${id}`,
        method: 'PUT',
        body: { qty },
      }),
      invalidatesTags: ['StockProduct'],
    }),

    // PUT update quantity by Electotronix PN
    updateStockProductQtyByElectotronixPN: builder.mutation({
      query: ({ electotronixPN, qty }) => ({
        url: `${STOCK_PRODUCT_URL}/updateProductQtyByElectotronixPN/${electotronixPN}`,
        method: 'PUT',
        body: { qty },
      }),
      invalidatesTags: ['StockProduct'],
    }),

    uploadStockProductImage: builder.mutation({
      query: (data) => ({
        url: `/api/componentImages`,
        method: 'POST',
        body: data,
      }),
    }),

    uploadStockProductMutipleImage: builder.mutation({
      query: (data) => ({
        url: `/api/multipleimages`,
        method: 'POST',
        body: data,
      }),
    }),

    // --- ส่วนที่เพิ่มใหม่ (Stock Addition) ---
    // ตรวจสอบ URL Backend ว่าใช้ path อะไร เช่น '/stockaddition' หรือ '/add-stock'
    createStockAddition: builder.mutation({
      query: (data) => ({
        url: `${STOCK_PRODUCT_URL}/stockaddition`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['StockProduct'],
    }),

    toggleStarProduct: builder.mutation({
      query: ({ productId, rating }) => ({
        url: `${STOCK_PRODUCT_URL}/${productId}/star`,
        method: 'PUT',
        body: { rating },
      }),
      invalidatesTags: ['StockProduct'],
    }),

    // -------------------------------------

  }),
});

export const {
  useGetStockProductsQuery,
  useGetStockProductByIdQuery,
  useCreateStockProductMutation,
  useUpdateStockProductMutation,
  useDeleteStockProductMutation,
  useUpdateStockProductQtyMutation,
  useUpdateStockProductQtyByElectotronixPNMutation,
  useUploadStockProductImageMutation,
  useUploadStockProductMutipleImageMutation,

  // --- Export Hook ใหม่ ---
  useCreateStockAdditionMutation,
  useToggleStarProductMutation,
} = stockProductApiSlice;