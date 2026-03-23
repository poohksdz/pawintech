import { EMAIL_URL } from '../constants'
import { apiSlice } from './apiSlice'

export const emailApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getEmails: builder.query({
      query: ({ keyword, pageNumber }) => ({
        url: EMAIL_URL,
        params: { keyword, pageNumber },
      }),
      keepUnusedDataFor: 5,
      providesTags: ['Emails'], // Ensure the tag name matches
    }),
    sendEmail: builder.mutation({
      query: (data) => ({
        url: EMAIL_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Emails'], // Match the tag name with getEmails
    }),
  }),
})

// Export hooks for use in components
export const { useGetEmailsQuery, useSendEmailMutation } = emailApiSlice
