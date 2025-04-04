import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ItemMasterHelp from "../../../Helper/SystemmasterHelp";
import '../Ledger/Ledger.css';


const StockBookDetail = () => {
  const [itemCode, setItemCode] = useState("");
  const [item_Name, setItemName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [accoid, setAccoid] = useState("");
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

  const handleItemCode = (code, accoid, name) => {
    setItemCode(code);
    setItemName(name);
    setAccoid(accoid);
  };

  const handleStockBookReport = (e) => {
    debugger
    e.preventDefault();
    navigate(`/stock-book-report`, {
      state: { itemCode, fromDate, toDate, item_Name },
    });
  };

  const handleStockBookDetailReport = (e) => {
    debugger
    e.preventDefault();
    navigate(`/stock-book-detail-report`, {
      state: { itemCode, fromDate, toDate, item_Name },
    });
  };

  const handleRetailDetailReport = (e) => {
    debugger
    e.preventDefault();
    navigate(`/retail-stock-book-detail-report`, {
      state: { itemCode, fromDate, toDate, item_Name },
    });
  };

  return (
    <div className="ledger-form-container">
      <h2 style={{marginTop:"20px"}}>FNO Purchase And Sale Details Report</h2>
      <form onSubmit={handleStockBookReport}>
        <div className="form-row">
          <label htmlFor="item_code">Item Code:</label>
          <div className="account-help-container">
            <ItemMasterHelp
              onAcCodeClick={handleItemCode}
              CategoryName={item_Name}
              CategoryCode={itemCode}
              SystemType="I"
              name="item_code"
              className="account-master-help"
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
        <div className="form-row">
          <button type="submit" onClick={handleStockBookReport}>
            Stock Book Report
          </button>
          <button type="button" onClick={handleStockBookDetailReport}>
            Stock Book Detail Report
          </button>
          <button type="button" onClick={handleRetailDetailReport}>
            Retail Detail Report
          </button>
        </div>
      </form>
    </div>
  );
};

export default StockBookDetail;
