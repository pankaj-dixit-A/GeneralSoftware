import React from "react";
import TableUtility from "../../../Common/UtilityCommon/TableUtility";

function DeliveryOredrUtility() {
    const apiUrl = `${process.env.REACT_APP_API}/getdata-DO`;
    const columns = [
        { key: "doc_no", label: "Doc No" },
        { key: "doc_date", label: "Doc Date" },
        { key: "purc_no", label: "Purc No" },
        { key: "tenderdetailid", label: "Tenderdetail Id" },
        { key: "quantal", label: "Quintal" },
        { key: "millName", label: "Mill Name" },
        { key: "saleBillName", label: "Sale Bill Name" },
        { key: "sbCityName", label: "SB City Name" },
        { key: "shipToName", label: "Ship To Name" },
        { key: "shipToCityName", label: "Ship To CityName" },
        { key: "sale_rate", label: "Sale Rate" },
        { key: "Tender_Commission", label: "Tender Commission" },
        { key: "tran_type", label: "Tran Type" },
        { key: "truck_no", label: "Truck No" },
        { key: "SB_No", label: "SB No" },
        { key: "EWay_Bill_No", label: "EWay Bill No" },
        { key: "Delivery_Type", label: "Delivery Type" },
        { key: "transportName", label: "Transport Name" },
        { key: "MM_Rate", label: "MM Rate" },
        { key: "doid", label: "Doid" },
    ];

    return (
        <TableUtility
            title="Delivery Order"
            apiUrl={apiUrl}
            queryParams={{
                Company_Code: sessionStorage.getItem("Company_Code"),
                Year_Code: sessionStorage.getItem("Year_Code"),
            }}
            columns={columns}
            rowKey="doc_no"
            addUrl="/delivery-order"
            detailUrl="/delivery-order"
            permissionUrl="/delivery-order-utility"
        />
    );
}

export default DeliveryOredrUtility;