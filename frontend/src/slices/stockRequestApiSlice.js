import { apiSlice } from "./apiSlice";
import { STOCK_REQUESTS_URL } from "../constants";

export const stockRequestApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStockRequest: builder.query({
      query: () => ({
        url: STOCK_REQUESTS_URL,
        method: "GET",
      }),
      providesTags: ["StockRequest"],
    }),

    getStockRequestDetails: builder.query({
      query: (id) => `${STOCK_REQUESTS_URL}/${id}`,
      providesTags: ["StockRequest"],
    }),

    getStockRequestUser: builder.query({
      query: (userId) => `${STOCK_REQUESTS_URL}/user/${userId}`,
      providesTags: ["StockRequest"],
    }),

    createStockRequest: builder.mutation({
      query: (data) => ({
        url: STOCK_REQUESTS_URL,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["StockRequest"],
    }),

    updateStockRequest: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${STOCK_REQUESTS_URL}/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["StockRequest"],
    }),

    updateStockRequestQty: builder.mutation({
      query: ({ id, qty }) => ({
        url: `${STOCK_REQUESTS_URL}/updaterequestqty/${id}`,
        method: "PUT",
        body: { qty },
      }),
      invalidatesTags: ["StockRequest"],
    }),

    deleteStockRequest: builder.mutation({
      query: (id) => ({
        url: `${STOCK_REQUESTS_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["StockRequest"],
    }),

    // ============================
    // Importance Endpoints
    // ============================
    getStockRequestImportance: builder.query({
      query: () => `${STOCK_REQUESTS_URL}/importance/all`,
      providesTags: ["StockRequest"],
    }),

    getStockRequestImportanceByUser: builder.query({
      query: (userId) => `${STOCK_REQUESTS_URL}/importance/${userId}`,
      providesTags: ["StockRequest"],
    }),

    updateStockRequestImportance: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${STOCK_REQUESTS_URL}/importance/update/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["StockRequest"],
    }),

    // ============================
    // Cancel Endpoints
    // ============================
    getStockRequestCancel: builder.query({
      query: () => `${STOCK_REQUESTS_URL}/cancel`,
      providesTags: ["StockRequest"],
    }),

    getStockRequestCancelByUser: builder.query({
      query: (userId) => `${STOCK_REQUESTS_URL}/cancel/${userId}`,
      providesTags: ["StockRequest"],
    }),

    updateStockRequestCancel: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${STOCK_REQUESTS_URL}/cancel/update/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["StockRequest"],
    }),
  }),
});

export const {
  useGetStockRequestQuery,
  useGetStockRequestDetailsQuery,
  useGetStockRequestUserQuery,
  useCreateStockRequestMutation,
  useUpdateStockRequestMutation,
  useUpdateStockRequestQtyMutation,
  useDeleteStockRequestMutation,

  // Importance Hooks
  useGetStockRequestImportanceQuery,
  useGetStockRequestImportanceByUserQuery,
  useUpdateStockRequestImportanceMutation,

  // Cancel Hooks
  useGetStockRequestCancelQuery,
  useGetStockRequestCancelByUserQuery,
  useUpdateStockRequestCancelMutation,
} = stockRequestApiSlice;
