import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import { CircularProgress } from '@mui/material';
import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount"
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API;

const SaleBillSummary = ({ fromDate, toDate, companyCode, yearCode, accode }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDataFetched, setIsDataFetched] = useState(false);

    const fetchSaleBillSummary = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(`${API_URL}/salebill-summary`, {
                params: {
                    fromDate: fromDate,
                    toDate: toDate,
                    Company_Code: companyCode,
                    Year_Code: yearCode,
                    accode: accode
                },
            });
            if (response.data.length === 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Data Not Found.!',
                    text: 'No Sale bill data found for the selected date range.',
                });
                return;
            }
            setData(response.data);
            setIsDataFetched(true);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        'SR_No',
        'Invoice_No',
        'PartyGSTNo',
        'PartyCode',
        'PartyName',
        'Mill_Name',
        'billtogststatecode',
        'Invoice_Date',
        'Vehicle_No',
        'Quintal',
        'Rate',
        'TaxableAmount',
        'CGST',
        'SGST',
        'IGST',
        'Payable_Amount',
        'DO_No',
        'ACKNo'
    ];

    const calculateTotals = () => {
        let totals = {
            Quintal: 0,
            TaxableAmount: 0,
            CGST: 0,
            SGST: 0,
            IGST: 0,
            Payable_Amount: 0
        };

        data.forEach(row => {
            totals.Quintal += parseFloat(row.Quintal || 0);
            totals.TaxableAmount += parseFloat(row.TaxableAmount || 0);
            totals.CGST += parseFloat(row.CGST || 0);
            totals.SGST += parseFloat(row.SGST || 0);
            totals.IGST += parseFloat(row.IGST || 0);
            totals.Payable_Amount += parseFloat(row.Payable_Amount || 0);
        });

        return totals;
    };

    const totals = calculateTotals();

    useEffect(() => {
        if (isDataFetched && !error) {
            openNewWindow();
            setIsDataFetched(false);
        }
    }, [isDataFetched, error]);

    const openNewWindow = () => {
        const newWindow = window.open('', '_blank');
        const htmlContent = `
            <html>
                <head>
                    <title>Sale Bill Summary</title>
                      <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h2 { text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f4f4f4; }
                        .export-btn { display: block; margin: 20px auto; padding: 10px 15px; font-size: 16px; background-color: green; color: white; border: none; cursor: pointer; }
                    </style>
                </head>
                <body>
                    <h2>Sale Bill Summary</h2>
                    <button class="export-btn" onclick="exportToXlsx()">Export to XLSX</button>
                    
                    <table>
                        <thead>
                            <tr>
                                ${columns.map(column => `<th style="text-align: center;">${column}</th>`).join('')}
                            </tr>
                        </thead>
                      <tbody>
                        ${data.map(row => `
                            <tr>
                                ${columns.map(column => {
            if (['TaxableAmount', 'CGST', 'SGST', 'IGST', 'Payable_Amount'].includes(column)) {
                return `<td style="text-align: right;">${formatReadableAmount(row[column] || 0)}</td>`;
            } else {
                return `<td>${row[column] || ''}</td>`;
            }
        }).join('')}
                            </tr>
                        `).join('')}
                        <tr class="total-row" colspan="11" style="font-weight: bold; background-color: yellow;">
                            <td colspan="9"></td>
                            <td style="text-align: right;">${formatReadableAmount(totals.Quintal.toFixed(2))}</td>
                            <td></td>
                            <td style="text-align: right;">${formatReadableAmount(totals.TaxableAmount.toFixed(2))}</td>
                            <td style="text-align: right;">${formatReadableAmount(totals.CGST.toFixed(2))}</td>
                            <td style="text-align: right;">${formatReadableAmount(totals.SGST.toFixed(2))}</td>
                            <td style="text-align: right;">${formatReadableAmount(totals.IGST.toFixed(2))}</td>
                            <td style="text-align: right;">${formatReadableAmount(totals.Payable_Amount.toFixed(2))}</td>
                            <td style="text-align: right;"></td>
                        </tr>
                    </tbody>
                    </table>
                    <script>
                    window.exportToXlsx = function() {
                    const data = ${JSON.stringify(data)};
                    const columnOrder = ['SR_No','Invoice_No','PartyGSTNo','PartyCode','PartyName','Mill_Name','billtogststatecode','Invoice_Date','Vehicle_No','Quintal','Rate','TaxableAmount','CGST','SGST','IGST','Payable_Amount','DO_No','ACKNo'];
                    
                    const formattedData = data.map(row => {
                        return {
                            ...row,
                            TaxableAmount: parseFloat(row.TaxableAmount || 0),
                            CGST: parseFloat(row.CGST || 0),
                            SGST: parseFloat(row.SGST || 0),
                            IGST: parseFloat(row.IGST || 0),
                            Payable_Amount: parseFloat(row.Payable_Amount || 0),
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
                        acc.Payable_Amount += row.Payable_Amount || 0;
                        return acc;
                    }, {
                        Quintal: 0,
                        TaxableAmount: 0,
                        CGST: 0,
                        SGST: 0,
                        IGST: 0,
                        Payable_Amount: 0
                    });

                    formattedData.push({
                        SR_No: 'Totals',
                        Quintal: totals.Quintal.toFixed(2),
                        TaxableAmount: totals.TaxableAmount.toFixed(2),
                        CGST: totals.CGST.toFixed(2),
                        SGST: totals.SGST.toFixed(2),
                        IGST: totals.IGST.toFixed(2),
                        Payable_Amount: totals.Payable_Amount.toFixed(2)
                    });

                    const ws = XLSX.utils.json_to_sheet(formattedData, { header: columnOrder, skipHeader: false });
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'SaleBillSummary');
                    
                    XLSX.writeFile(wb, 'SaleBillSummary.xlsx');
                };
                    </script>
                </body>
            </html>
        `;
        newWindow.document.write(htmlContent);
        newWindow.document.close();
    };

    return (
        <div className="d-flex flex-column align-items-center" style={{ marginTop: '20px' }}>
            <button
                variant="contained"
                color="primary"
                onClick={fetchSaleBillSummary}
                disabled={loading}
                style={{
                    width: '15%',
                    height: '60px',
                }}
            >
                {loading ? <CircularProgress size={24} /> : 'Sale Bill Summary'}
            </button>

            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default SaleBillSummary;
