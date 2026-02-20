import { useState } from "react";
import Swal from "sweetalert2";

import {
  useUploadImagesMutation,
  useSetCoverImageMutation,
  useDeleteImageMutation,
} from "../../../../../features/Superlist/supplierApi";
import { PRIMARY_RED } from "../../../utils";

/**
 * Custom hook for managing supplier product images
 * Handles image upload, preview, deletion, and cover image setting
 */
export const useSupplierImages = (productId, initialImages = []) => {
  const [existingImages, setExistingImages] = useState(initialImages);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  const [uploadImages] = useUploadImagesMutation();
  const [setCoverImage] = useSetCoverImageMutation();
  const [deleteImage] = useDeleteImageMutation();

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setNewImageFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewImagePreviews((prev) => [...prev, { url: ev.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveNewImage = (index) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetCover = async (imageId) => {
    if (!productId) return;
    try {
      await setCoverImage({ productId, imageId }).unwrap();
      setExistingImages((prev) =>
        prev.map((img) => ({
          ...img,
          spi_is_cover: img.spi_id === imageId,
        }))
      );
    } catch {
      Swal.fire("ผิดพลาด", "ตั้งรูปปกไม่สำเร็จ", "error");
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!productId) return;
    const result = await Swal.fire({
      title: "ลบรูปภาพ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: PRIMARY_RED,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });
    if (result.isConfirmed) {
      try {
        await deleteImage({ productId, imageId }).unwrap();
        setExistingImages((prev) => prev.filter((img) => img.spi_id !== imageId));
      } catch {
        Swal.fire("ผิดพลาด", "ลบรูปไม่สำเร็จ", "error");
      }
    }
  };

  const uploadNewImages = async (productId) => {
    if (newImageFiles.length > 0 && productId) {
      const formData = new FormData();
      newImageFiles.forEach((file) => {
        formData.append("images[]", file);
      });
      await uploadImages({ id: productId, formData }).unwrap();
    }
  };

  return {
    // State
    existingImages,
    setExistingImages,
    newImageFiles,
    newImagePreviews,

    // Handlers
    handleImageSelect,
    handleRemoveNewImage,
    handleSetCover,
    handleDeleteImage,
    uploadNewImages,
  };
};
