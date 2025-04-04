import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Button, CircularProgress, Alert, Box } from '@mui/material';
import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount"
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API;

const SaleTCSSummary = ({ fromDate, toDate, companyCode, yearCode, Tran_type, accode }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchSaleTCSSummary = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await axios.get(`${API_URL}/SaleTCS-summary`, {
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
                    text: 'No Sale TCS data found for the selected date range.',
                });
                return;
            }

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

        const exportCsvScript = `
    function exportToCsv() {
        const data = ${JSON.stringify(data)};
        const columnOrder = ["SR_No", "InvoiceNo", "date", "Name Of Party", "Pan", "Tan", "Address", "Taxable_Amt", "CGST", "SGST", "IGST", "Bill_Amt", "TCS"];
        const ws = XLSX.utils.json_to_sheet(data, { header: columnOrder, skipHeader: false });
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "SaleTCSSummary.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
`;

        newWindow.document.write(`
            <html>
                <head>
                    <title>Sale TCS Summary</title>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
                    <script>${exportCsvScript}</script>
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
                    <h2>Sale TCS Summary Report</h2>
                    <button class="export-btn" onclick="exportToCsv()">Export to CSV</button>
                    <table>
                        <thead>
                            <tr >
                                <th style="text-align: center;">SR_No</th>
                                <th style="text-align: center;">Invoice No</th>
                                <th style="text-align: center;">Date</th>
                                <th style="text-align: center;">Name Of Party</th>
                                <th style="text-align: center;">Pan</th>
                                <th style="text-align: center;">Tan</th>
                                <th style="text-align: center;">Address</th>
                                <th style="text-align: center;">Taxable Amt</th>
                                <th style="text-align: center;">CGST</th>
                                <th style="text-align: center;">SGST</th>
                                <th style="text-align: center;">IGST</th>
                                <th style="text-align: center;">Bill Amt</th>
                                <th style="text-align: center;">TCS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(row => `
                                <tr>
                                    <td>${row.SR_No || ''}</td>
                                    <td>${row.InvoiceNo || ''}</td>
                                    <td>${row.date || ''}</td>
                                    <td>${row["Name Of Party"] || ''}</td>
                                    <td>${row.Pan || ''}</td>
                                    <td>${row.Tan || ''}</td>
                                    <td>${row.Address || ''}</td>
                                    <td style="text-align: right;">${formatReadableAmount(row.Taxable_Amt || '')}</td>
                                    <td style="text-align: right;">${formatReadableAmount(row.CGST || '')}</td>
                                    <td style="text-align: right;">${formatReadableAmount(row.SGST || '')}</td>
                                    <td style="text-align: right;">${formatReadableAmount(row.IGST || '')}</td>
                                    <td style="text-align: right;">${formatReadableAmount(row.Bill_Amt || '')}</td>
                                    <td style="text-align: right;">${formatReadableAmount(row.TCS || '')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `);

        newWindow.document.close();
    };

    return (
        <Box sx={{ textAlign: 'center', marginTop: '20px' }}>
            <Button
                variant="contained"
                color="primary"
                onClick={fetchSaleTCSSummary}
                disabled={loading}
                style={{
                    width: '15%',
                    height: '60px',
                }}
            >
                {loading ? <CircularProgress size={24} /> : 'Sale TCS Summary'}
            </Button>

            {error && <Alert severity="error" sx={{ marginTop: 2 }}>{error}</Alert>}
        </Box>
    );
};

export default SaleTCSSummary;
