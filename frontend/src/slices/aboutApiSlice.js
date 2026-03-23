import { ABOUTS_URL } from '../constants'
import { apiSlice } from './apiSlice'

export const aboutApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    GetAbouts: builder.query({
      query: ({ keyword, pageNumber }) => ({
        url: ABOUTS_URL,
        params: { keyword, pageNumber },
      }),
      keepUnusedDataFor: 5,
      providesTags: ['Abouts'],
    }),
    getAboutDetails: builder.query({
      query: (aboutId) => ({
        url: `${ABOUTS_URL}/${aboutId}`,
      }),
      keepUnusedDataFor: 5,
    }),
    createAbout: builder.mutation({
      query: (data) => ({
        url: `${ABOUTS_URL}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['About'],
    }),
    updateAbout: builder.mutation({
      query: (data) => ({
        url: `${ABOUTS_URL}/${data.aboutId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Abouts'],
    }),
    deleteAbout: builder.mutation({
      query: (aboutId) => ({
        url: `${ABOUTS_URL}/${aboutId}`,
        method: 'DELETE',
      }),
      providesTags: ['About'],
    }),
    uploadAboutImage: builder.mutation({
      query: (data) => ({
        url: `/api/aboutImages`,
        method: 'POST',
        body: data,
      }),
    }),
  }),
})

export const {
  useGetAboutsQuery,
  useGetAboutDetailsQuery,
  useCreateAboutMutation,
  useUpdateAboutMutation,
  useDeleteAboutMutation,
  useUploadAboutImageMutation,
} = aboutApiSlice
