import { Add as AddIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useState } from "react";

import NoteItemGroupEditor from "./NoteItemGroupEditor";
import NoteItemRowEditor from "./NoteItemRowEditor";
import {
  InfoCard,
  tokens,
} from "../../../../PricingIntegration/components/styles/quotationFormStyles";
import { DEFAULT_ITEM_UNIT } from "../utils/editDialogConstants";

/**
 * ตาราง items + groups ของ delivery note สำหรับโหมดแก้ไข.
 * เดิม inline ใน DeliveryNoteEditDialog.jsx — ย้ายมาที่นี่เพื่อลด shell size.
 *
 * ถือ local edit state ของ group/row ที่กำลังถูกแก้ไข (UI-only — ไม่กระทบ groups
 * ที่ส่งกลับ parent จนกว่าจะกด "บันทึก" บนแต่ละ inline editor).
 */
const recalcTotals = (groupsList) =>
  groupsList.map((g) => ({
    ...g,
    totalQty: (g.rows || []).reduce((sum, row) => sum + (Number(row.quantity) || 0), 0),
  }));

const NoteItemsTable = ({ groups, setGroups, invoiceNumber, canEdit = true }) => {
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingRow, setEditingRow] = useState(null);

  const handleGroupFieldChange = (groupIndex, field, value) => {
    setGroups((prev) => prev.map((g, i) => (i === groupIndex ? { ...g, [field]: value } : g)));
  };

  const handleSaveGroup = () => {
    setEditingGroup(null);
    setGroups((prev) => recalcTotals(prev));
  };

  const handleEditRow = (groupIndex, rowIndex) => setEditingRow({ groupIndex, rowIndex });

  const handleCancelRow = () => setEditingRow(null);

  const handleSaveRow = () => {
    setEditingRow(null);
    setGroups((prev) => recalcTotals(prev));
  };

  const handleRowFieldChange = (groupIndex, rowIndex, field, value) => {
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi === groupIndex
          ? {
              ...g,
              rows: g.rows.map((r, ri) => (ri === rowIndex ? { ...r, [field]: value } : r)),
            }
          : g
      )
    );
  };

  const handleAddRow = (groupIndex) => {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? {
              ...g,
              rows: [
                ...g.rows,
                {
                  id: `tmp-${Date.now()}`,
                  size: "",
                  quantity: 0,
                  unit: DEFAULT_ITEM_UNIT,
                },
              ],
            }
          : g
      )
    );
  };

  const handleDeleteRow = (groupIndex, rowIndex) => {
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi === groupIndex ? { ...g, rows: g.rows.filter((_, ri) => ri !== rowIndex) } : g
      )
    );
  };

  const totalQty = groups.reduce((sum, g) => sum + (g.totalQty || 0), 0);

  return (
    <InfoCard>
      <Box sx={{ p: 2, borderBottom: `1px solid ${tokens.border}` }}>
        <Typography variant="subtitle2">
          รายการสินค้าจากใบแจ้งหนี้ {invoiceNumber || "-"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          แสดงข้อมูลจาก delivery_note_items ({groups.length} กลุ่ม) - สามารถแก้ไขได้
        </Typography>
      </Box>

      {groups.map((group, groupIndex) => (
        <Box key={group.key || groupIndex} sx={{ mb: 2 }}>
          <NoteItemGroupEditor
            group={group}
            groupIndex={groupIndex}
            isEditing={editingGroup === groupIndex}
            canEdit={canEdit}
            onStartEdit={setEditingGroup}
            onCancelEdit={() => setEditingGroup(null)}
            onSave={handleSaveGroup}
            onFieldChange={handleGroupFieldChange}
          />

          <Table size="small" sx={{ mt: 1 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.100" }}>
                <TableCell sx={{ fontWeight: 600, width: "30%" }}>ไซส์</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: "40%" }}>
                  จำนวน
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: "30%" }}>
                  การจัดการ
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {group.rows.map((row, rowIndex) => (
                <NoteItemRowEditor
                  key={row.id}
                  row={row}
                  groupIndex={groupIndex}
                  rowIndex={rowIndex}
                  isEditingRow={
                    editingRow?.groupIndex === groupIndex && editingRow?.rowIndex === rowIndex
                  }
                  canEdit={canEdit}
                  onEdit={handleEditRow}
                  onSave={handleSaveRow}
                  onCancel={handleCancelRow}
                  onDelete={handleDeleteRow}
                  onFieldChange={handleRowFieldChange}
                />
              ))}
              {canEdit && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    align="center"
                    sx={{ py: 2, borderTop: "2px dashed", borderColor: "divider" }}
                  >
                    <Button
                      size="medium"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddRow(groupIndex)}
                    >
                      เพิ่มไซส์ใหม่
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      ))}

      <Box sx={{ p: 2, borderTop: `1px solid ${tokens.border}`, bgcolor: "grey.50" }}>
        <Typography variant="body2">
          <strong>รวมทั้งหมด:</strong> {totalQty} ชิ้น
        </Typography>
        <Typography variant="caption" color="text.secondary">
          หมายเหตุ: การแก้ไขรายการงานจะถูกบันทึกเมื่อกดปุ่ม "บันทึก"
        </Typography>
      </Box>
    </InfoCard>
  );
};

export default NoteItemsTable;
