import { apiSlice } from './apiSlice'
import { STOCK_SUBCATEGORIES_URL } from '../constants'

export const stockSubcategoryApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET all stock subcategories
    getStockSubcategories: builder.query({
      query: () => ({
        url: STOCK_SUBCATEGORIES_URL,
        method: 'GET',
      }),
      providesTags: ['StockSubcategory'],
    }),

    // GET subcategory by ID
    getStockSubcategoryDetails: builder.query({
      query: (id) => ({
        url: `${STOCK_SUBCATEGORIES_URL}/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'StockSubcategory', id }],
    }),

    // GET subcategories by category ID
    getStockSubcategoryByCategory: builder.query({
      query: (categoryId) => ({
        url: `${STOCK_SUBCATEGORIES_URL}/category/${categoryId}`,
        method: 'GET',
      }),
      providesTags: ['StockSubcategory'],
    }),

    // POST create new subcategory
    createStockSubcategory: builder.mutation({
      query: (data) => ({
        url: STOCK_SUBCATEGORIES_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['StockSubcategory'],
    }),

    // PUT update subcategory by ID
    updateStockSubcategory: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${STOCK_SUBCATEGORIES_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'StockSubcategory', id },
      ],
    }),

    // DELETE subcategory by ID
    deleteStockSubcategory: builder.mutation({
      query: (id) => ({
        url: `${STOCK_SUBCATEGORIES_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['StockSubcategory'],
    }),
  }),
})

export const {
  useGetStockSubcategoriesQuery,
  useGetStockSubcategoryDetailsQuery,
  useGetStockSubcategoryByCategoryQuery,
  useCreateStockSubcategoryMutation,
  useUpdateStockSubcategoryMutation,
  useDeleteStockSubcategoryMutation,
} = stockSubcategoryApiSlice
