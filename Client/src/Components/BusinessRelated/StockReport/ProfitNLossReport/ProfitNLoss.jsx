import React, { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AccountMasterHelp from "../../../../Helper/AccountMasterHelp"; 
import LotNoHelp from "../../../../Helper/ProfitNLossLotNoHelp"
import '../../../Reports/Ledger/Ledger.css'; 

var ac_Name = ""; 

const ProfitNLoss = () => {
  const [acCode, setAcCode] = useState(""); 
  const [fromDate, setFromDate] = useState(""); 
  const [toDate, setToDate] = useState(""); 
  const [accoid, setAccoid] = useState("");
  const [acname, setacname] = useState(""); 
  const [lotNo, setLotNo] = useState("")
  const [date, setDate] = useState("");
  const AccountYear = sessionStorage.getItem('Accounting_Year');

    useEffect(() => {
        if (AccountYear) {
            const dates = AccountYear.split(' - ');
            if (dates.length === 2) {
                setFromDate(dates[0]);
                setToDate(dates[1]);
            }
        }
    }, [AccountYear]);

  const navigate = useNavigate();

  const handleAc_Code = (code, accoid,name) => {
    setAcCode(code);
    setAccoid(accoid);
    setacname(name);
    // let updatedFormData = {
    //   ...formData,
    //   Ac_Code: code,
    //   ac: accoid,
    // };

  };

  const handleLotNo = (LotNo, Date) => {
    setLotNo(LotNo);
    setDate(Date);
  }

  const getProfitLossReport = (e) => {
    e.preventDefault();
    // Navigate to the report component and pass parameters
    navigate('/profit-loss-report', {
      state: {
        millCode: acCode,
        fromDate: fromDate,
        toDate: toDate,
        lotNo: lotNo
      }
    });
  };

  return (
    <div className="ledger-form-container">
      <h2>Profit & Loss Report</h2>
      <form onSubmit={getProfitLossReport}>
        <div className="form-row">
          <label htmlFor="AC_CODE">Mill Code:</label>
          <div className="account-help-container">
          <AccountMasterHelp
                onAcCodeClick={handleAc_Code}
                name="AC_CODE"
                CategoryName={acname}
                CategoryCode={acCode}
                tabIndexHelp={1}
                Ac_type=""
               
              />
          </div>
        </div>
        <div className="form-row">
          <label htmlFor="Lot_No">Lot No:</label>
          <div className="account-help-container">
          <LotNoHelp
                onLotNoClick={handleLotNo}
                name="Lot_No"
                MillCode={acCode}
                tabIndexHelp={2}
               
              />
          </div>
        </div>
        <div className="form-row">
          <label>From Date:</label>
          <input
             type="date"
             id="fromDate"
             className="form-control"
             value={fromDate}
             onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label>To Date:</label>
          <input
            type="date"
            id="toDate"
            className="form-control"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <button type="submit">Profit N Loss</button>
      </form>
    </div>
  );
};

export default ProfitNLoss;
