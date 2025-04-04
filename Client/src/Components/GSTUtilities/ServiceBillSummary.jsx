import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount"
import { CircularProgress } from '@mui/material';

const API_URL = process.env.REACT_APP_API;

const ServiceBillSummary = ({ fromDate, toDate, companyCode, yearCode }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDataFetched, setIsDataFetched] = useState(false);

    const fetchServiceBillSummary = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(`${API_URL}/ServiceBill-summary`, {
                params: {
                    from_date: fromDate,
                    to_date: toDate,
                    Company_Code: companyCode,
                    Year_Code: yearCode,
                },
            });
            setData(response.data);
            setIsDataFetched(true);
            openInNewWindow(response.data);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const openInNewWindow = (data) => {
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
            'Final_Amount',
            'ACKNo',
        ];

        const totals = calculateTotals(data);

        newWindow.document.write(`
            <html>
                <head>
                    <title>Service Bill Summary</title>
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
                    <h2>Service Bill Summary Report</h2>
                    <button class="export-btn" onclick="window.exportToXlsx()">Export to XLSX</button>
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
                                         if (['TaxableAmount', 'CGST', 'SGST', 'IGST', 'Final_Amount'].includes(column)) {
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
                                <td colspan="7">Totals</td>
                                <td style="text-align: right;">${formatReadableAmount(totals.TaxableAmount.toFixed(2))}</td>
                                <td style="text-align: right;">${formatReadableAmount(totals.CGST.toFixed(2))}</td>
                                <td style="text-align: right;">${formatReadableAmount(totals.SGST.toFixed(2))}</td>
                                <td style="text-align: right;">${formatReadableAmount(totals.IGST.toFixed(2))}</td>
                                <td style="text-align: right;">${formatReadableAmount(totals.Final_Amount.toFixed(2))}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                    <script>
                    window.exportToXlsx = function() {
                        const data = ${JSON.stringify(data)};
                        const columnOrder = ['SR_No','Invoice_No','PartyGSTNo','PartyCode','PartyName','PartyStateCode','Invoice_Date','TaxableAmount','CGST','SGST','IGST','Final_Amount','ACKNo',];
                        
                        const formattedData = data.map(row => {
                            return {
                                ...row,
                                TaxableAmount: parseFloat(row.TaxableAmount || 0),
                                CGST: parseFloat(row.CGST || 0),
                                SGST: parseFloat(row.SGST || 0),
                                IGST: parseFloat(row.IGST || 0),
                                Final_Amount: parseFloat(row.Final_Amount || 0),
                            };
                        });
    
                        const totals = formattedData.reduce((acc, row) => {
                            acc.TaxableAmount += row.TaxableAmount || 0;
                            acc.CGST += row.CGST || 0;
                            acc.SGST += row.SGST || 0;
                            acc.IGST += row.IGST || 0;
                            acc.Final_Amount += row.Final_Amount || 0;
                            return acc;
                        }, {
                            TaxableAmount: 0,
                            CGST: 0,
                            SGST: 0,
                            IGST: 0,
                            Bill_Amount: 0,
                            Final_Amount: 0
                        });
    
                        formattedData.push({
                            SR_No: 'Totals',
                            TaxableAmount: totals.TaxableAmount.toFixed(2),
                            CGST: totals.CGST.toFixed(2),
                            SGST: totals.SGST.toFixed(2),
                            IGST: totals.IGST.toFixed(2),
                            Final_Amount: totals.Final_Amount.toFixed(2)
                        });
    
                        const ws = XLSX.utils.json_to_sheet(formattedData, { header: columnOrder, skipHeader: false });
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, 'ServiceBillSummary');
                        
                        XLSX.writeFile(wb, 'ServiceBillSummary.xlsx');
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
            Final_Amount: 0,
        };

        data.forEach(row => {
            totals.TaxableAmount += parseFloat(row.TaxableAmount || 0);
            totals.CGST += parseFloat(row.CGST || 0);
            totals.SGST += parseFloat(row.SGST || 0);
            totals.IGST += parseFloat(row.IGST || 0);
            totals.Final_Amount += parseFloat(row.Final_Amount || 0);
        });
        return totals;
    };

    return (
        <div className="d-flex flex-column align-items-center" style={{ marginTop: '20px' }}>
            <button
                variant="contained"
                color="primary"
                onClick={fetchServiceBillSummary}
                disabled={loading}
            >
                {loading ? <CircularProgress size={24} /> : 'ServiceBill Summary'}
            </button>

            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default ServiceBillSummary;
