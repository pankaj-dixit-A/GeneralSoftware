import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../Reports/TrialBalance/TrialBalance.css";
import * as XLSX from "xlsx";
import "jspdf-autotable";
import { useNavigate, useLocation } from "react-router-dom";
import PdfPreview from "../../Outward/SaleBill/EWayBillReport/PdfPreview";
import { jsPDF } from "jspdf";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { CircularProgress } from '@mui/material';

const apikey = process.env.REACT_APP_API;

const BalancesheetReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // const { fromDate, toDate } = location.state || { fromDate: "", toDate: "" };
  const searchParams = new URLSearchParams(location.search);
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailId, setEmailId] = useState("");
  const [pdfPreview, setPdfPreview] = useState([]);
  const [groupedReportData, setGroupedReportData] = useState({});
  const [groupedReportDataRightside, setGroupedReportDataRightside] = useState(
    {}
  );

  const API_URL = `${apikey}/Balancesheet_Report`;

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(API_URL, {
          params: {
            to_date: toDate,
            Company_Code: companyCode,
            Year_Code: Year_Code,
          },
        });
        setReportData(response.data);
      } catch (error) {
        console.error("Error fetching report:", error);
        setError("Error fetching report");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [API_URL]);
  
  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new(); 
    const titleRow = ["JK Sugars And Commodities Pvt. Ltd. Balance Sheet Report"];
    const dateRow = [`As on ${toDate}`];
    const headers = [["Liabilities", "Amount", "", "Assets", "Amount"]];

    const ws_data = [titleRow, dateRow, [], ...headers];

    const leftEntries = Object.entries(groupedReportData);
    const rightEntries = Object.entries(groupedReportDataRightside);
    const maxLen = Math.max(leftEntries.length, rightEntries.length);

    for (let i = 0; i < maxLen; i++) {
        const leftGroup = leftEntries[i] ? leftEntries[i][1] : undefined;
        const rightGroup = rightEntries[i] ? rightEntries[i][1] : undefined;
        ws_data.push([
            leftGroup ? leftEntries[i][0] : "",  
            leftGroup ? Math.abs(parseFloat(leftGroup.totalBalance).toFixed(2)) : "", 
            "", 
            rightGroup ? rightEntries[i][0] : "", 
            rightGroup ? Math.abs(parseFloat(rightGroup.totalBalance).toFixed(2)) : "" 
        ]);

        const maxItems = Math.max(leftGroup ? leftGroup.items.length : 0, rightGroup ? rightGroup.items.length : 0);
        for (let j = 0; j < maxItems; j++) {
            const leftItem = leftGroup && leftGroup.items[j] ? leftGroup.items[j] : undefined;
            const rightItem = rightGroup && rightGroup.items[j] ? rightGroup.items[j] : undefined;
            ws_data.push([
                leftItem ? `${leftItem.Ac_Name_E} (${leftItem.Ac_Code})` : "",
                leftItem ? Math.abs(parseFloat(leftItem.Balance).toFixed(2)) : "",
                "",
                rightItem ? `${rightItem.Ac_Name_E} (${rightItem.Ac_Code})` : "",
                rightItem ? Math.abs(parseFloat(rightItem.Balance).toFixed(2)) : ""
            ]);
        }
    }

    ws_data.push([
      "","","","",""
    ])

    // Overall totals
    ws_data.push([
        "Total Liabilities",
        Math.abs(parseFloat(totalLeftSide).toFixed(2)),
        "",
        "Total Assets",
        Math.abs(parseFloat(totalRightSide).toFixed(2))
    ]);

    ws_data.push([
        "Net Profit",
        Math.abs(parseFloat(netProfit).toFixed(2)),
        "",
        "",
        ""
    ]);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [
        {wch: 30}, 
        {wch: 20}, 
        {wch: 5}, 
        {wch: 30}, 
        {wch: 20} 
    ];

    XLSX.utils.book_append_sheet(wb, ws, "BalanceSheet Reports");
    XLSX.writeFile(wb, "BalanceSheetReport.xlsx");
};


  const handlePrint = () => {
    const printContent = document.getElementById("reportTable").outerHTML;
    const win = window.open("", "", "height=700,width=900");
    win.document.write("<html><head><title>Print Report</title>");
    win.document.write("</head><body>");
    win.document.write(printContent);
    win.document.write("</body></html>");
    win.document.close();
    win.print();
  };


  const handleRowClick = (acCode, acname) => {
    setLoading(true);
    setTimeout(() => {
        const url = `/ledger-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&acCode=${encodeURIComponent(acCode)}&acname=${encodeURIComponent(acname)}`;
        window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
        setLoading(false);
    }, 500);
};

