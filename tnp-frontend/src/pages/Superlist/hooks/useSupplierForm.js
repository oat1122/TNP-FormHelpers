import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import {
  useGetProductQuery,
  useAddProductMutation,
  useUpdateProductMutation,
  useLazyGetNextSkuQuery,
  useGetTagsQuery,
  useGetCategoriesQuery,
  useAddTagMutation,
  useGetSellersQuery,
} from "../../../features/Superlist/supplierApi";

/**
 * Custom hook for managing supplier form state and operations
 * Handles form fields, validation, submission, and tag management
 */
export const useSupplierForm = (mode) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = JSON.parse(localStorage.getItem("userData"));

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";

  // Form state
  const [form, setForm] = useState({
    sp_name: "",
    sp_description: "",
    sp_sku: "",
    sp_mpc_id: "",
    sp_ss_id: "",
    sp_origin_country: "",
    sp_supplier_name: "",
    sp_supplier_contact: "",
    sp_base_price: "",
    sp_currency: "THB",
    sp_price_thb: "",
    sp_exchange_rate: "",
    sp_exchange_date: "",
    sp_unit: "ชิ้น",
  });

  const [selectedTags, setSelectedTags] = useState([]);
  const [saving, setSaving] = useState(false);

  // API
  const { data: productData, isLoading: loadingProduct } = useGetProductQuery(id, { skip: !id });
  const { data: tagsData } = useGetTagsQuery();
  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: sellersData } = useGetSellersQuery();
  const [triggerNextSku] = useLazyGetNextSkuQuery();
  const [addProduct] = useAddProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [addTag] = useAddTagMutation();

  const tags = tagsData?.data || [];
  const categories = categoriesData?.data?.data || categoriesData?.data || [];
  const sellers = sellersData?.data || [];

  // Populate form when editing/viewing
  useEffect(() => {
    if (productData?.data && (isEdit || isView)) {
      const p = productData.data;
      setForm({
        sp_name: p.sp_name || "",
        sp_description: p.sp_description || "",
        sp_sku: p.sp_sku || "",
        sp_mpc_id: p.sp_mpc_id || "",
        sp_ss_id: p.sp_ss_id || "",
        sp_origin_country: p.sp_origin_country || "",
        sp_supplier_name: p.sp_supplier_name || "",
        sp_supplier_contact: p.sp_supplier_contact || "",
        sp_base_price: p.sp_base_price || "",
        sp_currency: p.sp_currency || "THB",
        sp_price_thb: p.sp_price_thb || "",
        sp_exchange_rate: p.sp_exchange_rate || "",
        sp_exchange_date: p.sp_exchange_date || "",
        sp_unit: p.sp_unit || "ชิ้น",
      });
      setSelectedTags(p.tags || []);
    }
  }, [productData, isEdit, isView]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Seller change → auto-fill supplier fields
  const handleSellerChange = (seller) => {
    if (seller) {
      setForm((prev) => ({
        ...prev,
        sp_ss_id: seller.ss_id,
        sp_supplier_name: seller.ss_company_name || "",
        sp_supplier_contact: [seller.ss_phone, seller.ss_contact_person].filter(Boolean).join(" / "),
        sp_origin_country: seller.ss_country || prev.sp_origin_country,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        sp_ss_id: "",
        sp_supplier_name: "",
        sp_supplier_contact: "",
      }));
    }
  };

  // Category change → auto generate SKU (create mode only)
  const handleCategoryChange = async (e) => {
    const categoryId = e.target.value;
    setForm((prev) => ({ ...prev, sp_mpc_id: categoryId }));

    if (isCreate && categoryId) {
      try {
        const res = await triggerNextSku(categoryId).unwrap();
        if (res?.data?.sku) {
          setForm((prev) => ({ ...prev, sp_sku: res.data.sku }));
        }
      } catch {
        // Silent fail — user can still type SKU manually
      }
    }
  };

  // Tag handling
  const handleCreateTag = async (tagName) => {
    try {
      const result = await addTag({ spt_name: tagName }).unwrap();
      if (result?.data) {
        setSelectedTags((prev) => [...prev, result.data]);
      }
    } catch (err) {
      if (err?.status === 409) {
        Swal.fire("", "Tag นี้มีอยู่แล้ว", "info");
      }
    }
  };

  const validateForm = () => {
    if (!form.sp_name.trim()) {
      Swal.fire("", "กรุณาใส่ชื่อสินค้า", "warning");
      return false;
    }
    if (!form.sp_base_price || parseFloat(form.sp_base_price) <= 0) {
      Swal.fire("", "กรุณาใส่ราคาพื้นฐาน", "warning");
      return false;
    }
    return true;
  };

  return {
    // State
    form,
    setForm,
    selectedTags,
    setSelectedTags,
    saving,
    setSaving,
    loadingProduct,

    // Data
    tags,
    categories,
    sellers,

    // Mode flags
    isView,
    isEdit,
    isCreate,
    user,
    id,

    // Handlers
    handleChange,
    handleCategoryChange,
    handleSellerChange,
    handleCreateTag,
    validateForm,

    // Navigation
    navigate,

    // Mutations
    addProduct,
    updateProduct,
  };
};
