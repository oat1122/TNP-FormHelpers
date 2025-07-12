import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Alert,
} from '@mui/material';
import {
  Build,
} from '@mui/icons-material';

const WorkCalculationCard = ({ formData, isAutoFilled }) => {
  if (!isAutoFilled) return null;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Build sx={{ mr: 1, verticalAlign: 'middle' }} />
          การคำนวณงานแต่ละประเภทการพิมพ์
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>การคำนวณงานจาก WorkSheet:</strong><br/>
            {(() => {
              const workCalculations = [];
              
              if (formData.print_locations?.screen?.enabled) {
                const points = formData.print_locations.screen.points;
                const totalWork = points * formData.total_quantity;
                workCalculations.push(`Screen Printing ${points} จุด เสื้อทั้งหมด ${formData.total_quantity} ตัว (${points}×${formData.total_quantity}=${totalWork}) งาน Screen Printing มีงาน ${totalWork}`);
              }
              
              if (formData.print_locations?.dtf?.enabled) {
                const points = formData.print_locations.dtf.points;
                const totalWork = points * formData.total_quantity;
                workCalculations.push(`DTF (Direct Film Transfer) ${points} จุด เสื้อทั้งหมด ${formData.total_quantity} ตัว (${points}×${formData.total_quantity}=${totalWork}) งาน DTF มีงาน ${totalWork}`);
              }
              
              if (formData.print_locations?.sublimation?.enabled) {
                const points = formData.print_locations.sublimation.points;
                const totalWork = points * formData.total_quantity;
                workCalculations.push(`Sublimation/Flex ${points} จุด เสื้อทั้งหมด ${formData.total_quantity} ตัว (${points}×${formData.total_quantity}=${totalWork}) งาน Sublimation/Flex มีงาน ${totalWork}`);
              }
              
              if (formData.print_locations?.embroidery?.enabled) {
                const points = formData.print_locations.embroidery.points;
                const totalWork = points * formData.total_quantity;
                workCalculations.push(`Embroidery (ปัก) ${points} จุด เสื้อทั้งหมด ${formData.total_quantity} ตัว (${points}×${formData.total_quantity}=${totalWork}) งาน Embroidery มีงาน ${totalWork}`);
              }
              
              if (workCalculations.length === 0) {
                return 'ไม่พบข้อมูลการพิมพ์/ปัก';
              }
              
              return workCalculations.map((calc, index) => (
                <span key={index}>
                  {calc}
                  {index < workCalculations.length - 1 && <br/>}
                </span>
              ));
            })()}
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default WorkCalculationCard; 