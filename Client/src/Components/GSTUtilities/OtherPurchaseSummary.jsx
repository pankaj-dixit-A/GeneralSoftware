import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount"
import { CircularProgress } from '@mui/material';
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API;

const OtherPurchaseSummary = ({ fromDate, toDate, companyCode, yearCode }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDataFetched, setIsDataFetched] = useState(false);

    const fetchOtherPurchaseSummary = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(`${API_URL}/OtherPurchase-summary`, {
                params: {
                    from_date: fromDate,
                    to_date: toDate,
                    Company_Code: companyCode,
                    Year_Code: yearCode,
                },
            });
             if (response.data.length === 0) {
                            Swal.fire({
                                icon: 'error',
                                title: 'Data Not Found.!',
                                text: 'No Other Purchase data found for the selected date range.',
                            });
                            return;
                        }
            setData(response.data);
            setIsDataFetched(true);
            openInNewTab(response.data);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const openInNewTab = (data) => {
        const newWindow = window.open('', '_blank');
        if (!newWindow) return;

        const columns = [
            'SR_No',
            'Invoice_No',
            'PartyGSTNo',
            'PartyCode',
            'PartyName',
            'PartyStateCode',
            'Invoice_Date',
            'TaxableAmount',
            'CGST',
            'SGST',
            'IGST',
            'Bill_Amount',
            'BillNo',
            'TDSAmount',
            'Narration'
        ];

        const totals = calculateTotals(data);

        newWindow.document.write(`
            <html>
                <head>
                    <title>Other Purchase Summary</title>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h2 { text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f4f4f4; }
                        .export-btn { display: block; margin: 20px auto; padding: 10px 15px; font-size: 16px; background-color: green; color: white; border: none; cursor: pointer; }
                        .container { text-align: center; }
                    </style>
                </head>
                <body>
                    <h2>Other Purchase Summary Report</h2>
                    <div class="container">
                        <button class="export-btn" onclick="window.exportToXlsx()">Export to XLSX</button>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                ${columns.map((column) => `<th style="text-align: center;">${column}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(row => {
            return `
                                    <tr>
                                         ${columns.map(column => {
                if (['TaxableAmount', 'CGST', 'SGST', 'IGST', 'TDSAmount', 'Bill_Amount'].includes(column)) {
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
                            <tr>
                                <td colspan="6" style="font-weight: bold; background-color: yellow;"></td>
                                <td style="font-weight: bold; background-color: yellow; text-align: right;"></td>
                                <td style="font-weight: bold; background-color: yellow; text-align: right;">${formatReadableAmount(totals.TaxableAmount.toFixed(2))}</td>
                                <td style="font-weight: bold; background-color: yellow; text-align: right;">${formatReadableAmount(totals.CGST.toFixed(2))}</td>
                                <td style="font-weight: bold; background-color: yellow; text-align: right;">${formatReadableAmount(totals.SGST.toFixed(2))}</td>
                                <td style="font-weight: bold; background-color: yellow; text-align: right;">${formatReadableAmount(totals.IGST.toFixed(2))}</td>
                                <td style="font-weight: bold; background-color: yellow; text-align: right;">${formatReadableAmount(totals.Bill_Amount.toFixed(2))}</td>
                                <td style="font-weight: bold; background-color: yellow; text-align: right;"></td>
                            </tr>
                        </tfoot>
                    </table>
                    <script>

                    window.exportToXlsx = function() {
                    const data = ${JSON.stringify(data)};
                     const columnOrder = ['SR_No','Invoice_No','PartyGSTNo','PartyCode','PartyName','PartyStateCode','Invoice_Date','TaxableAmount','CGST','SGST','IGST','Bill_Amount','BillNo','TDSAmount','Narration'];
                    
                    const formattedData = data.map(row => {
                        return {
                            ...row,
                            TaxableAmount: parseFloat(row.TaxableAmount || 0),
                            CGST: parseFloat(row.CGST || 0),
                            SGST: parseFloat(row.SGST || 0),
                            IGST: parseFloat(row.IGST || 0),
                            Bill_Amount: parseFloat(row.Bill_Amount || 0),
                            Quintal: parseFloat(row.Quintal || 0),
                            Rate: parseFloat(row.Rate || 0)
                        };
                    });

                    const totals = formattedData.reduce((acc, row) => {
                        acc.Quintal += row.Quintal || 0;
                        acc.TaxableAmount += row.TaxableAmount || 0;
                        acc.CGST += row.CGST || 0;
                        acc.SGST += row.SGST || 0;
                        acc.IGST += row.IGST || 0;
                        acc.Bill_Amount += row.Bill_Amount || 0;
                        return acc;
                    }, {
                        Quintal: 0,
                        TaxableAmount: 0,
                        CGST: 0,
                        SGST: 0,
                        IGST: 0,
                        Bill_Amount: 0
                    });

                    formattedData.push({
                        SR_No: 'Totals',
                        Quintal: totals.Quintal.toFixed(2),
                        TaxableAmount: totals.TaxableAmount.toFixed(2),
                        CGST: totals.CGST.toFixed(2),
                        SGST: totals.SGST.toFixed(2),
                        IGST: totals.IGST.toFixed(2),
                        Bill_Amount: totals.Bill_Amount.toFixed(2)
                    });

                    const ws = XLSX.utils.json_to_sheet(formattedData, { header: columnOrder, skipHeader: false });
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'OtherPurchaseSummary');
                    
                    XLSX.writeFile(wb, 'OtherPurchaseSummary.xlsx');
                };

                    </script>
                </body>
            </html>
        `);
        newWindow.document.close();
    };

    const calculateTotals = (data) => {
        let totals = {
            TaxableAmount: 0,
            CGST: 0,
            SGST: 0,
            IGST: 0,
            Bill_Amount: 0,
        };

        data.forEach(row => {
            totals.TaxableAmount += parseFloat(row.TaxableAmount || 0);
            totals.CGST += parseFloat(row.CGST || 0);
            totals.SGST += parseFloat(row.SGST || 0);
            totals.IGST += parseFloat(row.IGST || 0);
            totals.Bill_Amount += parseFloat(row.Bill_Amount || 0);
        });

        return totals;
    };

    return (
        <div className="d-flex flex-column align-items-center" style={{ marginTop: '20px' }}>
            <button
                variant="contained"
                color="primary"
                onClick={fetchOtherPurchaseSummary}
                disabled={loading}
                style={{
                    width: '20%',  
                    height: '60px',  
                }}
            >
                {loading ? <CircularProgress size={24} /> : 'Other Purchase Summary'}
            </button>

            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default OtherPurchaseSummary;
