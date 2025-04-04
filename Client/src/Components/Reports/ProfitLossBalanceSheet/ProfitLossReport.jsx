import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../Reports/TrialBalance/TrialBalance.css";
import * as XLSX from "xlsx";
import "jspdf-autotable";
import { useNavigate, useLocation } from "react-router-dom";
import PdfPreview from "../../Outward/SaleBill/EWayBillReport/PdfPreview";
import { jsPDF } from "jspdf";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

const apikey = process.env.REACT_APP_API_URL;

const ProfitLossReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // const { fromDate, toDate } = location.state || { fromDate: '', toDate: ''  };
  const searchParams = new URLSearchParams(location.search);
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");

  console.log("fromDate", fromDate, toDate);

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailId, setEmailId] = useState("");
  const [pdfPreview, setPdfPreview] = useState([]);

  const API_URL = `${apikey}/api/sugarian/ProfitLoss_Report`;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(API_URL, {
          params: {
            from_date: fromDate,
            to_date: toDate,
            Company_Code: companyCode,
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
    const tableElement = document.getElementById("reportTable");
    if (tableElement) {
      const wb = XLSX.utils.table_to_book(tableElement, { sheet: "Report" });
      const ws = wb.Sheets[wb.SheetNames[0]];

      ws['!cols'] = [
        { wpx: 200 },
        { wpx: 300 },
        { wpx: 100 },
        { wpx: 200 },
        { wpx: 300 },
        { wpx: 100 },
      ];

      XLSX.utils.sheet_add_aoa(ws, [
        [`JK Sugars And Commodities Pvt. Ltd. - Profit & Loss Report`],
        [`Report Period: ${formatDate(fromDate)} to ${formatDate(toDate)}`]
      ], { origin: "A1" });

      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }
      ];

      const titleCell = 'A1';
      const periodCell = 'A2';
      ws[titleCell].s = {
        font: { name: 'Arial', sz: 14, bold: true },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "CCCCCC" } }
      };
      ws[periodCell].s = {
        font: { name: 'Arial', sz: 12, bold: false },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "EEEEEE" } }
      };

      XLSX.utils.sheet_add_aoa(ws, [[""]], { origin: -1 });

      XLSX.writeFile(wb, "ProfitLossReport.xlsx");
    } else {
      console.error("Table element not found");
    }
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
      const url = `/ledger-report?fromDate=${encodeURIComponent(
        fromDate
      )}&toDate=${encodeURIComponent(toDate)}&acCode=${encodeURIComponent(
        acCode
      )}&acname=${encodeURIComponent(acname)}`;
      window.open(
        url,
        "_blank",
        "toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600"
      );
      setLoading(false);
    }, 500);
  };

  const groupReportData = (data) => {
    const groupedData = {};
    const filteredData = data.filter(
      (item) => item.group_Type === "T" && item.Balance > 0
    );
    filteredData.forEach((item) => {
      const key = `${item.group_Type} -${item.BSGroupName}`;
      if (!groupedData[key]) {
        groupedData[key] = {
          items: [],
          totalQty: 0,
          groupnetvalue: 0,
        };
      }
      groupedData[key].items.push(item);
      groupedData[key].groupnetvalue +=
        parseFloat(item.Balance > 0 ? item.Balance : 0) || 0;
    });
    return groupedData;
  };

  const groupReportDataTradingrigthside = (data) => {
    const groupedData = {};
    const filteredData = data.filter(
      (item) => item.group_Type === "T" && item.Balance < 0
    );
    filteredData.forEach((item) => {
      const key = `${item.group_Type} -${item.BSGroupName}`;
      if (!groupedData[key]) {
        groupedData[key] = {
          items: [],
          totalQty: 0,
          netgroupvalue: 0,
        };
      }
      groupedData[key].items.push(item);
      groupedData[key].netgroupvalue +=
        parseFloat(item.Balance < 0 ? item.Balance : 0) || 0;
    });
    return groupedData;
  };

  const groupReportDataProfitleftside = (data) => {
    const groupedData = {};
    const filteredData = data.filter(
      (item) => item.group_Type === "P" && item.Balance > 0
    );
    filteredData.forEach((item) => {
      const key = `${item.group_Type} -${item.BSGroupName}`;
      if (!groupedData[key]) {
        groupedData[key] = {
          items: [],
          totalQty: 0,
          groupnetvalue: 0,
        };
      }
      groupedData[key].items.push(item);
      groupedData[key].groupnetvalue +=
        parseFloat(item.Balance > 0 ? item.Balance : 0) || 0;
    });
    return groupedData;
  };

  const groupReportDataProfitrigthside = (data) => {
    const groupedData = {};
    const filteredData = data.filter(
      (item) => item.group_Type === "P" && item.Balance < 0
    );
    filteredData.forEach((item) => {
      const key = `${item.group_Type} -${item.BSGroupName}`;
      if (!groupedData[key]) {
        groupedData[key] = {
          items: [],
          totalQty: 0,
          netgroupvalue: 0,
        };
      }
      groupedData[key].items.push(item);
      groupedData[key].netgroupvalue +=
        parseFloat(item.Balance < 0 ? item.Balance : 0) || 0;

    });
    return groupedData;
  };

  const groupedReportData = groupReportData(reportData);
  const groupedReportDataRightside =
    groupReportDataTradingrigthside(reportData);

  const groupReportDataProfitleftsideDebit =
    groupReportDataProfitleftside(reportData);
  const groupReportDataProfitrigthsidetsideCredit =
    groupReportDataProfitrigthside(reportData);

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
    doc.text(
      "JK Sugars And Commodities Pvt. Ltd.",
      doc.internal.pageSize.width / 2,
      30,
      null,
      null,
      "center"
    );

    doc.setFontSize(12);
    doc.text(
      `Profit & Loss Report (As on ${toDate})`,
      doc.internal.pageSize.width / 2,
      50,
      null,
      null,
      "center"
    );

    const reportTable = document.getElementById("reportTable");
    if (!reportTable) {
      console.error("Table element not found!");
      return;
    }

    doc.autoTable({
      html: "#reportTable",
      startY: 70,
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 2,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [0, 100, 200],
        textColor: [255, 255, 255],
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 'auto', halign: 'left' },
        1: { cellWidth: 'auto', halign: 'right' }
      },
      didDrawCell: data => {
      },
      willDrawCell: data => {
      },
    });

    let finalY = doc.lastAutoTable.finalY + 20;
    const pdfBlob = doc.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    setPdfPreview(url);
  };



  function calculateNetResult(
    profitRightSideCreditData,
    profitLeftSideDebitData,
    groupedReportData,
    groupedReportDataRightside,
    threshold = 0
  ) {

    const profitRightSideCreditTotal = Object.values(
      profitRightSideCreditData
    ).reduce((acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue), 0);

    const leftTotal = Object.values(groupedReportData).reduce(
      (acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue),
      0
    );

    const rightTotal = Object.values(groupedReportDataRightside).reduce(
      (acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue),
      0
    );

    const diffRightMinusLeft = rightTotal - leftTotal;

    const resultRight =
      profitRightSideCreditTotal +
      (diffRightMinusLeft > 0 ? diffRightMinusLeft : 0);
    const profitLeftSideDebitTotal = Object.values(
      profitLeftSideDebitData
    ).reduce((acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue), 0);

    const diffLeftMinusRight = leftTotal - rightTotal;
    const resultLeft =
      profitLeftSideDebitTotal +
      (diffLeftMinusRight > 0 ? diffLeftMinusRight : 0);

    const netResult = resultRight - resultLeft;
    return {
      netResult: netResult.toFixed(2),
      isGreaterThanThreshold: netResult > threshold,
    };
  }

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

        {loading && <p>Loading report data...</p>}
        {error && <div className="alert alert-danger">{error}</div>}

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
      </div>

      <div className="table-responsive">
        <table
          className="table table-striped table-bordered mt-4"
          id="reportTable"
          style={{
            width: "100%",
            tableLayout: "fixed",
            marginLeft: "auto",
            marginRight: "auto",
            borderCollapse: "collapse",
          }}
        >
          <thead className="table-light">
            <tr>
              <th colSpan={2} style={{ textAlign: "left" }}>
                Purchase
              </th>
              <th colSpan={2} style={{ textAlign: "right" }}>
                Amount
              </th>

              <th colSpan={2} style={{ textAlign: "left" }}>
                Sale
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
                  <tr >
                    <td>
                      {Object.entries(groupedReportData).map(
                        ([key, { items, groupnetvalue }]) => {
                          const [millname, BSGroupName] = key.split("-");
                          const filteredItems = items.filter(
                            (item) => item.Balance > 0
                          );
                          const totalGroupBalance = filteredItems
                            .reduce(
                              (sum, item) => sum + Math.abs(item.Balance),
                              0
                            )
                            .toFixed(2);
                          return (
                            <React.Fragment key={key}>
                              <tr className="table-primary">
                                <td align="left" style={{ color: "red", fontWeight: "bold", textAlign: "left" }}>
                                  {millname} - {BSGroupName}
                                </td>
                                <td align="right" style={{ color: "red", fontWeight: "bold", textAlign: "right", paddingLeft: "445px", }}>
                                  {formatReadableAmount(totalGroupBalance)}
                                </td>
                              </tr>
                              {filteredItems.map((item, index) => (
                                <tr key={index} onClick={() => handleRowClick(item.AC_CODE, item.Ac_Name_E)}>
                                  <td style={{ textAlign: "left", paddingLeft: "5px", color: "black", fontWeight: "normal", whiteSpace: "nowrap" }}>
                                    {item.Balance > 0 ? item.Ac_Name_E : ""}
                                  </td>
                                  <td align="right" style={{
                                    paddingRight: "150px",
                                    textAlign: "right",
                                    color: "black",
                                    fontWeight: "normal"
                                  }}>
                                    {item.Balance > 0 ? formatReadableAmount(Math.abs(item.Balance)) : ""}
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        }
                      )}
                    </td>
                  </tr>
                </table>
              </td>
              <td align="center" colSpan={4}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td>
                      {Object.entries(groupedReportDataRightside).map(
                        ([key, { items, netgroupvalue }]) => {
                          const [millname, BSGroupName] = key.split("-");
                          const filteredItems = items.filter(
                            (item) => item.Balance < 0
                          );
                          const totalGroupBalance = filteredItems
                            .reduce(
                              (sum, item) => sum + Math.abs(item.Balance),
                              0
                            )
                            .toFixed(2);
                          return (
                            <React.Fragment key={key}>
                              {/* Group Header */}
                              <tr className="table-primary">
                                <td align="left" style={{ color: "red", fontWeight: "bold", textAlign: "left" }}>
                                  {millname} - {BSGroupName}
                                </td>
                                <td align="right" style={{ color: "red", fontWeight: "bold", textAlign: "right", paddingLeft: "475px", }}>
                                  {formatReadableAmount(totalGroupBalance)}
                                </td>
                              </tr>

                              {filteredItems.map((item, index) => (
                                <tr
                                  key={index}
                                  onClick={() => handleRowClick(item.AC_CODE, item.Ac_Name_E)}
                                >
                                  <td style={{ whiteSpace: "nowrap" }}>
                                    {item.Balance < 0 ? item.Ac_Name_E : ""}
                                  </td>

                                  <td align="right" style={{
                                    paddingRight: "150px", 
                                    textAlign: "right",
                                    color: "black",
                                    fontWeight: "normal"
                                  }}>
                                    {item.Balance < 0
                                      ? formatReadableAmount(Math.abs(item.Balance))
                                      : ""}
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        }
                      )}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="left" colSpan={4}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="left"
                    >
                      Net Purchase
                    </td>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="right"
                    >
                      {formatReadableAmount(Object.values(groupedReportData)
                        .reduce(
                          (acc, { groupnetvalue }) =>
                            acc + Math.abs(groupnetvalue),
                          0
                        ))
                      }
                    </td>
                  </tr>
                </table>
              </td>
              <td align="left" colSpan={4}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="left"
                    >
                      Net Sale
                    </td>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="right"
                    >
                      {formatReadableAmount(Object.values(groupedReportDataRightside)
                        .reduce(
                          (acc, { netgroupvalue }) =>
                            acc + Math.abs(netgroupvalue),
                          0
                        ))
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="left" colSpan={4}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="left"
                    >
                      Gross Profit
                    </td>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="right"
                    >
                      {(() => {
                        const totalRightSide = Object.values(groupedReportDataRightside).reduce(
                          (acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue),
                          0
                        );
                        const totalLeftSide = Object.values(groupedReportData).reduce(
                          (acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue),
                          0
                        );
                        const difference = totalRightSide - totalLeftSide;

                        return formatReadableAmount(
                          difference > 0 ? difference.toFixed(2) : "0.00"
                        );
                      })()}

                    </td>
                  </tr>
                </table>
              </td>
              <td align="left" colSpan={4}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="left"
                    >
                      Gross Loss
                    </td>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="right"
                    >
                      {(() => {
                        const totalLeftSide = Object.values(groupedReportData).reduce(
                          (acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue),
                          0
                        );
                        const totalRightSide = Object.values(groupedReportDataRightside).reduce(
                          (acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue),
                          0
                        );
                        const difference = totalLeftSide - totalRightSide;

                        return formatReadableAmount(
                          difference > 0 ? difference.toFixed(2) : "0.00"
                        );
                      })()}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="left" colSpan={4}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="left"
                    >
                      Total
                    </td>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="right"
                    >
                      {(() => {
                        // Calculate the left side total
                        const leftTotal = Object.values(
                          groupedReportData
                        ).reduce(
                          (acc, { groupnetvalue }) =>
                            acc + Math.abs(groupnetvalue),
                          0
                        );

                        // Calculate the right side total
                        const rightTotal = Object.values(
                          groupedReportDataRightside
                        ).reduce(
                          (acc, { netgroupvalue }) =>
                            acc + Math.abs(netgroupvalue),
                          0
                        );

                        // Calculate the difference
                        const diff = rightTotal - leftTotal;

                        // Final result: leftTotal + (positive difference or 0)
                        const result = leftTotal + (diff > 0 ? diff : 0);

                        // Return the formatted result
                        return formatReadableAmount(result);
                      })()}
                    </td>
                  </tr>
                </table>
              </td>
              <td align="left" colSpan={4}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="left"
                    >
                      Total
                    </td>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="right"
                    >
                      {(() => {

                        const rightTotal = Object.values(
                          groupedReportDataRightside
                        ).reduce(
                          (acc, { netgroupvalue }) =>
                            acc + Math.abs(netgroupvalue),
                          0
                        );

                        const leftTotal = Object.values(
                          groupedReportData
                        ).reduce(
                          (acc, { groupnetvalue }) =>
                            acc + Math.abs(groupnetvalue),
                          0
                        );

                        const diff = leftTotal - rightTotal;
                        const result = diff > 0 ? diff : 0;
                        return (formatReadableAmount(rightTotal + result));
                      })()}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="left" colSpan={4}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ width: "70%" }}
                      align="left"
                    >
                      Gross Loss
                    </td>
                    <td
                      className="fw-bold"
                      style={{ width: "70%" }}
                      align="right"
                    >
                      {(() => {
                        const totalLeftSide = Object.values(groupedReportData).reduce(
                          (acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue),
                          0
                        );
                        const totalRightSide = Object.values(groupedReportDataRightside).reduce(
                          (acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue),
                          0
                        );
                        const difference = totalLeftSide - totalRightSide;

                        return formatReadableAmount(
                          difference > 0 ? difference.toFixed(2) : "0.00"
                        );
                      })()}

                    </td>
                  </tr>
                </table>
              </td>
              <td align="left" colSpan={4}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ width: "70%" }}
                      align="left"
                    >
                      Gross Profit
                    </td>
                    <td
                      className="fw-bold"
                      style={{ width: "70%" }}
                      align="right"
                    >
                      {(() => {
                        const totalRightSide = Object.values(groupedReportDataRightside).reduce(
                          (acc, { netgroupvalue }) => acc + Math.abs(netgroupvalue),
                          0
                        );
                        const totalLeftSide = Object.values(groupedReportData).reduce(
                          (acc, { groupnetvalue }) => acc + Math.abs(groupnetvalue),
                          0
                        );
                        const difference = totalRightSide - totalLeftSide;

                        return formatReadableAmount(
                          difference > 0 ? difference.toFixed(2) : "0.00"
                        );
                      })()}

                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="left" colSpan={4}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td>
                      {Object.entries(groupReportDataProfitleftsideDebit).map(
                        ([key, { items, groupnetvalue }]) => {
                          const [millname, BSGroupName] = key.split("-");
                          const filteredItems = items.filter(
                            (item) => item.Balance > 0
                          );
                          const totalGroupBalance = filteredItems
                            .reduce(
                              (sum, item) => sum + Math.abs(item.Balance),
                              0
                            )
                            .toFixed(2);
                          return (
                            <React.Fragment key={key}>
                              {/* Group Header */}
                              <tr>
                                <td
                                  className="table-primary header-row"
                                  style={{
                                    width: "30%",
                                    align: "left",
                                    color: "red",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {millname} - {BSGroupName}
                                </td>
                                <td align="right" style={{ color: "red", fontWeight: "bold", textAlign: "right", paddingLeft: "482px", }}>
                                  {formatReadableAmount(totalGroupBalance)}
                                </td>
                              </tr>

                              {/* Item Rows */}
                              {filteredItems.map((item, index) => (
                                <tr
                                  key={index}
                                  onClick={() => handleRowClick(item.AC_CODE, item.Ac_Name_E)}
                                >
                                  {/* <td>{item.Balance > 0 ? item.AC_CODE : ''}</td> */}
                                  <td>
                                    {item.Balance > 0 ? item.Ac_Name_E : ""}
                                  </td>

                                  <td align="right" style={{
                                    paddingRight: "150px", 
                                    textAlign: "right",
                                    color: "black",
                                    fontWeight: "normal"
                                  }}>
                                    {item.Balance > 0
                                      ? formatReadableAmount(Math.abs(item.Balance))
                                      : ""}
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        }
                      )}
                    </td>
                  </tr>
                </table>
              </td>
              <td align="center" colSpan={4}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td>
                      {Object.entries(
                        groupReportDataProfitrigthsidetsideCredit
                      ).map(([key, { items, netgroupvalue }]) => {
                        const [millname, BSGroupName] = key.split("-");
                        const filteredItems = items.filter(
                          (item) => item.Balance < 0
                        );
                        const totalGroupBalance = filteredItems
                          .reduce(
                            (sum, item) => sum + Math.abs(item.Balance),
                            0
                          )
                          .toFixed(2);
                        return (
                          <React.Fragment key={key}>
                            <tr>
                              <td align="left" style={{ color: "red", fontWeight: "bold", textAlign: "left" }}>

                                {millname} - {BSGroupName}
                              </td>
                              <td align="right" style={{ color: "red", fontWeight: "bold", textAlign: "right", paddingLeft: "482px", }}>

                                {formatReadableAmount(totalGroupBalance)}
                              </td>
                            </tr>

                            {filteredItems.map((item, index) => (
                              <tr
                                key={index}
                                onClick={() => handleRowClick(item.AC_CODE, item.Ac_Name_E)}
                              >
                                {/* <td style={}>{item.Balance < 0 ? item.AC_CODE : ''}</td> */}
                                <td>
                                  {item.Balance < 0 ? item.Ac_Name_E : ""}
                                </td>

                                <td align="right" style={{
                                  paddingRight: "150px", 
                                  textAlign: "right",
                                  color: "black",
                                  fontWeight: "normal"
                                }}>
                                  {item.Balance < 0
                                    ? formatReadableAmount(Math.abs(item.Balance))
                                    : ""}
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="left" colSpan={4}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="left"
                    >
                      Total :
                    </td>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="right"
                    >
                      {(() => {
                        const profitLeftSideDebitTotal = Object.values(
                          groupReportDataProfitleftsideDebit
                        ).reduce(
                          (acc, { groupnetvalue }) =>
                            acc + Math.abs(groupnetvalue),
                          0
                        );

                        const leftTotal = Object.values(
                          groupedReportData
                        ).reduce(
                          (acc, { groupnetvalue }) =>
                            acc + Math.abs(groupnetvalue),
                          0
                        );

                        const rightTotal = Object.values(
                          groupedReportDataRightside
                        ).reduce(
                          (acc, { netgroupvalue }) =>
                            acc + Math.abs(netgroupvalue),
                          0
                        );

                        const diff = leftTotal - rightTotal;

                        const result =
                          profitLeftSideDebitTotal + (diff > 0 ? diff : 0);
                        return formatReadableAmount(result);
                      })()}
                    </td>
                  </tr>
                </table>
              </td>
              <td align="left" colSpan={4}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="left"
                    >
                      Total :
                    </td>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="right"
                    >
                      {(() => {
                        const profitRightSideCreditTotal = Object.values(
                          groupReportDataProfitrigthsidetsideCredit
                        ).reduce(
                          (acc, { netgroupvalue }) =>
                            acc + Math.abs(netgroupvalue),
                          0
                        );

                        const leftTotal = Object.values(
                          groupedReportData
                        ).reduce(
                          (acc, { groupnetvalue }) =>
                            acc + Math.abs(groupnetvalue),
                          0
                        );

                        const rightTotal = Object.values(
                          groupedReportDataRightside
                        ).reduce(
                          (acc, { netgroupvalue }) =>
                            acc + Math.abs(netgroupvalue),
                          0
                        );

                        const diff = rightTotal - leftTotal;
                        const result =
                          profitRightSideCreditTotal + (diff > 0 ? diff : 0);

                        return formatReadableAmount(result);
                      })()}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="left" colSpan={4}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="left"
                    >
                      Net Profit
                    </td>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="right"
                    >
                      {(() => {
                        const { netResult, isGreaterThanThreshold } =
                          calculateNetResult(
                            groupReportDataProfitrigthsidetsideCredit,
                            groupReportDataProfitleftsideDebit,
                            groupedReportData,
                            groupedReportDataRightside,
                            0
                          );

                        return isGreaterThanThreshold ? ` ${formatReadableAmount(netResult)}` : "";
                      })()}
                    </td>
                  </tr>
                </table>
              </td>
              <td align="left" colSpan={4}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="left"
                    >
                      Net Loss
                    </td>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="right"
                    >
                      {(() => {
                        const { netResult, isGreaterThanThreshold } =
                          calculateNetResult(
                            groupReportDataProfitrigthsidetsideCredit,
                            groupReportDataProfitleftsideDebit,
                            groupedReportData,
                            groupedReportDataRightside,
                            0 // Threshold is set to 0 to check positive or negative
                          );

                        return !isGreaterThanThreshold
                          ? ` ${formatReadableAmount(Math.abs(netResult))}`
                          : "";
                      })()}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="left" colSpan={4}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="left"
                    >
                      Total Credit:
                    </td>

                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="right"
                    >
                      {(() => {
                        // First calculation for groupReportDataProfitrigthsidetsideCredit and totals
                        const profitRightSideCreditTotal = Object.values(
                          groupReportDataProfitrigthsidetsideCredit
                        ).reduce(
                          (acc, { netgroupvalue }) =>
                            acc + Math.abs(netgroupvalue),
                          0
                        );

                        const leftTotal = Object.values(
                          groupedReportData
                        ).reduce(
                          (acc, { groupnetvalue }) =>
                            acc + Math.abs(groupnetvalue),
                          0
                        );

                        const rightTotal = Object.values(
                          groupedReportDataRightside
                        ).reduce(
                          (acc, { netgroupvalue }) =>
                            acc + Math.abs(netgroupvalue),
                          0
                        );

                        const diff = rightTotal - leftTotal;

                        const result =
                          profitRightSideCreditTotal + (diff > 0 ? diff : 0);

                        // Second calculation for netResult and threshold check
                        const { netResult, isGreaterThanThreshold } =
                          calculateNetResult(
                            groupReportDataProfitrigthsidetsideCredit,
                            groupReportDataProfitleftsideDebit,
                            groupedReportData,
                            groupedReportDataRightside,
                            0 // Threshold is set to 0 to check positive or negative
                          );

                        // Combine results
                        const finalResult =
                          parseFloat(result.toFixed(2)) +
                          (isGreaterThanThreshold < 0
                            ? parseFloat(netResult)
                            : 0);

                        return formatReadableAmount(finalResult);
                      })()}
                    </td>
                  </tr>
                </table>
              </td>
              <td align="left" colSpan={4}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="left"
                    >
                      Total Debit:
                    </td>
                    <td
                      className="fw-bold"
                      style={{ color: "red", width: "70%" }}
                      align="right"
                    >
                      {(() => {
                        const { netResult, isGreaterThanThreshold } =
                          calculateNetResult(
                            groupReportDataProfitrigthsidetsideCredit,
                            groupReportDataProfitleftsideDebit,
                            groupedReportData,
                            groupedReportDataRightside,
                            0 
                          );

                        const profitLeftSideDebitTotal = Object.values(
                          groupReportDataProfitleftsideDebit
                        ).reduce(
                          (acc, { groupnetvalue }) =>
                            acc + Math.abs(groupnetvalue),
                          0
                        );

                        const leftTotal = Object.values(
                          groupedReportData
                        ).reduce(
                          (acc, { groupnetvalue }) =>
                            acc + Math.abs(groupnetvalue),
                          0
                        );

                        const rightTotal = Object.values(
                          groupedReportDataRightside
                        ).reduce(
                          (acc, { netgroupvalue }) =>
                            acc + Math.abs(netgroupvalue),
                          0
                        );

                        const diff = leftTotal - rightTotal;

                        const resultLeft =
                          profitLeftSideDebitTotal + (diff > 0 ? diff : 0);

                        // Combine results and return formatted value
                        const finalResult =
                          parseFloat(resultLeft.toFixed(2)) +
                          (isGreaterThanThreshold ? parseFloat(netResult) : 0);

                        return formatReadableAmount(finalResult);
                      })()}
                    </td>
                  </tr>
                </table>
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
    </div>
  );
};

export default ProfitLossReport;
