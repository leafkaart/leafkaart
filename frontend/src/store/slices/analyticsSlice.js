import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedDateRange: {
    from: "",
    to: "",
  },
  selectedGroupBy: "day",
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,

  reducers: {
    setDateRange: (state, action) => {
      state.selectedDateRange = {
        from: action.payload?.from ?? "",
        to: action.payload?.to ?? "",
      };
    },

    setGroupBy: (state, action) => {
      state.selectedGroupBy = action.payload;
    },

    clearFilters: (state) => {
      state.selectedDateRange = { from: "", to: "" };
      state.selectedGroupBy = "day";
    },
  },
});

export const { setDateRange, setGroupBy, clearFilters } = analyticsSlice.actions;

export default analyticsSlice.reducer;