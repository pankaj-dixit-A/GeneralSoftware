import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount"
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API;

const CreditnoteSummary = ({ fromDate, toDate, companyCode, yearCode }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDataFetched, setIsDataFetched] = useState(false);

    const fetchCreditnoteSummary = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(`${API_URL}/Creditnote-summary`, {
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
                    text: 'No Credit Note data found for the selected date range.',
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
        XLSX.utils.book_append_sheet(wb, ws, 'CreditnoteSummary');
        XLSX.writeFile(wb, 'CreditnoteSummary.xlsx');
    };

    const columns = [
        'SR_No',
        'CreditNote_No',
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

    return (
        <div className="d-flex flex-column align-items-center" style={{ marginTop: '20px' }}>
            <button
                className="btn btn-primary"
                onClick={fetchCreditnoteSummary}
                disabled={loading}
                style={{
                    width: '20%',
                    height: '60px',
                }}
            >
                {loading ? 'Loading...' : 'Credit note Summary'}
            </button>

            {isDataFetched && (
                <button className="btn btn-success mt-3" style={{ float: 'left' }} onClick={exportToXlsx}>
                    Export to XLSX
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

                            <tr >
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }} colSpan="11"></td>
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>{totals.Quintal.toFixed(2)}</td>
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}></td>
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>{totals.TaxableAmount.toFixed(2)}</td>
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>{totals.CGST.toFixed(2)}</td>
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>{totals.SGST.toFixed(2)}</td>
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>{totals.IGST.toFixed(2)}</td>
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>{totals.Final_Amount.toFixed(2)}</td>
                                <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}></td>
                            </tr>
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

export default CreditnoteSummary;

