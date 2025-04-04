import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount"
import { CircularProgress } from '@mui/material';
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API;

const DebitnoteSummary = ({ fromDate, toDate, companyCode, yearCode, accode }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDataFetched, setIsDataFetched] = useState(false);

    const fetchDebitnoteSummary = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(`${API_URL}/Debitnote-summary`, {
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
                    text: 'No Debit Note data found for the selected date range.',
                });
                return;
            }
            setData(response.data);
            setIsDataFetched(true);
            openNewWindow(response.data);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        'SR_No',
        'DebitNote_No',
        'PartyGSTNo',
        'PartyCode',
        'PartyName',
        'PartyStateCode',
        'Date',
        'Quintal',
        'Rate',
        'TaxableAmount',
        'CGST',
        'SGST',
        'IGST',
        'Final_Amount',
        'ACKNO'
    ];

    const calculateTotals = () => {
        let totals = {
            Quintal: 0,
            TaxableAmount: 0,
            CGST: 0,
            SGST: 0,
            IGST: 0,
            Final_Amount: 0
        };

        data.forEach(row => {
            totals.Quintal += parseFloat(row.Quintal || 0);
            totals.TaxableAmount += parseFloat(row.TaxableAmount || 0);
            totals.CGST += parseFloat(row.CGST || 0);
            totals.SGST += parseFloat(row.SGST || 0);
            totals.IGST += parseFloat(row.IGST || 0);
            totals.Final_Amount += parseFloat(row.Final_Amount || 0);
        });

        return totals;
    };

    const totals = calculateTotals();

    const openNewWindow = (data) => {
        const newWindow = window.open('', '_blank');
        const htmlContent = `
            <html>
                <head>
                    <title>Debitnote Summary</title>
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
                    <h2>Debitnote Summary</h2>
                    <button class="export-btn" onclick="exportToXlsx()">Export to XLSX</button>
                    
                    <table>
                        <thead>
                            <tr>
                                ${columns.map(column => `<th style="text-align: center;">${column}</th>`).join('')}
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
                                                                                                       </tr>`;
        }).join('')}
                                           
                            <tr>
                                <td colspan="7" style="font-weight: bold; background-color: yellow;"></td>
                                <td style="font-weight: bold; background-color: yellow; text-align: right;">${totals.Quintal.toFixed(2)}</td>
                                <td></td>
                                <td style="font-weight: bold; background-color: yellow; text-align: right;">${totals.TaxableAmount.toFixed(2)}</td>
                                <td style="font-weight: bold; background-color: yellow; text-align: right;">${totals.CGST.toFixed(2)}</td>
                                <td style="font-weight: bold; background-color: yellow; text-align: right;">${totals.SGST.toFixed(2)}</td>
                                <td style="font-weight: bold; background-color: yellow; text-align: right;">${totals.IGST.toFixed(2)}</td>
                                <td style="font-weight: bold; background-color: yellow; text-align: right;">${totals.Final_Amount.toFixed(2)}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                    <script>
                    window.exportToXlsx = function() {
                    const data = ${JSON.stringify(data)};
                    const columnOrder = [ 'SR_No','DebitNote_No','PartyGSTNo','PartyCode','PartyName','PartyStateCode','Date','Quintal','Rate','TaxableAmount','CGST','SGST','IGST','Final_Amount','ACKNO'];
                    
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
                    XLSX.utils.book_append_sheet(wb, ws, 'Debitnote');
                    
                    XLSX.writeFile(wb, 'Debitnote.xlsx');
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
                onClick={fetchDebitnoteSummary}
                disabled={loading}
                style={{
                    width: '20%',
                    height: '60px',
                }}
            >
                {loading ? <CircularProgress size={24} /> : 'Debitnote Summary'}
            </button>
            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default DebitnoteSummary;
