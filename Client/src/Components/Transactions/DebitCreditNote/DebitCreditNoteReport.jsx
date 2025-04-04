import React, { useState } from "react";
import Sign from "../../../Assets/jksign.png";
import logo from "../../../Assets/jklogo.png";
import jsPDF from "jspdf";
import "jspdf-autotable";
import QRCode from "qrcode";
import PdfPreview from '../../../Common/PDFPreview'
import "./DebitCreditNote.css";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import PrintButton from "../../../Common/Buttons/PrintPDF";

const API_URL = process.env.REACT_APP_API;

const DebitCreditNoteReport = ({ doc_no, tran_type, disabledFeild }) => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const [invoiceData, setInvoiceData] = useState([]);
  const [pdfPreview, setPdfPreview] = useState(null);

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return `${day}/${month}/${year}`;
  };

  const fetchData = async () => {
    try {
      const response = await fetch(
        `${API_URL}/generating_DebitCredit_report?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${doc_no}&tran_type=${tran_type}`
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

    let qrCodeData = "";
    qrCodeData = ` GSTN of Supplier: ${allData.GST || ""}\n
    GSTIN of Buyer: ${allData.ShipToGSTNo || ""}\n
    Document No: ${allData.doc_no || ""}\n
    Document Type:  ${allData.tran_type || ""}\n\n
    Date Of Creation Of Invoice: ${allData.doc_date || ""}\n
    HSN Code: ${allData.HSN || ""}\n
    IRN: ${allData.Ewaybillno || ""}\n
    Receipt Number:`;

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
      pdf.setFontSize(10);

      let invoiceText = "";
      if (tran_type === "DN") invoiceText = "DEBIT NOTE TO CUSTOMER";
      else if (tran_type === "DS") invoiceText = "DEBIT NOTE TO SUPPLIER";
      else if (tran_type === "CN") invoiceText = "CREDIT NOTE TO CUSTOMER";
      else invoiceText = "CREDIT NOTE TO SUPPLIER";

      // Set font to bold
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text(invoiceText, 80, 43);
      pdf.setFont("helvetica", "normal");

      pdf.setLineWidth(0.3);
      pdf.line(10, 45, 200, 45);

      const totalAmount = parseFloat(allData.TCS_Net_Payable);
      const totalAmountWords = ConvertNumberToWord(totalAmount);

      const tableData = [
        ["Reverse Charge", "No"],
        ["Note No:", `${tran_type}${formattedYear}-${allData.doc_no}`],
        ["Note Date:", formatDate(allData.doc_date)],
        ["State:", allData.State_E],
        ["State Code:", allData.GSTStateCode],
        ["Bill No:", allData.bill_no],
        ["Bill Date:", formatDate(allData.bill_date)],
        [""],
        ["Buyer,", ""],
        [allData.ShopTo_Name, ""],
        [allData.ShipToAddress, ""],
        ["GST No:", allData.ShipToGSTNo],
        ["State Code:", allData.ShipToStateCode],
        ["PAN No:", allData.CompanyPan],
        ["FSSAI NO:", allData.billtoFSSAI],
        ["TAN NO:", allData.billtoTAN],
      ];

      const buyerData = [
        ["Our GST No:", allData.GST],
        ["Transport Mode:", "NA"],
        ["Date Of Supply:", "NA"],
        ["Place Of Supply:", "NA"],
        [""],
        [""],
        [""],
        [""],
        ["Consigned To,", ""],
        [`${allData.Unit_Name}`, ""],
        [`${allData.unitaddress}`, ""],
        ["GST No:", allData.unitgstno],
        ["State Code:", allData.unitstatecode],
        ["PAN No:", allData.unitpanno],
        ["FSSAI No:", allData.shiptoFSSAI],
        ["TAN No:", allData.shiptoTAN],
      ];

      if (tableData && tableData.length > 0) {
        pdf.autoTable({
          startY: 47,
          margin: { left: 10, right: pdf.internal.pageSize.width / 2 + 10 },
          body: tableData,
          theme: "plain",
          styles: {
            cellPadding: 0.5,
            fontSize: 8,
          },
          columnStyles: {
            1: { fontStyle: 'bold', cellWidth: -250 },
          },
          didDrawCell: function (data) {
            if (data.row.index === 5) {
              pdf.setLineWidth(0.3);
              pdf.setDrawColor(0);
              const startX = 10;
              const endX = pdf.internal.pageSize.width / 2;
              const y = data.cell.y + data.cell.height + 7.9;
              pdf.line(startX, y, endX, y);
            }
          }
        });
      }
      pdf.setLineWidth(0.3);
      pdf.line(pdf.internal.pageSize.width / 2, 45, pdf.internal.pageSize.width / 2, 128);

      if (buyerData && buyerData.length > 0) {
        pdf.autoTable({
          startY: 45,
          margin: { left: pdf.internal.pageSize.width / 2 + 10, right: 10 },
          body: buyerData,
          theme: "plain",
          styles: {
            cellPadding: 0.6,
            fontSize: 8,
          },
          columnStyles: {
            1: { fontStyle: 'bold' },
          },
          didDrawCell: function (data) {
            if (data.row.index === 6) {
              pdf.setLineWidth(0.3);
              pdf.setDrawColor(0);
              const startX = pdf.internal.pageSize.width / 2;
              const endX = pdf.internal.pageSize.width - 10;
              const y = data.cell.y + data.cell.height + 4;
              pdf.line(startX, y, endX, y);
            }
          }
        });
      }

      pdf.setFontSize(8);
      pdf.setLineWidth(0.3);
      pdf.line(10, 128, 200, 128);

      const particulars = [
        ["Particulars", "HSN/ACS", "Quintal", "Value"],
        [allData.Item_Name, allData.HSN, allData.Quantal, allData.value],
      ];

      pdf.autoTable({
        startY: pdf.lastAutoTable.finalY + 5,
        head: [particulars[0]],
        body: particulars.slice(1),
        styles: {
          cellPadding: 1,
          fontSize: 8,
          valign: "middle",
          halign: "right",
          overflow: "linebreak"
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
        ["EInvoice No:", allData.Ewaybillno],
        ["ACK No:", allData.ackno],
        ["ASN No:", allData.ASNNO],
        ["Narration:", allData.Narration],
      ];

      const summaryData = [
        ["Taxable Amount:", "", allData.texable_amount],
        ["CGST:", allData.cgst_rate, allData.cgst_amount],
        ["SGST:", allData.sgst_rate, allData.sgst_amount],
        ["IGST:", allData.igst_rate, allData.igst_amount],
        ["MISC:", "", allData.misc_amount],
        ["Total Amount:", "", allData.bill_amount],
        ["TCS:", allData.TCS_Rate, allData.TCS_Amt],
        ["TCS Net Payable:", "", allData.TCS_Net_Payable],
      ];

      pdf.autoTable({
        startY: pdf.lastAutoTable.finalY + 8,
        margin: { left: 10, right: pdf.internal.pageSize.width / 2 },
        body: eInvoiceData,
        theme: "plain",
        styles: {
          cellPadding: 0.5,
          fontSize: 8,
          halign: "left",
          valign: "middle",
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { fontStyle: 'bold' },
        }
      });

      pdf.setLineWidth(0.3);

      pdf.autoTable({
        startY: 156,
        margin: { left: pdf.internal.pageSize.width / 2 },
        body: summaryData,
        theme: "plain",
        styles: {
          cellPadding: 1,
          fontSize: 8,
          halign: "left",
          valign: "middle",
        },
        columnStyles: {
          2: { halign: "right", fontStyle: 'bold' },
        }
      });

      pdf.setFontSize(8);
      const lineY = pdf.lastAutoTable.finalY + 10;

      pdf.setLineWidth(0.3);
      pdf.line(10, lineY + 3, 200, lineY + 3);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");

      pdf.text(`Total Amount : ${totalAmountWords}.`, 10, lineY + 7);

      pdf.line(10, lineY + 9, 200, lineY + 9);

      pdf.setFontSize(8);
      pdf.text(`Our TAN NO.: ${allData.TIN || ""}`, 10, pdf.lastAutoTable.finalY + 24);
      pdf.text(`FSSAI No.: ${allData.FSSAI_No || ""}`, 60, pdf.lastAutoTable.finalY + 24);
      pdf.text(`PAN No.:  ${allData.Pan_No || ""}`, 110, pdf.lastAutoTable.finalY + 24);

      // Signature
      const signImg = new Image();
      signImg.src = Sign;
      signImg.onload = () => {
        pdf.setFontSize(8);

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
    <div id="pdf-content" >
      {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={invoiceData[0]} label={"SaleBill"} />}
      <PrintButton disabledFeild={disabledFeild} fetchData={fetchData} />
    </div>
  );
};
export default DebitCreditNoteReport;