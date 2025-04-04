import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useLocation } from 'react-router-dom';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper } from '@mui/material';
import { RingLoader } from 'react-spinners';

const apikey = process.env.REACT_APP_API_URL;

const SaleTDSRegister = () => {
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
        TDSAmt: 0
    });

    const API_URL = `${apikey}/api/sugarian/SaleTDS_Register`;

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
                        companyCode: company_Code,
                        YearCode: YearCode,
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
            "TDS Amount": Number(item.TDS_Amt) || 0
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

        XLSX.utils.book_append_sheet(wb, ws, 'SaleTDSRegister');
        XLSX.writeFile(wb, 'SaleTDSRegister.xlsx');
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
            tableData.push([{ content: key, colSpan: 11, styles: { halign: 'center', fontStyle: 'bold', textColor: [255, 0, 0] } }]);

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
            tableData.push([{ content: `Total Qty: ${group.totalQty}`, colSpan: 10, styles: { halign: 'right', fontStyle: 'bold' } }, '']);
        });

        doc.autoTable({
            head: [['Sauda Date', 'Tender No', 'ID', 'Customer Name', 'Season', 'Grade', 'Sale Rate', 'Mill Rate', 'Party Name', 'Qty', 'Dispatch Type', 'Payment Date']],
            body: tableData,
            margin: { top: 10, right: 10, bottom: 10, left: 10 },
            styles: {
                cellPadding: 5,
                fontSize: 10,
                overflow: 'linebreak',
                valign: 'middle',
                halign: 'center',
            },
            theme: 'grid'
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
                    CGSTAmt: 0,
                    SGSTAmt: 0,
                    IGSTAmt: 0,
                    BillamountAmt: 0,
                    TDSAmt: 0,

                };
            }
            groupedData[key].items.push(item);
            groupedData[key].TotalTaxable_Amt += parseFloat(item.Taxable_Amt) || 0;
            groupedData[key].CGSTAmt += parseFloat(item.CGST) || 0;
            groupedData[key].SGSTAmt += parseFloat(item.SGST) || 0;
            groupedData[key].IGSTAmt += parseFloat(item.IGST) || 0;
            groupedData[key].BillamountAmt += parseFloat(item.Bill_Amount) || 0;
            groupedData[key].TDSAmt += parseFloat(item.TDS_Amt) || 0;

        });
        return groupedData;
    };

    const groupedReportData = groupReportData(reportData);

    useEffect(() => {
        const totals = Object.values(groupedReportData).reduce(
            (totals, { TotalTaxable_Amt, CGSTAmt, SGSTAmt, IGSTAmt, BillamountAmt, TDSAmt }) => {
                totals.TotalTaxable_Amt += TotalTaxable_Amt || 0;
                totals.CGSTAmt += CGSTAmt || 0;
                totals.SGSTAmt += SGSTAmt || 0;
                totals.IGSTAmt += IGSTAmt || 0;
                totals.BillamountAmt += BillamountAmt || 0;
                totals.TDSAmt += TDSAmt || 0;
                return totals;
            },
            { TotalTaxable_Amt: 0, CGSTAmt: 0, SGSTAmt: 0, IGSTAmt: 0, BillamountAmt: 0, TDSAmt: 0 }
        );

        setGrandTotals(totals);
    }, [groupedReportData]);

    return (
        <div>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold", marginTop: "-25px" }}>{Company_Name}</Typography>
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

            <TableContainer component={Paper} sx={{ marginBottom: '60px' }} id="reportTable">
                <Table striped bordered mt={4}>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell style={{ textAlign: "center", fontWeight: "bold" }}>SBill No</TableCell>
                            <TableCell style={{ textAlign: "center", fontWeight: "bold" }}>Customer Name / Party Name </TableCell>
                            <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>Taxable Amt</TableCell>
                            <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>CGST Amt</TableCell>
                            <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>SGST Amt</TableCell>
                            <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>IGST Amt</TableCell>
                            <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>Bill Amount</TableCell>
                            <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>TDS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(groupedReportData).map(([key, { items, TotalTaxable_Amt, CGSTAmt, SGSTAmt, IGSTAmt, BillamountAmt, TDSAmt }]) => {
                            const parts = key.split('-');
                            const mc = parts[0];
                            const pan = parts[parts.length - 1];
                            const PartyName = parts.slice(1, -1).join('-');

                            const filteredItems = items.filter(item => false);

                            return (
                                <React.Fragment key={key}>
                                    {filteredItems.map((item, index) => (
                                        <TableRow
                                            key={index}
                                            hover
                                            sx={{
                                                cursor: 'pointer',
                                                // '&:hover': {
                                                //     backgroundColor: 'yellow', 
                                                // },
                                            }}
                                        >
                                            <TableCell>{item.Pan}</TableCell>
                                            <TableCell>{item.Name_Of_Party}</TableCell>
                                            <TableCell>{item.Taxable_Amt}</TableCell>
                                            <TableCell>{item.CGST}</TableCell>
                                            <TableCell>{item.SGST}</TableCell>
                                            <TableCell>{item.IGST}</TableCell>
                                            <TableCell>{item.Bill_Amount}</TableCell>
                                            <TableCell>{item.TDS_Amt}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell className="text-start ">{pan}</TableCell>
                                        <TableCell className="text-start ">{PartyName}</TableCell>
                                        <TableCell className="text-end ">
                                            {formatReadableAmount(TotalTaxable_Amt.toFixed(2))}
                                        </TableCell>
                                        <TableCell className="text-end ">
                                            {formatReadableAmount(CGSTAmt.toFixed(2))}
                                        </TableCell>
                                        <TableCell className="text-end ">
                                            {formatReadableAmount(SGSTAmt.toFixed(2))}
                                        </TableCell>
                                        <TableCell className="text-end ">
                                            {formatReadableAmount(IGSTAmt.toFixed(2))}
                                        </TableCell>
                                        <TableCell className="text-end ">
                                            {formatReadableAmount(BillamountAmt.toFixed(2))}
                                        </TableCell>
                                        <TableCell className="text-end">
                                            {formatReadableAmount(TDSAmt.toFixed(2))}
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            );
                        })}
                    </TableBody>
                    <TableRow>
                        <TableCell colSpan={2} sx={{ fontWeight: 'bold', backgroundColor: "yellow" }}>Total</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', backgroundColor: "yellow" }}>
                            {formatReadableAmount(grandTotals.TotalTaxable_Amt.toFixed(2))}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', backgroundColor: "yellow" }}>
                            {formatReadableAmount(grandTotals.CGSTAmt.toFixed(2))}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', backgroundColor: "yellow" }}>
                            {formatReadableAmount(grandTotals.SGSTAmt.toFixed(2))}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', backgroundColor: "yellow" }}>
                            {formatReadableAmount(grandTotals.IGSTAmt.toFixed(2))}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', backgroundColor: "yellow" }}>
                            {formatReadableAmount(grandTotals.BillamountAmt.toFixed(2))}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', backgroundColor: "yellow" }}>
                            {formatReadableAmount(grandTotals.TDSAmt.toFixed(2))}
                        </TableCell>
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
    );
};

export default SaleTDSRegister;
