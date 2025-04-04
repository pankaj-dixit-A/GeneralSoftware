import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { useRecordLocking } from "../../../hooks/useRecordLocking";
import "react-toastify/dist/ReactToastify.css";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import ItemMasterHelp from "../../../Helper/SystemmasterHelp";
import GSTRateMasterHelp from "../../../Helper/GSTRateMasterHelp";
import "../CommissionBill/CommissionBill.css";
import { HashLoader } from 'react-spinners';



const API_URL = process.env.REACT_APP_API;

let SupplierName = "";
let newac_code = "";
let UnitName = "";
let newunit_code = "";
let BrokerName = "";
let newbroker_code = "";
let TransportName = "";
let newtransport_code = "";
let GstRateName = "";
let newgst_code = "";
let MillName = "";
let newmill_code = "";
let newnarration1 = "";
let newnarration2 = "";
let ItemName = "";
let newitem_code = "";
let TdsName = "";
let newTDS_Ac = "";

const CommissionBill = () => {
  const companyCode = sessionStorage.getItem("Company_Code");
const Year_Code = sessionStorage.getItem("Year_Code");
  const [updateButtonClicked, setUpdateButtonClicked] = useState(false);
  const [saveButtonClicked, setSaveButtonClicked] = useState(false);
  const [addOneButtonEnabled, setAddOneButtonEnabled] = useState(false);
  const [saveButtonEnabled, setSaveButtonEnabled] = useState(true);
  const [cancelButtonEnabled, setCancelButtonEnabled] = useState(true);
  const [editButtonEnabled, setEditButtonEnabled] = useState(false);
  const [deleteButtonEnabled, setDeleteButtonEnabled] = useState(false);
  const [backButtonEnabled, setBackButtonEnabled] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [highlightedButton, setHighlightedButton] = useState(null);
  const [cancelButtonClicked, setCancelButtonClicked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [accountCode, setAccountCode] = useState("");
  const [supplier, setSupplier] = useState();
  const [Unit, setUnit] = useState();
  const [broker, setBroker] = useState();
  const [mill, setMill] = useState();
  const [transport, setTransport] = useState();
  const [TDS, setTDS] = useState();
  const [GstRateCode, setGstRateCode] = useState();
  const [GstRate, setGstRate] = useState();
  const [item, setItem] = useState();
  const [supplierGSTStateCode, setSupplierGSTStateCode] = useState();
  const [matchStatus, setMatchStatus] = useState(null);
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate();

  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;

  const selectedfilter = location.state?.tranType;
  const [tranType, setTranType] = useState(selectedfilter);

  const selectedVoucherNo = location.state?.selectedVoucherNo;
  const selectedVoucherType = location.state?.selectedVoucherType;

  const permissions = location.state?.permissionsData;

  const TranTypeInputRef = useRef(null);

  const initialFormData = {
    doc_no: "",
    doc_date: new Date().toISOString().split("T")[0],
    link_no: 0,
    link_type: "",
    link_id: 0,
    ac_code: 0,
    unit_code: 0,
    broker_code: 2,
    qntl: 0,
    packing: 50,
    bags: 0,
    grade: "",
    transport_code: 0,
    mill_rate: 0.0,
    sale_rate: 0.0,
    purc_rate: 0.0,
    commission_amount: 0.0,
    resale_rate: 0.0,
    resale_commission: 0.0,
    misc_amount: 0.0,
    texable_amount: 0.0,
    gst_code: 1,
    cgst_rate: 0.0,
    cgst_amount: 0.0,
    sgst_rate: 0.0,
    sgst_amount: 0.0,
    igst_rate: 0.0,
    igst_amount: 0.0,
    bill_amount: 0.0,
    Company_Code: companyCode,
    Year_Code: Year_Code,
    Branch_Code: 0,
    Created_By: "",
    Modified_By: "",
    ac: 0,
    uc: 0,
    bc: 0,
    tc: 0,
    mill_code: 0,
    mc: 0,
    narration1: "",
    narration2: "",
    narration3: "",
    narration4: "",
    TCS_Rate: 0.0,
    TCS_Amt: 0.0,
    TCS_Net_Payable: 0.0,
    BANK_COMMISSION: 0.0,
    HSN: "",
    einvoiceno: "",
    ackno: 0,
    item_code: 1,
    ic: 0,
    Tran_Type: tranType,
    Frieght_Rate: 0.0,
    Frieght_amt: 0.0,
    subtotal: 0.0,
    IsTDS: "Y",
    TDS_Ac: 0,
    TDS_Per: 0.0,
    TDSAmount: 0.0,
    TDS: 0.0,
    ta: 0,
    QRCode: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "TDS") {
      setFormData({
        ...formData,
        [name]: value, 
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  //Using the useRecordLocking to manage the multiple user cannot edit the same record at a time.
  const { isRecordLockedByUser, lockRecord, unlockRecord } = useRecordLocking(
    formData.doc_no,
    tranType || selectedVoucherType,
    companyCode,
    Year_Code,
    "commission_bill"
  );

  const validateNumericInput = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.-]/g, "");
  };

  const handleSelectKeyDown = (event, field) => {
    const options = {
      IsTDS: ["Y", "N"],
      Tran_Type: ["LV", "CV"],
    };

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const currentOptions = options[field];
      const currentIndex = currentOptions.indexOf(formData[field]);
      const nextIndex =
        event.key === "ArrowUp"
          ? (currentIndex - 1 + currentOptions.length) % currentOptions.length
          : (currentIndex + 1) % currentOptions.length;
      setFormData({ ...formData, [field]: currentOptions[nextIndex] });
    }
  };

  const handleDateChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const checkMatchStatus = async (ac_code, company_code, year_code) => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API}/get_match_status`,
        {
          params: {
            Ac_Code: ac_code,
            Company_Code: company_code,
            Year_Code: year_code,
          },
        }
      );
      return data.match_status;
    } catch (error) {
      console.error("Couldn't able to match GST State Code:", error);
      return error;
    }
  };

  const handleAcCode = async (code, accoid) => {
    setSupplier(code);
    try {
      const matchStatus = await checkMatchStatus(code, companyCode, Year_Code);
      const match = matchStatus === "TRUE";
      const rate = parseFloat(GstRate) || 0;
      let newFormData = {
        ...formData,
        ac_code: code,
        ac: accoid,
        gst_code: formData.gst_code, // Assuming gst_code is being managed separately
        cgst_rate: match ? rate / 2 : 0,
        sgst_rate: match ? rate / 2 : 0,
        igst_rate: match ? 0 : rate,
      };

      setMatchStatus(match);
      setFormData(newFormData);
      calculateAndSetGSTAmounts(newFormData);
    } catch (error) {
      console.error("Error in handleAcCode:", error);
      toast.error("Failed to update account code details.");
    }
  };
  const calculateAndSetGSTAmounts = async (formData) => {
    const taxableAmount = parseFloat(formData.texable_amount) || 0;
    const cgstAmount = (taxableAmount * formData.cgst_rate) / 100;
    const sgstAmount = (taxableAmount * formData.sgst_rate) / 100;
    const igstAmount = (taxableAmount * formData.igst_rate) / 100;

    const updatedFormData = {
      ...formData,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      igst_amount: igstAmount,
    };
    setFormData(updatedFormData);
  };

  const handleUnitCode = (code, accoid) => {
    setUnit(code);
    setFormData((prevState) => ({
      ...prevState,
      unit_code: code,
      uc: accoid,
    }));
  };

  const handleBrokerCode = (code, accoid) => {
    setBroker(code);
    setFormData((prevState) => ({
      ...prevState,
      broker_code: code,
      bc: accoid,
    }));
  };

  const handleTransportCode = (code, accoid) => {
    setTransport(code);
    setFormData((prevState) => ({
      ...prevState,
      transport_code: code,
      tc: accoid,
    }));
  };

  const handleGSTCode = async (code, Rate) => {
    const rate = parseFloat(Rate) || 0;

    try {
      const sameState = await checkMatchStatus(
        formData.ac_code,
        companyCode,
        Year_Code
      );

      const newFormData = {
        ...formData,
        gst_code: code,
        cgst_rate: sameState ? rate / 2 : 0,
        sgst_rate: sameState ? rate / 2 : 0,
        igst_rate: sameState ? 0 : rate,
      };

      setGstRateCode(code);
      setGstRate(rate);
      setFormData(newFormData);
      calculateAndSetGSTAmounts(newFormData);
    } catch (error) {
      console.error("Error handling GST Code change:", error);
      toast.error("Failed to update GST details. Please try again.");
    }
  };

  const handleMillCode = (code, accoid) => {
    setFormData((prevState) => ({
      ...prevState,
      mill_code: code,
      mc: accoid,
    }));
  };

  const handleNarration1 = (code) => {
    setAccountCode(code);
    setFormData((prevState) => ({
      ...prevState,
      narration1: code,
    }));
  };

  const handleNarration2 = (code) => {
    setAccountCode(code);
    setFormData((prevState) => ({
      ...prevState,
      narration2: code,
    }));
  };

  const handleItemCode = (code, accoid, HSN) => {
    setItem(code);
    setFormData((prevState) => ({
      ...prevState,
      item_code: code,
      ic: accoid,
      HSN: HSN,
    }));
  };

  const handleTDSAc = (code, accoid) => {
    setTDS(code);
    setFormData((prevState) => ({
      ...prevState,
      TDS_Ac: code,
      ta: accoid,
    }));
  };

  //calculations
  const calculateBags = (qntl, packing) => {
    return (qntl / packing) * 100;
  };

  const calculateFreight = (freightRate, qntl) => {
    return freightRate * qntl;
  };

  const calculateRDiffTenderRate = (saleRate, millRate, purchaseRate) => {
    if (purchaseRate > 0) {
      return millRate - purchaseRate;
    }
    return saleRate - millRate;
  };

  const calculateTenderDiffRateAmount = (rDiffTenderRate, qntl) => {
    return rDiffTenderRate * qntl;
  };

  const calculateResaleRate = (resale_commission, qntl) => {
    return resale_commission * qntl;
  };

  const calculateSubtotal = (rDiffTenderRate, qntl, resale_rate) => {
    return rDiffTenderRate * qntl + resale_rate;
  };

  const calculateTaxable = (subtotal, freight) => {
    return subtotal + freight;
  };

  const calculateCGSTAmount = (taxable, cgstRate) => {
    return (taxable * cgstRate) / 100;
  };

  const calculateSGSTAmount = (taxable, sgstRate) => {
    return (taxable * sgstRate) / 100;
  };

  const calculateIGSTAmount = (taxable, igstRate) => {
    return (taxable * igstRate) / 100;
  };

  const calculateBillAmount = (
    taxable,
    cgstAmount,
    sgstAmount,
    igstAmount,
    bankCommission,
    misc_Amount
  ) => {
    return (
      taxable +
      cgstAmount +
      sgstAmount +
      igstAmount +
      bankCommission +
      misc_Amount
    );
  };

  const calculateTCSAmount = (billAmount, tcsRate) => {
    return (billAmount * tcsRate) / 100;
  };

  const calculateTDSAmount = (taxable, tdsRate) => {
    return Math.round((taxable * tdsRate) / 100);
  };

  const calculateNetPayable = (billAmount, tcsAmount, hasTCS) => {
    if (hasTCS) {
      return billAmount + tcsAmount;
    }
    return billAmount;
  };

  const handleKeyDownCalculations = async (event) => {
    if (event.key === "Tab") {
      debugger;
      const { name, value } = event.target;
      let newFormData = { ...formData };

      // Check if states match for GST calculations
      const sameState = await checkMatchStatus(
        formData.ac_code,
        companyCode,
        Year_Code
      );
      const parseNumber = (num) => parseFloat(num) || 0;
      if (
        [
          "Frieght_Rate",
          "qntl",
          "sale_rate",
          "texable_amount",
          "mill_rate",
          "resale_commission",
          "BANK_COMMISSION",
          "misc_amount",
          "packing",
          "purc_rate",
        ].includes(name)
      ) {
        const freightRate = parseNumber(formData.Frieght_Rate);
        const qntl = parseNumber(formData.qntl);
        const saleRate = parseNumber(formData.sale_rate);
        const millRate = parseNumber(formData.mill_rate);
        const resaleCommission = parseNumber(formData.resale_commission);
        const bankCommission = parseNumber(formData.BANK_COMMISSION);
        const miscAmount = parseNumber(formData.misc_amount);
        const purcRate = parseNumber(formData.purc_rate);
        

        const rDiffTenderRate = calculateRDiffTenderRate(
          saleRate,
          millRate,
          purcRate
        );
        const tenderDiffRate = calculateTenderDiffRateAmount(
          rDiffTenderRate,
          qntl
        );
        const packing = parseInt(formData.packing) || 0;
        const bag = calculateBags(qntl, packing);
        const freightAmt = calculateFreight(freightRate, qntl);
        const resaleRate = calculateResaleRate(resaleCommission, qntl);
        const subtotal = calculateSubtotal(rDiffTenderRate, qntl, resaleRate);
        const taxable = calculateTaxable(subtotal, freightAmt);

        const tdsBase = parseNumber(formData.TDS) || taxable; 

        const cgstRate = parseNumber(formData.cgst_rate);
        const sgstRate = parseNumber(formData.sgst_rate);
        const igstRate = parseNumber(formData.igst_rate);

        const cgstAmount = sameState
          ? calculateCGSTAmount(taxable, cgstRate)
          : 0;
        const sgstAmount = sameState
          ? calculateSGSTAmount(taxable, sgstRate)
          : 0;
        const igstAmount = !sameState
          ? calculateIGSTAmount(taxable, igstRate)
          : 0;

        const billAmount = calculateBillAmount(
          taxable,
          cgstAmount,
          sgstAmount,
          igstAmount,
          bankCommission,
          miscAmount
        );

        const tcsRate =
          formData.IsTDS === "N" ? parseNumber(formData.TCS_Rate) : 0;
        const tcsAmount =
          formData.IsTDS === "N" ? calculateTCSAmount(billAmount, tcsRate) : 0;
        let tdsAmount = 0;
        const tdsRate =
          formData.IsTDS === "Y" ? parseNumber(formData.TDS_Per) : 0;
          if (formData.IsTDS === "Y" && tdsBase > 0 && tdsRate > 0) {
             tdsAmount = calculateTDSAmount(tdsBase, tdsRate);
          }

        const hasTCS = tcsAmount > 0;
        const netPayable = calculateNetPayable(billAmount, tcsAmount, hasTCS);

        newFormData = {
          ...newFormData,
          bags: bag,
          Frieght_amt: freightAmt,
          commission_amount: rDiffTenderRate,
          resale_rate: resaleRate,
          subtotal: subtotal,
          texable_amount: taxable,
          cgst_amount: cgstAmount,
          sgst_amount: sgstAmount,
          igst_amount: igstAmount,
          bill_amount: billAmount,
          TCS_Amt: tcsAmount,
          TCS_Net_Payable: netPayable,
          TDS: tdsBase,
          TDSAmount: tdsAmount,
          sale_rate: purcRate > 0 ? 0 : saleRate,
        };
      }

      // Perform GST-specific calculations
      if (
        [
          "cgst_rate",
          "sgst_rate",
          "texable_amount",
          "cgst_amount",
          "sgst_amount",
          "TCS_Rate",
          "bill_amount",
          "TDS_Per",
          "igst_rate",
          "BANK_COMMISSION",
          "misc_amount",
        ].includes(name)
      ) {
        const cgstRate = parseNumber(formData.cgst_rate);
        const sgstRate = parseNumber(formData.sgst_rate);
        const igstRate = parseNumber(formData.igst_rate);
        const taxable = parseNumber(formData.texable_amount);
        const tdsBase = parseNumber(formData.TDS) || taxable; 


        const cgstAmount = sameState
          ? calculateCGSTAmount(taxable, cgstRate)
          : 0;
        const sgstAmount = sameState
          ? calculateSGSTAmount(taxable, sgstRate)
          : 0;
        const igstAmount = !sameState
          ? calculateIGSTAmount(taxable, igstRate)
          : 0;

        const bankCommission = parseNumber(formData.BANK_COMMISSION);
        const miscAmount = parseNumber(formData.misc_amount);

        const billAmount = calculateBillAmount(
          taxable,
          cgstAmount,
          sgstAmount,
          igstAmount,
          bankCommission,
          miscAmount
        );

        const tcsRate =
          formData.IsTDS === "N" ? parseNumber(formData.TCS_Rate) : 0;
        const tcsAmount =
          formData.IsTDS === "N" ? calculateTCSAmount(billAmount, tcsRate) : 0;

          let tdsAmount = 0;
          const tdsRate =
            formData.IsTDS === "Y" ? parseNumber(formData.TDS_Per) : 0;
            if (formData.IsTDS === "Y" && tdsBase > 0 && tdsRate > 0) {
               tdsAmount = calculateTDSAmount(tdsBase, tdsRate);
            }

        const hasTCS = tcsAmount > 0;
        const netPayable = calculateNetPayable(billAmount, tcsAmount, hasTCS);

        newFormData = {
          ...newFormData,
          cgst_rate: cgstRate,
          cgst_amount: cgstAmount,
          sgst_rate: sgstRate,
          sgst_amount: sgstAmount,
          igst_rate: igstRate,
          igst_amount: igstAmount,
          bill_amount: billAmount,
          TCS_Amt: tcsAmount,
          TCS_Net_Payable: netPayable,
          TDS: tdsBase,
          TDSAmount: tdsAmount,
         
        };

        await calculateAndSetGSTAmounts(newFormData);
      }

      setFormData(newFormData);
    }
  };

  const fetchLastRecord = (tranType) => {
    fetch(
      `${API_URL}/get-next-doc-no-commissionBill?Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${
        tranType || selectedVoucherType
      }`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch last record");
        }
        return response.json();
      })
      .then((data) => {
        setFormData((prevState) => ({
          ...prevState,
          doc_no: data.next_doc_no,
        }));
      })
      .catch((error) => {
        console.error("Error fetching last record:", error);
      });
  };

  const fetchItemCode = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/system_master_help?CompanyCode=${companyCode}&SystemType=I`
      );
      const data = response.data;
      const item = data.find((item) => item.Category_Code === 1);
      return item
        ? {
            code: item.Category_Code,
            accoid: item.accoid,
            label: item.Category_Name,
            HSN: item.HSN,
          }
        : { code: null, accoid: null, label: null, HSN: null };
    } catch (error) {
      console.error("Error fetching item code:", error);
      return { code: null, accoid: null, label: null, HSN: null };
    }
  };

  const fetchBrokerCode = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/account_master_all?Company_Code=${companyCode}`
      );
      const data = response.data;
      const item = data.find((item) => item.Ac_Code === 2);
      return item
        ? { code: item.Ac_Code, accoid: item.accoid, label: item.Ac_Name_E }
        : { code: null, accoid: null, label: null };
    } catch (error) {
      console.error("Error fetching broker code:", error);
      return { code: null, accoid: null, label: null };
    }
  };

  const fetchGSTRateCode = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/gst_rate_master?Company_Code=${companyCode}`
      );
      const data = response.data;
      const item = data.find((item) => item.Doc_no === 1);

      if (item) {
        const rateWithoutPercent = parseFloat(item.Rate.replace("%", ""));
        setGstRate(rateWithoutPercent);

        return {
          code: item.Doc_no,
          accoid: item.gstid,
          label: item.GST_Name,
          Rate: rateWithoutPercent,
        };
      } else {
        return { code: null, accoid: null, label: null };
      }
    } catch (error) {
      console.error("Error fetching item code:", error);
      return { code: null, accoid: null, label: null };
    }
  };

  const handleAddOne = async () => {
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);
    const itemCode = await fetchItemCode();
    const brokerCode = await fetchBrokerCode();
    const gstRateCode = await fetchGSTRateCode();
    setFormData((prevState) => ({
      ...initialFormData,
      doc_no: prevState.doc_no,
      item_code: itemCode.code,
      ic: itemCode.accoid,
      HSN: itemCode.HSN,
      broker_code: brokerCode.code,
      bc: brokerCode.accoid,
      gst_code: gstRateCode.code,
      Company_Code: companyCode,
      Year_Code: Year_Code,
    }));
    fetchLastRecord(tranType);
    ItemName = itemCode.label;
    BrokerName = brokerCode.label;
    GstRateName = gstRateCode.label;
    sessionStorage.getItem("Tran_Type");
    SupplierName = "";
    newac_code = "";
    UnitName = "";
    newunit_code = "";
    newbroker_code = "";
    TransportName = "";
    newtransport_code = "";
    newgst_code = "";
    MillName = "";
    newmill_code = "";
    newnarration1 = "";
    newnarration2 = "";
    newitem_code = "";
    TdsName = "";
    newTDS_Ac = "";

    setTimeout(() => {
      TranTypeInputRef.current?.focus();
    }, 0);
  };

  const handleSaveOrUpdate = () => {
    setLoading(true)
    const preparedData = {
      ...formData,
    };
  
    const apiUrl = isEditMode
      ? `${API_URL}/update-CommissionBill?doc_no=${formData.doc_no}&Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType}`
      : `${API_URL}/create-RecordCommissionBill?Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType}`;
  
    const apiCall = isEditMode
      ? axios.put(apiUrl, preparedData)
      : axios.post(apiUrl, preparedData);
  
    apiCall
      .then((response) => {
        const successMessage = isEditMode
          ? "Record updated successfully!" 
          : "Record created successfully!";
        toast.success(successMessage);
        unlockRecord();
        setIsEditMode(false);
        setAddOneButtonEnabled(true);
        setEditButtonEnabled(true);
        setDeleteButtonEnabled(true);
        setBackButtonEnabled(true);
        setSaveButtonEnabled(false);
        setCancelButtonEnabled(false);
        setUpdateButtonClicked(true);
        setIsEditing(false);
        setLoading(false)
        
      })
      .catch((error) => {
        if (isEditMode) handleCancel(); 
        console.error(
          `Error ${isEditMode ? "updating" : "saving"} data:`,
          error
        );
        setLoading(false)
      });
  };
  
  const handleEdit = async () => {
    debugger
    axios
      .get(
        `${API_URL}/get-CommissionBillSelectedRecord?Company_Code=${companyCode}&doc_no=${formData.doc_no}&Year_Code=${Year_Code}&Tran_Type=${tranType || selectedVoucherType}`
      )
      .then((response) => {
        const data = response.data;

        const isLockedNew = data.LockedRecord;
        const isLockedByUserNew = data.LockedUser;

        if (isLockedNew) {
          window.alert(`This record is locked by ${isLockedByUserNew}`);
          return;
        } else {
          lockRecord();
        }
        setFormData({
          ...formData,
          ...data,
        });
        setIsEditMode(true);
        setAddOneButtonEnabled(false);
        setSaveButtonEnabled(true);
        setCancelButtonEnabled(true);
        setEditButtonEnabled(false);
        setDeleteButtonEnabled(false);
        setBackButtonEnabled(true);
        setIsEditing(true);
      })
      .catch((error) => {
        window.alert(
          "This record is already deleted! Showing the previous record.",
          error
        );
      });
  };

  const handleCancel = () => {
    axios
      .get(
        `${API_URL}/get-CommissionBill-lastRecord?Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${
          tranType || selectedVoucherType
        }`
      )
      .then((response) => {
        const data = response.data;
        newac_code = data.PartyCode;
        SupplierName = data.PartyName;
        newunit_code = data.Unitcode;
        UnitName = data.UnitName;
        BrokerName = data.brokername;
        newbroker_code = data.broker_code;
        TransportName = data.transportname;
        newtransport_code = data.transportcode;
        GstRateName = data.gstratename;
        newgst_code = data.gstratecode;
        MillName = data.millname;
        newmill_code = data.millcode;
        newnarration1 = data.narration1;
        newnarration2 = data.narration2;
        TdsName = data.tdsacname;
        newTDS_Ac = data.tdsac;
        ItemName = data.Itemname;
        newitem_code = data.Itemcode;

        setFormData((prevState) => ({
          ...formData,
          ...data,
        }));
        unlockRecord()
        setTimeout(() => {
        }, 0);
      })
      .catch((error) => {
        console.error("Error fetching latest data for edit:", error);
      });

    setIsEditing(false);
    setIsEditMode(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setCancelButtonClicked(true);
  };

  const handleDelete = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/get-CommissionBillSelectedRecord?Company_Code=${companyCode}&doc_no=${formData.doc_no}&Year_Code=${Year_Code}&Tran_Type=${tranType}`
      );

      const data = response.data;
      const isLockedNew = data.LockedRecord;
      const isLockedByUserNew = data.LockedUser;

      if (isLockedNew) {
        window.alert(`This record is locked by ${isLockedByUserNew}`);
        return;
      }
    if (formData.link_no && formData.link_no !== "" && formData.link_no !== 0) {
      toast.error(
        `This record has a reference in Tender No. ${formData.link_no}. Deletion not allowed.`
      );
      return;
    }
    const isConfirmed = window.confirm(
      `Are you sure you want to delete this doc_no ${formData.doc_no}?`
    );

    if (isConfirmed) {
      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);
      setLoading(true);

        const deleteApiUrl = `${API_URL}/delete-CommissionBill?doc_no=${formData.doc_no}&Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType}`;
        const response = await axios.delete(deleteApiUrl);
        toast.success("Record deleted successfully!");
        setLoading(false)
        handleCancel();
      
    }
    else {
      console.log("Deletion cancelled");
      };
  } catch (error) {
    toast.error("Deletion cancelled");
    console.error("Error during API call:", error);
    setLoading(false)
  }
} 

  const handleBack = () => {
    navigate("/CommissionBill-utility");
  };

  const handlerecordDoubleClicked = async () => {
    const voucherNo = selectedVoucherNo
      ? selectedVoucherNo
      : selectedRecord.doc_no;
    try {
      const response = await axios.get(
        `${API_URL}/get-CommissionBillSelectedRecord?Company_Code=${companyCode}&doc_no=${voucherNo}&Year_Code=${Year_Code}&Tran_Type=${
          tranType || selectedVoucherType
        }`
      );
      const data = response.data;
      newac_code = data.PartyCode;
      SupplierName = data.PartyName;
      newunit_code = data.Unitcode;
      UnitName = data.UnitName;
      BrokerName = data.brokername;
      newbroker_code = data.broker_code;
      TransportName = data.transportname;
      newtransport_code = data.transportcode;
      GstRateName = data.gstratename;
      newgst_code = data.gstratecode;
      MillName = data.millname;
      newmill_code = data.millcode;
      newnarration1 = data.narration1;
      newnarration2 = data.narration2;
      TdsName = data.tdsacname;
      newTDS_Ac = data.tdsac;
      ItemName = data.Itemname;
      newitem_code = data.Itemcode;

      setFormData({
        ...formData,
        ...data,
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    setIsEditMode(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setUpdateButtonClicked(true);
    setIsEditing(false);
  };

  useEffect(() => {
    if (selectedRecord || selectedVoucherNo) {
      handlerecordDoubleClicked();
    } else {
      handleAddOne();
    }
  }, [selectedRecord, selectedVoucherNo]);

  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(
          `${API_URL}/get-CommissionBillSelectedRecord?Company_Code=${companyCode}&doc_no=${changeNoValue}&Year_Code=${Year_Code}&Tran_Type=${tranType}`
        );
        const data = response.data;
        newac_code = data.PartyCode;
        SupplierName = data.PartyName;
        newunit_code = data.Unitcode;
        UnitName = data.UnitName;
        BrokerName = data.brokername;
        newbroker_code = data.broker_code;
        TransportName = data.transportname;
        newtransport_code = data.transportcode;
        GstRateName = data.gstratename;
        newgst_code = data.gstratecode;
        MillName = data.millname;
        newmill_code = data.millcode;
        newnarration1 = data.narration1;
        newnarration2 = data.narration2;
        TdsName = data.tdsacname;
        newTDS_Ac = data.tdsac;
        ItemName = data.Itemname;
        newitem_code = data.Itemcode;
        setFormData(data);
        setIsEditing(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  // Common function for navigation
  const fetchRecord = async (url) => {
    try {
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        const record = data[0];
        newac_code = record.PartyCode;
        SupplierName = record.PartyName;
        newunit_code = record.Unitcode;
        UnitName = record.UnitName;
        BrokerName = record.brokername;
        newbroker_code = record.broker_code;
        TransportName = record.transportname;
        newtransport_code = record.transportcode;
        GstRateName = record.gstratename;
        newgst_code = record.gstratecode;
        MillName = record.millname;
        newmill_code = record.millcode;
        newnarration1 = record.narration1;
        newnarration2 = record.narration2;
        TdsName = record.tdsacname;
        newTDS_Ac = record.tdsac;
        ItemName = record.Itemname;
        newitem_code = record.Itemcode;

        setFormData({
          ...formData,
          ...record,
          doc_date:record.Formatted_Doc_Date
         
        });
      } else {
        console.error(
          "Failed to fetch record:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  // Navigation Button Handlers
  const handleFirstButtonClick = () => {
    const url = `${API_URL}/get-first-CommissionBill?Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType}`;
    fetchRecord(url);
  };

  const handlePreviousButtonClick = () => {
    const url = `${API_URL}/get-previous-CommissionBill?doc_no=${formData.doc_no}&Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType}`;
    fetchRecord(url);
  };

  const handleNextButtonClick = () => {
    const url = `${API_URL}/get-next-CommissionBill?doc_no=${formData.doc_no}&Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType}`;
    fetchRecord(url);
  };

  const handleLastButtonClick = () => {
    const url = `${API_URL}/get-last-CommissionBill?Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType}`;
    fetchRecord(url);
  };

  const handleTenderNo = () => {
    navigate("/tender_head", {
      state: {
        selectedTenderNo: formData.link_no,
      },
    });
  };

  return (
    <>
      <div>
        <h5>Commission Bill</h5>
        <div className="commission-form-container">
          <ToastContainer autoClose={500}/>
          <ActionButtonGroup
            handleAddOne={handleAddOne}
            addOneButtonEnabled={addOneButtonEnabled}
            handleSaveOrUpdate={handleSaveOrUpdate}
            saveButtonEnabled={saveButtonEnabled}
            isEditMode={isEditMode}
            handleEdit={handleEdit}
            editButtonEnabled={editButtonEnabled}
            handleDelete={handleDelete}
            deleteButtonEnabled={deleteButtonEnabled}
            handleCancel={handleCancel}
            cancelButtonEnabled={cancelButtonEnabled}
            handleBack={handleBack}
            backButtonEnabled={backButtonEnabled}
            permissions={permissions}
          />
          <div>
            {/* Navigation Buttons */}
            <NavigationButtons
              handleFirstButtonClick={handleFirstButtonClick}
              handlePreviousButtonClick={handlePreviousButtonClick}
              handleNextButtonClick={handleNextButtonClick}
              handleLastButtonClick={handleLastButtonClick}
              highlightedButton={highlightedButton}
              isEditing={isEditing}
              isFirstRecord={formData.Company_Code === companyCode}
            />
          </div>
        </div>

        <form>
          <br />
          <div className="form-group ">
            <label htmlFor="changeNo">Change No:</label>
            <input
              type="text"
              id="changeNo"
              name="changeNo"
              onKeyDown={handleKeyDown}
              disabled={!addOneButtonEnabled}
              tabIndex={1}
            />
          </div>
          <div className="form-group">
            <label htmlFor="Tran_Type">Type:</label>
            <select
              id="Tran_Type"
              name="Tran_Type"
              class="custom-select"
              ref={TranTypeInputRef}
              value={formData.Tran_Type}
              onChange={handleChange}
              onKeyDown={(event) => handleSelectKeyDown(event, "Tran_Type")}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={2}
            >
              <option value="LV">LV</option>
              <option value="CV">CV</option>
            </select>
            <label htmlFor="doc_no">Note No.:</label>
            <input
              type="text"
              id="doc_no"
              name="doc_no"
              value={formData.doc_no}
              onChange={handleChange}
              disabled={true}
              tabIndex={3}
            />
            <div onClick={handleTenderNo}>
              <label htmlFor="link_no">Tender No.:</label>
              <input
                type="text"
                id="link_no"
                name="link_no"
                value={formData.link_no}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                tabIndex={4}
              />
              <lable>{formData.link_type}</lable>
            </div>
            <label htmlFor="doc_date">Date:</label>
            <input
              type="date"
              id="doc_date"
              name="doc_date"
              value={formData.doc_date}
              onChange={handleDateChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={5}
            />
          </div>

          <div className="form-group">
            <label htmlFor="ac_code">Party/Supplier</label>
            <AccountMasterHelp
              name="ac_code"
              onAcCodeClick={handleAcCode}
              CategoryName={SupplierName}
              CategoryCode={newac_code}
              Ac_type=""
              tabIndexHelp={6}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
            <label htmlFor="unit_code">Unit</label>
            <AccountMasterHelp
              name="unit_code"
              onAcCodeClick={handleUnitCode}
              CategoryName={UnitName}
              CategoryCode={newunit_code}
              Ac_type=""
              tabIndexHelp={7}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
            <label htmlFor="broker_code">Broker</label>
            <AccountMasterHelp
              name="broker_code"
              onAcCodeClick={handleBrokerCode}
              CategoryName={BrokerName}
              CategoryCode={newbroker_code || formData.broker_code}
              Ac_type=""
              tabIndexHelp={8}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
          </div>
          <div className="form-group">
            <label htmlFor="item_code">Item Code</label>
            <ItemMasterHelp
              name="item_code"
              onAcCodeClick={handleItemCode}
              CategoryName={ItemName}
              SystemType="I"
              CategoryCode={newitem_code || formData.item_code}
              tabIndexHelp={9}
              disabledField={!isEditing && addOneButtonEnabled}
            />
            <label htmlFor="qntl">Quantal:</label>
            <input
              type="text"
              id="qntl"
              name="qntl"
              value={formData.qntl}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={10}
            />
            <label htmlFor="packing">Packing:</label>
            <input
              type="text"
              id="packing"
              name="packing"
              value={formData.packing}
              onKeyDown={handleKeyDownCalculations}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={11}
            />
            <label htmlFor="bags">Bags:</label>
            <input
              type="text"
              id="bags"
              name="bags"
              value={formData.bags}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={12}
            />
            <label htmlFor="HSN">HSN:</label>
            <input
              type="text"
              id="HSN"
              name="HSN"
              value={formData.HSN}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={13}
            />
          </div>

          <div className="form-group">
            <label htmlFor="grade">Grade:</label>
            <input
              type="text"
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={14}
            />
            <label htmlFor="transport_code">Transport</label>
            <AccountMasterHelp
              name="transport_code"
              onAcCodeClick={handleTransportCode}
              CategoryName={TransportName}
              CategoryCode={newtransport_code}
              Ac_type=""
              tabIndexHelp={15}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
            <label htmlFor="mill_code">Mill Code</label>
            <AccountMasterHelp
              name="mill_code"
              onAcCodeClick={handleMillCode}
              CategoryName={MillName}
              CategoryCode={newmill_code}
              Ac_type=""
              tabIndexHelp={16}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
          </div>

          <div className="form-group">
            <label htmlFor="mill_rate">M.R.:</label>
            <input
              type="text"
              id="mill_rate"
              name="mill_rate"
              value={formData.mill_rate}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={17}
            />
            <label htmlFor="sale_rate">S.R.:</label>
            <input
              type="text"
              id="sale_rate"
              name="sale_rate"
              value={formData.sale_rate}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={18}
            />
            <label htmlFor="purc_rate">P.R.:</label>
            <input
              type="text"
              id="purc_rate"
              name="purc_rate"
              value={formData.purc_rate}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={19}
            />
            <label htmlFor="gst_code">Gst Rate Code</label>
            <GSTRateMasterHelp
              name="gst_code"
              onAcCodeClick={handleGSTCode}
              GstRateName={GstRateName}
              GstRateCode={newgst_code || formData.gst_code}
              tabIndexHelp={20}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
          </div>
          <div className="form-group">
            <label htmlFor="rDiffTenderRate">R.Diff.Tender</label>
            <input
              type="text"
              id="commission_amount"
              name="commission_amount"
              value={formData.commission_amount}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={22}
            />
            <input
              type="text"
              id="rDiffTenderRate"
              name="rDiffTenderRate"
              value={calculateTenderDiffRateAmount(
                formData.commission_amount,
                formData.qntl
              )}
              onKeyDown={handleKeyDownCalculations}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={21}
            />
            
            <label htmlFor="narration1">Narration</label>
            <AccountMasterHelp
              name="narration1"
              onAcCodeClick={handleNarration1}
              newnarration1={newnarration1}
              tabIndexHelp={23}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
            <label htmlFor="narration2">Narration2</label>
            <AccountMasterHelp
              name="narration2"
              onAcCodeClick={handleNarration2}
              newnarration2={newnarration2}
              tabIndexHelp={24}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
          </div>
          <div className="form-group">
            <label htmlFor="resale_commission">Resale Commission:</label>
            <input
              type="text"
              id="resale_commission"
              name="resale_commission"
              value={formData.resale_commission}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={25}
            />
            <input
              type="text"
              id="resale_rate"
              name="resale_rate"
              value={formData.resale_rate}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={26}
            />
            <label htmlFor="BANK_COMMISSION">Bank Commission:</label>
            <input
              type="text"
              id="BANK_COMMISSION"
              name="BANK_COMMISSION"
              value={formData.BANK_COMMISSION}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={27}
            />
            <label htmlFor="subtotal">Sub Total:</label>
            <input
              type="text"
              id="subtotal"
              name="subtotal"
              value={formData.subtotal}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={28}
            />
            <label htmlFor="Frieght_Rate">Freight</label>
            <input
              type="text"
              id="Frieght_Rate"
              name="Frieght_Rate"
              value={formData.Frieght_Rate}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={29}
            />
            <input
              type="text"
              id="Frieght_amt"
              name="Frieght_amt"
              value={formData.Frieght_amt}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={30}
            />
          </div>
          <div className="form-group">
            <label htmlFor="texable_amount">Taxable Amount:</label>
            <input
              type="text"
              id="texable_amount"
              name="texable_amount"
              value={formData.texable_amount}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={31}
            />
            <label htmlFor="cgst_rate">CGST%</label>
            <input
              type="text"
              id="cgst_rate"
              name="cgst_rate"
              value={formData.cgst_rate}
              onChange={handleGSTCode}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={32}
            />
            <input
              type="text"
              id="cgst_amount"
              name="cgst_amount"
              value={formData.cgst_amount}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={33}
            />
            <label htmlFor="sgst_rate">SGST%</label>
            <input
              type="text"
              id="sgst_rate"
              name="sgst_rate"
              value={formData.sgst_rate}
              onChange={handleGSTCode}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={34}
            />
            <input
              type="text"
              id="sgst_amount"
              name="sgst_amount"
              value={formData.sgst_amount}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={35}
            />
            <label htmlFor="igst_rate">IGST%</label>
            <input
              type="text"
              id="igst_rate"
              name="igst_rate"
              value={formData.igst_rate}
              onChange={handleGSTCode}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={36}
            />
            <input
              type="text"
              id="igst_amount"
              name="igst_amount"
              value={formData.igst_amount}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={37}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bill_amount">Bill Amount:</label>
            <input
              type="text"
              id="bill_amount"
              name="bill_amount"
              value={formData.bill_amount}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={38}
            />
            <label htmlFor="TCS_Rate">TCS%</label>
            <input
              type="text"
              id="TCS_Rate"
              name="TCS_Rate"
              value={formData.TCS_Rate}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={
                formData.IsTDS === "Y" || (!isEditing && addOneButtonEnabled)
              }
              tabIndex={39}
            />
            <input
              type="text"
              id="TCS_Amt"
              name="TCS_Amt"
              value={formData.TCS_Amt}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={
                formData.IsTDS === "Y" || (!isEditing && addOneButtonEnabled)
              }
              tabIndex={40}
            />
            <label htmlFor="misc_amount">Other+-:</label>
            <input
              type="text"
              id="misc_amount"
              name="misc_amount"
              value={formData.misc_amount}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={41}
            />
            <label htmlFor="TCS_Net_Payable">Net Payable:</label>
            <input
              type="text"
              id="TCS_Net_Payable"
              name="TCS_Net_Payable"
              value={formData.TCS_Net_Payable}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={42}
            />
          </div>
          <div className="form-group">
            <label htmlFor="IsTDS">Is TDS:</label>
            <select
              id="IsTDS"
              name="IsTDS"
              class="custom-select"
              value={formData.IsTDS}
              onChange={handleChange}
              onKeyDown={(event) => handleSelectKeyDown(event, "IsTDS")}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={43}
            >
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
            <label htmlFor="TDS_Ac">Tds A/c</label>
            <AccountMasterHelp
              name="TDS_Ac"
              onAcCodeClick={handleTDSAc}
              CategoryName={TdsName}
              CategoryCode={newTDS_Ac}
              Ac_type=""
              tabIndexHelp={44}
              disabledFeild={
                formData.IsTDS === "N" || (!isEditing && addOneButtonEnabled)
              }
            />
            <label htmlFor="TDS">TDS Applicable Amount:</label>
            <input
              type="text"
              id="TDS"
              name="TDS"
              value={formData.TDS}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={
                formData.IsTDS === "N" || (!isEditing && addOneButtonEnabled)
              }
              tabIndex={45}
            />
            <label htmlFor="TDS_Per">TDS %:</label>
            <input
              type="text"
              id="TDS_Per"
              name="TDS_Per"
              value={formData.TDS_Per}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={
                formData.IsTDS === "N" || (!isEditing && addOneButtonEnabled)
              }
              tabIndex={46}
            />
            <input
              type="text"
              id="TDSAmount"
              name="TDSAmount"
              value={formData.TDSAmount}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              onKeyDown={handleKeyDownCalculations}
              disabled={
                formData.IsTDS === "N" || (!isEditing && addOneButtonEnabled)
              }
              tabIndex={47}
            />
          </div>
          <div className="form-group">
            <label htmlFor="einvoiceno">Einvoice No:</label>
            <input
              type="text"
              id="einvoiceno"
              name="einvoiceno"
              value={formData.einvoiceno}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={48}
            />
            <label htmlFor="ackno">Ack No:</label>
            <input
              type="text"
              id="ackno"
              name="ackno"
              value={formData.ackno}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={49}
            />
          </div>
          {loading && (
          <div className="loading-overlay">
            <div className="spinner-container">
              <HashLoader color="#007bff" loading={loading} size={80} />
            </div>
          </div>
        )}
        </form>
      </div>
    </>
  );
};
export default CommissionBill;
