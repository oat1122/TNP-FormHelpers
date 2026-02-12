import { useState } from "react";
import Swal from "sweetalert2";

import {
  useGetCategoriesQuery,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "../../../features/Superlist/supplierApi";

const PRIMARY_RED = "#C1272D";

/**
 * Custom hook for category management
 * Handles CRUD operations for product categories
 */
export const useCategoryManagement = () => {
  const [newCategory, setNewCategory] = useState({ name: "", prefix: "" });
  const [editingCategory, setEditingCategory] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", prefix: "" });

  const { data: categoriesData, refetch } = useGetCategoriesQuery();
  const [addCategory] = useAddCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const categories = categoriesData?.data?.data || categoriesData?.data || [];

  const handleAdd = async () => {
    if (!newCategory.name.trim()) {
      Swal.fire("", "กรุณาใส่ชื่อหมวดหมู่", "warning");
      return;
    }
    try {
      await addCategory({
        mpc_name: newCategory.name,
        mpc_sku_prefix: newCategory.prefix,
      }).unwrap();
      setNewCategory({ name: "", prefix: "" });
      refetch();
    } catch (err) {
      Swal.fire("ผิดพลาด", err?.data?.message || "เพิ่มไม่สำเร็จ", "error");
    }
  };

  const handleStartEdit = (cat) => {
    setEditingCategory(cat.mpc_id);
    setEditForm({
      name: cat.mpc_name,
      prefix: cat.mpc_sku_prefix || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      Swal.fire("", "กรุณาใส่ชื่อหมวดหมู่", "warning");
      return;
    }
    try {
      await updateCategory({
        id: editingCategory,
        mpc_name: editForm.name,
        mpc_sku_prefix: editForm.prefix,
      }).unwrap();
      setEditingCategory(null);
      refetch();
    } catch (err) {
      Swal.fire("ผิดพลาด", err?.data?.message || "แก้ไขไม่สำเร็จ", "error");
    }
  };

  const handleDelete = async (cat) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ",
      text: `ต้องการลบหมวดหมู่ "${cat.mpc_name}" หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: PRIMARY_RED,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });
    if (result.isConfirmed) {
      try {
        await deleteCategory(cat.mpc_id).unwrap();
        refetch();
      } catch (err) {
        Swal.fire("ผิดพลาด", err?.data?.message || "ลบไม่สำเร็จ", "error");
      }
    }
  };

  return {
    // Data
    categories,

    // New category state
    newCategory,
    setNewCategory,

    // Edit state
    editingCategory,
    editForm,
    setEditForm,

    // Handlers
    handleAdd,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleDelete,
  };
};
