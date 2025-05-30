import "./ControlPanel.css";
import { IconContext } from "react-icons";
import {
  FaAddressBook,
  FaBrush,
  FaClipboardList,
  FaFile,
  FaFileAlt,
  FaFileExcel,
  FaFileInvoice,
  FaFileInvoiceDollar,
  FaListUl,
  FaPencilRuler,
  FaSwatchbook,
  FaTruck,
  FaTshirt,
  FaUserClock,
  FaUsers,
} from "react-icons/fa";
import { FaShirt } from "react-icons/fa6";
import { GiPriceTag } from "react-icons/gi";
import { LiaFileInvoiceDollarSolid } from "react-icons/lia";
import { HiDocumentCurrencyDollar } from "react-icons/hi2";
import { useGetPdCountQuery } from "../../api/slice";
import { Spinner } from "react-bootstrap";

function ControlPanel() {
  const { data, isLoading } = useGetPdCountQuery();
  const user = JSON.parse(localStorage.getItem("userData"));

  return (
    <section className="container-fluid all-tools mb-5">
      <aside className="row row-process float-lg-end col-12 col-md-11 col-lg-3 pt-3 pt-md-4 pt-lg-2 mx-auto">
        <div className="col-lg-10 col-xl-9 mx-auto">
          <a className="btn btn-secondary btn-process" href="/monitor">
            <label
              className="count-process"
              htmlFor="count-process"
            >
             { isLoading ? (
              <div className="text-center">
                <Spinner animation="border" variant="danger" role="status" />
              </div>
             ) : data }
            </label>
            <br />
            <label className="process-describe" htmlFor="process-describe">
              IN PROCESS
            </label>
            <br />
            <label className="process-describe-th" htmlFor="process-describe">
              (กำลังผลิต)
            </label>
          </a>
        </div>
      </aside>
      <div className="row col-12 col-md-11 col-lg-8 col-xl-8 mt-4 mb-5 ms-1 ms-md-5 ms-lg-4 ms-xl-5">
        <h3 className="fw-bold">BASIC TOOLS</h3>
        <hr />
        <div className="col-md-7 col-xl-5 col-xxl-5 ms-1 ms-md-1 ms-lg-2 col-basic">
          <a className="btn btn-outline-danger pt-3" href="/shirt-price">
            <IconContext.Provider value={{ className: "icon-control-panel" }}>
              <GiPriceTag />
            </IconContext.Provider>
            <label>PRICE SHIRT</label>
          </a>
          <div className="vr vr-home"></div>
          <a
            className="btn btn-outline-danger disable-link pt-3"
            href="#"
            style={{ width: "6.2rem" }}
          >
            <IconContext.Provider value={{ className: "icon-control-panel" }}>
              <FaBrush />
            </IconContext.Provider>
            <label>PRICE SCREEN</label>
          </a>
          <div className="vr vr-home"></div>
          <a className="btn btn-outline-danger disable-link pt-3" href="#">
            <IconContext.Provider value={{ className: "icon-control-panel" }}>
              <FaSwatchbook />
            </IconContext.Provider>
            <label>PRICE DFT</label>
          </a>
        </div>
        <div className="col-12 col-md-5 col-xl-4 col-xxl-3 ms-1 ms-md-3 ms-lg-3 mt-3 mt-md-0 col-basic">
          <a className="btn btn-outline-danger disable-link pt-3" href="#">
            <IconContext.Provider value={{ className: "icon-control-panel" }}>
              <FaUserClock />
            </IconContext.Provider>
            <br />
            <label>LATE</label>
          </a>
          <div className="vr vr-home"></div>
          <a
            className="btn btn-outline-danger disable-link pt-3"
            href="#"
            style={{ width: "5.6rem" }}
          >
            <IconContext.Provider value={{ className: "icon-control-panel" }}>
              <FaFileExcel />
            </IconContext.Provider>
            <label>LEAVE WORK</label>
          </a>
        </div>
        <div className="col-12 col-md-2 col-xl-2 ms-1 ms-md-3 ms-lg-3 mt-3 mt-md-0 px-1 col-basic">
          <a className="btn btn-outline-danger pt-3" href="/customer">
            <IconContext.Provider value={{ className: "icon-control-panel" }}>
              <FaAddressBook />
            </IconContext.Provider>
            <label>CUSTOMER</label>
          </a>
        </div>

        { user.role === "admin" && (
        <div className="col-12 ms-1 ms-md-1 ms-lg-2 ms-xl-3 mt-3 mt-md-3 mt-xl-0 px-1 col-basic">
          <a className="btn btn-outline-danger pt-3" href="/user-management" style={{ width: "min-content" }}>
            <IconContext.Provider value={{ className: "icon-control-panel" }}>
              <FaUsers />
            </IconContext.Provider>
            <label style={{ textTransform: "uppercase", paddingTop: "0.5rem", lineHeight: "0.7rem" }}>
              User Management
            </label>
          </a>
        </div>
        ) }

      </div>
      <div className="row col-12 col-md-11 col-lg-8 mb-5 ms-1 ms-md-5 ms-lg-4 ms-xl-5">
        <h3>SPECIFIC SALE TOOLS</h3>
        <hr />
        <div className="col-3 col-md-2 col-lg-3 ms-md-1 ms-xl-2 me-1 me-md-0 mb-0 mb-md-0 mb-lg-0 col-basic">
          <a
            className="btn btn-outline-danger pt-3"
            href="https://izasskobibe.com/worksheets/show_worksheet.php"
            // href="/worksheet"
            style={{ width: "5.8rem" }}
          >
            <IconContext.Provider value={{ className: "icon-control-panel" }}>
              <FaTshirt />
            </IconContext.Provider>
            <label style={{ lineHeight: '0.75rem', paddingTop: 8 }}>WORK SHEET V.1</label>
          </a>
          <div className="vr vr-home"></div>
          <a
            className="btn btn-outline-danger pt-3"
            href="/worksheet"
            style={{ width: "5.8rem" }}
          >
            <IconContext.Provider value={{ className: "icon-control-panel" }}>
              <FaShirt />
            </IconContext.Provider>
            <label style={{ lineHeight: '0.75rem', paddingTop: 8 }}>WORK SHEET V.2</label>
          </a>
          <div className="vr vr-home"></div>
          <a className="btn btn-outline-danger pt-3" href="/pricing">
            <IconContext.Provider value={{ className: "icon-control-panel", style: {fontSize: '2.25rem'} }}>
              <HiDocumentCurrencyDollar />
            </IconContext.Provider>
            <label>PRICING</label>
          </a>
          <div className="vr vr-home"></div>
          <a className="btn btn-outline-danger disable-link pt-3" href="#">
            <IconContext.Provider value={{ className: "icon-control-panel" }}>
              <FaFileInvoice />
            </IconContext.Provider>
            <label>QUOTATION</label>
          </a>
        </div>
        <div className="col-2 col-md-1 col-lg-2 ms-0 ms-md-3 ms-lg-3 mt-3 mt-md-0 col-basic col-pattern">
          <a className="btn btn-outline-danger disable-link pt-3" href="#">
            <IconContext.Provider value={{ className: "icon-control-panel" }}>
              <FaPencilRuler />
            </IconContext.Provider>
            <label>PATTERN</label>
          </a>
        </div>
      </div>
      <div className="row col-12 col-md-11 col-lg-8 mt-4 mb-5 ms-1 ms-md-5 ms-lg-4 ms-xl-5">
        <h3>SPECIFIC ACCOUNT TOOLS</h3>
        <hr />
        <div className="row col-11">
          <div className="col-md-12 col-lg-6 ms-md-1 ms-lg-2 col-basic">
            <a className="btn btn-outline-danger disable-link pt-3" href="#">
              <IconContext.Provider value={{ className: "icon-control-panel" }}>
                <FaFileInvoice />
              </IconContext.Provider>
              <label>QUOTATION</label>
            </a>
            <div className="vr vr-home"></div>
            <a className="btn btn-outline-danger disable-link pt-3" href="#">
              <IconContext.Provider value={{ className: "icon-control-panel" }}>
                <FaFileInvoiceDollar />
              </IconContext.Provider>
              <label>INVOICE</label>
            </a>
            <div className="vr vr-home"></div>
            <a
              className="btn btn-outline-danger disable-link pt-3"
              href="#"
              style={{ width: "5.7rem" }}
            >
              <IconContext.Provider value={{ className: "icon-control-panel" }}>
                <FaFileInvoiceDollar />
              </IconContext.Provider>
              <label>TAX-INVOICE</label>
            </a>
            <div className="vr vr-home d-none d-sm-inline-block"></div>
            <a className="btn btn-outline-danger disable-link pt-3" href="#">
              <IconContext.Provider value={{ className: "icon-control-panel" }}>
                <FaFileAlt />
              </IconContext.Provider>
              <br />
              <label>BILL</label>
            </a>
            <div className="vr vr-home"></div>
            <a
              className="btn btn-outline-danger disable-link pt-3"
              href="#"
              style={{ width: "6.5rem" }}
            >
              <IconContext.Provider value={{ className: "icon-control-panel" }}>
                <FaTruck />
              </IconContext.Provider>
              <label>DELIVERY NOTE</label>
            </a>
          </div>
        </div>
      </div>
      <div className="row col-12 col-md-11 col-lg-8 mt-4 ms-1 ms-md-5 ms-lg-4 ms-xl-5">
        <h3>SPECIFIC MANAGER TOOLS</h3>
        <hr />
        <div className="col-2 ms-md-1 ms-lg-2 col-basic">
          <a
            className="btn btn-outline-danger disable-link pt-3"
            href="#"
            style={{ width: "5.9rem" }}
          >
            <IconContext.Provider value={{ className: "icon-control-panel" }}>
              <FaClipboardList />
            </IconContext.Provider>
            <label>CHECK SHEET</label>
          </a>
        </div>
        <div className="col-2 ms-1 ms-md-3 ms-lg-3 col-basic">
          <a className="btn btn-outline-danger disable-link pt-3" href="#">
            <IconContext.Provider value={{ className: "icon-control-panel" }}>
              <FaPencilRuler />
            </IconContext.Provider>
            <label>PATTERN</label>
          </a>
        </div>
        <div className="col-2 ms-1 ms-md-3 ms-lg-3 col-basic col-in-process">
          <a className="btn btn-outline-danger disable-link pt-3" href="#">
            <IconContext.Provider value={{ className: "icon-control-panel" }}>
              <FaListUl />
            </IconContext.Provider>
            <label>IN PROCESS</label>
          </a>
        </div>
      </div>
    </section>
  );
}

export default ControlPanel;
