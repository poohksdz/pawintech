import { apiSlice } from './apiSlice';
import { PAYMENTS_URL } from '../constants'; // อย่าลืมเพิ่ม PAYMENTS_URL = '/api/payments' ใน constants.js

export const paymentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1. ดึงข้อมูลรายการชำระเงินทั้งหมด
    getAllPayments: builder.query({
      query: () => ({
        url: PAYMENTS_URL,
      }),
      keepUnusedDataFor: 5,
      providesTags: ['Payment'],
    }),
    
    // 2. อัปเดตสถานะการชำระเงิน (ยืนยัน/ปฏิเสธ)
    updatePaymentStatus: builder.mutation({
      query: (data) => ({
        url: `${PAYMENTS_URL}/${data.id}`,
        method: 'PUT',
        body: data, // ส่ง status: 'Paid' หรือ 'Reject' ไป
      }),
      invalidatesTags: ['Payment'],
    }),
  }),
});

export const {
  useGetAllPaymentsQuery,
  useUpdatePaymentStatusMutation,
} = paymentApiSlice;