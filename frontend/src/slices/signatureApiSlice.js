import { apiSlice } from "./apiSlice";
import { SIGNATURES_URL } from "../constants";

export const signatureApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSignatures: builder.query({
      query: () => ({
        url: SIGNATURES_URL,
        method: "GET",
      }),
      providesTags: ["Signature"],
    }),

    createSignature: builder.mutation({
      query: (data) => ({
        url: SIGNATURES_URL,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Signature"],
    }),

    updateSignature: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${SIGNATURES_URL}/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Signature"],
    }),

    deleteSignature: builder.mutation({
      query: (id) => ({
        url: `${SIGNATURES_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Signature"],
    }),
  }),
});

// Upload signature image using raw fetch (FormData + multipart needs browser boundary)
export const uploadSignatureImage = async (file) => {
  const formData = new FormData();
  formData.append("signature", file);

  const res = await fetch("/api/signatures/upload", {
    method: "POST",
    body: formData,
    credentials: "include", // ส่ง cookie (jwt) ไปกับ cross-origin request
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(err.message || "Upload failed");
  }

  return res.json();
};

export const {
  useGetSignaturesQuery,
  useCreateSignatureMutation,
  useUpdateSignatureMutation,
  useDeleteSignatureMutation,
} = signatureApiSlice;
