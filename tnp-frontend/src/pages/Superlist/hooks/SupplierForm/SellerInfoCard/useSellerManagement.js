import { useState } from "react";
import Swal from "sweetalert2";

import {
  useGetSellersQuery,
  useAddSellerMutation,
  useUpdateSellerMutation,
  useDeleteSellerMutation,
  useLazyGetSellerPhoneLogsQuery,
} from "../../../../../features/Superlist/supplierApi";
import { PRIMARY_RED } from "../../../utils";

/**
 * Custom hook for managing sellers (CRUD + phone logs)
 */
export const useSellerManagement = () => {
  const { data: sellersData, isLoading } = useGetSellersQuery();
  const [addSeller, { isLoading: adding }] = useAddSellerMutation();
  const [updateSeller, { isLoading: updating }] = useUpdateSellerMutation();
  const [deleteSeller] = useDeleteSellerMutation();
  const [triggerPhoneLogs] = useLazyGetSellerPhoneLogsQuery();

  const sellers = sellersData?.data || [];

  // New seller form
  const emptyForm = {
    ss_company_name: "",
    ss_tax_id: "",
    ss_phone: "",
    ss_country: "",
    ss_address: "",
    ss_contact_person: "",
    ss_remark: "",
  };

  const [newSeller, setNewSeller] = useState({ ...emptyForm });
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });

  // Phone log state
  const [phoneLogSellerId, setPhoneLogSellerId] = useState(null);
  const [phoneLogs, setPhoneLogs] = useState([]);
  const [phoneLogsLoading, setPhoneLogsLoading] = useState(false);

  const handleAdd = async () => {
    if (!newSeller.ss_company_name.trim()) {
      Swal.fire("", "กรุณาใส่ชื่อบริษัท", "warning");
      return;
    }
    try {
      const res = await addSeller(newSeller).unwrap();
      Swal.fire("", res.message || "สร้าง Seller สำเร็จ", "success");
      setNewSeller({ ...emptyForm });
      setShowAddForm(false);
    } catch (err) {
      Swal.fire("", err?.data?.message || "เกิดข้อผิดพลาด", "error");
    }
  };

  const handleStartEdit = (seller) => {
    setEditingId(seller.ss_id);
    setEditForm({
      ss_company_name: seller.ss_company_name || "",
      ss_tax_id: seller.ss_tax_id || "",
      ss_phone: seller.ss_phone || "",
      ss_country: seller.ss_country || "",
      ss_address: seller.ss_address || "",
      ss_contact_person: seller.ss_contact_person || "",
      ss_remark: seller.ss_remark || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async () => {
    if (!editForm.ss_company_name.trim()) {
      Swal.fire("", "กรุณาใส่ชื่อบริษัท", "warning");
      return;
    }
    try {
      const res = await updateSeller({ id: editingId, ...editForm }).unwrap();
      Swal.fire("", res.message || "แก้ไข Seller สำเร็จ", "success");
      setEditingId(null);
    } catch (err) {
      Swal.fire("", err?.data?.message || "เกิดข้อผิดพลาด", "error");
    }
  };

  const handleDelete = async (seller) => {
    const result = await Swal.fire({
      title: "ลบ Seller?",
      text: `ต้องการลบ "${seller.ss_company_name}" หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: PRIMARY_RED,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await deleteSeller(seller.ss_id).unwrap();
      Swal.fire("", res.message || "ลบ Seller สำเร็จ", "success");
    } catch (err) {
      Swal.fire("", err?.data?.message || "เกิดข้อผิดพลาด", "error");
    }
  };

  const handleOpenPhoneLogs = async (sellerId) => {
    setPhoneLogSellerId(sellerId);
    setPhoneLogsLoading(true);
    try {
      const res = await triggerPhoneLogs(sellerId).unwrap();
      setPhoneLogs(res?.data || []);
    } catch {
      setPhoneLogs([]);
    } finally {
      setPhoneLogsLoading(false);
    }
  };

  const handleClosePhoneLogs = () => {
    setPhoneLogSellerId(null);
    setPhoneLogs([]);
  };

  return {
    // Data
    sellers,
    isLoading,

    // Add
    newSeller,
    setNewSeller,
    showAddForm,
    setShowAddForm,
    adding,
    handleAdd,

    // Edit
    editingId,
    editForm,
    setEditForm,
    updating,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,

    // Delete
    handleDelete,

    // Phone logs
    phoneLogSellerId,
    phoneLogs,
    phoneLogsLoading,
    handleOpenPhoneLogs,
    handleClosePhoneLogs,
  };
};
