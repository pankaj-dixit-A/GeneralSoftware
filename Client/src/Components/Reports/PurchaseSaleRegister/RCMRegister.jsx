import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

const apikey = process.env.REACT_APP_API_URL;

const RCMRegister = () => {
    const navigate = useNavigate();
    const location = useLocation();
       // const { fromDate, toDate } = location.state || { fromDate: '', toDate: '' ,companyCode : '',Year_Code : ''};
       const searchParams = new URLSearchParams(location.search);
       const fromDate = searchParams.get('fromDate');
       const toDate = searchParams.get('toDate');
       const company_Code = searchParams.get('companyCode');
       const YearCode = searchParams.get('yearCode');
       const acCode = searchParams.get('acCode');

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailId, setEmailId] = useState('');
    const [grandTotals, setGrandTotals] = useState({
            TotalTaxable_Amt: 0, 
            CGSTAmt: 0, 
            SGSTAmt: 0, 
            IGSTAmt: 0, 
            BillamountAmt: 0, 
            netqntl: 0
        });

    const API_URL = `${apikey}/api/sugarian/RCM_register`;

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
                        Company_Code : company_Code,
                        Year_code : YearCode,
                        acCode : acCode
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

    useEffect(() => {
        if (reportData.length > 0) {
            const totals = reportData.reduce(
                (acc, item) => {
                    acc.TotalTaxable_Amt += Number(item.subTotal) || 0; 
                    acc.CGSTAmt += Number(item.RCMCGSTAmt) || 0;
                    acc.SGSTAmt += Number(item.RCMSGSTAmt) || 0;
                    acc.IGSTAmt += Number(item.RCMIGSTAmt) || 0;
                    acc.BillamountAmt += Number(item.Memo_Advance) || 0;
                    acc.netqntl += Number(item.NETQNTL) || 0;
                    return acc;
                },
                { TotalTaxable_Amt: 0, CGSTAmt: 0, SGSTAmt: 0, IGSTAmt: 0, BillamountAmt: 0, netqntl: 0 }
            );
    
            setGrandTotals(totals);
        }
    }, [reportData]);
 
    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();
    
        // Define column headers
        const headers = [
            "Entry No", "Date", "Description", "GSTAmt",
            "CGST Amount", "SGST Amount", "IGST Amount",
            "RCM CGST Amount", "RCM SGST Amount", "RCM IGST Amount",
            "GST Rate"
        ];
    
        // Convert report data into an array
        const formattedData = reportData.map(item => [
            item.tran_type + " " + item.doc_no,
            formatDate(item.doc_date),
            item.transportname + " " + item.billtoshortname + " " + item.truck_no,
            Number(item.Memo_Advance) || 0,
            Number(item.RCMCGSTAmt) || 0,
            Number(item.RCMSGSTAmt) || 0,
            Number(item.RCMIGSTAmt) || 0,
            "", "", "",  // Empty placeholders for now
            Number(item.Rate) || 0
        ]);
    
        // Add grand total row at the bottom
        formattedData.push([
            "Grand Total", "", "",
            "", grandTotals.CGSTAmt, grandTotals.SGSTAmt, grandTotals.IGSTAmt,
            "", "", "", ""  // Empty placeholders for alignment
        ]);
        formattedData.push([
            "Refundable CGST",grandTotals.CGSTAmt, "Non Refundable CGST", "Net CGST"
           
        ]);
        formattedData.push([
            "Refundable SGST",grandTotals.SGSTAmt, "Non Refundable SGST", "Net SGST"
           
        ]);
        formattedData.push([
            "Refundable IGST",grandTotals.IGSTAmt, "Non Refundable IGST", "Net SGST"
           
        ]);
        formattedData.push([
            "Refundable GST",grandTotals.CGSTAmt + grandTotals.SGSTAmt + grandTotals.IGSTAmt, "Non Refundable GST", "Net GST"
           
        ]);

        // Convert to worksheet
        const ws = XLSX.utils.aoa_to_sheet([headers, ...formattedData]);
    
        // Set column width for better visibility
        ws["!cols"] = [
            { wch: 15 },  // Entry No
            { wch: 15 },  // Date
            { wch: 30 },  // Description
            { wch: 15 },  // GSTAmt
            { wch: 15 },  // CGST Amount
            { wch: 15 },  // SGST Amount
            { wch: 15 },  // IGST Amount
            { wch: 15 },  // RCM CGST Amount
            { wch: 15 },  // RCM SGST Amount
            { wch: 15 },  // RCM IGST Amount
            { wch: 15 }   // GST Rate
        ];
    
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'RCMRegister');
    
        // Generate and download Excel file
        XLSX.writeFile(wb, 'RCMRegister.xlsx');
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


    const generatePDF = async () => {
        const doc = new jsPDF();
        const groupedData = groupReportData(reportData);
        const tableData = [];

        Object.entries(groupedData).forEach(([key, group]) => {
            tableData.push([{ content: key, colSpan: 10, styles: { halign: 'center', fontStyle: 'bold', textColor: [255, 0, 0] } }]);
            group.items.forEach((item) => {
                tableData.push([
                    item.doc_no,
                    formatDate(item.doc_date),
                    item.utr_no,
                    item.amount,
                    item.narration_header,
                    item.utrgradename,
                    item.detailamount,
                    item.usedamount,
                    item.balanceamount
                ]);
            });
            tableData.push([{ content: `${group.totalQty}`, colSpan: 10, styles: { halign: 'right', fontStyle: 'bold' } }, '']);
        });

        doc.autoTable({
            head: [['UTR', 'Date', 'Bank Name', 'UTR Number', 'UTR Amount', 'Narration', 'Grade', 'DEtail Amount', 'Used Amount', 'Balance']],
            body: tableData,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            styles: {
                cellPadding: 1,
                fontSize: 10,
                overflow: 'linebreak',
            },
            theme: 'striped'
        });

        return doc.output('blob');
    };


    const groupReportData = (data) => {
        const groupedData = {};
        data.forEach((item) => {
            const key = `${item.purchaseid}`;
            if (!groupedData[key]) {
                groupedData[key] = {
                    items: [],
                    totalQty: 0,
                };
            }
            groupedData[key].items.push(item);
            groupedData[key].totalQty += parseFloat(item.Bill_Amount) || 0;
        });
        return groupedData;
    };

    const groupedReportData = groupReportData(reportData);

    const handleBack = () => {
        navigate('/purchase-sale-registers');
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
                    <button className="btn btn-warning ms-2" onClick={handleBack}>
                        Back
                    </button>
                </div>

               
            </div>

            <div className="table-responsive">
                <table className="table table-striped table-bordered mt-4" id="reportTable" style={{marginBottom:"60px"}}>
                <thead className="table-light">
    <tr>
         {/* Entry Index or Serial Number */}
        <th rowSpan={2}>Entry No</th>
        <th rowSpan={2}>Date</th>
        <th rowSpan={2}>Description</th>
        <th rowSpan={2}>GST Amount</th>  {/* Grouping GST Amounts */}
        <th colSpan={3}>Refundable</th>  {/* Grouping RCM GST Amounts */}
        <th colSpan={3}>Non Refundable</th>
        <th rowSpan={2}>GST Rate</th> 
    </tr>
    <tr>
       
        <th>CGST Amount</th>
        <th>SGST Amount</th>
        <th>IGST Amount</th>
        <th>CGST Amount </th>
        <th>SGST Amount </th>
        <th>IGST Amount </th>
    </tr>
</thead>

                    <tbody>
                        {Object.entries(groupedReportData).map(([key, { items, totalQty }]) => {
                            const [mc, millName] = key.split('-');
                            return (
                                <React.Fragment key={key}>
                                    
                                    {items.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.tran_type + " " +  item.doc_no }</td>
                                            <td>{formatDate(item.doc_date)}</td>
                                            <td>{item.transportname + " " + item.billtoshortname + " " +item.truck_no}</td>
                                            <td>{item.Memo_Advance}</td>
                                            <td>{item.RCMCGSTAmt}</td>
                                            <td>{item.RCMSGSTAmt}</td>
                                            <td>{item.RCMIGSTAmt}</td>
                                            <td></td>
                                            <td></td>
                                            <td>
                                                
                                            </td>
                                            <td>{formatReadableAmount(item.Rate)}</td>
                                           
                                            
                                        </tr>
                                    ))}
                                    
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                    <tr className="grand-total-row">
                    
                                        <td colSpan={2} className="fw-bold"></td>
                                       
                                        <td className="fw-bold"> Total</td>
                                        <td className="fw-bold text-end">{formatReadableAmount(grandTotals.BillamountAmt)}</td>
                                       
                                        <td className="fw-bold text-end">{formatReadableAmount(grandTotals.CGSTAmt)}</td>
                                        <td className="fw-bold text-end">{formatReadableAmount(grandTotals.SGSTAmt)}</td>
                                        <td className="fw-bold text-end">{formatReadableAmount(grandTotals.IGSTAmt)}</td>
                                        <td>0.00</td>
                                        <td>0.00</td>
                                        <td>0.00</td>
                                        <td>0.00</td>
                                        </tr>            
                </table>
                <table className="second-table" style={{marginBottom:"60px"}}>
    <tbody>
        <tr>
            <td>Refundable CGST</td> 
            <td>{formatReadableAmount(grandTotals.CGSTAmt)}</td>
            <td>Non-Refundable CGST</td>
            <td>Net CGST</td>
        </tr>
        <tr>
            <td>Refundable SGST</td> 
            <td>{formatReadableAmount(grandTotals.SGSTAmt)}</td>
            <td>Non-Refundable SGST</td>
            <td>Net SGST</td>
        </tr>
        <tr>
            <td>Refundable IGST</td> 
            <td>{formatReadableAmount(grandTotals.IGSTAmt)}</td>
            <td>Non-Refundable IGST</td>
            <td>Net IGST</td>
        </tr>
        <tr>
            <td>Refundable GST</td> 
            <td>{formatReadableAmount(grandTotals.CGSTAmt + grandTotals.SGSTAmt + grandTotals.IGSTAmt)}</td>
            <td>Non-Refundable GST</td>
            <td>Net GST</td>
        </tr>
    </tbody>
</table>

            </div>
            {loading && <p>Loading report data...</p>}
            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default RCMRegister;
