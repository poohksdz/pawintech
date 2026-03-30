import { CATEGORYS_URL } from "../constants";
import { apiSlice } from "./apiSlice";

export const categorysApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCategorys: builder.query({
      query: ({ keyword = "", pageNumber = 1 }) => ({
        url: CATEGORYS_URL,
        params: { keyword, pageNumber },
      }),
      keepUnusedDataFor: 5,
      providesTags: ["Categorys"],
    }),
    getCategoryDetails: builder.query({
      query: (categoryId) => ({
        url: `${CATEGORYS_URL}/${categoryId}`,
      }),
      keepUnusedDataFor: 5,
    }),
    createCategory: builder.mutation({
      query: (data) => ({
        url: `${CATEGORYS_URL}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Categorys"],
    }),
    // Inside the categorysApiSlice
    updateCategory: builder.mutation({
      query: (data) => ({
        url: `${CATEGORYS_URL}/${data.categoryId}`, // Ensure categoryId is part of the URL
        method: "PUT",
        body: {
          categoryName: data.categoryName,
          categoryNameThai: data.categoryNameThai,
          categoryShortName: data.categoryShortName,
        },
      }),
      invalidatesTags: ["Categorys"],
    }),

    deleteCategory: builder.mutation({
      query: (categoryId) => ({
        url: `${CATEGORYS_URL}/${categoryId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Categorys"],
    }),
  }),
});

export const {
  useGetCategorysQuery,
  useGetCategoryDetailsQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categorysApiSlice;
