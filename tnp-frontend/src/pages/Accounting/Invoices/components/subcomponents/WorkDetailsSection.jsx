/**
 * Component for displaying work details and items list
 */

import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import WorkIcon from "@mui/icons-material/Work";
import { formatItemsList } from "../utils/invoiceLogic";

const WorkDetailsSection = ({ invoice }) => {
  const itemsListText = formatItemsList(invoice);

  return (
    <>
      {/* Work Details */}
      {(itemsListText || invoice?.work_name) && (
        <Box mb={2.5}>
          <Stack spacing={1.25}>
            {itemsListText && (
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <WorkIcon
                    fontSize="small"
                    color="primary"
                    sx={{ mt: 0.2, flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  <Box flex={1}>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: "primary.main",
                        lineHeight: 1.45,
                        fontSize: "0.95rem",
                      }}
                    >
                      {itemsListText}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}

            {!itemsListText && invoice?.work_name && (
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <WorkIcon
                    fontSize="small"
                    color="action"
                    sx={{ mt: 0.2, flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  <Box flex={1}>
                    <Typography sx={{ lineHeight: 1.45, fontSize: "0.9rem" }}>
                      <Box component="span" sx={{ fontWeight: 500, color: "text.primary" }}>
                        ชื่องาน:
                      </Box>{" "}
                      <Box component="span" sx={{ color: "text.secondary" }}>
                        {invoice.work_name}
                      </Box>
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}

            {/* รายละเอียดเพิ่มเติม */}
            {(invoice?.fabric_type ||
              invoice?.pattern ||
              invoice?.color ||
              invoice?.sizes ||
              invoice?.quantity) && (
              <Box sx={{ ml: 4.5 }}>
                <Stack spacing={0.5}>
                  {(invoice?.fabric_type || invoice?.pattern || invoice?.color) && (
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={{ xs: 0.5, sm: 2 }}
                      flexWrap="wrap"
                    >
                      {invoice?.fabric_type && (
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", fontSize: "0.8rem", lineHeight: 1.45 }}
                        >
                          <Box component="span" sx={{ fontWeight: 500, mr: 0.5 }}>
                            ชนิดผ้า:
                          </Box>
                          {invoice.fabric_type}
                        </Typography>
                      )}
                      {invoice?.pattern && (
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", fontSize: "0.8rem", lineHeight: 1.45 }}
                        >
                          <Box component="span" sx={{ fontWeight: 500, mr: 0.5 }}>
                            แพทเทิร์น:
                          </Box>
                          {invoice.pattern}
                        </Typography>
                      )}
                      {invoice?.color && (
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", fontSize: "0.8rem", lineHeight: 1.45 }}
                        >
                          <Box component="span" sx={{ fontWeight: 500, mr: 0.5 }}>
                            สี:
                          </Box>
                          {invoice.color}
                        </Typography>
                      )}
                    </Stack>
                  )}

                  {(invoice?.sizes || invoice?.quantity) && (
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", fontSize: "0.8rem", lineHeight: 1.45 }}
                    >
                      {invoice?.sizes && (
                        <>
                          <Box component="span" sx={{ fontWeight: 500 }}>
                            ไซซ์:
                          </Box>{" "}
                          {invoice.sizes}
                        </>
                      )}
                      {invoice?.sizes && invoice?.quantity && " • "}
                      {invoice?.quantity && (
                        <>
                          <Box component="span" sx={{ fontWeight: 500 }}>
                            จำนวน:
                          </Box>{" "}
                          {invoice.quantity}
                        </>
                      )}
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>
      )}
    </>
  );
};

export default WorkDetailsSection;
