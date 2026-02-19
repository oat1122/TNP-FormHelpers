import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import qs from "qs";

import { apiConfig } from "../../api/apiConfig";

export const supplierApi = createApi({
  reducerPath: "supplierApi",
  baseQuery: fetchBaseQuery(apiConfig),
  tagTypes: ["SupplierProducts", "SupplierTags", "SupplierCategories", "SupplierSellers"],
  endpoints: (builder) => ({
    // ==================== Products ====================
    getProducts: builder.query({
      query: (params) => {
        const queryParams = {
          search: params?.search,
          category: params?.category,
          tags: params?.tags,
          min_price: params?.min_price,
          max_price: params?.max_price,
          country: params?.country,
          currency: params?.currency,
          is_active: params?.is_active,
          sort_by: params?.sort_by,
          sort_dir: params?.sort_dir,
          page: params?.page ? params.page + 1 : 1,
          per_page: params?.per_page || 20,
        };
        const queryString = qs.stringify(queryParams, { skipNulls: true });
        return { url: `/supplier/products?${queryString}`, method: "GET" };
      },
      providesTags: ["SupplierProducts"],
    }),

    getProduct: builder.query({
      query: (id) => `/supplier/products/${id}`,
      providesTags: ["SupplierProducts"],
    }),

    addProduct: builder.mutation({
      invalidatesTags: ["SupplierProducts"],
      query: (payload) => ({
        url: `/supplier/products`,
        method: "POST",
        body: payload,
      }),
    }),

    updateProduct: builder.mutation({
      invalidatesTags: ["SupplierProducts"],
      query: ({ id, ...payload }) => ({
        url: `/supplier/products/${id}`,
        method: "PUT",
        body: payload,
      }),
    }),

    deleteProduct: builder.mutation({
      invalidatesTags: ["SupplierProducts"],
      query: (id) => ({
        url: `/supplier/products/${id}`,
        method: "DELETE",
      }),
    }),

    // ==================== Images ====================
    uploadImages: builder.mutation({
      invalidatesTags: ["SupplierProducts"],
      query: ({ id, formData }) => ({
        url: `/supplier/products/${id}/images`,
        method: "POST",
        body: formData,
        headers: { "X-Skip-Json": "1" },
      }),
    }),

    setCoverImage: builder.mutation({
      invalidatesTags: ["SupplierProducts"],
      query: ({ productId, imageId }) => ({
        url: `/supplier/products/${productId}/images/${imageId}/cover`,
        method: "PATCH",
      }),
    }),

    deleteImage: builder.mutation({
      invalidatesTags: ["SupplierProducts"],
      query: ({ productId, imageId }) => ({
        url: `/supplier/products/${productId}/images/${imageId}`,
        method: "DELETE",
      }),
    }),

    // ==================== Currency ====================
    convertCurrency: builder.query({
      query: ({ from, amount }) => {
        const queryString = qs.stringify({ from, amount });
        return { url: `/supplier/currency/convert?${queryString}`, method: "GET" };
      },
    }),

    // ==================== Tags ====================
    getTags: builder.query({
      query: (params) => {
        const queryString = params?.search ? qs.stringify({ search: params.search }) : "";
        return {
          url: queryString ? `/supplier/tags?${queryString}` : `/supplier/tags`,
          method: "GET",
        };
      },
      providesTags: ["SupplierTags"],
    }),

    addTag: builder.mutation({
      invalidatesTags: ["SupplierTags"],
      query: (payload) => ({
        url: `/supplier/tags`,
        method: "POST",
        body: payload,
      }),
    }),

    deleteTag: builder.mutation({
      invalidatesTags: ["SupplierTags"],
      query: (id) => ({
        url: `/supplier/tags/${id}`,
        method: "DELETE",
      }),
    }),

    // ==================== Categories ====================
    getCategories: builder.query({
      query: () => `/supplier/categories`,
      providesTags: ["SupplierCategories"],
    }),

    addCategory: builder.mutation({
      invalidatesTags: ["SupplierCategories"],
      query: (payload) => ({
        url: `/supplier/categories`,
        method: "POST",
        body: payload,
      }),
    }),

    updateCategory: builder.mutation({
      invalidatesTags: ["SupplierCategories"],
      query: ({ id, ...payload }) => ({
        url: `/supplier/categories/${id}`,
        method: "PUT",
        body: payload,
      }),
    }),

    deleteCategory: builder.mutation({
      invalidatesTags: ["SupplierCategories"],
      query: (id) => ({
        url: `/supplier/categories/${id}`,
        method: "DELETE",
      }),
    }),

    getSupplierCountries: builder.query({
      query: () => "/supplier/sellers/countries",
      providesTags: ["Supplier"],
    }),

    getNextSku: builder.query({
      query: (categoryId) => `/supplier/categories/${categoryId}/next-sku`,
    }),

    // ==================== Sellers ====================
    getSellers: builder.query({
      query: (params) => {
        const queryString = params?.search ? qs.stringify({ search: params.search }) : "";
        return {
          url: queryString ? `/supplier/sellers?${queryString}` : `/supplier/sellers`,
          method: "GET",
        };
      },
      providesTags: ["SupplierSellers"],
    }),

    addSeller: builder.mutation({
      invalidatesTags: ["SupplierSellers"],
      query: (payload) => ({
        url: `/supplier/sellers`,
        method: "POST",
        body: payload,
      }),
    }),

    updateSeller: builder.mutation({
      invalidatesTags: ["SupplierSellers"],
      query: ({ id, ...payload }) => ({
        url: `/supplier/sellers/${id}`,
        method: "PUT",
        body: payload,
      }),
    }),

    deleteSeller: builder.mutation({
      invalidatesTags: ["SupplierSellers"],
      query: (id) => ({
        url: `/supplier/sellers/${id}`,
        method: "DELETE",
      }),
    }),

    getSellerPhoneLogs: builder.query({
      query: (sellerId) => `/supplier/sellers/${sellerId}/phone-logs`,
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useAddProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUploadImagesMutation,
  useSetCoverImageMutation,
  useDeleteImageMutation,
  useLazyConvertCurrencyQuery,
  useGetTagsQuery,
  useAddTagMutation,
  useDeleteTagMutation,
  useGetCategoriesQuery,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useLazyGetNextSkuQuery,
  useGetSupplierCountriesQuery,
  useGetSellersQuery,
  useAddSellerMutation,
  useUpdateSellerMutation,
  useDeleteSellerMutation,
  useLazyGetSellerPhoneLogsQuery,
} = supplierApi;
