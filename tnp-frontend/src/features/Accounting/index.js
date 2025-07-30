// Accounting Services - Central Export
// ใช้สำหรับ import services ง่ายๆ เช่น import { quotationService, customerService } from '@/features/Accounting'

export { default as quotationService } from './quotationService';
export { default as invoiceService } from './invoiceService';
export { default as receiptService } from './receiptService';
export { default as deliveryNoteService } from './deliveryNoteService';
export { default as customerService } from './customerService';
export { default as productService } from './productService';
export { default as dashboardService } from './dashboardService';
export { default as attachmentService } from './attachmentService';

// Re-export individual functions for convenience
export * from './quotationService';
export * from './invoiceService';
export * from './receiptService';
export * from './deliveryNoteService';
export * from './customerService';
export * from './productService';
export * from './dashboardService';
export * from './attachmentService'; 