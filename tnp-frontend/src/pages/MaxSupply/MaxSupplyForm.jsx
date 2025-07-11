import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
  TableContainer,
  Table,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Divider,
  IconButton,
  Collapse,
  CardMedia,
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
  Warning,
  AddCircle,
  RemoveCircle,
  Image,
  Schedule,
  Person,
  Category,
  Straighten,
  Print,
  ColorLens,
  Assignment,
  ArrowBack,
  Refresh,
  CalendarToday,
  Lock,
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { maxSupplyApi, worksheetApi } from '../../services/maxSupplyApi';
import { useGetAllWorksheetQuery } from '../../features/Worksheet/worksheetApi';
import toast from 'react-hot-toast';
import { debugTokens } from '../../utils/tokenDebug';

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

  // Production types
  const productionTypes = [
    { value: 'screen', label: '📺 Screen Printing', color: '#7c3aed' },
    { value: 'dtf', label: '📱 DFT (Direct Film Transfer)', color: '#0891b2' },
    { value: 'sublimation', label: '⚽ Sublimation', color: '#16a34a' },
    { value: 'embroidery', label: '🧵 Embroidery', color: '#dc2626' },
  ];

  // Shirt types
  const shirtTypes = [
    { value: 'polo', label: 'เสื้อโปโล' },
    { value: 't-shirt', label: 'เสื้อยืด' },
    { value: 'hoodie', label: 'เสื้อฮูดี้' },
    { value: 'tank-top', label: 'เสื้อกล้าม' },
    { value: 'long-sleeve', label: 'เสื้อแขนยาว' },
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
      return worksheetItems
        .filter(ws => ws && (ws.worksheet_id || ws.id || ws.work_id))
        .filter(ws => ws.has_production !== true)
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
      
      const submitData = {
        ...formData,
        start_date: formData.start_date.format('YYYY-MM-DD'),
        expected_completion_date: formData.expected_completion_date.format('YYYY-MM-DD'),
        due_date: formData.due_date.format('YYYY-MM-DD'),
      };
      
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
      console.error('Error submitting form:', error);
      toast.error(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
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
                >
                  ย้อนกลับ
                </Button>
                
                <Box display="flex" gap={2}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/max-supply')}
                    startIcon={<Cancel />}
                  >
                    ยกเลิก
                  </Button>
                  
                  {activeStep === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={submitLoading}
                      startIcon={submitLoading ? <CircularProgress size={20} /> : <Save />}
                    >
                      {submitLoading ? 'กำลังบันทึก...' : (isEditMode ? 'อัปเดต' : 'สร้างงาน')}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
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

// Step 1: Basic Information Component
const StepBasicInfo = ({ 
  formData, 
  errors, 
  worksheetOptions, 
  worksheetLoading, 
  selectedWorksheet,
  onInputChange, 
  onWorksheetSelect, 
  onRefreshWorksheets,
  priorityLevels 
}) => {
  return (
    <Grid container spacing={3}>
      {/* Worksheet Selection */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
              เลือก Worksheet
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Autocomplete
                value={selectedWorksheet}
                onChange={(event, newValue) => onWorksheetSelect(newValue)}
                options={worksheetOptions}
                getOptionLabel={(option) => option.label || ''}
                loading={worksheetLoading}
                sx={{ flexGrow: 1 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="เลือก Worksheet เพื่อกรอกข้อมูลอัตโนมัติจาก WorkSheet"
                    variant="outlined"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {worksheetLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => {
                  // Debug log to check pattern_sizes structure
                  if (option.pattern_sizes) {
                    console.log(`Dropdown option ${option.label} pattern_sizes:`, option.pattern_sizes);
                  }
                  
                  return (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body1">{option.label}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {option.type_shirt ? `ประเภท: ${option.type_shirt}` : 'ไม่ระบุประเภท'} | 
                          {option.total_quantity ? ` ${option.total_quantity} ตัว` : ' จำนวนไม่ระบุ'} | 
                          ผ้า: {option.fabric_name || 'ไม่ระบุ'} ({option.fabric_color || 'ไม่ระบุสี'})
                          {option.due_date && ` | ครบกำหนด: ${dayjs(option.due_date).format('DD/MM/YYYY')}`}
                        </Typography>
                        {option.screen_detail && (
                          <Typography variant="body2" color="primary" sx={{ fontSize: '0.75rem' }}>
                            การพิมพ์: {option.screen_detail}
                          </Typography>
                        )}
                        {/* Display print points information */}
                        {(option.screen_point || option.screen_dft || option.screen_embroider || option.screen_flex) && (
                          <Typography variant="body2" color="secondary" sx={{ fontSize: '0.75rem' }}>
                            จุดพิมพ์: 
                            {option.screen_point && ` Screen(${option.screen_point})`}
                            {option.screen_dft && ` DTF(${option.screen_dft})`}
                            {option.screen_embroider && ` ปัก(${option.screen_embroider})`}
                            {option.screen_flex && ` Flex(${option.screen_flex})`}
                          </Typography>
                        )}
                        {/* Display pattern sizes summary with quantities */}
                        {(option.pattern_sizes || option.total_quantity) && (
                          <Typography variant="body2" color="info.main" sx={{ fontSize: '0.75rem' }}>
                            {option.pattern_sizes ? 'ไซส์: ' : 'จำนวนรวม: '}
                            {(() => {
                              if (!option.pattern_sizes) {
                                return option.total_quantity ? `${option.total_quantity} ตัว` : 'ไม่ระบุ';
                              }
                              
                              let sizeDisplay = '';
                              
                              // Handle array format
                              if (Array.isArray(option.pattern_sizes) && option.pattern_sizes.length > 0) {
                                const sizeWithQuantity = option.pattern_sizes
                                  .map(s => {
                                    const sizeName = (s.size_name || s.size || s.name || '').toString().toUpperCase();
                                    const quantity = s.quantity || 0;
                                    return sizeName && quantity > 0 ? `${sizeName}(${quantity})` : null;
                                  })
                                  .filter(Boolean);
                                
                                if (sizeWithQuantity.length > 0) {
                                  sizeDisplay = sizeWithQuantity.join(', ');
                                } else {
                                  // Fallback: show sizes without quantity if quantities are missing
                                  const sizes = option.pattern_sizes
                                    .map(s => s.size_name || s.size || s.name)
                                    .filter(Boolean)
                                    .map(s => s.toString().toUpperCase());
                                  if (sizes.length > 0) {
                                    sizeDisplay = sizes.join(', ');
                                  }
                                }
                              }
                              
                              // Handle object format with men/women
                              if (typeof option.pattern_sizes === 'object' && !Array.isArray(option.pattern_sizes)) {
                                const genderSizes = [];
                                
                                if (option.pattern_sizes.men && Array.isArray(option.pattern_sizes.men) && option.pattern_sizes.men.length > 0) {
                                  const menSizes = option.pattern_sizes.men
                                    .map(s => {
                                      const sizeName = (s.size_name || s.size || s.name || '').toString().toUpperCase();
                                      const quantity = s.quantity || 0;
                                      return sizeName && quantity > 0 ? `${sizeName}(${quantity})` : null;
                                    })
                                    .filter(Boolean);
                                  
                                  if (menSizes.length > 0) {
                                    genderSizes.push(`ชาย: ${menSizes.join(', ')}`);
                                  } else {
                                    // Fallback: show men sizes without quantity
                                    const menSizesOnly = option.pattern_sizes.men
                                      .map(s => s.size_name || s.size || s.name)
                                      .filter(Boolean)
                                      .map(s => s.toString().toUpperCase());
                                    if (menSizesOnly.length > 0) {
                                      genderSizes.push(`ชาย: ${menSizesOnly.join(', ')}`);
                                    }
                                  }
                                }
                                
                                if (option.pattern_sizes.women && Array.isArray(option.pattern_sizes.women) && option.pattern_sizes.women.length > 0) {
                                  const womenSizes = option.pattern_sizes.women
                                    .map(s => {
                                      const sizeName = (s.size_name || s.size || s.name || '').toString().toUpperCase();
                                      const quantity = s.quantity || 0;
                                      return sizeName && quantity > 0 ? `${sizeName}(${quantity})` : null;
                                    })
                                    .filter(Boolean);
                                  
                                  if (womenSizes.length > 0) {
                                    genderSizes.push(`หญิง: ${womenSizes.join(', ')}`);
                                  } else {
                                    // Fallback: show women sizes without quantity
                                    const womenSizesOnly = option.pattern_sizes.women
                                      .map(s => s.size_name || s.size || s.name)
                                      .filter(Boolean)
                                      .map(s => s.toString().toUpperCase());
                                    if (womenSizesOnly.length > 0) {
                                      genderSizes.push(`หญิง: ${womenSizesOnly.join(', ')}`);
                                    }
                                  }
                                }
                                
                                sizeDisplay = genderSizes.join(' | ');
                              }
                              
                              return sizeDisplay || (option.total_quantity ? `${option.total_quantity} ตัว` : 'ไม่ระบุ');
                            })()}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  );
                }}
                noOptionsText="ไม่พบ Worksheet จาก NewWorksNet"
              />
              <Button 
                variant="outlined" 
                onClick={onRefreshWorksheets} 
                title="โหลดข้อมูล Worksheet จาก NewWorksNet"
                sx={{ height: 56 }}
              >
                <Refresh />
              </Button>
            </Box>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>1.</strong> คลิกปุ่มรีเฟรช <Refresh fontSize="small" /> เพื่อดึงข้อมูลล่าสุดจากระบบ NewWorkSheet<br/>
                <strong>2.</strong> เลือกรายการที่ต้องการจากรายการ NewWorkSheet ด้านบน<br/>
                <strong>3.</strong> ระบบจะกรอกข้อมูลให้อัตโนมัติตามข้อมูลที่มีใน NewWorkSheet<br/>
                
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Grid>

      {/* Basic Information */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
              ข้อมูลพื้นฐาน
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="ชื่องาน"
                  value={formData.title}
                  onChange={(e) => onInputChange('title', e.target.value)}
                  error={!!errors.title}
                  helperText={errors.title}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="ชื่อลูกค้า"
                  value={formData.customer_name}
                  onChange={(e) => onInputChange('customer_name', e.target.value)}
                  error={!!errors.customer_name}
                  helperText={errors.customer_name}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>ระดับความสำคัญ</InputLabel>
                  <Select
                    value={formData.priority}
                    onChange={(e) => onInputChange('priority', e.target.value)}
                    label="ระดับความสำคัญ"
                  >
                    {priorityLevels.map((level) => (
                      <MenuItem key={level.value} value={level.value}>
                        <Box display="flex" alignItems="center">
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              backgroundColor: level.color,
                              borderRadius: '50%',
                              mr: 1,
                            }}
                          />
                          {level.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Sample Image */}
      {formData.sample_image && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Image sx={{ mr: 1, verticalAlign: 'middle' }} />
                รูปตัวอย่างเสื้อ
              </Typography>
              <CardMedia
                component="img"
                height="200"
                image={formData.sample_image}
                alt="Sample shirt"
                sx={{ objectFit: 'contain', borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* NewWorksNet Additional Info */}
      {(formData.fabric_info || formData.pattern_info || formData.newworks_code) && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
                ข้อมูลเพิ่มเติมจาก NewWorksNet
              </Typography>
              
              <Grid container spacing={2}>
                {formData.newworks_code && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2">
                      <strong>รหัสงาน:</strong> {formData.newworks_code}
                    </Typography>
                  </Grid>
                )}
                
                {formData.fabric_info?.fabric_name && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2">
                      <strong>ผ้า:</strong> {formData.fabric_info.fabric_name}
                      {formData.fabric_info.fabric_color && ` (${formData.fabric_info.fabric_color})`}
                      {formData.fabric_info.fabric_factory && ` - โรงงาน: ${formData.fabric_info.fabric_factory}`}
                    </Typography>
                  </Grid>
                )}
                
                {formData.pattern_info?.pattern_name && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2">
                      <strong>แพทเทิร์น:</strong> {formData.pattern_info.pattern_name}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Dates */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
              กำหนดเวลา
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="วันที่เริ่มต้น (วันที่ปัจจุบัน)"
                  value={formData.start_date}
                  onChange={(date) => onInputChange('start_date', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.start_date,
                      helperText: errors.start_date || "วันที่เริ่มต้นงาน (ตั้งเป็นวันที่ปัจจุบัน)",
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="วันที่คาดว่าจะเสร็จ"
                  value={formData.expected_completion_date}
                  onChange={(date) => onInputChange('expected_completion_date', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.expected_completion_date,
                      helperText: errors.expected_completion_date,
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="วันที่ครบกำหนด"
                  value={formData.due_date}
                  onChange={(date) => onInputChange('due_date', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.due_date,
                      helperText: errors.due_date || "วันที่ครบกำหนดจาก NewWorksNet",
                    },
                  }}
                />
              </Grid>
            </Grid>
            
            {formData.expected_completion_date && formData.due_date && 
             formData.expected_completion_date.isAfter(formData.due_date) && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Warning sx={{ mr: 1 }} />
                วันที่คาดว่าจะเสร็จเกินกำหนดส่งมอบจาก NewWorksNet กรุณาตรวจสอบอีกครั้ง
              </Alert>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Step 2: Production Information Component
const StepProductionInfo = ({ 
  formData, 
  errors, 
  shirtTypes, 
  productionTypes,
  sizeOptions,
  selectedWorksheet,
  onInputChange, 
  onSizeBreakdown,
  onSizeQuantityChange,
  onPrintLocationChange 
}) => {
  // Check if data is auto-filled from worksheet
  const isAutoFilled = Boolean(selectedWorksheet && formData.worksheet_id);
  
  return (
    <Grid container spacing={3}>
      {/* Shirt Type */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Category sx={{ mr: 1, verticalAlign: 'middle' }} />
              ประเภทเสื้อ 
            </Typography>
            
            <FormControl fullWidth error={!!errors.shirt_type}>
              <InputLabel>ประเภทเสื้อ</InputLabel>
              <Select
                value={formData.shirt_type}
                onChange={(e) => onInputChange('shirt_type', e.target.value)}
                label="ประเภทเสื้อ"
              >
                {shirtTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.shirt_type && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  {errors.shirt_type}
                </Typography>
              )}
            </FormControl>
          </CardContent>
        </Card>
      </Grid>

      {/* Work Calculation Section */}
      {isAutoFilled && (
        <Grid item xs={12}>
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
        </Grid>
      )}

      {/* Size Selection */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Straighten sx={{ mr: 1, verticalAlign: 'middle' }} />
              ขนาดและจำนวน
              {isAutoFilled && (
                <Lock sx={{ ml: 1, verticalAlign: 'middle', color: 'warning.main' }} />
              )}
            </Typography>
            
            {/* Auto-fill warning */}
            {isAutoFilled && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>ข้อมูลนี้ถูกกำหนดจาก NewWorksNet:</strong><br/>
                  
                </Typography>
              </Alert>
            )}
            
            <Autocomplete
              multiple
              value={formData.sizes}
              onChange={(event, newValue) => !isAutoFilled && onSizeBreakdown(newValue)}
              options={sizeOptions}
              disabled={isAutoFilled}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    {...getTagProps({ index })}
                    key={option}
                    onDelete={isAutoFilled ? undefined : getTagProps({ index }).onDelete}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="เลือกไซส์ (Auto Fill จาก NewWorksNet pattern_sizes)"
                  placeholder={isAutoFilled ? "ไซส์ถูกกำหนดจาก NewWorksNet (ไม่สามารถแก้ไขได้)" : "เลือกไซส์ที่ต้องการ"}
                  error={!!errors.sizes}
                  helperText={errors.sizes || (isAutoFilled ? "ไซส์ถูกดึงมาจาก NewWorksNet และไม่สามารถแก้ไขได้" : "ไซส์จะถูกดึงมาจาก pattern_sizes (men/women) ใน NewWorksNet")}
                />
              )}
            />
            
            {/* Show pattern sizes info if available */}
            {formData.size_breakdown.some(item => item.gender) && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>ข้อมูลไซส์จาก NewWorksNet pattern_sizes:</strong>
                  <br/>
                  {formData.size_breakdown.filter(item => item.gender === 'men').length > 0 && (
                    <>ชาย: {formData.size_breakdown.filter(item => item.gender === 'men').map(item => `${item.size}(${item.quantity})`).join(', ')}<br/></>
                  )}
                  {formData.size_breakdown.filter(item => item.gender === 'women').length > 0 && (
                    <>หญิง: {formData.size_breakdown.filter(item => item.gender === 'women').map(item => `${item.size}(${item.quantity})`).join(', ')}</>
                  )}
                </Typography>
              </Alert>
            )}
            
            {/* Size Breakdown Table */}
            {formData.size_breakdown.length > 0 && (
              <TableContainer sx={{ mt: 2 }}>
                <Table>
                  <TableBody>
                    {formData.size_breakdown.map((item, index) => (
                      <TableRow key={`${item.size}-${item.gender || 'unisex'}-${index}`}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip 
                              label={item.size} 
                              variant="outlined" 
                              color={item.gender === 'men' ? 'primary' : item.gender === 'women' ? 'secondary' : 'default'}
                              size="small"
                            />
                            {item.gender && (
                              <Typography variant="caption" color="text.secondary">
                                {item.gender === 'men' ? 'ชาย' : item.gender === 'women' ? 'หญิง' : ''}
                              </Typography>
                            )}
                            {item.details?.chest && (
                              <Typography variant="caption" color="text.secondary">
                                (อก: {item.details.chest}")
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={(e) => !isAutoFilled && onSizeQuantityChange(index, parseInt(e.target.value) || 0)}
                            inputProps={{ min: 0, readOnly: isAutoFilled }}
                            size="small"
                            sx={{ width: 80 }}
                            disabled={isAutoFilled}
                            
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell><strong>รวม</strong></TableCell>
                      <TableCell><strong>{formData.total_quantity} ตัว</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Print Locations */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Print sx={{ mr: 1, verticalAlign: 'middle' }} />
              จุดพิมพ์
            </Typography>
            
            <Grid container spacing={2}>
              {/* Screen Printing */}
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      📺 Screen Printing
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>เปิดใช้งาน</InputLabel>
                      <Select
                        value={formData.print_locations.screen.enabled}
                        onChange={(e) => onPrintLocationChange('screen', 'enabled', e.target.value)}
                        label="เปิดใช้งาน"
                      >
                        <MenuItem value={false}>ไม่ใช้</MenuItem>
                        <MenuItem value={true}>ใช้</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Collapse in={formData.print_locations.screen.enabled}>
                      <TextField
                        label="ตำแหน่งพิมพ์"
                        value={formData.print_locations.screen.position}
                        onChange={(e) => onPrintLocationChange('screen', 'position', e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                        placeholder="เช่น หน้า, หลัง, แขน"
                      />
                      <TextField
                        label="จำนวนจุดพิมพ์"
                        type="number"
                        value={formData.print_locations.screen.points}
                        onChange={(e) => onPrintLocationChange('screen', 'points', parseInt(e.target.value) || 0)}
                        fullWidth
                        inputProps={{ min: 0 }}
                        helperText="จำนวนจุดที่ต้องสกรีน (screen_point)"
                      />
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>

              {/* DTF */}
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      📱 DTF (Direct to Film)
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>เปิดใช้งาน</InputLabel>
                      <Select
                        value={formData.print_locations.dtf.enabled}
                        onChange={(e) => onPrintLocationChange('dtf', 'enabled', e.target.value)}
                        label="เปิดใช้งาน"
                      >
                        <MenuItem value={false}>ไม่ใช้</MenuItem>
                        <MenuItem value={true}>ใช้</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Collapse in={formData.print_locations.dtf.enabled}>
                      <TextField
                        label="ตำแหน่งพิมพ์"
                        value={formData.print_locations.dtf.position}
                        onChange={(e) => onPrintLocationChange('dtf', 'position', e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                        placeholder="เช่น หน้า, หลัง, แขน"
                      />
                      <TextField
                        label="จำนวนจุดพิมพ์"
                        type="number"
                        value={formData.print_locations.dtf.points}
                        onChange={(e) => onPrintLocationChange('dtf', 'points', parseInt(e.target.value) || 0)}
                        fullWidth
                        inputProps={{ min: 0 }}
                        helperText="จำนวนจุดที่ต้อง DTF (screen_dft)"
                      />
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>

              {/* Sublimation/Flex */}
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      ⚽ Sublimation/Flex
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>เปิดใช้งาน</InputLabel>
                      <Select
                        value={formData.print_locations.sublimation.enabled}
                        onChange={(e) => onPrintLocationChange('sublimation', 'enabled', e.target.value)}
                        label="เปิดใช้งาน"
                      >
                        <MenuItem value={false}>ไม่ใช้</MenuItem>
                        <MenuItem value={true}>ใช้</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Collapse in={formData.print_locations.sublimation.enabled}>
                      <TextField
                        label="ตำแหน่งพิมพ์"
                        value={formData.print_locations.sublimation.position}
                        onChange={(e) => onPrintLocationChange('sublimation', 'position', e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                        placeholder="เช่น หน้า, หลัง, แขน"
                      />
                      <TextField
                        label="จำนวนจุดพิมพ์"
                        type="number"
                        value={formData.print_locations.sublimation.points}
                        onChange={(e) => onPrintLocationChange('sublimation', 'points', parseInt(e.target.value) || 0)}
                        fullWidth
                        inputProps={{ min: 0 }}
                        helperText="จำนวนจุด Sublimation/Flex (screen_flex)"
                      />
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>

              {/* Embroidery */}
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      🧵 Embroidery (ปัก)
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>เปิดใช้งาน</InputLabel>
                      <Select
                        value={formData.print_locations.embroidery.enabled}
                        onChange={(e) => onPrintLocationChange('embroidery', 'enabled', e.target.value)}
                        label="เปิดใช้งาน"
                      >
                        <MenuItem value={false}>ไม่ใช้</MenuItem>
                        <MenuItem value={true}>ใช้</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Collapse in={formData.print_locations.embroidery.enabled}>
                      <TextField
                        label="ตำแหน่งปัก"
                        value={formData.print_locations.embroidery.position}
                        onChange={(e) => onPrintLocationChange('embroidery', 'position', e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                        placeholder="เช่น หน้า, หลัง, แขน"
                      />
                      <TextField
                        label="จำนวนจุดปัก"
                        type="number"
                        value={formData.print_locations.embroidery.points}
                        onChange={(e) => onPrintLocationChange('embroidery', 'points', parseInt(e.target.value) || 0)}
                        fullWidth
                        inputProps={{ min: 0 }}
                        helperText="จำนวนจุดที่ต้องปัก (screen_embroider)"
                      />
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Step 3: Notes Component
const StepNotes = ({ formData, errors, onInputChange }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Note sx={{ mr: 1, verticalAlign: 'middle' }} />
              หมายเหตุและข้อมูลเพิ่มเติม
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="หมายเหตุทั่วไป"
                  value={formData.notes}
                  onChange={(e) => onInputChange('notes', e.target.value)}
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="หมายเหตุเพิ่มเติม..."
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="คำแนะนำพิเศษ"
                  value={formData.special_instructions}
                  onChange={(e) => onInputChange('special_instructions', e.target.value)}
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="คำแนะนำพิเศษสำหรับการผลิต..."
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Summary */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
              สรุปข้อมูล
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2"><strong>ชื่องาน:</strong> {formData.title}</Typography>
                <Typography variant="body2"><strong>ลูกค้า:</strong> {formData.customer_name}</Typography>
                <Typography variant="body2"><strong>ประเภทเสื้อ:</strong> {formData.shirt_type}</Typography>
                <Typography variant="body2"><strong>จำนวนรวม:</strong> {formData.total_quantity} ตัว</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2"><strong>วันที่เริ่ม:</strong> {formData.start_date?.format('DD/MM/YYYY')}</Typography>
                <Typography variant="body2"><strong>วันที่คาดว่าจะเสร็จ:</strong> {formData.expected_completion_date?.format('DD/MM/YYYY')}</Typography>
                <Typography variant="body2"><strong>วันที่ครบกำหนด:</strong> {formData.due_date?.format('DD/MM/YYYY')}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default MaxSupplyForm;