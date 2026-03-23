import { SHOWCASE_URL } from '../constants'
import { apiSlice } from './apiSlice'

export const showcasesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getShowcases: builder.query({
      query: ({ keyword, pageNumber }) => ({
        url: SHOWCASE_URL,
        params: { keyword, pageNumber },
      }),
      keepUnusedDataFor: 5,
      providesTags: ['Showcases'],
    }),
    getShowcaseDetails: builder.query({
      query: (showcaseId) => ({
        url: `${SHOWCASE_URL}/${showcaseId}`,
      }),
      keepUnusedDataFor: 5,
    }),
    createShowcase: builder.mutation({
      query: (data) => ({
        url: `${SHOWCASE_URL}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Showcase'],
    }),
    updateShowcase: builder.mutation({
      query: (data) => ({
        url: `${SHOWCASE_URL}/${data.showcaseId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Showcases'],
    }),
    updateOrderPresentShowcase: builder.mutation({
      query: (data) => ({
        url: `${SHOWCASE_URL}/orderpresent/${data.showcaseId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Showcases'],
    }),
    deleteShowcase: builder.mutation({
      query: (showcaseId) => ({
        url: `${SHOWCASE_URL}/${showcaseId}`,
        method: 'DELETE',
      }),
      providesTags: ['Showcase'],
    }),
    uploadShowcaseImage: builder.mutation({
      query: (data) => ({
        url: `/api/showcaseImages`,
        method: 'POST',
        body: data,
      }),
    }),
  }),
})

export const {
  useGetShowcasesQuery,
  useGetShowcaseDetailsQuery,
  useCreateShowcaseMutation,
  useUpdateShowcaseMutation,
  useDeleteShowcaseMutation,
  useUploadShowcaseImageMutation,
  useUpdateOrderPresentShowcaseMutation,
} = showcasesApiSlice
