import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API;

const PurchaseTCSSummary = ({ fromDate, toDate, companyCode, yearCode ,Tran_type,accode}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDataFetched, setIsDataFetched] = useState(false);

    const fetchPurchaseTCSSummary = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(`${API_URL}/PurchaseTCS-summary`, {
                params: {
                    from_date: fromDate,
                    to_date: toDate,
                    Company_Code: companyCode,
                    Year_Code: yearCode,
                    Tran_type : Tran_type,
                    accode :accode
                },
            });
            if (response.data.length === 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Data Not Found.!',
                    text: 'No Purchase TCS data found for the selected date range.',
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

    const exportToXlsx = () => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'PurchaseTCSSummary');
        XLSX.writeFile(wb, 'PurchaseTCSSummary.xlsx');
    };

    const exportToCsv = () => {
        if (!data || data.length === 0) {
            console.error("No data to export");
            return;
        }
    
        const columnOrder = Object.keys(data[0]);

        const ws = XLSX.utils.json_to_sheet(data, { header: columnOrder, skipHeader: false });
    
        const csv = XLSX.utils.sheet_to_csv(ws);
    
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "PurchaseTCSSummary.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    // Define the column order explicitly
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
        'TCS',  
    ];

    // Calculate totals for Quintal, TaxableAmount, CGST, SGST, IGST, and Payable_Amount
    const calculateTotals = () => {
        let totals = {
            Taxable_Amt: 0,
            CGST: 0,
            SGST: 0,
            IGST: 0,
            Bill_Amt: 0
        };
        return totals;
    };

    const totals = calculateTotals();

    return (
        <div className="d-flex flex-column align-items-center" style={{ marginTop: '20px' }}>
            <button
                className="btn btn-primary"
                onClick={fetchPurchaseTCSSummary}
                disabled={loading}
                style={{
                    width: '20%',  
                    height: '60px',  
                }}
            >
                {loading ? 'Loading...' : 'Purchase TCS Summary'}
            </button>

            {isDataFetched && (
                <button className="btn btn-success mt-3" style={{ float: 'left' }} onClick={exportToCsv}>
                    Export to CSV
                </button>
                
            )}

            {error && <div className="alert alert-danger">{error}</div>}

            {data.length > 0 && (
                <>
                    <table className="table table-bordered mt-3" style={{ width: '80%' }}>
                        <thead>
                            <tr>
                                {columns.map((column) => (
                                    <th key={column}>{column}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr key={index}>
                                    {columns.map((column, idx) => (
                                        <td key={idx}>{row[column] || ''}</td>
                                    ))}
                                </tr>
                            ))}

                            {/* <tr >
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }} colSpan="6"></td>
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}></td>
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>{totals.TaxableAmount.toFixed(2)}</td>
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>{totals.CGST.toFixed(2)}</td>
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>{totals.SGST.toFixed(2)}</td>
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>{totals.IGST.toFixed(2)}</td>
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>{totals.Bill_Amount.toFixed(2)}</td>
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}></td>
                            </tr> */}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

export default PurchaseTCSSummary;

