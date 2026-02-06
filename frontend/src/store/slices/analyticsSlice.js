import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  overview: null,
  salesReport: [],
  selectedDateRange: {
    from: null,
    to: null,
  },
  selectedGroupBy: "day",
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    setOverview: (state, action) => {
      state.overview = action.payload;
    },
    setSalesReport: (state, action) => {
      state.salesReport = action.payload;
    },
    setDateRange: (state, action) => {
      state.selectedDateRange = action.payload;
    },
    setGroupBy: (state, action) => {
      state.selectedGroupBy = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    resetAnalytics: () => initialState,
  },
});

export const {
  setOverview,
  setSalesReport,
  setDateRange,
  setGroupBy,
  setLoading,
  setError,
  resetAnalytics,
} = analyticsSlice.actions;

export default analyticsSlice.reducer;