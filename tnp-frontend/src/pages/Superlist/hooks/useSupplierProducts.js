import { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";

import { useGetAllProductCateQuery } from "../../../features/globalApi";
import {
  useGetProductsQuery,
  useDeleteProductMutation,
  useGetTagsQuery,
} from "../../../features/Superlist/supplierApi";
import {
  setFilters,
  resetFilters,
  setPaginationModel,
} from "../../../features/Superlist/supplierSlice";

const PRIMARY_RED = "#C1272D";

/**
 * Custom hook for managing supplier products list
 * Handles data fetching, filtering, pagination, and search
 */
export const useSupplierProducts = () => {
  const dispatch = useDispatch();
  const { filters, paginationModel } = useSelector((state) => state.supplier);

  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [pdfOpen, setPdfOpen] = useState(false);

  // Debounce search
  const [searchTimeout, setSearchTimeout] = useState(null);
  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchInput(value);
      if (searchTimeout) clearTimeout(searchTimeout);
      const timeout = setTimeout(() => {
        dispatch(setFilters({ search: value }));
        dispatch(setPaginationModel({ ...paginationModel, page: 0 }));
      }, 300);
      setSearchTimeout(timeout);
    },
    [dispatch, paginationModel, searchTimeout]
  );

  // API Queries
  const {
    data: productsData,
    isLoading,
    isFetching,
  } = useGetProductsQuery({
    ...filters,
    tags: filters.tags?.join(",") || undefined,
    page: paginationModel.page,
    per_page: paginationModel.pageSize,
  });

  const { data: tagsData } = useGetTagsQuery();
  const { data: categoriesData } = useGetAllProductCateQuery();
  const [deleteProduct] = useDeleteProductMutation();

  const products = productsData?.data || [];
  const meta = productsData?.meta || {};
  const tags = tagsData?.data || [];
  const categories = categoriesData?.data || [];

  const handleDelete = async (product) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ",
      text: `ต้องการลบสินค้า "${product.sp_name}" หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: PRIMARY_RED,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        await deleteProduct(product.sp_id).unwrap();
        Swal.fire("สำเร็จ", "ลบสินค้าแล้ว", "success");
      } catch (err) {
        Swal.fire("ผิดพลาด", err?.data?.message || "ลบไม่สำเร็จ", "error");
      }
    }
  };

  const handlePageChange = (event, value) => {
    dispatch(setPaginationModel({ ...paginationModel, page: value - 1 }));
  };

  const handleCategoryFilter = (categoryId) => {
    dispatch(
      setFilters({
        category: filters.category === categoryId ? "" : categoryId,
      })
    );
    dispatch(setPaginationModel({ ...paginationModel, page: 0 }));
  };

  const handleTagFilter = (tagId) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((t) => t !== tagId)
      : [...currentTags, tagId];
    dispatch(setFilters({ tags: newTags }));
    dispatch(setPaginationModel({ ...paginationModel, page: 0 }));
  };

  const handleSortChange = (field) => {
    const newDir = filters.sort_by === field && filters.sort_dir === "asc" ? "desc" : "asc";
    dispatch(setFilters({ sort_by: field, sort_dir: newDir }));
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
    setSearchInput("");
    dispatch(setPaginationModel({ pageSize: 20, page: 0 }));
  };

  const hasActiveFilters =
    filters.search ||
    filters.category ||
    (filters.tags && filters.tags.length > 0) ||
    filters.country ||
    filters.currency;

  return {
    // Data
    products,
    meta,
    tags,
    categories,
    filters,
    paginationModel,

    // Loading states
    isLoading,
    isFetching,

    // UI states
    searchInput,
    showFilters,
    setShowFilters,
    viewMode,
    setViewMode,
    pdfOpen,
    setPdfOpen,
    hasActiveFilters,

    // Handlers
    handleSearchChange,
    handleDelete,
    handlePageChange,
    handleCategoryFilter,
    handleTagFilter,
    handleSortChange,
    handleResetFilters,
  };
};
