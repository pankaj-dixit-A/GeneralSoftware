import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount"
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API;

const CreateB2ClFile = ({ fromDate, toDate, companyCode, yearCode }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDataFetched, setIsDataFetched] = useState(false);

    const fetchCreateB2ClFile = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(`${API_URL}/CreateB2ClFileData-summary`, {
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
                    text: 'No CreateB2ClFile data found for the selected date range.',
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
            'Invoice Number',
            'Invoice date',
            'Invoice Value',
            'Place Of Supply',
            'Rate',
            'Taxable Value',
            'Cess Amount',
            'E-Commerce GSTIN'
        ];

        newWindow.document.write(`
            <html>
                <head>
                    <title>Create B2Cl Report</title>
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
                    </style>
                </head>
                <body>
                    <h2>Create B2Cl File Report</h2>
                    <button class="export-btn" onclick="window.exportToXlsx()">Export to Excel</button>
                    <table>
                        <thead>
                            <tr>
                                ${columns.map((column) => `<th>${column}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(row => {
                                return `
                                    <tr>
                                     ${columns.map(column => {
                                     if (['Taxable Value', 'Invoice Value'].includes(column)) {
                                        return `<td style="text-align: right;>${formatReadableAmount(row[column] || 0)}</td>`;
                                       } else {
                                     return `<td>${row[column] || ''}</td>`;
                                      }
                                      }).join('')}
                                   </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    <script>
                        window.exportToXlsx = function() {
                            const data = ${JSON.stringify(data)};
                            const columnOrder = ['Invoice Number','Invoice date','Invoice Value','Place Of Supply','Rate','Taxable Value','Cess Amount','E-Commerce GSTIN'];
                            const ws = XLSX.utils.json_to_sheet(data, { header: columnOrder, skipHeader: false });
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, 'B2Cl Report');
                            XLSX.writeFile(wb, 'B2ClFile.xlsx');
                        };
                    </script>
                </body>
            </html>
        `);

        newWindow.document.close();
    };

    return (
        <div className="d-flex flex-column align-items-center" style={{ marginTop: '20px' }}>
            <button
                className="btn btn-primary"
                onClick={fetchCreateB2ClFile}
                disabled={loading}
                style={{
                    width: '20%',  
                    height: '60px',  
                }}
            >
                {loading ? 'Loading...' : 'Create B2Cl File'}
            </button>

            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default CreateB2ClFile;
