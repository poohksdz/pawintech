import { apiSlice } from "./apiSlice";
import { STOCK_MANUFACTURES_URL } from "../constants";

export const stockManufactureApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET all manufactures
    getStockManufactures: builder.query({
      query: () => ({
        url: STOCK_MANUFACTURES_URL,
        method: "GET",
      }),
      providesTags: ["StockManufacture"],
    }),

    // GET manufacture by ID
    getStockManufactureDetails: builder.query({
      query: (id) => ({
        url: `${STOCK_MANUFACTURES_URL}/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "StockManufacture", id }],
    }),

    // POST create new manufacture
    createStockManufacture: builder.mutation({
      query: (data) => ({
        url: STOCK_MANUFACTURES_URL,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["StockManufacture"],
    }),

    // PUT update manufacture by ID
    updateStockManufacture: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${STOCK_MANUFACTURES_URL}/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "StockManufacture", id },
      ],
    }),

    // DELETE manufacture by ID
    deleteStockManufacture: builder.mutation({
      query: (id) => ({
        url: `${STOCK_MANUFACTURES_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["StockManufacture"],
    }),
  }),
});

export const {
  useGetStockManufacturesQuery,
  useGetStockManufactureDetailsQuery,
  useCreateStockManufactureMutation,
  useUpdateStockManufactureMutation,
  useDeleteStockManufactureMutation,
} = stockManufactureApiSlice;
