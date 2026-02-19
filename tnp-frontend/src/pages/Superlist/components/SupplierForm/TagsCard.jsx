import { Box, Typography, TextField, Card, CardContent, Chip, Autocomplete } from "@mui/material";

/**
 * TagsCard - Card section for tag selection and creation
 */
const TagsCard = ({ tags, selectedTags, setSelectedTags, handleCreateTag, isView }) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontFamily: "Kanit", fontWeight: 600, mb: 2 }}>
          Tags
        </Typography>

        {!isView && (
          <Autocomplete
            multiple
            freeSolo
            size="small"
            options={tags}
            value={selectedTags}
            getOptionLabel={(option) => (typeof option === "string" ? option : option.spt_name)}
            isOptionEqualToValue={(option, value) => option.spt_id === value.spt_id}
            onChange={(e, newValue) => {
              const lastItem = newValue[newValue.length - 1];
              if (typeof lastItem === "string") {
                handleCreateTag(lastItem);
                return;
              }
              setSelectedTags(newValue);
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  key={option.spt_id}
                  label={option.spt_name}
                  size="small"
                  {...getTagProps({ index })}
                  sx={{ fontFamily: "Kanit" }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="เลือก Tags (พิมพ์เพื่อสร้างใหม่)"
                InputProps={{
                  ...params.InputProps,
                  style: { fontFamily: "Kanit" },
                }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            )}
          />
        )}

        {isView && selectedTags.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {selectedTags.map((tag) => (
              <Chip
                key={tag.spt_id}
                label={tag.spt_name}
                size="small"
                sx={{ fontFamily: "Kanit" }}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TagsCard;
