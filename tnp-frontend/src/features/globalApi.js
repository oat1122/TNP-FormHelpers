import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiConfig } from "../api/apiConfig";
import qs from "qs";

export const globalApi = createApi({
  reducerPath: "globalApi",
  baseQuery: fetchBaseQuery(apiConfig),
  tagTypes: ["Global"],
  endpoints: (builder) => ({
    getAllLocation: builder.query({
      query: (payload) => {
        const queryParams = {
          province_sort_id: payload?.province_sort_id,
          district_sort_id: payload?.district_sort_id,
        };

        const queryString = qs.stringify(queryParams, { skipNulls: true });
        const url = queryString ? `/locations?${queryString}` : "/locations";

        return {
          url: url,
          method: "GET",
        };
      },
    }),
    getUserByRole: builder.query({
      query: (payload) => ({
        url: payload
          ? `/get-users-by-role?role=${payload}`
          : "/get-users-by-role",
        method: "GET",
      }),
    }),
    getAllCustomer: builder.query({
      query: () => `get-all-customers`,
    }),
    getAllProductCate: builder.query({
      query: () => `get-all-product-categories`,
    }),
    getStatusByType: builder.query({
      query: (status_type) => `/get-status-by-type/${status_type}`,
    }),
    getAllBusinessTypes: builder.query({
      query: () => `/get-all-business-types`,
    }),
    addBusinessType: builder.mutation({
      query: (payload) => ({
        url: `/business-types`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Global"],
    }),
    updateBusinessType: builder.mutation({
      query: (payload) => ({
        url: `/business-types/${payload.bt_id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Global"],
    }),
    deleteBusinessType: builder.mutation({
      query: (bt_id) => ({
        url: `/business-types/${bt_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Global"],
    }),
  }),
});

export const {
  useLazyGetAllLocationQuery,
  useGetAllLocationQuery,
  useGetUserByRoleQuery,
  useGetAllCustomerQuery,
  useGetAllProductCateQuery,
  useGetStatusByTypeQuery,
  useGetAllBusinessTypesQuery,
  useAddBusinessTypeMutation,
  useUpdateBusinessTypeMutation,
  useDeleteBusinessTypeMutation,
} = globalApi;
