import {
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid2 as Grid,
  styled,
} from "@mui/material";
import { skipToken } from "@reduxjs/toolkit/dist/query";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import CustomerSect from "./PricingForm/CustomerSect";
import ImageSect from "./PricingForm/ImageSect";
import NoteSect from "./PricingForm/NoteSect";
import PricingDetailSect from "./PricingForm/PricingDetailSect";
import TitleBar from "../../components/TitleBar";
import {
  useAddPricingReqMutation,
  useUpdatePricingReqMutation,
  useGetPricingQuery,
} from "../../features/Pricing/pricingApi";
import { setMode, setImagePreviewForm } from "../../features/Pricing/pricingSlice";
import { validateValue } from "../../features/Pricing/pricingUtils";
import { open_dialog_three_btn } from "../../utils/dialog_swal2/alart_one_line";
import {
  open_dialog_ok_timer,
  open_dialog_error,
  open_dialog_loading,
} from "../../utils/import_lib";

const VerticalDivider = styled(Divider)(({ theme }) => ({
  marginInline: 0,
  marginBlock: 24,
  borderBottomWidth: 2,
  borderColor: theme.vars.palette.grey[500],
}));

function PricingForm(props) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const inputList = useSelector((state) => state.pricing.inputList);
  const {
    register,
    setValue,
    getValues,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: inputList,
  });

  // ค่าสถานะการส่งฟอร์ม
  const mapSubmitActions = {
    SAVE: "save",
    REQUEST: "request",
    PRICING: "pricing",
    REJECT: "reject",
  };
  const { id } = useParams();
  const user = JSON.parse(localStorage.getItem("userData"));
  const mode = useSelector((state) => state.pricing.mode);
  const formRef = useRef(null);
  const [addPricingReq] = useAddPricingReqMutation();
  const [updatePricingReq] = useUpdatePricingReqMutation();
  const { data, error, isLoading } = useGetPricingQuery(!id ? skipToken : id);
  const [submitAction, setSubmitAction] = useState(mapSubmitActions.SAVE); // สถานะบันทึกและส่งคำขอ หรือให้ราคา

  const handleCancel = () => {
    navigate("/pricing");
  };

  const renderActionButton = (mode, user_role, pr_status_id = "") => {
    const buttonRendered = [];

    const viewMode = mode === "view";
    const isSale = user_role === "sale";
    const isManagerOrProduction = user_role === "manager" || user_role === "production";

    // สถานะที่แสดงปุ่ม "บันทึก" กรณีเป็นเซล
    const submitBtnRenderBySale =
      isSale &&
      [
        "20db7a92-092b-11f0-b223-38ca84abdf0a", // รอส่งคำขอ
      ].includes(pr_status_id);

    // สถานะที่แสดงปุ่ม "บันทึก" กรณีเป็นผู้จัดการหรือฝ่ายผลิต
    const submitBtnRenderByManager =
      isManagerOrProduction &&
      [
        "20db8b15-092b-11f0-b223-38ca84abdf0a", // รอทำราคา
        "20db8be1-092b-11f0-b223-38ca84abdf0a", // ได้ราคาแล้ว
        "20db8c29-092b-11f0-b223-38ca84abdf0a", // แก้ไขรอทำราคา
        "20db8cbf-092b-11f0-b223-38ca84abdf0a", // ปฏิเสธงาน
        "20db8cf1-092b-11f0-b223-38ca84abdf0a", // ทำราคาไม่ได้
      ].includes(pr_status_id);

    // สถานะที่แสดงปุ่ม "บันทึกและส่งคำขอ" กรณีเป็นเซล
    const submitReqBtnRenderBySale =
      isSale &&
      [
        "20db7a92-092b-11f0-b223-38ca84abdf0a", // รอส่งคำขอ
        "20db8be1-092b-11f0-b223-38ca84abdf0a", // ได้ราคาแล้ว
        "20db8cbf-092b-11f0-b223-38ca84abdf0a", // ปฏิเสธงาน
        "20db8cf1-092b-11f0-b223-38ca84abdf0a", // ทำราคาไม่ได้
      ].includes(pr_status_id);

    // สถานะที่แสดงปุ่ม "บันทึกและให้ราคา" และปุ่ม "บันทึกและปฏิเสธ" กรณีเป็นผู้จัดการหรือฝ่ายผลิต
    const submitPricingBtnRenderByManager =
      isManagerOrProduction &&
      [
        "20db8b15-092b-11f0-b223-38ca84abdf0a", // รอทำราคา
        "20db8c29-092b-11f0-b223-38ca84abdf0a", // แก้ไขรอทำราคา
      ].includes(pr_status_id);

    // แสดงปุ่ม "บันทึกและส่งคำขอ"
    if (!viewMode && submitReqBtnRenderBySale) {
      buttonRendered.push(
        <Grid key="submit-request-button" size={{ xs: 12, sm: 6, md: 2, lg: 1.4, xl: 1 }}>
          <Button
            fullWidth
            type="submit"
            variant="contained"
            color="error"
            sx={{ height: 40 }}
            onClick={() => setSubmitAction(mapSubmitActions.REQUEST)}
          >
            บันทึกและส่งคำขอ
          </Button>
        </Grid>
      );
    }

    // แสดงปุ่ม "บันทึกและให้ราคา" และ "บันทึกและปฏิเสธ"
    if (!viewMode && submitPricingBtnRenderByManager) {
      buttonRendered.push(
        <>
          <Grid key="submit-pricing-button" size={{ xs: 12, sm: 6, md: 2, lg: 1.4, xl: 1.1 }}>
            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="error"
              sx={{ height: 40 }}
              onClick={() => setSubmitAction(mapSubmitActions.PRICING)}
            >
              บันทึกและให้ราคา
            </Button>
          </Grid>
          <Grid key="submit-reject-button" size={{ xs: 12, sm: 6, md: 2, lg: 1.4, xl: 1.1 }}>
            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="error"
              sx={{ height: 40 }}
              onClick={() => setSubmitAction(mapSubmitActions.REJECT)}
            >
              บันทึกและปฏิเสธ
            </Button>
          </Grid>
        </>
      );
    }

    // แสดงปุ่ม "บันทึก"
    if (
      !viewMode &&
      (submitBtnRenderBySale ||
        submitBtnRenderByManager ||
        pr_status_id === "" ||
        user.role === "admin")
    ) {
      buttonRendered.push(
        <Grid key="submit-button" size={{ xs: 12, sm: 6, md: 2, lg: 1.4, xl: 1 }}>
          <Button
            fullWidth
            type="submit"
            variant="contained"
            color="error"
            sx={{ height: 40 }}
            onClick={() => setSubmitAction(mapSubmitActions.SAVE)}
          >
            บันทึก
          </Button>
        </Grid>
      );
    }

    buttonRendered.push(
      <Grid
        key="cancel-button"
        size={{
          xs: 12,
          sm: submitReqBtnRenderBySale && submitBtnRenderBySale ? 12 : 6,
          md: 2,
          lg: 1.4,
          xl: 1,
        }}
      >
        <Button
          fullWidth
          variant="outlined"
          color="error"
          onClick={handleCancel}
          sx={{
            height: 40,
          }}
        >
          ยกเลิก
        </Button>
      </Grid>
    );

    return buttonRendered;
  };

  const onSubmit = async (formData) => {
    // console.log("formData: ", formData)
    // return;
    let res;
    let action = submitAction;

    // เช็คค่าที่บังคับกรอก
    const validationError = validateValue({ formData });
    if (validationError) {
      open_dialog_error(validationError);
      return;
    }

    try {
      if (mapSubmitActions.REJECT === submitAction) {
        const reject_result = await open_dialog_three_btn(
          "เหตุผลการปฏิเสธคำขอ",
          "ยกเลิก",
          "ปฏิเสธงาน",
          "ทำราคาไม่ได้"
        );

        if (reject_result.isConfirmed) {
          action = "reject"; // ปฏิเสธงาน
        } else if (reject_result.isDenied) {
          action = "cannot_pricing"; // ทำราคาไม่ได้
        } else {
          return;
        }
      }

      open_dialog_loading();

      if (mode === "create") {
        res = await addPricingReq(formData).unwrap();
      } else {
        // ไอดีผู้อัปเดตข้อมูล
        formData.pr_updated_by = user.user_uuid;
        formData.submit_action = action;

        res = await updatePricingReq(formData).unwrap();
      }

      if (res.status === "success") {
        open_dialog_ok_timer("บันทึกข้อมูลสำเร็จ").then((result) => {
          navigate("/pricing");
        });
      } else {
        open_dialog_error(res.message);
        console.error(res);
      }
    } catch (error) {
      open_dialog_error(error.status, error.data.message);
      console.error(error);
    }
  };

  useEffect(() => {
    if (isLoading) {
      open_dialog_loading();
    }
  }, [isLoading]);

  useEffect(() => {
    if (data) {
      reset(data.data);

      // ใส่ค่ารูปภาพให้กับ state สำหรับแสดงรูปภาพ
      if (data.data?.pr_image) {
        dispatch(setImagePreviewForm(data.data?.pr_image));
      }

      Swal.close();
    } else if (error) {
      console.error("Error fetching pricing request:", error);
      open_dialog_error("Error fetching pricing request", error);
    }
  }, [data, error]);

  useEffect(() => {
    if (!id) {
      setValue("pr_created_by", user.user_uuid);
      setValue("pr_updated_by", user.user_uuid);
    }
  }, [id]);

  useEffect(() => {
    dispatch(setMode(props.mode));
  }, []);

  return (
    <div className="pricing-form" style={{ backgroundColor: "#fafaf9" }}>
      <TitleBar title={`${props.mode || (!id && "create")} pricing`} />

      <Container maxWidth="xxl" sx={{ marginBottom: "1.5rem", justifyItems: "center" }}>
        <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
          <Card
            sx={(theme) => ({
              minWidth: 275,
              maxWidth: 1900,
              marginTop: 2,
              borderRadius: `calc(${theme.vars.shape.borderRadius} * 2)`, // Access `shape` directly from `theme`
            })}
          >
            <CardContent sx={{ padding: { xs: 2, xl: 3 } }}>
              <Grid container spacing={0}>
                {/* ---------- Start column 1 - customer and images ---------- */}
                <Grid size={{ xs: 12, lg: 3 }}>
                  <Grid container spacing={0}>
                    <Grid size={{ xs: 12, sm: 6, lg: 12 }}>
                      <CustomerSect
                        id={id}
                        register={register}
                        setValue={setValue}
                        control={control}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 0, lg: 12 }}>
                      <VerticalDivider variant="middle" sx={{ marginTop: 2.2 }} />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, lg: 12 }}>
                      <ImageSect
                        register={register}
                        setValue={setValue}
                        getValues={getValues}
                        control={control}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }} sx={{ display: { xs: "block", lg: "none" } }}>
                      <VerticalDivider variant="middle" sx={{ marginBlock: 2 }} />
                    </Grid>
                  </Grid>
                </Grid>
                {/* ---------- End column 1 - customer and images ---------- */}

                {/* ---------- Start column 2 - pricing request detail ---------- */}
                <Grid size={{ xs: 12, lg: 6 }} sx={{ paddingInline: { lg: 2 } }}>
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 12 }}>
                      <PricingDetailSect errors={errors} register={register} control={control} />
                    </Grid>

                    <Grid size={{ xs: 12 }} sx={{ display: { xs: "block", lg: "none" } }}>
                      <VerticalDivider variant="middle" sx={{ marginTop: 2 }} />
                    </Grid>
                  </Grid>
                </Grid>
                {/* ---------- End column 2 - pricing request detail ---------- */}

                {/* ---------- Start column 3 - note ---------- */}
                <Grid size={{ xs: 12, lg: 3 }} sx={{ paddingInline: { xs: 1, lg: 0 } }}>
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 12 }}>
                      <NoteSect register={register} control={control} getValues={getValues} />
                    </Grid>
                  </Grid>
                </Grid>
                {/* ---------- End column 3 - note ---------- */}

                <Grid size={{ xs: 12 }} sx={{ display: { xs: "block" } }}>
                  <VerticalDivider variant="middle" sx={{ marginTop: { xs: 3, md: 5 } }} />
                </Grid>

                {/* ---------- Start action button ---------- */}
                <Grid
                  size={{ xs: 12 }}
                  sx={{
                    paddingInline: { xs: 1, lg: 0 },
                    marginTop: { md: 2, lg: 0, xl: 1 },
                  }}
                >
                  <Grid container spacing={2} sx={{ justifyContent: "end" }}>
                    {renderActionButton(mode, user.role, getValues("pr_status_id"))}
                  </Grid>
                </Grid>
                {/* ---------- End action button ---------- */}
              </Grid>
            </CardContent>
          </Card>
        </form>
      </Container>
    </div>
  );
}

export default PricingForm;
