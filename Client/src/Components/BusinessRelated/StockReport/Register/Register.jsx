import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AccountMasterHelp from "../../../../Helper/AccountMasterHelp";

const Register = () => {
  const [acCode, setAcCode] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [lotNo, setLotNo] = useState("");
  const [srNo, setSrNo] = useState("");
  const [accoid, setAccoid] = useState("");
  const [acname, setAcName] = useState("");
  const AccountYear = sessionStorage.getItem("Accounting_Year");

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

  const handleButtonClick = (label) => {
    // Handle button click based on label
    switch (label) {
      case "Dispatch Mill Wise":
        navigate(`/dispatch-mill-wise`, {
          state: { acCode, fromDate, toDate, lotNo, srNo },
        });
        break;
      case "Dispatch Details":
        navigate(`/dispatch-details`, {
          state: { acCode, fromDate, toDate, lotNo, srNo },
        });
        break;
      case "Dispatch Grade Wise":
        navigate(`/dispatch-grade-wise`, {
          state: { acCode, fromDate, toDate, lotNo, srNo },
        });
        break;
      case "Dispatch Detail For Mill":
        navigate(`/dispatch-detail-for-mill`, {
          state: { acCode, fromDate, toDate, lotNo, srNo },
        });
        break;
      case "Party Wise DO":
        navigate(`/party-wise-do`, {
          state: { acCode, fromDate, toDate, lotNo, srNo },
        });
        break;
      case "Balance Stock Summary":
        navigate(`/balance-stock-summary`, {
          state: { acCode, fromDate, toDate, lotNo, srNo },
        });
        break;
      default:
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#f4f7fc",
        padding: "30px",
        borderRadius: "8px",
        maxWidth: "700px",
        margin: "40px auto",
        fontFamily: "Arial, sans-serif",
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#0056b3", marginBottom: "20px" }}>
        Register
      </h2>
      <form style={{ display: "grid", gridTemplateColumns: "200px 1fr", rowGap: "5px", columnGap: "10px" }}>
        {/* Branch */}
        <label style={{ fontWeight: "bold", color: "#333" }}>Branch:</label>
        <select
          style={{
            width: "40%",
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        >
          <option value="All">All</option>
        </select>

        {/* From Date */}
        <label style={{ fontWeight: "bold", color: "#333" }}>From Date:</label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          style={{
            width: "40%",
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />

        {/* To Date */}
        <label style={{ fontWeight: "bold", color: "#333" }}>To Date:</label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          style={{
            width: "40%",
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />

        {/* Mill Name */}
        <label style={{ fontWeight: "bold", color: "#333" }}>Mill Name:</label>
        <div>
          <AccountMasterHelp
            onAcCodeClick={handleAcCode}
            name="AC_CODE"
            CategoryName={acname}
            CategoryCode={acCode}
            tabIndexHelp={1}
            Ac_type=""
          />
        </div>

        {/* Lot No */}
        <label style={{ fontWeight: "bold", color: "#333" }}>Lot No:</label>
        <input
          type="text"
          value={lotNo}
          onChange={(e) => setLotNo(e.target.value)}
          style={{
            width: "40%",
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />

        {/* Sr No */}
        <label style={{ fontWeight: "bold", color: "#333" }}>Sr No:</label>
        <input
          type="text"
          value={srNo}
          onChange={(e) => setSrNo(e.target.value)}
          style={{
            width: "40%",
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />

        {/* Buttons */}
        <div style={{ gridColumn: "span 2", marginTop: "20px", textAlign: "center" }}>
          {[
            "Dispatch Mill Wise",
            "Dispatch Details",
            "Dispatch Grade Wise",
            "Dispatch Detail For Mill",
            "Party Wise DO",
            "Balance Stock Summary",
          ].map((label, index) => (
            <button
              key={index}
              onClick={() => handleButtonClick(label)}
              style={{
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "10px 20px",
                margin: "10px",
                fontWeight: "bold",
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};

export default Register;
