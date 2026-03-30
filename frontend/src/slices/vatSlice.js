import { VAT_URL } from "../constants";
import { apiSlice } from "./apiSlice";

export const vatSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getVats: builder.query({
      query: ({ keyword, pageNumber }) => ({
        url: VAT_URL,
        params: { keyword, pageNumber },
      }),
      keepUnusedDataFor: 5,
      providesTags: ["Vats"],
    }),
    getVatDetails: builder.query({
      query: (vatId) => ({
        url: `${VAT_URL}/${vatId}`,
      }),
      keepUnusedDataFor: 5,
    }),
    createVat: builder.mutation({
      query: (data) => ({
        url: `${VAT_URL}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Vat"],
    }),
    updateVat: builder.mutation({
      query: (data) => ({
        url: `${VAT_URL}/${data.vatId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Vats"],
    }),
    deleteVat: builder.mutation({
      query: (vatId) => ({
        url: `${VAT_URL}/${vatId}`,
        method: "DELETE",
      }),
      providesTags: ["vat"],
    }),
    uploadVatImage: builder.mutation({
      query: (data) => ({
        url: `/api/vatImages`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetVatsQuery,
  useGetVatDetailsQuery,
  useCreateVatMutation,
  useUpdateVatMutation,
  useDeleteVatMutation,
  useUploadVatImageMutation,
} = vatSlice;
