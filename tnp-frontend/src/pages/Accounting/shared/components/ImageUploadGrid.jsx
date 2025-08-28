import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { SecondaryButton, tokens } from '../../PricingIntegration/components/quotation/styles/quotationTheme';

/**
 * ImageUploadGrid
 * - Reusable preview grid + upload button
 * - images: array of { url?, path?, filename?, original_filename? } or string path
 * - onUpload(files: File[]): Promise (handles server upload + parent state update)
 * - onDelete?(image): optional delete handler
 * - disabled?: boolean
 * - title?: string
 * - helperText?: string (shown under button)
 */
const ImageUploadGrid = ({
  images = [],
  onUpload,
  onDelete,
  disabled = false,
  title = 'รูปภาพ',
  helperText = 'รองรับ JPG / PNG ขนาดไม่เกิน 5MB ต่อไฟล์',
}) => {
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef(null);
  const [preview, setPreview] = React.useState(null); // { url, filename }

  const normalizeUrl = (img) => {
    if (!img) return '';
    if (typeof img === 'string') {
      // treat as storage path like 'public/images/...'
      const rel = img.replace(/^public\//, '');
      return `${window.location.origin}/storage/${rel}`;
    }
    let u = img.url || '';
    if (!u && img.path) {
      const rel = img.path.replace(/^public\//, '');
      u = `${window.location.origin}/storage/${rel}`;
    }
    if (u && u.startsWith('storage/')) {
      return `${window.location.origin}/${u}`;
    }
    return u;
  };

  const handleChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !onUpload) return;
    setIsUploading(true);
    try {
      await onUpload(files);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>{title}</Typography>
        <SecondaryButton component="label" disabled={disabled || isUploading}>
          {isUploading ? 'กำลังอัปโหลด…' : 'อัปโหลดรูปภาพ'}
          <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleChange} />
        </SecondaryButton>
      </Box>

      {helperText && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{helperText}</Typography>
      )}

      {(!images || images.length === 0) && (
        <Box sx={{ p: 2, border: '1px dashed ' + tokens.border, borderRadius: 1, bgcolor: '#fff' }}>
          <Typography variant="body2" color="text.secondary">ยังไม่มีรูปภาพ</Typography>
        </Box>
      )}

      {Array.isArray(images) && images.length > 0 && (
        <Grid container spacing={1}>
          {images.map((img, idx) => {
            const url = normalizeUrl(img);
            const filename = img?.original_filename || img?.filename || (typeof img === 'string' ? img.split('/').pop() : `image_${idx+1}`);
            return (
              <Grid item key={idx} xs={6} md={3}>
                <Box sx={{ border:'1px solid '+tokens.border, borderRadius:1, p:1, bgcolor:'#fff', cursor:'pointer', position:'relative', '&:hover .hover-actions':{opacity:1} }} onClick={() => setPreview({ url, filename })}>
                  <Box sx={{ position:'relative', pb:'70%', overflow:'hidden', borderRadius:1, mb:1, background:'#fafafa' }}>
                    <img src={url} alt={filename} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', objectFit:'contain' }} />
                    {onDelete && (
                      <Box className="hover-actions" sx={{ position:'absolute', top:4, right:4, display:'flex', gap:0.5, opacity:0, transition:'opacity 0.2s' }} onClick={(e)=>e.stopPropagation()}>
                        <SecondaryButton size="small" color="error" onClick={() => onDelete(img)}>ลบ</SecondaryButton>
                      </Box>
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ display:'block', wordBreak:'break-all' }}>{filename}</Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Simple image preview */}
      {preview && (
        <Box sx={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1300 }} onClick={()=>setPreview(null)}>
          <Box sx={{ maxWidth:'90vw', maxHeight:'85vh' }}>
            <img src={preview.url} alt={preview.filename} style={{ maxWidth:'100%', maxHeight:'85vh', objectFit:'contain', display:'block' }} />
            <Typography variant="caption" sx={{ color:'#fff' }}>{preview.filename}</Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ImageUploadGrid;

