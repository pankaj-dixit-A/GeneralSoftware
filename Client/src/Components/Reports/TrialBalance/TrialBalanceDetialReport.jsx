import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import '../../Reports/Ledger/GledgerReport.css'
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import PdfPreview from "../../../Common/PDFPreview";
import { RingLoader } from 'react-spinners';
import { Typography } from '@mui/material';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

const API_URL = process.env.REACT_APP_API;

const GledgerReport = () => {
  //GET values from session Storage
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const Company_Name = sessionStorage.getItem("Company_Name");

  const [ledgerData, setLedgerData] = useState([]);
  const [ledgerDataExcel, setLedgerDataExcel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdfPreview, setPdfPreview] = useState([])

  const location = useLocation();
  const { acCode, fromDate, toDate, acname, } = location.state || {};
  const navigate = useNavigate();
  const [totals, setTotals] = useState({ debit: 0, credit: 0 });

  useEffect(() => {
    debugger
    const fetchGLedgerReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(
          `${process.env.REACT_APP_API}/TrialBalanceDetail-Report`,
          {
            params: {
              from_date: fromDate,
              to_date: toDate,
              Company_Code: companyCode,
            },
          }
        );
        const data = response.data || [];
        const BalanceData = await handleCalculateBalance(response);
        setLedgerData(BalanceData);
        const totals = calculateTotals(BalanceData);
        setTotals(totals);

      } catch (err) {
        setError("Error fetching report data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGLedgerReport();

  }, [acCode, fromDate, toDate]);

  const calculateTotals = (data) => {
    const totals = data.reduce(
      (acc, item) => {
        acc.Op_Debit += parseFloat(item.Op_Debit || 0);
        acc.Op_Credit += parseFloat(item.Op_Credit || 0);
        acc.Tran_Debit += parseFloat(item.Tran_Debit || 0);
        acc.Tran_Credit += parseFloat(item.Tran_Credit || 0);
        acc.Closing_Debit += parseFloat(item.Closing_Debit || 0);
        acc.Closing_Credit += parseFloat(item.Closing_Credit || 0);
        return acc;
      },
      { Op_Debit: 0, Op_Credit: 0, Tran_Debit: 0, Tran_Credit: 0, Closing_Debit: 0, Closing_Credit: 0 }
    );
    return totals;
  };

  const handleCalculateBalance = async (details) => {
    debugger;
    const LedgerData = details.data;

    LedgerData.forEach((item) => {
      let Op_debit = 0.00;
      let Op_credit = 0.00;
      let Tran_debit = 0.00;
      let Tran_credit = 0.00;
      let Closing_Balance = 0.00;

      // Calculate Opening Balances
      const Op_Balance = parseFloat(item.opbal || 0);
      if (item.group_Type === 'B') {
        if (Op_Balance > 0) {
          Op_debit = Op_Balance;
        } else {
          Op_credit = Math.abs(Op_Balance);
        }
      }

      // Calculate Transaction Balances
      Tran_debit = parseFloat(item.debit || 0);
      Tran_credit = parseFloat(item.credit || 0);

      // Calculate Closing Balance
      Closing_Balance = parseFloat((Op_debit + Tran_debit) - (Op_credit + Tran_credit)).toFixed(2);

      // Assign calculated values to the item
      if (Tran_debit !== 0 || Tran_credit !== 0 || Op_debit !== 0 || Op_credit !== 0) {
        item.Op_Debit = Op_debit.toFixed(2);
        item.Op_Credit = Op_credit.toFixed(2);
        item.Tran_Debit = Tran_debit.toFixed(2);
        item.Tran_Credit = Tran_credit.toFixed(2);

        if (Closing_Balance > 0) {
          item.Closing_Debit = Closing_Balance;
          item.Closing_Credit = 0.00;
        } else if (Closing_Balance < 0) {
          item.Closing_Debit = 0.00;
          item.Closing_Credit = Math.abs(Closing_Balance);
        } else {
          item.Closing_Debit = 0.00;
          item.Closing_Credit = 0.00;
        }
      }
    });
    return LedgerData;
  };

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
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(ledgerData);
    XLSX.utils.book_append_sheet(wb, ws, 'Pending Reports');
    XLSX.writeFile(wb, 'Ledger_' + acname + '_' + fromDate + '_' + toDate + '.xlsx');
  };

  const handleBack = () => {
    navigate('/trial-balance');
  };

  const handleRowClick = (doc_no, tran_type) => {
  };

  const preparedPreviewData = () => {
    setPdfPreview(ledgerData)
  }

  useEffect(() => {
    if (ledgerData.length > 0) {
    }
  }, [ledgerData])

  return (
    <div className="ledger-report-container">
      <div className="col-auto">
        <button className="btn btn-secondary me-2" onClick={handlePrint}>
          Print Report
        </button>
        <button className="btn btn-success" onClick={handleExportToExcel}>
          Export to Excel
        </button>
        <button className="btn btn-warning ms-2" onClick={handleBack}>
          Back
        </button>
      </div>
      <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold", marginTop: "10px" }}>{Company_Name}</Typography>
      <div>
        <p><strong>Account Statement of : {" "}
          ({acCode || "N/A"}) {" "}
          {acname || "N/A"} {" "}
          From Date: {fromDate || "N/A"} {" "}
          To Date: {toDate || "N/A"} </strong>
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
          <table id="reportTable" style={{marginBottom: "60px"}}>
            <thead>
              <tr>
                <th rowSpan={2}>Account Code</th>
                <th rowSpan={2}>Account Name</th>
                <th colSpan={2} align="center">Opening</th>
                <th colSpan={2} align="center">Transaction</th>
                <th colSpan={2} align="center">Closing</th>
              </tr>
              <tr>
                <th> Debit </th>
                <th>Credit</th>
                <th> Debit </th>
                <th>Credit</th>
                <th> Debit </th>
                <th>Credit</th>
              </tr>
            </thead>
            <tbody>
              {ledgerData.map((item, index) => (
                <tr key={index} onClick={() => handleRowClick(item.DOC_NO, item.TRAN_TYPE)}>
                  <td>{item.ac_code}</td>
                  <td>{item.Ac_Name_E}</td>
                  <td>{item.Op_Debit}</td>
                  <td align="right">{item.Op_Credit}</td>
                  <td align="right">{item.Tran_Debit}</td>
                  <td align="right">{item.Tran_Credit}</td>
                  <td align="right">{item.Closing_Debit}</td>
                  <td align="right">{item.Closing_Credit}</td>
                  <td>{item.drcr}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} align="right"><strong>Total</strong></td>
                <td><strong>{formatReadableAmount(totals.Op_Debit)}</strong></td>
                <td><strong>{formatReadableAmount(totals.Op_Credit)}</strong></td>
                <td><strong>{formatReadableAmount(totals.Tran_Debit)}</strong></td>
                <td><strong>{formatReadableAmount(totals.Tran_Credit)}</strong></td>
                <td><strong>{formatReadableAmount(totals.Closing_Debit)}</strong></td>
                <td><strong>{formatReadableAmount(totals.Closing_Credit)}</strong></td>
              </tr>
            </tfoot>
          </table>
          <div className="centered-container">
            {pdfPreview && pdfPreview.length > 0 && (
              <PdfPreview pdfData={pdfPreview} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GledgerReport;
