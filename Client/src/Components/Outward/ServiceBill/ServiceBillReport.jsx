import React, { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Header from "../../../Assets/Header.png";
import DirectorSign from "../../../Assets/DirectorSign.png";
import RBFooter from "../../../Assets/RBFooter.png";
import PdfPreview from "../../../Common/PDFPreview";
import PrintButton from "../../../Common/Buttons/PrintPDF";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";

const ServiceBill = ({ companyCode, yearCode, docNo, disabledFeild }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pdfData, setPdfData] = useState(null);
    const [apiData, setApiData] = useState(null);

    const AccountYear = sessionStorage.getItem("Accounting_Year");
    let formattedYear = "";

    if (AccountYear) {
        const years = AccountYear.split(" - ");
        if (years.length === 2) {
            const startYear = years[0].slice(0, 4);
            const endYear = years[1].slice(2, 4);
            formattedYear = `${startYear}-${endYear}`;
        }
    }

    const fetchBillData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API}/generating_ServiceBill_report`,
                {
                    params: {
                        Company_Code: companyCode,
                        Year_Code: yearCode,
                        doc_no: docNo,
                    },
                }
            );

            if (response.status === 200 && response.data.all_data.length > 0) {
                generatePdf(response.data.all_data[0]);
            } else {
                setError("No data found");
            }
        } catch (err) {
            setError("Error fetching data");
        } finally {
            setLoading(false);
        }
    };

    const generatePdf = (data) => {
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        const pageMargin = 10;
        const imgWidth = 190;

        const increasedHeightFactor = 1.2;
        const imgHeight = (20 / 190) * imgWidth * increasedHeightFactor;

        const imgX = pageMargin;

        pdf.addImage(Header, "PNG", imgX, 10, imgWidth, imgHeight);

        pdf.setLineWidth(0.5);
        pdf.setDrawColor(44, 62, 80);
        pdf.line(10, 35, 200, 35);

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(44, 62, 80);
        pdf.text("TAX INVOICE", 90, 40);
        pdf.setFontSize(10);

        pdf.setLineWidth(0.3);
        pdf.line(10, 43, 200, 43);

        pdf.autoTable({
            startY: 45,
            body: [
                ["Buyer:", data.Ac_Name_E, "Invoice Number:", `RB${formattedYear}-${data.Doc_No}`],
                [
                    "Address:",
                    {
                        content: `${data.Address_E}`,
                        styles: {
                            cellWidth: "auto",
                            overflow: "linebreak",
                            fontStyle: "bold",
                        },
                    },
                    "Invoice Date:",
                    data.DateConverted,
                ],
                [
                    "GSTIN/UIN:",
                    {
                        content: `${data.Gst_No}`,
                        styles: {
                            cellWidth: "auto",
                            overflow: "linebreak",
                            fontStyle: "bold",
                        },
                    },
                ],
                [
                    "State:",
                    {
                        content: `${data.billtostatename}, State Code: ${data.GSTStateCode}`,
                        styles: {
                            cellWidth: "auto",
                            overflow: "linebreak",
                            fontStyle: "bold",
                        },
                    },
                    "Place Of Supply",
                    data.cityname,
                ],
                ["Email:", data.Email_Id, "Reverse Charge:", "NO"],
                ["Contact No:", data.Mobile_No],
            ],
            theme: "plain",
            styles: { cellPadding: 0.5, fontSize: 7, textColor: [44, 62, 80] },
            columnStyles: { 1: { fontStyle: "bold", cellWidth: "auto" } },
        });

        pdf.autoTable({
            startY: pdf.lastAutoTable.finalY + 5,
            head: [
                [
                    "Sr No",
                    "Particulars (Narration)",
                    "HSN/SAC",
                    "GST Rate",
                    "Rate",
                    "Qty",
                    "%",
                    "Amount",
                ],
            ],
            body: [
                [
                    "1",
                    data.itemdesc,
                    data.HSN,
                    `${data.gstrate}%`,
                    "-",
                    "-",
                    "-",
                    data.Amount,
                ],
                ["", "", "", "IGST", `${data.IGSTRate}%`, "", "", data.IGSTAmount],
                ["", "", "", "CGST", `${data.CGSTRate}%`, "", "", data.CGSTAmount],
                ["", "", "", "SGST", `${data.SGSTRate}%`, "", "", data.SGSTAmount],
            ],
            styles: { fontSize: 7, cellPadding: 1, textColor: [44, 62, 80] },
            headStyles: {
                fillColor: [44, 62, 80],
                textColor: 255,
                fontStyle: "bold",
            },
            columnStyles: {
                0: { halign: "center", fontStyle: "bold" },
                7: { halign: "right", fontStyle: "bold" },
            },
            theme: "grid",
        });

        let finalY = pdf.lastAutoTable.finalY + 5;
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(44, 62, 80);
        pdf.setFontSize(8);
        pdf.text(`Bill Amount: ${data.TCS_Net_Payable}`, 165, finalY);

        finalY += 8;
        pdf.setTextColor(100);
        pdf.setFontSize(8);
        pdf.text(
            `Total Amount (in words): Rs.${ConvertNumberToWord(
                data.TCS_Net_Payable
            )}`,
            10,
            finalY
        );

        finalY += 8;
        pdf.autoTable({
            startY: finalY,
            head: [
                [
                    {
                        content: "HSN/SAC",
                        rowSpan: 2,
                        styles: { halign: "center", fontStyle: "bold" },
                    },
                    {
                        content: "Taxable",
                        colSpan: 2,
                        styles: { halign: "center", fontStyle: "bold" },
                    },
                    {
                        content: "IGST",
                        colSpan: 2,
                        styles: { halign: "left", fontStyle: "bold" },
                    },
                    {
                        content: "CGST",
                        colSpan: 2,
                        styles: { halign: "left", fontStyle: "bold" },
                    },
                    {
                        content: "SGST",
                        colSpan: 2,
                        styles: { halign: "left", fontStyle: "bold" },
                    },
                    {
                        content: "Total",
                        rowSpan: 1,
                        styles: { halign: "left", fontStyle: "bold" },
                    },
                ],
                [
                    { content: "", styles: { halign: "center", fontStyle: "bold" } },
                    { content: "Rate", styles: { halign: "center", fontStyle: "bold" } },
                    {
                        content: "Amount",
                        styles: { halign: "center", fontStyle: "bold" },
                    },
                    { content: "Rate", styles: { halign: "center", fontStyle: "bold" } },
                    {
                        content: "Amount",
                        styles: { halign: "center", fontStyle: "bold" },
                    },
                    { content: "Rate", styles: { halign: "center", fontStyle: "bold" } },
                    {
                        content: "Amount",
                        styles: { halign: "left", fontStyle: "bold" },
                    },
                ],
            ],
            body: [
                [
                    data.HSN,
                    data.Amount,
                    `${data.IGSTRate}%`,
                    `${data.IGSTAmount}`,
                    `${data.CGSTRate}%`,
                    `${data.CGSTAmount}`,
                    `${data.SGSTRate}%`,
                    `${data.SGSTAmount}`,
                    data.TCS_Net_Payable,
                ],
            ],
            styles: { fontSize: 7, cellPadding: 2, textColor: [44, 62, 80] },
            headStyles: {
                fillColor: [44, 62, 80],
                textColor: 255,
                fontStyle: "bold",
            },
            columnStyles: {
                0: { halign: "right" },
                1: { halign: "right" },
                2: { halign: "center" },
                3: { halign: "right" },
                4: { halign: "center" },
                5: { halign: "right" },
                6: { halign: "center" },
                7: { halign: "right" },
                8: { halign: "right", fontStyle: "bold" },
            },
            theme: "grid",
        });

        finalY = pdf.lastAutoTable.finalY + 10;
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(44, 62, 80);
        pdf.text("*Subject to Kolhapur Jurisdiction", 10, finalY);
        finalY += 3;
        pdf.text("Our Bank Details", 10, finalY);
        finalY += 3;

        pdf.autoTable({
            startY: finalY,
            body: [
                ["A/c Name:", "JK Sugars & Commodities Pvt. Ltd. Division ChiniMandi"],
                ["A/c No:", "9240200 6938 7859"],
                ["Bank Name:", "Axis Bank"],
                ["Branch:", "New Mahadwar Road, Kolhapur"],
                ["IFSC Code:", "UTIB0001196"],
                ["EInvoice No:", data.einvoiceno],
                ["Ack No:", data.ackno],
            ],
            theme: "plain",
            styles: { fontSize: 7, cellPadding: 1, textColor: [44, 62, 80] },
            columnStyles: {
                0: { fontStyle: "bold", halign: "left" },
                1: { halign: "left" },
            },
        });
        finalY = pdf.lastAutoTable.finalY + 15;
        pdf.setFont("helvetica", "bold");
        pdf.text("For JK Sugars & Commodities Pvt. Ltd.", 150, finalY);
        const signWidth = 240;
        const signHeight = signWidth / 4;

        finalY += 3;

        pdf.addImage(DirectorSign, "PNG", 168, finalY, signWidth, signHeight);

        pdf.text("Director", 170, finalY + 25);

        const footerWidth = 370;
        const footerHeight = 40;

        const pageHeight = pdf.internal.pageSize.getHeight();
        const footerY = pageHeight - footerHeight - 5;

        pdf.addImage(RBFooter, "PNG", 10, footerY, footerWidth, footerHeight);

        const pdfBlob = pdf.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfData(pdfUrl);
        setApiData(data);
    };

    return (
        <div id="pdf-content" className="centered-container">
            <PrintButton disabledFeild={disabledFeild} fetchData={fetchBillData} />
            {pdfData && (
                <PdfPreview pdfData={pdfData} apiData={apiData} label="ServiceBill" />
            )}
        </div>
    );
};

export default ServiceBill;
