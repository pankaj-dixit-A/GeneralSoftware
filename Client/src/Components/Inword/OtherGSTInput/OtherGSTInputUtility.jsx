import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility"; 

const OtherGSTInputUtility = () => {
    const apiUrl = `${process.env.REACT_APP_API}/getall-OtherGSTInput`;
    const columns = [
        { label: "Doc No", key: "Doc_No" },
        { label: "Doc Date", key: "Doc_Date" },
        { label: "CGST Amount", key: "CGST_Amt" },
        { label: "SGST Amount", key: "SGST_Amt" },
        { label: "IGST Amount", key: "IGST_Amt" },
        { label: "Narration", key: "Narration" },
        { label: "OID", key: "OId" },
    ];

    return (
        <TableUtility
            title="Other GST Input"
            apiUrl={apiUrl}
            columns={columns}
            rowKey="OId"
            addUrl="/other-gst-input"
            detailUrl="/other-gst-input"
            permissionUrl="/OtherGSTInput-utility"
        />
    );
};

export default OtherGSTInputUtility;