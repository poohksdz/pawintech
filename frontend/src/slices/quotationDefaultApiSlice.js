import { DEFAULT_QUOTATION_URL } from "../constants";
import { apiSlice } from "./apiSlice";

export const quotationDefaultApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all default quotations (with optional keyword & pagination)
    getDefaultQuotations: builder.query({
      query: ({ keyword, pageNumber } = {}) => ({
        url: DEFAULT_QUOTATION_URL,
        params: { keyword, pageNumber },
      }),
      keepUnusedDataFor: 5,
      providesTags: ["DefaultQuotations"],
    }),

    // Fetch single default quotation details
    getDefaultQuotationDetails: builder.query({
      query: (defaultQuotationId) =>
        `${DEFAULT_QUOTATION_URL}/${defaultQuotationId}`,
      keepUnusedDataFor: 5,
      providesTags: ["DefaultQuotations"],
    }),

    // Fetch default quotations marked as "used"
    getDefaultQuotationUsed: builder.query({
      query: () => `${DEFAULT_QUOTATION_URL}/isuse`,
      keepUnusedDataFor: 5,
      providesTags: ["DefaultQuotations"],
    }),

    // Create new default quotation
    createDefaultQuotation: builder.mutation({
      query: (data) => ({
        url: DEFAULT_QUOTATION_URL,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["DefaultQuotations"],
    }),

    // Update existing default quotation
    updateDefaultQuotation: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${DEFAULT_QUOTATION_URL}/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["DefaultQuotations"],
    }),

    // Update "use" status of default quotation
    updateUseingDefaultQuotation: builder.mutation({
      query: ({ defaultQuotationId, ...data }) => ({
        url: `${DEFAULT_QUOTATION_URL}/${defaultQuotationId}/use`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["DefaultQuotations"],
    }),

    // Update "use" status of default quotation
    updateUseingDefaultQuotationSet: builder.mutation({
      query: ({ defaultQuotationId, ...data }) => ({
        url: `${DEFAULT_QUOTATION_URL}/set/${defaultQuotationId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["DefaultQuotations"],
    }),

    // Delete a default quotation
    deleteDefaultQuotation: builder.mutation({
      query: (defaultQuotationId) => ({
        url: `${DEFAULT_QUOTATION_URL}/${defaultQuotationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["DefaultQuotations"],
    }),

    uploadDefaultQuotationImage: builder.mutation({
      query: (formData) => ({
        url: "/api/defaultquotations/upload",
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

export const {
  useGetDefaultQuotationsQuery,
  useGetDefaultQuotationDetailsQuery,
  useGetDefaultQuotationUsedQuery,
  useCreateDefaultQuotationMutation,
  useUpdateDefaultQuotationMutation,
  useUpdateUseingDefaultQuotationMutation,
  useUpdateUseingDefaultQuotationSetMutation,
  useDeleteDefaultQuotationMutation,
  useUploadDefaultQuotationImageMutation,
} = quotationDefaultApiSlice;
