import { configureStore } from "@reduxjs/toolkit";
import listingsReducer from "./listingsSlice";

export const store = configureStore({
  reducer: {
    listings: listingsReducer,
  },
  // Suppress serializable check warning for large cached objects
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types (large data payloads)
        ignoredActions: [
          "listings/fetchCategoryItems/fulfilled",
          "listings/fetchItemDetail/fulfilled",
          "listings/prefillItemDetails",
        ],
        // Ignore these paths in state (large objects)
        ignoredPaths: [
          "listings.categoriesCache",
          "listings.itemDetailsCache",
        ],
      },
    }),
});

export default store;

