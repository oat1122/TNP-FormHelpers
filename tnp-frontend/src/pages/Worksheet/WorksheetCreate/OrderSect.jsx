import {
  useSelector,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from "../../../utils/import_lib";

function OrderSect({ handleInputChange, orderLoading }) {
  const inputList = useSelector((state) => state.worksheet.inputList);

  let content;

  if (orderLoading) {
    content = (
      <h2 className="text-center" style={{ width: "100%" }}>
        Loading...
      </h2>
    );
  } else {
    content = (
      <>
        <Grid container spacing={1}>
          <Grid size={{ xs: 6, md: 3 }} p={1}>
            <FormControl fullWidth>
              <InputLabel id="shirt-cate-select-label">ประเภทเสื้อ</InputLabel>
              <Select
                disabled
                labelId="shirt-cate-select-label"
                size="small"
                value={inputList.type_shirt}
                label="ประเภทเสื้อ"
                name="type_shirt"
                onChange={(e) => handleInputChange(e)}
              >
                <MenuItem value="t-shirt">เสื้อยืด</MenuItem>
                <MenuItem value="polo-shirt">เสื้อโปโล</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }} p={1}>
            <FormControl fullWidth size="small">
              <InputLabel id="shirt-cate-select-label">ติดป้ายไซซ์</InputLabel>
              <Select
                required
                labelId="shirt-cate-select-label"
                size="small"
                label="ติดป้ายไซซ์"
                name="size_tag"
                value={inputList.size_tag}
                onChange={(e) => handleInputChange(e)}
              >
                <MenuItem value="1">ติด</MenuItem>
                <MenuItem value="0">ไม่ติด</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} p={1}>
            <TextField
              fullWidth
              variant="outlined"
              type="text"
              label="แพ็คกิ้ง"
              name="packaging"
              value={inputList.packaging}
              onChange={handleInputChange}
            />
          </Grid>
        </Grid>

        <Grid container spacing={1} mt={1}>
          <Grid size={{ xs: 12, md: 6 }} p={1}>
            <TextField
              fullWidth
              multiline
              rows={3}
              type="text"
              variant="outlined"
              name="shirt_detail"
              label="รายละเอียดเสื้อ"
              value={inputList.shirt_detail}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} p={1}>
            <TextField
              fullWidth
              multiline
              rows={3}
              type="text"
              variant="outlined"
              name="screen_detail"
              label="รายละเอียดการสกรีน"
              value={inputList.screen_detail}
              onChange={handleInputChange}
            />
          </Grid>
        </Grid>
      </>
    );
  }

  return <>{content}</>;
}

export default OrderSect;
