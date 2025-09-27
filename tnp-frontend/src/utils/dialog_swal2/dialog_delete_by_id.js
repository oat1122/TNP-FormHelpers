import Swal from "sweetalert2";
import "./dialog_swal2.css";

export function dialog_delete_by_id(title) {
  return new Promise((resolve) => {
    Swal.fire({
      title: title,
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete",
      reverseButtons: true,
      customClass: {
        confirmButton: "swal2-worksheet",
        cancelButton: "swal2-worksheet",
      },
    }).then((result) => {
      resolve(result.isConfirmed);
    });
  });
}

export function swal_delete_by_id(title) {
  return new Promise((resolve) => {
    Swal.fire({
      title: title,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      reverseButtons: false,
      customClass: {
        confirmButton: "swal2-styled",
        cancelButton: "swal2-styled",
        title: "swal2-styled",
        container: "swal2-styled",
      },
    }).then((result) => {
      resolve(result.isConfirmed);
    });
  });
}
