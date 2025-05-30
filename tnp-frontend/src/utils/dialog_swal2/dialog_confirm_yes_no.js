import Swal from "sweetalert2";

export function dialog_confirm_yes_no(title) {
    return new Promise(resolve => {
        Swal.fire({
            title: title,
            // text: "You won't be able to revert this!",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#4CAF50',
            cancelButtonColor: '#F57F17',
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            // reverseButtons: true,
            // allowOutsideClick:false
        }).then((result) => {
            resolve(result.isConfirmed)
        })
    })
}