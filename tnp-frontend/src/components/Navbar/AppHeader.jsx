import {
  useEffect,
  Link,
  useNavigate,
  useLocation,
  useSelector,
  useDispatch,
  useState,
  axios,
  BsContainer,
  BsNav,
  BsNavbar,
  BsForm,
  BsInputGroup,
} from "../../utils/import_lib";
import { Button, styled, Autocomplete, TextField, Paper } from "@mui/material";
import "./AppHeader.css";
import { IconContext } from "react-icons";
import { RxHome } from "react-icons/rx";
import { BsPersonSquare } from "react-icons/bs";
import { FiLogOut } from "react-icons/fi";
import { FiSearch } from "react-icons/fi";
import { IoSearch } from "react-icons/io5";
import { searchKeyword } from "../../features/globalSlice";
import { handleCheckUpdate } from "../../features/globalUtils";
import NavDropdown from 'react-bootstrap/NavDropdown';
import DialogChangePass from "./DialogChangePass";

const StyledTextField = styled(TextField)(({ theme }) => ({
  flex: 1,

  "& .MuiButtonBase-root.MuiAutocomplete-clearIndicator": {
    color: "#fff",
  },

  "& .MuiOutlinedInput-root.Mui-focused fieldset": {
    borderWidth: 0,
  },

  "& .MuiOutlinedInput-root:not(.Mui-focused):hover fieldset": {
    borderColor: theme.vars.palette.error.light,
  },

  "& .MuiOutlinedInput-input": {
    WebkitTextFillColor: "#fff",
    caretColor: "#fff",
    height: 20,
  },

  "& fieldset": {
    borderWidth: 0,
    color: "#fff",
  },
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  height: 34,
  backgroundColor: "transparent",
  border: `2px solid ${theme.vars.palette.error.light}`,
}));

const SearchButton = styled(Button)(({ theme }) => ({
  minWidth: 34,
  width: 34,
  height: 34,
  padding: 0,
  borderTopLeftRadius: 0,
  borderBottomLeftRadius: 0,
  borderTopRightRadius: 6,
  borderBottomRightRadius: 6,
  fontSize: 22,
}));

function AppHeader() {
  const navigate = useNavigate();
  const dispath = useDispatch();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("userData"));
  const globalKeyword = useSelector((state) => state.global.keyword);
  const pathList = ["/monitor", "/worksheet", "/customer", "/pricing", "/user-management", "/max-supply"];
  const [keyword, setKeyword] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  let content;

  const handlelogout = async () => {

    try {
      const res = await axios.post("/logout");

      if (res.data.status === "success") {
        localStorage.clear();
        navigate("/login");
      }

    } catch (e) {

      localStorage.clear();
      navigate("/login");
      console.error("Logout failed: ", e.response?.data);
    }
  };

  const handleInputChange = (e, newVal) => {
    let valueInput = e.target.value;

    if (e.target.value === undefined) {
      valueInput = "";
      dispath(searchKeyword(valueInput));
    }

    setKeyword(valueInput);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispath(searchKeyword(keyword));
  };

  // rendered search field
  if (["/customer", "/pricing", "/user-management", "/max-supply/list"].includes(location.pathname)) {
    content = (
      <StyledPaper component="form" elevation={0} onSubmit={handleSubmit}>
        <Autocomplete
          id="free-solo-demo"
          freeSolo
          disableClearable={keyword.length < 1}
          options={[]}
          value={keyword}
          onInputChange={(e, newVal) => handleInputChange(e, newVal)}
          renderInput={(params) => (
            <StyledTextField {...params} placeholder="Search" />
          )}
          sx={{ flex: 1 }}
        />
        <SearchButton type="submit" variant="contained" color="error-light">
          <IoSearch />
        </SearchButton>
      </StyledPaper>
    );
  } else {
    content = (
      <>
        <BsNav.Item className="search-tab">
          <BsInputGroup className="rounded-3">
            <BsInputGroup.Text htmlFor="search-input" className="">
              <FiSearch />
            </BsInputGroup.Text>
            <BsForm.Control
              type="search"
              placeholder="Search"
              aria-label="Search"
              className="ps-0"
              value={globalKeyword}
              onChange={(e) => dispath(searchKeyword(e.target.value))}
            />
          </BsInputGroup>
        </BsNav.Item>
      </>
    );
  }

  useEffect(() => {
    setTimeout(() => {
      handleCheckUpdate(user);
    }, 2000)
  }, [navigate]);

  return (
    <>
      <DialogChangePass
        openDialog={openDialog}
        closeDialog={ () => setOpenDialog((open) => !open) }
      />

      <BsNavbar
        bg="dark"
        variant="dark"
        expand="lg"
        className="justify-content-between"
      >
        <BsContainer fluid>
          <BsNav.Item>
            <BsNavbar.Brand className="">
              <Link to="/" aria-label="control-panel">
                <IconContext.Provider
                  value={{ color: "#c55050", size: "2rem" }}
                >
                  <RxHome />
                </IconContext.Provider>
              </Link>
            </BsNavbar.Brand>
          </BsNav.Item>

          {/* search field */}
          {pathList.includes(location.pathname) ? (
            <>
              <BsNav.Item className="d-none d-lg-inline-block">
                <div className="vr vr-nav me-3"></div>
              </BsNav.Item>
              <BsNav.Item className="search-tab">{content}</BsNav.Item>
            </>
          ) : null}

          <BsNavbar.Toggle aria-controls="basic-navbar-nav" />
          <BsNavbar.Collapse
            id="basic-navbar-nav"
            className="justify-content-end"
          >
            {/* Display username and change password */}
            <NavDropdown 
              title={
                <>
                  <BsNav.Item className="me-3">
                    <BsNavbar.Text
                      className="d-none d-lg-inline nav-text username me-2"
                      data-testid="username-navbar-text"
                    >
                      {user.username}
                    </BsNavbar.Text>
                    <IconContext.Provider
                      value={{ color: "#c55050", size: "1.7rem" }}
                    >
                      <BsPersonSquare />
                    </IconContext.Provider>
                    <BsNavbar.Text
                      className="d-lg-none ms-3 nav-text username"
                      data-testid="username-navbar-text"
                    >
                      {user.username}
                    </BsNavbar.Text>
                  </BsNav.Item>
                </>
              } 
              id="basic-nav-dropdown" 
              className="nav-dropdown"
              drop="down"
            >
              <NavDropdown.Item onClick={ () => setOpenDialog(true) }>Change Password</NavDropdown.Item>
            </NavDropdown>

            {/* Logout */}
            <BsNav.Item>
              <div className="vr vr-nav d-none d-lg-inline-block me-3"></div>
            </BsNav.Item>
            <BsNav.Link
              className="ms-1 ms-lg-0 mt-3 mt-lg-0"
              onClick={handlelogout}
            >
              <IconContext.Provider
                value={{ color: "#c55050", size: "1.9rem" }}
              >
                <FiLogOut />
              </IconContext.Provider>
              <BsNavbar.Text className="d-lg-none ms-3 nav-text">
                LOG OUT
              </BsNavbar.Text>
            </BsNav.Link>
          </BsNavbar.Collapse>
        </BsContainer>
      </BsNavbar>
    </>
  );
}

export default AppHeader;
