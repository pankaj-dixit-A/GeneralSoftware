import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AccountMasterHelp from "../../../../Helper/AccountMasterHelp";
import "./InterestStatement.css";
import { Typography } from '@mui/material';

const InterestStatement = () => {
  // GET ACCOUNT YEAR from session storage
  const AccountYear = sessionStorage.getItem("Accounting_Year");
  const [acCode, setAcCode] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [email, setEmail] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [interestDays, setInterestDays] = useState("");
  const [accoid, setAccoid] = useState("");
  const [acname, setAcName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (AccountYear) {
      const dates = AccountYear.split(" - ");
      if (dates.length === 2) {
        setFromDate(dates[0]);
        setToDate(dates[1]);
      }
    }
  }, [AccountYear]);

  const handleAcCode = (code, accoid, name) => {
    setAcCode(code);
    setAccoid(accoid);
    setAcName(name);
  };

  const handleGetReportClick = (e) => {
    e.preventDefault();
    navigate(`/interest-statement-report`, {
      state: {
        acCode,
        fromDate,
        toDate,
        email,
        interestRate,
        interestDays,
        acname,
        filter: "All",
      },
    });
  };

  const handleOnlyDrClick = (e) => {
    e.preventDefault();
    navigate(`/interest-statement-report`, {
      state: {
        acCode,
        fromDate,
        toDate,
        email,
        interestRate,
        interestDays,
        acname,
        filter: "OnlyDr",
      },
    });
  };

  return (
    <div className="interest-statement-container">
      <div className="interest-statement-card">
           <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold",marginBottom:"40px"}}>Interest Statement</Typography>
        <form className="interest-statement-form">
          <div className="form-group">
            <label htmlFor="AC_CODE" className="form-label">
              Account Code:
            </label>
            <div className="account-help-container">
              <AccountMasterHelp
                onAcCodeClick={handleAcCode}
                name="AC_CODE"
                CategoryName={acname}
                CategoryCode={acCode}
                tabIndexHelp={1}
                Ac_type=""
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
              autoComplete="off"
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
              autoComplete="off"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="Email" className="form-label">
              Email Id:
            </label>
            <input
              type="email"
              id="Email"
              className="form-input"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="IntRate" className="form-label">
              Interest Rate:
            </label>
            <input
              type="number"
              id="IntRate"
              className="form-input"
              autoComplete="off"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="IntDays" className="form-label">
              Days:
            </label>
            <input
              type="number"
              id="IntDays"
              className="form-input"
              autoComplete="off"
              value={interestDays}
              onChange={(e) => setInterestDays(e.target.value)}
            />
          </div>

          <div className="form-buttons">
            <button
              type="submit"
              className="submit-button"
              onClick={handleGetReportClick}
            >
              Show
            </button>
            <button
              type="button"
              className="submit-button secondary"
              onClick={handleOnlyDrClick}
            >
              Only Dr
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterestStatement;