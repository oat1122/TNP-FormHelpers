import { Box } from "@mui/material";
import { useState } from "react";

import { useInvoiceCardCompany } from "./hooks/useInvoiceCardCompany";
import { useInvoiceCardDownloads } from "./hooks/useInvoiceCardDownloads";
import { useInvoicePDFPreview } from "./hooks/useInvoicePDFPreview";
import InvoiceCardActionBar from "./subcomponents/InvoiceCardActionBar";
import InvoiceCardCompanySelector from "./subcomponents/InvoiceCardCompanySelector";
import InvoiceCardDownloadGrid from "./subcomponents/InvoiceCardDownloadGrid";
import InvoiceCardFinancials from "./subcomponents/InvoiceCardFinancials";
import InvoiceCardHeader from "./subcomponents/InvoiceCardHeader";
import InvoiceCardMetadata from "./subcomponents/InvoiceCardMetadata";
import InvoicePreviewDialog from "./subcomponents/InvoicePreviewDialog";
import StatusIndicatorDot from "./subcomponents/StatusIndicatorDot";
import ImageUploadGrid from "../../../shared/components/ImageUploadGrid";
import {
  accountingCardDividerSx,
  AccountingCard,
  AccountingCardContent,
} from "../../../shared/styles";
import { useInvoiceApproval } from "../hooks/useInvoiceApproval";
import { useInvoiceEvidence } from "../hooks/useInvoiceEvidence";
import { useInvoicePDFDownload } from "../hooks/useInvoicePDFDownload";
import { useInvoiceStatusReversal } from "../hooks/useInvoiceStatusReversal";
import { CustomerInfoSection } from "../subcomponents/CustomerInfoSection";
import StatusReversalDialog from "../subcomponents/StatusReversalDialog";
import WorkDetailsSection from "../subcomponents/WorkDetailsSection";
import {
  getInvoiceStatus,
  calculateInvoiceFinancials,
  formatDepositInfo,
} from "../utils/invoiceLogic";

const InvoiceCard = ({ invoice, onView, onDownloadPDF, onPreviewPDF, onUpdateCompany }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Custom Hooks
  const approvalHook = useInvoiceApproval(invoice);
  const evidenceHook = useInvoiceEvidence(invoice);
  const pdfHook = useInvoicePDFDownload(invoice, onDownloadPDF, onPreviewPDF);
  const statusReversalHook = useInvoiceStatusReversal(invoice);
  const downloads = useInvoiceCardDownloads(invoice);
  const pdfPreview = useInvoicePDFPreview(invoice);
  const company = useInvoiceCardCompany({
    invoice,
    canUserApprove: approvalHook.canUserApprove(),
    activeSideStatus: approvalHook.getActiveSideStatus(),
    onUpdateCompany,
  });

  const {
    localStatus,
    depositMode,
    isApproving,
    getActiveSideStatus,
    canApproveActiveSide,
    canUserApprove,
    handleApprove,
    handleDepositModeChange,
  } = approvalHook;

  // ใช้สถานะของฝั่งที่กำลังดูสำหรับแสดงผล
  const activeSideStatus = getActiveSideStatus();

  const {
    getEvidenceForMode,
    hasEvidence,
    hasEvidenceForMode,
    handleUploadEvidence,
    uploadingEvidence,
  } = evidenceHook;

  const {
    downloadAnchorEl,
    selectedHeaders,
    extendedHeaderOptions,
    toggleHeader,
    handleDownloadClick,
    handleCloseMenu,
    handleConfirmDownload,
  } = pdfHook;

  // Check if user can download PDFs for current mode
  // Admin/Account: always can download
  // Others (e.g., Sale): need evidence uploaded first

  // Calculate financial data
  const financials = calculateInvoiceFinancials(invoice);
  const depositInfo = formatDepositInfo(invoice);

  const invoiceStatus = getInvoiceStatus({ ...invoice, status: activeSideStatus });

  const quotationNumber = invoice?.quotation_number || invoice?.quotation?.number || null;

  return (
    <AccountingCard sx={{ position: "relative" }}>
      <StatusIndicatorDot approved={localStatus === "approved"} hasEvidence={hasEvidence} />
      <AccountingCardContent sx={{ p: 2.5 }}>
        <InvoiceCardHeader
          invoice={invoice}
          depositMode={depositMode}
          invoiceStatus={invoiceStatus}
          depositInfo={depositInfo}
        />

        {/* Customer & Manager Info */}
        <CustomerInfoSection invoice={invoice} />

        {/* Work Details */}
        <WorkDetailsSection invoice={invoice} />

        <InvoiceCardFinancials
          invoice={invoice}
          financials={financials}
          depositMode={depositMode}
          activeSideStatus={activeSideStatus}
          hasEvidence={hasEvidence}
          hasEvidenceForMode={hasEvidenceForMode}
          onDepositModeChange={(val) => handleDepositModeChange(val, hasEvidence)}
          showDetails={showDetails}
          onToggleDetails={() => setShowDetails(!showDetails)}
        />

        {/* Payment Info - ย่อให้เล็กลง */}
        <InvoiceCardMetadata
          invoice={invoice}
          invoiceStatus={invoiceStatus}
          quotationNumber={quotationNumber}
        />

        {activeSideStatus === "draft" && canUserApprove && invoice.status !== "approved" && (
          <InvoiceCardCompanySelector
            invoice={invoice}
            companies={company.companies}
            currentCompany={company.currentCompany}
            loadingCompanies={company.loadingCompanies}
            updatingCompany={company.updatingCompany}
            onCompanyChange={company.handleCompanyChange}
          />
        )}

        {/* Evidence Upload Section - Mode-Specific */}
        {activeSideStatus === "approved" && (
          <Box mb={2.5}>
            <ImageUploadGrid
              images={getEvidenceForMode(depositMode)}
              onUpload={(files) => handleUploadEvidence(files, depositMode)}
              title={`หลักฐานการชำระเงิน (${depositMode === "before" ? "มัดจำก่อน" : "มัดจำหลัง"})`}
              helperText={
                uploadingEvidence ? "กำลังอัปโหลด..." : "อัปโหลดสลิปหรือหลักฐาน (รองรับหลายไฟล์)"
              }
              disabled={uploadingEvidence}
              previewMode="dialog"
              showFilename={false}
            />
          </Box>
        )}

        <InvoiceCardActionBar
          depositMode={depositMode}
          canUserApprove={canUserApprove()}
          canApproveActiveSide={canApproveActiveSide()}
          isApproving={isApproving}
          activeSideStatus={activeSideStatus}
          onApprove={handleApprove}
          onRevertToDraft={() => statusReversalHook.handleRevertToDraft(depositMode)}
          isReverting={statusReversalHook.isReverting}
          onPreviewPDF={onPreviewPDF}
          onPreview={() => pdfPreview.preview(depositMode)}
          onDownloadPDF={onDownloadPDF}
          downloadAnchorEl={downloadAnchorEl}
          onDownloadClick={handleDownloadClick}
          onCloseMenu={handleCloseMenu}
          extendedHeaderOptions={extendedHeaderOptions}
          selectedHeaders={selectedHeaders}
          toggleHeader={toggleHeader}
          onConfirmDownload={handleConfirmDownload}
          onView={onView}
        />

        <InvoiceCardDownloadGrid
          enabled={Boolean(onDownloadPDF) && canUserApprove()}
          downloads={downloads}
          headerOptions={extendedHeaderOptions}
          selectedHeaders={selectedHeaders}
          toggleHeader={toggleHeader}
        />
      </AccountingCardContent>
      <Box component="hr" sx={accountingCardDividerSx} />

      <InvoicePreviewDialog
        open={pdfPreview.open}
        pdfUrl={pdfPreview.pdfUrl}
        onClose={pdfPreview.close}
        onOpenInNewTab={pdfPreview.openInNewTab}
      />

      {/* Status Reversal Dialog */}
      <StatusReversalDialog
        open={statusReversalHook.isDialogOpen}
        onClose={statusReversalHook.handleDialogClose}
        onSubmit={statusReversalHook.handleReasonSubmit}
        pendingRevertSide={statusReversalHook.pendingRevertSide}
        isLoading={statusReversalHook.isReverting}
      />
    </AccountingCard>
  );
};

export default InvoiceCard;
