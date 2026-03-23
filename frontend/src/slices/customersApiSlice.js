import { CUSTOMERS_URL } from '../constants'
import { apiSlice } from './apiSlice'

export const customersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query({
      query: ({ keyword, pageNumber } = {}) => ({
        url: CUSTOMERS_URL,
        params: { keyword, pageNumber },
      }),
      keepUnusedDataFor: 5,
      providesTags: ['Customers'],
    }),

    getCustomerDetails: builder.query({
      query: (id) => `${CUSTOMERS_URL}/${id}`,
      keepUnusedDataFor: 5,
      providesTags: ['Customers'],
    }),

    createCustomer: builder.mutation({
      query: (data) => ({
        url: CUSTOMERS_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Customers'],
    }),

    updateCustomer: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${CUSTOMERS_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Customers'],
    }),

    deleteCustomer: builder.mutation({
      query: (id) => ({
        url: `${CUSTOMERS_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Customers'],
    }),
  }),
})

export const {
  useGetCustomersQuery,
  useGetCustomerDetailsQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customersApiSlice
