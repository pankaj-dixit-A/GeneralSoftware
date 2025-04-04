import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useLocation } from 'react-router-dom';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { RingLoader } from 'react-spinners';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from "@mui/material";

const apikey = process.env.REACT_APP_API_URL;

const SaleRegister = () => {
    const location = useLocation();
    const Company_Name = sessionStorage.getItem('Company_Name')
    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const company_Code = searchParams.get('companyCode');
    const YearCode = searchParams.get('yearCode');
    const acCode = searchParams.get('acCode');

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [grandTotals, setGrandTotals] = useState({
        TotalTaxable_Amt: 0,
        CGSTAmt: 0,
        SGSTAmt: 0,
        IGSTAmt: 0,
        BillamountAmt: 0,
        netqntl: 0
    });

    const API_URL = `${apikey}/api/sugarian/Sale_Register`;

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
                        Company_Code: company_Code,
                        Year_code: YearCode,
                        acCode: acCode
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
                    acc.TotalTaxable_Amt += Number(item.TaxableAmount) || 0;
                    acc.CGSTAmt += Number(item.CGSTAmount) || 0;
                    acc.SGSTAmt += Number(item.SGSTAmount) || 0;
                    acc.IGSTAmt += Number(item.IGSTAmount) || 0;
                    acc.BillamountAmt += Number(item.Bill_Amount) || 0;
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
        const headers = [
            "Bill No", "Date", "Customer Name", "GST No", "NetQntl", "Rate", "Taxable Amount", "CGST Amt", "SGST Amt", "IGST Amt", "Bill Amount"
        ];
    
        const formattedData = reportData.map(item => ({
            "Bill No": item.doc_no,
            "Date": formatDate(item.doc_date),
            "Customer Name": item.billtoname,
            "GST No": item.billtogstno,
            "NetQntl": Number(item.NETQNTL) || 0,
            "Rate": item.gstrate,
            "Taxable Amount": Number(item.TaxableAmount) || 0,
            "CGST Amt": Number(item.CGSTAmount) || 0,
            "SGST Amt": Number(item.SGSTAmount) || 0,
            "IGST Amt": Number(item.IGSTAmount) || 0,
            "Bill Amount": Number(item.Bill_Amount) || 0
        }));
        const ws = XLSX.utils.json_to_sheet(formattedData, { header: headers });
        const wsCols = [
            { wch: 15 }, 
            { wch: 30 },  
            { wch: 30 },  
            { wch: 15 }, 
            { wch: 12, alignment: { horizontal: "right" } },
            { wch: 10, alignment: { horizontal: "right" } }, 
            { wch: 15, alignment: { horizontal: "right" } }, 
            { wch: 12, alignment: { horizontal: "right" } }, 
            { wch: 12, alignment: { horizontal: "right" } },
            { wch: 12, alignment: { horizontal: "right" } },  
            { wch: 15, alignment: { horizontal: "right" } },  
        ];
    
        ws["!cols"] = wsCols;
        XLSX.utils.book_append_sheet(wb, ws, 'SaleRegister');
        XLSX.writeFile(wb, 'SaleRegister.xlsx');
    };
    
    const handlePrint = async () => {
        const companyName = Company_Name; 
        const fromDate = searchParams.get('fromDate'); 
        const toDate = searchParams.get('toDate'); 
        const pdfBlob = await generatePDF(companyName, fromDate, toDate);
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const win = window.open(pdfUrl, '', );
        win.document.close();
        win.print(); 
    };
    
    
    const generatePDF = async (companyName, fromDate, toDate) => {
        const doc = new jsPDF();
        
        const groupedData = groupReportData(reportData);  
        const tableData = [];
    
        doc.setFontSize(16);
        doc.text(companyName, doc.internal.pageSize.width / 2, 10, { align: 'center' });
    
        doc.setFontSize(10);
        doc.text(`Sale Register From: ${formatDate(fromDate)} To ${formatDate(toDate)}`, 10, 20);

        tableData.push(['Bill No', 'Date', 'Customer Name', 'GST No', 'NetQntl', 'Rate', 'Taxable Amount', 'CGST Amt', 'SGST Amt', 'IGST Amt', 'Bill Amount']);

        Object.entries(groupedData).forEach(([key, group]) => {
            group.items.forEach((item) => {
                tableData.push([
                    item.doc_no,
                    formatDate(item.doc_date),
                    item.billtoname,
                    item.billtogstno,
                    formatReadableAmount(item.NETQNTL),
                    item.gstrate,
                    formatReadableAmount(item.TaxableAmount),
                    formatReadableAmount(item.CGSTAmount),
                    formatReadableAmount(item.SGSTAmount),
                    formatReadableAmount(item.IGSTAmount),
                    formatReadableAmount(item.Bill_Amount),
                ]);
            });
        });

        const totalRow = [
            '', '', 'Total', '', 
            formatReadableAmount(grandTotals.netqntl),
            '', 
            formatReadableAmount(grandTotals.TotalTaxable_Amt),
            formatReadableAmount(grandTotals.CGSTAmt),
            formatReadableAmount(grandTotals.SGSTAmt),
            formatReadableAmount(grandTotals.IGSTAmt),
            formatReadableAmount(grandTotals.BillamountAmt)
        ];
    
        tableData.push(totalRow);
    
        doc.autoTable({
            headStyles: {
                fillColor: [255, 0, 0],
                fontStyle: 'bold',
            },
            body: tableData,
            margin: { top: 25 },
            styles: {
                fontSize: 5,
                cellPadding: 1,
                halign: 'center',
            },
            columnStyles: {
                2: { halign: 'left' },
                4: { halign: 'right' },
                5: { halign: 'right' },
                6: { halign: 'right' },
                7: { halign: 'right' },
                8: { halign: 'right' },
                9: { halign: 'right' },
                10: { halign: 'right' },
            },
            theme: 'grid',
        });
    
        return doc.output('blob');
    };
    
    
    const groupReportData = (data) => {
        const groupedData = {};
        data.forEach((item) => {
            const key = `${item.saleid}`;
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

    return (
        <>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold", marginTop: "-25px" }}>{Company_Name}</Typography>
            <div>
                <div className="mb-3 row align-items-center">
                    <div className="col-auto">
                        <button className="btn btn-secondary me-2" onClick={handlePrint}>
                            Print
                        </button>
                        <button className="btn btn-success" onClick={handleExportToExcel}>
                            Export to Excel
                        </button>
                    </div>
                </div>

                <TableContainer component={Paper} style={{ marginBottom: "60px" }} id="reportTable">
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell style={{ textAlign: "center", fontWeight: "bold" }}>Bill No</TableCell>
                                <TableCell style={{ textAlign: "center", fontWeight: "bold" }}>Date</TableCell>
                                <TableCell style={{ textAlign: "center", fontWeight: "bold" }}>Customer Name / Party Name</TableCell>
                                <TableCell style={{ textAlign: "center", fontWeight: "bold" }} >GST No.</TableCell>
                                <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>Net Quintal</TableCell>
                                <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>Rate</TableCell>
                                <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>Taxable Amount</TableCell>
                                <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>CGST Amount</TableCell>
                                <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>SGST Amount</TableCell>
                                <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>IGST Amount</TableCell>
                                <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>Bill Amount</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.entries(groupedReportData).map(([key, { items, totalQty }]) => {
                                return (
                                    <React.Fragment key={key}>
                                        {items.map((item, index) => (
                                            <TableRow
                                                key={index}
                                                sx={{
                                                    cursor: "pointer",
                                                    // "&:hover": {
                                                    //     backgroundColor: "#fdfd96",
                                                    // },
                                                }}
                                            >
                                                <TableCell>{item.doc_no}</TableCell>
                                                <TableCell>{formatDate(item.doc_date)}</TableCell>
                                                <TableCell style={{ textAlign: "left" }}>{item.billtoname}</TableCell>
                                                <TableCell>{item.billtogstno}</TableCell>
                                                <TableCell style={{ textAlign: "right" }}>
                                                    {formatReadableAmount(item.NETQNTL)}
                                                </TableCell>
                                                <TableCell style={{ textAlign: "right" }}>{item.gstrate}</TableCell>
                                                <TableCell style={{ textAlign: "right" }}>
                                                    {formatReadableAmount(item.TaxableAmount)}
                                                </TableCell>
                                                <TableCell style={{ textAlign: "right" }}>
                                                    {formatReadableAmount(item.CGSTAmount)}
                                                </TableCell>
                                                <TableCell style={{ textAlign: "right" }}>
                                                    {formatReadableAmount(item.SGSTAmount)}
                                                </TableCell>
                                                <TableCell style={{ textAlign: "right" }}>
                                                    {formatReadableAmount(item.IGSTAmount)}
                                                </TableCell>
                                                <TableCell style={{ textAlign: "right" }}>
                                                    {formatReadableAmount(item.Bill_Amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                        <TableRow style={{ backgroundColor: "yellow" }}>
                            <TableCell colSpan={4} className="fw-bold">Total</TableCell>
                            <TableCell className="fw-bold text-end">{formatReadableAmount(grandTotals.netqntl)}</TableCell>
                            <TableCell className="fw-bold"></TableCell>
                            <TableCell className="fw-bold text-end">
                                {formatReadableAmount(grandTotals.TotalTaxable_Amt)}
                            </TableCell>
                            <TableCell className="fw-bold text-end">{formatReadableAmount(grandTotals.CGSTAmt)}</TableCell>
                            <TableCell className="fw-bold text-end">{formatReadableAmount(grandTotals.SGSTAmt)}</TableCell>
                            <TableCell className="fw-bold text-end">{formatReadableAmount(grandTotals.IGSTAmt)}</TableCell>
                            <TableCell className="fw-bold text-end">{formatReadableAmount(grandTotals.BillamountAmt)}</TableCell>
                        </TableRow>
                    </Table>
                </TableContainer>

                {loading && (
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 9999
                    }}>
                        <RingLoader size={80} />
                    </div>
                )}
                {error && <div className="alert alert-danger">{error}</div>}
            </div>
        </>
    );

};

export default SaleRegister;
