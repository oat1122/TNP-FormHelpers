import { Box, Grid, Paper, Stack, TextField, Typography } from "@mui/material";

import { apiConfig } from "../../../../../../api/apiConfig";
import { tokens } from "../../../../shared/styles/tokens";

/**
 * Payment-side section for InvoiceCreateDialog.
 *
 * Holds notes textarea + signature gallery (read-only — inherited from
 * source quotation). The deposit + payment-terms controls live in
 * DepositSection (separate tab).
 */
const PaymentSection = ({ notes, onChangeNotes, signatureImages, onPreviewImage }) => {
  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ p: 3, border: `1px solid ${tokens.borderLight}` }}>
        <Typography variant="subtitle1" fontWeight={700} mb={2}>
          หมายเหตุ
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={notes}
          onChange={(e) => onChangeNotes(e.target.value)}
          placeholder="กรอกหมายเหตุเพิ่มเติม"
        />
      </Paper>

      <Paper elevation={0} sx={{ p: 3, border: `1px solid ${tokens.borderLight}` }}>
        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight={700}>
            หลักฐานการเซ็น
          </Typography>
          <Typography variant="caption" color="text.secondary">
            รูปภาพหลักฐานการเซ็นจากใบเสนอราคา
          </Typography>
        </Box>

        {signatureImages.length === 0 ? (
          <Box sx={{ p: 2, textAlign: "center", bgcolor: "grey.50", borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              ยังไม่มีรูปหลักฐานการเซ็น
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {signatureImages.map((img, idx) => {
              const apiBase = apiConfig.baseUrl || "";
              const origin = (() => {
                try {
                  if (!apiBase) return "";
                  const u = new URL(apiBase);
                  return u.origin;
                } catch {
                  return apiBase.replace(/\/api\b.*$/, "");
                }
              })();
              const normalize = (u) => {
                if (!u) return "";
                if (/^https?:/i.test(u)) return u;
                if (u.startsWith("//")) return window.location.protocol + u;
                if (u.startsWith("/")) return origin + u;
                if (u.startsWith("storage/")) return origin + "/" + u;
                return u;
              };
              let urlCandidate = img?.url || "";
              if (!urlCandidate && img?.path) {
                urlCandidate = "storage/" + img.path.replace(/^public\//, "");
              }
              const finalUrl = normalize(urlCandidate);
              return (
                <Grid item key={idx} xs={6} md={3}>
                  <Box
                    sx={{
                      border: `1px solid ${tokens.borderLight}`,
                      borderRadius: 1,
                      p: 1,
                      bgcolor: "#fff",
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      onPreviewImage({
                        url: finalUrl,
                        filename: img.original_filename || img.filename,
                        idx,
                      })
                    }
                  >
                    <Box
                      sx={{
                        position: "relative",
                        pb: "70%",
                        overflow: "hidden",
                        borderRadius: 1,
                        mb: 1,
                        background: "#fafafa",
                      }}
                    >
                      <img
                        src={finalUrl}
                        alt={img.filename}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ display: "block", wordBreak: "break-all" }}>
                      {img.original_filename || img.filename}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Paper>
    </Stack>
  );
};

export default PaymentSection;
