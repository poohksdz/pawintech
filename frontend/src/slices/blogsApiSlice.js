import { BLOGS_URL } from '../constants'
import { apiSlice } from './apiSlice'

export const blogsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBlogs: builder.query({
      query: ({ keyword, pageNumber }) => ({
        url: BLOGS_URL,
        params: { keyword, pageNumber },
      }),
      keepUnusedDataFor: 5,
      providesTags: ['Blogs'],
    }),
    getBlogDetails: builder.query({
      query: (blogId) => ({
        url: `${BLOGS_URL}/${blogId}`,
      }),
      keepUnusedDataFor: 5,
    }),
    createBlog: builder.mutation({
      query: (data) => ({
        url: `${BLOGS_URL}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Blog'],
    }),
    updateBlog: builder.mutation({
      query: (data) => ({
        url: `${BLOGS_URL}/${data.blogId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Blogs'],
    }),
    updateShowFrontBlog: builder.mutation({
      query: (data) => ({
        url: `${BLOGS_URL}/${data.blogId}/showfront`,
        method: 'PUT',
        body: data, // Sending { blogId, showfront }
      }),
      invalidatesTags: ['Blogs'],
    }),
    deleteBlog: builder.mutation({
      query: (blogId) => ({
        url: `${BLOGS_URL}/${blogId}`,
        method: 'DELETE',
      }),
      providesTags: ['Blog'],
    }),
    uploadBlogImage: builder.mutation({
      query: (data) => ({
        url: `/api/blogImages`,
        method: 'POST',
        body: data,
      }),
    }),
  }),
})

export const {
  useGetBlogsQuery,
  useGetBlogDetailsQuery,
  useCreateBlogMutation,
  useUpdateBlogMutation,
  useUpdateShowFrontBlogMutation,
  useDeleteBlogMutation,
  useUploadBlogImageMutation,
} = blogsApiSlice
