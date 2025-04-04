import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility";

function JournalVoucher_Utility() {
    const apiUrl = `${process.env.REACT_APP_API}/getdata-receiptpayment`;
    const columns = [
        { key: "doc_no", label: "Doc No" },
        { key: "tran_type", label: "Tran Type" },
        { key: "doc_date", label: "Doc Date" },
        { key: "amount", label: "Amount" },
        { key: "debit_ac", label: "Debit Ac" },
        { key: "debitName", label: "Debit Ac Name" },
        { key: "narration", label: "Narration" },
        { key: "tranid", label: "Tran ID" },
        { key: "trandetailid", label: "Tran Detail ID" },
    ];

    return (
        <TableUtility
            title="Journal Voucher"
            apiUrl={apiUrl}
            queryParams={{
                Company_Code: sessionStorage.getItem("Company_Code"),
                Year_Code: sessionStorage.getItem("Year_Code"),
                tran_type: "JV", 
            }}
            columns={columns}
            rowKey="doc_no"
            addUrl="/journal-voucher"  
            detailUrl="/journal-voucher"  
            permissionUrl="/JournalVoucher_Utility"  
        />
    );
}

export default JournalVoucher_Utility;