const handleGroupClick = (groupKey) => {
  if (!groupKey) return; 

  const parts = groupKey.split(" - ");
  const groupCode = parseInt(parts[0], 10);

  setLoading(true);

  setTimeout(() => {
      const url = `/TrialBalance-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&groupType=${encodeURIComponent(groupCode)}`;
      window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
      setLoading(false);
  }, 500);
};

  useEffect(() => {
    if (reportData.length > 0) {
      const { groupedDataleft, groupedReportDataRightside } =
        convertData(reportData);
      setGroupedReportData(groupedDataleft);
      setGroupedReportDataRightside(groupedReportDataRightside);
    }
  }, [reportData]);

  const convertData = (data) => {
    const groupedDataleft = {};
    const groupedReportDataRightside = {};

    let groupTotals = {};

    data.forEach((item) => {
      const balance = parseFloat(item.Balance) || 0;
      const groupKey = `${item.Group_Code} - ${item.groupname}`;

      if (!groupTotals[groupKey]) {
        groupTotals[groupKey] = 0;
      }
      groupTotals[groupKey] += balance;
    });

    data.forEach((item) => {
      const balance = parseFloat(item.Balance) || 0;
      const groupKey = `${item.Group_Code} - ${item.groupname}`;
      const totalBalance = groupTotals[groupKey];

      if (totalBalance === 0) return;

      let target =
        totalBalance < 0 ? groupedDataleft : groupedReportDataRightside;

      if (!target[groupKey]) {
        target[groupKey] = {
          groupname: item.groupname,
          items: [],
          totalBalance: totalBalance,
          showOnlyTotal: false,
        };
      }

      if (item.summary === "Y") {
        target[groupKey].showOnlyTotal = true;
      } else {
        target[groupKey].items.push({
          Ac_Code: item.AC_CODE,
          Ac_Name_E: item.Ac_Name_E,
          Balance: balance.toFixed(2),
        });
      }
    });

    return { groupedDataleft, groupedReportDataRightside };
  };

  const totalDebit = Object.values(groupedReportDataRightside)
  .reduce((acc, { totalBalance }) => acc + Math.abs(totalBalance), 0)
  .toFixed(2);

  const totalFromGroupedData = Object.values(groupedReportData)
  .reduce((acc, { totalBalance }) => acc + Math.abs(totalBalance), 0);

const totalFromRightsideData = Object.values(groupedReportDataRightside)
  .reduce((acc, { totalBalance }) => acc + Math.abs(totalBalance), 0);

const difference = totalFromRightsideData - totalFromGroupedData;

const totalCredit = totalFromGroupedData + Math.abs(difference);

const formattedTotalCredit = totalCredit.toFixed(2);


const totalCreditRightSide = Object.values(groupedReportDataRightside)
.reduce(
  (acc, { totalBalance }) => acc + Math.abs(totalBalance),
  0
)
.toFixed(2)

const netProfit = Math.abs(
  Object.values(groupedReportDataRightside).reduce(
    (acc, { totalBalance }) => acc + Math.abs(totalBalance),
    0
  ) -
    Object.values(groupedReportData).reduce(
      (acc, { totalBalance }) => acc + Math.abs(totalBalance),
      0
    )
).toFixed(2)

const totalRightSide = Object.values(groupedReportDataRightside)
.reduce(
  (acc, { totalBalance }) => acc + Math.abs(totalBalance),
  0
)
.toFixed(2)

