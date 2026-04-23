import { fetchBaseQuery, createApi } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../constants";
import { logout } from "./authSlice";

// Helper function to get token from cookie
const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    let [key, value] = cookie.trim().split("=");
    if (key === name) return value;
  }
  return null;
};

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers) => {
    // Get token from cookie (set by backend during login)
    const token = getCookie("jwt");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
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
    "Products",
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
    "Signature",
  ],
  endpoints: (builder) => ({}),

  //  เพิ่ม 2 บรรทัดนี้ (ห้ามลบส่วนอื่น)
  // refetchOnFocus: false จะหยุดการยิง API ใหม่ทุกครั้งที่คุณคลิกหน้าเว็บ หรือสลับแท็บไปมา
  refetchOnFocus: false,
  // refetchOnReconnect: false จะหยุดการยิง API ใหม่เมื่อสัญญาณอินเทอร์เน็ตหลุดแล้วติดใหม่
  refetchOnReconnect: false,
});
