import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ProfitLoss = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [UptoDate, setUptoDate] = useState("");
  const AccountYear = sessionStorage.getItem("Accounting_Year");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (AccountYear) {
      const dates = AccountYear.split(" - ");
      if (dates.length === 2) {
        setFromDate(dates[0]);
        setToDate(dates[1]);
        setUptoDate(dates[1]);
      }
    }
  }, [AccountYear]);

  const navigate = useNavigate();

  const handleGetReportClick = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
        const url = `/ProfitLoss-Report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
        window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
        setLoading(false);
    }, 500);
};

const handleBalanceSheetReportClick = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
        const url = `/Balancesheet-Report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
        window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
        setLoading(false);
    }, 500);
};


  return (
    <div className="container mt-5">
      <div className="card shadow-lg p-4 mx-auto" style={{ maxWidth: "600px" }}>
        <h2 className="text-center mb-4 text-primary">Profit & Loss / Balance Sheet</h2>

        <form onSubmit={handleGetReportClick}>
          {/* Date Fields Row */}
          <div className="row g-3 justify-content-center text-center">
            <div className="col-md-8">
              <label className="form-label">Upto Date:</label>
              <input
                type="date"
                id="UptoDate"
                className="form-control"
                value={UptoDate}
                onChange={(e) => setUptoDate(e.target.value)}
              />
            </div>
            <div className="col-md-8">
              <label className="form-label">From Date:</label>
              <input
                type="date"
                id="fromDate"
                className="form-control"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="col-md-8">
              <label className="form-label">To Date:</label>
              <input
                type="date"
                id="toDate"
                className="form-control"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          {/* Buttons Row */}
          <div className="d-flex justify-content-center mt-4">
            <button type="submit" className="btn btn-success me-3" onClick={handleGetReportClick}>
              📊 Profit & Loss Report
            </button>

            <button
              className="btn btn-primary"
              onClick={handleBalanceSheetReportClick}

            >
              📑 Balance Sheet Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfitLoss;
