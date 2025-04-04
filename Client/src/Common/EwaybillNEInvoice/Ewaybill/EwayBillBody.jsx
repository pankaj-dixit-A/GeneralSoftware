
export const ewaybillData = (EwabyBillData, tran_type) => {
    const formData = EwabyBillData;
    console.log(tran_type);
  
    //Format the address.
    const formatAddress = (inputString) => {
      let cleanedString = inputString.replace(/[^a-zA-Z0-9]/g, " ");
      cleanedString = cleanedString.replace(/\s+/g, " ").trim();
      if (cleanedString.length < 3) {
        return "Error: String is too short. Minimum length is 3.";
      }
      if (cleanedString.length > 100) {
        cleanedString = cleanedString.substring(0, 100).trim();
      }
  
      return cleanedString;
    };
  
    // Format the date
    const formatDate = (date) => {
      const d = new Date(date);
      const day = ("0" + d.getDate()).slice(-2);
      const month = ("0" + (d.getMonth() + 1)).slice(-2);
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };
  
    const formatName = (inputString = "") => {
      return inputString.replace(/[^a-zA-Z0-9 ]/g, " ").trim();
    };
  
    const eWayBillData = {
      token: "",
      eWayBillData: {
        "supplyType": "O",
        "subSupplyType": "1",
        "subSupplyDesc": "others",
        "docType": "INV",
        "docNo": formData.doc_no,
        "docDate": formatDate(formData.doc_date),
        "fromGstin": "05AAACG2115R1ZN",
        "fromTrdName":formatName(formData.Company_Name_E),
        "fromAddr1": formatAddress(formData.millname),
        "fromAddr2": formatAddress(formData.milladdress),
        "fromPlace": formData.millcityname,
        "fromPincode": formData.millpincode,
        "actFromStateCode": formData.actFromStateCode,
        "fromStateCode": formData.fromStateCode,
        "toGstin": formData.BillToGst,
        "toTrdName": formatName(formData.BillToName),
        "toAddr1": formatAddress(formData.ShippTo),
        "toAddr2": formatAddress(formData.Address_E),
        "toPlace": formData.city_name_e,
        "toPincode": formData.pincode,
        "actToStateCode": formData.actToStateCode,
        "toStateCode": formData.toStateCode,
        "totalValue": parseInt(formData.TaxableAmount),
        "cgstValue": parseInt(formData.CGSTAmount),
        "sgstValue":  parseInt(formData.SGSTAmount),
        "igstValue":  parseInt(formData.IGSTAmount),
        "cessValue": 0,
        "totInvValue":  parseInt(
          (parseInt(formData.TaxableAmount) || 0) +
            (parseInt(formData.CGSTAmount) || 0) +
            (parseInt(formData.SGSTAmount) || 0) +
            (parseInt(formData.IGSTAmount) || 0) +
            (parseInt(formData.cessValue) || 0) +
            (parseInt(formData.otherAmount) || 0)
        ),
        "transporterId": "",
        "transporterName": "",
        "transDocNo": "",
        "transMode": "1",
        "transDistance": formData.Distance,
        "transDocDate": "",
        "vehicleNo": formData.LORRYNO,
        "vehicleType": "R",
        "transactionType":formData.tranType,
        "itemList": [
          {
            "productName": formData.System_Name_E,
            "productDesc": formData.System_Name_E,
            "hsnCode": formData.HSN,
            "quantity": parseInt(formData.NETQNTL),
            "qtyUnit": "QTL",
            "cgstRate": parseInt(formData.CGSTRate),
            "sgstRate": parseInt(formData.SGSTRate),
            "igstRate": parseInt(formData.IGSTRate),
            "cessRate": 0,
            "cessAdvol": 0,
            "taxableAmount": parseInt(formData.TaxableAmount)
          }
        ]
      },
    };
  
    return eWayBillData;
  };
  