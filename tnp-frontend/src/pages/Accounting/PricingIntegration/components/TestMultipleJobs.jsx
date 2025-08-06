import React from 'react';
import CreateQuotationForm from './CreateQuotationForm';

/**
 * 🧪 Test Component สำหรับทดสอบ Multiple Jobs
 * Developer: แต้ม (Fullstack React + Laravel)
 * Date: 6 สิงหาคม 2568
 */

const TestMultipleJobs = () => {
    // Mock data สำหรับทดสอบ (ข้อมูลจาก HTML ที่คุณส่งมา)
    const mockSelectedPricingRequests = [
        {
            pr_id: 1,
            pr_work_name: 'ผ้ากันเปื้อน',
            pr_pattern: '-', // ไม่มีลาย
            pr_fabric_type: 'แคนวาน',
            pr_color: '',
            pr_sizes: '',
            pr_quantity: 100,
            pr_notes: '',
            customer: {
                cus_company: 'บริษัท ทดสอบ จำกัด',
                cus_tax_id: '1234567890123',
                cus_address: '123 ถนนทดสอบ แขวงทดสอบ เขตทดสอบ กรุงเทพ 10000',
                cus_phone: '02-123-4567',
                cus_email: 'test@company.com'
            }
        },
        {
            pr_id: 2,
            pr_work_name: 'เสื้อฮู้ด',
            pr_pattern: 'ธนพลัสแขนยาว',
            pr_fabric_type: 'สำลี',
            pr_color: '',
            pr_sizes: '',
            pr_quantity: 100,
            pr_notes: '',
            customer: {
                cus_company: 'บริษัท ทดสอบ จำกัด',
                cus_tax_id: '1234567890123',
                cus_address: '123 ถนนทดสอบ แขวงทดสอบ เขตทดสอบ กรุงเทพ 10000',
                cus_phone: '02-123-4567',
                cus_email: 'test@company.com'
            }
        }
    ];

    const handleBack = () => {
        console.log('🔙 Back clicked');
        alert('กลับไปหน้าเดิม');
    };

    const handleSave = (data) => {
        console.log('💾 Save draft:', data);
        alert('บันทึกร่างเรียบร้อย');
    };

    const handleSubmit = (data) => {
        console.log('✅ Submit for review:', data);
        alert('ส่งตรวจสอบเรียบร้อย');
    };

    return (
        <div>
            <CreateQuotationForm
                selectedPricingRequests={mockSelectedPricingRequests}
                onBack={handleBack}
                onSave={handleSave}
                onSubmit={handleSubmit}
            />
        </div>
    );
};

export default TestMultipleJobs;
