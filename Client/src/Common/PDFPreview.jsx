import React, { useEffect, useState, useRef } from 'react';
import messageTemplates from "./MessageData/data.json";

const apiKey = process.env.REACT_APP_API;
const whatsAPPID = process.env.REACT_APP_WHATSAPPID;
const whatsAppToken = process.env.REACT_APP_WHATSAPPTOKEN;

const PdfPreview = ({ pdfData, apiData, label }) => {
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [isWhatsAppLoading, setIsWhatsAppLoading] = useState(false);
  const pdfWindowRef = useRef(null);
  const pdfNameRef = useRef('');

  useEffect(() => {
    if (!pdfWindowRef.current || pdfWindowRef.current.closed) {
      const pdfWindow = window.open('', '_blank');

      if (!pdfWindow) {
        alert('Popup blocked! Please allow popups for this website.');
        return;
      }

      const template = messageTemplates[label];
      if (!template) {
        alert("No template found for the provided label.");
        return;
      }

      const subject = template.subject.replace(/{(\w+)}/g, (_, key) => apiData[key] || "");
      const body = template.body;
      const pdfname = template.pdfName.replace(/{(\w+)}/g, (_, key) => apiData[key] || "");
      const whatsappMessage = template.whatsappMessage.replace(/{(\w+)}/g, (_, key) => apiData[key] || "");

      pdfNameRef.current = pdfname;
      setPdfName(pdfname);

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
              <button id="whatsappButton">WhatsApp PDF
                <div class="spinner"></div>
              </button>
            </div>
            <div class="embed-container">
              <embed src="${pdfData}" width="100%" height="100%" />
            </div>
            <div class="message"></div>
          </body>
        </html>
      `);
      pdfWindow.document.close();

      pdfWindow.onload = () => {
        const emailButton = pdfWindow.document.getElementById('emailButton');
        const emailInput = pdfWindow.document.getElementById('emailInput');
        const whatsappButton = pdfWindow.document.getElementById('whatsappButton');
        const whatsappInput = pdfWindow.document.getElementById('whatsappInput');
        const overlay = pdfWindow.document.querySelector('.overlay');
        const messageDiv = pdfWindow.document.querySelector('.message');

        const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        emailInput.value = apiData.billtoemail || ""
        emailButton.addEventListener('click', () => {
          const email = emailInput.value.trim();
          if (!email) {
            setEmailError('Email address is required.');
            return;
          } else if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address.');
            return;
          } else {
            setEmailError('');
          }

          overlay.classList.add('show');
          emailButton.disabled = true;
          whatsappButton.disabled = true;
          emailButton.classList.add('loading');
          setLoading(true);

          fetch(pdfData)
            .then((res) => res.blob())
            .then((pdfBlob) => {
              const formData = new FormData();

              formData.append('pdf', pdfBlob, `${pdfNameRef.current}.pdf`);
              formData.append('email', email);
              formData.append('message', subject);
              formData.append('messagebody', body);
              formData.append('query_label', label);

              fetch(`${apiKey}/send-pdf-email`, {
                method: 'POST',
                body: formData,
              })
                .then((response) => response.json())
                .then((data) => {
                  if (pdfWindow) {
                    pdfWindow.alert(data.message || 'Email sent successfully!');
                  } else {
                    alert(data.message || 'Email sent successfully!');
                  }
                })
                .catch((error) => {
                  alert('Error sending email.');
                  console.error('Error sending email:', error);
                })
                .finally(() => {
                  setLoading(false);
                  emailButton.classList.remove('loading');
                  emailButton.disabled = false;
                  whatsappButton.disabled = false;
                  overlay.classList.remove('show');
                });
            })
            .catch((error) => {
              console.error('Failed to fetch PDF blob:', error);
              alert('Error fetching PDF.');
              messageDiv.textContent = 'Error fetching PDF.';
              messageDiv.classList.remove('success');
              messageDiv.classList.add('error');
              emailButton.classList.remove('loading');
              emailButton.disabled = false;
              whatsappButton.disabled = false;
              overlay.classList.remove('show');
            });
        });

        whatsappInput.value = apiData.billtomobileto || "";
        whatsappButton.addEventListener('click', () => {
          const whatsappNumber = whatsappInput.value.trim();
          if (!whatsappNumber) {
            alert('Please enter a WhatsApp number.');
            return;
          }

          setIsWhatsAppLoading(true);
          whatsappButton.disabled = true;
          whatsappButton.classList.add('loading');

          fetch(pdfData)
            .then((res) => res.blob())
            .then((pdfBlob) => {
              const formData = new FormData();
              formData.append('file', pdfBlob, `${pdfNameRef.current}.pdf`);

              fetch(`${apiKey}/upload-to-github`, {
                method: 'POST',
                body: formData,
              })
                .then((response) => response.json())
                .then((data) => {
                  if (data.status === 'success' && data.file_url) {
                    const whatsappLink = `https://apps510.wawatext.com/api/send?number=91${whatsappNumber}&type=media&message=${whatsappMessage}&media_url=${data.file_url}&filename=${pdfNameRef.current}.pdf&instance_id=${whatsAPPID}&access_token=${whatsAppToken}`;
                    pdfWindow.open(whatsappLink, '_blank');

                  } else {
                    alert('Error uploading PDF to GitHub');
                  }
                })
                .catch((error) => {
                  alert('Error uploading PDF.');
                  console.error('Error uploading PDF:', error);
                })
                .finally(() => {
                  setIsWhatsAppLoading(false);
                  whatsappButton.classList.remove('loading');
                  whatsappButton.disabled = false;
                });
            })
            .catch((error) => {
              console.error('Failed to fetch PDF blob:', error);
              alert('Error fetching PDF.');
              setIsWhatsAppLoading(false);
              whatsappButton.classList.remove('loading');
              whatsappButton.disabled = false;
              overlay.classList.remove('show');
            });
        });
      };
    }
  }, [pdfData]);

  return null;
};

export default PdfPreview;
