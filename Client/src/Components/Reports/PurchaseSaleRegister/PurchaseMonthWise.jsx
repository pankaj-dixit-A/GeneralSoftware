import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate, useLocation } from 'react-router-dom';

const apikey = process.env.REACT_APP_API_URL;

const PurchaseMonthWise = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
       const fromDate = searchParams.get('fromDate');
       const toDate = searchParams.get('toDate');
       const company_Code = searchParams.get('companyCode');
       const YearCode = searchParams.get('yearCode');
       const acCode = searchParams.get('acCode');

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailId, setEmailId] = useState('');

    const API_URL = `${apikey}/api/sugarian/PurchaseMonthWise_Register`;

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
                        acCode : acCode,
                        Company_Code :company_Code,
                        Year_code : YearCode
                    },
                });
                setReportData(response.data);
            } catch (error) {
                console.error('Error fetching report:', error);
                setError('Error fetching report');
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [API_URL]);

   const handleExportToExcel = () => {
                  const wb = XLSX.utils.book_new();
              
                  // Define column headers
                  const headers = [
                      "Year","Month","Qty","Item Amount"
                  ];
              
                  // Map reportData to ensure numeric values are formatted properly
                  const formattedData = reportData.map(item => ({
                      
                     
                      "Year" :item.yr,
                      "Month" : Number(item.mn) || 0,
                      "Qty" :Number(item.qntl) || 0,
                      "Item Amount": Number(item.itemamt) || 0, 
                    
                      
                  }));
              
                  // Convert data to worksheet
                  const ws = XLSX.utils.json_to_sheet(formattedData, { header: headers });
              
                  // Set column width and alignment
                  const wsCols = [
                      { wch: 15 }, // PAN
                      { wch: 30 }, // Party Name
                      { wch: 15, alignment: { horizontal: "right" } }, // Taxable Amount
                      { wch: 10, alignment: { horizontal: "right" } }, // CGST
                      { wch: 10, alignment: { horizontal: "right" } }, // SGST
                      { wch: 10, alignment: { horizontal: "right" } }, // IGST
                      { wch: 15, alignment: { horizontal: "right" } }, // Bill Amount
                      { wch: 12, alignment: { horizontal: "right" } } // TDS Amount
                  ];
                  ws["!cols"] = wsCols; // Apply column width settings
              
                  XLSX.utils.book_append_sheet(wb, ws, 'PurchaseMonthWise');
                  XLSX.writeFile(wb, 'PurchaseMonthWise.xlsx');
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
        const groupedData = groupReportData(reportData);
        const tableData = [];

        Object.entries(groupedData).forEach(([key, group]) => {
            tableData.push([{ content: key, colSpan: 10, styles: { halign: 'center', fontStyle: 'bold', textColor: [255, 0, 0] } }]);
            group.items.forEach((item) => {
                tableData.push([
                    formatDate(item.Sauda_Date),
                    item.Tender_No,
                    item.ID,
                    item.CustomerName,
                    item.season,
                    item.Grade,
                    item.Sale_Rate,
                    item.Mill_Rate,
                    item.PartyName,
                    item.Qty,
                    item.DispatchType,
                    formatDate(item.PaymentDate)
                ]);
            });
            tableData.push([{ content: `${group.totalQty}`, colSpan: 10, styles: { halign: 'right', fontStyle: 'bold' } }, '']);
        });

        doc.autoTable({
            head: [['SaudaDate', 'TenderNo', 'ID', 'CrossName', 'Season', 'Grade', 'Sale Rate', 'Mill Rate', 'PartyName', 'Qty', 'DT', "PaymentDate"]],
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
        const groupedData = {};
        let grandTotalQty = 0;
        let grandTotalSubtotal = 0;
    
        data.forEach((item) => {
            const yearKey = `${item.yr}`;
            const monthKey = `${item.mn}`;
    
            if (!groupedData[yearKey]) {
                groupedData[yearKey] = {};
            }
    
            if (!groupedData[yearKey][monthKey]) {
                groupedData[yearKey][monthKey] = {
                    items: [],
                    totalQty: 0,
                    subtotal: 0,
                };
            }
    
            const qty = parseFloat(item.qntl) || 0;
            const subtotal = parseFloat(item.itemamt) || 0;
    
            groupedData[yearKey][monthKey].items.push(item);
            groupedData[yearKey][monthKey].totalQty += qty;
            groupedData[yearKey][monthKey].subtotal += subtotal;
    
            // Update grand totals
            grandTotalQty += qty;
            grandTotalSubtotal += subtotal;
        });
    
        return { groupedData, grandTotalQty, grandTotalSubtotal };
    };
    
    const { groupedData, grandTotalQty, grandTotalSubtotal } = groupReportData(reportData);


    const handleBack = () => {
        navigate('/purchase-sale-registers');
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

               
            </div>

            <div className="table-responsive">
                <table className="table table-striped table-bordered mt-4" id="reportTable">
                    <thead className="table-light">
                        <tr>
                           
                            <th>Year</th>
                            <th>Month</th>
                            <th>Qty</th>
                            <th>Item Amount</th>
                           
                        </tr>
                    </thead>
                    <tbody>
    {Object.entries(groupedData).map(([year, months]) => (
        <React.Fragment key={year}>
            {/* Row for Year Header */}
            {Object.entries(months).map(([month, { items, totalQty, subtotal, billAmt }]) => (
                <React.Fragment key={month}>
                    {/* Row for Month Header */}
                    
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td>{item.yr}</td>
                            <td>{item.mn}</td>
                            <td>{item.qntl}</td>
                            <td>{item.itemamt}</td>
                        </tr>
                    ))}

                    {/* Subtotal Row for Month */}
                    {/* <tr className="fw-bold text-end">
                        <td colSpan={2}>Total for {month}:</td>
                        <td>{totalQty.toFixed(2)}</td>
                        <td>{subtotal.toFixed(2)}</td>
                    </tr> */}
                </React.Fragment>
            ))}
        </React.Fragment>
    ))}
    <tr className="table-danger fw-bold">
        <td colSpan={2} className="text-end">Grand Total:</td>
        <td>{grandTotalQty.toFixed(2)}</td>
        <td>{grandTotalSubtotal.toFixed(2)}</td>
    </tr>
</tbody>

                </table>
            </div>
            {loading && <p>Loading report data...</p>}
            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default PurchaseMonthWise;
