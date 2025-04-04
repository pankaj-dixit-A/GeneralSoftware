import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import PdfPreview from '../../../../Common/PDFPreview';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { RingLoader } from 'react-spinners';

const API_URL = process.env.REACT_APP_API;

const MillWiseLiftingWise = () => {

    //GET Company_Name from session storage
    const companyName = sessionStorage.getItem('Company_Name');

    const [groupedData, setGroupedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_URL}/millwise-stock-report`, {
                    params: { Company_Code: sessionStorage.getItem('Company_Code') },
                });
                const data = response.data;
                filterSelfRecords(data);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filterSelfRecords = (data) => {
        const grouped = data.tender_details.map((tender) => {
            const salesDetails = data.sales_details.find(
                (sale) => sale.Tender_No === tender.Tender_No
            );

            const validDetails = salesDetails
                ? salesDetails.details.filter((sale) => parseFloat(sale.BALANCE) !== 0)
                : [];

            return {
                ...tender.details[0],
                salesDetails: validDetails,
            };
        });

        setGroupedData(grouped.filter((tender) => tender.salesDetails.length > 0));
    };

    const handleExportToExcel = () => {
        const table = document.getElementById('reportContent').querySelector('table');
        const rows = Array.from(table.rows);
        const sheetData = [];

        rows.forEach((row) => {
            const rowData = Array.from(row.cells).map((cell) => cell.textContent.trim());
            sheetData.push(rowData);
        });

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'MillWiseLiftingWise');
        XLSX.writeFile(workbook, 'MillWiseLiftingWise.xlsx');
    };

    const generatePDF = () => {
        const doc = new jsPDF('landscape', 'mm', 'a4');
        let yOffset = 10;

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 255);
        doc.text(companyName, 80, yOffset);
        doc.setTextColor(0, 0, 0);
        yOffset += 5;
        doc.setFontSize(10);
        doc.text('Millwise Lifting Stock Report', 80, yOffset);
        yOffset += 5;
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 80, yOffset);
        yOffset += 5;

        groupedData.forEach((tender, index) => {
            const totalDispatch = tender.salesDetails.reduce(
                (sum, sale) => sum + parseFloat(sale.despatchqty || 0),
                0
            );
            const totalBalance = tender.salesDetails.reduce(
                (sum, sale) => sum + parseFloat(sale.BALANCE || 0),
                0
            );

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`Tender No: ${tender.Tender_No}`, 10, yOffset);
            doc.text(`Total Dispatch: ${totalDispatch}`, 110, yOffset);
            doc.text(`Total Balance: ${totalBalance}`, 150, yOffset);
            yOffset += 5;

            const tableBody = tender.salesDetails.map((sale) => [
                sale.ID,
                tender.Tender_Date,
                tender.millname || 'N/A',
                tender.Grade,
                tender.Quantal || 'N/A',
                tender.Mill_Rate || 'N/A',
                sale.Sale_Rate || 'N/A',
                sale.Buyer_Quantal || '0',
                sale.despatchqty || '0',
                sale.BALANCE || '0',
                tender.Lifting_Date || 'N/A',
                tender.doname || 'N/A',
            ]);

            doc.autoTable({
                startY: yOffset,
                head: [
                    [
                        'ID',
                        'Date',
                        'Mill',
                        'Grade',
                        'Lot',
                        'M.R.',
                        'S.R.',
                        'Qntl',
                        'Desp',
                        'Bal',
                        'Lift',
                        'DO',
                    ],
                ],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
                bodyStyles: { textColor: [0, 0, 0] },
                margin: { top: 10 },
            });

            yOffset = doc.lastAutoTable.finalY + 10;
        });

        const pdfBlob = doc.output('blob');
        const pdfURL = URL.createObjectURL(pdfBlob);
        setPdfPreview(pdfURL);
    };

    const handleBack = () => {
        navigate('/balance-stock');
    };

    return (
        <div>
            <h4 style={{ color: 'blue' }}>{companyName}</h4>
            <h5>Sugar Balance Stock</h5>

            <div className="d-flex mb-3">
                {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={groupedData} label={"Millwise Lifting Stock Report"} />}
                <button onClick={generatePDF} className="print-button">Print</button>
                <button className="btn btn-secondary" onClick={handleExportToExcel}>
                    Export to Excel
                </button>
                <button className="btn btn-secondary" onClick={handleBack}>
                    Back
                </button>
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
            {error && <p className="text-danger">{error}</p>}

            <div id="reportContent">
                <table className="table" style={{ borderCollapse: 'collapse', width: '100%',marginBottom:'50px' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'black', color: 'white', textAlign: 'center' }}>
                            <th style={{ border: '1px solid black' }}>T.No</th>
                            <th style={{ border: '1px solid black' }}>Date</th>
                            <th style={{ border: '1px solid black' }}>Mill</th>
                            <th style={{ border: '1px solid black' }}>Grade</th>
                            <th style={{ border: '1px solid black' }}>Lot</th>
                            <th style={{ border: '1px solid black' }}>M.R.</th>
                            <th style={{ border: '1px solid black' }}>S.R.</th>
                            <th style={{ border: '1px solid black' }}>Qntl</th>
                            <th style={{ border: '1px solid black' }}>Desp</th>
                            <th style={{ border: '1px solid black' }}>Bal</th>
                            <th style={{ border: '1px solid black' }}>Lift</th>
                            <th style={{ border: '1px solid black' }}>DO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedData.map((tender, index) => {
                            const totalDispatch = tender.salesDetails.reduce(
                                (sum, sale) => sum + parseFloat(sale.despatchqty || 0),
                                0
                            );
                            const totalBalance = tender.salesDetails.reduce(
                                (sum, sale) => sum + parseFloat(sale.BALANCE || 0),
                                0
                            );

                            return (
                                <React.Fragment key={index}>
                                    <tr
                                        style={{
                                            backgroundColor: index % 2 === 0 ? '#DFF0D8' : '#F2F2F2',
                                            textAlign: 'center',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        <td rowSpan={tender.salesDetails.length + 1} style={{ border: '1px solid black' }}>
                                            {tender.Tender_No}
                                        </td>
                                        <td style={{ border: '1px solid black' }}>{tender.Tender_Date}</td>
                                        <td style={{ border: '1px solid black' }}>{tender.millname}</td>
                                        <td style={{ border: '1px solid black' }}>{tender.Grade}</td>
                                        <td style={{ border: '1px solid black' }}>{tender.Quantal}</td>
                                        <td style={{ border: '1px solid black' }}>{tender.Mill_Rate}</td>
                                        <td style={{ border: '1px solid black' }}>{tender.Purc_Rate}</td>
                                        <td style={{ border: '1px solid black' }}>{tender.Quantal}</td>
                                        <td style={{ border: '1px solid black' }}>{totalDispatch}</td>
                                        <td style={{ border: '1px solid black' }}>{totalBalance}</td>
                                        <td style={{ border: '1px solid black' }}>{tender.Lifting_Date}</td>
                                        <td style={{ border: '1px solid black' }}>{tender.doname}</td>
                                    </tr>
                                    {tender.salesDetails.map((sale, saleIndex) => (
                                        <tr key={saleIndex} style={{ textAlign: 'center' }}>
                                            <td style={{ border: '1px solid black' }}>{sale.ID}-{sale.buyerbrokerfullname}</td>
                                            <td style={{ border: '1px solid black' }}></td>
                                            <td style={{ border: '1px solid black' }}></td>
                                            <td style={{ border: '1px solid black' }}></td>
                                            <td style={{ border: '1px solid black' }}></td>
                                            <td style={{ border: '1px solid black' }}>{sale.Sale_Rate}</td>
                                            <td style={{ border: '1px solid black' }}>{sale.Buyer_Quantal}</td>
                                            <td style={{ border: '1px solid black' }}>{sale.despatchqty}</td>
                                            <td style={{ border: '1px solid black' }}>{sale.BALANCE}</td>
                                            <td style={{ border: '1px solid black' }}></td>
                                            <td style={{ border: '1px solid black' }}></td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MillWiseLiftingWise;
