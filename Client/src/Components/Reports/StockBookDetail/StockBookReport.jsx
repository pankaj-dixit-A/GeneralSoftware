import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import PdfPreview from "../../../Common/PDFPreview";

const API_URL = process.env.REACT_APP_API;


const StockBookReport = () => {
  const location = useLocation();
  const { fromDate, toDate } = location.state;
  const companyCode = sessionStorage.getItem("Company_Code");
const companyName = sessionStorage.getItem('Company_Name')

  const [groupedData, setGroupedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [pdfPreview,setPdfPreview] = useState([])
  const navigate = useNavigate () ;

  const groupBy = (array, key) => {
    const grouped = array.reduce((result, currentItem) => {
      const groupKey = currentItem[key];
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(currentItem);
      return result;
    }, {});
  
    // Sort the keys (group names) in ascending order
    const sortedKeys = Object.keys(grouped).sort((a, b) =>
      a.localeCompare(b)
    );
  
    // Rebuild the grouped object with sorted keys
    const sortedGrouped = {};
    sortedKeys.forEach((key) => {
      sortedGrouped[key] = grouped[key];
    });
  
    return sortedGrouped;
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;
  };

  useEffect(() => {
    const fetchStockBookReport = async () => {
      try {
        const response = await fetch(
          `${API_URL}/report-stock-book?doc_date=${toDate}&company_code=${companyCode}`
        );
        const result = await response.json();
        const filteredData = result.data.filter((item) => {
          const docDate = new Date(item.doc_date);
          const from = new Date(fromDate);
          const to = new Date(toDate);
          return docDate >= from && docDate <= to;
        });

        // Group data after filtering
        const grouped = groupBy(filteredData, "item_name");
        setGroupedData(grouped);
      } catch (error) {
        console.error("Error fetching stock book report:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockBookReport();
  }, [toDate]);

  const handleBack = () =>{
    navigate('/stock-report')
  }

  const generatePDF = () => {
    const doc = new jsPDF("landscape", "mm", "a4");
    const pageHeight = doc.internal.pageSize.height; 
    const margin = 10; 
  
    const title = "Stock Book Report";
  
    // Title and Date Range
    doc.setFontSize(14);
    doc.text(title, 10, 10);
    doc.setFontSize(10);
    doc.text(
      `From Date: ${formatDate(fromDate)} | To Date: ${formatDate(toDate)}`,
      10,
      20
    );
  
    let currentY = 30; 
  
    Object.keys(groupedData).forEach((group, groupIndex) => {
      if (currentY + 20 > pageHeight - margin) {
        doc.addPage();
        currentY = margin; 
      }
  
      doc.setFontSize(12);
      doc.setTextColor(40);
      doc.text(`Item Name: ${group.toUpperCase()}`, 10, currentY);
      currentY += 10;
  

      const tableData = groupedData[group].map((row) => [
        formatDate(row.doc_date),
        (parseFloat(row.op_qty) || 0).toFixed(2),
        (parseFloat(row.op_value) || 0).toFixed(2),
        (parseFloat(row.purc_qty) || 0).toFixed(2),
        (parseFloat(row.purc_value) || 0).toFixed(2),
        (parseFloat(row.sale_qty) || 0).toFixed(2),
        (parseFloat(row.sale_val) || 0).toFixed(2),
        (parseFloat(row.close_qty) || 0).toFixed(2),
        (parseFloat(row.close_val) || 0).toFixed(2),
      ]);
  
    
      const totalRow = [
        "Total",
        groupedData[group]
          .reduce((sum, item) => sum + (parseFloat(item.op_qty) || 0), 0)
          .toFixed(2),
        groupedData[group]
          .reduce((sum, item) => sum + (parseFloat(item.op_value) || 0), 0)
          .toFixed(2),
        groupedData[group]
          .reduce((sum, item) => sum + (parseFloat(item.purc_qty) || 0), 0)
          .toFixed(2),
        groupedData[group]
          .reduce((sum, item) => sum + (parseFloat(item.purc_value) || 0), 0)
          .toFixed(2),
        groupedData[group]
          .reduce((sum, item) => sum + (parseFloat(item.sale_qty) || 0), 0)
          .toFixed(2),
        groupedData[group]
          .reduce((sum, item) => sum + (parseFloat(item.sale_val) || 0), 0)
          .toFixed(2),
        groupedData[group]
          .reduce((sum, item) => sum + (parseFloat(item.close_qty) || 0), 0)
          .toFixed(2),
        groupedData[group]
          .reduce((sum, item) => sum + (parseFloat(item.close_val) || 0), 0)
          .toFixed(2),
      ];
  
    
      doc.autoTable({
        startY: currentY,
        head: [
          [
            "Date",
            "Opening Qty",
            "Opening Value",
            "Purchase Qty",
            "Purchase Value",
            "Sale Qty",
            "Sale Value",
            "Closing Qty",
            "Closing Value",
          ],
        ],
        body: [...tableData, totalRow], // Include total row
        styles: { fontSize: 8, cellPadding: 3, halign: "right" },
        headStyles: { fillColor: [240, 240, 240], textColor: 0 },
        columnStyles: { 0: { halign: "center" } }, // Center-align date column
        didDrawPage: (data) => {
          currentY = data.cursor.y; // Update the current Y position after the table
        },
      });
  
      // Adjust `currentY` for the next group
      currentY = doc.lastAutoTable.finalY + 10;
    });
  
    // Convert PDF to Blob and set to pdfPreview
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    setPdfPreview(pdfUrl);
  };
  
  
  
  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <div className="d-flex mb-3 mt-0.5">
      {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={groupedData} label={"Stock-Report"} />}
      <button onClick={generatePDF} className="print-button">PDF Preview</button>
        <button className="btn btn-secondary" onClick={handleBack}>
          Back
        </button>
      </div>
      <h2 style={{ textAlign: "center", marginBottom: "5px", color: "#333" , marginTop:"-60px"}}>
        {companyName}
      </h2>
      <p style={{ textAlign: "center", fontSize: "14px", marginBottom: "20px" }}>
        <strong>Stock Book Report From Date:</strong> {formatDate(fromDate)} |{" "}
        <strong>To Date:</strong> {formatDate(toDate)}
      </p>
      {Object.keys(groupedData).map((group, index) => (
        <div key={index} style={{ marginBottom: "30px" }}>
          <h3 style={{ backgroundColor: "#f4f4f4", padding: "10px", textAlign: "left" }}>
            {group.toUpperCase()}
          </h3>
          <table
            border="1"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr>
                <th rowSpan="2" style={{ textAlign: "center", padding: "10px" }}>
                  Date
                </th>
                <th colSpan="2" style={{ textAlign: "center", padding: "10px" }}>
                  Opening
                </th>
                <th colSpan="2" style={{ textAlign: "center", padding: "10px" }}>
                  Purchase
                </th>
                <th colSpan="2" style={{ textAlign: "center", padding: "10px" }}>
                  Sale
                </th>
                <th colSpan="2" style={{ textAlign: "center", padding: "10px" }}>
                  Closing
                </th>
              </tr>
              <tr>
                <th style={{ textAlign: "right", padding: "10px" }}>Qty</th>
                <th style={{ textAlign: "right", padding: "10px" }}>Value</th>
                <th style={{ textAlign: "right", padding: "10px" }}>Qty</th>
                <th style={{ textAlign: "right", padding: "10px" }}>Value</th>
                <th style={{ textAlign: "right", padding: "10px" }}>Qty</th>
                <th style={{ textAlign: "right", padding: "10px" }}>Value</th>
                <th style={{ textAlign: "right", padding: "10px" }}>Qty</th>
                <th style={{ textAlign: "right", padding: "10px" }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {groupedData[group].map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  style={{
                    backgroundColor: rowIndex % 2 === 0 ? "#f9f9f9" : "white",
                  }}
                >
                  <td style={{ textAlign: "center" }}>{formatDate(row.doc_date)}</td>
                  <td style={{ textAlign: "right" }}>
                    {(parseFloat(row.op_qty) || 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {(parseFloat(row.op_value) || 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {(parseFloat(row.purc_qty) || 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {(parseFloat(row.purc_value) || 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {(parseFloat(row.sale_qty) || 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {(parseFloat(row.sale_val) || 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {(parseFloat(row.close_qty) || 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {(parseFloat(row.close_val) || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot style={{ backgroundColor: "#e0e0e0", fontWeight: "bold" }}>
              <tr>
                <td style={{ textAlign: "center" }}>Total</td>
                <td style={{ textAlign: "right" }}>
                  {/* {groupedData[group]
                    .reduce((sum, item) => sum + (parseFloat(item.op_qty) || 0), 0)
                    .toFixed(2)} */}
                </td>
                <td style={{ textAlign: "right" }}>
                  {/* {groupedData[group]
                    .reduce((sum, item) => sum + (parseFloat(item.op_value) || 0), 0)
                    .toFixed(2)} */}
                </td>
                <td style={{ textAlign: "right" }}>
                  {groupedData[group]
                    .reduce((sum, item) => sum + (parseFloat(item.purc_qty) || 0), 0)
                    .toFixed(2)}
                </td>
                <td style={{ textAlign: "right" }}>
                  {groupedData[group]
                    .reduce((sum, item) => sum + (parseFloat(item.purc_value) || 0), 0)
                    .toFixed(2)}
                </td>
                <td style={{ textAlign: "right" }}>
                  {groupedData[group]
                    .reduce((sum, item) => sum + (parseFloat(item.sale_qty) || 0), 0)
                    .toFixed(2)}
                </td>
                <td style={{ textAlign: "right" }}>
                  {groupedData[group]
                    .reduce((sum, item) => sum + (parseFloat(item.sale_val) || 0), 0)
                    .toFixed(2)}
                </td>
                <td style={{ textAlign: "right" }}>
                  {/* {groupedData[group]
                    .reduce((sum, item) => sum + (parseFloat(item.close_qty) || 0), 0)
                    .toFixed(2)} */}
                </td>
                <td style={{ textAlign: "right" }}>
                  {/* {groupedData[group]
                    .reduce((sum, item) => sum + (parseFloat(item.close_val) || 0), 0)
                    .toFixed(2)} */}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ))}
    </div>
  );
};

export default StockBookReport;
