import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import * as XLSX from "xlsx";
import PdfPreview from '../../../../Common/PDFPreview'
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { RingLoader } from 'react-spinners';

const API_URL = process.env.REACT_APP_API;

const SelfStockReport = () => {
  //GET values from session Storage
  const companyName = sessionStorage.getItem("Company_Name");

  const [groupedData, setGroupedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [pdfPreview, setPdfPreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setCurrentDateTime(new Date().toLocaleString());
      const timer = setInterval(() => {
        setCurrentDateTime(new Date().toLocaleString());
      }, 1000);
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/self-stock-report`, {
          params: {
            Company_Code: sessionStorage.getItem("Company_Code"),
            Year_Code: sessionStorage.getItem("Year_Code"),
          },
        });
        groupByBuyerName(response.data);
      } catch (err) {
        setError("Failed to load data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateGrandTotals = () => {
    const totals = {
      totalQuintal: 0,
      totalDispatch: 0,
      totalBalance: 0,
    };

    groupedData.forEach(group => {
      group.details.forEach(record => {
        totals.totalQuintal += parseFloat(record.Buyer_Quantal || 0);
        totals.totalDispatch += parseFloat(record.DESPATCH || 0);
        totals.totalBalance += parseFloat(record.BALANCE || 0);
      });
    });

    return totals;
  };

  const groupByBuyerName = (data) => {
    const grouped = data.reduce((acc, curr) => {
      if (parseFloat(curr.BALANCE) !== 0) {
        if (!acc[curr.buyername]) {
          acc[curr.buyername] = { buyername: curr.buyername, details: [], totalBalance: 0 };
        }
        acc[curr.buyername].details.push(curr);
        acc[curr.buyername].totalBalance += parseFloat(curr.BALANCE);
      }
      return acc;
    }, {});
    setGroupedData(Object.values(grouped));
  };


  const handleExportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const sheetData = [["Buyer Name", "Tender No", "Mill Name", "Grade", "MR", "SR", "Qntl", "Desp", "Bal", "Lift", "DO"]];

    groupedData.forEach((group) => {
      sheetData.push([group.buyername, "", "", "", "", "", "", "", group.totalBalance]);
      group.details.forEach((record) => {
        sheetData.push([
          "",
          record.Tender_No,
          record.millshortname,
          record.Grade,
          record.Mill_Rate,
          record.Sale_Rate,
          record.Buyer_Quantal,
          record.DESPATCH,
          record.BALANCE,
          record.Lifting_Date,
          record.tenderdoshortname,
        ]);
      });
    });

    const sheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, sheet, "Self Stock Report");
    XLSX.writeFile(workbook, "SelfStockReport.xlsx");
  };

  const generatePDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    let yOffset = 8;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 255);
    doc.text(companyName, 80, yOffset);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    yOffset += 5;
    doc.text("Self Stock Report", 92, yOffset);
    yOffset += 5;
    doc.text(`Generated on: ${currentDateTime}`, 75, yOffset);
    yOffset += 5;

    groupedData.forEach((group) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Buyer: ${group.buyername} (Total Balance: ${group.totalBalance.toFixed(2)})`, 10, yOffset);
      yOffset += 5;

      const tableBody = group.details.map((record) => [
        record.Tender_No,
        record.millshortname,
        record.Grade,
        record.Mill_Rate,
        record.Sale_Rate,
        record.Buyer_Quantal,
        record.DESPATCH,
        record.BALANCE,
        record.Tender_Date,
        record.tenderdoshortname,
      ]);

      doc.autoTable({
        startY: yOffset,
        head: [
          ["Tender No", "Mill Name", "Grade", "MR", "SR", "Qntl", "Desp", "Bal", "Lift", "DO"],
        ],
        body: tableBody,
        theme: "grid",
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
        bodyStyles: { textColor: [0, 0, 0] },
        footStyles: { textColor: [0, 0, 0] },
        margin: { top: 10 },
        didDrawPage: (data) => {
          yOffset = data.cursor.y + 10;
        },
      });
    });

    const totals = calculateGrandTotals();
    doc.setFontSize(10);
    doc.text(`Grand Totals: Qntl = ${totals.totalQuintal.toFixed(2)}, Desp = ${totals.totalDispatch.toFixed(2)}, Bal = ${totals.totalBalance.toFixed(2)}`, 10, yOffset);
    const pdfBlob = doc.output("blob");
    setPdfPreview(URL.createObjectURL(pdfBlob));
  };

  const handleBack = () => {
    navigate('/balance-stock')
  }

  return (
    <div>
      <h4 style={{ color: "blue" }}>{companyName}</h4>
      <h5>Self Stock Report</h5>

      <div className="d-flex mb-3">
        {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={groupedData} label={"Self Stock Report"} />}
        <button onClick={generatePDF} className="print-button">Print</button>
        <button className="btn btn-secondary" onClick={handleExportToExcel}>
          Export to Excel
        </button>
        <button className="btn btn-secondary" onClick={handleBack}>
          Back
        </button>
      </div>
      <div className='d-flex justify-content-start'>Balance Stock As On {currentDateTime}</div>

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
      {error && <p className="text-danger">{error}</p>}

      <div id="reportContent">
        <table className="table" style={{ borderCollapse: "collapse", width: "100%",marginBottom:"50px" }}>
          <thead>
            <tr style={{ backgroundColor: "black", color: "white", textAlign: "center" }}>
              <th style={{ border: "1px solid black" }}>Tender No</th>
              <th style={{ border: "1px solid black" }}>Mill Name</th>
              <th style={{ border: "1px solid black" }}>Grade</th>
              <th style={{ border: "1px solid black" }}>MR</th>
              <th style={{ border: "1px solid black" }}>SR</th>
              <th style={{ border: "1px solid black" }}>Qntl</th>
              <th style={{ border: "1px solid black" }}>Desp</th>
              <th style={{ border: "1px solid black" }}>Bal</th>
              <th style={{ border: "1px solid black" }}>Lift</th>
              <th style={{ border: "1px solid black" }}>DO</th>
            </tr>
          </thead>
          <tbody>
            {groupedData.map((group, groupIndex) => (
              <React.Fragment key={groupIndex}>
                <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
                  <td colSpan="10" style={{ textAlign: "left" }}>
                    {group.buyername} (Total Balance: {group.totalBalance.toFixed(2)})
                  </td>
                </tr>
                {group.details.map((record, recordIndex) => (
                  <tr key={recordIndex} style={{ textAlign: "center" }}>
                    <td style={{ border: "1px dashed black" }}>{record.Tender_No}</td>
                    <td style={{ border: "1px dashed black" }}>{record.millshortname}</td>
                    <td style={{ border: "1px dashed black" }}>{record.Grade}</td>
                    <td style={{ border: "1px dashed black" }}>{record.Mill_Rate}</td>
                    <td style={{ border: "1px dashed black" }}>{record.Sale_Rate}</td>
                    <td style={{ border: "1px dashed black" }}>{record.Buyer_Quantal}</td>
                    <td style={{ border: "1px dashed black" }}>{record.DESPATCH}</td>
                    <td style={{ border: "1px dashed black" }}>{record.BALANCE}</td>
                    <td style={{ border: "1px dashed black" }}>{record.Tender_Date}</td>
                    <td style={{ border: "1px dashed black" }}>{record.tenderdoshortname}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
              <td colSpan="5" style={{ textAlign: "center" }}>Grand Totals</td>
              <td style={{ border: "1px dashed black" }}>{calculateGrandTotals().totalQuintal.toFixed(2)}</td>
              <td style={{ border: "1px dashed black" }}>{calculateGrandTotals().totalDispatch.toFixed(2)}</td>
              <td style={{ border: "1px dashed black" }}>{calculateGrandTotals().totalBalance.toFixed(2)}</td>
              <td colSpan="2" style={{ border: "1px dashed black" }}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SelfStockReport;
