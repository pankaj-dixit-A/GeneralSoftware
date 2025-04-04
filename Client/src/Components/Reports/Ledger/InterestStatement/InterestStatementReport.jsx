import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import PdfPreview from "../../../../Common/PDFPreview";
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
import { RingLoader } from "react-spinners";

const API_URL = process.env.REACT_APP_API;

const InterestStatementReport = () => {
  // GET values from session Storage
  const companyCode = sessionStorage.getItem("Company_Code");
  const companyName = sessionStorage.getItem("Company_Name");
  const location = useLocation();

  const { acCode, fromDate, toDate, interestRate, interestDays, filter, acname } = location.state;

  const [transactions, setTransactions] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfPreview, setPdfPreview] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch(
      `${API_URL}/interest-statement?accode=${acCode}&fromdt=${fromDate}&todt=${toDate}&intRate=${interestRate}&intDays=${interestDays}&company_code=${companyCode}`
    )
      .then((response) => response.json())
      .then((data) => {
        const fetchedTransactions = data.data || [];
        const fetchedTotals = data.totals || {};
        setTransactions(fetchedTransactions);
        setTotals(fetchedTotals);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [acCode, fromDate, toDate, interestRate, interestDays, companyCode]);

  // Memoize filteredTransactions to avoid recalculations on every render
  const filteredTransactions = useMemo(() => {
    if (filter === "OnlyDr") {
      return transactions.filter((txn) => txn.Bal_DC === "Dr");
    }
    return transactions;
  }, [filter, transactions]);

  const generatePDF = () => {
    const doc = new jsPDF();
    const tableColumnHeaders = [
      "#",
      "Date",
      "Debit Amount",
      "Credit Amount",
      "Balance",
      "D/C",
      "Days",
      "Interest",
      "D/C",
    ];

    doc.setFontSize(16);
    doc.text(companyName, 105, 10, null, null, "center");

    doc.setFontSize(12);
    doc.text(`A/C Name: ${acname}`, 10, 20);
    doc.text(`From Date: ${fromDate} To Date: ${toDate}`, 10, 30);
    doc.text(`Interest Rate: ${interestRate}%`, 10, 40);

    const tableData = filteredTransactions.map((txn, index) => [
      txn.Tran_Type,
      txn.Date,
      txn.Debit_Amount.toFixed(2),
      txn.Credit_Amount.toFixed(2),
      txn.Balance.toFixed(2),
      txn.Bal_DC,
      txn.Days,
      txn.Interest.toFixed(2),
      txn.Int_DC,
    ]);

    if (totals) {
      tableData.push([
        "Totals",
        "",
        totals.Total_Debit.toFixed(2),
        totals.Total_Credit.toFixed(2),
        totals.Net_Balance.toFixed(2),
        totals.Net_Balance_DC,
        totals.Net_Days,
        totals.Net_Interest.toFixed(2),
        totals.Net_Interest_DC,
      ]);
    }

    doc.autoTable({
      startY: 50,
      head: [tableColumnHeaders],
      body: tableData,
      styles: { halign: "right" },
      headStyles: { fillColor: "#4caf50", textColor: "white", halign: "center" },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "left" },
        5: { halign: "center" },
        8: { halign: "center" },
      },
    });
    const pdfData = doc.output("blob");
    const pdfURL = URL.createObjectURL(pdfData);
    setPdfPreview(pdfURL);
  };

  const handleBack = () => {
    navigate("/interest-statement");
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
          textAlign: "center",
        }}
      >
        <RingLoader />
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px", fontSize: "18px", color: "#ff5722" }}>
        No data available for the selected filters.
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div className="d-flex mb-3 mt-0.5">
        {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={filteredTransactions} label={"Interest Statement Report"} />}
        <button onClick={generatePDF} className="print-button">
          PDF Preview
        </button>
        <button className="btn btn-secondary" onClick={handleBack}>
          Back
        </button>
      </div>
      <h2 style={{ textAlign: "center", marginBottom: "1px", color: "#333", fontWeight: "bold", marginTop: "-50px" }}>
        {companyName}
      </h2>
      <p>
        <strong>A/C Name:</strong> {`${acname}`}
      </p>
      <p>
        <strong>From Date:</strong> {`${fromDate}`} <strong>To Date:</strong> {`${toDate}`}
      </p>
      <p>
        <strong>Interest Rate:</strong> {`${interestRate}%`}
      </p>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "60%",
            borderCollapse: "collapse",
            margin: "0 auto",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
            marginBottom: "60px",
          }}
        >
          <thead>
            <tr>
              <th style={{ backgroundColor: "#4caf50", color: "white", textAlign: "left", padding: "10px", position: "sticky", top: "0" }}>#</th>
              <th style={{ backgroundColor: "#4caf50", color: "white", textAlign: "left", padding: "10px", position: "sticky", top: "0" }}>Date</th>
              <th style={{ backgroundColor: "#4caf50", color: "white", textAlign: "right", padding: "10px", position: "sticky", top: "0" }}>Debit Amount</th>
              <th style={{ backgroundColor: "#4caf50", color: "white", textAlign: "right", padding: "10px", position: "sticky", top: "0" }}>Credit Amount</th>
              <th style={{ backgroundColor: "#4caf50", color: "white", textAlign: "right", padding: "10px", position: "sticky", top: "0" }}>Balance</th>
              <th style={{ backgroundColor: "#4caf50", color: "white", textAlign: "center", padding: "10px", position: "sticky", top: "0" }}>D/C</th>
              <th style={{ backgroundColor: "#4caf50", color: "white", textAlign: "right", padding: "10px", position: "sticky", top: "0" }}>Days</th>
              <th style={{ backgroundColor: "#4caf50", color: "white", textAlign: "right", padding: "10px", position: "sticky", top: "0" }}>Interest</th>
              <th style={{ backgroundColor: "#4caf50", color: "white", textAlign: "center", padding: "10px", position: "sticky", top: "0" }}>D/C</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((txn, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#f9f9f9" : "white", textAlign: "center" }}>
                <td style={{ textAlign: "left" }}>{txn.Tran_Type}</td>
                <td style={{ textAlign: "left" }}>{txn.Date}</td>
                <td style={{ textAlign: "right" }}>{formatReadableAmount(txn.Debit_Amount.toFixed(2))}</td>
                <td style={{ textAlign: "right" }}>{formatReadableAmount(txn.Credit_Amount.toFixed(2))}</td>
                <td style={{ textAlign: "right" }}>{formatReadableAmount(txn.Balance.toFixed(2))}</td>
                <td style={{ textAlign: "center" }}>{txn.Bal_DC}</td>
                <td style={{ textAlign: "right" }}>{txn.Days}</td>
                <td style={{ textAlign: "right" }}>{formatReadableAmount(txn.Interest.toFixed(2))}</td>
                <td style={{ textAlign: "center" }}>{txn.Int_DC}</td>
              </tr>
            ))}
            {totals && (
              <tr style={{ fontWeight: "bold", backgroundColor: "#e6f7ff", color: "#333" }}>
                <td colSpan="2" style={{ textAlign: "center" }}>Totals</td>
                <td style={{ textAlign: "right" }}>{formatReadableAmount(totals.Total_Debit.toFixed(2))}</td>
                <td style={{ textAlign: "right" }}>{formatReadableAmount(totals.Total_Credit.toFixed(2))}</td>
                <td style={{ textAlign: "right" }}>{formatReadableAmount(totals.Net_Balance.toFixed(2))}</td>
                <td style={{ textAlign: "center" }}>{totals.Net_Balance_DC}</td>
                <td style={{ textAlign: "right" }}>{totals.Net_Days}</td>
                <td style={{ textAlign: "right" }}>{formatReadableAmount(totals.Net_Interest.toFixed(2))}</td>
                <td style={{ textAlign: "center" }}>{totals.Net_Interest_DC}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InterestStatementReport;
