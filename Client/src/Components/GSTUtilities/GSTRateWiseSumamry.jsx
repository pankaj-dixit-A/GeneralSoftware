import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { CircularProgress } from '@mui/material';
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API;

const GSTRateWiseSummary = ({ fromDate, toDate, companyCode, yearCode, GSTRate }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isDataFetched, setIsDataFetched] = useState(false);

    const fetchGSTRateWiseSummary = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await axios.get(`${API_URL}/GSTRateWise-summary`, {
                params: {
                    from_date: fromDate,
                    to_date: toDate,
                    Company_Code: companyCode,
                    Year_Code: yearCode,
                    GSTRate: GSTRate
                },
            });
            if (response.data.length === 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Data Not Found.!',
                    text: 'No GSTRateWise data found for the selected date range.',
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
        const newTab = window.open('', '_blank');
        const tableHTML = generateTableHTML(data);
        newTab.document.write(tableHTML);
        newTab.document.close();
    };

    const generateTableHTML = (data) => {
        const columns = [
            'SR_No',
            'InvoiceNo',
            'date',
            'Name_Of_Party',
            'HSN_NO',
            'TaxableAmt',
            'CGST',
            'SGST',
            'IGST',
            'TCS',
            'Qntl'
        ];

        const totals = calculateTotals(data);

        let tableHTML = `
            <html>
                <head>
                    <title>GSTRateWise Summary</title>
                    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
                    <style>
                        body { font-family: Arial, sans-serif; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { padding: 10px; border: 1px solid #ddd; text-align: center; }
                        th { background-color: #f2f2f2; }
                        .total-row { background-color: #ffff99; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div  mt-2">
                        <div class="d-flex flex-column align-items-center" style="text-align: center; ">
                            <h3>GSTRateWise Summary</h3>
                            <button class="btn btn-success mt-3" onclick="exportToCSV()">Export to CSV</button>
                        </div>

                        <table class="table table-bordered">
                            <thead>
                                <tr>
                                    ${columns.map(column => `<th>${column}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map(row => {
            return `
                                    <tr>
                                        ${columns.map(column => `<td>${row[column] || ''}</td>`).join('')}
                                    </tr>
                                    `;
        }).join('')}
                                <tr class="total-row">
                                    <td colspan="5"></td>
                                    <td >${totals.TaxableAmt.toFixed(2)}</td>
                                    <td>${totals.CGST.toFixed(2)}</td>
                                    <td>${totals.SGST.toFixed(2)}</td>
                                    <td>${totals.IGST.toFixed(2)}</td>
                                    <td>${totals.TCS.toFixed(2)}</td>
                                    <td>${totals.Qntl.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                        
                    </div>
                    <script>
                        function exportToCSV() {
                            const rows = [];
                            const columns = ${JSON.stringify(columns)};
                            const data = ${JSON.stringify(data)};
                            rows.push(columns.join(","));
                            data.forEach(row => {
                                rows.push(columns.map(col => row[col] || '').join(","));
                            });
                            rows.push(columns.slice(0, 5).join(",") + "," + ${totals.TaxableAmt.toFixed(2)} + "," + ${totals.CGST.toFixed(2)} + "," + ${totals.SGST.toFixed(2)} + "," + ${totals.IGST.toFixed(2)} + "," + ${totals.TCS.toFixed(2)} + "," + ${totals.Qntl.toFixed(2)});
                            
                            const csvContent = rows.join("\\n");
                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const link = document.createElement("a");
                            link.href = URL.createObjectURL(blob);
                            link.setAttribute("download", "GSTRateWiseSummary.csv");
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                    </script>
                </body>
            </html>
        `;
        return tableHTML;
    };

    const calculateTotals = (data) => {
        let totals = {
            TaxableAmt: 0,
            CGST: 0,
            SGST: 0,
            IGST: 0,
            TCS: 0,
            Qntl: 0
        };

        data.forEach(row => {
            totals.TaxableAmt += parseFloat(row.TaxableAmt || 0);
            totals.CGST += parseFloat(row.CGST || 0);
            totals.SGST += parseFloat(row.SGST || 0);
            totals.IGST += parseFloat(row.IGST || 0);
            totals.TCS += parseFloat(row.TCS || 0);
            totals.Qntl += parseFloat(row.Qntl || 0);
        });

        return totals;
    };

    return (
        <div className="d-flex flex-column align-items-center" style={{ marginTop: '20px' }}>
            <button
                variant="contained"
                color="primary"
                onClick={fetchGSTRateWiseSummary}
                disabled={loading}
                style={{
                    width: '20%',
                    height: '60px',
                }}
            >
                {loading ? <CircularProgress size={24} /> : 'GSTRate Summary'}
            </button>

            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default GSTRateWiseSummary;
