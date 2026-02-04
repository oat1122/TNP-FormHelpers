import * as yup from "yup";

export const validationSchema = yup.object().shape({
  nb_customer_name: yup.string().required("กรุณาระบุชื่อลูกค้า"),
  nb_email: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v))
    .email("รูปแบบอีเมลไม่ถูกต้อง"),
  nb_contact_number: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  nb_manage_by: yup
    .mixed()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
});
