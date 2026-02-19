import { Card, CardMedia, Typography, IconButton, Chip, Box } from "@mui/material";
import { MdEdit, MdDelete } from "react-icons/md";
import { useNavigate } from "react-router-dom";

import { getCoverImageUrl, formatPrice, PRIMARY_RED } from "../utils";

/**
 * ProductListItem - Card component for displaying product in list view
 */
const ProductListItem = ({ product, onDelete, isAdmin }) => {
  const navigate = useNavigate();
  const coverUrl = getCoverImageUrl(product);

  return (
    <Card
      sx={{
        display: "flex",
        alignItems: "center",
        p: 1.5,
        cursor: "pointer",
        "&:hover": { boxShadow: 3 },
      }}
      onClick={() => navigate(`/supplier/view/${product.sp_id}`)}
    >
      {coverUrl ? (
        <CardMedia
          component="img"
          sx={{
            width: 80,
            height: 80,
            borderRadius: 1,
            objectFit: "cover",
            mr: 2,
          }}
          image={coverUrl}
          alt={product.sp_name}
        />
      ) : (
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: 1,
            bgcolor: "#f5f5f5",
            mr: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontFamily: "Kanit", fontSize: 10 }}
          >
            ไม่มีรูป
          </Typography>
        </Box>
      )}

      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle2" sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
          {product.sp_name}
        </Typography>

        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "Kanit" }}>
          {product.sp_sku && `SKU: ${product.sp_sku} | `}
          {product.sp_supplier_name && `Supplier: ${product.sp_supplier_name}`}
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            mt: 0.5,
            flexWrap: "wrap",
          }}
        >
          {product.category && (
            <Chip
              label={product.category.spc_name}
              size="small"
              sx={{ fontFamily: "Kanit", fontSize: 11 }}
            />
          )}
          {product.tags?.slice(0, 3).map((tag) => (
            <Chip
              key={tag.spt_id}
              label={tag.spt_name}
              size="small"
              variant="outlined"
              sx={{ fontFamily: "Kanit", fontSize: 10 }}
            />
          ))}
        </Box>
      </Box>

      <Box sx={{ textAlign: "right", mr: 1 }}>
        <Typography
          variant="body2"
          sx={{
            fontFamily: "Kanit",
            fontWeight: 600,
            color: PRIMARY_RED,
          }}
        >
          {formatPrice(product.sp_price_thb || product.sp_base_price)}
        </Typography>
        {product.sp_currency !== "THB" && (
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "Kanit" }}>
            {formatPrice(product.sp_base_price, product.sp_currency)}
          </Typography>
        )}
      </Box>

      <Box>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/supplier/edit/${product.sp_id}`);
          }}
        >
          <MdEdit size={18} />
        </IconButton>
        {isAdmin && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(product);
            }}
            sx={{ color: PRIMARY_RED }}
          >
            <MdDelete size={18} />
          </IconButton>
        )}
      </Box>
    </Card>
  );
};

export default ProductListItem;
