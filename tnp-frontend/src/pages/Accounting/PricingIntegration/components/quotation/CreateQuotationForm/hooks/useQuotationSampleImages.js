import { useCallback } from "react";

import { useUploadQuotationSampleImagesTempMutation } from "../../../../../../../features/Accounting/accountingApi";

export const useQuotationSampleImages = ({ setFormData }) => {
  const [uploadSamplesTemp, { isLoading: isUploadingSamples }] =
    useUploadQuotationSampleImagesTempMutation();

  const handleUpload = useCallback(
    async (files) => {
      const res = await uploadSamplesTemp({ files }).unwrap();
      const list = res?.data?.sample_images || res?.sample_images || [];
      setFormData((prev) => {
        const updated = [...(prev.sampleImages || []), ...list];
        const currentSel = prev.selectedSampleForPdf;
        const nextSel =
          currentSel && updated.some((it) => it.filename === currentSel)
            ? currentSel
            : updated[0]?.filename || "";
        return { ...prev, sampleImages: updated, selectedSampleForPdf: nextSel };
      });
    },
    [uploadSamplesTemp, setFormData]
  );

  const selectForPdf = useCallback(
    (filename) => {
      setFormData((prev) => ({ ...prev, selectedSampleForPdf: filename }));
    },
    [setFormData]
  );

  const deselectForPdf = useCallback(() => {
    setFormData((prev) => ({ ...prev, selectedSampleForPdf: "" }));
  }, [setFormData]);

  return { handleUpload, selectForPdf, deselectForPdf, isUploadingSamples };
};
