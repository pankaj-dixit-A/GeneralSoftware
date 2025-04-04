import React, { useEffect, useState } from "react";
import logo from "../../../Assets/jklogo.png";
import Sign from "../../../Assets/jksign.png";
import jsPDF from "jspdf";
import "jspdf-autotable";
import PdfPreview from "./../../../Common/PDFPreview";
import QRCode from "qrcode";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import PrintButton from "../../../Common/Buttons/PrintPDF"

const API_URL = process.env.REACT_APP_API;

const SugarPurchaseReport = ({ doc_no, Company_Code, Year_Code, disabledFeild }) => {
    const [invoiceData, setInvoiceData] = useState([]);
    const [pdfPreview, setPdfPreview] = useState(null);

    // Fetch data from API
    const fetchData = async () => {
        try {
            const response = await fetch(
                `${API_URL}/generating_purchaseReport_report?Company_Code=${Company_Code}&doc_no=${doc_no}&Year_Code=${Year_Code}`
            );
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const data = await response.json();
            setInvoiceData(data.all_data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        if (invoiceData.length > 0) {
            generatePdf(invoiceData);
        }
    }, [invoiceData]);

    // Generate PDF
    const generatePdf = async (data) => {
        const pdf = new jsPDF({ orientation: "portrait" });
        const allData = data?.[0] || {};
        const logoImg = new Image();

        let qrCodeData = "";
        qrCodeData = ` GSTN of Supplier: ${allData.GST || ""}\n
        GSTIN of Supplier: ${allData.suppliergstno || ""}\n
        Document No: ${allData.doc_no || ""}\n
        Document Type: Tax Invoice\n
        Date Of Creation Of Invoice: ${allData.doc_dateConverted || ""}\n
        HSN Code: ${allData.HSN || ""}\n
        EwayBill No: ${allData.EWay_Bill_No || ""}`

        // Create QR code
        const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData.trim(), {
            width: 300,
            height: 300,
        });

        pdf.addImage(qrCodeDataUrl, "PNG", 170, 0, 30, 30);
        logoImg.src = logo;
        logoImg.onload = () => {
            pdf.addImage(logoImg, "PNG", 5, 5, 30, 30);
            pdf.setFontSize(14);
            pdf.text(`${allData.Company_Name_E}`, 40, 10);

            pdf.setFontSize(8);
            pdf.text(`${allData.AL1}`, 40, 15);
            pdf.text(`${allData.AL2}`, 40, 20);
            pdf.text(`${allData.AL3}`, 40, 25);
            pdf.text(`${allData.AL4}`, 40, 30);
            pdf.text(`${allData.Other}`, 40, 35);

            pdf.setFontSize(12);
            pdf.setLineWidth(0.3);
            pdf.line(10, 38, 200, 38);

            pdf.setFontSize(12);
            pdf.text("TAX INVOICE", 90, 43);

            pdf.setFontSize(12);
            pdf.setLineWidth(0.3);
            pdf.line(10, 45, 200, 45);

            const totalAmount = parseFloat(allData.TCS_Net_Payable);
            const totalAmountWords = ConvertNumberToWord(totalAmount);

            const tableData = [
                ["Reverse Charge:", "No"],
                ["Invoice No:", `SB${allData.year}-${allData.doc_no}`],
                ["Invoice Date:", allData.doc_dateConverted],
                ["DO No:", allData.PURCNO],
                ["State:", allData.State_E],
                ["State Code:", allData.GSTStateCode],
                ["Supplier:"],
                [allData.suppliername],
                [`${allData.supplieraddress}`],
                ["City:", allData.partyCity],
                ["Gst No:", allData.suppliergstno],
                ["State Code:", allData.supplierstatecode, "PAN No:", allData.supplierpan],
                ["FSSAI No:", allData.supllierfssaino],
                ["TAN No:", allData.suppliertinno],
            ];

            const buyerData = [
                ["Our GST No:", allData.GST],
                ["Transport Mode:", "Road"],
                ["Date Of Supply:", allData.doc_dateConverted],
                ["Place Of Supply:", allData.partyCity, allData.billtogststatecode],
                ["State:", allData.supplierstatecode],
            ];

            if (tableData && tableData.length > 0) {
                pdf.autoTable({
                    startY: 45,
                    margin: {
                        left: 10,
                        right: pdf.internal.pageSize.width / 2 + 10
                    },
                    body: tableData,
                    theme: "plain",
                    styles: {
                        cellPadding: 0.5,
                        fontSize: 8,
                        overflow: "linebreak"
                    },
                    columnStyles: {
                        1: { fontStyle: "bold", cellWidth: -250 },
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
                    },
                });
            }

            pdf.setLineWidth(0.3);
            pdf.line(pdf.internal.pageSize.width / 2, 45, pdf.internal.pageSize.width / 2, 70);

            if (buyerData && buyerData.length > 0) {
                pdf.autoTable({
                    startY: 48,
                    margin: {
                        left: pdf.internal.pageSize.width / 2 + 10,
                        right: 10
                    },
                    body: buyerData,
                    theme: "plain",
                    styles: {
                        cellPadding: 0.6,
                        fontSize: 8,
                        overflow: "linebreak"
                    },
                    columnStyles: {
                        1: { fontStyle: "bold" },
                    },
                    didDrawCell: function (data) {
                        if (data.row.index === 3) {
                            pdf.setLineWidth(0.3);
                            pdf.setDrawColor(0);
                            const startX = pdf.internal.pageSize.width / 2;
                            const endX = pdf.internal.pageSize.width - 10;
                            const y = data.cell.y + data.cell.height + 4;
                            pdf.line(startX, y, endX, y);
                        }
                    },
                });
            }

            pdf.setFontSize(8);
            pdf.setLineWidth(0.3);
            pdf.line(10, 110, 200, 110);

            pdf.text(`Mill Name : ${allData.millshortname}`, 10, 115);
            pdf.text(`Lorry No : ${allData.LORRYNO}`, 130, 115);

            pdf.line(10, 118, 200, 118);

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8);

            const saleRate = allData.rate;
            const value = Math.round(saleRate * allData.Quantal);
            const particulars = [
                [
                    "Particulars",
                    "Brand Name",
                    "HSN/ACS",
                    "Quintal",
                    "Packing (kg)",
                    "Bags",
                    "Rate",
                    "Value"
                ],
                [
                    allData.itemname,
                    allData.Brand_Name,
                    allData.HSN,
                    allData.Quantal,
                    allData.packing,
                    allData.bags,
                    saleRate || 0,
                    value
                ],
            ];

            pdf.autoTable({
                startY: pdf.lastAutoTable.finalY + 50,
                head: [particulars[0]],
                body: particulars.slice(1),
                styles: {
                    cellPadding: 1,
                    fontSize: 8,
                    valign: "middle",
                    halign: "right",
                  
                },
                headStyles: {
                    fillColor: false,
                    textColor: 'black',
                    halign: "center",
                },
                bodyStyles: {
                    halign: "right",
                },
                tableWidth: "auto",
                pageBreak: "auto",
                didDrawCell: function (data) {
                    pdf.setLineDash([2, 2]);
                    pdf.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
                    pdf.setLineDash([]);
                }
            });

            const eInvoiceData = [
                ["Sale Rate:", allData.rate],
                ["Grade:", allData.grade],
                ["Eway Bill No:", allData.EWay_Bill_No],
                ["EwayBill ValidDate:", allData.mill_inv_dateConverted],
            ];

            pdf.autoTable({
                startY: pdf.lastAutoTable.finalY + 6,
                margin: { left: 10, right: pdf.internal.pageSize.width / 2 },
                body: eInvoiceData,
                theme: "plain",
                styles: {
                    cellPadding: 0.5,
                    fontSize: 8,
                    halign: "left",
                    valign: "middle",
                    overflow: "linebreak"
                },
                columnStyles: {
                    0: { cellWidth: "auto" },
                    1: { fontStyle: "bold" },
                },
                pageBreak: "auto"
            });

            pdf.setLineWidth(0.3);

            const summaryData = [
                ["Freight:", allData.LESS_FRT_RATE, allData.freight],
                ["Taxable Amount:", "", allData.Bill_Amount],
                ["CGST:", allData.CGSTRate, allData.CGSTAmount],
                ["SGST:", allData.SGSTRate, allData.SGSTAmount],
                ["IGST:", allData.IGSTRate, allData.IGSTAmount],
                ["Other Expense:", "", allData.OTHER_AMT],
                ["Total Amount:", "", allData.TCS_Net_Payable],
                ["TCS:", allData.TCS_Rate, allData.TCS_Amt],
                ["TCS Net Payable:", "", allData.TCS_Net_Payable],
            ];


            pdf.autoTable({
                startY: 135,
                margin: { left: pdf.internal.pageSize.width / 1.85 },
                body: summaryData,
                theme: "plain",
                styles: {
                    cellPadding: 1,
                    fontSize: 8,
                    halign: "left",
                    valign: "middle",
                    overflow: "linebreak"
                },
                columnStyles: {
                    2: { halign: "right", fontStyle: "bold" },
                },
                pageBreak: "auto"
            });

            pdf.setFontSize(8);
            const lineY = pdf.lastAutoTable.finalY + 10;
            pdf.line(10, lineY - 4, 200, lineY - 4);

            pdf.setFontSize(7);
            pdf.setFont("helvetica", "bold");
            pdf.text(`Bank Details:${allData.bankdetail}`, 10, lineY - 1);

            pdf.setLineWidth(0.3);
            pdf.line(10, lineY + 3, 200, lineY + 3);

            pdf.setFontSize(8);
            pdf.setFont("helvetica", "bold");
            pdf.text(`Amount In Words : ${totalAmountWords}.`, 10, lineY + 7);

            pdf.line(10, lineY + 9, 200, lineY + 9);

            pdf.setFontSize(8);
            pdf.text(`Our Tan No: ${allData.TIN}`, 10, pdf.lastAutoTable.finalY + 24);
            pdf.text(`FSSAI No: ${allData.FSSAI_No}`, 60, pdf.lastAutoTable.finalY + 24);
            pdf.text(`PAN No:  ${allData.Pan_No}`, 110, pdf.lastAutoTable.finalY + 24);

            // Signature
            const signImg = new Image();
            signImg.src = Sign;
            signImg.onload = () => {
                pdf.setFontSize(8);
                pdf.setTextColor(255, 0, 0);
                pdf.text("Note:", 6, pdf.lastAutoTable.finalY + 28);
                pdf.setTextColor(0, 0, 0);

                pdf.text(
                    "- After Dispatch of the goods we are not responsible for non delivery or any kind of damage.",
                    6,
                    pdf.lastAutoTable.finalY + 32
                );
                pdf.text(
                    "- Certified that the particulars given above are true and correct.",
                    6,
                    pdf.lastAutoTable.finalY + 36
                );
                pdf.text(
                    "- Please credit the amount in our account and send the amount by RTGS immediately.",
                    6,
                    pdf.lastAutoTable.finalY + 40
                );
                pdf.text(
                    "- If the amount is not sent before the due date payment Interest 24% will be charged.",
                    6,
                    pdf.lastAutoTable.finalY + 44
                );
                pdf.text(
                    "- I/We hereby certify that food/foods mentioned in this invoice is/are warranted to be of ",
                    6,
                    pdf.lastAutoTable.finalY + 48
                );
                pdf.text(
                    "- the nature and quality which it/these purports/purported to be",
                    6,
                    pdf.lastAutoTable.finalY + 52
                );

                pdf.addImage(signImg, "PNG", 160, pdf.lastAutoTable.finalY + 25, 30, 20);

                pdf.text(
                    `For, ${allData.Company_Name_E}`,
                    145,
                    pdf.lastAutoTable.finalY + 50
                );
                pdf.text("Authorised Signatory", 160, pdf.lastAutoTable.finalY + 55);

                const pdfBlob = pdf.output("blob");
                const pdfUrl = URL.createObjectURL(pdfBlob);
                setPdfPreview(pdfUrl);
            };
        };
    };

    return (
        <div id="pdf-content">
            {pdfPreview && (
                <PdfPreview
                    pdfData={pdfPreview}
                    apiData={invoiceData[0]}
                    label={"PurchaseBill"}
                />
            )}
            <PrintButton disabledFeild={disabledFeild} fetchData={fetchData} />
        </div>
    );
};

export default SugarPurchaseReport;
