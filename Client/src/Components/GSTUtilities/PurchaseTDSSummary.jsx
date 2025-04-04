import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Button, CircularProgress, Alert } from '@mui/material';
import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount"
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API;

const PurchaseTDSSummary = ({ fromDate, toDate, companyCode, yearCode, Tran_type, accode }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDataFetched, setIsDataFetched] = useState(false);

    const fetchPurchaseTDSSummary = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(`${API_URL}/PurchaseTDS-summary`, {
                params: {
                    from_date: fromDate,
                    to_date: toDate,
                    Company_Code: companyCode,
                    Year_Code: yearCode,
                    Tran_type: Tran_type,
                    accode: accode
                },
            });
            if (response.data.length === 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Data Not Found.!',
                    text: 'No Purchase TDS data found for the selected date range.',
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
            'SR_No',
            'PSNo',
            'date',
            'Name Of Party',
            'Pan',
            'Tan',
            'Address',
            'Net',
            'CGST',
            'SGST',
            'IGST',
            'TDS',
        ];

        newWindow.document.write(`
            <html>
                <head>
                    <title>Purchase TDS Summary</title>
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
                    <h2>Purchase TDS Summary Report</h2>
                    <button class="export-btn" onclick="window.exportToCsv()">Export to CSV</button>
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
                if (['Net', 'CGST', 'SGST', 'IGST', 'TDS'].includes(column)) {
                    return `<td style="text-align: right;">${formatReadableAmount(row[column] || 0)}</td>`;
                } else {
                    return `<td>${row[column] || ''}</td>`;
                }
            }).join('')}
                                    </tr>`;
        }).join('')}
                        </tbody>
                    </table>
                    <script>
                        window.exportToCsv = function() {
                            const data = ${JSON.stringify(data)};
                            const columnOrder = ['SR_No', 'PSNo', 'date', 'Name Of Party', 'Pan', 'Tan', 'Address','Net', 'CGST', 'SGST', 'IGST', 'TDS' ];
                            const ws = XLSX.utils.json_to_sheet(data, { header: columnOrder, skipHeader: false });
                            const csv = XLSX.utils.sheet_to_csv(ws);
                            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                            const link = document.createElement("a");
                            link.href = URL.createObjectURL(blob);
                            link.setAttribute("download", "PurchaseTDSSummary.csv");
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

    return (
        <div style={{ marginTop: '20px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Button
                variant="contained"
                color="primary"
                onClick={fetchPurchaseTDSSummary}
                disabled={loading}
                style={{
                    width: '20%',
                    height: '60px',
                }}
            >
                {loading ? <CircularProgress size={24} /> : 'Purchase TDS Summary'}
            </Button>

            {error && <Alert severity="error">{error}</Alert>}
        </div>
    );
};

export default PurchaseTDSSummary;
