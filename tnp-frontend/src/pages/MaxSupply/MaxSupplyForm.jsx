import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import {
  Save,
  Cancel,
  AutoAwesome,
  NavigateNext,
  NavigateBefore,
  CheckCircle,
  Info,
  Build,
  Note,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { maxSupplyApi, worksheetApi } from '../../services/maxSupplyApi';
import { productionTypeConfig } from './components/Shared/constants';
import { useGetAllWorksheetQuery } from '../../features/Worksheet/worksheetApi';
import toast from 'react-hot-toast';
import { debugTokens } from '../../utils/tokenDebug';
import { StepBasicInfo, StepProductionInfo, StepNotes } from '../../components/MaxSupplyForm';

// Set dayjs locale
dayjs.locale('th');

const MaxSupplyForm = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditMode = Boolean(id);

  // States
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    worksheet_id: '',
    title: '',
    customer_name: '',
    production_type: '',
    start_date: dayjs(),
    expected_completion_date: dayjs().add(7, 'day'),
    due_date: dayjs().add(14, 'day'),
    shirt_type: '',
    total_quantity: 0,
    sizes: [],
    priority: 'normal',
    notes: '',
    special_instructions: '',
    status: 'pending',
    sample_image: null,
    print_locations: {
      screen: { enabled: false, position: '', points: 0 },
      dtf: { enabled: false, position: '', points: 0 },
      sublimation: { enabled: false, position: '', points: 0 },
      embroidery: { enabled: false, position: '', points: 0 },
    },
    size_breakdown: [],
  });

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedWorksheet, setSelectedWorksheet] = useState(null);
  const [worksheetOptions, setWorksheetOptions] = useState([]);
  const [autoFillPreview, setAutoFillPreview] = useState(null);
  const [newworksNetLoading, setNewworksNetLoading] = useState(false);

  // Get worksheets data
  const { data: worksheetData, isLoading: worksheetLoading } = useGetAllWorksheetQuery();

  // Production types (matched to backend validation) 
  const productionTypes = [
    { value: 'screen', label: 'Screen Printing', color: productionTypeConfig.screen.color },
    { value: 'dtf', label: 'DTF (Direct Film Transfer)', color: productionTypeConfig.dtf.color },
    { value: 'sublimation', label: 'Sublimation', color: productionTypeConfig.sublimation.color },
    // Note: embroidery is not supported in backend yet
  ];

  // Shirt types (matched to backend enum)
  const shirtTypes = [
    { value: 'polo', label: 'เสื้อโปโล' },
    { value: 't-shirt', label: 'เสื้อยืด' },
    { value: 'hoodie', label: 'เสื้อฮูดี้' },
    { value: 'tank-top', label: 'เสื้อกล้าม' },
    // Note: 'long-sleeve' is not supported in backend enum
  ];

  // Size options
  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  // Priority levels
  const priorityLevels = [
    { value: 'low', label: 'ต่ำ', color: '#10b981' },
    { value: 'normal', label: 'ปกติ', color: '#6b7280' },
    { value: 'high', label: 'สูง', color: '#f59e0b' },
    { value: 'urgent', label: 'ด่วน', color: '#ef4444' },
  ];

  // Steps definition
  const steps = [
    {
      label: 'ข้อมูลพื้นฐาน',
      icon: <Info />,
      description: 'เลือก Worksheet และกรอกข้อมูลพื้นฐาน'
    },
    {
      label: 'ข้อมูลการผลิต',
      icon: <Build />,
      description: 'กำหนดรายละเอียดการผลิตและจุดพิมพ์'
    },
    {
      label: 'หมายเหตุ',
      icon: <Note />,
      description: 'เพิ่มหมายเหตุและข้อมูลเพิ่มเติม'
    }
  ];

  // Process worksheet data
  const processWorksheetData = (data) => {
    if (!data) return [];
    
    try {
      let worksheetItems = [];
      
      if (Array.isArray(data)) {
        worksheetItems = data;
      } else if (data.data && Array.isArray(data.data)) {
        worksheetItems = data.data;
      } else if (typeof data === 'object') {
        const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
        if (arrayProps.length > 0) {
          worksheetItems = data[arrayProps[0]];
        }
      }
      
      // Generate unique IDs and labels for worksheets
      console.log('Total worksheets before filtering:', worksheetItems.length);
      
      const validWorksheets = worksheetItems.filter(ws => ws && (ws.worksheet_id || ws.id || ws.work_id));
      console.log('Valid worksheets (with ID):', validWorksheets.length);
      
      const filteredWorksheets = validWorksheets.filter(ws => ws.has_production !== true);
      console.log('Worksheets after production filter (has_production !== true):', filteredWorksheets.length);
      
      // Log some examples of filtered out worksheets
      const productionWorksheets = validWorksheets.filter(ws => ws.has_production === true);
      if (productionWorksheets.length > 0) {
        console.log('Worksheets filtered out (has_production === true):', productionWorksheets.slice(0, 5));
      }
      
      return filteredWorksheets
        .map((ws, index) => {
          // Create a unique ID for each worksheet
          const worksheetId = ws.worksheet_id || ws.id || ws.work_id || `ws-${index}`;
          const uniqueId = `${worksheetId}-${index}`;
          
          // Create a descriptive label
          const customerName = ws.customer_name || 'ไม่ระบุ';
          const productName = ws.product_name || ws.work_name || ws.title || 'ไม่ระบุ';
          let label = `${customerName} - ${productName}`;
          
          // Add some additional identification if available
          if (ws.work_id) {
            label += ` (ID: ${ws.work_id})`;
          }
          if (ws.created_at) {
            const createdDate = dayjs(ws.created_at).format('DD/MM/YYYY');
            label += ` - ${createdDate}`;
          }
          
          return {
            id: uniqueId,
            originalId: worksheetId,
            label: label,
            ...ws,
          };
        });
    } catch (error) {
      console.error('Error processing worksheet data:', error);
      return [];
    }
  };

  // Load worksheets
  useEffect(() => {
    debugTokens();
    if (worksheetData) {
      const options = processWorksheetData(worksheetData);
      setWorksheetOptions(options);
    }
  }, [worksheetData]);

  // Parse print locations from worksheet data
  const parsePrintLocations = (worksheet) => {
    const printLocations = {
      screen: { enabled: false, position: '', points: 0 },
      dtf: { enabled: false, position: '', points: 0 },
      sublimation: { enabled: false, position: '', points: 0 },
      embroidery: { enabled: false, position: '', points: 0 },
    };
    
    console.log('Parsing print locations from NewWorksNet:', worksheet);
    
    // Parse screen details from NewWorksNet format
    if (worksheet.screen_detail) {
      const screenDetail = worksheet.screen_detail.toLowerCase();
      
      // Extract positions from screen_detail
      const extractPositions = (text) => {
        const positions = [];
        if (text.includes('หน้า') || text.includes('ด้านหน้า')) positions.push('หน้า');
        if (text.includes('หลัง') || text.includes('ด้านหลัง')) positions.push('หลัง');
        if (text.includes('แขน')) positions.push('แขน');
        if (text.includes('ข้าง')) positions.push('ข้าง');
        if (text.includes('คอ')) positions.push('คอ');
        return positions.join(', ') || 'ไม่ระบุ';
      };
      
      // Check for DTF/DFT printing - use screen_dft as print points
      if ((screenDetail.includes('dtf') || screenDetail.includes('dft')) && worksheet.screen_dft) {
        printLocations.dtf.enabled = true;
        printLocations.dtf.points = parseInt(worksheet.screen_dft) || 0;
        printLocations.dtf.position = extractPositions(screenDetail);
        console.log('DTF enabled with points:', printLocations.dtf.points);
      }
      
      // Check for Screen printing - use screen_point as print points
      if (screenDetail.includes('สกรีน') && worksheet.screen_point) {
        printLocations.screen.enabled = true;
        printLocations.screen.points = parseInt(worksheet.screen_point) || 0;
        printLocations.screen.position = extractPositions(screenDetail);
        console.log('Screen enabled with points:', printLocations.screen.points);
      }
      
      // Check for Embroidery - use screen_embroider as print points
      if ((screenDetail.includes('ปัก') || screenDetail.includes('embroider')) && worksheet.screen_embroider) {
        printLocations.embroidery.enabled = true;
        printLocations.embroidery.points = parseInt(worksheet.screen_embroider) || 1;
        printLocations.embroidery.position = extractPositions(screenDetail);
        console.log('Embroidery enabled with points:', printLocations.embroidery.points);
      }
      
      // Check for Flex/Vinyl - use screen_flex as print points
      if (screenDetail.includes('flex') && worksheet.screen_flex) {
        // Use sublimation slot for flex printing
        printLocations.sublimation.enabled = true;
        printLocations.sublimation.points = parseInt(worksheet.screen_flex) || 0;
        printLocations.sublimation.position = extractPositions(screenDetail);
        console.log('Flex/Sublimation enabled with points:', printLocations.sublimation.points);
      }
    }
    
    // Important: Enable printing types based on available point fields even without screen_detail
    // This handles cases where NewWorksNet has point data but no detailed description
    if (!printLocations.dtf.enabled && worksheet.screen_dft && parseInt(worksheet.screen_dft) > 0) {
      printLocations.dtf.enabled = true;
      printLocations.dtf.points = parseInt(worksheet.screen_dft);
      printLocations.dtf.position = 'ไม่ระบุ';
      console.log('DTF fallback enabled with points:', printLocations.dtf.points);
    }
    
    if (!printLocations.screen.enabled && worksheet.screen_point && parseInt(worksheet.screen_point) > 0) {
      printLocations.screen.enabled = true;
      printLocations.screen.points = parseInt(worksheet.screen_point);
      printLocations.screen.position = 'ไม่ระบุ';
      console.log('Screen fallback enabled with points:', printLocations.screen.points);
    }
    
    if (!printLocations.embroidery.enabled && worksheet.screen_embroider && parseInt(worksheet.screen_embroider) > 0) {
      printLocations.embroidery.enabled = true;
      printLocations.embroidery.points = parseInt(worksheet.screen_embroider);
      printLocations.embroidery.position = 'ไม่ระบุ';
      console.log('Embroidery fallback enabled with points:', printLocations.embroidery.points);
    }
    
    if (!printLocations.sublimation.enabled && worksheet.screen_flex && parseInt(worksheet.screen_flex) > 0) {
      printLocations.sublimation.enabled = true;
      printLocations.sublimation.points = parseInt(worksheet.screen_flex);
      printLocations.sublimation.position = 'ไม่ระบุ';
      console.log('Flex/Sublimation fallback enabled with points:', printLocations.sublimation.points);
    }
    
    console.log('Final parsed print locations:', printLocations);
    
    return printLocations;
  };
  
  // Parse size breakdown from worksheet data
  const parseSizeBreakdown = (worksheet) => {
    const sizes = [];
    const sizeBreakdown = [];
    
    console.log('Parsing size breakdown from NewWorksNet:', worksheet);
    
    // Try to parse size details from NewWorksNet format
    try {
      // Check if we have pattern_sizes object (NewWorksNet format with men/women)
      if (worksheet.pattern_sizes && typeof worksheet.pattern_sizes === 'object') {
        console.log('Found pattern_sizes object:', worksheet.pattern_sizes);
        
        // Handle case where pattern_sizes is an array (direct size data)
        if (Array.isArray(worksheet.pattern_sizes)) {
          console.log('Pattern sizes is array format');
          worksheet.pattern_sizes.forEach(sizeInfo => {
            // Check for quantity in sizeInfo directly, or use total_quantity as fallback
            let quantity = 0;
            if (sizeInfo.quantity && parseInt(sizeInfo.quantity) > 0) {
              quantity = parseInt(sizeInfo.quantity);
            } else if (worksheet.total_quantity && worksheet.pattern_sizes.length > 0) {
              // If no quantity specified, distribute total_quantity evenly
              quantity = Math.floor(parseInt(worksheet.total_quantity) / worksheet.pattern_sizes.length);
            }
            
            if (sizeInfo.size_name && quantity > 0) {
              const size = sizeInfo.size_name.toUpperCase();
              sizes.push(size);
              sizeBreakdown.push({ 
                size, 
                quantity, 
                details: {
                  chest: sizeInfo.chest,
                  long: sizeInfo.long,
                  shirt_size_id: sizeInfo.shirt_size_id,
                  pattern_id: sizeInfo.pattern_id
                }
              });
              console.log(`Added size from array: ${size} (${quantity})`);
            }
          });
        }
        // Handle case where pattern_sizes has men/women structure
        else {
          // Handle men sizes
          if (worksheet.pattern_sizes.men && Array.isArray(worksheet.pattern_sizes.men)) {
            worksheet.pattern_sizes.men.forEach(sizeInfo => {
              // Check for quantity in sizeInfo directly, or use total_quantity as fallback
              let quantity = 0;
              if (sizeInfo.quantity && parseInt(sizeInfo.quantity) > 0) {
                quantity = parseInt(sizeInfo.quantity);
              } else if (worksheet.total_quantity && worksheet.pattern_sizes.men.length > 0) {
                // If no quantity specified, distribute total_quantity evenly among men sizes
                quantity = Math.floor(parseInt(worksheet.total_quantity) / worksheet.pattern_sizes.men.length);
              }
              
              if (sizeInfo.size_name && quantity > 0) {
                const size = sizeInfo.size_name.toUpperCase();
                sizes.push(size);
                sizeBreakdown.push({ 
                  size, 
                  quantity, 
                  gender: 'men',
                  details: {
                    chest: sizeInfo.chest,
                    long: sizeInfo.long,
                    shirt_size_id: sizeInfo.shirt_size_id
                  }
                });
                console.log(`Added men size: ${size} (${quantity})`);
              }
            });
          }
          
          // Handle women sizes
          if (worksheet.pattern_sizes.women && Array.isArray(worksheet.pattern_sizes.women)) {
            worksheet.pattern_sizes.women.forEach(sizeInfo => {
              // Check for quantity in sizeInfo directly, or use total_quantity as fallback
              let quantity = 0;
              if (sizeInfo.quantity && parseInt(sizeInfo.quantity) > 0) {
                quantity = parseInt(sizeInfo.quantity);
              } else if (worksheet.total_quantity && worksheet.pattern_sizes.women.length > 0) {
                // If no quantity specified, distribute total_quantity evenly among women sizes
                quantity = Math.floor(parseInt(worksheet.total_quantity) / worksheet.pattern_sizes.women.length);
              }
              
              if (sizeInfo.size_name && quantity > 0) {
                const size = sizeInfo.size_name.toUpperCase();
                sizes.push(size);
                sizeBreakdown.push({ 
                  size, 
                  quantity, 
                  gender: 'women',
                  details: {
                    chest: sizeInfo.chest,
                    long: sizeInfo.long,
                    shirt_size_id: sizeInfo.shirt_size_id
                  }
                });
                console.log(`Added women size: ${size} (${quantity})`);
              }
            });
          }
        }
      }
      
      // Legacy: Check if we have pattern_sizes array (old NewWorksNet format)
      else if (worksheet.pattern_sizes && Array.isArray(worksheet.pattern_sizes)) {
        worksheet.pattern_sizes.forEach(sizeInfo => {
          if (sizeInfo.size && sizeInfo.quantity && parseInt(sizeInfo.quantity) > 0) {
            const size = sizeInfo.size.toUpperCase();
            const quantity = parseInt(sizeInfo.quantity);
            sizes.push(size);
            sizeBreakdown.push({ size, quantity });
            console.log(`Added legacy size: ${size} (${quantity})`);
          }
        });
      }
      
      // If no pattern_sizes, try parsing size_details as JSON string
      else if (worksheet.size_details && typeof worksheet.size_details === 'string') {
        try {
          const sizeDetails = JSON.parse(worksheet.size_details);
          Object.entries(sizeDetails).forEach(([size, quantity]) => {
            if (quantity > 0) {
              sizes.push(size.toUpperCase());
              sizeBreakdown.push({ size: size.toUpperCase(), quantity: parseInt(quantity) });
            }
          });
        } catch (e) {
          console.warn('Failed to parse size_details JSON:', e);
        }
      } 
      // Handle size_details as object
      else if (worksheet.size_details && typeof worksheet.size_details === 'object') {
        Object.entries(worksheet.size_details).forEach(([size, quantity]) => {
          if (quantity > 0) {
            sizes.push(size.toUpperCase());
            sizeBreakdown.push({ size: size.toUpperCase(), quantity: parseInt(quantity) });
          }
        });
      }
      // Try worksheet.sizes as array
      else if (worksheet.sizes && Array.isArray(worksheet.sizes)) {
        worksheet.sizes.forEach(size => {
          sizes.push(size.toUpperCase());
          const quantity = worksheet.size_quantities ? 
            (worksheet.size_quantities[size] || 0) : 
            (worksheet.quantities && worksheet.quantities[size] ? worksheet.quantities[size] : 0);
          sizeBreakdown.push({ size: size.toUpperCase(), quantity: parseInt(quantity) });
        });
      }
      // Look for size_S, size_M, size_L pattern in the data
      else {
        const sizeKeys = Object.keys(worksheet).filter(key => key.startsWith('size_') || key.match(/^[smlx]{1,4}$/i));
        if (sizeKeys.length > 0) {
          sizeKeys.forEach(key => {
            const sizeName = key.startsWith('size_') ? key.replace('size_', '').toUpperCase() : key.toUpperCase();
            const quantity = parseInt(worksheet[key]) || 0;
            if (quantity > 0) {
              sizes.push(sizeName);
              sizeBreakdown.push({ size: sizeName, quantity });
            }
          });
        }
      }
      
      // Special handling for NewWorksNet: if size_tag exists and we have total_quantity but no sizes
      if (sizes.length === 0 && worksheet.total_quantity > 0) {
        console.log('No sizes found, creating default distribution from total_quantity:', worksheet.total_quantity);
        
        // If we have pattern_sizes data but no quantities, extract sizes from it
        if (worksheet.pattern_sizes) {
          const availableSizes = [];
          
          if (Array.isArray(worksheet.pattern_sizes)) {
            worksheet.pattern_sizes.forEach(sizeInfo => {
              if (sizeInfo.size_name) {
                availableSizes.push(sizeInfo.size_name.toUpperCase());
              }
            });
          } else if (typeof worksheet.pattern_sizes === 'object') {
            if (worksheet.pattern_sizes.men) {
              worksheet.pattern_sizes.men.forEach(sizeInfo => {
                if (sizeInfo.size_name) {
                  availableSizes.push(sizeInfo.size_name.toUpperCase());
                }
              });
            }
            if (worksheet.pattern_sizes.women) {
              worksheet.pattern_sizes.women.forEach(sizeInfo => {
                if (sizeInfo.size_name) {
                  availableSizes.push(sizeInfo.size_name.toUpperCase());
                }
              });
            }
          }
          
          // Use available sizes if we found any
          if (availableSizes.length > 0) {
            const totalQty = parseInt(worksheet.total_quantity);
            const qtyPerSize = Math.floor(totalQty / availableSizes.length);
            const remainder = totalQty % availableSizes.length;
            
            availableSizes.forEach((size, index) => {
              const quantity = qtyPerSize + (index < remainder ? 1 : 0);
              if (quantity > 0) {
                sizes.push(size);
                sizeBreakdown.push({ size, quantity });
                console.log(`Added size from available sizes: ${size} (${quantity})`);
              }
            });
          }
        }
        
        // Final fallback: use default sizes if we still have nothing
        if (sizes.length === 0) {
          const defaultSizes = ['S', 'M', 'L', 'XL'];
          const totalQty = parseInt(worksheet.total_quantity);
          const qtyPerSize = Math.floor(totalQty / defaultSizes.length);
          const remainder = totalQty % defaultSizes.length;
          
          defaultSizes.forEach((size, index) => {
            const quantity = qtyPerSize + (index < remainder ? 1 : 0);
            if (quantity > 0) {
              sizes.push(size);
              sizeBreakdown.push({ size, quantity });
              console.log(`Added default size: ${size} (${quantity})`);
            }
          });
        }
      }
      
      // Final fallback: if we still have no sizes but we know total quantity, ask user to specify
      if (sizes.length === 0 && worksheet.total_quantity > 0) {
        console.log('No size information found, user needs to manually specify sizes');
      }
    } catch (error) {
      console.error('Error parsing size breakdown:', error);
    }
    
    console.log('Final parsed sizes:', sizes);
    console.log('Final parsed size breakdown:', sizeBreakdown);
    
    return { sizes, sizeBreakdown };
  };

  // Handle worksheet selection
  const handleWorksheetSelect = (worksheet) => {
    setSelectedWorksheet(worksheet);
    
    if (worksheet) {
      // Log worksheet data for debugging
      console.log('Selected worksheet data:', worksheet);
      
      // Parse print locations
      const printLocations = parsePrintLocations(worksheet);
      
      // Parse size breakdown
      const { sizes, sizeBreakdown } = parseSizeBreakdown(worksheet);
      
      // Calculate total quantity
      const totalQuantity = sizeBreakdown.reduce((sum, item) => sum + item.quantity, 0) || worksheet.total_quantity || 0;
      
      // Map shirt type from NewWorksNet to our format
      const mapShirtType = (typeShirt) => {
        if (!typeShirt) return '';
        const type = typeShirt.toLowerCase();
        
        // Map exact values from NewWorksNet
        if (type === 'polo' || type.includes('polo')) return 'polo';
        if (type === 't-shirt' || type === 'tshirt' || type.includes('t-shirt')) return 't-shirt';
        if (type === 'hoodie' || type.includes('hoodie') || type.includes('hood')) return 'hoodie';
        if (type === 'tank-top' || type.includes('tank') || type.includes('กล้าม')) return 'tank-top';
        if (type === 'long-sleeve' || type.includes('long') || type.includes('แขนยาว')) return 'long-sleeve';
        
        // Default fallback
        return 't-shirt';
      };
      
      // Determine production type from print information (can be multiple)
      const determineProductionType = () => {
        const enabledTypes = [];
        
        // Check each print type with their respective fields
        if (worksheet.screen_dft && parseInt(worksheet.screen_dft) > 0) enabledTypes.push('dtf');
        if (worksheet.screen_point && parseInt(worksheet.screen_point) > 0) enabledTypes.push('screen');
        if (worksheet.screen_embroider && parseInt(worksheet.screen_embroider) > 0) enabledTypes.push('embroidery');
        if (worksheet.screen_flex && parseInt(worksheet.screen_flex) > 0) enabledTypes.push('sublimation'); // Using sublimation for flex
        
        console.log('Enabled print types from NewWorksNet:', enabledTypes);
        
        // Priority order: DTF > Screen > Embroidery > Sublimation/Flex
        // Return the highest priority type as the primary production type
        if (enabledTypes.includes('dtf')) return 'dtf';
        if (enabledTypes.includes('screen')) return 'screen';
        if (enabledTypes.includes('embroidery')) return 'embroidery';
        if (enabledTypes.includes('sublimation')) return 'sublimation';
        
        // Default fallback
        return 'screen';
      };
      
      const autoFillData = {
        // Use originalId for actual data, since id might be artificially generated
        worksheet_id: worksheet.originalId || worksheet.id,
        title: worksheet.product_name || worksheet.work_name || `${worksheet.customer_name} - งานใหม่`,
        customer_name: worksheet.customer_name || worksheet.cus_name,
        production_type: determineProductionType(),
        due_date: worksheet.due_date ? dayjs(worksheet.due_date) : dayjs().add(14, 'day'),
        start_date: dayjs(), // Set to current date
        expected_completion_date: worksheet.due_date ? dayjs(worksheet.due_date).subtract(2, 'day') : dayjs().add(7, 'day'),
        shirt_type: mapShirtType(worksheet.type_shirt),
        total_quantity: totalQuantity,
        sizes: sizes,
        size_breakdown: sizeBreakdown,
        special_instructions: worksheet.worksheet_note || worksheet.special_instructions || worksheet.screen_detail || '',
        sample_image: worksheet.images || worksheet.sample_image || worksheet.image_url || null,
        print_locations: printLocations,
        // Additional fields from NewWorksNet
        fabric_info: {
          fabric_name: worksheet.fabric_name,
          fabric_color: worksheet.fabric_color,
          fabric_factory: worksheet.fabric_factory
        },
        pattern_info: {
          pattern_name: worksheet.pattern_name,
          pattern_type: worksheet.pattern_type
        },
        newworks_code: worksheet.code || worksheet.work_id,
      };
      
      setFormData(prev => ({
        ...prev,
        ...autoFillData,
      }));
      
      setAutoFillPreview(autoFillData);
      toast.success('ข้อมูลถูกกรอกอัตโนมัติจาก NewWorksNet แล้ว');
    } else {
      setAutoFillPreview(null);
    }
  };

  // Auto fill when navigating from WorksheetList
  useEffect(() => {
    if (location.state) {
      const { worksheet, autoFillData } = location.state;

      if (worksheet) {
        const label = `${worksheet.customer_name || worksheet.cus_name || ''} - ${
          worksheet.product_name || worksheet.work_name || worksheet.title || ''}
          ${worksheet.work_id ? ` (ID: ${worksheet.work_id})` : ''}`.trim();

        handleWorksheetSelect({
          ...worksheet,
          id: `${worksheet.worksheet_id || worksheet.id || worksheet.work_id}-prefill`,
          originalId: worksheet.worksheet_id || worksheet.id || worksheet.work_id,
          label,
        });
      } else if (autoFillData) {
        setFormData(prev => ({
          ...prev,
          ...autoFillData,
          start_date: dayjs(autoFillData.start_date || dayjs()),
          expected_completion_date: dayjs(
            autoFillData.expected_completion_date || dayjs().add(7, 'day')
          ),
          due_date: dayjs(autoFillData.due_date || dayjs().add(14, 'day')),
        }));
        setAutoFillPreview({
          ...autoFillData,
          start_date: dayjs(autoFillData.start_date || dayjs()),
          expected_completion_date: dayjs(
            autoFillData.expected_completion_date || dayjs().add(7, 'day')
          ),
          due_date: dayjs(autoFillData.due_date || dayjs().add(14, 'day')),
        });
      }
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Handle size breakdown
  const handleSizeBreakdown = (sizes) => {
    const breakdown = sizes.map(size => ({
      size,
      quantity: 0,
    }));
    setFormData(prev => ({
      ...prev,
      sizes,
      size_breakdown: breakdown,
    }));
  };

  // Handle size quantity change
  const handleSizeQuantityChange = (sizeIndex, quantity) => {
    const newBreakdown = [...formData.size_breakdown];
    newBreakdown[sizeIndex].quantity = quantity;
    
    const totalQuantity = newBreakdown.reduce((sum, item) => sum + item.quantity, 0);
    
    setFormData(prev => ({
      ...prev,
      size_breakdown: newBreakdown,
      total_quantity: totalQuantity,
    }));
  };

  // Handle print location changes
  const handlePrintLocationChange = (type, field, value) => {
    setFormData(prev => ({
      ...prev,
      print_locations: {
        ...prev.print_locations,
        [type]: {
          ...prev.print_locations[type],
          [field]: value,
        },
      },
    }));
  };

  // Validate current step
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Basic Information
        if (!formData.worksheet_id) newErrors.worksheet_id = 'กรุณาเลือก Worksheet จาก NewWorksNet';
        if (!formData.title.trim()) newErrors.title = 'กรุณากรอกชื่องาน';
        if (!formData.customer_name.trim()) newErrors.customer_name = 'กรุณากรอกชื่อลูกค้า';
        if (!formData.start_date) newErrors.start_date = 'กรุณาเลือกวันที่เริ่มต้น';
        if (!formData.expected_completion_date) newErrors.expected_completion_date = 'กรุณาเลือกวันที่คาดว่าจะเสร็จ';
        if (!formData.due_date) newErrors.due_date = 'กรุณาเลือกวันที่ส่งมอบ';
        
        // Date validation
        if (formData.expected_completion_date && formData.due_date) {
          if (formData.expected_completion_date.isAfter(formData.due_date)) {
            newErrors.expected_completion_date = 'วันที่คาดว่าจะเสร็จต้องมาก่อนวันที่ครบกำหนด';
          }
        }
        break;
        
      case 1: // Production Information
        if (!formData.shirt_type) newErrors.shirt_type = 'กรุณาเลือกประเภทเสื้อ';
        if (!formData.production_type) newErrors.production_type = 'กรุณาเลือกประเภทการพิมพ์';
        if (formData.sizes.length === 0) newErrors.sizes = 'กรุณาเลือกไซส์';
        if (!formData.total_quantity || formData.total_quantity <= 0) newErrors.total_quantity = 'กรุณากรอกจำนวนที่ถูกต้อง';
        break;
        
      case 2: // Notes
        // Optional validation for notes
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle step navigation
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;
    
    try {
      setSubmitLoading(true);
      
      // Check if user is authenticated
      const authToken = localStorage.getItem("authToken");
      const token = localStorage.getItem("token");
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      
      if (!authToken && !token) {
        toast.error('กรุณาเข้าสู่ระบบก่อนสร้างงาน');
        navigate('/login');
        return;
      }
      
      if (!isLoggedIn) {
        toast.error('กรุณาเข้าสู่ระบบก่อนสร้างงาน');
        navigate('/login');
        return;
      }
      
      // Convert size breakdown to the format expected by backend: {"S": 50, "M": 150, "L": 200}
      const sizesObject = {};
      if (formData.size_breakdown && formData.size_breakdown.length > 0) {
        formData.size_breakdown.forEach(item => {
          sizesObject[item.size] = item.quantity;
        });
      }
      
      // Calculate work summary for each print type
      const workCalculations = {};
      if (formData.print_locations?.screen?.enabled) {
        const points = formData.print_locations.screen.points;
        const totalWork = points * formData.total_quantity;
        workCalculations.screen = {
          points,
          total_quantity: formData.total_quantity,
          total_work: totalWork,
          description: `Screen Printing ${points} จุด เสื้อทั้งหมด ${formData.total_quantity} ตัว (${points}×${formData.total_quantity}=${totalWork}) งาน Screen Printing มีงาน ${totalWork}`
        };
      }
      
      if (formData.print_locations?.dtf?.enabled) {
        const points = formData.print_locations.dtf.points;
        const totalWork = points * formData.total_quantity;
        workCalculations.dtf = {
          points,
          total_quantity: formData.total_quantity,
          total_work: totalWork,
          description: `DTF (Direct Film Transfer) ${points} จุด เสื้อทั้งหมด ${formData.total_quantity} ตัว (${points}×${formData.total_quantity}=${totalWork}) งาน DTF มีงาน ${totalWork}`
        };
      }
      
      if (formData.print_locations?.sublimation?.enabled) {
        const points = formData.print_locations.sublimation.points;
        const totalWork = points * formData.total_quantity;
        workCalculations.sublimation = {
          points,
          total_quantity: formData.total_quantity,
          total_work: totalWork,
          description: `Sublimation/Flex ${points} จุด เสื้อทั้งหมด ${formData.total_quantity} ตัว (${points}×${formData.total_quantity}=${totalWork}) งาน Sublimation/Flex มีงาน ${totalWork}`
        };
      }
      
      if (formData.print_locations?.embroidery?.enabled) {
        const points = formData.print_locations.embroidery.points;
        const totalWork = points * formData.total_quantity;
        workCalculations.embroidery = {
          points,
          total_quantity: formData.total_quantity,
          total_work: totalWork,
          description: `Embroidery (ปัก) ${points} จุด เสื้อทั้งหมด ${formData.total_quantity} ตัว (${points}×${formData.total_quantity}=${totalWork}) งาน Embroidery มีงาน ${totalWork}`
        };
      }
      
      // Transform formData to match backend expectations
      const submitData = {
        worksheet_id: formData.worksheet_id,
        title: formData.title,
        production_type: formData.production_type, // Must be: screen, dtf, sublimation, embroidery
        start_date: formData.start_date ? formData.start_date.format('YYYY-MM-DD') : null,
        expected_completion_date: formData.expected_completion_date.format('YYYY-MM-DD'),
        priority: formData.priority,
        sizes: sizesObject, // Object with size names as keys and quantities as values
        notes: formData.notes,
        special_instructions: formData.special_instructions,
        work_calculations: workCalculations, // Add work calculations
      };

      // Add optional fields if they exist
      if (formData.customer_name) submitData.customer_name = formData.customer_name;
      if (formData.shirt_type) submitData.shirt_type = formData.shirt_type;
      if (formData.total_quantity) submitData.total_quantity = formData.total_quantity;
      if (formData.due_date) submitData.due_date = formData.due_date.format('YYYY-MM-DD');

      // Debug production type validation
      console.log('=== PRODUCTION TYPE DEBUG ===');
      console.log('Form production_type:', formData.production_type);
      console.log('Submit production_type:', submitData.production_type);
      console.log('Is valid production_type:', ['screen', 'dtf', 'sublimation', 'embroidery'].includes(submitData.production_type));
      console.log('============================');
      
      // Add print points based on production type
      if (formData.production_type === 'screen') {
        submitData.screen_points = formData.print_locations?.screen?.points || 0;
      } else if (formData.production_type === 'dtf') {
        submitData.dtf_points = formData.print_locations?.dtf?.points || 0;
      } else if (formData.production_type === 'sublimation') {
        submitData.sublimation_points = formData.print_locations?.sublimation?.points || 0;
      }

      console.log('=== SUBMIT DATA DEBUG ===');
      console.log('Authentication status:');
      console.log('  authToken:', authToken ? 'present' : 'missing');
      console.log('  token:', token ? 'present' : 'missing');
      console.log('  isLoggedIn:', isLoggedIn);
      console.log('Original formData:', formData);
      console.log('Size breakdown:', formData.size_breakdown);
      console.log('Transformed sizes object:', sizesObject);
      console.log('Work calculations:', workCalculations);
      console.log('Transformed submitData:', submitData);
      console.log('Production type:', submitData.production_type);
      console.log('========================');
      
      let response;
      if (isEditMode) {
        response = await maxSupplyApi.update(id, submitData);
      } else {
        response = await maxSupplyApi.create(submitData);
      }
      
      if (response.status === 'success') {
        toast.success(isEditMode ? 'อัปเดตข้อมูลสำเร็จ' : 'สร้างงานใหม่สำเร็จ');
        navigate('/max-supply');
      } else {
        throw new Error(response.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('=== SUBMIT ERROR DEBUG ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      console.error('========================');
      
      // Handle specific authentication errors
      if (error.response?.status === 401) {
        toast.error('กรุณาเข้าสู่ระบบใหม่');
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        navigate('/login');
        return;
      }
      
      // Show detailed error message if available
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
        const errorMessages = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
        toast.error(`Validation Error:\n${errorMessages}`);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Manual refresh worksheets
  const manualRefreshWorksheets = async () => {
    try {
      toast.loading('กำลังโหลดข้อมูล Worksheet จาก NewWorksNet...', {id: 'worksheet-loading'});
      setNewworksNetLoading(true);
      
      const response = await worksheetApi.getFromNewWorksNet();
      toast.dismiss('worksheet-loading');
      
      console.log('NewWorksNet API response:', response);
      
      if (response && (response.status === 'success' || response.status === 200) && (response.data || response.worksheets)) {
        const worksheetData = response.data || response.worksheets || [];
        console.log('Raw worksheet data:', worksheetData);
        
        const options = processWorksheetData(worksheetData);
        console.log('Processed worksheet options:', options);
        
        if (options && options.length > 0) {
          setWorksheetOptions(options);
          toast.success(`โหลดข้อมูล Worksheet จาก NewWorksNet สำเร็จ (${options.length} รายการ)`);
        } else {
          toast.warning('ไม่พบข้อมูล Worksheet ที่สามารถนำมาใช้งานได้');
        }
      } else {
        toast.error('ไม่พบข้อมูลจาก NewWorksNet หรือข้อมูลมีรูปแบบไม่ถูกต้อง');
      }
    } catch (error) {
      console.error('Error refreshing worksheets:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลจาก NewWorksNet');
      toast.dismiss('worksheet-loading');
    } finally {
      setNewworksNetLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          {/* Header */}
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/max-supply')}
                variant="outlined"
                size="small"
              >
                กลับ
              </Button>
              <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                {isEditMode ? 'แก้ไขงาน Max Supply' : 'สร้างงาน Max Supply ใหม่'}
              </Typography>
            </Box>

            {/* Auto Fill Preview */}
            {autoFillPreview && (
              <Alert 
                severity="success" 
                icon={<AutoAwesome />}
                sx={{ mb: 2 }}
              >
                <Typography variant="body2">
                  <strong>ข้อมูลถูกกรอกอัตโนมัติจาก NewWorkSheet:</strong><br />
                  ลูกค้า: {autoFillPreview.customer_name} | 
                  จำนวน: {autoFillPreview.total_quantity} ตัว | 
                  ประเภท: {autoFillPreview.production_type} | 
                  ครบกำหนด: {autoFillPreview.due_date.format('DD/MM/YYYY')}
                  {autoFillPreview.newworks_code && ` | รหัส: ${autoFillPreview.newworks_code}`}
                  {autoFillPreview.fabric_info?.fabric_name && ` | ผ้า: ${autoFillPreview.fabric_info.fabric_name}`}
                </Typography>
              </Alert>
            )}

            {/* Progress Stepper */}
            <Stepper activeStep={activeStep} alternativeLabel={!isMobile}>
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel 
                    icon={
                      <Avatar 
                        sx={{ 
                          bgcolor: activeStep >= index ? 'primary.main' : 'grey.400',
                          width: 32, 
                          height: 32 
                        }}
                      >
                        {activeStep > index ? <CheckCircle /> : step.icon}
                      </Avatar>
                    }
                  >
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {step.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {step.description}
                      </Typography>
                    </Box>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          {/* Form Content */}
          <form onSubmit={(e) => e.preventDefault()}>
            {activeStep === 0 && (
              <StepBasicInfo
                formData={formData}
                errors={errors}
                worksheetOptions={worksheetOptions}
                worksheetLoading={worksheetLoading}
                selectedWorksheet={selectedWorksheet}
                onInputChange={handleInputChange}
                onWorksheetSelect={handleWorksheetSelect}
                onRefreshWorksheets={manualRefreshWorksheets}
                priorityLevels={priorityLevels}
              />
            )}

            {activeStep === 1 && (
              <StepProductionInfo
                formData={formData}
                errors={errors}
                shirtTypes={shirtTypes}
                productionTypes={productionTypes}
                sizeOptions={sizeOptions}
                selectedWorksheet={selectedWorksheet}
                onInputChange={handleInputChange}
                onSizeBreakdown={handleSizeBreakdown}
                onSizeQuantityChange={handleSizeQuantityChange}
                onPrintLocationChange={handlePrintLocationChange}
              />
            )}

            {activeStep === 2 && (
              <StepNotes
                formData={formData}
                errors={errors}
                onInputChange={handleInputChange}
              />
            )}

            {/* Navigation Buttons */}
            <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  startIcon={<NavigateBefore />}
                  variant="outlined"
                  color="primary"
                >
                  ย้อนกลับ
                </Button>
                
                <Box display="flex" gap={2}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/max-supply')}
                    startIcon={<Cancel />}
                    color="error"
                  >
                    ยกเลิก
                  </Button>
                  
                  {activeStep === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSubmit}
                      disabled={submitLoading}
                      startIcon={submitLoading ? <CircularProgress size={20} /> : <Save />}
                    >
                      {submitLoading ? 'กำลังบันทึก...' : (isEditMode ? 'อัปเดต' : 'สร้างงาน')}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleNext}
                      endIcon={<NavigateNext />}
                    >
                      ถัดไป
                    </Button>
                  )}
                </Box>
              </Box>
            </Paper>
          </form>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default MaxSupplyForm;