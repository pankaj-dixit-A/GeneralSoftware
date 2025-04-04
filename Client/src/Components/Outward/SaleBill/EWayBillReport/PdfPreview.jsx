import React, { useEffect, useState, useRef } from "react";
const API_URL = process.env.REACT_APP_API;

const PdfPreview = ({ pdfData, apiData, label }) => {
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [pdfName, setPdfName] = useState("");
  const pdfWindowRef = useRef(null);
  const pdfNameRef = useRef("");

  useEffect(() => {
    if (!pdfWindowRef.current || pdfWindowRef.current.closed) {
      const pdfWindow = window.open("", "_blank");

      if (!pdfWindow) {
        alert("Popup blocked! Please allow popups for this website.");
        return;
      }

      let subject = "";
      let body = "";
      let pdfname = "";

      if (label === "SaleBill") {
        subject = `Bill No: ${apiData?.doc_no} Lorry No: ${apiData?.LORRYNO} Mill Name: ${apiData?.millname} Get Pass: ${apiData?.billtoname}`;
        body = "Sale Bill";
        pdfname = `SaleBill_${apiData?.doc_no} - ${apiData?.LORRYNO}`;
        pdfNameRef.current = pdfname;
        setPdfName(pdfname);
      }
      if (label === "EwayBill") {
        subject = `EWayBill NO: ${apiData.EWay_Bill_No} Bill No: ${apiData?.doc_no} Lorry No: ${apiData?.LORRYNO} Mill Name: ${apiData?.millname} Get Pass: ${apiData?.Buyer_Name}`;
        body = "Eway Bill";
        pdfname = `EWayBill_${apiData?.doc_no} - ${apiData?.LORRYNO}`;
        pdfNameRef.current = pdfname;
        setPdfName(pdfname);
      }

      pdfWindow.document.write(`
        <html>
          <head>
            <title>PDF Preview</title>
            <style>
              .top-row { display: flex; gap: 10px; margin: 10px; }
              .top-row input { padding: 5px; font-size: 14px; }
              .top-row button { padding: 6px 12px; font-size: 14px; position: relative; cursor: pointer; }
              .top-row button[disabled] { cursor: not-allowed; }
              .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 20px; height: 20px; animation: spin 2s linear infinite; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: none; }
              .top-row button.loading .spinner { display: block; }
              .embed-container { margin-top: 20px; }
              .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 999; display: none; }
              .overlay.show { display: block; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              .message { text-align: center; margin-top: 20px; font-size: 16px; color: green; }
              .message.error { color: red; }
            </style>
          </head>
          <body>
            <div class="overlay"></div>
            <div class="top-row">
              <input type="email" placeholder="Enter email address" id="emailInput" />
              <button id="emailButton">Email PDF
                <div class="spinner"></div>
              </button>
              <input type="tel" placeholder="Enter WhatsApp number" id="whatsappInput" />
              <button id="whatsappButton">WhatsApp PDF</button>
            </div>
            <div class="embed-container">
              <embed src="${pdfData}" width="100%" height="170%" />
            </div>
            <div class="message"></div>
          </body>
        </html>
      `);
      pdfWindow.document.close();

      pdfWindow.onload = () => {
        const emailButton = pdfWindow.document.getElementById("emailButton");
        const emailInput = pdfWindow.document.getElementById("emailInput");
        const whatsappButton =
          pdfWindow.document.getElementById("whatsappButton");
        const whatsappInput =
          pdfWindow.document.getElementById("whatsappInput");
        const overlay = pdfWindow.document.querySelector(".overlay");
        const messageDiv = pdfWindow.document.querySelector(".message");

        // Populate the email field and message if available in apiData
        if (apiData && apiData.Buyer_Email_Id) {
          emailInput.value = apiData.Buyer_Email_Id.trim();
          messageDiv.textContent = `${apiData.doc_no} - ${apiData.LORRYNO}`;
        }

        // Email validation regex
        const validateEmail = (email) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        emailButton.addEventListener("click", () => {
          const email = emailInput.value.trim();
          if (!email) {
            setEmailError("Email address is required.");
            return;
          } else if (!validateEmail(email)) {
            setEmailError("Please enter a valid email address.");
            return;
          } else {
            setEmailError("");
          }

          overlay.classList.add("show");
          emailButton.disabled = true;
          whatsappButton.disabled = true;
          emailButton.classList.add("loading");
          setLoading(true);

          fetch(pdfData)
            .then((res) => res.blob())
            .then((pdfBlob) => {
              const formData = new FormData();

              formData.append("pdf", pdfBlob, `${pdfname}.pdf`);
              formData.append("email", email);
              formData.append("message", subject);
              formData.append("messagebody", body);

              fetch(`${API_URL}/send-pdf-email`, {
                method: "POST",
                body: formData,
              })
                .then((response) => response.json())
                .then((data) => {
                  if (pdfWindow) {
                    pdfWindow.alert(data.message || "Email sent successfully!");
                  } else {
                    alert(data.message || "Email sent successfully!");
                  }
                })
                .catch((error) => {
                  alert("Error sending email.");
                  console.error("Error sending email:", error);
                })
                .finally(() => {
                  setLoading(false);
                  emailButton.classList.remove("loading");
                  emailButton.disabled = false;
                  whatsappButton.disabled = false;
                  overlay.classList.remove("show");
                });
            })
            .catch((error) => {
              console.error("Failed to fetch PDF blob:", error);
              alert("Error fetching PDF.");
              messageDiv.textContent = "Error fetching PDF.";
              messageDiv.classList.remove("success");
              messageDiv.classList.add("error");
              emailButton.classList.remove("loading");
              emailButton.disabled = false;
              whatsappButton.disabled = false;
              overlay.classList.remove("show");
            });
        });

        // WhatsApp Button Event
        whatsappButton.addEventListener("click", () => {
          const whatsappNumber = whatsappInput.value.trim();
          if (!whatsappNumber) {
            alert("Please enter a WhatsApp number.");
            return;
          }

          const wpMessage = `HI, ${label} FROM ${
            apiData.Company_Name_E || apiData.fromName
          } DATE: ${
            apiData.doc_dateConverted || apiData.Doc_Date
          } TAX INVOICE NO: SB-${apiData.doc_no} DO NO: ${
            apiData.DO_No || ""
          } BUYER: ${apiData.billtoname || apiData.Buyer_Name} CITY: ${
            apiData.billtopin || apiData.Buyer_City
          } TO: ${apiData.billtoname || apiData.Buyer_Name} CITY: ${
            apiData.billtopin || apiData.Buyer_City
          } MILL NAME: ${apiData.millname || ""} DRIVER NO: ${
            apiData.driver_no || ""
          } TRUCK NO: ${apiData.LORRYNO} SESSON: ${
            apiData.season || ""
          } GRADE: ${apiData.grade || ""} SALE RATE: ${
            apiData.salerate || apiData.rate
          } COMMSSION: ${apiData.bank_commission || ""} EWAY BILL NO: ${
            apiData.EWay_Bill_No
          } VALID TILL: ${
            apiData.EwayBillValidDate || apiData.validUpTo
          } EINVOICE NO: ${apiData.einvoiceno} ACK NO: ${
            apiData.ackno || ""
          } FOR DETAIL PLEASE OPEN ATTACHED PDF FILE ANY PROBLEM CALL ON ${
            apiData.PHONE || apiData.fromPhone || ""
          }`;

          // Upload PDF to API and get the file URL
          fetch(pdfData)
            .then((res) => res.blob())
            .then((pdfBlob) => {
              const formData = new FormData();
              formData.append("file", pdfBlob, `${pdfNameRef.current}.pdf`);

              fetch(`${API_URL}upload-to-github`, {
                method: "POST",
                body: formData,
              })
                .then((response) => response.json())
                .then((data) => {
                  if (data.status === "success" && data.file_url) {
                    const whatsappLink = `https://apps510.wawatext.com/api/send?number=91${whatsappNumber}&type=media&message=${wpMessage}&media_url=${data.file_url}&filename=${pdfNameRef.current}.pdf&instance_id=6698D83A2AF88&access_token=666947b0e0d2d`;
                    pdfWindow.open(whatsappLink, "_blank");
                  } else {
                    alert("Error uploading PDF to GitHub");
                  }
                })
                .catch((error) => {
                  alert("Error uploading PDF.");
                  console.error("Error uploading PDF:", error);
                });
            })
            .catch((error) => {
              console.error("Failed to fetch PDF blob:", error);
              alert("Error fetching PDF.");
            });
        });
      };
    }
  }, [pdfData]);

  return null;
};

export default PdfPreview;
