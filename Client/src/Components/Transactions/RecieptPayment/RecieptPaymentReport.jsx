import React, { useState, useEffect, useRef } from "react";
import logo from "../../../Assets/jklogo.png";
import Sign from "../../../Assets/jklogo.png";
import jsPDF from "jspdf";
import "jspdf-autotable";
import PdfPreview from '../../../Common/PDFPreview'
import PrintButton from "../../../Common/Buttons/PrintPDF";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";

const API_URL = process.env.REACT_APP_API;

const RecieptPaymentReport = ({ doc_no, Tran_Type,disabledFeild }) => {
    const companyCode = sessionStorage.getItem("Company_Code");
    const Year_Code = sessionStorage.getItem("Year_Code");
    const [invoiceData, setInvoiceData] = useState([]);
    const [pdfPreview, setPdfPreview] = useState(null);

    const fetchData = async () => {
        try {
            const response = await fetch(
                `${API_URL}/generating_RecieptPaymrnt_report?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${doc_no}&TranType=${Tran_Type}`
            );
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const data = await response.json();

            setInvoiceData(data.all_data);
            generatePdf(data.all_data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };


    const generatePdf = async (data) => {
        const pdf = new jsPDF({ orientation: "portrait" });
        const allData = data?.[0] || {};
        const logoImg = new Image();

        logoImg.src = logo;
        logoImg.onload = () => {
            pdf.addImage(logoImg, "PNG", 5, 5, 30, 30);
            pdf.setFontSize(14);
            pdf.text(`${allData.Company_Name_E}`, 40, 10);
            pdf.setFontSize(8);
            pdf.setFont("helvetica", "bold");
            pdf.text(`${allData.AL1}`, 40, 15);
            pdf.text(`${allData.AL2}`, 40, 20);
            pdf.text(`${allData.AL3}`, 40, 25);
            pdf.text(`${allData.AL4}`, 40, 30);
            pdf.text(`${allData.Other}`, 40, 35);

            pdf.setFontSize(12);
            pdf.setLineWidth(0.3);
            pdf.line(10, 38, 200, 38);

            pdf.setFontSize(10);
            pdf.text("Receipt Payment Report", 90, 43);

            pdf.setFontSize(12);
            pdf.setLineWidth(0.3);
            pdf.line(10, 45, 200, 45);

            const totalAmount = parseFloat(allData.total);
            const totalAmountWords = ConvertNumberToWord(totalAmount);
   
            const tableData = [
                ["Bill No:", `${allData.doc_no}`],
                ["Reciept Date:", allData.doc_dateConverted],
            ];
            
            pdf.autoTable({
                startY: 45,
                margin: { right: pdf.internal.pageSize.width / 2 + 10 },
                body: tableData,
                theme: "plain",
                styles: {
                    cellPadding: 1,  
                    fontSize: 8,   
                },
                columnStyles: {
                    0: { cellWidth: 'auto', fontStyle: 'normal', halign: 'left' }, 
                    1: { cellWidth: 'auto', fontStyle: 'normal', halign: 'left' }, 
                },
                didDrawCell: function (data) {
                    if (data.row.index === 3) {
                        pdf.setLineWidth(0.3);
                        pdf.setDrawColor(0);
                        const startX = 10;
                        const endX = pdf.internal.pageSize.width / 2;
                        const y = data.cell.y + data.cell.height + 7.9;
                        pdf.line(startX, y, endX, y);
                    }
                }
            });
            
            const particulars = [
                ["Party Name", "Amount", "Cheque No. / Remark", "Narration", "Bank Name"],
                ...data.map(item => [
                    item.creditname || "",
                    item.amount || "",
                    item.narration || "",
                    item.narration2 || "",
                    item.Ac_Name_E || ""
                ])
            ];

            pdf.autoTable({
                startY: pdf.lastAutoTable.finalY + 10,
                head: [particulars[0]],
                body: particulars.slice(1),
                styles: {
                    cellPadding: 0.5,
                    fontSize: 8,
                    valign: 'middle',
                    halign: 'left',
                    lineColor: 200
                },
                tableWidth: '100%',
            });
            const lineY = pdf.lastAutoTable.finalY + 5;

            pdf.setFontSize(8);
            pdf.setFont("helvetica", "bold");

            pdf.text(`Total: ${allData.total}`, 35, lineY);

            const afterTotalY = lineY + 5;

            pdf.setLineWidth(0.5);
            pdf.line(10, afterTotalY, 200, afterTotalY);

            const afterTableY = afterTotalY + 5;

            pdf.setFontSize(8);
            pdf.text(`Amount In Words: ${totalAmountWords}`, 10, afterTableY);

            const afterAmountTextY = afterTableY + 5;
            pdf.line(10, afterAmountTextY, 200, afterAmountTextY);

            const pdfData = pdf.output("datauristring");
            setPdfPreview(pdfData);
        };
    };

    return (
        <div id="pdf-content">
            {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={invoiceData[0]} label={"RecieptPayment"} />}
            <PrintButton disabledFeild={disabledFeild} fetchData={fetchData} />
        </div>
    );
};

export default RecieptPaymentReport;