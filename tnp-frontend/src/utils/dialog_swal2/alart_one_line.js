import Swal from "sweetalert2"
import "./dialog_swal2.css";

export function open_dialog_error(title,text) {
//get api data
  Swal.fire({
    title: title,
    text: text,
    icon: 'error',
    confirmButtonText:'Close',
    confirmButtonColor: '#C10000',
    customClass: {
      container: "swal2-styled",
    },
  })
}

export function open_dialog_error_timer(title,text) {
//get api data
  Swal.fire({
    title: title,
    text: text + ' Close in 1.5 S',
    icon: 'error',
    timer: 1500,
    confirmButtonText:'Close',
    confirmButtonColor: '#C10000',
  })
}

export function open_dialog_ok(title,text) {
//get api data
  Swal.fire({
    title: title,
    text: text ,
    icon: 'success',
    confirmButtonText:'Close',
    confirmButtonColor: '#05b187',
  })
}

export function open_dialog_ok_timer(title) {
//get api data

  return new Promise((resolve) => {
    Swal.fire({
      title: title,
      // text: text + ' Close in 1 S',
      icon: 'success',
      timer: 1300,
      showConfirmButton: false,
      // confirmButtonText:'Close',
      // confirmButtonColor: '#05b187',
      customClass: {
        container: "swal2-styled",
      },
    }).then((result) => {
      resolve(result);
    })
  })
}

export function open_dialog_warning(title,text) {
  //get api data
  return new Promise((resolve) => {
    Swal.fire({
      title: title,
      text: text ,
      icon: 'warning',
      confirmButtonText:'ปิด',
      confirmButtonColor: '#FFA726',
    }).then((result) => {
      resolve(result);
    })
  })
}

export function open_dialog_loading() {
  Swal.fire({
    title: 'กำลังประมวลผล',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading()
    },
    customClass: {
      container: "swal2-styled",
    },
  })
}

export function open_dialog_three_btn(title, cancelBtnText, confirmBtnText, denyBtnText) {
  return new Promise((resolve) => {
    Swal.fire({
      title: title,
      showDenyButton: true,
      showCancelButton: true,
      cancelButtonText: cancelBtnText,
      confirmButtonText: confirmBtnText,
      denyButtonText: denyBtnText
    }).then((result) => {
      resolve(result);
    })
  })
}
