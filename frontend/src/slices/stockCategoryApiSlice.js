import { apiSlice } from "./apiSlice";
import { STOCK_CATEGORIES_URL } from "../constants";

export const stockCategoryApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET all categories
    getStockCategories: builder.query({
      query: () => ({
        url: STOCK_CATEGORIES_URL,
        method: "GET",
      }),
      providesTags: ["StockCategory"],
    }),

    // GET one category details
    getStockCategoryDetails: builder.query({
      query: (id) => ({
        url: `${STOCK_CATEGORIES_URL}/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "StockCategory", id }],
    }),

    // CREATE new category
    createStockCategory: builder.mutation({
      query: (newData) => ({
        url: STOCK_CATEGORIES_URL,
        method: "POST",
        body: newData,
      }),
      invalidatesTags: ["StockCategory"],
    }),

    // UPDATE category
    updateStockCategory: builder.mutation({
      query: ({ id, ...updatedData }) => ({
        url: `${STOCK_CATEGORIES_URL}/${id}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "StockCategory", id },
      ],
    }),

    // DELETE category
    deleteStockCategory: builder.mutation({
      query: (id) => ({
        url: `${STOCK_CATEGORIES_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["StockCategory"],
    }),
  }),
});

export const {
  useGetStockCategoriesQuery,
  useGetStockCategoryDetailsQuery,
  useCreateStockCategoryMutation,
  useUpdateStockCategoryMutation,
  useDeleteStockCategoryMutation,
} = stockCategoryApiSlice;
