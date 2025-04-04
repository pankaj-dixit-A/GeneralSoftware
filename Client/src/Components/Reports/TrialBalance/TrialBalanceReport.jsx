import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../Reports/TrialBalance/TrialBalance.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate, useLocation } from 'react-router-dom';
import { RingLoader } from 'react-spinners';
import { Typography } from '@mui/material';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

const apikey = process.env.REACT_APP_API_URL;

const TrialBalanceReport = () => {

    //GET values from session Storage
    const companyCode = sessionStorage.getItem("Company_Code");
    const Year_Code = sessionStorage.getItem("Year_Code");
    const Company_Name = sessionStorage.getItem("Company_Name");

    const navigate = useNavigate();
    const location = useLocation();
    //const { fromDate, toDate, groupType } = location.state || { fromDate: '', toDate: '', groupType: '' };

    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const groupType = searchParams.get('groupType');

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailId, setEmailId] = useState('');

    const API_URL = `${apikey}/api/sugarian/TrialBalance-Report`;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear());
        return `${day}/${month}/${year}`;
    };

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await axios.get(API_URL, {
                    params: {
                        from_date: fromDate,
                        to_date: toDate,
                        Company_Code: companyCode,
                        groupType: groupType
                    },
                });
                setReportData(response.data);
            } catch (error) {
                console.error('Error fetching report:', error);
                setError('Error fetching report');
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [API_URL]);

    const handleExportToExcel = () => {
        const table = document.getElementById("reportTable");
        if (!table) {
          alert("Table not found!");
          return;
        }
        const wb = XLSX.utils.book_new();
        let headers = [
          ["JK Sugars And Commodities Pvt. Ltd."],
          [
            `From Date: ${formatDate(fromDate) || ""} To Date: ${
              formatDate(toDate) || ""
            }`,
          ],
          [],
        ];
        const ws = XLSX.utils.table_to_sheet(table, { origin: 4 });
        XLSX.utils.sheet_add_aoa(ws, headers, { origin: 0 });
        ws["!cols"] = [
          { wch: 10 }, 
          { wch: 20 }, 
          { wch: 15 },
          { wch: 15 }, 
          { wch: 15 }, 
        ];
        const range = XLSX.utils.decode_range(ws["!ref"]);
        for (let R = range.s.r + 4; R <= range.e.r; R++) {
          for (let C = 3; C <= 4; C++) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (ws[cellRef]) {
              ws[cellRef].s = ws[cellRef].s || {};
              ws[cellRef].s.alignment = { horizontal: "right" };
            }
          }
        }
        XLSX.utils.book_append_sheet(wb, ws, "Trial Balance");
        XLSX.writeFile(wb, `Trial Balance.xlsx`);
      };
    


    const handleSendEmail = async () => {
        if (!emailId) {
            setError('Please enter an email address');
            return;
        }

        const pdfBlob = await generatePDF();
        const pdfFileToSend = new File([pdfBlob], 'report.pdf');

        const formData = new FormData();
        formData.append('email', emailId);
        formData.append('pdf', pdfFileToSend);

        try {
            const response = await axios.post(`${apikey}/api/sugarian/send-pdf-email`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert(response.data.message || 'Email sent successfully');
        } catch (error) {
            console.error('Error sending email:', error);
            setError('Failed to send email');
        }
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

    const handleRowClick = (acCode) => {
        setLoading(true);
        setTimeout(() => {
            const url = `/ledger-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&acCode=${encodeURIComponent(acCode)}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);

    };

    const generatePDF = async () => {
        const doc = new jsPDF();
        const table = document.getElementById("reportTable"); 

        if (!table) {
            alert("Table not found!");
            return;
        }

        const tableData = [];
        const headers = [];

        // Extract headers from the table
        const headerCells = table.querySelectorAll("thead th");
        headerCells.forEach(th => headers.push(th.innerText.trim()));

        // Extract rows from the table
        const rows = table.querySelectorAll("tbody tr");
        rows.forEach(row => {
            const rowData = [];
            row.querySelectorAll("td").forEach((td, index) => {
                let cellText = td.innerText.trim();
                let cellStyles = {};

                // Right-align specific columns (Debit, Credit, Balance)
                if (index >= 3) {
                    cellStyles = { halign: 'right' };
                }

                rowData.push({ content: cellText, styles: cellStyles });
            });
            tableData.push(rowData);
        });

        doc.autoTable({
            head: [headers],
            body: tableData,
            startY: 10, // Adjust vertical spacing
            margin: { top: 10 },
            styles: {
                cellPadding: 2,
                fontSize: 10,
                overflow: 'linebreak',
            },
            columnStyles: {
                3: { halign: 'right' }, // Debit
                4: { halign: 'right' }, // Credit
                5: { halign: 'right' }  // Balance
            },
            theme: 'striped'
        });

        return doc.output('blob');
    };

    const groupReportData = (data) => {
        const groupedData = {};
        data.forEach((item) => {
            const key = `${item.Group_Code}-${item.group_Type} - ${item.group_Name_E}`;
            if (!groupedData[key]) {
                groupedData[key] = {
                    items: [],
                    totalQty: 0,
                    groupdebitamt: 0,
                    groupcreditamt: 0,
                    netdiff: 0,
                };
            }
            groupedData[key].items.push(item);
            groupedData[key].groupdebitamt += parseFloat(item.Balance > 0 ? item.Balance : 0) || 0;
            groupedData[key].groupcreditamt += parseFloat(item.Balance < 0 ? item.Balance : 0) || 0;

        });
        return groupedData;
    };

    const groupedReportData = groupReportData(reportData);

    const handleBack = () => {
        navigate('/trial-balance');
    };

    return (
        <div>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold", marginTop: "10px" }}>{Company_Name}</Typography>
            <div className="mb-3 row align-items-center">
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

                <div className="col-auto mb-3">
                    <input
                        type="email"
                        id="email"
                        className="form-control"
                        value={emailId}
                        onChange={(e) => setEmailId(e.target.value)}
                        placeholder="Enter email to send report"
                        style={{ maxWidth: '500px', padding: '10px' }}
                    />
                </div>

                <div className="col-auto">
                    <button className="btn btn-primary" onClick={handleSendEmail}>
                        Mail PDF
                    </button>
                </div>
            </div>

            <div className="table-responsive">
                <table className="table table-striped table-bordered mt-4" id="reportTable" style={{ marginBottom: '60px' }}>
                    <thead className="table-light">
                        <tr>
                            <th>Ac Code</th>
                            <th>Ac Name</th>
                            <th>City</th>
                            <th style={{ textAlign: 'right' }}>Debit</th>
                            <th style={{ textAlign: 'right' }}>Credit</th>

                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(groupedReportData).map(([key, { items, groupdebitamt, groupcreditamt, netdiff }]) => {
                            const [mc, millName, name] = key.split('-');
                            return (
                                <React.Fragment key={key}>
                                    <tr>
                                        <td colSpan={12} className="table-primary" style={{ color: 'red', fontWeight: "bold" }}>
                                            {mc} - {millName} -{name}
                                        </td>
                                    </tr>
                                    {items.map((item, index) => (
                                        <tr key={index} >
                                            <td onClick={() => handleRowClick(item.AC_CODE)} style={{ cursor: "pointer" }}>{item.AC_CODE}</td>
                                            <td align='left'>{item.Ac_Name_E}</td>
                                            <td align='left'>{item.CityName}</td>
                                            <td align='right'>{item.Balance > 0 ? formatReadableAmount(item.Balance) : 0}</td>
                                            <td align='right'>{item.Balance < 0 ? formatReadableAmount(Math.abs(item.Balance)) : 0}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td className="text-end fw-bold" colSpan={3} align='left'>Diff:{formatReadableAmount(Math.abs(groupdebitamt) - Math.abs(groupcreditamt))}</td>
                                        <td className="fw-bold" align='right'>{formatReadableAmount(Math.abs(groupdebitamt))}</td>
                                        <td className="fw-bold" align='right'>{formatReadableAmount(Math.abs(groupcreditamt))}</td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                        <tr style={{ backgroundColor: 'red', color: 'blue', textAlign: 'left', fontSize: '15px' }}>
                            <td className="text-end fw-bold" colSpan={3} style={{ color: 'red', textAlign: 'left' }} >  Net Diff:
                                {formatReadableAmount(
                                    Object.values(groupedReportData).reduce((acc, { groupdebitamt }) => acc + Math.abs(groupdebitamt), 0) -
                                    Object.values(groupedReportData).reduce((acc, { groupcreditamt }) => acc + Math.abs(groupcreditamt), 0)
                                )}
                            </td>
                            <td className="fw-bold" style={{ color: 'red' }} align='right'>
                                {formatReadableAmount(
                                    Object.values(groupedReportData).reduce((acc, { groupdebitamt }) => acc + Math.abs(groupdebitamt), 0)
                                )}
                            </td>
                            <td className="fw-bold" style={{ color: 'red' }} align='right'>
                                {formatReadableAmount(
                                    Object.values(groupedReportData).reduce((acc, { groupcreditamt }) => acc + Math.abs(groupcreditamt), 0)
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
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
            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default TrialBalanceReport;
