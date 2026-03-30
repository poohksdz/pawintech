import { apiSlice } from "./apiSlice";
import { STOCK_ISSUES_URL } from "../constants";

export const stockIssueApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET all stock issues
    getStockIssue: builder.query({
      query: () => ({
        url: STOCK_ISSUES_URL,
        method: "GET",
      }),
      providesTags: ["StockIssue"],
    }),

    // GET single stock issue by ID
    getStockIssueById: builder.query({
      query: (id) => ({
        url: `${STOCK_ISSUES_URL}/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "StockIssue", id }],
    }),

    // GET stock issues by user (custom endpoint)
    getStockIssueByUser: builder.query({
      query: (userId) => ({
        url: `${STOCK_ISSUES_URL}/user/${userId}`,
        method: "GET",
      }),
      providesTags: ["StockIssue"],
    }),

    // CREATE stock issue
    createStockIssue: builder.mutation({
      query: (newData) => ({
        url: STOCK_ISSUES_URL,
        method: "POST",
        body: newData,
      }),
      invalidatesTags: ["StockIssue"],
    }),

    // UPDATE stock issue
    updateStockIssue: builder.mutation({
      query: ({ id, ...updatedData }) => ({
        url: `${STOCK_ISSUES_URL}/${id}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: (result, error, { id }) => [
        "StockIssue",
        { type: "StockIssue", id },
      ],
    }),

    // DELETE stock issue
    deleteStockIssue: builder.mutation({
      query: (id) => ({
        url: `${STOCK_ISSUES_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["StockIssue"],
    }),
  }),
});

export const {
  useGetStockIssueQuery,
  useGetStockIssueByIdQuery,
  useGetStockIssueByUserQuery,
  useCreateStockIssueMutation,
  useUpdateStockIssueMutation,
  useDeleteStockIssueMutation,
} = stockIssueApiSlice;
