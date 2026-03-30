import { ABOUTIMAGES_URL } from "../constants";
import { apiSlice } from "./apiSlice";

export const aboutImageApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAboutimages: builder.query({
      query: ({ keyword, pageNumber }) => ({
        url: ABOUTIMAGES_URL,
        params: { keyword, pageNumber },
      }),
      keepUnusedDataFor: 5,
      providesTags: ["Aboutimages"],
    }),
    getAboutimagesDetails: builder.query({
      query: (aboutimagesId) => ({
        url: `${ABOUTIMAGES_URL}/${aboutimagesId}`,
      }),
      keepUnusedDataFor: 5,
    }),
    createAboutimages: builder.mutation({
      query: (data) => ({
        url: `${ABOUTIMAGES_URL}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Aboutimages"],
    }),
    updateAboutimages: builder.mutation({
      query: (data) => ({
        url: `${ABOUTIMAGES_URL}/${data.aboutimagesId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Aboutimages"],
    }),
    updateShowFrontAboutimages: builder.mutation({
      query: (data) => ({
        url: `${ABOUTIMAGES_URL}/showfront`,
        method: "PUT",
        body: data, // Sending { aboutimagesId, showfront }
      }),
      invalidatesTags: ["Aboutimages"],
    }),
    deleteAboutimages: builder.mutation({
      query: (aboutimagesId) => ({
        url: `${ABOUTIMAGES_URL}/${aboutimagesId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Aboutimages"],
    }),
    uploadAboutimagesImage: builder.mutation({
      query: (data) => ({
        url: `/api/aboutimages`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetAboutimagesQuery,
  useGetAboutimagesDetailsQuery,
  useCreateAboutimagesMutation,
  useUpdateAboutimagesMutation,
  useUpdateShowFrontAboutimagesMutation,
  useDeleteAboutimagesMutation,
  useUploadAboutimagesImageMutation,
} = aboutImageApiSlice;
