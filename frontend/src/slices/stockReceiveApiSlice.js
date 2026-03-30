import { apiSlice } from "./apiSlice";
import { STOCK_RECEIVES_URL } from "../constants";

export const stockReceiveApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET all stock receives
    getStockReceive: builder.query({
      query: () => ({
        url: STOCK_RECEIVES_URL,
        method: "GET",
      }),
      providesTags: ["StockReceive"],
    }),

    // GET a single stock receive by ID
    getStockReceiveById: builder.query({
      query: (id) => ({
        url: `${STOCK_RECEIVES_URL}/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "StockReceive", id }],
    }),

    // CREATE a new stock receive
    createStockReceive: builder.mutation({
      query: (newData) => ({
        url: STOCK_RECEIVES_URL,
        method: "POST",
        body: newData,
      }),
      invalidatesTags: ["StockReceive"],
    }),

    // UPDATE a stock receive
    updateStockReceive: builder.mutation({
      query: ({ id, ...updatedData }) => ({
        url: `${STOCK_RECEIVES_URL}/${id}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: (result, error, { id }) => [
        "StockReceive",
        { type: "StockReceive", id },
      ],
    }),

    // DELETE a stock receive
    deleteStockReceive: builder.mutation({
      query: (id) => ({
        url: `${STOCK_RECEIVES_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["StockReceive"],
    }),
  }),
});

export const {
  useGetStockReceiveQuery,
  useGetStockReceiveByIdQuery,
  useCreateStockReceiveMutation,
  useUpdateStockReceiveMutation,
  useDeleteStockReceiveMutation,
} = stockReceiveApiSlice;
