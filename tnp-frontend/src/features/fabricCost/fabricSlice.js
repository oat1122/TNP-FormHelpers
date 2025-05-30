import { createContext } from "react";
import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define a service using a base URL and expected endpoints
export const booksApi = createApi({
  reducerPath: "booksApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:3001" }),
  endpoints: (builder) => ({
    fetchBooks: builder.query({
      query: () => "books",
    }),
    createBook: builder.mutation({
      query: (title) => ({
        url: "books",
        method: "POST",
        body: { title },
      }),
    }),
    editBookById: builder.mutation({
      query: ({ id, newTitle }) => ({
        url: `books/${id}`,
        method: "PUT",
        body: { title: newTitle },
      }),
    }),
    deleteBookById: builder.mutation({
      query: (id) => ({
        url: `books/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const { Provider } = createContext();

export const booksSlice = createSlice({
  name: "books",
  initialState: booksApi.endpoints.fetchBooks.useQueryState().data ?? [],
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addMatcher(booksApi.endpoints.fetchBooks.matchFulfilled, (state, action) => {
        return action.payload;
      })
      .addMatcher(booksApi.endpoints.createBook.matchFulfilled, (state, action) => {
        state.push(action.payload);
      })
      .addMatcher(booksApi.endpoints.editBookById.matchFulfilled, (state, action) => {
        const { id } = action.meta.arg;
        const newTitle = action.payload;
        const bookToUpdate = state.find((book) => book.id === id);
        if (bookToUpdate) {
          bookToUpdate.title = newTitle;
        }
      })
      .addMatcher(booksApi.endpoints.deleteBookById.matchFulfilled, (state, action) => {
        const idToDelete = action.meta.arg;
        return state.filter((book) => book.id !== idToDelete);
      });
  },
});

export const { actions: booksActions, reducer: booksReducer } = booksSlice;

export default booksReducer;
