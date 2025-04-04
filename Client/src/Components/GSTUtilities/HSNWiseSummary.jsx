import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount"
import { CircularProgress } from '@mui/material';
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API;

const HSNWiseSummary = ({ fromDate, toDate, companyCode, yearCode }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDataFetched, setIsDataFetched] = useState(false);

    const fetchHSNWiseSummary = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(`${API_URL}/HSNWise-summary`, {
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
                    text: 'No HSNWISE data found for the selected date range.',
                });
                return;
            }
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
            'HSN',
            'Quantal',
            'TaxableAmount',
            'CGST',
            'SGST',
            'IGST',
            'TCSAmt',
            'TDSAMT',
            'NetPayable',
        ];

        const totals = calculateTotals(data);

        newWindow.document.write(`
            <html>
                <head>
                    <title>HSN Wise Summary</title>
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
                    <h2>HSN Wise Summary Report</h2>
                    <button class="export-btn" onclick="window.exportToCsv()">Export to CSV</button>
                    <table>
                        <thead>
                            <tr style="text-align: right;">
                                ${columns.map((column) => `<th style="text-align: center;">${column}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(row => {
            return `  
                                    <tr>
                                        <td style="text-align: center;">${row.HSN}</td>
                                        <td style="text-align: right;">${formatReadableAmount(row.Quantal || '')}</td>
                                        <td style="text-align: right;">${formatReadableAmount(row.TaxableAmount || '')}</td> 
                                        <td style="text-align: right;">${formatReadableAmount(row.CgstAmt || '')}</td>
                                        <td style="text-align: right;">${formatReadableAmount(row.SgstAmt || '')}</td> 
                                        <td style="text-align: right;">${formatReadableAmount(row.IgstAmt || '')}</td>
                                        <td style="text-align: right;">${formatReadableAmount(row.TCSAmt || '')}</td>
                                        <td style="text-align: right;">${formatReadableAmount(row.TDSAMT || '')}</td>

                                        <td style="text-align: right;">${formatReadableAmount(row.NetPayable || '')}</td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="total-row">
                                <td>Total</td>
                                <td style="text-align: right;">${formatReadableAmount(totals.Quantal.toFixed(2))}</td>
                                <td style="text-align: right;">${formatReadableAmount(totals.TaxableAmount.toFixed(2))}</td>
                                <td style="text-align: right;">${formatReadableAmount(totals.CgstAmt.toFixed(2))}</td> 
                                <td style="text-align: right;">${formatReadableAmount(totals.SgstAmt.toFixed(2))}</td> 
                                <td style="text-align: right;">${formatReadableAmount(totals.IgstAmt.toFixed(2))}</td>
                                <td style="text-align: right;">${formatReadableAmount(totals.TCSAmt.toFixed(2))}</td>
                                <td style="text-align: right;">${formatReadableAmount(totals.TDSAMT.toFixed(2))}</td>

                                <td style="text-align: right;">${formatReadableAmount(totals.NetPayable.toFixed(2))}</td>
                            </tr>
                        </tfoot>
                    </table>
                    <script>
                    window.exportToCsv = function() {
                        const data = ${JSON.stringify(data)};
                        const columnOrder = ['HSN','BillAmt','CGST','SGST','IGST','TCSAmt','NetPayable'];
                        
                        const formattedData = data.map(row => {
                            return {
                                HSN: row.HSN,
                                BillAmt: parseFloat(row.BillAmt || 0).toFixed(2),
                                CGST: parseFloat(row.CGST || 0).toFixed(2),
                                SGST: parseFloat(row.SGST || 0).toFixed(2),
                                IGST: parseFloat(row.IGST || 0).toFixed(2),
                                TCSAmt: parseFloat(row.TCSAmt || 0).toFixed(2),
                                NetPayable: parseFloat(row.NetPayable || 0).toFixed(2),
                            };
                        });

                        const totals = formattedData.reduce((acc, row) => {
                            acc.BillAmt += parseFloat(row.BillAmt || 0);
                            acc.CGST += parseFloat(row.CGST || 0);
                            acc.SGST += parseFloat(row.SGST || 0);
                            acc.IGST += parseFloat(row.IGST || 0);
                            acc.TCSAmt += parseFloat(row.TCSAmt || 0);
                            acc.NetPayable += parseFloat(row.NetPayable || 0);
                            return acc;
                        }, {
                            BillAmt: 0,
                            CGST: 0,
                            SGST: 0,
                            IGST: 0,
                            TCSAmt: 0,
                            NetPayable: 0,
                        });

                        formattedData.push({
                            HSN: 'Totals',
                            BillAmt: totals.BillAmt.toFixed(2),
                            CGST: totals.CGST.toFixed(2),
                            SGST: totals.SGST.toFixed(2),
                            IGST: totals.IGST.toFixed(2),
                            TCSAmt: totals.TCSAmt.toFixed(2),
                            NetPayable: totals.NetPayable.toFixed(2),
                        });

                        const ws = XLSX.utils.json_to_sheet(formattedData, { header: columnOrder, skipHeader: false });
                        const csv = XLSX.utils.sheet_to_csv(ws);

                        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.setAttribute("download", "HSNWiseSummary.csv");
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
            Quantal: 0,
            TaxableAmount: 0,
            CgstAmt: 0,
            SgstAmt: 0,
            IgstAmt: 0,
            TCSAmt: 0,
            NetPayable: 0,
            TDSAMT: 0
        };

        data.forEach(row => {
            totals.TaxableAmount += parseFloat(row.TaxableAmount || 0);
            totals.CgstAmt += parseFloat(row.CgstAmt || 0);
            totals.SgstAmt += parseFloat(row.SgstAmt || 0);
            totals.IgstAmt += parseFloat(row.IgstAmt || 0);
            totals.TCSAmt += parseFloat(row.TCSAmt || 0);
            totals.NetPayable += parseFloat(row.NetPayable || 0);
            totals.Quantal += parseFloat(row.Quantal || 0);
            totals.TDSAMT += parseFloat(row.TDSAMT || 0);

        });
        return totals;
    };

    return (
        <div className="d-flex flex-column align-items-center" style={{ marginTop: '20px' }}>
            <button
                variant="contained"
                color="primary"
                onClick={fetchHSNWiseSummary}
                disabled={loading}
                style={{
                    width: '20%',
                    height: '60px',
                }}
            >
                {loading ? <CircularProgress size={24} /> : 'HSNWise Summary'}
            </button>

            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default HSNWiseSummary;
