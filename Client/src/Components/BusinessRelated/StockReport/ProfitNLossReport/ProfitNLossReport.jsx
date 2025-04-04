import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable"; 
import { useNavigate } from 'react-router-dom';
import PdfPreview from '../../../../Common/PDFPreview';

const API_URL = process.env.REACT_APP_API;

const ProfitNLossReport = () => {
  const { state } = useLocation();
  const [groupedData, setGroupedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [grandTotalProfit, setGrandTotalProfit] = useState(0);
  const [grandTotalDoquantal, setGrandTotalDoquantal] = useState(0);
  const [pdfPreview, setPdfPreview] = useState(null);

  const navigate = useNavigate();
 
  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(value);

  useEffect(() => {
    if (state) {
      fetchReportData(state.millCode, state.lotNo, state.fromDate, state.toDate);
    }
  }, [state]);

  const fetchReportData = async (millCode, lotNo, fromDate, toDate) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/profit-loss-report`, {
        params: { Mill_Code: millCode, Lot_No: lotNo, Start_Date: fromDate, End_Date: toDate },
      });
      processReportData(response.data);
    } catch (error) {
      setError("Failed to fetch report data. Please try again.");
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (data) => {
    if (!data.length) {
      setGroupedData([]);
      setGrandTotalProfit(0);
      setGrandTotalDoquantal(0);
      return;
    }

    const grouped = data.reduce((acc, curr) => {
      const tender = curr.Tender_No;
      if (!acc[tender]) {
        acc[tender] = {
          tender,
          tenderDetails: curr,
          entries: [],
          totalProfit: 0,
          totalTaxableAmt: 0,
          totalDoquantal: 0,
        };
      }
      acc[tender].entries.push(curr);
      acc[tender].totalProfit += parseFloat(curr.profit || 0);
      acc[tender].totalTaxableAmt += parseFloat(curr.TaxableAmount || 0);
      acc[tender].totalDoquantal += parseFloat(curr.doquantal || 0);
      return acc;
    }, {});

    const totalProfit = Object.values(grouped).reduce(
      (sum, group) => sum + group.totalProfit,
      0
    );
    const totalDoquantal = Object.values(grouped).reduce(
      (sum, group) => sum + group.totalDoquantal,
      0
    );


    setGroupedData(Object.values(grouped));
    setGrandTotalProfit(totalProfit);
    setGrandTotalDoquantal(totalDoquantal);
  };

  const calculateRate = (taxableAmt, doquantal) =>
    doquantal ? (taxableAmt / doquantal).toFixed(2) : "0.00";


  const exportToExcel = () => {
    const ws = XLSX.utils.table_to_sheet(document.getElementById('printArea'));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ProfitLossReport");
    XLSX.writeFile(wb, "ProfitLossReport.xlsx");
  };

  const handlePrint = () => {
    const originalContent = document.body.innerHTML;
    const printArea = document.getElementById('printArea').innerHTML;
  
    document.body.innerHTML = printArea;
    window.print();
    document.body.innerHTML = originalContent;
  };

  const generatePdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(10); 

    const tableColumn = ["Tender No", "Date", "Mill Code", "Qntl", "Mill Rate", "Grade", "Mill Name", "Amount"];
    const tableRows = [];

    groupedData.forEach(group => {
        tableRows.push([
            group.tender,
            group.tenderDetails.Tender_Date,
            group.tenderDetails.Mill_Code,
            group.totalDoquantal.toFixed(2),
            group.tenderDetails.Mill_Rate,
            group.tenderDetails.Grade,
            group.tenderDetails.MillNameshort,
           group.totalProfit,
        ]);

        group.entries.forEach(entry => {
            tableRows.push([
                '', // Tender no repeated for clarity in grouping
                entry.doc_date,
                entry.billto, // Might be better as entry.Mill_Code if available
                entry.doquantal,
                '', // Mill rate not repeated
                '', // Grade not repeated
                entry.billtoname,
                parseFloat(entry.profit).toFixed(2),
            ]);
        });
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        theme: 'striped',
        headStyles: { fillColor: [22, 160, 133] }, // Styling for better readability
        didDrawPage: function (data) {
            if (data.cursor.y + 20 > doc.internal.pageSize.height) {
                doc.addPage();
            }
        },
        margin: { bottom: 30 }, // Ensure margins for summary
    });

    // Adding a summary at the bottom of the table
    doc.setFontSize(12); // Larger font size for summary
    doc.text(`Total Quantals: ${grandTotalDoquantal.toFixed(2)}`, 14, doc.internal.pageSize.height - 20);
    doc.text(`Total Profit: ${grandTotalProfit.toFixed(2)}`, 14, doc.internal.pageSize.height - 10);

    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    setPdfPreview(url);
};

const handleBack = () =>{
  navigate('/profit-loss')
}



  return (
    <div>
       <div className="mb-3 d-flex justify-content-start" style={{ marginTop: "2px" }}>
       {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={groupedData} label={"Partywise Balance Stock Report"} />}
       <button onClick={generatePdf} className="print-button">PDF Generation</button>
      <button onClick={exportToExcel} style={{ marginRight: "10px" }}>Export to Excel</button>
  <button onClick={handlePrint}>Print Report</button>
  <button onClick={handleBack}>Back</button>
  </div>

  <h1 style={{ marginBottom: "20px" }}>Profit & Loss Report</h1>
    
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div id="printArea">
      {!loading && groupedData.length === 0 && (
        <p>No data available for the selected criteria.</p>
      )}
      

      {groupedData.length > 0 && (
        <table style={{ width: "100%", borderSpacing: "0 10px", borderCollapse: "separate" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa" }}>
              <th style={{ padding: "10px" }}>Tender No</th>
              <th style={{ padding: "10px" }}>Date</th>
              <th style={{ padding: "10px" }}>Mill Code</th>
              <th style={{ padding: "10px" }}>Qntl</th>
              <th style={{ padding: "10px" }}>Mill Rate</th>
              <th style={{ padding: "10px" }}>Grade</th>
              <th style={{ padding: "10px" }}>Mill Name</th>
              <th style={{ padding: "10px", textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {groupedData.map((group, groupIndex) => (
              <React.Fragment key={groupIndex}>
                {/* Tender Header Row */}
                <tr style={{ backgroundColor: "#e9ecef", fontWeight: "bold" }}>
                  <td style={{ padding: "10px" }}>{group.tender}</td>
                  <td style={{ padding: "10px" }}>{group.tenderDetails.Tender_Date}</td>
                  <td style={{ padding: "10px" }}>{group.tenderDetails.Mill_Code}</td>
                  <td style={{ padding: "10px" }}>{group.tenderDetails.Quantal}</td>
                  <td style={{ padding: "10px" }}>{group.tenderDetails.Mill_Rate}</td>
                  <td style={{ padding: "10px" }}>{group.tenderDetails.Grade}</td>
                  <td style={{ padding: "10px" }}>{group.tenderDetails.MillNameshort}</td>
                  <td style={{ padding: "10px", textAlign: "right"  }}>{formatCurrency(group.totalProfit)}</td>
                </tr>
                {/* Doc-wise Details */}
                {group.entries.map((entry, entryIndex) => {
  const calculatedRate = entry.NETQNTL ? (entry.TaxableAmount / entry.NETQNTL).toFixed(2) : "0.00";

  return (
    <tr key={entryIndex} style={{ backgroundColor: "#fdfdfd" }}>
      <td colSpan="1" style={{ padding: "10px" }}></td> {/* Empty cell for alignment */}
      <td style={{ padding: "10px", textAlign: "right" }}>{entry.doc_no}</td>
      <td style={{ padding: "10px", textAlign: "center" }}>{entry.doc_date}</td>
      <td style={{ padding: "10px", textAlign: "left" }}>{entry.billto}</td>
      <td style={{ padding: "10px", textAlign: "right" }}>{entry.doquantal}</td>
      <td style={{ padding: "10px", textAlign: "right" }}>{calculatedRate}</td>
      <td style={{ padding: "10px", textAlign: "center" }}>{entry.billtoname}</td>
      <td style={{ padding: "10px", textAlign: "right" }}>{formatCurrency(entry.profit)}</td>
    </tr>
  );
})}


                {/* Tender Footer */}
                <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                  <td colSpan="3" style={{ textAlign: "right", padding: "10px" }}>
                    Total Qntl:
                  </td>
                  <td style={{ padding: "10px", textAlign: "left" }}>{group.totalDoquantal}</td>
                  <td style={{ textAlign: "right", padding: "10px" }}>Average Rate:</td>
                  <td style={{ padding: "10px" , textAlign: "right"}}>{calculateRate(group.totalTaxableAmt, group.totalDoquantal)}</td>
                  <td style={{ textAlign: "right", padding: "10px" }}>Total Profit:</td>
                  <td style={{ padding: "10px" , textAlign: "right"}}>{formatCurrency(group.totalProfit)}</td>
                </tr>
              </React.Fragment>
            ))}
            {/* Grand Total */}
            <tr style={{ backgroundColor: "#dff0d8", fontWeight: "bold" }}>
              <td colSpan="3" style={{ textAlign: "right", padding: "10px" }}>
                Grand Total Qntl:
              </td>
              <td style={{ padding: "10px" }}>{grandTotalDoquantal}</td>
              <td colSpan="2" style={{ textAlign: "right", padding: "10px" }}>
                Grand Total Profit:
              </td>
              <td colSpan="2" style={{ padding: "10px", textAlign: "left" }}>{formatCurrency(grandTotalProfit)}</td>
            </tr>
          </tbody>
        </table>
      )}
      </div>
    </div>
  );
};

export default ProfitNLossReport;