const totalLeftSide = Object.values(groupedReportData)
.reduce(
  (acc, { totalBalance }) => acc + Math.abs(totalBalance),
  0
)
.toFixed(2)


  const handleBack = () => {
    navigate("/profit-loss-balance-sheet");
  };

  const generatePdf = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });
  
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(
      "JK Sugars And Commodities Pvt. Ltd.",
      doc.internal.pageSize.width / 2,
      40,
      { align: "center" }
    );
  
    doc.setFontSize(12);
    doc.text(
      `Balance Sheet Report (As on ${toDate})`,
      doc.internal.pageSize.width / 2,
      65,
      { align: "center" }
    );
  
    const prepareData = (data) => Object.entries(data).map(([key, { items, totalBalance, showOnlyTotal }]) => {
      const detailLines = items.map(
        (item) => `${item.Ac_Code} - ${item.Ac_Name_E}: ${formatReadableAmount(item.Balance)}`
      ).join("\n");
  
      return [
        { content: key, styles: { fontStyle: "bold", halign: "left" } },
        { content: showOnlyTotal ? formatReadableAmount(totalBalance.toFixed(2)) : detailLines, styles: { halign: "right", textColor: [150, 0, 0] } }
      ];
    });
  
    const leftData = prepareData(groupedReportData);
    const rightData = prepareData(groupedReportDataRightside);
  
    const headers = [
      [
        { content: "Liabilities", styles: { halign: "left", fillColor: [41, 128, 185], textColor: [255, 255, 255] }},
        { content: "Amount", styles: { halign: "right", fillColor: [41, 128, 185], textColor: [255, 255, 255] }},
        { content: "Assets", styles: { halign: "left", fillColor: [41, 128, 185], textColor: [255, 255, 255] }},
        { content: "Amount", styles: { halign: "right", fillColor: [41, 128, 185], textColor: [255, 255, 255] }},
      ],
    ];
  
    const maxLength = Math.max(leftData.length, rightData.length);
    const finalData = [];
  
    for (let i = 0; i < maxLength; i++) {
      finalData.push([
        leftData[i]?.[0] || { content: "", styles: { halign: "left" } },
        leftData[i]?.[1] || { content: "", styles: { halign: "right", textColor: [150, 0, 0] } },
        rightData[i]?.[0] || { content: "", styles: { halign: "left" } },
        rightData[i]?.[1] || { content: "", styles: { halign: "right", textColor: [150, 0, 0] } },
      ]);
    }
  
    doc.autoTable({
      head: headers,
      body: finalData,
      theme: "grid",
      startY: 80,
      styles: {
        fontSize: 10,
        cellPadding: 8,
        overflow: "linebreak",
        halign: "center",
        valign: "middle",
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { cellWidth: 100, halign: "left" },
        1: { cellWidth: 290, halign: "right", fontStyle: "bold" },
        2: { cellWidth: 100, halign: "left" },
        3: { cellWidth: 290, halign: "right", fontStyle: "bold" },
      },
    });
  
    // Totals and net profit formatting with alignment corrections
    doc.autoTable({
      body: [
        [
          "Total Liabilities",
          formatReadableAmount(totalLeftSide),
          "Total Assets",
          formatReadableAmount(totalRightSide)
        ],
        [
          "Net Profit:",
          formatReadableAmount(netProfit),
          "",
          ""
        ]
      ],
      startY: doc.autoTable.previous.finalY + 10,
      theme: 'plain',
      styles: {
        fontSize: 12,
        cellPadding: 8,
        halign: 'right',
        fontStyle: 'bold'
      },
      columnStyles: {
        1: { halign: 'right', fontStyle: 'bold', textColor: [150, 0, 0] },
        3: { halign: 'right', fontStyle: 'bold', textColor: [150, 0, 0] },
      }
    });
  
    // Generate and display PDF
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    setPdfPreview(url);
  };
  
  
  return (
    <div>
      <h4>JK Sugars And Commodities Pvt. Ltd.</h4>
      <div className="mb-3 row align-items-center">
        <div className="col-auto">
          <button className="btn btn-secondary me-2" onClick={handlePrint}>
            Print Report
          </button>
          <button className="btn btn-success" onClick={handleExportToExcel}>
            Export to Excel
          </button>
          {/* <button className="btn btn-warning ms-2" onClick={handleBack}>
            Back
          </button> */}
          <button onClick={generatePdf} className="btn btn-secondary">
            PDF
          </button>
        </div>

        <div className="col-auto mb-3">
          <input
            type="email"
            id="email"
            className="form-control"
            value={emailId}
            onChange={(e) => setEmailId(e.target.value)}
            placeholder="Enter email to send report"
            style={{ maxWidth: "500px", padding: "10px" }}
          />
        </div>

        {/* <div className="col-auto">
          <button onClick={generatePdf} className="btn btn-secondary">
            PDF
          </button>
        </div> */}
      </div>

      <div className="table-responsive">
        <table
          className="table table-striped table-bordered mt-4"
          id="reportTable"
          style={{ marginBottom: "50px" }}
        >
          <thead className="table-light">
            <tr>
              <th colSpan={2} style={{ textAlign: "left" }}>
                Liabilities
              </th>
              <th colSpan={2} style={{ textAlign: "right" }}>
                Amount
              </th>

              <th colSpan={2} style={{ textAlign: "left" }}>
                Assets
              </th>
              <th colSpan={2} style={{ textAlign: "right" }}>
                Amount
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td
                align="left"
                colSpan={4}
                style={{ verticalAlign: "top", width: "50%" }}
              >
                <table style={{ width: "100%" }}>
                  {Object.entries(groupedReportData).map(
                    ([key, { items, totalBalance, showOnlyTotal }]) => (
                      <React.Fragment key={key}>
                        <tr className="table-primary" onClick={() => handleGroupClick(key)}>
                          <td
                            colSpan={2}
                            style={{ color: "red", fontWeight: "bold" }}
                          >
                            {key}
                          </td>
                          <td
                            align="right"
                            style={{ color: "red", fontWeight: "bold" }}
                          >
                            {formatReadableAmount(Math.abs(totalBalance.toFixed(2)))}
                          </td>
                        </tr>
                        {!showOnlyTotal &&
                          items.map((item) => (
                            <tr
                              key={item.Ac_Code}
                            >
                              <td onClick={() =>
                                handleRowClick(item.Ac_Code, item.Ac_Name_E)
                              } style={{ cursor: "pointer" }}>{item.Ac_Code}</td>
                              <td>{item.Ac_Name_E}</td>
                              <td align="right" style={{
                    paddingRight: "130px",
                    paddingLeft: "20px",
                }}>
                                {formatReadableAmount(Math.abs(item.Balance).toFixed(2))}
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    )
                  )}
                </table>
              </td>

              <td
                align="center"
                colSpan={4}
                style={{ verticalAlign: "top", width: "50%" }}
              >
                <table style={{ width: "100%" }}>
                  {Object.entries(groupedReportDataRightside).map(
                    ([key, { items, totalBalance, showOnlyTotal }]) => (
                      <React.Fragment key={key}>
                        <tr className="table-primary" onClick={() => handleGroupClick(key)}>
                          <td
                            colSpan={2}
                            style={{ color: "red", fontWeight: "bold" }}
                          >
                            {key}
                          </td>
                          <td
                            align="right"
                            style={{ color: "red", fontWeight: "bold" }}
                          >
                            {formatReadableAmount(totalBalance.toFixed(2))}
                          </td>
                        </tr>
                        {!showOnlyTotal &&
                          items.map((item) => (
                            <tr
                              key={item.Ac_Code}
                            >
                              <td onClick={() =>
                                handleRowClick(item.Ac_Code, item.Ac_Name_E)
                              } style={{ cursor: "pointer" }}>{item.Ac_Code}</td>
                              <td>{item.Ac_Name_E}</td>
                              <td align="right"
                style={{
                    paddingRight: "130px",
                    paddingLeft: "20px",
                }}>
                                {formatReadableAmount(Math.abs(item.Balance).toFixed(2))}
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    )
                  )}
                </table>
              </td>
            </tr>
            <tr>
              <td
                colSpan={3}
                className="fw-bold text-end"
                style={{ color: "black" }}
              >
                Total:
              </td>
              <td align="right" className="fw-bold">
                {formatReadableAmount(totalLeftSide)}
              </td>

              <td
                colSpan={3}
                className="fw-bold text-end"
                style={{ color: "black" }}
              >
                Total:
              </td>
              <td align="right" className="fw-bold">
                {formatReadableAmount(totalRightSide)}
              </td>
            </tr>

            <tr>
              <td
                colSpan={3}
                className="fw-bold text-end"
                style={{ color: "black" }}
              >
                Net Profit:
              </td>
              <td align="right" className="fw-bold">
                {formatReadableAmount(netProfit)}
              </td>

              <td
                colSpan={3}
                className="fw-bold text-end"
                style={{ color: "black" }}
              >
                {/* Total Credit: */}
              </td>
              <td align="right" className="fw-bold">
                {/* {formatReadableAmount(totalCreditRightSide)} */}
              </td>
            </tr>

            <tr>
              <td
                colSpan={3}
                className="fw-bold text-end"
                style={{ color: "black" }}
              >
                Total Credit:
              </td>
              <td align="right" className="fw-bold">
                {formatReadableAmount(formattedTotalCredit)}
              </td>

              <td
                colSpan={3}
                className="fw-bold text-end"
                style={{ color: "black" }}
              >
                Total Debit:
              </td>
              <td align="right" className="fw-bold">
              {formatReadableAmount(totalDebit)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="centered-container">
          {pdfPreview && pdfPreview.length > 0 && (
            <PdfPreview
              pdfData={pdfPreview}
              apiData={reportData}
              label={"GLedger"}
            />
          )}
        </div>
      </div>
      {loading && <CircularProgress size={24} />}
      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  );
};

export default BalancesheetReport;
