import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount"
import { CircularProgress } from '@mui/material';
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API;

const PurchaseTCSTDSSummary = ({ fromDate, toDate, companyCode, yearCode, accode }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDataFetched, setIsDataFetched] = useState(false);

    const fetchPurchaseTCSTDSSummary = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(`${API_URL}/PurchaseTCSTDS-summary`, {
                params: {
                    from_date: fromDate,
                    to_date: toDate,
                    Company_Code: companyCode,
                    Year_Code: yearCode,
                    accode: accode
                },
            });
            if (response.data.length === 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Data Not Found.!',
                    text: 'No Purchase TCS/TDS data found for the selected date range.',
                });
                return;
            }
            setData(response.data);
            setIsDataFetched(true);
            openReportInNewTab(response.data);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const openReportInNewTab = (data) => {
        const newWindow = window.open('', '_blank');
        if (!newWindow) return;

        const columns = [
            'SR_No',
            'fromDate',
            'ToDate',
            'Name_Of_Party',
            'PartyGst_No',
            'Pan',
            'Tan',
            'Taxable_Amt',
            'CGST',
            'SGST',
            'IGST',
            'TCS',
            'TDS',
            'Bill_Amt',
            'Party_Email'
        ];

        const totals = calculateTotals(data);

        newWindow.document.write(`
            <html>
                <head>
                    <title>Purchase TCSTDS Summary</title>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
                        h2 { text-align: center; margin-top: 0; }
                        table { width: 80%; margin: 20px auto; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f4f4f4; }
                        .export-btn { 
                            padding: 10px 20px; 
                            font-size: 16px; 
                            background-color: green; 
                            color: white; 
                            border: none; 
                            cursor: pointer; 
                            margin-top: 20px;
                        }
                        .total-row { background-color: yellow; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h2>Purchase TCSTDS Summary Report</h2>
                    <button class="export-btn" onclick="window.exportToCsv()">Export to CSV</button>
                    <table>
                        <thead>
                            <tr >
                                ${columns.map((column) => `<th style="text-align: center;">${column}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(row => {
            return `
                                    <tr>
                                        ${columns.map(column => {
                if (['Taxable_Amt', 'CGST', 'SGST', 'IGST', 'Bill_Amt', 'TCS', 'TDS'].includes(column)) {
                    return `<td style="text-align: right;">${formatReadableAmount(row[column] || 0)}</td>`;
                } else {
                    return `<td>${row[column] || ''}</td>`;
                }
            }).join('')}
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="total-row">
                          <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }} colSpan="6"></td>
                                <td>Total</td>
                                <td style="text-align: right;">${formatReadableAmount(totals.Taxable_Amt.toFixed(2))}</td>
                                <td style="text-align: right;">${formatReadableAmount(totals.CGST.toFixed(2))}</td>
                                <td style="text-align: right;">${formatReadableAmount(totals.SGST.toFixed(2))}</td>
                                <td style="text-align: right;">${formatReadableAmount(totals.IGST.toFixed(2))}</td>
                                <td style="text-align: right;">${formatReadableAmount(totals.TCS.toFixed(2))}</td>
                                <td style="text-align: right;">${formatReadableAmount(totals.TDS.toFixed(2))}</td>
                                <td style="text-align: right;">${formatReadableAmount(totals.Bill_Amt.toFixed(2))}</td>
                            </tr>
                        </tfoot>
                    </table>
                    <script>
                    window.exportToCsv = function() {
                        const data = ${JSON.stringify(data)};
                       const columnOrder = [ 'SR_No','fromDate','ToDate','Name_Of_Party','PartyGst_No','Pan','Tan','Taxable_Amt', 'CGST','SGST','IGST','TCS','TDS','Bill_Amt','Party_Email'];
                        
                        const formattedData = data.map(row => {
                            return {
                                 ...row,
                                Taxable_Amt: parseFloat(row.Taxable_Amt || 0).toFixed(2),
                                CGST: parseFloat(row.CGST || 0).toFixed(2),
                                SGST: parseFloat(row.SGST || 0).toFixed(2),
                                IGST: parseFloat(row.IGST || 0).toFixed(2),
                                TCS: parseFloat(row.TCS || 0).toFixed(2),
                                TDS: parseFloat(row.TDS || 0).toFixed(2),
                                Bill_Amt: parseFloat(row.Bill_Amt || 0).toFixed(2),
                            };
                        });

                        const totals = formattedData.reduce((acc, row) => {
                            acc.Taxable_Amt += parseFloat(row.Taxable_Amt || 0);
                            acc.CGST += parseFloat(row.CGST || 0);
                            acc.SGST += parseFloat(row.SGST || 0);
                            acc.IGST += parseFloat(row.IGST || 0);
                            acc.TCS += parseFloat(row.TCS || 0);
                            acc.TDS += parseFloat(row.TDS || 0);
                            acc.Bill_Amt += parseFloat(row.Bill_Amt || 0);
                            return acc;
                        }, {
                            Taxable_Amt: 0,
                            CGST: 0,
                            SGST: 0,
                            IGST: 0,
                            TCS: 0,
                            TDS: 0,
                            Bill_Amt: 0,
                        });

                        formattedData.push({
                            SR_No: 'Totals',
                            Taxable_Amt: totals.Taxable_Amt.toFixed(2),
                            CGST: totals.CGST.toFixed(2),
                            SGST: totals.SGST.toFixed(2),
                            IGST: totals.IGST.toFixed(2),
                            TCS: totals.TCS.toFixed(2),
                             TDS: totals.TDS.toFixed(2),
                            Bill_Amt: totals.Bill_Amt.toFixed(2),
                        });

                        const ws = XLSX.utils.json_to_sheet(formattedData, { header: columnOrder, skipHeader: false });
                        const csv = XLSX.utils.sheet_to_csv(ws);

                        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.setAttribute("download", "PurchaseTCSTDSSummary.csv");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    };

                    </script>
                </body>
            </html>
        `);

        newWindow.document.close();
    };
    const calculateTotals = (data) => {
        let totals = {
            Taxable_Amt: 0,
            CGST: 0,
            SGST: 0,
            IGST: 0,
            TCS: 0,
            TDS: 0,
            Bill_Amt: 0
        };

        data.forEach(row => {
            totals.Taxable_Amt += parseFloat(row.Taxable_Amt || 0);
            totals.CGST += parseFloat(row.CGST || 0);
            totals.SGST += parseFloat(row.SGST || 0);
            totals.IGST += parseFloat(row.IGST || 0);
            totals.TCS += parseFloat(row.TCS || 0);
            totals.TDS += parseFloat(row.TDS || 0);
            totals.Bill_Amt += parseFloat(row.Bill_Amt || 0);
        });
        return totals;
    };

    return (
        <div className="d-flex flex-column align-items-center" style={{ marginTop: '20px' }}>
            <button
                variant="contained"
                color="primary"
                onClick={fetchPurchaseTCSTDSSummary}
                disabled={loading}
                style={{
                    width: '20%',
                    height: '60px',
                }}
            >
                {loading ? <CircularProgress size={24} /> : 'Purchase TCS/TDS Summary'}
            </button>
            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default PurchaseTCSTDSSummary;
