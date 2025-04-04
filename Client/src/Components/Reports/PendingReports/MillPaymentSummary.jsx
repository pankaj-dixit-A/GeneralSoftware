import React, { useState, useEffect ,useMemo} from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate, useLocation } from 'react-router-dom';

const apikey = process.env.REACT_APP_API_URL;

const MillPaymentSummary = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { fromDate, toDate } = location.state || { fromDate: '', toDate: '' };

    console.log("fromDate", fromDate, toDate)

    const [reportData, setReportData] = useState([]);
    const [formattedGroupData, setFormattedGroupData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailId, setEmailId] = useState('');

    const API_URL = `${apikey}/api/sugarian/pendingreport-MillPayment-Summary`;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear());
        return `${day}/${month}/${year}`;
    };

    const incgst =(millamount,Quantal)=> {
        const incgstamt= parseFloat(millamount/Quantal)
        console.log('incgstamt-----',incgstamt)
        return incgstamt;
    }

    const adjamt=(adjustedamt,millamount,Quantal,PartyDispQty)=>{
        const incamt=incgst(millamount,Quantal);
        const frmgstamt=parseFloat(PartyDispQty * incamt)

        const adjugstamt= parseFloat(adjustedamt + frmgstamt);
        console.log('adjugstamt-----',adjugstamt)
        return adjugstamt;
    }

    const pqty=(adjustedamt,millamount,Quantal,PartyDispQty,paidamount)=>{
        debugger
        const incamt=parseFloat(millamount/Quantal)||0;
        const frmgstamt=parseFloat(PartyDispQty * incamt)|| 0;

        const adjugstamt= parseFloat(adjustedamt + frmgstamt)|| 0;
        
       // const incamt=incgst(millamount,Quantal);
       const paid=parseFloat(paidamount)|| 0
       const paidamt=parseFloat(paid + adjugstamt)|| 0;
        const pqtyamt=parseFloat((paidamt/incamt))|| 0;
 
       
        return pqtyamt.toFixed(2);
    }
    const amt=(adjustedamt,millamount,Quantal,PartyDispQty,paidamount)=>{
        debugger
        const incamt=parseFloat((millamount/Quantal)||0).toFixed(2);
        const frmgstamt=parseFloat((PartyDispQty * incamt)|| 0).toFixed(2);

        const adjugstamt= parseFloat((adjustedamt + frmgstamt)|| 0).toFixed(2);
        const millamt=parseFloat((millamount-paidamount)|| 0).toFixed(2)
        const amtreturn=parseFloat((millamt-adjugstamt)|| 0).toFixed(2)
      
        return amtreturn;
    }

    const bqty=(adjustedamt,millamount,Quantal,PartyDispQty,paidamount)=>{
        debugger
        const incamt=parseFloat(millamount/Quantal)||0;
        const frmgstamt=parseFloat(PartyDispQty * incamt)|| 0;

        const adjugstamt= parseFloat(adjustedamt + frmgstamt)|| 0;
        
       // const incamt=incgst(millamount,Quantal);
       const paid=parseFloat(paidamount)|| 0
       const paidamt=parseFloat( millamount - paid)|| 0;
       const millpaid=parseFloat(paidamt-adjugstamt)|| 0;
        const bqty=parseFloat(millpaid/incamt) || 0
        return bqty.toFixed(2);
    }

    const calculateGroupTotal = (items) => 
        items.reduce((sum, item) => sum + parseFloat(item.millamount || 0), 0);


    const groupDataWithSubgroup = (data, primaryKeySelector, secondaryKeySelector) => {
        const groupedData = {};
    
        data.forEach((item) => {
            const primaryKey = primaryKeySelector(item);
            const secondaryKey = secondaryKeySelector(item);
        
            if (!groupedData[primaryKey]) {
                groupedData[primaryKey] = {
                    subGroups: {}, // Initialize sub-groups
                    Grandtotal: 0, // Initialize grand total
                };
            }
        
            if (!groupedData[primaryKey].subGroups[secondaryKey]) {
                groupedData[primaryKey].subGroups[secondaryKey] = {
                    items: [], // Initialize items
                    totalQty: 0,
                    millamount: 0,
                    paidamount: 0,
                    PartyDispatchQty: 0,
                    frmmilladjamt: 0,
                    dispatched: 0,
                    DO: 0,
                    paidqty: 0,
                };
            }
        
            groupedData[primaryKey].subGroups[secondaryKey].items.push(item);
        
            // Update sub-group totals
            const subGroup = groupedData[primaryKey].subGroups[secondaryKey];
            subGroup.totalQty += parseFloat(item.Quantal || 0);
            subGroup.millamount += parseFloat(item.millamount || 0);
            subGroup.paidamount += parseFloat(item.paidamount || 0);
            subGroup.PartyDispatchQty += parseFloat(item.PartyDispQty || 0);
            subGroup.frmmilladjamt += parseFloat(item.PartyDispQty * (item.millamount / item.Quantal) || 0);
            subGroup.dispatched += parseFloat(item.despatched || 0);
            subGroup.DO += parseFloat(item.DO || 0);
        
            const pqtyamt = pqty(item.adjusted, item.millamount, item.Quantal, item.PartyDispQty, item.paidamount);
            subGroup.paidqty += parseFloat(pqtyamt - item.despatched + item.PartyDispQty || 0);
        
            // Update grand total
            groupedData[primaryKey].Grandtotal += parseFloat(amt(item.adjusted, item.millamount, item.Quantal, item.PartyDispQty, item.paidamount));
        
            //console.log(groupedData); // Debug the structure after each iteration
        });
        
        return groupedData;
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


    // Assuming you have a complex nested structure from groupDataWithSubgroup
const prepareDataForExcel = (groupedData) => {
    let excelData = [];

    Object.entries(groupedData).forEach(([parentKey, parentGroup]) => {
        Object.entries(parentGroup.subGroups).forEach(([subGroupKey, subGroupData]) => {
            subGroupData.items.forEach((item) => {
                // Flatten the item into the format needed for Excel
                excelData.push({
                    "Tender No": item.Tender_No,
                    "Date": formatDate(item.Tender_Date),
                    "Qty": item.Quantal,
                    "Mill Rate": item.Party_Bill_Rate,
                    "Inc Mill GST Rate": incgst(item.millamount, item.Quantal),
                    "Mill Amount": subGroupData.millamount,
                    "Paid": subGroupData.paidamount,
                    "Adj Amt": adjamt(item.adjusted, item.millamount, item.Quantal, item.PartyDispQty),
                    "P Qty": pqty(item.adjusted, item.millamount, item.Quantal, item.PartyDispQty, item.paidamount),
                    "Balance": amt(item.adjusted, item.millamount, item.Quantal, item.PartyDispQty, item.paidamount),
                    "B Qty": bqty(item.adjusted, item.millamount, item.Quantal, item.PartyDispQty, item.paidamount),
                    "Payment Date": item.Lifting_DateConverted
                });
            });
        });
    });

    return excelData;
};


const handleExportToExcel = () => {
    const dataForExcel = prepareDataForExcel(groupedReportDataWithSubgroup); // Transform the data first

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    XLSX.utils.book_append_sheet(wb, ws, 'Pending Reports');
    XLSX.writeFile(wb, 'MillpaymentSummary.xlsx');
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
        const groupedData = groupDataWithSubgroup(reportData); // Assuming this function groups your data correctly
        const tableData = [];
    
        Object.entries(groupedData).forEach(([parentKey, parentGroup]) => {
            // Parent Group Header
            tableData.push([
                { content: parentKey, colSpan: 12, styles: { halign: 'center', fontStyle: 'bold', textColor: [255, 0, 0] } }
            ]);
    
            Object.entries(parentGroup.subGroups).forEach(([subGroupKey, subGroupData]) => {
                // Subgroup Header
                tableData.push([
                    { content: `Sub-group: ${subGroupKey}`, colSpan: 12, styles: { halign: 'center', fontStyle: 'bold', textColor: [0, 0, 255] } }
                ]);
    
                // Subgroup Items
                subGroupData.items.forEach((item) => {
                    tableData.push([
                        item.Tender_No,
                        formatDate(item.Tender_Date),
                        item.Quantal,
                        item.Party_Bill_Rate,
                        incgst(item.millamount, item.Quantal),
                        subGroupData.millamount,
                        subGroupData.paidamount,
                        adjamt(item.adjusted, item.millamount, item.Quantal, item.PartyDispQty),
                        pqty(item.adjusted, item.millamount, item.Quantal, item.PartyDispQty, item.paidamount),
                        amt(item.adjusted, item.millamount, item.Quantal, item.PartyDispQty, item.paidamount),
                        bqty(item.adjusted, item.millamount, item.Quantal, item.PartyDispQty, item.paidamount),
                        item.Lifting_DateConverted,
                    ]);
                });
    
                // Subgroup Total Row
                tableData.push([
                    { content: 'Sub-group Totals', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
                    subGroupData.totalQty,
                    
                    subGroupData.millamount,
                    subGroupData.paidamount,
                    
                    subGroupData.paidqty,
                    
                ]);
            });
    
            // Parent Group Grand Total Row
            tableData.push([
                { content: `Grand Total: ${parentGroup.Grandtotal}`, colSpan: 12, styles: { halign: 'center', fontStyle: 'bold', textColor: [0, 128, 0] } }
            ]);
        });
    
        // Generate PDF
        doc.autoTable({
            head: [['Tender No', 'Date', 'Qty', 'Inc Mill GST Rate', 'Mill Amount', 'Paid', 'Adj Amt', 'P Qty', 'Balance', 'P Qty', 'Payment Date']],
            body: tableData,
            margin: { top: 10, right: 10, bottom: 10, left: 10 },
            styles: {
                cellPadding: 1,
                fontSize: 10,
                overflow: 'linebreak',
            },
            theme: 'striped',
        });
        setFormattedGroupData(tableData)
        return doc.output('blob');
    };
    

    const groupedReportDataWithSubgroup = useMemo(() => {
        return groupDataWithSubgroup(
            reportData,
            (item) => `${item.paymenttoname}`, // Parent group key
            (item) => item.tenderid // Sub-group key
        );
    }, [reportData]);

    const handleBack = () => {
        navigate('/pending-reports');
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

                <div className="col-auto mb-3">
                    <input
                        type="email"
                        id="email"
                        className="form-control"
                        value={emailId}
                        onChange={(e) => setEmailId(e.target.value)}
                        placeholder="Enter email to send report"
                        style={{ maxWidth: '500px', padding: '10px' }}
                    />
                </div>

                <div className="col-auto">
                    <button className="btn btn-primary" onClick={handleSendEmail}>
                        Mail PDF
                    </button>
                </div>
            </div>

            <div className="table-responsive">
                <table className="table table-striped table-bordered mt-4" id="reportTable">
                    <thead className="table-light">
                        <tr>
                            <th>Tender No</th>
                            <th>Date</th>
                            <th>Qty</th>
                            <th>Mill Rate</th>
                            <th>Inc Mill GST Rate</th>
                            <th>Mill Amount</th>
                             <th>Paid</th>
                           <th>Adj Amt</th>
                             <th>P Qty</th>
                           <th>Balance</th>
                             <th>B Qty</th>
                            <th>Payment Date</th> 
                        </tr>
                    </thead>
                    <tbody>
    {Object.entries(groupedReportDataWithSubgroup).map(([parentKey, parentData]) => (
        <React.Fragment key={parentKey}>
            {/* Parent Group Header */}
            <tr>
                <td colSpan={12} className="table-primary" style={{ color: 'red', fontWeight: 'bold' }} align="center">
                    {parentKey}
                </td>
            </tr>

            {/* Sub-groups */}
            {Object.entries(parentData.subGroups || {}).map(([subGroupKey, subGroupData]) => (
                <React.Fragment key={subGroupKey}>
                    {/* Sub-group Header */}
                    <tr>
                        {/* <td colSpan={12} className="table-secondary" style={{ fontWeight: 'bold' }} align="center">
                            Sub-group: {subGroupKey}
                        </td> */}
                    </tr>

                    {/* Items in Sub-group */}
                    {subGroupData.items && subGroupData.items.map((item, index) => (
                        <tr key={index}>
                            <td>{item.Tender_No}</td>
                            <td>{formatDate(item.Tender_Date)}</td>
                            <td>{item.Quantal}</td>
                            <td>{item.Party_Bill_Rate}</td>
                            <td>{incgst(item.millamount, item.Quantal)}</td>
                            <td>{subGroupData.millamount}</td>
                            <td>{subGroupData.paidamount}</td>
                            <td>{adjamt(item.adjusted, item.millamount, item.Quantal, item.PartyDispQty)}</td>
                            <td>{pqty(item.adjusted, item.millamount, item.Quantal, item.PartyDispQty, item.paidamount)}</td>
                            <td>{amt(item.adjusted, item.millamount, item.Quantal, item.PartyDispQty, item.paidamount)}</td>
                            <td>{bqty(item.adjusted, item.millamount, item.Quantal, item.PartyDispQty, item.paidamount)}</td>
                            <td>{item.Lifting_DateConverted}</td>
                        </tr>
                    ))}

                    {/* Sub-group Totals */}
                    <tr>
                        <td colSpan={3} className="text-end fw-bold" align="left">{subGroupData.totalQty}</td>
                        <td className="text-end fw-bold" align="left">{subGroupData.PartyDispatchQty}</td>
                        
                        <td className="text-end fw-bold" align="left">{subGroupData.frmmilladjamt}</td>
                        <td className="text-end fw-bold">Dispatched</td>
                        <td align="left">{subGroupData.dispatched}</td>
                        <td>DO</td>
                        <td align="right">{subGroupData.DO}</td>
                        <td>paid Qty:</td>
                        <td align="right">{subGroupData.paidqty}</td>
                    </tr>
                    
                </React.Fragment>
            ))}

            {/* Parent Group Grand Total */}
            <tr>
                <td colSpan={11} className="table-primary" style={{ fontWeight: 'bold', color: 'red' }} align="right">
                    Grand Total: {parentData.Grandtotal}
                </td>
            </tr>
           
        </React.Fragment>
    ))}
</tbody>




                </table>
            </div>
            {loading && <p>Loading report data...</p>}
            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default MillPaymentSummary;
