import { apiSlice } from './apiSlice'
import { STOCK_SUPPLIERS_URL } from '../constants'

export const stockSupplierApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET all suppliers
    getStockSuppliers: builder.query({
      query: () => ({
        url: STOCK_SUPPLIERS_URL,
        method: 'GET',
      }),
      providesTags: ['StockSupplier'],
    }),

    // GET single supplier by ID
    getStockSupplierDetails: builder.query({
      query: (id) => ({
        url: `${STOCK_SUPPLIERS_URL}/${id}`,
        method: 'GET',
      }),
      providesTags: ['StockSupplier'],
    }),

    // POST create supplier
    createStockSupplier: builder.mutation({
      query: (newSupplier) => ({
        url: STOCK_SUPPLIERS_URL,
        method: 'POST',
        body: newSupplier,
      }),
      invalidatesTags: ['StockSupplier'],
    }),

    updateStockSupplier: builder.mutation({
      query: ({ id, ...data }) => ({
        // <-- use ...data, not ..data
        url: `${STOCK_SUPPLIERS_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['StockSupplier'],
    }),

    // DELETE supplier by ID
    deleteStockSupplier: builder.mutation({
      query: (id) => ({
        url: `${STOCK_SUPPLIERS_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['StockSupplier'],
    }),
  }),
})

export const {
  useGetStockSuppliersQuery,
  useGetStockSupplierDetailsQuery,
  useCreateStockSupplierMutation,
  useUpdateStockSupplierMutation,
  useDeleteStockSupplierMutation,
} = stockSupplierApiSlice
