import { FOLIOS_URL } from "../constants";
import { apiSlice } from "./apiSlice";

export const foliosApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFolios: builder.query({
      query: ({ keyword, pageNumber }) => ({
        url: FOLIOS_URL,
        params: { keyword, pageNumber },
      }),
      keepUnusedDataFor: 5,
      providesTags: ["FOlios"],
    }),
    getFolioDetails: builder.query({
      query: (folioId) => ({
        url: `${FOLIOS_URL}/${folioId}`,
      }),
      keepUnusedDataFor: 5,
    }),
    createFolio: builder.mutation({
      query: (data) => ({
        url: `${FOLIOS_URL}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Folio"],
    }),
    updateFolio: builder.mutation({
      query: (data) => ({
        url: `${FOLIOS_URL}/${data.folioId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Folios"],
    }),
    updateShowFrontFolio: builder.mutation({
      query: (data) => ({
        url: `${FOLIOS_URL}/${data.folioId}/showfront`,
        method: "PUT",
        body: data, // Sending { folioId, showfront }
      }),
      invalidatesTags: ["Folios"],
    }),
    deleteFolio: builder.mutation({
      query: (folioId) => ({
        url: `${FOLIOS_URL}/${folioId}`,
        method: "DELETE",
      }),
      providesTags: ["Folio"],
    }),
    uploadFolioImage: builder.mutation({
      query: (data) => ({
        url: `/api/folioImages`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetFoliosQuery,
  useGetFolioDetailsQuery,
  useCreateFolioMutation,
  useUpdateFolioMutation,
  useUpdateShowFrontFolioMutation,
  useDeleteFolioMutation,
  useUploadFolioImageMutation,
} = foliosApiSlice;
