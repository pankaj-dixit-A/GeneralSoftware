import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import "./Ledger.css";
import { Typography } from '@mui/material';
import { fetchAccountBalance } from "../../../Common/GetAccountBalance/GetAccountBalance";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

const Ledger = () => {
  const [acCode, setAcCode] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [accoid, setAccoid] = useState("");
  const [acname, setacname] = useState("");
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const AccountYear = sessionStorage.getItem("Accounting_Year");
  const Compay_Code = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");

  useEffect(() => {
    if (AccountYear) {
      const dates = AccountYear.split(" - ");
      if (dates.length === 2) {
        setFromDate(dates[0]);
        setToDate(dates[1]);
      }
    }
  }, [AccountYear]);

  useEffect(() => {
    if (acCode === "") {
      setBalance(0); 
    }
  }, [acCode]);
  
  const handleAc_Code = async (code, accoid, name) => {
    if (!code) {
      setAcCode(""); 
      setAccoid("");
      setacname("");
      setBalance(0);  
      return;
    }
    setAcCode(code);
    setAccoid(accoid);
    setacname(name);

    const fetchedBalance = await fetchAccountBalance(code);
    if (fetchedBalance !== null) {
      setBalance(fetchedBalance);
    }
  };

  const handleGetReportClick = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
        const url = `/ledger-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&acname=${encodeURIComponent(acname)}&acCode=${encodeURIComponent(acCode)}`;
        window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
        setLoading(false);
    }, 500);
};

//Day Report onCliked
const handleGetDayBook = (e) => {
  e.preventDefault();
  setLoading(true);
  setTimeout(() => {
      const url = `/daybook-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
      window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
      setLoading(false);
  }, 500);
};

  return (
    <div className="ledger-container">
      <div className="ledger-card">
         <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold",marginBottom:"40px"}}>Ledger Report</Typography>
        <form onSubmit={handleGetReportClick} >
          <div className="ledger-form">
          <div className="form-group">
            <label htmlFor="AC_CODE" className="form-label">
              Account Code:
            </label>
            <div className="account-help-container">
              <AccountMasterHelp
                onAcCodeClick={handleAc_Code}
                name="AC_CODE"
                CategoryName={acname}
                CategoryCode={acCode}
                Ac_type={[]}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="fromDate" className="form-label">
              From Date:
            </label>
            <input
              type="date"
              id="fromDate"
              className="form-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="toDate" className="form-label">
              To Date:
            </label>
            <input
              type="date"
              id="toDate"
              className="form-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          </div>
          <h4> Balance ₹ {formatReadableAmount(balance)}</h4>
          <button type="submit" className="submit-button">
            Get Report
          </button>
          {/* <button className="submit-button" onClick={handleGetDayBook}>
            DAY BOOK
          </button> */}
        </form>
      </div>
    </div>
  );
};

export default Ledger;