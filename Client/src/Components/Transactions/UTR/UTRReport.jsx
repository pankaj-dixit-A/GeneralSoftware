import React, { useState } from "react";
import logo from "../../../Assets/jklogo.png";
import Sign from "../../../Assets/jksign.png";
import jsPDF from "jspdf";
import "jspdf-autotable";
import PdfPreview from "../../../Common/PDFPreview";
import { formatDate } from "../../../Common/FormatFunctions/FormatDate"
import PrintButton from "../../../Common/Buttons/PrintPDF";

const UTRReport = ({ doc_no, disabledFeild }) => {
    const API_URL = process.env.REACT_APP_API;
    const apikey = process.env.REACT_APP_API_URL;
    const companyCode = sessionStorage.getItem("Company_Code");
    const Year_Code = sessionStorage.getItem("Year_Code");
    
    const [pdfBlob, setPdfBlob] = useState(null);
    const [apiData, setAPIData] = useState([])

    const fetchData = async () => {
        try {
            const response = await fetch(
                `${API_URL}/getUTRReport?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${doc_no}`
            );
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const data = await response.json();
            setAPIData(data.all_data)
            generatePdf(data.all_data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const generatePdf = (data) => {
        const pdf = new jsPDF({ orientation: "portrait" });
        const logoImg = new Image();
        logoImg.src = logo;
        const allData = data[0];
        const totalAmount = parseFloat(allData.amount).toFixed(2);

        logoImg.onload = () => {
            pdf.addImage(logoImg, "PNG", 5, 5, 30, 30);
            pdf.setFontSize(14);
            pdf.setFont("helvetica");
            pdf.text("JK Sugars And Commodities Pvt. Ltd.", 40, 10);
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "bold");
            pdf.text("(Formerly known as JK eBuySugar Pvt. Ltd.)", 40, 15);
            pdf.text("DABHOLKAR CORNER, 4TH FLOOR, AMATYA TOWER, NEW SHAHUPURI, 329, E-WARD,", 40, 20);
            pdf.text("Kolhapur-416002 (Maharashtra)", 40, 25);
            pdf.text("Tel: (0231) 6688888 / 6688889 / 6688890", 40, 30);
            pdf.text("Email: lnfo@ebuysugars.com .GST NO 27AAECJ8332R1ZV / PAN .AAECJ8332R", 40, 35);
            pdf.setFontSize(12);
            pdf.setLineWidth(0.3);
            pdf.line(10, 38, 200, 38);
            pdf.setFontSize(7);
            pdf.text("Ref No: ", 10, 43);
            pdf.setFont("helvetica", "bold");
            pdf.text(`${allData.doc_no}`, 18, 43);
            pdf.text("Date:", 180, 43);
            pdf.setFont("helvetica", "bold");
            pdf.text(`${formatDate(allData.doc_date)}`, 188, 43);
            pdf.line(10, 45, 200, 45);
            pdf.setFontSize(10);
            const subjectText = "Subject: Payment Details";
            const subjectWidth = pdf.getTextWidth(subjectText);
            const pageWidth = pdf.internal.pageSize.getWidth();
            const xCenter = (pageWidth - subjectWidth) / 2;
            pdf.text(subjectText, xCenter, 50);

            pdf.setFontSize(8);
            pdf.setFont("helvetica", "normal");
            pdf.text("To,", 10, 55);

            pdf.setFont("helvetica", "bold");
            pdf.text(`${allData.Ac_Name_E}`, 10, 60);

            pdf.setFont("helvetica", "normal");
            pdf.text("Address:", 10, 65);

            pdf.setFont("helvetica", "bold");
            pdf.text(allData.Address_E, 10, 70);

            pdf.setFont("helvetica", "normal");
            pdf.text("City:", 10, 75);

            pdf.setFont("helvetica", "bold");
            pdf.text(allData.city_name_e, 16, 75);

            pdf.setFont("helvetica", "normal");
            pdf.text("Pin:", 10, 80);

            pdf.setFont("helvetica", "bold");
            pdf.text(allData.Pincode, 16, 80);

            pdf.setFont("helvetica", "normal");
            pdf.text("State:", 10, 85);

            pdf.setFont("helvetica", "bold");
            pdf.text(allData.state || "Maharashtra", 18, 85);

            pdf.setFont("helvetica", "normal");
            pdf.text("Respected Sir,", 10, 95);

            const depositText = `Here with we deposited Rs: ${totalAmount} In Your Account By Ref.No/Utr No.: ${allData.utr_no}`;
            const maxWidth = 180;
            const textWidth = pdf.getTextWidth(depositText);

            if (textWidth <= maxWidth) {
                pdf.setFont("helvetica", "bold");
                pdf.text(depositText, 10, 100);
            } else {
                const firstPart = `Herewith we deposited Rs: ${totalAmount}`;
                const secondPart = `In Your Account By Ref.No/Utr No.: ${allData.utr_no}`;

                pdf.setFont("helvetica", "bold");
                pdf.text(firstPart, 10, 100);
                pdf.text(secondPart, 10, 105);
            }

            pdf.setFont("helvetica", "normal");
            pdf.text("Please credit the same.", 10, 110);


            const signImg = new Image();
            signImg.src = Sign;
            signImg.onload = () => {
                pdf.addImage(signImg, "PNG", 160, 135, 30, 20);
                pdf.text("For, JK Sugars And Commodities Pvt. Ltd", 140, 160);
                pdf.text("Authorised Signatory", 160, 165);

                const generatedPdfBlob = pdf.output("datauristring");
                setPdfBlob(generatedPdfBlob);
            };
        };
    };

return (
    <div id="pdf-content">
        {pdfBlob && <PdfPreview pdfData={pdfBlob} apiData={apiData[0]} label={"UTR"} />}
        {/* <button onClick={fetchData} className="print-button" disabled={disabledFeild}>Print</button> */}
        <PrintButton disabledFeild={disabledFeild} fetchData={fetchData} />
    </div>
);
};


export default UTRReport;
