import { INVOICES_URL } from '../constants'
import { apiSlice } from './apiSlice'

export const invoicesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all invoices
    getInvoices: builder.query({
      query: () => INVOICES_URL,
      keepUnusedDataFor: 5,
      providesTags: ['Invoices'],
    }),

    // Fetch single invoice details
    getInvoiceDetails: builder.query({
      query: (id) => `${INVOICES_URL}/${id}`,
      keepUnusedDataFor: 5,
      providesTags: (result, error, id) => [{ type: 'Invoice', id }],
    }),

    // Fetch single invoice details
    getInvoicesByInvoiceId: builder.query({
      query: (invoiceId) => {
        // console.log('Fetching invoice ID from frontend:', invoiceId)
        return `${INVOICES_URL}/invoice/${invoiceId}`
      },
      keepUnusedDataFor: 5,
      providesTags: (result, error, id) => [{ type: 'Invoice', id }],
    }),

    // Fetch invoices by user ID
    getInvoicesByUserId: builder.query({
      query: (userId) => `${INVOICES_URL}/user/${userId}`,
      keepUnusedDataFor: 5,
      providesTags: (result, error, id) =>
        result
          ? [...result.map((invoice) => ({ type: 'Invoice', id: invoice.id }))]
          : [],
    }),

    // Create a new invoice
    createInvoice: builder.mutation({
      query: (data) => ({
        url: INVOICES_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Invoices'], // Refresh invoice list after creation
    }),

    // Update an existing invoice
    updateInvoice: builder.mutation({
      query: (data) => ({
        url: `${INVOICES_URL}/${data.InvoiceId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, data) => [
        'Invoices',
        { type: 'Invoice', id: data.InvoiceId },
      ],
    }),

    // Delete an invoice
    deleteInvoice: builder.mutation({
      query: (invoiceId) => ({
        url: `${INVOICES_URL}/${invoiceId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Invoices'], // Refresh invoice list after deletion
    }),

    // Delete an invoice
    deleteInvoiceByInvoiceId: builder.mutation({
      query: (invoiceId) => ({
        url: `${INVOICES_URL}/invoice_id/${invoiceId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Invoices'],
    }),
  }),
})

// Export hooks for usage in components
export const {
  useGetInvoicesQuery,
  useGetInvoiceDetailsQuery,
  useGetInvoicesByInvoiceIdQuery,
  useGetInvoicesByUserIdQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useDeleteInvoiceByInvoiceIdMutation,
} = invoicesApiSlice
