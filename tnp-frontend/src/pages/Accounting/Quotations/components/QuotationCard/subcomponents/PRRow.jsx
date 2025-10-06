import React from "react";
import { Box, Button, Chip, Collapse, Stack, Typography } from "@mui/material";
import PricingRequestNotesButton from "../../../../PricingIntegration/components/PricingRequestNotesButton";
import usePRRowLogic from "../hooks/usePRRowLogic";
import { getPricingViewUrl } from "../utils/urls";

export default function PRRow({ prId, items }) {
  const { isLoading, prNo, workName, imgUrl, grouped, formatTHB } = usePRRowLogic(prId, items);
  const [open, setOpen] = React.useState(false);

  const handleToggle = React.useCallback(() => {
    setOpen((value) => !value);
  }, []);

  return (
    <Box
      onClick={handleToggle}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        px: 1.25,
        py: 1,
        bgcolor: "background.paper",
        "&:hover": { borderColor: "primary.light", boxShadow: 1 },
        cursor: "pointer",
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, minWidth: 0 }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
            #{prNo.toString().replace(/^#/, "")}
          </Typography>
          <Typography variant="body1" noWrap sx={{ color: "text.secondary", minWidth: 0 }}>
            {isLoading ? "กำลังโหลด…" : workName}
          </Typography>
        </Box>
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
          onClick={(event) => event.stopPropagation()}
        >
          <PricingRequestNotesButton
            pricingRequestId={prId}
            workName={workName}
            size="small"
            showCount={false}
          />
          <Button
            variant="outlined"
            size="small"
            href={getPricingViewUrl(prId)}
            target="_blank"
            rel="noopener"
            sx={{ textTransform: "none", px: 1.25, py: 0.25, borderRadius: 1.5, alignSelf: "center" }}
          >
            ดูใบงานต้นฉบับ
          </Button>
        </Box>
      </Box>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box
          sx={{
            mt: 1,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: imgUrl ? "1fr 160px" : "1fr" },
            gap: 1.25,
          }}
        >
          <Stack spacing={1}>
            {grouped.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                ไม่มีรายละเอียดรายการสำหรับงานนี้
              </Typography>
            )}
            {grouped.map((group, groupIndex) => (
              <Box
                key={group.key || groupIndex}
                sx={{
                  p: 1.25,
                  border: "1px dashed",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  bgcolor: "background.paper",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 1,
                    flexWrap: "wrap",
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                      {group.name}
                    </Typography>
                    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                      {group.pattern && <Chip size="small" label={`แพทเทิร์น: ${group.pattern}`} variant="outlined" />}
                      {group.fabric && <Chip size="small" label={`ผ้า: ${group.fabric}`} variant="outlined" />}
                      {group.color && <Chip size="small" label={`สี: ${group.color}`} variant="outlined" />}
                    </Stack>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="caption" color="text.secondary">
                      ยอดรวมของงานนี้
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {formatTHB.format(group.total)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      รวมจำนวน {Number(group.totalQty || 0)} ชิ้น
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1.2fr 1fr 1fr 1.2fr",
                      gap: 0.75,
                      mb: 0.5,
                      p: 0.75,
                      bgcolor: "background.default",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      ไซส์
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>
                      ราคา/หน่วย
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>
                      จำนวน
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>
                      รวม
                    </Typography>
                  </Box>
                  {group.rows.map((row, rowIndex) => (
                    <Box
                      key={row.id || rowIndex}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1.2fr 1fr 1fr 1.2fr",
                        gap: 0.75,
                        py: 0.5,
                        px: 0.75,
                        bgcolor: rowIndex % 2 ? "background.default" : "transparent",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2">{row.size || "-"}</Typography>
                      <Typography variant="body2" sx={{ textAlign: "right" }}>
                        {formatTHB.format(Number(row.unit_price || 0))}
                      </Typography>
                      <Typography variant="body2" sx={{ textAlign: "right" }}>
                        {Number(row.quantity || 0)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, textAlign: "right" }}>
                        {formatTHB.format(Number(row.subtotal || 0))}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Stack>
          {imgUrl && (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
              <Box
                component="img"
                src={imgUrl}
                alt={workName}
                sx={{
                  maxWidth: 160,
                  maxHeight: 160,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              />
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
