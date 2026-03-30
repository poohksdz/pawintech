import { fetchBaseQuery, createApi } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../constants";
import { logout } from "./authSlice";

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
});

async function baseQueryWithAuth(args, api, extra) {
  const result = await baseQuery(args, api, extra);
  if (result.error && result.error.status === 401) {
    api.dispatch(logout());
  }
  return result;
}

export const apiSlice = createApi({
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    "Product",
    "Order",
    "User",
    "Service",
    "Showcase",
    "Category",
    "OrderPCB",
    "CustomPCB",
    "CustomPCBCart",
    "CopyPCB",
    "CopyPCBCart",
    "Blog",
    "Email",
    "StockProduct",
    "Aboutimage",
    "Aboutimages",
    "Notification",
  ],
  endpoints: (builder) => ({}),

  //  เพิ่ม 2 บรรทัดนี้ (ห้ามลบส่วนอื่น)
  // refetchOnFocus: false จะหยุดการยิง API ใหม่ทุกครั้งที่คุณคลิกหน้าเว็บ หรือสลับแท็บไปมา
  refetchOnFocus: false,
  // refetchOnReconnect: false จะหยุดการยิง API ใหม่เมื่อสัญญาณอินเทอร์เน็ตหลุดแล้วติดใหม่
  refetchOnReconnect: false,
});
