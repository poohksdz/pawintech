import { DEFAULT_INVOICES_URL } from "../constants";
import { apiSlice } from "./apiSlice";

export const defaultInvoicesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDefaultInvoices: builder.query({
      query: ({ keyword, pageNumber }) => ({
        url: DEFAULT_INVOICES_URL,
        params: { keyword, pageNumber },
      }),
      keepUnusedDataFor: 5,
      providesTags: ["DefaultInvoices"],
    }),
    getDefaultInvoiceDetails: builder.query({
      query: (defaultInvoiceId) => ({
        url: `${DEFAULT_INVOICES_URL}/${defaultInvoiceId}`,
      }),
      keepUnusedDataFor: 5,
    }),
    getDefaultInvoiceUsed: builder.query({
      query: () => ({
        url: `${DEFAULT_INVOICES_URL}/used`,
      }),
      keepUnusedDataFor: 5,
    }),
    createDefaultInvoice: builder.mutation({
      query: (data) => ({
        url: `${DEFAULT_INVOICES_URL}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["defaultInvoice"],
    }),
    updateDefaultInvoice: builder.mutation({
      query: (data) => ({
        url: `${DEFAULT_INVOICES_URL}/${data.id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["DefaultInvoices"],
    }),
    updateUseingDefaultInvoice: builder.mutation({
      query: (data) => ({
        url: `${DEFAULT_INVOICES_URL}/${data.defaultInvoiceId}/use`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["DefaultInvoices"],
    }),
    deleteDefaultInvoice: builder.mutation({
      query: (defaultInvoiceId) => ({
        url: `${DEFAULT_INVOICES_URL}/${defaultInvoiceId}`,
        method: "DELETE",
      }),
      providesTags: ["defaultInvoice"],
    }),
    uploadDefaultInvoiceImage: builder.mutation({
      query: (data) => ({
        url: `/api/defaultInvoiceImages`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetDefaultInvoicesQuery,
  useGetDefaultInvoiceDetailsQuery,
  useGetDefaultInvoiceUsedQuery,
  useCreateDefaultInvoiceMutation,
  useUpdateDefaultInvoiceMutation,
  useUpdateUseingDefaultInvoiceMutation,
  useDeleteDefaultInvoiceMutation,
  useUploadDefaultInvoiceImageMutation,
} = defaultInvoicesApiSlice;
