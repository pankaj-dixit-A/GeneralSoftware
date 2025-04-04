import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API;

const ShowEntryNo = ({ fromDate, toDate, companyCode, yearCode }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchShowEntryNo = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(`${API_URL}/ShowEntryNo-summary`, {
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
                    text: 'No ShowEntryNo data found for the selected date range.',
                });
                return;
            }
            setData(response.data);
            openReportInNewTab(response.data);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const openReportInNewTab = (reportData) => {
        const newTab = window.open('', '_blank');
        if (newTab) {
            const reportHtml = `
                <html>
                    <head>
                        <title>Show Entry No Report</title>
                        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
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
                        <div class="container mt-4">
                            <h3 class="text-center">Show Entry No Report</h3>
                            <button class="export-btn" onclick="downloadCSV()">Export to CSV</button>
                            <table class="table table-bordered">
                                <thead>
                                    <tr>
                                        <th style="text-align: center;">Nature of Document</th>
                                        <th style="text-align: center;">Sr. No. From</th>
                                        <th style="text-align: center;">Sr. No. To</th>
                                        <th style="text-align: center;">Total Number</th>
                                        <th style="text-align: center;">Cancelled</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${reportData.map(row => `
                                        <tr>
                                            <td style="text-align: center;>${row["Nature of Document"] || ''}</td>
                                            <td style="text-align: center;>${row["Sr. No. From"] || ''}</td>
                                            <td style="text-align: center;>${row["Sr. No. To"] || ''}</td>
                                            <td style="text-align: center;>${row["Total Number"] || ''}</td>
                                            <td style="text-align: center;>${row["Cancelled"] || ''}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        <script>
                            function downloadCSV() {
                                const csvData = \`${JSON.stringify(reportData)}\`;
                                const parsedData = JSON.parse(csvData);
                                const columnOrder = ["Nature of Document","Sr. No. From","Sr. No. To","Total Number","Cancelled"]
                                const ws = XLSX.utils.json_to_sheet(parsedData, { header: columnOrder, skipHeader: false });
                                const csv = XLSX.utils.sheet_to_csv(ws);
                                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                                const link = document.createElement("a");
                                link.href = URL.createObjectURL(blob);
                                link.setAttribute("download", "ShowEntryNo.csv");
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }
                        </script>
                        <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.16.9/xlsx.full.min.js"></script>
                    </body>
                </html>
            `;
            newTab.document.write(reportHtml);
            newTab.document.close();
        } else {
            alert("Please allow pop-ups for this site to view the report.");
        }
    };

    return (
        <div className="d-flex flex-column align-items-center" style={{ marginTop: '20px' }}>
            <button className="btn btn-primary mb-3" onClick={fetchShowEntryNo} disabled={loading} style={{
                width: '20%',
                height: '60px',
            }}>
                {loading ? 'Loading...' : 'ShowEntryNo'}
            </button>
            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default ShowEntryNo;
