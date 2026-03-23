import { SERVICES_URL } from '../constants'
import { apiSlice } from './apiSlice'

export const servicesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getServices: builder.query({
      query: ({ keyword, pageNumber }) => ({
        url: SERVICES_URL,
        params: { keyword, pageNumber },
      }),
      // ✅ แก้ไข: เพิ่มเวลาเก็บ Cache เป็น 300 วินาที (5 นาที)
      // ช่วยให้เวลาแอดมินกดเปลี่ยนหน้า เมนู "Service" ใน Header จะไม่ไปดึง DB ใหม่รัวๆ
      keepUnusedDataFor: 300, 
      providesTags: ['Services'],
    }),
    getServiceDetails: builder.query({
      query: (serviceId) => ({
        url: `${SERVICES_URL}/${serviceId}`,
      }),
      // ✅ แก้ไข: เพิ่มเวลา Cache สำหรับหน้าดูรายละเอียด
      keepUnusedDataFor: 300,
      providesTags: (result, error, serviceId) => [{ type: 'Services', id: serviceId }],
    }),
    createService: builder.mutation({
      query: (data) => ({
        url: `${SERVICES_URL}`,
        method: 'POST',
        body: data,
      }),
      // ✅ แก้ไข: ใช้ 'Services' (มี s) ให้ตรงกับตัว query เพื่อให้หน้า List อัปเดตทันที
      invalidatesTags: ['Services'], 
    }),
    updateService: builder.mutation({
      query: (data) => ({
        url: `${SERVICES_URL}/${data.serviceId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Services'],
    }),
    updateShowFrontService: builder.mutation({
      query: (data) => ({
        url: `${SERVICES_URL}/${data.serviceId}/showfront`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Services'],
    }),
    deleteService: builder.mutation({
      query: (serviceId) => ({
        url: `${SERVICES_URL}/${serviceId}`,
        method: 'DELETE',
      }),
      // ✅ แก้ไข: จาก providesTags เป็น invalidatesTags และใช้ชื่อ 'Services'
      invalidatesTags: ['Services'], 
    }),
    uploadServiceImage: builder.mutation({
      query: (data) => ({
        url: `/api/serviceImages`,
        method: 'POST',
        body: data,
      }),
    }),
  }),
})

export const {
  useGetServicesQuery,
  useGetServiceDetailsQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useUpdateShowFrontServiceMutation,
  useDeleteServiceMutation,
  useUploadServiceImageMutation,
} = servicesApiSlice