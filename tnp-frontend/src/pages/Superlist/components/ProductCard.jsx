import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Box,
} from "@mui/material";
import { MdEdit, MdDelete } from "react-icons/md";
import { useNavigate } from "react-router-dom";

import { getCoverImageUrl, formatPrice, PRIMARY_RED } from "../utils";

/**
 * ProductCard - Card component for displaying product in grid view
 */
const ProductCard = ({ product, onDelete, isAdmin }) => {
  const navigate = useNavigate();
  const coverUrl = getCoverImageUrl(product);

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: 4 },
      }}
      onClick={() => navigate(`/supplier/view/${product.sp_id}`)}
    >
      {coverUrl ? (
        <CardMedia
          component="img"
          height="180"
          image={coverUrl}
          alt={product.sp_name}
          sx={{ objectFit: "cover" }}
        />
      ) : (
        <Box
          sx={{
            height: 180,
            bgcolor: "#f5f5f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "Kanit" }}>
            ไม่มีรูป
          </Typography>
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1, pb: 0 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontFamily: "Kanit",
            fontWeight: 600,
            mb: 0.5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {product.sp_name}
        </Typography>

        {product.sp_sku && (
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "Kanit" }}>
            SKU: {product.sp_sku}
          </Typography>
        )}

        <Typography
          variant="body2"
          sx={{
            fontFamily: "Kanit",
            fontWeight: 600,
            color: PRIMARY_RED,
            mt: 0.5,
          }}
        >
          {product.sp_currency !== "THB" && product.sp_price_thb
            ? `${formatPrice(product.sp_base_price, product.sp_currency)} (${formatPrice(product.sp_price_thb)})`
            : formatPrice(product.sp_price_thb || product.sp_base_price)}
        </Typography>

        {product.category && (
          <Chip
            label={product.category.mpc_name}
            size="small"
            sx={{
              mt: 0.5,
              fontFamily: "Kanit",
              fontSize: 11,
            }}
          />
        )}

        {product.tags?.length > 0 && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 0.3,
              mt: 0.5,
            }}
          >
            {product.tags.slice(0, 3).map((tag) => (
              <Chip
                key={tag.spt_id}
                label={tag.spt_name}
                size="small"
                variant="outlined"
                sx={{ fontFamily: "Kanit", fontSize: 10 }}
              />
            ))}
            {product.tags.length > 3 && (
              <Chip
                label={`+${product.tags.length - 3}`}
                size="small"
                variant="outlined"
                sx={{ fontFamily: "Kanit", fontSize: 10 }}
              />
            )}
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: "flex-end", pt: 0 }}>
        <Tooltip title="แก้ไข">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/supplier/edit/${product.sp_id}`);
            }}
          >
            <MdEdit size={18} />
          </IconButton>
        </Tooltip>
        {isAdmin && (
          <Tooltip title="ลบ">
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
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};

export default ProductCard;
