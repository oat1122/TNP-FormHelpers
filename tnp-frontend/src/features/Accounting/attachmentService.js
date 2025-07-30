import axios from '@/api/axios';

// Document Attachment API Service
// Based on endpoints from README.md

/**
 * Upload attachment file
 * @param {FormData} formData - File upload data (file, document_type, document_id, description)
 * @returns {Promise} API response with uploaded attachment info
 */
export const uploadAttachment = (formData) => {
  return axios.post('/accounting/attachments/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * Get attachments for specific document
 * @param {Object} params - Query parameters (document_type, document_id, etc.)
 * @returns {Promise} API response with attachments list
 */
export const getDocumentAttachments = (params) => {
  return axios.get('/accounting/attachments/document', { params });
};

/**
 * Get attachment statistics
 * @param {Object} params - Query parameters
 * @returns {Promise} API response with attachment statistics
 */
export const getAttachmentStats = (params = {}) => {
  return axios.get('/accounting/attachments/stats', { params });
};

/**
 * Get specific attachment info
 * @param {string} id - Attachment ID
 * @returns {Promise} API response with attachment data
 */
export const getAttachment = (id) => {
  return axios.get(`/accounting/attachments/${id}`);
};

/**
 * Download attachment file
 * @param {string} id - Attachment ID
 * @returns {Promise} File blob response
 */
export const downloadAttachment = (id) => {
  return axios.get(`/accounting/attachments/${id}/download`, {
    responseType: 'blob'
  });
};

/**
 * Update attachment description
 * @param {string} id - Attachment ID
 * @param {Object} data - Update data (description)
 * @returns {Promise} API response
 */
export const updateAttachmentDescription = (id, data) => {
  return axios.put(`/accounting/attachments/${id}/description`, data);
};

/**
 * Delete attachment
 * @param {string} id - Attachment ID
 * @returns {Promise} API response
 */
export const deleteAttachment = (id) => {
  return axios.delete(`/accounting/attachments/${id}`);
};

/**
 * Helper function to create FormData for file upload
 * @param {File} file - File object
 * @param {string} documentType - Type of document (quotation, invoice, receipt, delivery-note)
 * @param {string} documentId - Document ID
 * @param {string} description - File description
 * @returns {FormData} Formatted form data
 */
export const createUploadFormData = (file, documentType, documentId, description = '') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('document_type', documentType);
  formData.append('document_id', documentId);
  formData.append('description', description);
  return formData;
};

// Export all functions as default object for easier importing
export default {
  uploadAttachment,
  getDocumentAttachments,
  getAttachmentStats,
  getAttachment,
  downloadAttachment,
  updateAttachmentDescription,
  deleteAttachment,
  createUploadFormData
}; 