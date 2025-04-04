import React, { useState, useEffect, useRef } from "react";
import "../Navbar/Navbar.css";
import { Link } from "react-router-dom";
import Cookies from 'js-cookie';
import logo from "../../Assets/jklogo.png"
import { useNavigate } from "react-router-dom";
import { FaCaretRight } from 'react-icons/fa';
import AvatarIcon from "../../Common/AvtarIcon/AvtarIconNavbar";

const Navbar = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeSubMenu, setActiveSubMenu] = useState("");
  const [clickedMenu, setClickedMenu] = useState("");
  const [hoveredSubMenuItem, setHoveredSubMenuItem] = useState("");
  const navbarRef = useRef(null);

  const [username, setUsername] = useState("");

  useEffect(() => {
    const storedUsername = sessionStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigate = useNavigate()

  const handleMouseEnter = (menuName) => {
    setActiveMenu(menuName);
    if (!clickedMenu) {
      setActiveSubMenu("");
    }
  };

  const handleSubMouseEnter = (subMenuName) => {
    setActiveSubMenu(subMenuName);
  };

  const handleMouseLeave = (event) => {
    if (navbarRef.current && !navbarRef.current.contains(event.target)) {
      setActiveMenu("");
      setActiveSubMenu("");
      setHoveredSubMenuItem("");
    }
  };

  const handleClick = (menuName) => {
    if (clickedMenu === menuName) {
      setClickedMenu("");
      setActiveMenu("");
      setActiveSubMenu("");
    } else {
      setClickedMenu(menuName);
      setActiveMenu(menuName);
      setActiveSubMenu(menuName);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setActiveMenu("");
        setActiveSubMenu("");
        setClickedMenu("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleLogoClick = () => {
    navigate('/dashboard')
  }

  return (
    <>
      <div ref={navbarRef} className="navbar" onMouseLeave={handleMouseLeave}>
        <img className="logo" src={logo} alt="Logo" onClick={handleLogoClick} />
        <div
          className="nav-item"
          onMouseEnter={() => handleMouseEnter("company")}
          onClick={() => handleClick("company")}
        >
          <label className="navbarlabel">Company</label>
          {activeMenu === "company" && (
            <div className="submenu">
              <div className="submenu-item">
                <a className="submenu-item"><Link to="/create-utility">Create Company</Link></a>
              </div>
              <div className="submenu-item">
                <a className="submenu-item"><Link to="/select-company">Select Company</Link></a>
              </div>
              <div className="submenu-item">
                <a><Link to="/create-accounting-year">Create Accounting Year</Link></a>
              </div>
              <div className="submenu-item">
                <a><Link to="/select-accounting-year">Select Accounting Year</Link></a>
              </div>
            </div>
          )}
        </div>
        <div
          className="nav-item"
          onMouseEnter={() => handleMouseEnter("master")}
          onClick={() => handleClick("master")}
        >
          <label className="navbarlabel">Master</label>
          {activeMenu === "master" && (
            <div className="submenu">
              <div
                className="submenu-item"
                onMouseEnter={() => handleSubMouseEnter("accountInfo")}
                onClick={() => handleClick("accountInfo")}
              >
                Account Information
                <FaCaretRight />
                {activeSubMenu === "accountInfo" && (
                  <div className="submenu1">
                    <div className="submenu-item1">
                      <a><Link to="/AccountMaster-utility">Account Master</Link></a>
                    </div>
                    <div className="submenu-item1">
                      <a><Link to="/customer-limits">Customer Limits</Link></a>
                    </div>
                    <div className="submenu-item1">
                      <a><Link to="/financial-groups-utility">Financial Groups</Link></a>
                    </div>
                    <div className="submenu-item1">
                      <a ><Link to="/city-master-utility">City Master</Link></a>
                    </div>
                    <div className="submenu-item1">
                      <a><Link to="/PartyUnitMaster-utility">
                        Corporate Customer Unit/Godown Declaration
                      </Link></a>
                    </div>
                    <div className="submenu-item1">
                      <a><Link to="/ac-master-declaration">
                        Account Master Declaration
                      </Link></a>
                    </div>
                    <div className="submenu-item1">
                      <a><Link to="/bank-details">Bank Details</Link></a>
                    </div>
                  </div>
                )}
              </div>
              <div
                className="submenu-item"
                onMouseEnter={() => handleSubMouseEnter("Other_Master")}
              >
                Other Master
                <FaCaretRight />
                {activeSubMenu === "Other_Master" && (
                  <div className="submenu1">
                    {/* <div className="submenu-item1">
                    <a><Link to="/syetem-masterutility">System Master</Link></a>
                  </div> */}
                    <div className="submenu-item1">
                      <a><Link to="/brand-master-utility">Brand Master</Link></a>
                    </div>
                    <div className="submenu-item1">
                      <a><Link to="/gst-rate-masterutility">GST Rate Master</Link></a>
                    </div>
                    <div className="submenu-item1">
                      <a><Link to="/gst-state-master-utility">GST State Master</Link></a>
                    </div>
                    {/* <div className="submenu-item1">
                    <a><Link to="/hsn-asc-master">HSN or ASC Code Master</Link></a>
                  </div> */}
                  </div>
                )}
              </div>

              <div className="submenu-item">
                <a><Link to="/eway-bill-setting">E-Way Bill Setting</Link></a>
              </div>
              <div className="submenu-item">
                <a><Link to="/company-parameter">Company Parameter</Link></a>
              </div>
              <div className="submenu-item">
                <a><Link to="/whatsapp-api">WhatsApp API Integration</Link></a>
              </div>
            </div>
          )}
        </div>

        <div
          className="nav-item"
          onMouseEnter={() => handleMouseEnter("inward")}
          onClick={() => handleClick("inward")}
        >
          <label className="navbarlabel">Inward</label>
          {activeMenu === "inward" && (
            <div className="submenu">
              <div className="submenu-item">
                <a ><Link to="/sugarpurchasebill-utility">Purchase Bill</Link></a>
              </div>
              <div className="submenu-item">
                <a><Link to="/OtherGSTInput-utility">Other GST Input</Link></a>
              </div>
              <div className="submenu-item">
                <a><Link to="/reverse-charge">Reverse Charge</Link></a>
              </div>
              <div className="submenu-item">
                <a><Link to="/sugar-sale-return-purchase-utility">
                  Sugar Sale Return Purchase
                </Link></a>
              </div>
              <div className="submenu-item">
                <a><Link to="/retail-purchase">Retail Purchase</Link></a>
              </div>
            </div>
          )}
        </div>

        <div
          className="nav-item"
          onMouseEnter={() => handleMouseEnter("transactions")}
          onClick={() => handleClick("transactions")}
        >
          <label className="navbarlabel">Transactions</label>

          {activeMenu === "transactions" && (
            <div className="submenu">
              <div className="submenu-item">
                <a ><Link to="/RecieptPaymentUtility">Receipt/Payment</Link></a>
              </div>
              <div className="submenu-item">
                <a ><Link to="/JournalVoucher_Utility">Journal Vouchar</Link></a>
              </div>
              <div className="submenu-item">
                <a ><Link to="/utrentry-Utility">UTR Entry</Link></a>
              </div>
              <div className="submenu-item">
                <a ><Link to="/debitcreditnote-utility">Debit/Credit Note</Link></a>
              </div>
              {/* <div className="submenu-item">
              <a href="/multiple-sale-bill-against-single-payment">
                Multiple Sale Bill Against Single Payment
              </a>
            </div> */}
              <div className="submenu-item">
                <a ><Link to="/other-purchaseutility">
                  Other Purchase
                </Link></a>
              </div>
              <div className="submenu-item">
                <a ><Link to="/general-transaction">General Transaction</Link></a>
              </div>
              <div className="submenu-item">
                <a ><Link to="/PaymentNote-utility">Payment Note</Link></a>
              </div>
            </div>
          )}
        </div>

        <div
          className="nav-item"
          onMouseEnter={() => handleMouseEnter("business-related")}
        >
          <label className="navbarlabel">Business Related</label>
          {activeMenu === "business-related" && (
            <div className="submenu">
              <div className="submenu-item">
                <a><Link to="/tender-purchaseutility">Tender Purchase</Link></a>
              </div>
              <div className="submenu-item">
                <a><Link to="/sauda-book-utility">Sauda Book Utility</Link></a>
              </div>
              <div className="submenu-item">
                <a><Link to="/delivery-order-utility">Delivery Order</Link></a>
              </div>
              <div
                className="submenu-item"
                onMouseEnter={() => handleSubMouseEnter("stock_report")}
                onClick={() => {
                  handleClick("stock_report");
                }}
              >
                Stock Report
                <FaCaretRight style={{ marginLeft: "5px" }} />
                {activeSubMenu === "stock_report" && (
                  <div className="submenu1">
                    <div className="submenu-item1">
                      <a><Link to="/balance-stock"> Balance Stock(Millwise/Partywise)</Link></a>
                    </div>
                    <div className="submenu-item1">
                      <a ><Link to="/register">Register</Link></a>
                    </div>
                    <div className="submenu-item1">
                      <a ><Link to="/gst-state-master">GST State Master</Link></a>
                    </div>
                    <div className="submenu-item1">
                      <a><Link to="/transport-sms">Transport SMS</Link></a>
                    </div>
                    <div className="submenu-item1">
                      <a ><Link to="/multiple-do-print">Multiple DO Print</Link></a>
                    </div>
                    <div className="submenu-item1">
                      <a ><Link to="/profit-loss">Profit Loss</Link></a>
                    </div>
                  </div>
                )}
              </div>
              <div className="submenu-item">
                <a><Link to="/letter">Letter</Link></a>
              </div>
            </div>
          )}
        </div>
        <div
          className="nav-item"
          onMouseEnter={() => handleMouseEnter("outward")}
          onClick={() => handleClick("outward")}
        >
          <label className="navbarlabel">Outward</label>

          {activeMenu === "outward" && (
            <div className="submenu">
              <div className="submenu-item">
                <a><Link to="/SaleBill-utility">Sale Bill</Link></a>
              </div>
              {/* <div className="submenu-item">
              <a><Link to="/CommissionBill-utility">Commission Bill</Link></a>
            </div> */}
              <div className="submenu-item">
                <a ><Link to="/retail-sale-bill">Retail Sale Bill</Link></a>
              </div>
              <div className="submenu-item">
                <a ><Link to="/sugar-sale-return-sale-utility">Sugar Sale Return Sale</Link></a>
              </div>
              <div className="submenu-item">
                <a ><Link to="/ServiceBill-utility">Service Bill</Link></a>
              </div>
            </div>
          )}
        </div>
        <div
          className="nav-item"
          onMouseEnter={() => handleMouseEnter("reports")}
          onClick={() => handleClick("reports")}
        >
          <label className="navbarlabel">Reports</label>

          {activeMenu === "reports" && (
            <div className="submenu">
              <div
                className="submenu-item"
                onMouseEnter={() => handleSubMouseEnter("ledger")}
              >
                Ledgers
                <FaCaretRight />
                {activeSubMenu === "ledger" && (
                  <div className="submenu1">
                    <div className="submenu-item1">
                      <a ><Link to="/ledger">Ledger</Link></a>
                    </div>
                    <div className="submenu-item1">
                      <a ><Link to="/daybook">Day Book</Link></a>
                    </div>
                    <div className="submenu-item1">
                      <a href="/multiple-ledger">Multiple Ledger</a>
                    </div>
                    <div className="submenu-item1">
                      <a ><Link to="/bank-book">Bank Book</Link></a>
                    </div>
                    <div className="submenu-item1">
                      <a ><Link to="/account-master-print">Account Master Print</Link></a>
                    </div>
                    <div className="submenu-item1">
                      <a ><Link to="/group-ledger">Group Ledger</Link></a>
                    </div>
                    <div className="submenu-item1">
                      <a ><Link to="/broker-report">Broker Report</Link></a>
                    </div>
                    <div className="submenu-item1">
                      <a ><Link to="/interest-statement">Interest Statement</Link></a>
                    </div>
                    <div className="submenu-item1">
                      <a><Link to="/day-book">Day Book (Kird)</Link></a>
                    </div>
                    <div className="submenu-item1">
                      <a href="/cold-storage-register">Cold Storage Register</a>
                    </div>
                  </div>
                )}
              </div>
              <div className="submenu-item">
                <a ><Link to="/trial-balance">Trial Balance</Link></a>
              </div>
              <div className="submenu-item">
                <a ><Link to="/profit-loss-balance-sheet"> Profit and Loss/ Balance Sheet</Link>

                </a>
              </div>
              <div className="submenu-item">
                <a><Link to="/stock-book"> Stock Book</Link></a>
              </div>
              <div className="submenu-item">
                <a href="/trail-balance-screen">Trail Balance Screen</a>
              </div>
              <div className="submenu-item">
                <a href="/pending-reports">Pending Reports</a>
              </div>
              <div className="submenu-item">
                <a href="/retail-sale-register-report">
                  Retail Sale Register Report
                </a>
              </div>
              <div className="submenu-item">
                <a href="/freight-register-reports">Freight Register Reports</a>
              </div>
              <div className="submenu-item">
                <a href="/partiwise-sale-bill-detail-reports">
                  PartyWise Sale Bill Detail Reports
                </a>
              </div>
              <div className="submenu-item">
                <a href="/retail-sale-balance-reports">
                  RetailSale Balance Reports
                </a>
              </div>
              <div className="submenu-item">
                <a href="/purchase-sale-registers">Purchase Sale Registers</a>
              </div>
              <div className="submenu-item">
                <a href="/retail-sale-reports">Retail Sale Reports</a>
              </div>
              <div className="submenu-item">
                <a href="/retail-sale-stock-book">Retail Sale Stock Book</a>
              </div>
              <div className="submenu-item">
                <a href="/multiple-sale-bill-print">Multiple Sale Bill Print</a>
              </div>
              <div className="submenu-item">
                <a href="/partywise-sale-bill-print">Partywise Sale Bill Print</a>
              </div>
              <div className="submenu-item">
                <a href="/gst-returns">GST Returns</a>
              </div>
            </div>
          )}
        </div>

        <div
          className="nav-item"
          onMouseEnter={() => handleMouseEnter("utilities")}
          onClick={() => handleClick("utilities")}
        >
          <label className="navbarlabel">Utilities</label>
          {activeMenu === "utilities" && (
            <div className="submenu">
              <div className="submenu-item">
                <a><Link to="/user-permission-utility"> User Creation</Link></a>
              </div>
              <div className="submenu-item">
                <a href="/group-user-creation">Group User Creation</a>
              </div>
              <div className="submenu-item">
                <a href="/club-account">Club Account</a>
              </div>
              <div className="submenu-item">
                <a href="/post-date">Post Date</a>
              </div>
            </div>
          )}
        </div>
        <div className="nav-item" onMouseEnter={() => handleMouseEnter('gst-utilities')}>
          <Link to="/gstutilities" className="nav-link"><label className="navbarlabel">GST Utilities</label></Link>
        </div>

        <div className="nav-item" onMouseEnter={() => handleMouseEnter('eTender')}>
          <Link to="/eBuySugarian-user-utility" className="nav-link"><label className="navbarlabel">eTender</label></Link>
        </div>

        <div
          className="nav-item"
          onMouseEnter={() => handleMouseEnter("RackRailway")}
          onClick={() => handleClick("RackRailway")}
        >
          <label className="navbarlabel">Railway Rack</label>
          {activeMenu === "RackRailway" && (
            <div className="submenu">
              <div className="submenu-item">
                <a className="submenu-item"><Link to="/rack-mill-info-utility">Mill Master</Link></a>
              </div>
              <div className="submenu-item">
                <a className="submenu-item"><Link to="/rack-railway-station-master-utility">Railway Station Master</Link></a>
              </div>
              <div className="submenu-item">
                <a className="submenu-item"><Link to="/rack-link-railway-station-utility">Link Railway Station</Link></a>
              </div>
              <div className="submenu-item">
                <a className="submenu-item"><Link to="/rack-from-to-railway-station-rate-utility">From-To Railway Station Rate</Link></a>
              </div>
              <div className="submenu-item">
                <a className="submenu-item"><Link to="/railway-rack-buy-report">Report</Link></a>
              </div>
            </div>
          )}
        </div>
        <AvatarIcon style={{ display: "flex" }} />
      </div>
    </>
  );
}

export default Navbar;