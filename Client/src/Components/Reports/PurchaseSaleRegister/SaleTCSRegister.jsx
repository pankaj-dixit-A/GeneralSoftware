import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

const apikey = process.env.REACT_APP_API_URL;

const SaleTCSRegister = () => {
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
    const companyCode = sessionStorage.getItem("Company_Code");
    const Year_Code = sessionStorage.getItem("Year_Code");
    const [grandTotals, setGrandTotals] = useState({
        TotalTaxable_Amt: 0, 
        CGSTAmt: 0, 
        SGSTAmt: 0, 
        IGSTAmt: 0, 
        BillamountAmt: 0, 
        TCSAmt: 0
    });
    
    const API_URL = `${apikey}/api/sugarian/SaleTCS_Register`;

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
                        toDate: toDate,
                        companyCode : company_Code,
                        YearCode : YearCode,
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

    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const headers = [
            "PAN", "Party Name", "Taxable Amount", "CGST", "SGST", "IGST", "Bill Amount", "TDS Amount"
        ];

        const formattedData = reportData.map(item => ({
            PAN: item.Pan,
            "Party Name": item.Name_Of_Party,
            "Taxable Amount": Number(item.Taxable_Amt) || 0, 
            "CGST": Number(item.CGST) || 0,
            "SGST": Number(item.SGST) || 0,
            "IGST": Number(item.IGST) || 0,
            "Bill Amount": Number(item.Bill_Amount) || 0,
            "TCS Amount": Number(item.TCS) || 0
        }));
    
        const ws = XLSX.utils.json_to_sheet(formattedData, { header: headers });
    
        const wsCols = [
            { wch: 15 }, 
            { wch: 30 }, 
            { wch: 15, alignment: { horizontal: "right" } },
            { wch: 10, alignment: { horizontal: "right" } },
            { wch: 10, alignment: { horizontal: "right" } }, 
            { wch: 10, alignment: { horizontal: "right" } }, 
            { wch: 15, alignment: { horizontal: "right" } },
            { wch: 12, alignment: { horizontal: "right" } } 
        ];
        ws["!cols"] = wsCols;
    
        XLSX.utils.book_append_sheet(wb, ws, 'SaleTCSRegister');
        XLSX.writeFile(wb, 'SaleTCSRegister.xlsx');
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
            const key = `${item.Party_Code}-${item.Name_Of_Party}-${item.Pan}`;
            if (!groupedData[key]) {
                groupedData[key] = {
                    items: [],
                    TotalTaxable_Amt: 0,
                    CGSTAmt : 0,
                    SGSTAmt : 0,
                    IGSTAmt : 0,
                    BillamountAmt : 0,
                    TCSAmt : 0,
                    
                };
            }
            groupedData[key].items.push(item);
            groupedData[key].TotalTaxable_Amt += parseFloat(item.Taxable_Amt) || 0;
            groupedData[key].CGSTAmt += parseFloat(item.CGST) || 0;
            groupedData[key].SGSTAmt += parseFloat(item.SGST) || 0;
            groupedData[key].IGSTAmt += parseFloat(item.IGST) || 0;
            groupedData[key].BillamountAmt += parseFloat(item.Bill_Amount) || 0;
            groupedData[key].TCSAmt += parseFloat(item.TCS) || 0;

        });
        return groupedData;
    };

    const groupedReportData = groupReportData(reportData);

    const handleBack = () => {
        navigate('/purchase-sale-registers');
    };
    useEffect(() => {
        const totals = Object.values(groupedReportData).reduce(
            (totals, { TotalTaxable_Amt, CGSTAmt, SGSTAmt, IGSTAmt, BillamountAmt, TCSAmt }) => {
                totals.TotalTaxable_Amt += TotalTaxable_Amt || 0;
                totals.CGSTAmt += CGSTAmt || 0;
                totals.SGSTAmt += SGSTAmt || 0;
                totals.IGSTAmt += IGSTAmt || 0;
                totals.BillamountAmt += BillamountAmt || 0;
                totals.TCSAmt += TCSAmt || 0;
                return totals;
            },
            { TotalTaxable_Amt: 0, CGSTAmt: 0, SGSTAmt: 0, IGSTAmt: 0, BillamountAmt: 0, TCSAmt: 0 }
        );
    
        setGrandTotals(totals);
    }, [groupedReportData]); // Update total when data changes
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

                <div className="col-auto">
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
                <table className="table table-striped table-bordered mt-4" id="reportTable" style={{marginBottom:"60px"}}>
                    <thead className="table-light">
                        <tr>
                            <th>SBill No</th>
                            <th>Inv Date</th>
                            <th>Taxable Amt</th>
                            <th>CGST Amt</th>
                            <th>SGST Amt</th>
                            <th>IGST Amt</th>
                            <th>Bill Amount</th>
                            <th>TCS</th>
                           
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(groupedReportData).map(([key, { items, TotalTaxable_Amt,CGSTAmt,SGSTAmt,IGSTAmt,BillamountAmt,TCSAmt }]) => {
                           // const [mc,PartyName,pan] = key.split('-');
                            const parts = key.split('-');
                            const mc = parts[0]; 
                            const pan = parts[parts.length - 1];  
                            const PartyName = parts.slice(1, -1).join('-'); 
                            const filteredItems = items.filter(item => false);
                            return (
                                <React.Fragment key={key}>
                                    {/* <tr hidden={tr}>
                                        <td colSpan={12} className="table-primary" style={{ color: 'red', fontWeight: "bold" }}>
                                            {mc} 
                                        </td>
                                    </tr> */}
                                    {filteredItems.map((item, index) => (
                                        <tr key={index} >
                                            <td>{item.Pan}</td>
                                            <td>{item.Name_Of_Party}</td>
                                            <td>{item.Taxable_Amt}</td>
                                            <td>{item.CGST}</td>
                                            <td>{item.SGST}</td>
                                            <td>{item.IGST}</td>
                                            <td>{item.Bill_Amount}</td>
                                            <td>{item.TCS}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                    <td className="text-start fw-bold">{pan}</td> {/* Left-align PAN */}
                                    <td className="text-start fw-bold">{PartyName}</td> {/* Center-align Party Name */}
                                    <td className="text-end fw-bold">{formatReadableAmount(TotalTaxable_Amt.toFixed(2))}</td>
                                    <td className="text-end fw-bold">{formatReadableAmount(CGSTAmt.toFixed(2))}</td>
                                    <td className="text-end fw-bold">{formatReadableAmount(SGSTAmt.toFixed(2))}</td>
                                    <td className="text-end fw-bold">{formatReadableAmount(IGSTAmt.toFixed(2))}</td>
                                    <td className="text-end fw-bold">{formatReadableAmount(BillamountAmt.toFixed(2))}</td>


                                    <td className="text-end fw-bold">{formatReadableAmount(TCSAmt.toFixed(2))}</td>
                                      
                                    </tr>
                                    
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                    <tr className="grand-total-row">

                    <td colSpan={2} className="fw-bold">Grand Total</td>
                    <td className="fw-bold text-end">{formatReadableAmount(grandTotals.TotalTaxable_Amt.toFixed(2))}</td>
                    <td className="fw-bold text-end">{formatReadableAmount(grandTotals.CGSTAmt.toFixed(2))}</td>
                    <td className="fw-bold text-end">{formatReadableAmount(grandTotals.SGSTAmt.toFixed(2))}</td>
                    <td className="fw-bold text-end">{formatReadableAmount(grandTotals.IGSTAmt.toFixed(2))}</td>
                    <td className="fw-bold text-end">{formatReadableAmount(grandTotals.BillamountAmt.toFixed(2))}</td>
                    <td className="fw-bold text-end">{formatReadableAmount(grandTotals.TCSAmt.toFixed(2))}</td>
                </tr>
                </table>
            </div>
            {loading && <p>Loading report data...</p>}
            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default SaleTCSRegister;
