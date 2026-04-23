import { apiSlice } from "./apiSlice";

const REVIEWS_URL = "/api/reviews";

export const reviewsApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Get all reviews for a product
        getProductReviews: builder.query({
            query: (productId) => ({
                url: `${REVIEWS_URL}/product/${productId}`,
            }),
            providesTags: (result, error, productId) => [
                { type: "Reviews", id: productId },
            ],
        }),

        // Create a review
        createReview: builder.mutation({
            query: (data) => ({
                url: REVIEWS_URL,
                method: "POST",
                body: data,
            }),
            invalidatesTags: (result, error, data) => [
                { type: "Reviews", id: data.productId },
            ],
        }),

        // Update a review
        updateReview: builder.mutation({
            query: ({ reviewId, ...data }) => ({
                url: `${REVIEWS_URL}/${reviewId}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { reviewId, ...data }) => [
                { type: "Reviews", id: data.productId },
            ],
        }),

        // Delete a review
        deleteReview: builder.mutation({
            query: ({ reviewId, productId }) => ({
                url: `${REVIEWS_URL}/${reviewId}`,
                method: "DELETE",
                body: { productId },
            }),
            invalidatesTags: (result, error, { productId }) => [
                { type: "Reviews", id: productId },
            ],
        }),

        // Get user's review for a specific product
        getUserReviewForProduct: builder.query({
            query: (productId) => ({
                url: `${REVIEWS_URL}/user/product/${productId}`,
            }),
            providesTags: (result, error, productId) => [
                { type: "UserReview", id: productId },
            ],
        }),
    }),
});

export const {
    useGetProductReviewsQuery,
    useCreateReviewMutation,
    useUpdateReviewMutation,
    useDeleteReviewMutation,
    useGetUserReviewForProductQuery,
} = reviewsApiSlice;