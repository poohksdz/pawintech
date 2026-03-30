import { QUOTATION_URL } from "../constants";
import { apiSlice } from "./apiSlice";

export const quotationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all  quotations (with optional keyword & pagination)
    getQuotations: builder.query({
      query: ({ keyword, pageNumber } = {}) => ({
        url: QUOTATION_URL,
        params: { keyword, pageNumber },
      }),
      keepUnusedDataFor: 5,
      providesTags: ["Quotations"],
    }),

    // Fetch single  quotation details
    getQuotationDetails: builder.query({
      query: (quotationId) => `${QUOTATION_URL}/${quotationId}`,
      keepUnusedDataFor: 5,
      providesTags: ["Quotations"],
    }),

    // Fetch single  quotation no
    getQuotationByQuotationNo: builder.query({
      query: (quotation_no) => `${QUOTATION_URL}/quotation_no/${quotation_no}`,
      keepUnusedDataFor: 5,
      providesTags: ["Quotations"],
    }),

    // Fetch  quotations marked as "used"
    getQuotationUserId: builder.query({
      query: () => `${QUOTATION_URL}/user/:id`,
      keepUnusedDataFor: 5,
      providesTags: ["Quotations"],
    }),

    // Create new  quotation
    createQuotation: builder.mutation({
      query: (data) => ({
        url: QUOTATION_URL,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Quotations"],
    }),

    // Update existing  quotation
    updateQuotation: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${QUOTATION_URL}/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Quotations"],
    }),

    // Update "use" status of  quotation
    updateUseingQuotation: builder.mutation({
      query: ({ quotationId, ...data }) => ({
        url: `${QUOTATION_URL}/${quotationId}/use`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Quotations"],
    }),

    // Update quotation by quotation_no
    updateQuotationByQuotationNo: builder.mutation({
      query: ({ quotation_no, ...data }) => ({
        url: `${QUOTATION_URL}/quotation_no/${quotation_no}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Quotations"],
    }),

    // Update "use" status of  quotation
    updateUseingQuotationSet: builder.mutation({
      query: ({ quotationId, ...data }) => ({
        url: `${QUOTATION_URL}/set/${quotationId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Quotations"],
    }),

    // Delete a  quotation
    deleteQuotation: builder.mutation({
      query: (quotationId) => ({
        url: `${QUOTATION_URL}/${quotationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Quotations"],
    }),

    // Delete a  quotation
    deleteQuotationByQuotationNo: builder.mutation({
      query: (quotation_no) => ({
        url: `${QUOTATION_URL}/quotation_no/${quotation_no}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Quotations"],
    }),

    uploadQuotationImage: builder.mutation({
      query: (formData) => ({
        url: "/api/quotations/upload/upload-image",
        method: "POST",
        body: formData,
      }),
    }),

    uploadQuotationPDF: builder.mutation({
      query: (formData) => ({
        url: "/api/quotations/upload/upload-pdf",
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

export const {
  useGetQuotationsQuery,
  useGetQuotationDetailsQuery,
  useGetQuotationByQuotationNoQuery,
  useGetQuotationUserIdQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useUpdateQuotationByQuotationNoMutation,
  useUpdateUseingQuotationMutation,
  useUpdateUseingQuotationSetMutation,
  useDeleteQuotationMutation,
  useUploadQuotationImageMutation,
  useDeleteQuotationByQuotationNoMutation,
  useUploadQuotationPDFMutation,
} = quotationApiSlice;
