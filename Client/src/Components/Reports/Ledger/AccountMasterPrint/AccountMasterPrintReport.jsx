import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import PdfPreview from "../../../../Common/PDFPreview";


const AccountMasterPrintReport = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
   const [pdfPreview, setPdfPreview] = useState(null);
  const { acType, groupCode, companyCode, stateWise, label } = location.state || {};

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError("");
  
      try {
        let params = { Company_Code: companyCode };
  
        if (stateWise) {
          params.Statewise = true;
        } else if (acType) {
          params.Ac_type = acType; // Ensure `acType` is passed correctly
        } else if (groupCode) {
          params.Group_Code = groupCode;
        }
  
        const response = await axios.get(
          `${process.env.REACT_APP_API}/accountmaster-print`,
          { params }
        );
  
        const data = response.data.data || [];
  
        // Reusable function to group data
        const groupData = (data, key) =>
          data.reduce((acc, item) => {
            const groupKey = item[key] || "Unknown";
            acc[groupKey] = acc[groupKey] || [];
            acc[groupKey].push(item);
            return acc;
          }, {});
  
        // Determine grouping based on the filter type
        if (stateWise) {
          setReportData(groupData(data, "State_Name"));
        } else if (acType) {
          setReportData(groupData(data.filter(item => item.Ac_type === acType), "Ac_type")); // Filter by `acType`
        } else if (groupCode) {
          setReportData(groupData(data.filter(item => item.Group_Code === groupCode), "group_Name_E")); // Group by group code
        } else {
          setReportData({ All: data }); // Default group if no filter
        }
      } catch (err) {
        console.error("Error fetching report data:", err);
        setError("Failed to fetch report data.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchReportData();
  }, [acType, groupCode, companyCode, stateWise]);
  
  

  const handleExportToExcel = () =>{
          const ws = XLSX.utils.table_to_sheet(document.getElementById('printArea'));
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "BankBookReport");
              XLSX.writeFile(wb, "BankBookReport.xlsx");
  
      }

      const handlePrint = () => {
        const printArea = document.getElementById('printArea').innerHTML;
        const printWindow = window.open('', '', 'height=660,width=1350');
        printWindow.document.write(`<html><head><title>Print</title></head><body>${printArea}</body></html>`);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const generatePDF = () => {
        const doc = new jsPDF('landscape');
    
        // Header Section
        doc.setFontSize(16);
        doc.text("Account Master List", 148.5, 20, "center"); // Centered for landscape orientation
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 148.5, 30, "center");
    
        // Extract data from HTML table
        const tableElement = document.querySelector("table"); // Target the first <table> in the page
        if (!tableElement) {
            console.error("Table not found!");
            doc.setFontSize(14);
            doc.text("No data available for the selected filters.", 148.5, 50, "center");
            doc.save("AccountMasterList.pdf");
            return;
        }
    
        // Extract table headers
        const headers = Array.from(tableElement.querySelectorAll("thead th")).map((th) =>
            th.innerText.trim()
        );
    
        // Extract table rows
        const rows = Array.from(tableElement.querySelectorAll("tbody tr")).map((tr) =>
            Array.from(tr.querySelectorAll("td")).map((td) => td.innerText.trim())
        );
    
        if (rows.length === 0) {
            console.error("No rows found in the table!");
            doc.setFontSize(14);
            doc.text("No data available for the selected filters.", 148.5, 50, "center");
        } else {
            // Add Table to PDF
            doc.autoTable({
                head: [headers], // Headers from table
                body: rows, // Rows from table
                startY: 40, // Start position for the table
                theme: "grid",
                styles: {
                    fontSize: 10,
                    overflow: "linebreak", // Wrap text if needed
                },
                headStyles: {
                    fillColor: [220, 220, 220],
                    textColor: [0, 0, 0],
                    fontStyle: "bold",
                },
                columnStyles: {
                    0: { cellWidth: 40 }, // Adjust column widths as necessary
                    1: { cellWidth: 50 },
                    2: { cellWidth: "auto" }, // Auto-width for longer columns
                    3: { cellWidth: 40 },
                    4: { cellWidth: 40 },
                },
            });
        }
    
        const pdfBlob = doc.output("blob");
        const pdfURL = URL.createObjectURL(pdfBlob);
    
        // Set the URL for preview
        setPdfPreview(pdfURL);
    };
    
  const tableHeaderStyle = {
    backgroundColor: "#f2f2f2",
    textAlign: "left",
    padding: "10px",
    fontWeight: "bold",
    borderBottom: "2px solid #ddd",
  };

  const tableRowStyle = {
    borderBottom: "1px solid #ddd",
  };

  const cellStyle = {
    padding: "8px",
    textAlign: "left",
  };

  const headerStyle = {
    textAlign: "center",
    marginBottom: "20px",
    fontSize: "24px",
    fontWeight: "bold",
  };

  const errorStyle = {
    color: "red",
    textAlign: "center",
    marginTop: "20px",
  };

  return (
    <div>
        <div className="d-flex mb-3 mt-1">
      {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={reportData} label={"Account Master List"} />}
      <button onClick={generatePDF} className="print-button">PDF Preview</button>
      <button onClick={handlePrint}>Print</button>
        <button className="btn btn-secondary" onClick={handleExportToExcel}>
          Export to Excel
        </button>
        <button
          onClick={() => navigate(-1)}
        >
          Back
        </button>
        </div>
    <div id="printArea" style={{ padding: "20px" }}>
      <h1 style={headerStyle}>Account Master Report</h1>
      {loading && <p style={{ textAlign: "center" }}>Loading...</p>}
      {error && <p style={errorStyle}>{error}</p>}
      {!loading && !error && Object.keys(reportData).length === 0 && (
        <p style={{ textAlign: "center" }}>No records found.</p>
      )}
      {!loading && !error && Object.keys(reportData).length > 0 && (
        Object.entries(reportData).map(([group, data]) => (
          <div key={group} style={{ marginBottom: "20px" }}>
            <h2 style={{ backgroundColor: "#e8e8e8", padding: "10px" }}>{group}</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Account Code</th>
                  <th style={tableHeaderStyle}>Account Name</th>
                  <th style={tableHeaderStyle}>Group Name</th>
                  <th style={tableHeaderStyle}>State</th>
                  <th style={tableHeaderStyle}>Type</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index} style={tableRowStyle}>
                    <td style={cellStyle}>{row.Ac_Code}</td>
                    <td style={cellStyle}>{row.Ac_Name_E}</td>
                    <td style={cellStyle}>{row.group_Name_E}</td>
                    <td style={cellStyle}>{row.State_Name}</td>
                    <td style={cellStyle}>{row.Ac_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
    </div>
  );
};

export default AccountMasterPrintReport;
