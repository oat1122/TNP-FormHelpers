import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Chip,
  Avatar,
  Tabs,
  Tab,
  Pagination,
  CircularProgress,
  Alert,
  Badge,
  Tooltip,
  Divider,
  Stack
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Category as CategoryIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  Image as ImageIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { productService } from '../../../features/Accounting';
import { debounce } from 'lodash';

/**
 * ProductSelector component
 * Modal dialog สำหรับเลือกสินค้าพร้อมระบุจำนวนและราคา
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether dialog is open
 * @param {function} props.onClose - Close handler
 * @param {function} props.onConfirm - Confirm handler (selectedItems) => void
 * @param {Array} props.selectedItems - Currently selected items
 * @param {boolean} props.multiple - Allow multiple selection
 * @param {Array} props.excludeIds - Product IDs to exclude
 * @param {Array} props.categories - Product categories to show
 * @param {boolean} props.showQuantity - Whether to show quantity input
 * @param {boolean} props.showPrice - Whether to show price input
 * @param {string} props.title - Dialog title
 * @param {Object} props.defaultValues - Default values for new items
 */
const ProductSelector = ({
  open = false,
  onClose,
  onConfirm,
  selectedItems = [],
  multiple = true,
  excludeIds = [],
  categories = [],
  showQuantity = true,
  showPrice = true,
  title = 'เลือกสินค้า',
  defaultValues = {
    quantity: 1,
    unit_price: 0,
    discount_percentage: 0
  }
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productCategories, setProductCategories] = useState([]);
  
  // Local selected items state
  const [localSelectedItems, setLocalSelectedItems] = useState(selectedItems);
  const [cart, setCart] = useState(new Map());

  // Initialize cart from selected items
  useEffect(() => {
    const newCart = new Map();
    selectedItems.forEach(item => {
      newCart.set(item.product_id || item.id, {
        product: item.product || item,
        quantity: item.quantity || defaultValues.quantity,
        unit_price: item.unit_price || item.price || defaultValues.unit_price,
        discount_percentage: item.discount_percentage || defaultValues.discount_percentage
      });
    });
    setCart(newCart);
    setLocalSelectedItems(selectedItems);
  }, [selectedItems, defaultValues]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce(async (search, category, currentPage) => {
      setLoading(true);
      setError(null);

      try {
        const params = {
          page: currentPage,
          per_page: 12,
          ...(search && { search }),
          ...(category !== 'all' && { category }),
          ...(categories.length > 0 && { categories }),
          ...(excludeIds.length > 0 && { exclude_ids: excludeIds }),
          status: 'active'
        };

        const response = await productService.fetchProducts(params);
        
        if (response.data && response.data.data) {
          setProducts(response.data.data);
          setTotalPages(response.data.last_page || 1);
        } else {
          setProducts([]);
          setTotalPages(1);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('ไม่สามารถโหลดข้อมูลสินค้าได้');
        setProducts([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }, 300),
    [categories, excludeIds]
  );

  // Load product categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await productService.fetchProductCategories();
        if (response.data && response.data.data) {
          setProductCategories(response.data.data);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };

    if (open) {
      loadCategories();
    }
  }, [open]);

  // Search products
  useEffect(() => {
    if (open) {
      debouncedSearch(searchTerm, selectedCategory, page);
    }
    return () => debouncedSearch.cancel();
  }, [searchTerm, selectedCategory, page, open, debouncedSearch]);

  const handleAddToCart = (product) => {
    const newCart = new Map(cart);
    newCart.set(product.id, {
      product,
      quantity: defaultValues.quantity,
      unit_price: product.price || defaultValues.unit_price,
      discount_percentage: defaultValues.discount_percentage
    });
    setCart(newCart);
  };

  const handleRemoveFromCart = (productId) => {
    const newCart = new Map(cart);
    newCart.delete(productId);
    setCart(newCart);
  };

  const handleUpdateCartItem = (productId, field, value) => {
    const newCart = new Map(cart);
    const item = newCart.get(productId);
    if (item) {
      item[field] = field === 'quantity' ? Math.max(0, parseInt(value) || 0) : parseFloat(value) || 0;
      newCart.set(productId, item);
      setCart(newCart);
    }
  };

  const isInCart = (productId) => cart.has(productId);

  const getTotalItems = () => cart.size;

  const getTotalAmount = () => {
    let total = 0;
    cart.forEach(item => {
      const itemTotal = item.quantity * item.unit_price;
      const discount = itemTotal * (item.discount_percentage / 100);
      total += itemTotal - discount;
    });
    return total;
  };

  const handleConfirm = () => {
    const items = Array.from(cart.values()).map(item => ({
      product_id: item.product.id,
      product: item.product,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percentage: item.discount_percentage,
      total_amount: (item.quantity * item.unit_price) * (1 - item.discount_percentage / 100)
    }));

    if (onConfirm) {
      onConfirm(items);
    }
    onClose();
  };

  const handleClose = () => {
    // Reset cart to original state
    const originalCart = new Map();
    selectedItems.forEach(item => {
      originalCart.set(item.product_id || item.id, {
        product: item.product || item,
        quantity: item.quantity || defaultValues.quantity,
        unit_price: item.unit_price || item.price || defaultValues.unit_price,
        discount_percentage: item.discount_percentage || defaultValues.discount_percentage
      });
    });
    setCart(originalCart);
    onClose();
  };

  const renderProductCard = (product) => (
    <Card 
      key={product.id}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      {/* Product Image */}
      <CardMedia 
        sx={{ 
          height: 160, 
          bgcolor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover' 
            }}
          />
        ) : (
          <ImageIcon sx={{ fontSize: 48, color: 'grey.400' }} />
        )}
      </CardMedia>

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Typography variant="h6" component="h3" gutterBottom noWrap>
          {product.name}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          รหัส: {product.sku || product.code || '-'}
        </Typography>
        
        <Typography variant="h6" color="primary.main" gutterBottom>
          ฿{(product.price || 0).toLocaleString()}
        </Typography>

        {product.category && (
          <Chip 
            label={product.category}
            size="small"
            variant="outlined"
            color="primary"
            sx={{ mb: 1 }}
          />
        )}

        {product.description && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 1
            }}
          >
            {product.description}
          </Typography>
        )}
      </CardContent>

      {/* Add/Remove Button */}
      <Box sx={{ p: 2, pt: 0 }}>
        {isInCart(product.id) ? (
          <Button
            fullWidth
            variant="contained"
            color="success"
            startIcon={<Remove />}
            onClick={() => handleRemoveFromCart(product.id)}
          >
            เอาออกจากตะกร้า
          </Button>
        ) : (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleAddToCart(product)}
          >
            เพิ่มในตะกร้า
          </Button>
        )}
      </Box>
    </Card>
  );

  const renderCartItems = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        สินค้าที่เลือก ({getTotalItems()})
      </Typography>
      
      {cart.size === 0 ? (
        <Alert severity="info">ยังไม่ได้เลือกสินค้า</Alert>
      ) : (
        <Stack spacing={2}>
          {Array.from(cart.entries()).map(([productId, item]) => (
            <Card key={productId} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    <CategoryIcon />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {item.product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      รหัส: {item.product.sku || item.product.code || '-'}
                    </Typography>
                  </Box>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleRemoveFromCart(productId)}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Grid container spacing={2}>
                  {showQuantity && (
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="จำนวน"
                        type="number"
                        size="small"
                        fullWidth
                        value={item.quantity}
                        onChange={(e) => handleUpdateCartItem(productId, 'quantity', e.target.value)}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                  )}
                  
                  {showPrice && (
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="ราคาต่อหน่วย"
                        type="number"
                        size="small"
                        fullWidth
                        value={item.unit_price}
                        onChange={(e) => handleUpdateCartItem(productId, 'unit_price', e.target.value)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">฿</InputAdornment>
                        }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>
                  )}
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="ส่วนลด %"
                      type="number"
                      size="small"
                      fullWidth
                      value={item.discount_percentage}
                      onChange={(e) => handleUpdateCartItem(productId, 'discount_percentage', e.target.value)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>
                      }}
                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" color="primary.main" textAlign="right">
                  รวม: ฿{((item.quantity * item.unit_price) * (1 - item.discount_percentage / 100)).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          ))}
          
          <Card sx={{ bgcolor: 'primary.50' }}>
            <CardContent>
              <Typography variant="h5" color="primary.main" textAlign="right" fontWeight="bold">
                ยอดรวมทั้งหมด: ฿{getTotalAmount().toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">{title}</Typography>
          <Badge badgeContent={getTotalItems()} color="primary">
            <CartIcon />
          </Badge>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3} sx={{ height: '100%' }}>
          {/* Product Selection */}
          <Grid item xs={12} md={8}>
            {/* Search and Filter */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="ค้นหาชื่อสินค้า รหัสสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 2 }}
              />

              {/* Category Tabs */}
              <Tabs
                value={selectedCategory}
                onChange={(e, newValue) => {
                  setSelectedCategory(newValue);
                  setPage(1);
                }}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="ทั้งหมด" value="all" />
                {productCategories.map(category => (
                  <Tab key={category.id} label={category.name} value={category.id} />
                ))}
              </Tabs>
            </Box>

            {/* Error */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Products Grid */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Grid container spacing={2}>
                  {products.map(product => (
                    <Grid item xs={12} sm={6} md={4} key={product.id}>
                      {renderProductCard(product)}
                    </Grid>
                  ))}
                </Grid>

                {products.length === 0 && !loading && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา
                  </Alert>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(e, value) => setPage(value)}
                      color="primary"
                    />
                  </Box>
                )}
              </>
            )}
          </Grid>

          {/* Shopping Cart */}
          <Grid item xs={12} md={4}>
            <Box sx={{ position: 'sticky', top: 0 }}>
              {renderCartItems()}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          ยกเลิก
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained"
          disabled={cart.size === 0}
        >
          ตกลง ({getTotalItems()} รายการ)
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductSelector;