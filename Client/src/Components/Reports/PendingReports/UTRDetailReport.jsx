import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate, useLocation } from 'react-router-dom';

const apikey = process.env.REACT_APP_API;

const PendingReports = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { fromDate, toDate } = location.state || { fromDate: '', toDate: '' };

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailId, setEmailId] = useState('');

    const API_URL = `${apikey}/utr-detail-report`;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear());
        return `${day}/${month}/${year}`;
    };

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await axios.get(API_URL, {
                    params: {
                        from_date: fromDate,
                        to_date: toDate,
                    },
                });
                setReportData(groupReportData(response.data));
            } catch (error) {
                console.error('Error fetching report:', error);
                setError('Error fetching report');
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [API_URL, fromDate, toDate]);

    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(reportData);
        XLSX.utils.book_append_sheet(wb, ws, 'Pending Reports');
        XLSX.writeFile(wb, 'PendingReports.xlsx');
    };

    const handleSendEmail = async () => {
        if (!emailId) {
            setError('Please enter an email address');
            return;
        }

        const pdfBlob = await generatePDF();
        const pdfFileToSend = new File([pdfBlob], 'report.pdf');

        const formData = new FormData();
        formData.append('email', emailId);
        formData.append('pdf', pdfFileToSend);

        try {
            const response = await axios.post(`${apikey}/api/sugarian/send-pdf-email`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert(response.data.message || 'Email sent successfully');
        } catch (error) {
            console.error('Error sending email:', error);
            setError('Failed to send email');
        }
    };

    const handlePrint = () => {
        const printContent = document.getElementById('reportTable').outerHTML;
        const win = window.open('', '', 'height=700,width=900');
        win.document.write('<html><head><title>Print Report</title>');
        win.document.write('</head><body>');
        win.document.write(printContent);
        win.document.write('</body></html>');
        win.document.close();
        win.print();
    };

    const generatePDF = async () => {
        const doc = new jsPDF();
        const tableData = reportData.map((item) => ([
            item.doc_no,
            formatDate(item.doc_date),
            item.bankname,
            item.millname,
            item.utr_no,
            item.narration,
            item.dono,
            item.dodate ,
            item.Detail_Id,
            item.utrgradename,
            item.detailamount,
            item.used,
            item.balance,
            item.netBalance
        ]));

        doc.autoTable({
            head: [['Doc No', 'Date', 'Bank Name', 'Mill Name', 'UTR No', 'Narration', 'DO No', 'DO Date', 'Used', 'Balance', 'Net Balance']],
            body: tableData,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            styles: {
                cellPadding: 1,
                fontSize: 10,
                overflow: 'linebreak',
            },
            theme: 'striped'
        });

        return doc.output('blob');
    };

    const groupReportData = (data) => {
        const detailGrouping = {}; 
        const docGrouping = {}; 

        // Aggregate bankamount by UTR detail ID
        data.forEach(item => {
            const detailKey = `${item.utr_detail_id}`;
            if (!detailGrouping[detailKey]) {
                detailGrouping[detailKey] = { totalBankAmountDetail: 0 };
            }
            detailGrouping[detailKey].totalBankAmountDetail += parseFloat(item.bankamount || 0);
        });
    
        // Aggregate bankamount by document number
        data.forEach(item => {
            const docKey = `${item.doc_no}`;
            if (!docGrouping[docKey]) {
                docGrouping[docKey] = { totalBankAmountDoc: 0 };
            }
            docGrouping[docKey].totalBankAmountDoc += parseFloat(item.bankamount || 0);
        });
    
        return data.map(item => {
            const detailKey = `${item.utr_detail_id}`;
            const docKey = `${item.doc_no}`;
            const used = docGrouping[docKey].totalBankAmountDoc;
            const balance = item.detailamount - detailGrouping[detailKey].totalBankAmountDetail;
            const netBalance = item.amount - docGrouping[docKey].totalBankAmountDoc;
    
            return {
                ...item,
                used,
                balance,
                netBalance
            };
        });
    };
    
    const handleBack = () => {
        navigate('/pending-reports');
    };

    return (
        <div>
            <h4>JK Sugars And Commodities Pvt. Ltd.</h4>
            <div className="mb-3 row align-items-center">
                <div className="col-auto">
                    <button className="btn btn-secondary me-2" onClick={handlePrint}>
                        Print Report
                    </button>
                    <button className="btn btn-success" onClick={handleExportToExcel}>
                        Export to Excel
                    </button>
                    <button className="btn btn-warning ms-2" onClick={handleBack}>
                        Back
                    </button>
                </div>
                <div className="col-auto mb-3">
                    <input
                        type="email"
                        id="email"
                        className="form-control"
                        value={emailId}
                        onChange={(e) => setEmailId(e.target.value)}
                        placeholder="Enter email to send report"
                        style={{ maxWidth: '500px', padding: '10px' }}
                    />
                </div>
                <div className="col-auto">
                    <button className="btn btn-primary" onClick={handleSendEmail}>
                        Mail PDF
                    </button>
                </div>
            </div>
            <div className="table-responsive">
                <table className="table table-striped table-bordered mt-4" id="reportTable">
                    <thead className="table-light">
                        <tr>
                            <th>Doc No</th>
                            <th>Date</th>
                            <th>Bank Name</th>
                            <th>Mill Name</th>
                            <th>UTR No</th>
                            <th>UTR Amount</th>
                            <th>D.O.#</th>
                            <th>DO Date</th>
                            <th>Used</th>
                            <th>Balance</th>
                            <th>Net Balance</th>
                        </tr>
                    </thead>
                    <tbody>
    {reportData.map((item, index) => (
        <React.Fragment key={index}>
            <tr style={{ backgroundColor: '#f7f7f7'}}>  
                <td>{item.doc_no}</td>
                <td>{formatDate(item.doc_date)}</td>
                <td>{item.bankname}</td>
                <td>{item.millname}</td>
                <td>{item.utr_no}</td>
                <td>{item.amount + item.narration_header}</td>
                <td>{item.dono}</td>
                <td>{item.dodate}</td>
                <td>{item.used}</td>
                <td>{item.balance}</td>
                <td style={{ color: 'red', fontWeight: 'bold' }}>{item.netBalance}</td> 
            </tr>
            <tr style={{ backgroundColor: '#f7f7f7', borderTop: 'none'}}>  
                <td colSpan="11" style={{ padding: '5px 50px'}}>
                    <strong>{item.Detail_Id}</strong>{' '}
                   {item.utrgradename}{' '}
                   {item.detailamount.toLocaleString()}
                </td>
            </tr>
            <tr style={{ height: '5px', backgroundColor: '#e9ecef', borderTop: 'none' }}> 
                <td colSpan="11"></td>
            </tr>
        </React.Fragment>
    ))}
</tbody>

                </table>
            </div>
            {loading && <p>Loading report data...</p>}
            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default PendingReports;
