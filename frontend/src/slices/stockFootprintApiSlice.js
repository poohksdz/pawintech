import { apiSlice } from "./apiSlice";
import { STOCK_FOOTPRINTS_URL } from "../constants";

export const stockFootprintApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET all stock footprints
    getStockFootprints: builder.query({
      query: () => ({
        url: STOCK_FOOTPRINTS_URL,
        method: "GET",
      }),
      providesTags: ["StockFootprint"],
    }),

    // GET footprint by ID
    getStockFootprintDetails: builder.query({
      query: (id) => ({
        url: `${STOCK_FOOTPRINTS_URL}/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "StockFootprint", id }],
    }),

    // POST create new footprint
    createStockFootprint: builder.mutation({
      query: (data) => ({
        url: STOCK_FOOTPRINTS_URL,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["StockFootprint"],
    }),

    // PUT update footprint by ID
    updateStockFootprint: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${STOCK_FOOTPRINTS_URL}/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "StockFootprint", id },
      ],
    }),

    // DELETE footprint by ID
    deleteStockFootprint: builder.mutation({
      query: (id) => ({
        url: `${STOCK_FOOTPRINTS_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["StockFootprint"],
    }),

    // GET footprints by category ID (if supported)
    getStockFootprintByCategory: builder.query({
      query: (categoryId) => ({
        url: `${STOCK_FOOTPRINTS_URL}/category/${categoryId}`,
        method: "GET",
      }),
      providesTags: ["StockFootprint"],
    }),
  }),
});

export const {
  useGetStockFootprintsQuery,
  useGetStockFootprintDetailsQuery,
  useCreateStockFootprintMutation,
  useUpdateStockFootprintMutation,
  useDeleteStockFootprintMutation,
  useGetStockFootprintByCategoryQuery,
} = stockFootprintApiSlice;
