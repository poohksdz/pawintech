import { apiSlice } from './apiSlice'
import { ORDERPCBCART_URL } from '../constants'

export const orderpcbCartApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAllOrderPCBCarts: builder.query({
            query: () => ({
                url: ORDERPCBCART_URL,
            }),
            providesTags: ['OrderPCBCart'],
            keepUnusedDataFor: 5,
        }),
        getOrderPCBCartById: builder.query({
            query: (id) => ({
                url: `${ORDERPCBCART_URL}/${id}`,
            }),
            providesTags: ['OrderPCBCart'],
            keepUnusedDataFor: 5,
        }),
        getOrderPCBCartByUserId: builder.query({
            query: (userId) => ({
                url: `${ORDERPCBCART_URL}/user/${userId}`,
            }),
            providesTags: ['OrderPCBCart'],
            keepUnusedDataFor: 5,
        }),
        createOrderpcbCart: builder.mutation({
            query: (data) => ({
                url: ORDERPCBCART_URL,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['OrderPCBCart'],
        }),
        updateOrderpcbCartStatus: builder.mutation({
            query: (data) => ({
                url: `${ORDERPCBCART_URL}/${data.id}/status`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['OrderPCBCart'],
        }),
        deleteOrderpcbCart: builder.mutation({
            query: (id) => ({
                url: `${ORDERPCBCART_URL}/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['OrderPCBCart'],
        }),
    }),
})

export const {
    useGetAllOrderPCBCartsQuery,
    useGetOrderPCBCartByIdQuery,
    useGetOrderPCBCartByUserIdQuery,
    useCreateOrderpcbCartMutation,
    useUpdateOrderpcbCartStatusMutation,
    useDeleteOrderpcbCartMutation
} = orderpcbCartApiSlice
