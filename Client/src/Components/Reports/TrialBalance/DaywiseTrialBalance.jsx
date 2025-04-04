import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import '../../Reports/Ledger/GledgerReport.css'
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import PdfPreview from "../../Outward/SaleBill/EWayBillReport/PdfPreview";
import { RingLoader } from 'react-spinners';
import { Typography } from '@mui/material';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

const DaywiseTrialBalance = () => {
  //GET values from session Storage
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const Company_Name = sessionStorage.getItem("Company_Name");

  const API_URL = process.env.REACT_APP_API;
  const [ledgerData, setLedgerData] = useState([]);
  const [ledgerDataExcel, setLedgerDataExcel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdfPreview, setPdfPreview] = useState([])

  const location = useLocation();
  const { acCode, fromDate, toDate, acname } = location.state || {};
  const navigate = useNavigate();

  const calculateTotals = (data) => {
    const totals = data.reduce(
      (acc, item) => {
        acc.debit += parseFloat(item.debit || 0);
        acc.credit += parseFloat(item.credit || 0);
        return acc;
      },
      { debit: 0, credit: 0 }
    );
    return totals;
  };

  const [totals, setTotals] = useState({ debit: 0, credit: 0 });

  useEffect(() => {
    debugger
    const fetchGLedgerReport = async () => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        const response = await axios.get(
          `${process.env.REACT_APP_API}/DaywiseTrialBalanceDetail-Report`,
          {
            params: {
              from_date: fromDate,
              to_date: toDate,
              Company_Code: companyCode,

            },
          }
        );
        const data = response.data || [];
        setLedgerData(data);
      } catch (err) {
        setError("Error fetching report data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGLedgerReport();
  }, [acCode, fromDate, toDate]);

  const handlePrint = () => {
    const printContent = document.getElementById('reportTable').outerHTML;
    const win = window.open('', '', 'height=700,width=900');
    win.document.write('<html><head><title>Print Report</title>');
    win.document.write('</head><body>');
    win.document.write(printContent);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  const handleExportToExcel = () => {

    const wsData = [
      ["ACcode", "Ac Name", "Opening", "Credit", "Debit"]
    ];


    ledgerData.forEach((item) => {
      wsData.push([
        item.AC_CODE,
        item.Ac_Name_E,
        Number(item.opening) || 0,
        Number(item.credit) || 0,
        Number(item.debit) || 0,
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "DayWiseTrialBalance");
    XLSX.writeFile(wb, `DayWiseTrialBalance_${fromDate}.xlsx`);
  };


  const handleBack = () => {
    navigate('/trial-balance');
  };


  const generatePdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = doc.getTextWidth(Company_Name);
    const xPosition = (pageWidth - textWidth) / 2;
    doc.text(Company_Name, xPosition, 10);
    doc.autoTable({ html: '#reportTable', styles: { halign: "right" } });
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    setPdfPreview(url);
  };

  return (
    <div className="ledger-report-container">
      <div className="col-auto">
        <button className="btn btn-secondary me-2" onClick={handlePrint}>
          Print Report
        </button>
        <button className="btn btn-success" onClick={handleExportToExcel}>
          Export to Excel
        </button>
        <button onClick={generatePdf} className="btn btn-secondary">PDF</button>
        <button className="btn btn-warning ms-2" onClick={handleBack}>
          Back
        </button>
      </div>
      <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold", marginTop: "10px" }}>{Company_Name}</Typography>
      <div>
        <p><strong>Day Wise Trial Balance : {" "}
          From Date: {fromDate || "N/A"} {" "}
        </strong>
        </p>
      </div>

      {loading && <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <RingLoader />
      </div>}
      {error && <p className="error-message">{error}</p>}

      {ledgerData.length > 0 && (
        <>
          <table
            id="reportTable"
            style={{ marginBottom: "60px", width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr>
                <th style={{ padding: "8px" }}>ACcode</th>
                <th style={{ padding: "8px" }}>Ac Name</th>
                <th style={{ padding: "8px", textAlign: "right" }}>Opening</th>
                <th style={{ padding: "8px", textAlign: "right" }}>Credit</th>
                <th style={{ padding: "8px", textAlign: "right" }}>Debit</th>
              </tr>
            </thead>
            <tbody>
              {ledgerData.map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: "8px" }}>{item.AC_CODE}</td>
                  <td style={{ padding: "8px" }}>{item.Ac_Name_E}</td>
                  <td style={{ padding: "8px", textAlign: "right" }}>
                    {formatReadableAmount(item.opening)}
                  </td>
                  <td style={{ padding: "8px", textAlign: "right" }}>
                    {formatReadableAmount(item.credit)}
                  </td>
                  <td style={{ padding: "8px", textAlign: "right" }}>
                    {formatReadableAmount(item.debit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="centered-container">

            {pdfPreview && pdfPreview.length > 0 && (
              <PdfPreview pdfData={pdfPreview} apiData={ledgerData} label={"DayWiseTrialBalance"} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DaywiseTrialBalance;
