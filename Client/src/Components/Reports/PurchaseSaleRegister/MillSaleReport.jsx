import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate, useLocation } from 'react-router-dom';

const apikey = process.env.REACT_APP_API_URL;

const MillSaleReportRegister = () => {
    const navigate = useNavigate();
    const location = useLocation();
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

    const API_URL = `${apikey}/api/sugarian/MillSaleReport_Register`;

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
                        acCode : acCode,
                        Company_Code :company_Code,
                        Year_code : YearCode
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
               const wb = XLSX.utils.book_new();
           
               // Define column headers
               const headers = [
                   "#", "Date", "Party Name","Mill Name","Lorry No","Qty","Rate","Subtotal", "Commission", "Frieght", "Other Amt", "Bill Amount"
               ];
           
               // Map reportData to ensure numeric values are formatted properly
               const formattedData = reportData.map(item => ({
                   
                   "#": item.doc_no,
                   "Date" : formatDate(item.doc_date),
                   "Party Name" : item.billtoname,
                   "Mill Name" :item.millshortname,
                   "Lorry No" :item.LORRYNO,
                   "Qty" : Number(item.NETQNTL) || 0,
                   "Rate" :item.salerate,
                   "Subtotal": Number(item.subTotal) || 0, 
                   "Commission": Number(item.bank_commission) || 0,
                   "Frieght": Number(item.freight) || 0,
                   "Other Amt": Number(item.OTHER_AMT) || 0,
                   "Bill Amount": Number(item.Bill_Amount) || 0,
                   
               }));
           
               // Convert data to worksheet
               const ws = XLSX.utils.json_to_sheet(formattedData, { header: headers });
           
               // Set column width and alignment
               const wsCols = [
                   { wch: 15 }, // PAN
                   { wch: 30 }, // Party Name
                   { wch: 15, alignment: { horizontal: "right" } }, // Taxable Amount
                   { wch: 10, alignment: { horizontal: "right" } }, // CGST
                   { wch: 10, alignment: { horizontal: "right" } }, // SGST
                   { wch: 10, alignment: { horizontal: "right" } }, // IGST
                   { wch: 15, alignment: { horizontal: "right" } }, // Bill Amount
                   { wch: 12, alignment: { horizontal: "right" } } // TDS Amount
               ];
               ws["!cols"] = wsCols; // Apply column width settings
           
               XLSX.utils.book_append_sheet(wb, ws, 'MillSaleReport');
               XLSX.writeFile(wb, 'MillSaleReport.xlsx');
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
                    formatDate(item.Sauda_Date),
                    item.Tender_No,
                    item.ID,
                    item.CustomerName,
                    item.season,
                    item.Grade,
                    item.Sale_Rate,
                    item.Mill_Rate,
                    item.PartyName,
                    item.Qty,
                    item.DispatchType,
                    formatDate(item.PaymentDate)
                ]);
            });
            tableData.push([{ content: `${group.totalQty}`, colSpan: 10, styles: { halign: 'right', fontStyle: 'bold' } }, '']);
        });

        doc.autoTable({
            head: [['SaudaDate', 'TenderNo', 'ID', 'CrossName', 'Season', 'Grade', 'Sale Rate', 'Mill Rate', 'PartyName', 'Qty', 'DT', "PaymentDate"]],
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
            const key = `${item.doc_date}`;
            if (!groupedData[key]) {
                groupedData[key] = {
                    items: [],
                    totalQty: 0,
                    subtotal : 0,
                    BillAmt : 0
                };
            }
            groupedData[key].items.push(item);
            groupedData[key].totalQty += parseFloat(item.NETQNTL) || 0;
            groupedData[key].subtotal += parseFloat(item.subTotal) || 0;
            groupedData[key].BillAmt += parseFloat(item.Bill_Amount) || 0;
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
                <table className="table table-striped table-bordered mt-4" id="reportTable">
                    <thead className="table-light">
                        <tr>
                            <th>#</th>
                            
                            <th>Party Name</th>
                            <th>Mill Name</th>
                            <th>Lorry No</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>Subtotal</th>
                            <th>Commission</th>
                            <th>Frieght</th>
                            <th>Other Amt</th>
                            <th>Bill Amt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(groupedReportData).map(([key, { items, totalQty,subtotal,BillAmt }]) => {
                            const [mc] = key.split('-');
                            return (
                                <React.Fragment key={key}>
                                    <tr>
                                        <td colSpan={12} className="table-primary" style={{ color: 'red', fontWeight: "bold" }}>
                                            {formatDate(mc)} 
                                        </td>
                                    </tr>
                                    {items.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.doc_no}</td>
                                            
                                            <td>{item.billtoname}</td>
                                            <td>{item.millshortname}</td>
                                            <td>{item.LORRYNO}</td>

                                            <td>{item.NETQNTL}</td>
                                            <td>{item.salerate}</td>
                                            <td>{item.subTotal}</td>
                                            <td>{item.bank_commission}</td>
                                            <td>{item.freight}</td>
                                            <td>{item.OTHER_AMT}</td>
                                            <td>{item.Bill_Amount}</td>
                                           
                                        </tr>
                                    ))}
                                    <tr>
                                        <td colSpan={4} className="text-end fw-bold"></td>
                                        <td className="fw-bold">{totalQty}</td>
                                        <td colSpan={1}></td>
                                        <td>{subtotal}</td>
                                        <td colSpan={3}></td>
                                        <td>{BillAmt}</td>

                                    </tr>
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {loading && <p>Loading report data...</p>}
            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default MillSaleReportRegister;
