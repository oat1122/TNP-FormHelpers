import InvoicePdfViewerDialog from "./InvoicePdfViewerDialog";
import InvoiceSaveConfirmDialog from "../../subcomponents/InvoiceSaveConfirmDialog";
import UnsavedChangesDialog from "../../subcomponents/UnsavedChangesDialog";

/**
 * รวม modal เสริมทั้ง 3 ของ InvoiceDetailDialog ไว้ที่เดียว:
 *  1) InvoicePdfViewerDialog — iframe preview (เก็บไว้เผื่อใช้ในอนาคต)
 *  2) UnsavedChangesDialog — เตือนเมื่อปิดทั้งที่มี dirty edits
 *  3) InvoiceSaveConfirmDialog — ขออนุญาตเมื่อกด save แต่มี warning
 */
const InvoiceSideModals = ({ pdfViewer, unsaved, saveConfirm }) => (
  <>
    <InvoicePdfViewerDialog
      open={pdfViewer.open}
      onClose={pdfViewer.onClose}
      pdfUrl={pdfViewer.pdfUrl}
    />
    <UnsavedChangesDialog
      open={unsaved.open}
      dirtyFieldLabels={unsaved.dirtyFieldLabels}
      onCancel={unsaved.onCancel}
      onDiscard={unsaved.onDiscard}
    />
    <InvoiceSaveConfirmDialog
      open={saveConfirm.open}
      warnings={saveConfirm.warnings}
      loading={saveConfirm.loading}
      onCancel={saveConfirm.onCancel}
      onConfirm={saveConfirm.onConfirm}
    />
  </>
);

export default InvoiceSideModals;
