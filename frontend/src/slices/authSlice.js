import { createSlice } from '@reduxjs/toolkit'

// Function to set a cookie
const setCookie = (name, value, days) => {
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = 'expires=' + date.toUTCString()
  document.cookie =
    name + '=' + encodeURIComponent(value) + ';' + expires + ';path=/'
}

// Function to get a cookie value
const getCookie = (name) => {
  let decodedCookies = decodeURIComponent(document.cookie)
  let cookies = decodedCookies.split(';')
  for (let cookie of cookies) {
    let [key, value] = cookie.trim().split('=')
    if (key === name) return value
  }
  return null
}

const initialState = {
  userInfo: getCookie('userInfo') ? JSON.parse(getCookie('userInfo')) : null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.userInfo = action.payload
      setCookie('userInfo', JSON.stringify(action.payload), 7) // Store in cookie for 7 days
    },
    logout: (state, action) => {
      state.userInfo = null
      state.cart = null
      // Remove 'userInfo' and 'cart' cookies
      document.cookie =
        'userInfo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
      document.cookie = 'cart=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
      // Clear any other cookies if needed

      // Clear the rest of the state
      localStorage.clear()
      // window.location.reload();
    },
  },
})

export const { setCredentials, logout } = authSlice.actions

export default authSlice.reducer

// import { createSlice } from '@reduxjs/toolkit'

// const initialState = {
//   userInfo: localStorage.getItem('userInfo')
//     ? JSON.parse(localStorage.getItem('userInfo'))
//     : null,
// }

// const authSlice = createSlice({
//   name: 'auth',
//   initialState,
//   reducers: {
//     setCredentials: (state, action) => {
//       state.userInfo = action.payload
//       localStorage.setItem('userInfo', JSON.stringify(action.payload))
//     },
//     logout: (state, action) => {
//       state.userInfo = null
//       state.cart = null
//       // NOTE: here we need to also remove the cart from storage so the next
//       // logged in user doesn't inherit the previous users cart and shipping
//       localStorage.clear()
//       // Reload the page to reset state and UI
//       // window.location.reload();
//     },
//   },
// })

// export const { setCredentials, logout } = authSlice.actions

// export default authSlice.reducer
