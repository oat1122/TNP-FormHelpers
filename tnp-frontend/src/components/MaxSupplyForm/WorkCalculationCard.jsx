import React from "react";
import { Card, CardContent, Typography, Alert } from "@mui/material";
import { Build } from "@mui/icons-material";

const WorkCalculationCard = ({ formData, isAutoFilled, language = "th", t = (key) => key }) => {
  if (!isAutoFilled) return null;

  return (
    <Card sx={{ borderRadius: { xs: 2, md: 1 } }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography
          variant="h6"
          gutterBottom
          className={language === "my" ? "myanmar-text" : ""}
          sx={{ fontSize: { xs: "1.1rem", md: "1.25rem" } }}
        >
          <Build sx={{ mr: 1, verticalAlign: "middle" }} />
          {t("workCalculationByType")}
        </Typography>

        <Alert
          severity="info"
          sx={{
            mb: 2,
            "& .MuiAlert-message": {
              fontSize: { xs: "0.875rem", md: "0.875rem" },
            },
          }}
        >
          <Typography variant="body2" className={language === "my" ? "myanmar-text" : ""}>
            <strong>{t("workCalculationFromWorksheet")}</strong>
            <br />
            {(() => {
              const workCalculations = [];

              if (formData.print_locations?.screen?.enabled) {
                const points = formData.print_locations.screen.points;
                const totalWork = points * formData.total_quantity;
                const calculation =
                  language === "th"
                    ? `Screen Printing ${points} ${t("pointsLabel")} ${t("totalShirts")} ${formData.total_quantity} ${t("pieces")} (${points}×${formData.total_quantity}=${totalWork}) ${t("screenPrintingWork")} ${totalWork}`
                    : `Screen Printing ${points} ${t("pointsLabel")} ${t("totalShirts")} ${formData.total_quantity} ${t("pieces")} (${points}×${formData.total_quantity}=${totalWork}) ${t("screenPrintingWork")} ${totalWork}`;
                workCalculations.push(calculation);
              }

              if (formData.print_locations?.dtf?.enabled) {
                const points = formData.print_locations.dtf.points;
                const totalWork = points * formData.total_quantity;
                const calculation =
                  language === "th"
                    ? `DTF (Direct Film Transfer) ${points} ${t("pointsLabel")} ${t("totalShirts")} ${formData.total_quantity} ${t("pieces")} (${points}×${formData.total_quantity}=${totalWork}) ${t("dtfWork")} ${totalWork}`
                    : `DTF (Direct Film Transfer) ${points} ${t("pointsLabel")} ${t("totalShirts")} ${formData.total_quantity} ${t("pieces")} (${points}×${formData.total_quantity}=${totalWork}) ${t("dtfWork")} ${totalWork}`;
                workCalculations.push(calculation);
              }

              if (formData.print_locations?.sublimation?.enabled) {
                const points = formData.print_locations.sublimation.points;
                const totalWork = points * formData.total_quantity;
                const calculation =
                  language === "th"
                    ? `Sublimation/Flex ${points} ${t("pointsLabel")} ${t("totalShirts")} ${formData.total_quantity} ${t("pieces")} (${points}×${formData.total_quantity}=${totalWork}) ${t("sublimationWork")} ${totalWork}`
                    : `Sublimation/Flex ${points} ${t("pointsLabel")} ${t("totalShirts")} ${formData.total_quantity} ${t("pieces")} (${points}×${formData.total_quantity}=${totalWork}) ${t("sublimationWork")} ${totalWork}`;
                workCalculations.push(calculation);
              }

              if (formData.print_locations?.embroidery?.enabled) {
                const points = formData.print_locations.embroidery.points;
                const totalWork = points * formData.total_quantity;
                const calculation =
                  language === "th"
                    ? `Embroidery (ปัก) ${points} ${t("pointsLabel")} ${t("totalShirts")} ${formData.total_quantity} ${t("pieces")} (${points}×${formData.total_quantity}=${totalWork}) ${t("embroideryWork")} ${totalWork}`
                    : `Embroidery ${points} ${t("pointsLabel")} ${t("totalShirts")} ${formData.total_quantity} ${t("pieces")} (${points}×${formData.total_quantity}=${totalWork}) ${t("embroideryWork")} ${totalWork}`;
                workCalculations.push(calculation);
              }

              if (workCalculations.length === 0) {
                return language === "th"
                  ? "ไม่พบข้อมูลการพิมพ์/ปัก"
                  : "ပရင့်/ပန်း အချက်အလက်မတွေ့ပါ";
              }

              return workCalculations.map((calc, index) => (
                <span key={index}>
                  {calc}
                  {index < workCalculations.length - 1 && <br />}
                </span>
              ));
            })()}
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default WorkCalculationCard;
