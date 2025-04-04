import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import PdfPreview from '../../../../Common/PDFPreview';
import { RingLoader } from 'react-spinners';

const apikey = process.env.REACT_APP_API;

const PendingReports = () => {
    //GET values from session Storage
    const companyName = sessionStorage.getItem('Company_Name');

    const navigate = useNavigate();
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);

    const API_URL = `${apikey}/partywise-stockReport`;

    useEffect(() => {
        setCurrentDateTime(new Date().toLocaleString());
        const timer = setInterval(() => {
            setCurrentDateTime(new Date().toLocaleString());
        }, 1000);
        setLoading(true);
        axios.get(API_URL, {
            params: {
                Company_Code: sessionStorage.getItem('Company_Code'),
            }
        }).then(response => {
            setReportData(response.data);
            setLoading(false);
        }).catch(error => {
            console.error('Error fetching report:', error);
            setError('Failed to load data');
            setLoading(false);
        });
    }, []);

    const groupReportData = (data) => {
        const grouped = data.reduce((acc, item) => {
            if (parseFloat(item.BALANCE) !== 0) {
                const { buyername } = item;
                if (!acc[buyername]) {
                    acc[buyername] = {
                        items: [],
                        totalDespatch: 0,
                        totalBalance: 0,
                        totalQuantal: 0
                    };
                }
                acc[buyername].items.push(item);
                acc[buyername].totalDespatch += parseFloat(item.DESPATCH || 0);
                acc[buyername].totalBalance += parseFloat(item.BALANCE || 0);
                acc[buyername].totalQuantal += parseFloat(item.Buyer_Quantal || 0);
            }
            return acc;
        }, {});

        return grouped;
    };

    const groupedReportData = groupReportData(reportData);

    const calculateGrandTotals = () => {
        const totals = {
            totalQuantal: 0,
            totalDespatch: 0,
            totalBalance: 0,
        };

        Object.entries(groupedReportData).forEach(([_, group]) => {
            totals.totalQuantal += group.totalQuantal;
            totals.totalDespatch += group.totalDespatch;
            totals.totalBalance += group.totalBalance;
        });

        return totals;
    };

    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const excelRows = [];
        excelRows.push([
            "Tender No", "Mill Name", "Grade", "M Rate", "S Rate", "Lifting", "Do", "Quantal", "Desp", "Bal"
        ]);

        Object.entries(groupedReportData).forEach(([buyername, group]) => {
            excelRows.push([
                { v: buyername, s: { fill: { fgColor: { rgb: "CCCCCC" } }, font: { bold: true } }, t: 's' }
            ]);
            group.items.forEach(item => {
                excelRows.push([
                    item.Tender_No,
                    item.millshortname || 'N/A',
                    item.Grade,
                    item.Mill_Rate,
                    item.Sale_Rate || 'N/A',
                    item.Tender_Date || '0',
                    item.Do || 'N/A',
                    item.Buyer_Quantal || '0',
                    item.DESPATCH || '0',
                    item.BALANCE || '0'
                ]);
            });

            excelRows.push([
                "Total", "", "", "", "", "", "", group.totalQuantal.toFixed(2),
                group.totalDespatch.toFixed(2),
                group.totalBalance.toFixed(2)
            ]);
        });

        const grandTotals = calculateGrandTotals();
        excelRows.push([
            "Grand Totals", "", "", "", "", "", "",
            grandTotals.totalQuantal.toFixed(2),
            grandTotals.totalDespatch.toFixed(2),
            grandTotals.totalBalance.toFixed(2)
        ]);

        const ws = XLSX.utils.aoa_to_sheet(excelRows);
        XLSX.utils.book_append_sheet(wb, ws, 'PartywiseBalaceStockReport');

        XLSX.writeFile(wb, 'PartywiseBalaceStockReport.xlsx');
    };

    const generatePDF = () => {
        const doc = new jsPDF('landscape', 'mm', 'a4');

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 255);
        doc.text(`${companyName}`, 80, 10);
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text("Partywise Sugar Balance Stock", 80, 18);
        doc.setFontSize(10);
        doc.text(`Balance Stock As On ${currentDateTime}`, 10, 25);

        let yOffset = 30;

        Object.entries(groupedReportData).forEach(([buyername, group]) => {
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setFillColor(230, 230, 230);
            doc.rect(10, yOffset, 190, 8, "F");
            doc.text(`Buyer: ${buyername}`, 12, yOffset + 5);
            yOffset += 10;

            const tableBody = group.items.map((item) => [
                item.Tender_No,
                item.millshortname || "N/A",
                item.Grade,
                item.Mill_Rate,
                (item.Sale_Rate || 0),
                (item.Tender_Date || 0),
                item.Do || "N/A",
                (item.Buyer_Quantal || 0),
                (item.DESPATCH || 0),
                (item.BALANCE || 0)
            ]);

            tableBody.push([
                "Total",
                "",
                "",
                "",
                "",
                "",
                "",
                group.totalQuantal.toFixed(2),
                group.totalDespatch.toFixed(2),
                group.totalBalance.toFixed(2),
            ]);

            doc.autoTable({
                startY: yOffset,
                head: [
                    [
                        "Tender No",
                        "Mill Name",
                        "Grade",
                        "M Rate",
                        "S Rate",
                        "Lifting",
                        "Do",
                        "Quantal",
                        "Desp",
                        "Bal",
                    ],
                ],
                body: tableBody,
                theme: "grid",
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
                bodyStyles: { textColor: [0, 0, 0] },
                alternateRowStyles: { fillColor: [240, 240, 240] },
                margin: { top: 10, left: 10, right: 10 },
            });

            yOffset = doc.lastAutoTable.finalY + 10;

            if (yOffset > 270) {
                doc.addPage();
                yOffset = 10;
            }
        });

        const grandTotals = calculateGrandTotals();
        doc.setFontSize(10);
        doc.text(
            `Grand Totals: Quantal = ${grandTotals.totalQuantal.toFixed(2)}, Despatch = ${grandTotals.totalDespatch.toFixed(2)}, Balance = ${grandTotals.totalBalance.toFixed(2)}`,
            10,
            yOffset
        );

        const pdfBlob = doc.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfPreview(pdfUrl);
    };

    return (
        <div>
            <div className="mb-3 d-flex justify-content-start" style={{ marginTop: "20px" }}>
                {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={reportData} label={"Partywise Balance Stock Report"} />}
                <button onClick={generatePDF} className="print-button">Print</button>
                <button className="btn btn-secondary" onClick={handleExportToExcel}>Export to Excel</button>
                <button className="btn btn-secondary" onClick={() => navigate('/millwise-stock')}>Mill Wise Lifting Wise</button>
                <button className="btn btn-secondary" onClick={() => navigate('/self-stock')}>Self Stock</button>
            </div>

            <h4 style={{ color: 'blue' }}>{companyName}</h4>
            <h5>Partywise Sugar Balance Stock</h5>
            <div className='d-flex justify-content-start'>Balance Stock As On {currentDateTime}</div>
            <div className="table-responsive">
                <table className="table table-striped table-bordered" id="reportTable" style={{ marginBottom: "50px" }}>
                    <thead>
                        <tr>
                            <th>Tender No</th>
                            <th>Mill Name</th>
                            <th>Grade</th>
                            <th>M Rate</th>
                            <th>S Rate</th>
                            <th>Lifting</th>
                            <th>Do</th>
                            <th>Quantal</th>
                            <th>Desp</th>
                            <th>Bal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(groupedReportData).map(([buyername, group]) => (
                            <React.Fragment key={buyername}>
                                <tr>
                                    <td colSpan="10" style={{ backgroundColor: '#ccc', fontWeight: 'bold' }}>{buyername}</td>
                                </tr>
                                {group.items.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.Tender_No}</td>
                                        <td>{item.millshortname || 'N/A'}</td>
                                        <td>{item.Grade}</td>
                                        <td>{item.Mill_Rate}</td>
                                        <td>{item.Sale_Rate || 'N/A'}</td>
                                        <td>{item.Tender_Date || '0'}</td>
                                        <td>{item.Do || 'N/A'}</td>
                                        <td>{item.Buyer_Quantal || '0'}</td>
                                        <td>{item.DESPATCH || '0'}</td>
                                        <td>{item.BALANCE || '0'}</td>
                                    </tr>
                                ))}
                                <tr>
                                    <td colSpan="7">Total</td>
                                    <td>{group.totalQuantal.toFixed(2)}</td>
                                    <td>{group.totalDespatch.toFixed(2)}</td>
                                    <td>{group.totalBalance.toFixed(2)}</td>
                                </tr>
                            </React.Fragment>
                        ))}
                        <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                            <td colSpan="7">Grand Totals</td>
                            <td>{calculateGrandTotals().totalQuantal.toFixed(2)}</td>
                            <td>{calculateGrandTotals().totalDespatch.toFixed(2)}</td>
                            <td>{calculateGrandTotals().totalBalance.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            {loading && <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                }}
            >
                <RingLoader />
            </div>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default PendingReports;
