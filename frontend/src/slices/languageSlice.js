import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  language: localStorage.getItem('appLanguage')
    ? JSON.parse(localStorage.getItem('appLanguage'))
    : 'thai', // default fallback language
  // : 'en', // default fallback language
}

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguageCredentials: (state, action) => {
      state.language = action.payload
      localStorage.setItem('appLanguage', JSON.stringify(action.payload))
    },
    resetLanguage: (state) => {
      state.language = 'thai' // reset to default language
      // state.language = 'en'; // reset to default language
      localStorage.removeItem('appLanguage')
    },
  },
})

export const { setLanguageCredentials, resetLanguage } = languageSlice.actions

export default languageSlice.reducer
