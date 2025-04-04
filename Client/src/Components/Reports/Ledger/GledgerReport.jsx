import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import '../../Reports/Ledger/GledgerReport.css'
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import PdfPreview from "../../Outward/SaleBill/EWayBillReport/PdfPreview";
import { Typography } from '@mui/material';
import { RingLoader } from 'react-spinners';
import { formatDate } from '../../../Common/FormatFunctions/FormatDate'
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount"
import Swal from "sweetalert2";

const GledgerReport = () => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const Company_Name = sessionStorage.getItem("Company_Name");
  const Company_Address = sessionStorage.getItem("Company_Address");
  const Company_GSTNo = sessionStorage.getItem("Company_GSTNO")
  const Company_PanNo = sessionStorage.getItem("Company_PanNo")

  const API_URL = process.env.REACT_APP_API;
  const [ledgerData, setLedgerData] = useState([]);
  const [ledgerDataExcel, setLedgerDataExcel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdfPreview, setPdfPreview] = useState([])

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const acCode = searchParams.get('acCode');
  const acname = searchParams.get('acname');
  const [totals, setTotals] = useState({ debit: 0, credit: 0 });

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

  useEffect(() => {
    const fetchGLedgerReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(
          `${process.env.REACT_APP_API}/get_gLedgerReport_AcWise`,
          {
            params: {
              from_date: fromDate,
              to_date: toDate,
              Company_Code: companyCode,
              // Year_Code: Year_Code,
              Accode: acCode
            },
          }
        );
        const data = response.data.all_data || [];
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


  const mergeOpeningBalanceToAllData = (openingBalance, allData) => {
    let openingBalanceData = []
    if (openingBalance.length === 0) {
      openingBalanceData.push({
        AC_CODE: 0,
        Ac_Name_E: "Opening Balance",
        Balance: 0,
        DOC_DATE: "",
        DOC_NO: "",
        NARRATION: "Opening balance",
        TRAN_TYPE: "OP",
        credit: 0,
        debit: 0,
        DRCR: ""
      })
    }
    else {
      openingBalanceData = openingBalance.map((balance) => ({
        AC_CODE: balance.AC_CODE,
        Ac_Name_E: "Opening Balance",
        Balance: balance.OpBal ? Math.abs(parseFloat(balance.OpBal)) : 0,
        DOC_DATE: "",
        DOC_NO: "",
        NARRATION: "Opening balance",
        TRAN_TYPE: "OP",
        credit: balance.OpBal < 0 ? Math.abs(parseFloat(balance.OpBal)) : 0,
        debit: balance.OpBal > 0 ? Math.abs(parseFloat(balance.OpBal)) : 0,
        DRCR: balance.OpBal > 0 ? "D" : "C",
      }))
    };
    return [...openingBalanceData, ...allData];
  };

  const handleCalculateBalance = async (details) => {
    const LedgerData = details.data.all_data;
    const OpBalData = details.data.Opening_Balance ? details.data.Opening_Balance : "";
    let opBal = OpBalData.length > 0 ? OpBalData[0].OpBal : 0;
    let netdebit = 0;
    let netcredit = 0;
    if (opBal > 0) {
      netdebit = opBal;
    }
    else {
      netcredit = -opBal;
    }
    const mergedData = mergeOpeningBalanceToAllData(OpBalData, LedgerData);
    mergedData.forEach((entry) => {
      if (entry.drcr === "D") {
        opBal = opBal + Math.abs(parseFloat(entry.AMOUNT || 0).toFixed(2));
        netdebit += parseFloat(entry.AMOUNT || 0);
      } else {
        opBal = opBal - Math.abs(parseFloat(entry.AMOUNT || 0).toFixed(2));
        netcredit += parseFloat(entry.AMOUNT || 0).toFixed(2);
      }
      entry.Balance = opBal ? Math.abs(opBal).toFixed(2) : 0;
      entry.drcr = opBal > 0 ? "Dr" : "Cr";
    });
    return mergedData;
  }

  const handlePrint = () => {
    const doc = new jsPDF('portrait');

    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;

    doc.setFontSize(10);
    const topMargin = 10;
    let currentY = topMargin;

    const companyX = pageWidth / 2;

    doc.text(`${Company_Name}`, companyX, currentY, null, null, "center");
    currentY += 6;

    doc.setFontSize(6);
    doc.text(`${Company_Address}`, companyX, currentY, null, null, "center");
    currentY += 6;

    doc.text(`GST No. : ${Company_GSTNo} , PAN No. : ${Company_PanNo}`, companyX, currentY, null, null, "center");
    currentY += 6;

    const accountStatementLine1 = `${acCode || ""} ${acname || ""}`;
    const accountStatementLine2 = `From Date : ${formatDate(fromDate) || ""} - To Date : ${formatDate(toDate) || ""}`;

    doc.setFontSize(8);
    const accountStatementY = currentY;
    const lineSpacing = 5;

    doc.text(accountStatementLine1, companyX, accountStatementY, null, null, "center");
    doc.text(accountStatementLine2, companyX, accountStatementY + lineSpacing, null, null, "center");

    currentY += 1;

    const headers = [
      ["Trans Type", "Doc No", "Date", "Narration", "Debit", "Credit", "Balance", "DR/CR"]
    ];

    const rows = ledgerData.map(item => [
      item.TRAN_TYPE,
      item.DOC_NO,
      item.DOC_DATE,
      item.NARRATION,
      formatReadableAmount(parseFloat(item.debit).toFixed(2)),
      formatReadableAmount(parseFloat(item.credit).toFixed(2)),
      formatReadableAmount(parseFloat(item.Balance).toFixed(2)),
      item.drcr
    ]);

    const grandTotalDebit = totals.debit;
    const grandTotalCredit = totals.credit;
    const grandTotalBalance = Math.abs(totals.debit - totals.credit);
    const grandTotalDRCR = (totals.debit - totals.credit) > 0 ? 'Dr' : 'Cr';

    const totalData = [
      "",
      "",
      "",
      "Total",
      formatReadableAmount(grandTotalDebit.toFixed(2)),
      formatReadableAmount(grandTotalCredit.toFixed(2)),
      formatReadableAmount(grandTotalBalance.toFixed(2)),
      grandTotalDRCR,
    ];

    doc.autoTable({
      head: headers,
      body: rows,
      foot: [totalData],
      startY: accountStatementY + lineSpacing + 10,
      startX: margin,
      styles: {
        fontSize: 7,
        cellPadding: 0.6,
        halign: 'left',
        valign: 'middle',
        lineWidth: 0.1,
      },
      columnStyles: {
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
      },
      theme: 'grid',
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.5,
      },
      bodyStyles: {
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
      },
      footStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.5,
        fontSize: 6,
      },
      tableWidth: contentWidth,
    });

    doc.autoPrint();
    const printWindow = window.open(doc.output('bloburl'), '_blank');
    printWindow.print();
  };


  //Export To xlsx format
  const handleExportToExcel = () => {
    const table = document.getElementById("reportTable");

    if (!table) {
      alert("Table not found!");
      return;
    }

    const wb = XLSX.utils.book_new();

    let headers = [
      ["JK Sugars And Commodities Pvt. Ltd."],
      [`Account Statement of: (${acCode || ""}) ${acname || ""}`],
      [
        `From Date: ${formatDate(fromDate) || ""} To Date: ${formatDate(toDate) || ""
        }`,
      ],
      [],
    ];

    const ws = XLSX.utils.table_to_sheet(table, { origin: 4 });
    XLSX.utils.sheet_add_aoa(ws, headers, { origin: 0 });
    ws["!cols"] = [
      { wch: 10 },
      { wch: 20 },
      { wch: 8 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
    ];

    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r + 4; R <= range.e.r; R++) {
      for (let C = 3; C <= 5; C++) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[cellRef]) {
          ws[cellRef].s = ws[cellRef].s || {};
          ws[cellRef].s.alignment = { horizontal: "right" };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Ledger Report");

    XLSX.writeFile(
      wb,
      `Account Statement of: (${acCode || ""}) ${acname || ""}.xlsx`
    );
  };


  const convertDateToISO = (dateStr) => {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return null;
  };

  const handleRowClick = (doc_no, tran_type, DOC_DATE) => {
    const accountingYearData = sessionStorage.getItem('Accounting_Year');

    if (!accountingYearData) {
      Swal.fire({
        icon: "warning",
        title: "Accounting Year Data is not available",
        text: `Accounting Year data is not available.`,
        confirmButtonColor: "#d33",
      });
      return;
    }

    const [startDateStr, endDateStr] = accountingYearData.split(" - ");

    const startDate = new Date(startDateStr + 'T00:00:00Z');
    const endDate = new Date(endDateStr + 'T23:59:59Z');

    const formattedEntryDate = convertDateToISO(DOC_DATE);

    if (!formattedEntryDate) {
      alert("Invalid document date format.");
      return;
    }

    const entryDate = new Date(formattedEntryDate + 'T00:00:00Z');

    if (entryDate.getTime() < startDate.getTime() || entryDate.getTime() > endDate.getTime()) {
      Swal.fire({
        icon: "warning",
        title: "Out Of Range Date",
        text: `The document date is outside the Accounting Year range.`,
        confirmButtonColor: "#d33",
      });
      return;
    }

    if (tran_type === 'CV' || tran_type === 'LV') {
      const url = `${window.location.origin}/commission-bill`
      const params = new URLSearchParams({
        selectedVoucherNo: doc_no,
        selectedVoucherType: tran_type
      });
      window.open(`${url}?${params.toString()}`, '_blank');
    }
    if (tran_type === 'CR' || tran_type === 'BR' || tran_type === 'BP' || tran_type === 'CP') {
      const url = `${window.location.origin}/receipt-payment`;
      const params = new URLSearchParams({
        navigatedRecord: doc_no,
        navigatedTranType: tran_type
      });
      window.open(`${url}?${params.toString()}`, '_blank');
    }

    if (tran_type === 'UI') {
      const url = `${window.location.origin}/utr-entry`;
      const params = new URLSearchParams({
        navigatedRecord: doc_no,
      });
      window.open(`${url}?${params.toString()}`, '_blank');
    }

    if (tran_type === 'JV') {
      const url = `${window.location.origin}/journal-voucher`;
      const params = new URLSearchParams({
        navigatedRecord: doc_no,
        navigatedTranType: tran_type
      });
      window.open(`${url}?${params.toString()}`, '_blank');
    }

    if (
      tran_type === "DN" ||
      tran_type === "DS" ||
      tran_type === "CN" ||
      tran_type === "CS"
    ) {
      const url = `${window.location.origin}/debitcreditnote`;
      const params = new URLSearchParams({
        navigatedRecord: doc_no,
        navigatedTranType: tran_type,
      });
      window.open(`${url}?${params.toString()}`, "_blank");
    }

    if (tran_type === "XP") {
      const url = `${window.location.origin}/other-purchase`;
      const params = new URLSearchParams({
        navigatedRecord: doc_no,
        navigatedTranType: tran_type,
      });
      window.open(`${url}?${params.toString()}`, "_blank");
    }

    if (tran_type === "RB") {
      const url = `${window.location.origin}/service-bill`;
      const params = new URLSearchParams({
        navigatedRecord: doc_no,
      });
      window.open(`${url}?${params.toString()}`, "_blank");
    }
  };

  //Genrate PDf with send email
  const generatePdf = () => {
    const doc = new jsPDF('portrait');
    doc.setFontSize(10);
    const topMargin = 10;
    let currentY = topMargin;

    const companyX = doc.internal.pageSize.width / 2;
    doc.text(`${Company_Name}`, companyX, currentY, null, null, "center");
    currentY += 5;

    doc.setFontSize(6);
    doc.text(`${Company_Address}`, companyX, currentY, null, null, "center");
    currentY += 5;

    doc.text(`GST No. : ${Company_GSTNo} , PAN No. : ${Company_PanNo}`, companyX, currentY, null, null, "center");
    currentY += 6;

    const accountStatement = `${acCode || ""} ${acname || ""} - From Date : ${formatDate(fromDate) || ""} - To Date : ${formatDate(toDate) || ""}`;
    doc.setFontSize(8);

    const pageWidth = doc.internal.pageSize.width;
    const textWidth = doc.getStringUnitWidth(accountStatement) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    const centerX = (pageWidth - textWidth) / 2;

    doc.text(accountStatement, centerX, currentY, { maxWidth: 180 });

    currentY += 6;

    const headers = [
      "Trans Type",
      "Doc No",
      "Date",
      "Narration",
      "Debit",
      "Credit",
      "Balance",
      "DR/CR"
    ];

    const rows = ledgerData.map(item => [
      item.TRAN_TYPE,
      item.DOC_NO,
      item.DOC_DATE,
      item.NARRATION,
      formatReadableAmount(parseFloat(item.debit).toFixed(2)),
      formatReadableAmount(parseFloat(item.credit).toFixed(2)),
      formatReadableAmount(parseFloat(item.Balance).toFixed(2)),
      item.drcr
    ]);

    const grandTotalDebit = totals.debit;
    const grandTotalCredit = totals.credit;
    const grandTotalBalance = Math.abs(totals.debit - totals.credit);
    const grandTotalDRCR = (totals.debit - totals.credit) > 0 ? 'Dr' : 'Cr';

    const totalRow = [
      "", "", "", "Total",
      formatReadableAmount(grandTotalDebit.toFixed(2)),
      formatReadableAmount(grandTotalCredit.toFixed(2)),
      formatReadableAmount(grandTotalBalance.toFixed(2)),
      grandTotalDRCR,
    ];

    doc.autoTable({
      head: [headers],
      body: [...rows, totalRow],
      startY: currentY + 1,
      styles: {
        fontSize: 7,
        cellPadding: 0.6,
        halign: 'left',
        valign: 'middle',
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'left', fontSize: 5 },
        2: { halign: 'left', fontSize: 5 },
        3: { halign: 'left' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'left' },
      },
      theme: 'grid',
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.1,
      },
      bodyStyles: {
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
      },
      footStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.1,
        fontSize: 5,
      },
    });

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
        {pdfPreview && pdfPreview.length > 0 && (
          <PdfPreview pdfData={pdfPreview} apiData={ledgerData} label={"GLedger"} />

        )}
        <button onClick={generatePdf} className="btn btn-secondary">PDF</button>
      </div>
      <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold", marginTop: "10px" }}>{Company_Name}</Typography>
      <div>
        <p><strong> {" "}
          ({acCode || ""}) {" "}
          {acname || ""} {" "}
          From Date: {fromDate ? formatDate(fromDate) : "N/A"} {" "}
          To Date: {toDate ? formatDate(toDate) : "N/A"} </strong>
        </p>
      </div>

      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <RingLoader />
        </div>
      )}
      {error && <p className="error-message">{error}</p>}

      {ledgerData.length > 0 && (
        <>
          <table id="reportTable" style={{ marginBottom: "60px" }}>
            <thead>
              <tr>
                <th>Trans Type</th>
                <th>Doc No</th>
                <th>Date</th>
                <th>Narration</th>
                <th style={{ textAlign: "right" }}>Debit</th>
                <th style={{ textAlign: "right" }}>Credit</th>
                <th style={{ textAlign: "right" }}>Balance</th>
                <th>DRCR</th>
              </tr>
            </thead>
            <tbody >
              {ledgerData.map((item, index) => (
                <tr key={index}>
                  <td>{item.TRAN_TYPE}</td>
                  <td onClick={() => handleRowClick(item.DOC_NO, item.TRAN_TYPE, item.DOC_DATE)} style={{ cursor: "pointer" }}>{item.DOC_NO}</td>
                  <td>{item.DOC_DATE}</td>
                  <td>{item.NARRATION}</td>
                  <td style={{ textAlign: "right" }}>{formatReadableAmount(parseFloat(item.debit).toFixed(2) || 0.00)}</td>
                  <td style={{ textAlign: "right" }}>{formatReadableAmount(parseFloat(item.credit).toFixed(2) || 0.00)}</td>
                  <td style={{ textAlign: "right" }}>{formatReadableAmount(parseFloat(item.Balance).toFixed(2) || 0.00)}</td>
                  <td>{item.drcr}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: "yellow" }}>
                <td colSpan="4" align="right"><strong>Total</strong></td>
                <td style={{ textAlign: "right" }}><strong>{formatReadableAmount(totals.debit.toFixed(2))}</strong></td>
                <td style={{ textAlign: "right" }}><strong>{formatReadableAmount(totals.credit.toFixed(2))}</strong></td>
                <td style={{ textAlign: "right" }}><strong>{formatReadableAmount(Math.abs(parseFloat(totals.debit - totals.credit)).toFixed(2))}</strong></td>
                <td ><strong>{(totals.debit.toFixed(2) - totals.credit.toFixed(2)) > 0 ? 'Dr' : 'Cr'}</strong></td>
              </tr>
            </tfoot>
          </table>
          <div className="centered-container">
          </div>
        </>
      )}
    </div>
  );
};

export default GledgerReport;
