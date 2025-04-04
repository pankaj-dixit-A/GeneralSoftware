import React from "react";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import "./TenderPurchase.css";
import SaveUpdateSpinner from "../../../Common/Spinners/SaveUpdateSpinner";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import GSTRateMasterHelp from "../../../Helper/GSTRateMasterHelp";
import SystemHelpMaster from "../../../Helper/SystemmasterHelp";
import GradeMasterHelp from "../../../Helper/GradeMasterHelp";
import { useRecordLocking } from "../../../hooks/useRecordLocking";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Paper,
  Stack,
  TextField, Select, MenuItem, InputLabel, FormControl, Grid, Typography, Checkbox, FormControlLabel, InputAdornment
} from "@mui/material";

import AddButton from "../../../Common/Buttons/AddButton";
import EditButton from "../../../Common/Buttons/EditButton";
import DeleteButton from "../../../Common/Buttons/DeleteButton";
import OpenButton from "../../../Common/Buttons/OpenButton";
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import DetailAddButtom from "../../../Common/Buttons/DetailAddButton";
import DetailCloseButton from "../../../Common/Buttons/DetailCloseButton";
import DetailUpdateButton from "../../../Common/Buttons/DetailUpdateButton";
import Swal from "sweetalert2";

var millCodeName;
var newMill_Code;
var gradeName;
var newGrade;
var paymentToName;
var newPayment_To;
var tenderFromName;
var newTender_From;
var tenderDOName;
var newTender_DO;
var voucherByName;
var newVoucher_By;
var brokerName;
var newBroker;
var itemName;
var newitemcode;
var gstRateName;
var gstRateCode;
var newgstratecode;
var bpAcName;
var newBp_Account;
var billToName;
var newBillToCode;
var shipToName;
var shipToCode;
var subBrokerName;
var subBrokerCode;
var newTenderId;
var selfAcCode;
var selfAcName;
var selfAccoid;
var buyerPartyCode;
var buyer_party_name;
var balance;
var dispatched;

// Common style for all table headers
const headerCellStyle = {
  fontWeight: "bold",
  backgroundColor: "#3f51b5",
  color: "white",
  padding: "2px",
  textAlign: "center",
  "&:hover": {
    backgroundColor: "#303f9f",
    cursor: "pointer",
  },
};

const API_URL = process.env.REACT_APP_API;

const TenderPurchase = () => {
  const [updateButtonClicked, setUpdateButtonClicked] = useState(false);
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
  const [millCode, setMillCode] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [grade, setGrade] = useState("");
  const [bpAcCode, setBpAcCode] = useState("");
  const [paymentTo, setPaymentTo] = useState("");
  const [tdsApplicable, setTdsApplicalbe] = useState("N");
  const [tenderFrom, setTenderFrom] = useState("");
  const [tenderDO, setTenderDO] = useState("");
  const [voucherBy, setVoucherBy] = useState("");
  const [broker, setBroker] = useState("");
  const [GstRate, setGSTRate] = useState("");
  const [lastTenderDetails, setLastTenderDetails] = useState([]);
  const [lastTenderData, setLastTenderData] = useState({});
  const [gstCode, setGstCode] = useState("");
  const [billtoName, setBillToName] = useState("");
  const [brokerDetail, setBrokerDetail] = useState("");
  const [shiptoName, setShipToName] = useState("");
  const [isGstRateChanged, setIsGstRateChanged] = useState(false);
  const [tenderFrName, setTenderFrName] = useState("");
  const [tenderDONm, setTenderDOName] = useState("");
  const [voucherbyName, setVoucherByName] = useState("");
  const [dispatchType, setDispatchType] = useState(null);
  const [buyerParty, setBuyerParty] = useState(selfAcCode);
  const [buyerPartyAccoid, setBuyerPartyAccoid] = useState(selfAccoid);
  const [buyerPartyName, setBuyerPartyName] = useState(selfAcName);
  const [errors, setErrors] = useState({});
  const [payment_toName, setPaymenToName] = useState("");

  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const username = sessionStorage.getItem("username");

  const addButtonRef = useRef(null);
  const firstInputRef = useRef(null);
  const setFocusToFirstField = () => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  };

  const drpType = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const selectedRecord = location.state?.selectedRecord;
  const permissions = location.state?.permissionsData;
  const selectedTenderNo = location.state?.selectedTenderNo;

  const initialFormData = {
    Tender_No: 0,
    Company_Code: companyCode,
    Tender_Date: new Date().toISOString().split("T")[0],
    Lifting_Date: new Date().toISOString().split("T")[0],
    Mill_Code: 0,
    Grade: "",
    Quantal: 0.0,
    Packing: 50,
    Bags: 0,
    Payment_To: 0,
    Tender_From: selfAcCode,
    Tender_DO: selfAcCode,
    Voucher_By: selfAcCode,
    Broker: selfAcCode,
    Excise_Rate: 0.0,
    Narration: "",
    Mill_Rate: 0.0,
    Created_By: "",
    Modified_By: "",
    Year_Code: Year_Code,
    Purc_Rate: 0.0,
    type: "M",
    Branch_Id: 0,
    Voucher_No: 0,
    Sell_Note_No: "",
    Brokrage: 0.0,
    mc: 0,
    itemcode: 0,
    season: "",
    pt: 0,
    tf: selfAccoid,
    td: selfAccoid,
    vb: selfAccoid,
    bk: selfAccoid,
    ic: 0,
    gstratecode: "",
    CashDiff: 0.0,
    TCS_Rate: 0.0,
    TCS_Amt: 0.0,
    commissionid: 0,
    Voucher_Type: "",
    Party_Bill_Rate: 0.0,
    TDS_Rate: 0.0,
    TDS_Amt: 0.0,
    Temptender: "N",
    AutoPurchaseBill: "Y",
    // Bp_Account: 0,
    // bp: 0,
    // groupTenderNo: 0,
    // groupTenderId: 0,
    tenderid: null,
  };

  const [formData, setFormData] = useState(initialFormData);

  const [isLoading, setIsLoading] = useState(false);
  const [paymentToManuallySet, setPaymentToManuallySet] = useState(false);
  const [voucherByManuallySet, setVoucherByManuallySet] = useState(false);
  const [tenderDOManuallySet, setTenderDOManuallySet] = useState(false);
  const [tenderFromManuallySet, setTenderFromManuallySet] = useState(false);
  const [shipToManuallySet, setShipToManuallySet] = useState(false);

  //Deatil
  const [users, setUsers] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMode, setPopupMode] = useState("add");
  const [selectedUser, setSelectedUser] = useState({});
  const [deleteMode, setDeleteMode] = useState(false);
  const [billTo, setBillTo] = useState("");
  const [shipTo, setShipTo] = useState("");
  const [detailBroker, setDetailBroker] = useState("");
  const [subBroker, setSubBroker] = useState("");
  const [billToAccoid, setBillToAccoid] = useState("");
  const [shipToAccoid, setShipToAccoid] = useState("");
  const [subBrokerAccoid, setSubBrokerAccoid] = useState("");
  const [self_ac_Code, setSelf_ac_code] = useState("");
  const [self_accoid, set_self_accoid] = useState("");
  const [self_acName, set_self_acName] = useState("");

  const [formDataDetail, setFormDataDetail] = useState({
    Buyer_Quantal: 0.0,
    Sale_Rate: 0.0,
    Commission_Rate: 0.0,
    Sauda_Date: new Date().toISOString().split("T")[0],
    Lifting_Date: formData?.Lifting_Date || "",
    Narration: "",
    tcs_rate: 0.0,
    gst_rate: 0.0,
    tcs_amt: 0.0,
    gst_amt: 0.0,
    CashDiff: 0.0,
    Delivery_Type: dispatchType,
    sub_broker: 2,
  });

  //lock mechanism
  const { isRecordLockedByUser, lockRecord, unlockRecord } = useRecordLocking(
    formData.Tender_No,
    undefined,
    companyCode,
    Year_Code,
    "tender_purchase"
  );

  useEffect(() => {
    const fetchDispatchType = async () => {
      try {
        const response = await fetch(
          `${API_URL}/get_dispatch_type/${companyCode}`
        );
        const data = await response.json();
        setDispatchType(data.dispatchType);
      } catch (error) {
        console.error("Error fetching dispatch type:", error);
      }
    };

    fetchDispatchType();
  }, [companyCode]);

  //calculations
  const calculateValues = async (
    updatedFormData,
    updatedFormDataDetail,
    tdsApplicable,
    gstCode
  ) => {
    let {
      Quantal = 0,
      Packing = 50,
      Mill_Rate = 0,
      Purc_Rate = 0,
      Excise_Rate = 0,
      TCS_Rate = 0,
      TDS_Rate = 0,
      type = "M",
    } = updatedFormData;

    const quantal = parseFloat(Quantal) || 0;
    const packing = parseFloat(Packing) || 50;
    const millRate = parseFloat(Mill_Rate) || 0;
    const purchaseRate = parseFloat(Purc_Rate) || 0;
    const exciseRate = (millRate * gstCode) / 100 || 0;
    const tcsRate = parseFloat(TCS_Rate) || 0;
    const tdsRate = parseFloat(TDS_Rate) || 0;

    const bags = (quantal / packing) * 100;
    const diff = type === "M" ? 0 : millRate - purchaseRate || 0;
    const exciseAmount = exciseRate;
    const gstAmt = exciseAmount + millRate;
    const amount = quantal * (type === "M" ? millRate + exciseRate : diff) || 0;

    let tcsAmt = 0;
    let tdsAmt = 0;

    if (tdsApplicable === "Y") {
      tdsAmt = quantal * millRate * (tdsRate / 100);
    } else {
      tcsAmt = (quantal * gstAmt * tcsRate) / 100;
    }

    // Calculate both regardless of TDS applicability
    const calculatedTcsAmt = (quantal * gstAmt * tcsRate) / 100;
    const calculatedTdsAmt = quantal * millRate * (tdsRate / 100);
    const {
      Buyer_Quantal = 0,
      Sale_Rate = 0,
      tcs_rate = 0,
      gst_rate = 0,
      Commission_Rate = 0,
    } = updatedFormDataDetail;

    const buyerQuantalNum = parseFloat(Buyer_Quantal) || 0;
    const saleRateNum = parseFloat(Sale_Rate) || 0;
    const commissionRate = parseInt(Commission_Rate) || 0;
    const tcsRateNum =
      parseFloat(tcs_rate) || parseFloat(formData.TCS_Rate) || 0;

    const gstRateNum = parseFloat(gst_rate) || gstCode || 0;

    const lblRate = buyerQuantalNum * (saleRateNum + commissionRate) || 0;
    const gstAmtDetail = lblRate * (gstRateNum / 100) || 0;
    const tcsAmtDetail =
      ((buyerQuantalNum * saleRateNum + gstAmtDetail) * tcsRateNum) / 100 || 0;
    const lblNetAmount =
      lblRate + gstAmtDetail + tcsAmtDetail / buyerQuantalNum || 0;
    const lblValue = quantal * (millRate + exciseRate) || 0;

    return {
      bags,
      diff,
      exciseAmount: exciseRate,
      gstAmt,
      amount,
      lblValue,
      tcsAmt,
      tdsAmt,
      calculatedTcsAmt,
      calculatedTdsAmt,
      lblRate,
      gstAmtDetail,
      TCSAmt: tcsAmtDetail,
      lblNetAmount,
    };
  };

  useEffect(() => {
    const recalc = async () => {
      const effectiveGstCode = gstCode || gstRateCode;
      const calculated = await calculateValues(
        formData,
        formDataDetail,
        tdsApplicable,
        effectiveGstCode
      );
      setCalculatedValues(calculated);
    };
    recalc();
  }, [formData, formDataDetail, gstCode, gstRateCode]);

  const [calculatedValues, setCalculatedValues] = useState({
    lblRate: 0,
    amount: 0,
    tdsAmt: 0,
    diff: 0,
    gstAmtDetail: 0,
    exciseAmount: 0,
    lblValue: 0,
    TCSAmt: 0.0,
    lblNetAmount: 0,
    bags: 0,
    gstAmt: 0,
    tcsAmt: 0,
  });

  const cleanFormData = (data) => {
    const {
      lblRate,
      amount,
      tdsAmt,
      diff,
      gstAmtDetail,
      exciseAmount,
      lblValue,
      TCSAmt,
      lblNetAmount,
      bags,
      gstAmt,
      tcsAmt,
      ...cleanedData
    } = data;
    return cleanedData;
  };

  const TDSApplicablecalculate = async () => {
    if (!formData.Payment_To || !companyCode || !Year_Code) {
      console.log("Missing required parameters to fetch TDS applicable data.");
      return null;
    }
    const response = await axios.get(
      `${API_URL}/getAmountcalculationDataTender?CompanyCode=${companyCode}&PaymentTo=${formData.Payment_To}&Year_Code=${Year_Code}`
    );

    const {
      Balancelimt,
      PurchaseTDSApplicable,
      PurchaseTDSRate,
      SaleTDSRate,
      TCSRate,
    } = response.data;
    setTdsApplicalbe(PurchaseTDSApplicable);
    setFormData({
      ...formData,
      TCS_Rate: TCSRate,
      TDS_Rate: SaleTDSRate,
    });

    return response.data;
  };

  const handleMill_Code = (code, accoid, name) => {
    setMillCode(code);
    setPaymenToName(name);
    setFormData({
      ...formData,
      Mill_Code: code,
      mc: accoid,
    });

    // Automatically set "Payment To" if it has not been manually set
    if (!paymentToManuallySet) {
      setPaymentTo(code);
      setFormData((prevFormData) => ({
        ...prevFormData,
        Payment_To: code,
        pt: accoid,
      }));
    }
  };

  const handleGrade = (name) => {
    setGrade(name);
    setFormData({
      ...formData,
      Grade: name,
    });
  };
  const handlePayment_To = (
    code,
    accoid,
    name,
    mobileNo,
    gstNo,
    TdsApplicable
  ) => {
    setPaymentToManuallySet(true);
    setPaymentTo(code);
    setPaymenToName(name);
    setTenderFrName(name);
    setVoucherByName(name);
    setTenderDOName(name);

    setFormData((prevFormData) => {
      const updatedFormData = {
        ...prevFormData,
        Payment_To: code,
        pt: accoid,
      };

      if (
        !tenderFromManuallySet ||
        prevFormData.Tender_From === prevFormData.Payment_To
      ) {
        updatedFormData.Tender_From = code;
        updatedFormData.tf = accoid;
      }
      if (
        !voucherByManuallySet ||
        prevFormData.Voucher_By === prevFormData.Payment_To
      ) {
        updatedFormData.Voucher_By = code;
        updatedFormData.vb = accoid;
      }
      if (
        !tenderDOManuallySet ||
        prevFormData.Tender_DO === prevFormData.Payment_To
      ) {
        updatedFormData.Tender_DO = code;
        updatedFormData.td = accoid;
      }

      const calculated = calculateValues(
        updatedFormData,
        formDataDetail,
        TdsApplicable,
        gstCode
      );
      setCalculatedValues(calculated);
      return updatedFormData;
    });
  };

  const handleTender_From = (code, accoid, name) => {
    setTenderFromManuallySet(true);
    setTenderFrName(name);
    setTenderFrom(code);
    setFormData({
      ...formData,
      Tender_From: code,
      tf: accoid,
    });
  };
  const handleTender_DO = (code, accoid, name) => {
    setTenderDOManuallySet(true);
    setTenderDOName(name);
    setTenderDO(code);
    setTenderFrName(name);
    setVoucherBy(code);
    setVoucherByName(name);

    setFormData((prevFormData) => {
      const updatedFormData = {
        ...prevFormData,
        Tender_DO: code,
        td: accoid,
      };

      if (
        !voucherByManuallySet ||
        prevFormData.Voucher_By === prevFormData.Tender_DO
      ) {
        updatedFormData.Voucher_By = code;
        updatedFormData.vb = accoid;
      }
      if (
        !tenderDOManuallySet ||
        prevFormData.Tender_From === prevFormData.Tender_DO
      ) {
        updatedFormData.Tender_From = code;
        updatedFormData.tf = accoid;
      }

      // const calculated = calculateValues(updatedFormData, formDataDetail, TdsApplicable, gstCode);
      // setCalculatedValues(calculated);
      return updatedFormData;
    });
  };

  const handleVoucher_By = (code, accoid, name) => {
    setVoucherByManuallySet(true);
    setVoucherByName(name);
    setVoucherBy(code);
    setFormData({
      ...formData,
      Voucher_By: code,
      vb: accoid,
    });
  };
  const handleBroker = (code, accoid) => {
    setBroker(code);
    setFormData({
      ...formData,
      Broker: code,
      bk: accoid,
    });
  };
  const handleitemcode = (code, accoid, HSN, CategoryName, gst_code) => {
    setItemCode(code);
    setFormData({
      ...formData,
      itemcode: code,
      ic: accoid,
    });
  };

  const handlegstratecode = (code, Rate) => {
    const rate = parseFloat(Rate);
    setGSTRate(code);
    setGstCode(rate);

    setFormData((prevFormData) => {
      const updatedFormData = {
        ...prevFormData,
        gstratecode: code,
      };

      const calculatedValues = calculateValues(
        updatedFormData,
        formDataDetail,
        tdsApplicable,
        rate
      );
      setCalculatedValues(calculatedValues);

      return updatedFormData;
    });
  };

  // const handleBp_Account = (code, accoid) => {
  //   setBpAcCode(code);
  //   setFormData({
  //     ...formData,
  //     Bp_Account: code,
  //     bp: accoid,
  //   });
  // };

  const handleBillTo = (
    code,
    accoid,
    name,
    mobileNo,
    gstNo,
    tdsApplicable,
    gstStateCode,
    commission
  ) => {
    setBillTo(code);
    setBillToName(name);
    setBillToAccoid(accoid);
    setFormDataDetail((prevDetail) => ({
      ...prevDetail,
      Buyer: code,
      buyerid: accoid,
      Commission_Rate: parseFloat(commission),
    }));

    if (!shipToManuallySet) {
      setShipTo(code);
      setShipToAccoid(accoid);
      setShipToName(name);
      setFormDataDetail((prevDetail) => ({
        ...prevDetail,
        ShipTo: code,
        shiptoid: accoid,
      }));
    }
  };

  const handleShipTo = (code, accoid, name) => {
    setShipTo(code);
    setShipToAccoid(accoid);
    setShipToName(name);
    setFormDataDetail({
      ...formDataDetail,
      ShipTo: code,
      shiptoid: accoid,
    });
  };

  const handleBuyerParty = (code, accoid, name) => {
    setBuyerParty(code);
    setBuyerPartyAccoid(accoid);
    setBuyerPartyName(name);
    setFormDataDetail({
      ...formDataDetail,
      Buyer_Party: code,
      buyerpartyid: accoid,
    });
  };

  const handleDetailSubBroker = (code, accoid, name) => {
    setSubBroker(code);
    setBrokerDetail(name);
    setSubBrokerAccoid(accoid);
    setFormDataDetail({
      ...formDataDetail,
      sub_broker: code,
      sbr: accoid,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevFormData) => {
      const updatedFormData = {
        ...prevFormData,
        [name]: value,
      };

      if (name === "Mill_Rate" && prevFormData.type === "M") {
        updatedFormData.Party_Bill_Rate = parseFloat(value) || 0;
      } else if (name === "Mill_Rate" && prevFormData.type !== "M") {
        updatedFormData.Party_Bill_Rate = parseFloat(value) || 0;
      }

      return {
        ...updatedFormData,
        Excise_Rate: parseFloat(calculatedValues.exciseAmount).toFixed(2),
      };
    });

    if (name === "gstratecode") {
      handlegstratecode(value, parseFloat(value));
    }

    setFormDataDetail((prevFormDataDetail) => {
      const updatedFormDataDetail = {
        ...prevFormDataDetail,
        gst_rate:
          name === "gstratecode"
            ? parseFloat(value) || 0
            : prevFormDataDetail.gst_rate,
        tcs_rate:
          name === "TCS_Rate"
            ? parseFloat(value) || 0
            : prevFormDataDetail.tcs_rate,
      };

      const calculatedValues = calculateValues(
        { ...formData, [name]: value },
        updatedFormDataDetail,
        tdsApplicable,
        name === "gstratecode" ? parseFloat(value) : gstCode
      );

      return {
        ...updatedFormDataDetail,
        tcs_amt: calculatedValues.TCSAmt,
      };
    });

    if (name === "TCS_Rate" || name === "gstratecode") {
      const updatedRate = parseFloat(value) || 0;

      setUsers((prevUsers) =>
        prevUsers.map((user) => ({
          ...user,
          tcs_rate: name === "TCS_Rate" ? updatedRate : user.tcs_rate,
          tcs_amt:
            name === "TCS_Rate"
              ? (user.Buyer_Quantal * user.Sale_Rate * updatedRate) / 100
              : user.tcs_amt,
          gst_rate: name === "gstratecode" ? updatedRate : user.gst_rate,
          gst_amt:
            name === "gstratecode"
              ? (user.Buyer_Quantal * user.Sale_Rate * updatedRate) / 100
              : user.gst_amt,
        }))
      );
    }
  };

  const handleGradeUpdate = (grade) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      Grade: grade,
    }));
  };

  const handleChangeDetail = (e) => {
    const { name, value } = e.target;

    setFormDataDetail((prevFormDataDetail) => {
      const updatedFormDataDetail = {
        ...prevFormDataDetail,
        [name]: name === "tcs_rate" ? parseFloat(value) || 0 : value,
      };

      const calculatedValues = calculateValues(
        formData,
        updatedFormDataDetail,
        tdsApplicable,
        gstCode
      );

      return {
        ...updatedFormDataDetail,
        tcs_amt: calculatedValues.TCSAmt,
      };
    });
  };

  const validateNumericInput = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.-]/g, "");
  };

  const handleDetailDateChange = (event, fieldName) => {
    setFormDataDetail((prevFormDetailData) => ({
      ...prevFormDetailData,
      [fieldName]: event.target.value,
    }));
  };

  const handleCheckbox = (e, valueType = "string") => {
    const { name, checked } = e.target;
    const value =
      valueType === "numeric" ? (checked ? 1 : 0) : checked ? "Y" : "N";

    setFormDataDetail((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const fetchLastRecord = () => {
    fetch(
      `${API_URL}/getNextTenderNo_SugarTenderPurchase?Company_Code=${companyCode}&Year_Code=${Year_Code}`
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
          Tender_No: data.next_doc_no,
          Lifting_Date: data.lifting_date,
        }));
      })
      .catch((error) => {
        console.error("Error fetching last record:", error);
      });
  };

  let isProcessing = false;

  const handleAddOne = async () => {
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditMode(false);
    setIsEditing(true);
    setFormData(initialFormData);
    fetchLastRecord();
    setLastTenderDetails([]);
    setLastTenderData({});
    setUsers([]);
    millCodeName = "";
    newMill_Code = "";
    gradeName = "";
    newGrade = "";
    paymentToName = "";
    newPayment_To = "";
    tenderFromName = "";
    newTender_From = "";
    tenderDOName = "";
    newTender_DO = "";
    voucherByName = "";
    newVoucher_By = "";
    brokerName = "";
    newBroker = "";
    itemName = "";
    newitemcode = "";
    // bpAcName = "";
    // newBp_Account = "";
    newgstratecode = "";
    gstRateName = "";
    gstRateCode = "";
    billToName = "";
    newBillToCode = "";
    shipToName = "";
    shipToCode = "";
    subBrokerName = "";
    subBrokerCode = "";
    newTenderId = "";
    selfAcCode = "";
    selfAcName = "";
    selfAccoid = "";
    buyerPartyCode = "";
    buyer_party_name = "";
    setGSTRate("");
    setItemCode("");
    // setTimeout(() => {
    //   drpType.current?.focus();
    // }, 0);

    if (isProcessing) return;

    isProcessing = true;

    try {
      await fetchSelfAcData();
    } catch (error) {
      console.error("Error adding record:", error);
    } finally {
      isProcessing = false;
    }
  };

  const handleSaveOrUpdate = async (event) => {
    setIsEditing(true);
    setIsLoading(true);

    try {
      let gstRate = 0;
      if (formData.gstratecode) {
        const response = await axios.get(
          `${API_URL}/get-GSTRateMasterSelectedRecord?Company_Code=${companyCode}&Doc_no=${formData.gstratecode}`
        );
        gstRate = response.data?.Rate || 0;
      }

      const calculated = await calculateValues(
        formData,
        formDataDetail,
        tdsApplicable,
        gstRate
      );

      const updatedFormData = {
        ...formData,
        Bags: calculated.bags || formData.Bags,
        CashDiff: calculated.diff || formData.CashDiff,
        TCS_Amt: calculated.tcsAmt || formData.TCS_Amt,
        TDS_Amt: calculated.tdsAmt || formData.TDS_Amt,
        Excise_Rate: calculated.exciseAmount || formData.Excise_Rate,
        gstratecode: formData.gstratecode,
        Voucher_By:
          !formData.Voucher_By || formData.Voucher_By === 0
            ? selfAcCode
            : formData.Voucher_By,
        vb: !formData.vb || formData.vb === 0 ? selfAccoid : formData.vb,
        Tender_DO:
          !formData.Tender_DO || formData.Tender_DO === 0
            ? selfAcCode
            : formData.Tender_DO,
        td: !formData.td || formData.td === 0 ? selfAccoid : formData.td,
        Tender_From:
          !formData.Tender_From || formData.Tender_From === 0
            ? selfAcCode
            : formData.Tender_From,
        tf: !formData.tf || formData.tf === 0 ? selfAccoid : formData.tf,
      };

      let cleanedHeadData = cleanFormData(updatedFormData);

      if (isEditMode) {
        delete cleanedHeadData.tenderid;

        cleanedHeadData = {
          ...cleanedHeadData,
          Modified_By: username
        }
      }
      else {
        cleanedHeadData = {
          ...cleanedHeadData,
          Created_By: username
        }
      }

      const detailData = users.map((user) => ({
        rowaction: user.rowaction,
        Buyer: user.Buyer || 0,
        Buyer_Quantal: user.Buyer_Quantal || 0.0,
        Sale_Rate: user.Sale_Rate || 0.0,
        Commission_Rate: user.Commission_Rate || 0.0,
        Sauda_Date: user.Sauda_Date || "",
        Lifting_Date: user.Lifting_Date || "",
        Narration: user.Narration || "",
        ID: user.ID,
        ShipTo: user.ShipTo || 0,
        AutoID: user.AutoID || 0,
        IsActive: user.IsActive || "",
        year_code: Year_Code,
        Branch_Id: user.Branch_Id || 0,
        Delivery_Type: user.Delivery_Type,
        tenderdetailid: user.tenderdetailid,
        buyerid: user.buyerid,
        buyerpartyid: user.buyerpartyid,
        sub_broker: user.sub_broker,
        sbr: user.sbr || 0,
        tcs_rate: user.tcs_rate || 0.0,
        gst_rate: gstRate || user.gst_rate || 0.0,
        tcs_amt: user.tcs_amt || 0.0,
        gst_amt: user.gst_amt || 0.0,
        CashDiff: user.CashDiff || 0.0,
        shiptoid: user.shiptoid,
        Company_Code: companyCode,
        Buyer_Party: user.Buyer_Party,
      }));

      const requestData = {
        headData: cleanedHeadData,
        detailData
      };

      // Call API to save or update data
      if (isEditMode) {
        const updateApiUrl = `${API_URL}/update_tender_purchase?tenderid=${newTenderId}`;
        await axios.put(updateApiUrl, requestData);
        toast.success("Record updated successfully!");
      } else {
        await axios.post(`${API_URL}/insert_tender_head_detail`, requestData);
        toast.success("Record saved successfully!");
      }

      // Reset UI after save
      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);
      setIsEditing(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error during API call:", error.response || error);
      toast.error("Error occurred while saving data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    axios
      .get(
        `${API_URL}/getTenderByTenderNo?Company_Code=${companyCode}&Tender_No=${formData.Tender_No}&Year_Code=${Year_Code}`
      )
      .then((response) => {
        const data = response.data;
        const isLockedNew = data.last_tender_head_data.LockedRecord;
        const isLockedByUserNew = data.last_tender_head_data.LockedUser;

        if (isLockedNew) {
          window.alert(`This record is locked by ${isLockedByUserNew}`);
          return;
        } else {
          lockRecord();
        }
        setFormData({
          ...formData,
          ...data.last_tender_head_data,
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
          "This record is already deleted! Showing the previous record."
        );
      });
  };

  
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You won't be able to revert this ${formData.Tender_No}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      cancelButtonText: "Cancel",
      confirmButtonText: "Delete",
      reverseButtons: true,
      focusCancel: true,
    });
  
    if (result.isConfirmed) {
      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);
      setIsLoading(true);
  
      try {
        const checkResponse = await axios.get(
          `${API_URL}/check-tender-usage?Tender_No=${formData.Tender_No}&Company_Code=${companyCode}&Year_Code=${Year_Code}`
        );
        if (checkResponse.data.isUsed) {
          Swal.fire({
            title: "Error",
            text: "Cannot delete: This tender number is currently in use.",
            icon: "error",
          });
          return;
        }
  
        const deleteApiUrl = `${API_URL}/delete_TenderBytenderid?tenderid=${newTenderId}`;
        const response = await axios.delete(deleteApiUrl);
  
        if (response.status === 200) {
          Swal.fire({
            title: "Deleted!",
            text: "The record has been deleted successfully.!",
            icon: "success",
          });
          handleCancel();
  
          if (formData.Voucher_No !== 0) {
            const commissionDelete = `${API_URL}/delete-CommissionBill?doc_no=${formData.Voucher_No}&Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${formData.Voucher_Type}`;
            const result = await axios.delete(commissionDelete);
            if (result.status === 200 || result.status === 201) {
              Swal.fire({
                title: "Deleted!",
                text: "Commission record has been deleted successfully.",
                icon: "success",
              });
              handleCancel();
            }
          }
        } else {
          Swal.fire({
            title: "Error",
            text: "Failed to delete the tender.",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("Error during API call:", error);
        Swal.fire({
          title: "Error",
          text: `There was an error during the deletion: ${error.message}`,
          icon: "error",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      Swal.fire({
        title: "Cancelled",
        text: "Your record is safe 🙂",
        icon: "info",
      });
    }
  };
  

  const handleCancel = async () => {
    setIsEditing(false);
    setIsEditMode(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setCancelButtonClicked(true);

    try {
      const endpoint = `${API_URL}/getlasttender_record_navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}`;

      await fetchTenderData(endpoint, "last");

      unlockRecord();
    } catch (error) {
      console.error("Error during handleCancel API call:", error);
    }
  };

  const handleBack = () => {
    navigate("/tender-purchaseutility");
  };

  const handlerecordDoubleClicked = async () => {
    try {
      const tenderNo = selectedTenderNo || selectedRecord?.Tender_No;

      if (!tenderNo) {
        console.error("No Tender No. provided.");
        return;
      }

      const endpoint = `${API_URL}/getTenderByTenderNo?Company_Code=${companyCode}&Tender_No=${tenderNo}&Year_Code=${Year_Code}`;

      await fetchTenderData(endpoint, "last");

      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);
      setUpdateButtonClicked(true);
      setIsEditing(false);
    } catch (error) {
      console.error("Error fetching data during double-click:", error);
    }
  };

  useEffect(() => {
    if (selectedRecord || selectedTenderNo) {
      handlerecordDoubleClicked();
    } else {
      handleAddOne();
    }
    // document.getElementById("type").focus();
  }, [selectedRecord, selectedTenderNo]);

  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;

      if (!changeNoValue) {
        console.error("No value provided for Tender No.");
        return;
      }

      try {
        const endpoint = `${API_URL}/getTenderByTenderNo?Company_Code=${companyCode}&Tender_No=${changeNoValue}&Year_Code=${Year_Code}`;

        await fetchTenderData(endpoint, "last");

        setIsEditing(false);
      } catch (error) {
        console.error("Error fetching data on Tab key press:", error);
      }
    }
  };

  const fetchSelfAcData = async () => {
    try {
      const response = await axios.get(`${API_URL}/get_SelfAc`, {
        params: { Company_Code: companyCode },
      });

      const selfAcCode = response.data.SELF_AC;
      const selfAccoid = response.data.Self_acid;
      const selfAcName = response.data.Self_acName;

      setSelf_ac_code(selfAcCode);
      set_self_accoid(selfAccoid);
      set_self_acName(selfAcName);

      setFormData((prevData) => ({
        ...prevData,
        Broker: selfAcCode,
        bk: selfAccoid,
      }));

      setUsers((prevUsers) => [
        {
          ...formDataDetail,
          rowaction: "add",
          id:
            prevUsers.length > 0
              ? Math.max(...prevUsers.map((user) => user.id)) + 1
              : 1,
          Buyer: selfAcCode,
          billtoName: selfAcName,
          buyerid: selfAccoid,
          ShipTo: selfAcCode,
          shiptoName: selfAcName,
          shiptoid: selfAccoid,
          buyerpartyid: selfAccoid,
          sub_broker: selfAcCode,
          brokerDetail: selfAcName,
          sbr: selfAccoid,
          Buyer_Party: selfAcCode,
          buyerPartyName: selfAcName,
          buyerpartyid: selfAccoid,
          Lifting_Date: formData.Lifting_Date,
          gst_rate: formData.gstratecode,
          tcs_rate: parseFloat(formData.TCS_Rate),
          Delivery_Type: dispatchType,
          ID: 1,
        },
        ...prevUsers,
      ]);
    } catch (error) {
      console.log(error.response?.data?.error || "An error occurred");
    }
  };

  const handleVoucherClick = () => {
    navigate("/commission-bill", {
      state: {
        selectedVoucherNo: formData.Voucher_No,
        selectedVoucherType: formData.Voucher_Type,
      },
    });
  };

  //detail part
  const addUser = async (e) => {
    const newUser = {
      ...formDataDetail,
      id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1,
      Buyer: billTo,
      billtoName: billtoName,
      buyerid: billToAccoid,
      ShipTo: shipTo,
      shiptoName: shiptoName,
      shiptoid: shipToAccoid,
      sub_broker: subBroker || selfAcCode || self_ac_Code,
      brokerDetail: brokerDetail || selfAcName || self_acName,
      sbr: subBrokerAccoid || selfAccoid || self_accoid,
      Buyer_Party: buyerParty || self_ac_Code || selfAcCode,
      buyerPartyName: buyerPartyName || selfAcName || self_acName,
      buyerpartyid: buyerPartyAccoid || selfAccoid || self_accoid,
      gst_rate: gstCode || formDataDetail.gst_rate,
      gst_amt:
        calculatedValues.gstAmtDetail ||
        (formDataDetail.Buyer_Quantal * formDataDetail.Sale_Rate * gstCode) /
        100 ||
        0.0,
      tcs_rate: formData.TCS_Rate || formDataDetail.tcs_rate,
      tcs_amt: formDataDetail.tcs_amt || 0.0,
      rowaction: "add",
      Lifting_Date: formData.Lifting_Date || "",
      Delivery_Type: dispatchType,
    };
    const updatedUsers = [...users];
    if (updatedUsers.length > 0) {
      const firstUser = updatedUsers[0];
      updatedUsers[0] = {
        ...firstUser,
        Buyer_Quantal:
          firstUser.Buyer_Quantal - (formDataDetail.Buyer_Quantal || 0),
      };
    }
    updatedUsers.push(newUser);
    setUsers(updatedUsers);
    closePopup();
  };

  const updateUser = async () => {
    const selectedUserOriginalQuantal =
      users.find((user) => user.id === selectedUser.id)?.Buyer_Quantal || 0;
    const newBuyerQuantal = formDataDetail.Buyer_Quantal || 0;
    const quantalDifference = newBuyerQuantal - selectedUserOriginalQuantal;
    const updatedUsers = users.map((user) => {
      if (user.id === selectedUser.id) {
        const updatedRowaction =
          user.rowaction === "Normal" ? "update" : user.rowaction;

        return {
          ...user,
          Buyer: billTo || selfAcCode,
          billtoName: billtoName || selfAcName,
          ShipTo: shipTo || selfAcCode,
          shiptoName: shiptoName || selfAcName,
          sub_broker: subBroker || selfAcCode,
          brokerDetail: brokerDetail || selfAcName,
          //BP_Detail: formDataDetail.BP_Detail,
          Buyer_Party: buyerParty || selfAcCode,
          buyerPartyName: buyerPartyName || selfAcName,
          Buyer_Quantal: newBuyerQuantal,
          CashDiff: formDataDetail.CashDiff,
          Commission_Rate: formDataDetail.Commission_Rate,
          //DetailBrokrage: formDataDetail.DetailBrokrage,
          Lifting_Date: formDataDetail.Lifting_Date,
          Narration: formDataDetail.Narration,
          Sale_Rate: formDataDetail.Sale_Rate,
          Sauda_Date: formDataDetail.Sauda_Date,
          gst_amt:
            calculatedValues.gstAmtDetail ||
            (newBuyerQuantal * formDataDetail.Sale_Rate * gstCode) / 100 ||
            0.0,
          gst_rate: formDataDetail.gst_rate || 0.0,
          //loding_by_us: formDataDetail.loding_by_us,
          Delivery_Type: formDataDetail.Delivery_Type,
          tcs_amt: formDataDetail.tcs_amt,
          tcs_rate: formDataDetail.tcs_rate || 0.0,
          Broker: newBroker || selfAcCode,
          brokerName: brokerName || selfAcName,
          Delivery_Type: dispatchType,
          rowaction: updatedRowaction,
        };
      } else {
        return user;
      }
    });
    if (updatedUsers.length > 0 && updatedUsers[0]) {
      updatedUsers[0] = {
        ...updatedUsers[0],
        Buyer_Quantal: updatedUsers[0].Buyer_Quantal - quantalDifference,
      };
    }
    setUsers(updatedUsers);

    closePopup();
  };

  const deleteModeHandler = (user) => {
    let updatedUsers = [...users];
    const userQuantal = parseFloat(user.Buyer_Quantal) || 0;

    if (isEditMode && user.rowaction === "add") {
      setDeleteMode(true);
      setSelectedUser(user);

      if (updatedUsers.length > 0) {
        updatedUsers[0] = {
          ...updatedUsers[0],
          Buyer_Quantal: updatedUsers[0].Buyer_Quantal + userQuantal,
        };
      }

      updatedUsers = updatedUsers.map((u) =>
        u.id === user.id ? { ...u, rowaction: "DNU" } : u
      );
    } else if (isEditMode) {
      setDeleteMode(true);
      setSelectedUser(user);

      if (updatedUsers.length > 0) {
        updatedUsers[0] = {
          ...updatedUsers[0],
          Buyer_Quantal: updatedUsers[0].Buyer_Quantal + userQuantal,
        };
      }

      updatedUsers = updatedUsers.map((u) =>
        u.id === user.id ? { ...u, rowaction: "delete" } : u
      );
    } else {
      setDeleteMode(true);
      setSelectedUser(user);

      if (updatedUsers.length > 0) {
        updatedUsers[0] = {
          ...updatedUsers[0],
          Buyer_Quantal: updatedUsers[0].Buyer_Quantal + userQuantal,
        };
      }

      updatedUsers = updatedUsers.map((u) =>
        u.id === user.id ? { ...u, rowaction: "DNU" } : u
      );
    }

    setUsers(updatedUsers);
    setSelectedUser({});
  };

  const openDelete = async (user) => {
    setDeleteMode(true);
    setSelectedUser(user);
    let updatedUsers = [...users];
    const userQuantal = parseFloat(user.Buyer_Quantal) || 0;

    if (isEditMode && user.rowaction === "delete") {
      if (updatedUsers.length > 0) {
        updatedUsers[0] = {
          ...updatedUsers[0],
          Buyer_Quantal: updatedUsers[0].Buyer_Quantal - userQuantal,
        };
      }

      updatedUsers = updatedUsers.map((u) =>
        u.id === user.id ? { ...u, rowaction: "Normal" } : u
      );
    } else {
      if (updatedUsers.length > 0) {
        updatedUsers[0] = {
          ...updatedUsers[0],
          Buyer_Quantal: updatedUsers[0].Buyer_Quantal - userQuantal,
        };
      }

      updatedUsers = updatedUsers.map((u) =>
        u.id === user.id ? { ...u, rowaction: "add" } : u
      );
    }

    setUsers(updatedUsers);
    setSelectedUser({});
  };

  const openPopup = (mode) => {
    setPopupMode(mode);
    setShowPopup(true);
    if (mode === "add") {
      clearForm();
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedUser({});
    clearForm();
  };

  const clearForm = () => {
    setFormDataDetail({
      Buyer_Quantal: "",
      Sale_Rate: 0.0,
      Commission_Rate: 0.0,
      Sauda_Date: new Date().toISOString().split("T")[0],
      Lifting_Date: formData.Lifting_Date,
      Narration: "",
      tcs_rate: 0.0,
      gst_rate: 0.0,
      tcs_amt: 0.0,
      gst_amt: 0.0,
      CashDiff: 0.0,
      //BP_Detail: "",
      //loding_by_us: "",
      //DetailBrokrage: "",
    });
    setBillTo("");
    setShipTo("");
    setSubBroker("");
    setBillToAccoid("");
    setShipToAccoid("");
    setSubBrokerAccoid("");
    setBillToName("");
    setShipToName("");
    setBrokerDetail("");
    setDetailBroker("");
    setBuyerParty("");
    setBuyerPartyAccoid("");
    setBuyerPartyName("");

    selfAcCode = "";
    selfAcName = "";
    selfAccoid = "";
  };

  const editUser = (user) => {
    setSelectedUser(user);

    setBillTo(user.Buyer);
    setShipTo(user.ShipTo);
    setSubBroker(user.sub_broker);
    setBillToName(user.billtoName);
    setShipToName(user.shiptoName);
    setBrokerDetail(user.subBrokerName);
    setBuyerParty(user.Buyer_Party);
    setBuyerPartyName(user.buyerPartyName);

    setFormDataDetail({
      Buyer_Quantal: user.Buyer_Quantal || 0.0,
      Sale_Rate: user.Sale_Rate || 0.0,
      Commission_Rate: user.Commission_Rate || 0.0,
      Sauda_Date: user.Sauda_Date || 0.0,
      Lifting_Date: user.Lifting_Date || 0.0,
      Narration: user.Narration || 0.0,
      tcs_rate: user.tcs_rate || 0.0,
      gst_rate: user.gst_rate || 0.0,
      tcs_amt: user.tcs_amt || 0.0,
      gst_amt: parseFloat(user.gst_amt).toFixed(2) || 0.0,
      CashDiff: user.CashDiff || 0.0,
      //BP_Detail: user.BP_Detail || 0.0,
      // loding_by_us: user.loding_by_us || 0.0,
      // DetailBrokrage: user.DetailBrokrage || 0.0,
    });
    openPopup("edit");
  };

  useEffect(() => {
    if (selectedRecord) {
      setUsers(
        lastTenderDetails.map((detail) => ({
          Buyer: detail.Buyer,
          billtoName: detail.billtoName,
          ShipTo: detail.ShipTo,
          shiptoName: detail.shiptoName,
          Buyer_Party: detail.Buyer_Party,
          buyerPartyName: detail.buyerPartyName,
          sub_broker: detail.sub_broker,
          brokerDetail: detail.brokerDetail,
          //BP_Detail: detail.BP_Detail,
          Buyer_Quantal:
            detail.Buyer_Quantal !== undefined ? detail.Buyer_Quantal : 0,
          CashDiff: detail.CashDiff,
          Commission_Rate: detail.Commission_Rate,
          //DetailBrokrage: detail.DetailBrokrage,
          Lifting_Date: detail.Lifting_Date,
          Narration: detail.Narration,
          Sale_Rate: detail.Sale_Rate,
          Sauda_Date: detail.Sauda_Date,
          gst_amt: detail.gst_amt,
          gst_rate: detail.gst_rate,
          //loding_by_us: detail.loding_by_us,
          Delivery_Type: detail.Delivery_Type,
          tenderdetailid: detail.tenderdetailid,
          id: detail.ID,
          tcs_rate: detail.tcs_rate,
          tcs_amt: detail.tcs_amt,
          buyerid: detail.buyerid,
          buyerpartyid: detail.buyerpartyid,
          sbr: detail.sbr,
          gst_rate: detail.gst_rate,

          rowaction: "Normal",
        }))
      );
    }
  }, [selectedRecord, lastTenderDetails]);

  useEffect(() => {
    const updatedUsers = lastTenderDetails.map((detail) => ({
      Buyer: detail.Buyer,
      billtoName: detail.buyername,
      ShipTo: detail.ShipTo,
      shiptoName: detail.ShipToname,
      Buyer_Party: detail.Buyer_Party,
      buyerPartyName: detail.buyerpartyname,
      sub_broker: detail.sub_broker,
      brokerDetail: detail.subbrokername,
      //BP_Detail: detail.BP_Detail,
      Buyer_Quantal:
        detail.Buyer_Quantal !== undefined ? detail.Buyer_Quantal : 0,
      CashDiff: detail.CashDiff,
      Commission_Rate: detail.Commission_Rate,
      //DetailBrokrage: detail.DetailBrokrage,
      Lifting_Date: detail.payment_date,
      Narration: detail.Narration || "",
      Sale_Rate: detail.Sale_Rate,
      Sauda_Date: detail.Sauda_Date,
      gst_amt: detail.gst_amt,
      gst_rate: detail.gst_rate,
      //loding_by_us: detail.loding_by_us,
      Delivery_Type: detail.Delivery_Type,
      tenderdetailid: detail.tenderdetailid,
      id: detail.ID,
      tcs_rate: detail.tcs_rate,
      tcs_amt: detail.tcs_amt,
      buyerid: detail.buyerid,
      buyerpartyid: detail.buyerpartyid,
      sbr: detail.sbr,

      rowaction: "Normal",
    }));
    setUsers(updatedUsers);
  }, [lastTenderDetails]);

  useEffect(() => {
    if (users.length > 0) {
      const updatedUsers = [...users];

      if (formData.Quantal !== undefined) {
        const firstUser = updatedUsers[0];
        const newBuyerQuantal = parseFloat(formData.Quantal) || 0;
        const newGstRate = gstCode || firstUser.gst_rate;
        const newGstAmt =
          (newBuyerQuantal * newGstRate * (firstUser.Sale_Rate || 0)) / 100 ||
          0.0;

        updatedUsers[0] = {
          ...firstUser,
          Buyer_Quantal: newBuyerQuantal,
          gst_rate: newGstRate,
          gst_amt: newGstAmt,
          rowaction: firstUser.rowaction === "add" ? "add" : "update",
        };
      }

      if (updatedUsers.length > 1) {
        let remainingQuantal = updatedUsers[0].Buyer_Quantal;

        for (let i = 1; i < updatedUsers.length; i++) {
          const currentUser = updatedUsers[i];
          const userQuantal = currentUser.Buyer_Quantal || 0;

          remainingQuantal -= userQuantal;

          updatedUsers[0].Buyer_Quantal = remainingQuantal;
        }
      }

      setUsers(updatedUsers);
    }
  }, [formData.Quantal]);

  const handleBuyerQuantalUpdate = () => {
    if (users.length > 0) {
      const updatedUsers = [...users];

      if (formData.Quantal !== undefined) {
        const firstUser = updatedUsers[0];
        const newBuyerQuantal = parseFloat(formData.Quantal) || 0;
        const newGstRate = gstCode || firstUser.gst_rate;
        const newGstAmt =
          (newBuyerQuantal * newGstRate * (firstUser.Sale_Rate || 0)) / 100 ||
          0.0;

        updatedUsers[0] = {
          ...firstUser,
          Buyer_Quantal: newBuyerQuantal,
          gst_rate: newGstRate,
          gst_amt: newGstAmt,
          rowaction: firstUser.rowaction === "add" ? "add" : "update",
        };
      }

      if (updatedUsers.length > 1) {
        let remainingQuantal = updatedUsers[0].Buyer_Quantal;

        for (let i = 1; i < updatedUsers.length; i++) {
          const currentUser = updatedUsers[i];
          const userQuantal = currentUser.Buyer_Quantal || 0;

          remainingQuantal -= userQuantal;
          updatedUsers[0].Buyer_Quantal = remainingQuantal;
        }
      }
      setUsers(updatedUsers);
    }
  };

  //  const handleKeyDownCalBuyerQuantal = (e) => {
  //   if (e.key === "Tab") {
  //     handleBuyerQuantalUpdate();
  //   }
  // }

  const TCSCalculationDetail = (e) => {
    if (e.key === "Tab") {
      const updatedCalculatedValues = calculateValues(
        formData,
        formDataDetail,
        tdsApplicable,
        gstCode
      );
      setFormDataDetail((prevFormDataDetail) => ({
        ...prevFormDataDetail,
        tcs_amt: updatedCalculatedValues.TCSAmt || 0,
      }));
    }
  };

  //common function for navigation and fetching perticular record
  const fetchTenderData = async (endpoint, action) => {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();

        const headData = data[`${action}_tender_head_data`] || {};
        const detailsData = data[`${action}_tender_details_data`] || [];

        console.log(headData);

        newTenderId = headData.tenderid;
        millCodeName = detailsData[0]?.MillName || "";
        newMill_Code = headData.Mill_Code;
        gradeName = headData.Grade;
        paymentToName = detailsData[0]?.PaymentToAcName || "";
        newPayment_To = headData.Payment_To;
        tenderFromName = detailsData[0]?.TenderFromAcName || "";
        newTender_From = headData.Tender_From;
        tenderDOName = detailsData[0]?.TenderDoAcName || "";
        newTender_DO = headData.Tender_DO;
        voucherByName = detailsData[0]?.VoucherByAcName || "";
        newVoucher_By = headData.Voucher_By;
        brokerName = detailsData[0]?.BrokerAcName || "";
        newBroker = headData.Broker;
        itemName = detailsData[0]?.ItemName || "";
        newitemcode = headData.itemcode;
        gstRateName = detailsData[0]?.GST_Name || "";
        gstRateCode = detailsData[0]?.GSTRate || 0;
        newgstratecode = headData.gstratecode;
        // bpAcName = detailsData[0]?.BPAcName || "";
        // newBp_Account = headData.Bp_Account;
        billToName = detailsData[0]?.buyername || "";
        newBillToCode = detailsData[0]?.Buyer || 0;
        shipToName = detailsData[0]?.ShipToname || "";
        shipToCode = detailsData[0]?.ShipTo || 0;
        subBrokerName = detailsData[0]?.subbrokername || "";
        subBrokerCode = detailsData[0]?.sub_broker || 0;
        buyerPartyCode = detailsData[0]?.Buyer_Party || 0;
        buyer_party_name = detailsData[0]?.buyerpartyname || "";
        balance = detailsData[0]?.balance || 0;
        dispatched = detailsData[0]?.despatched || 0;

        // const updatedTenderDetailsData = detailsData.map((item, index) => ({
        //   ...item,
        //   Buyer_Quantal:
        //   index === 0
        //     ? parseFloat(detailsData[0].Buyer_Quantal || 0)
        //     : parseFloat(item.Buyer_Quantal || 0),

        // }));

        setFormData((prevData) => ({
          ...prevData,
          ...headData,
        }));

        setLastTenderData(headData || {});
        setLastTenderDetails(detailsData || []);
        setUsers(
          detailsData.map((detail) => ({
            Buyer: detail.Buyer,
            billtoName: detail.buyername,
            ShipTo: detail.ShipTo,
            shiptoName: detail.ShipToname,
            Buyer_Party: detail.Buyer_Party,
            buyerPartyName: detail.buyerpartyname,
            sub_broker: detail.sub_broker,
            brokerDetail: detail.subbrokername,
            // BP_Detail: detail.BP_Detail,
            Buyer_Quantal:
              detail.Buyer_Quantal !== undefined ? detail.Buyer_Quantal : 0,
            CashDiff: detail.CashDiff,
            Commission_Rate: detail.Commission_Rate,
            //DetailBrokrage: detail.DetailBrokrage,
            Lifting_Date: detail.payment_date,
            Narration: detail.Narration || "",
            Sale_Rate: detail.Sale_Rate,
            Sauda_Date: detail.Sauda_Date,
            gst_amt: detail.gst_amt,
            gst_rate: detail.gst_rate,
            //loding_by_us: detail.loding_by_us,
            Delivery_Type: detail.Delivery_Type,
            tenderdetailid: detail.tenderdetailid,
            id: detail.ID,
            tcs_rate: detail.tcs_rate,
            tcs_amt: detail.tcs_amt,
            buyerid: detail.buyerid,
            buyerpartyid: detail.buyerpartyid,
            sbr: detail.sbr,
            rowaction: "Normal",
            despatched: detail.despatched,
            balance: detail.balance
          }))
        );
      } else {
        console.error(
          `Failed to fetch ${action} record:`,
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error(`Error during API call for ${action}:`, error);
    }
  };

  // Handle the "First" button
  const handleFirstButtonClick = async () => {
    const endpoint = `${API_URL}/getfirsttender_record_navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}`;
    await fetchTenderData(endpoint, "first");
  };

  // Handle the "Previous" button
  const handlePreviousButtonClick = async () => {
    const endpoint = `${API_URL}/getprevioustender_navigation?CurrenttenderNo=${formData.Tender_No}&Company_Code=${companyCode}&Year_Code=${Year_Code}`;
    await fetchTenderData(endpoint, "previous");
  };

  // Handle the "Next" button
  const handleNextButtonClick = async () => {
    const endpoint = `${API_URL}/getnexttender_navigation?CurrenttenderNo=${formData.Tender_No}&Company_Code=${companyCode}&Year_Code=${Year_Code}`;
    await fetchTenderData(endpoint, "next");
  };

  return (
    <>
      <UserAuditInfo
        createdBy={formData.Created_By}
        modifiedBy={formData.Modified_By}
        title={"Tender Purchase"}
      />
      <ToastContainer autoClose={500} />
      <form className="SugarTenderPurchase-container" onSubmit={handleSubmit}>
        <div>
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
          <NavigationButtons
            handleFirstButtonClick={handleFirstButtonClick}
            handlePreviousButtonClick={handlePreviousButtonClick}
            handleNextButtonClick={handleNextButtonClick}
            handleLastButtonClick={handleCancel}
            highlightedButton={highlightedButton}
            isEditing={isEditing}
          />
        </div>

        <div className="SugarTenderPurchase-row">

          <Grid container spacing={1}>
            <Grid item xs={12} sm={4} md={0.5} sx={{ padding: 0, minWidth: '100px', maxWidth: '100px' }} >
              <TextField
                label="Change No"
                variant="outlined"
                name="changeNo" 
                onKeyDown={handleKeyDown}
                disabled={!addOneButtonEnabled}
                fullWidth
                autoComplete="off"
                tabIndex={1}
                size="small"
                InputLabelProps={{
                  style: { fontSize: '12px' },
                }}
                InputProps={{
                  style: { fontSize: '12px', height: '30px' },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '30px',
                    padding: '0px 10px',
                  },
                }}
              />
            </Grid>


            <Grid item xs={12} sm={4} md={0.5} sx={{ padding: 0, minWidth: '100px', maxWidth: '100px' }}>
              <TextField
                label="Tender No"
                variant="outlined"
                name="Tender_No"
                value={formData.Tender_No}
                onChange={handleChange}
                disabled
                fullWidth
                tabIndex={2}
                size="small"
                InputLabelProps={{
                  style: { fontSize: '12px', marginTop: '-4px' },
                }}
                InputProps={{
                  style: { fontSize: '12px', height: '30px' },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '30px',
                    padding: '0px 10px',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4} md={1} sx={{ padding: 0, minWidth: '100px', maxWidth: '100px' }}>
              <FormControl
                fullWidth
                variant="outlined"
                disabled={!isEditing && addOneButtonEnabled}
                sx={{
                  '& .MuiInputLabel-root': {
                    fontSize: '8px', // Reducing the font size of the label
                    paddingTop: '0px', // Reduce the space above the label
                  },
                }}
              >
                <InputLabel>Resale/Mill</InputLabel>
                <Select
                  value={formData.type}
                  onChange={handleChange}
                  label="Resale/Mill"
                  name="type"
                  size="small"
                  sx={{
                    fontSize: '10px',
                    '& .MuiOutlinedInput-root': {
                      height: '25px',
                      padding: '0px 5px',
                    },
                    '& .MuiSelect-icon': {
                      minWidth: '20px',
                    },
                  }}
                >
                  <MenuItem value="R">Resale</MenuItem>
                  <MenuItem value="M">Mill</MenuItem>
                  <MenuItem value="W">With Payment</MenuItem>
                  <MenuItem value="P">Party Bill Rate</MenuItem>
                </Select>
              </FormControl>
            </Grid>


            <Grid item xs={12} sm={4} md={1} sx={{ padding: 0, minWidth: '100px', maxWidth: '100px' }}>
              <FormControl
                fullWidth
                variant="outlined"
                disabled={!isEditing && addOneButtonEnabled}
                sx={{
                  '& .MuiInputLabel-root': {
                    fontSize: '10px', // Reduce the font size of the label
                    paddingTop: '0px', // Remove top padding for a more compact look
                  },
                }}
              >
                <InputLabel>Auto Purchase Bill</InputLabel>
                <Select
                  value={formData.AutoPurchaseBill}
                  onChange={handleChange}
                  label="Auto Purchase Bill"
                  name="AutoPurchaseBill"
                  size="small"
                  sx={{
                    fontSize: '10px',
                    '& .MuiOutlinedInput-root': {
                      height: '25px',
                      padding: '0px 5px',
                    },
                    '& .MuiSelect-icon': {
                      minWidth: '20px',
                    },
                  }}
                  InputLabelProps={{
                    style: { fontSize: '10px' },
                    shrink: true,
                  }}
                  InputProps={{
                    style: { fontSize: '10px', height: '25px' },
                  }}
                >
                  <MenuItem value="Y">Yes</MenuItem>
                  <MenuItem value="N">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>


            <Grid item xs={12} sm={6} md={1} onClick={handleVoucherClick}>
              <TextField
                label="Voucher No"
                variant="outlined"
                name="Voucher_No"
                value={formData.Voucher_No}
                onChange={handleChange}
                disabled
                fullWidt
                size="small"
                InputLabelProps={{
                  style: { fontSize: '12px' },
                }}
                InputProps={{
                  style: { fontSize: '12px', height: '30px' },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '30px',
                    padding: '0px 10px',
                  },
                }}
              />
              <Typography variant="body2">{formData.Voucher_Type}</Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={0.8}>
              <TextField
                label="Date"
                variant="outlined"
                type="date"
                name="Tender_Date"
                value={formData.Tender_Date}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                fullWidth
                size="small"
                InputLabelProps={{
                  style: { fontSize: '12px' },
                  shrink: true,
                }}
                InputProps={{
                  style: { fontSize: '12px', height: '30px' },
                }}
                tabIndex={7}
              />
            </Grid>


            <Grid item xs={12} sm={6} md={0.8}>
              <TextField
                label="Payment Date"
                variant="outlined"
                type="date"
                name="Lifting_Date"
                value={formData.Lifting_Date}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                fullWidth
                size="small"
                InputLabelProps={{
                  style: { fontSize: '12px' },
                  shrink: true,
                }}
                InputProps={{
                  style: { fontSize: '12px', height: '30px' },
                }}
                tabIndex={8}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={1}>
              <TextField
                label="Group Tender No"
                variant="outlined"
                type="text"
                name="groupTenderNo"
                value={formData.groupTenderNo}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                fullWidth
                size="small"
                InputLabelProps={{
                  style: { fontSize: '12px' },
                }}
                InputProps={{
                  style: { fontSize: '12px', height: '30px' },
                }}
                tabIndex={9}
              />
            </Grid>

          </Grid>
        </div>

        <div className="SugarTenderPurchase-row">
          <Grid container spacing={1} mt={-2}>
            <Grid item xs={12} sm={6} md={3}>
              <div className="TenderPurchaseHelp-row">
                <label htmlFor="Bill_From" className="TenderPurchaseHelpLabel" >
                  Mill Name :
                </label>
                <div >
                  <div >
                    <AccountMasterHelp
                      name="Mill_Code"
                      onAcCodeClick={handleMill_Code}
                      CategoryName={millCodeName}
                      CategoryCode={newMill_Code}
                      Ac_type={[]}
                      disabledFeild={!isEditing && addOneButtonEnabled}
                    />
                  </div>
                </div>
              </div>
            </Grid>
          </Grid>
        </div>

        <div className="SugarTenderPurchase-row">
          <Grid item xs={12} sm={6} md={3}>
            <div className="TenderPurchaseHelp-row">
              <label htmlFor="Bill_From" className="TenderPurchaseHelpLabel" >
                Item Code:
              </label>
              <div >
                <div >
                  <SystemHelpMaster
                    name="itemcode"
                    onAcCodeClick={handleitemcode}
                    CategoryName={itemName}
                    CategoryCode={newitemcode || itemCode}
                    disabledField={!isEditing && addOneButtonEnabled}
                    SystemType="I"
                  />
                </div>
              </div>
            </div>
          </Grid>

          <Grid item xs={12} sm={4} md={0.5} sx={{ padding: 0, minWidth: '100px', maxWidth: '100px', marginLeft: "10px" }}>
            <TextField
              label="Season"
              variant="outlined"
              type="text"
              name="season"
              autoComplete="off"
              value={formData.season}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              size="small"
              InputLabelProps={{
                style: { fontSize: '12px' },
              }}
              InputProps={{
                style: { fontSize: '12px', height: '30px' },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={3} md={2.1}>
            <div className="TenderPurchaseHelp-row">
              <label htmlFor="Grade" className="TenderPurchaseHelpLabel" >
                Grade :
              </label>
              <div >
                <div >
                  <GradeMasterHelp
                    name="Grade"
                    onAcCodeClick={handleGrade}
                    CategoryName={formData.Grade || newGrade}
                    disabledField={!isEditing && addOneButtonEnabled}
                    onCategoryChange={handleGradeUpdate}
                  />
                </div>
              </div>
            </div>
          </Grid>

          <Grid item xs={12} sm={1} md={0.5} sx={{ padding: 0.5, minWidth: '100px', maxWidth: '100px' }}>
            <TextField
              label="Quintal"
              variant="outlined"
              type="text"
              name="Quantal"
              value={formData.Quantal}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              disabled={!isEditing && addOneButtonEnabled}
              fullWidth
              size="small"
              InputLabelProps={{
                style: { fontSize: '12px' },
              }}
              InputProps={{
                style: { fontSize: '12px', height: '30px' },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4} md={0.5} sx={{ padding: 0.5, minWidth: '100px', maxWidth: '100px' }}>
            <TextField
              fullWidth
              label="Packing"
              id="Packing"
              name="Packing"
              value={formData.Packing}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              disabled={!isEditing && addOneButtonEnabled}
              variant="outlined"
              type="text"
              size="small"
              InputLabelProps={{
                style: { fontSize: '12px' },
              }}
              InputProps={{
                style: { fontSize: '12px', height: '30px' },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4} md={0.5} sx={{ padding: 0.5, minWidth: '100px', maxWidth: '100px' }}>
            <TextField
              fullWidth
              label="Bags"
              id="Bags"
              name="Bags"
              value={formData.Bags || calculatedValues.bags}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              disabled={!isEditing && addOneButtonEnabled}
              variant="outlined"
              type="text"
              size="small"
              InputLabelProps={{
                style: { fontSize: '12px' },
              }}
              InputProps={{
                style: { fontSize: '12px', height: '30px' },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4} md={0.5} sx={{ padding: 0.5, minWidth: '100px', maxWidth: '100px' }}>
            <TextField
              fullWidth
              label="Mill Rate"
              id="Mill_Rate"
              name="Mill_Rate"
                   autoComplete="off"
              value={formData.Mill_Rate}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              disabled={!isEditing && addOneButtonEnabled}
              variant="outlined"
              type="text"
              size="small"
              InputLabelProps={{
                style: { fontSize: '12px' },
              }}
              InputProps={{
                style: { fontSize: '12px', height: '30px' },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4} md={0.5} sx={{ padding: 0.5, minWidth: '100px', maxWidth: '100px' }}>
            <TextField
              fullWidth
              label="Purchase Rate"
              id="Purc_Rate"
              name="Purc_Rate"
              value={formData.Purc_Rate}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              disabled={!isEditing && addOneButtonEnabled || formData.type === 'M'}
              variant="outlined"
              type="text"
              size="small"
              InputLabelProps={{
                style: { fontSize: '12px' },
              }}
              InputProps={{
                style: { fontSize: '12px', height: '30px' },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4} md={0.5} sx={{ padding: 0.5, minWidth: '100px', maxWidth: '100px' }}>
            <TextField
              fullWidth
              label="Party Bill Rate"
              id="Party_Bill_Rate"
              name="Party_Bill_Rate"
              value={formData.Party_Bill_Rate}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              disabled={!isEditing && addOneButtonEnabled}
              variant="outlined"
              type="text"
              size="small"
              InputLabelProps={{
                style: { fontSize: '12px' },
              }}
              InputProps={{
                style: { fontSize: '12px', height: '30px' },
              }}
            />
          </Grid>


          <Grid item xs={12} sm={4} md={0.5} sx={{ padding: 0.5, minWidth: '100px', maxWidth: '100px' }}>
            <TextField
              fullWidth
              label="CashDiff"
              id="CashDiff"
              name="CashDiff"
              value={calculatedValues.diff || formData.CashDiff}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              disabled={!isEditing && addOneButtonEnabled}
              variant="outlined"
              type="text"
              size="small"
              InputLabelProps={{
                style: { fontSize: '12px' },
              }}
              InputProps={{
                style: { fontSize: '12px', height: '30px' },
              }}
            />
          </Grid>
          <label>{calculatedValues.amount}</label>
        </div>

        <div className="TenderPurchaseHelp-row">
          <div className="SugarTenderPurchase-col">
            <label
              htmlFor="Payment_To"
              className="SugarTenderPurchase-form-label"
            >
              Payment To:
            </label>
            <AccountMasterHelp
              name="Payment_To"
              onAcCodeClick={handlePayment_To}
              CategoryName={paymentToName || payment_toName}
              CategoryCode={newPayment_To || formData.Payment_To}
              Ac_type=""
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
          </div>
          <div className="SugarTenderPurchase-col">
            <label
              htmlFor="Tender_From"
              className="SugarTenderPurchase-form-label"
            >
              Tender From:
            </label>
            <AccountMasterHelp
              name="Tender_From"
              onAcCodeClick={handleTender_From}
              CategoryName={
                tenderFrName
                  ? tenderFrName
                  : formData.Tender_From === self_ac_Code
                    ? self_acName
                    : tenderFromName
              }
              CategoryCode={
                tenderFrom
                  ? tenderFrom
                  : formData.Tender_From || self_ac_Code || newTender_From
              }
              Ac_type=""
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
          </div>

          <div className="SugarTenderPurchase-col">
            <label
              htmlFor="Tender_From"
              className="SugarTenderPurchase-form-label"
            >
              Broker:
            </label>
            <AccountMasterHelp
              name="Broker"
              onAcCodeClick={handleBroker}
              CategoryName={
                formData.Broker === self_ac_Code ? self_acName : brokerName
              }
              CategoryCode={newBroker || self_ac_Code}
              Ac_type=""
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
          </div>

        </div>
        <div className="SugarTenderPurchase-row">
          <div className="SugarTenderPurchase-col">
            <label
              htmlFor="Tender_DO"
              className="SugarTenderPurchase-form-label"
            >
              Tender D.O.:
            </label>
            <AccountMasterHelp
              name="Tender_DO"
              onAcCodeClick={handleTender_DO}
              CategoryName={
                tenderDONm
                  ? tenderDONm
                  : formData.Tender_From === self_ac_Code
                    ? self_acName
                    : tenderFromName || tenderFrName
              }
              CategoryCode={
                formData.Tender_DO
                  ? formData.Tender_DO
                  : newTender_From || self_ac_Code
              }
              Ac_type=""
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
          </div>
          <div className="SugarTenderPurchase-col">
            <label
              htmlFor="Voucher_By"
              className="SugarTenderPurchase-form-label"
            >
              Voucher By:
            </label>
            <AccountMasterHelp
              onAcCodeClick={handleVoucher_By}
              name="Voucher_By"
              CategoryName={
                voucherbyName
                  ? voucherbyName
                  : formData.Voucher_By === self_ac_Code
                    ? self_acName
                    : voucherByName
              }
              CategoryCode={
                voucherBy
                  ? voucherBy
                  : newVoucher_By || formData.Voucher_By || self_ac_Code
              }
              disabledFeild={!isEditing && addOneButtonEnabled}
              Ac_type=""
            />
          </div>

          <div className="SugarTenderPurchase-col">
            <label
              htmlFor="Voucher_By"
              className="SugarTenderPurchase-form-label"
            >
              GST Rate Code:
            </label>
            <GSTRateMasterHelp
              onAcCodeClick={handlegstratecode}
              GstRateName={gstRateName}
              GstRateCode={newgstratecode || gstRateCode}
              name="gstratecode"
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
          </div>
        </div>

        <div className="SugarTenderPurchase-row">
      
          <Grid item xs={12} sm={1} md={0.5} sx={{ padding: 0.5, minWidth: '100px', maxWidth: '100px' }}>
            <TextField
              fullWidth
              label="Brokerage"
              id="Brokerage"
              name="Brokerage"
              value={formData.Brokrage}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              variant="outlined"
              size="small"
              InputLabelProps={{
                style: { fontSize: '12px' },
              }}
              InputProps={{
                style: { fontSize: '12px', height: '30px' },
              }}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </Grid>

          <Grid item xs={12} sm={1} md={0.5} sx={{ padding: 0.5, minWidth: '100px', maxWidth: '100px' }}>
            <TextField
              fullWidth
              label="GST Rate"
              id="Excise_Rate"
              name="Excise_Rate"
              value={calculatedValues.exciseAmount || formData.Excise_Rate}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              variant="outlined"
              size="small"
              InputLabelProps={{
                style: { fontSize: '12px' },
              }}
              InputProps={{
                style: { fontSize: '12px', height: '30px' },
              }}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </Grid>

          <Grid item xs={12} sm={1} md={0.5} sx={{ padding: 0.5, minWidth: '100px', maxWidth: '100px' }}>
            <TextField
              fullWidth
              label="GST Amount"
              id="GSTAmt"
              name="GSTAmt"
              value={calculatedValues.gstAmt || ""}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              variant="outlined"
              size="small"
              InputLabelProps={{
                style: { fontSize: '12px' },
              }}
              InputProps={{
                style: { fontSize: '12px', height: '30px' },
              }}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </Grid>

          <Grid item xs={12} sm={1} md={0.5} sx={{ padding: 0.5, minWidth: '100px', maxWidth: '100px' }}>
            <TextField
              fullWidth
              label="Sell Note No"
              id="Sell_Note_No"
              name="Sell_Note_No"
              value={formData.Sell_Note_No}
              onChange={handleChange}
              variant="outlined"
              size="small"
              InputLabelProps={{
                style: { fontSize: '12px' },
              }}
              InputProps={{
                style: { fontSize: '12px', height: '30px' },
              }}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </Grid>

          <Grid item xs={12} sm={1} md={0.5} sx={{ padding: 0.5, minWidth: '100px', maxWidth: '100px' }}>
            <TextField
              fullWidth
              label="TCS%"
              id="TCS_Rate"
              name="TCS_Rate"
              value={formData.TCS_Rate}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              variant="outlined"
              size="small"
              InputLabelProps={{
                style: { fontSize: '12px' },
              }}
              InputProps={{
                style: { fontSize: '12px', height: '30px' },
              }}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </Grid>

          <Grid item xs={12} sm={1} md={0.5} sx={{ padding: 0.5, minWidth: '100px', maxWidth: '100px' }}>
            <TextField
              fullWidth
              label="TCS Amount"
              id="TCS_Amt"
              name="TCS_Amt"
              value={calculatedValues.tcsAmt || calculatedValues.calculatedTcsAmt}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              variant="outlined"
              size="small"
              InputLabelProps={{
                style: { fontSize: '12px' },
              }}
              InputProps={{
                style: { fontSize: '12px', height: '30px' },
              }}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </Grid>

          <Grid item xs={12} sm={1} md={0.5} sx={{ padding: 0.5, minWidth: '100px', maxWidth: '100px' }}>
            <TextField
              fullWidth
              label="TDS Rate"
              id="TDS_Rate"
              name="TDS_Rate"
              value={formData.TDS_Rate}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              variant="outlined"
              size="small"
              InputLabelProps={{
                style: { fontSize: '12px' },
              }}
              InputProps={{
                style: { fontSize: '12px', height: '30px' },
              }}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </Grid>

          <Grid item xs={12} sm={1} md={0.5} sx={{ padding: 0.5, minWidth: '100px', maxWidth: '100px' }}>
            <TextField
              fullWidth
              label="TDS Amount"
              id="TDS_Amt"
              name="TDS_Amt"
              value={calculatedValues.tdsAmt || calculatedValues.calculatedTdsAmt}
              onChange={(e) => {
                validateNumericInput(e);
                handleChange(e);
              }}
              variant="outlined"
              size="small"
              InputLabelProps={{
                style: { fontSize: '12px' },
              }}
              InputProps={{
                style: { fontSize: '12px', height: '30px' },
              }}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </Grid>

          <Grid item xs={12} sm={12}>
            <TextField
              fullWidth
              label="Narration"
              id="Narration"
              name="Narration"
              value={formData.Narration}
              onChange={handleChange}
              variant="outlined"
              size="small"
              disabled={!isEditing && addOneButtonEnabled}
              multiline
              rows={1}
            />
          </Grid>

        </div>

        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner-container">
              <SaveUpdateSpinner />
            </div>
          </div>
        )}

    <AddButton openPopup={openPopup} isEditing={isEditing} ref={addButtonRef} setFocusToFirstField={setFocusToFirstField} />

        {/*detail part popup functionality and Validation part Grid view */}
        <div >
          {showPopup && (
            <div className="TenderPurchase-custom-modal">
              <div className="TenderPurchase-custom-modal-large-dialog">
                <div className="TenderPurchase-custom-modal-content">
                  <div className="TenderPurchase-custom-modal-header">
                    <h5 className="TenderPurchase-custom-modal-title">
                      {selectedUser.id ? "Edit Tender Detail" : "Add Tender Detail"}
                    </h5>
                    <button
                      type="button"
                      onClick={closePopup}
                      aria-label="Close"
                      className="TenderPurchase-close-btn"
                    >
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                  <div className="TenderPurchase-custom-modal-body">
                    <form>
                      <div className="TenderPurchaseHelp-row ">
                        <label className="TenderPurchaseHelpLabel">Bill To :</label>
                        <div className="TenderPurchase-form-element">
                          <AccountMasterHelp
                            key={billTo}
                            onAcCodeClick={handleBillTo}
                            CategoryName={selfAcCode ? selfAcName : billtoName}
                            CategoryCode={billTo || selfAcCode}
                            name="Buyer"
                            Ac_type=""
                            className="TenderPurchase-account-master-help"
                            disabledFeild={!isEditing && addOneButtonEnabled}
                            firstInputRef={firstInputRef}
                          />
                        </div>
                        <label className="TenderPurchaseHelpLabel">Ship To:</label>
                        <div className="TenderPurchase-form-element">
                          <AccountMasterHelp
                            key={shipTo}
                            onAcCodeClick={handleShipTo}
                            CategoryName={selfAcCode ? selfAcName : shiptoName}
                            CategoryCode={shipTo || selfAcCode}
                            name="ShipTo"
                            Ac_type=""
                            className="TenderPurchase-account-master-help"
                            disabledFeild={!isEditing && addOneButtonEnabled}
                          />
                        </div>
                      </div>

                      <div className="TenderPurchaseHelp-row ">
                        <label className="TenderPurchaseHelpLabel">Broker</label>
                        <div className="TenderPurchase-form-element">
                          <AccountMasterHelp
                            key={buyerParty}
                            onAcCodeClick={handleBuyerParty}
                            CategoryName={self_ac_Code ? self_acName : buyerPartyName}
                            CategoryCode={buyerParty || selfAcCode || self_ac_Code || 2}
                            name="Buyer_Party"
                            Ac_type=""
                            className="TenderPurchase-account-master-help"
                            disabledFeild={!isEditing && addOneButtonEnabled}
                          />
                        </div>
                        <label className="TenderPurchaseHelpLabel">Sub Broker:</label>
                        <div className="TenderPurchase-form-element">
                          <AccountMasterHelp
                            onAcCodeClick={handleDetailSubBroker}
                            CategoryName={self_ac_Code ? self_acName : brokerDetail}
                            CategoryCode={
                              formDataDetail.sub_broker ||
                              subBroker ||
                              selfAcCode ||
                              self_ac_Code ||
                              2
                            }
                            name="sub_broker"
                            Ac_type=""
                            className="TenderPurchase-account-master-help"
                            disabledFeild={!isEditing && addOneButtonEnabled}
                          />
                        </div>
                      </div>

                      <div className="TenderPurchase-form-container">
                        <form>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={3}>
                              <TextField
                                label="Delivery Type"
                                select
                                fullWidth
                                id="Delivery_Type"
                                name="Delivery_Type"
                                value={formDataDetail.Delivery_Type || dispatchType}
                                onChange={handleChangeDetail}
                                disabled={!isEditing && addOneButtonEnabled}
                                size="small"
                              >
                                <MenuItem value="N">With GST Naka Delivery</MenuItem>
                                <MenuItem value="A">Naka Delivery without GST Rate</MenuItem>
                                <MenuItem value="C">Commission</MenuItem>
                                <MenuItem value="D">DO</MenuItem>
                              </TextField>
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Brokrage"
                                fullWidth
                                name="DetailBrokrage"
                                autoComplete="off"
                                value={formDataDetail.DetailBrokrage}
                                onChange={handleChangeDetail}
                                disabled={!isEditing && addOneButtonEnabled}
                                size="small"
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Sub Broker"
                                fullWidth
                                value={formDataDetail.sub_broker}
                                onChange={handleChangeDetail}
                                size="small"
                                disabled={!isEditing && addOneButtonEnabled}
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Buyer Quantal"
                                fullWidth
                                name="Buyer_Quantal"
                                autoComplete="off"
                                value={formDataDetail.Buyer_Quantal}
                                onChange={(e) => {
                                  handleChangeDetail(e);
                                }}
                                size="small"
                                disabled={!isEditing && addOneButtonEnabled}
                              />
                            </Grid>
                          </Grid>

                          <Grid container spacing={2} mt={1}>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Sale Rate"
                                fullWidth
                                size="small"
                                name="Sale_Rate"
                                autoComplete="off"
                                value={formDataDetail.Sale_Rate}
                                onChange={(e) => {
                                  validateNumericInput(e);
                                  handleChangeDetail(e);
                                }}
                                disabled={!isEditing && addOneButtonEnabled}
                              />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Commission"
                                fullWidth
                                size="small"
                                name="Commission_Rate"
                                value={formDataDetail.Commission_Rate}
                                onChange={(e) => {
                                  validateNumericInput(e);
                                  handleChangeDetail(e);
                                }}
                                disabled={!isEditing && addOneButtonEnabled}
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Sauda Date"
                                type="date"
                                size="small"
                                fullWidth
                                name="Sauda_Date"
                                value={formDataDetail.Sauda_Date}
                                onChange={(e) =>
                                  handleDetailDateChange(e, "Sauda_Date")
                                }
                                disabled={!isEditing && addOneButtonEnabled}
                                InputLabelProps={{
                                  shrink: true,
                                }}

                                InputProps={{
                                  style: { fontSize: '12px', height: '35px' },
                                }}
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Payment Date"
                                type="date"
                                size="small"
                                fullWidth
                                name="Lifting_Date"
                                value={formDataDetail.Lifting_Date}
                                onChange={(e) =>
                                  handleDetailDateChange(e, "Lifting_Date")
                                }
                                disabled={!isEditing && addOneButtonEnabled}
                                InputLabelProps={{
                                  shrink: true,
                                }}
                                InputProps={{
                                  style: { fontSize: '12px', height: '35px' },
                                }}
                              />
                            </Grid>
                          </Grid>

                          <Grid container spacing={2} mt={1}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Narration"
                                fullWidth
                                size="small"
                                name="Narration"
                                value={formDataDetail.Narration}
                                onChange={handleChangeDetail}
                                disabled={!isEditing && addOneButtonEnabled}
                                multiline
                                rows={2}
                              />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                              <label>Loading By Us</label>
                              <input
                                type="checkbox"
                                id="loding_by_us"
                                Name="loding_by_us"
                                checked={formDataDetail.loding_by_us === "Y"}
                                onChange={(e) => handleCheckbox(e, "string")}
                                disabled={!isEditing && addOneButtonEnabled}
                              />
                            </Grid>


                          </Grid>
                          <Grid container spacing={2} mt={1}>
                            <Grid item xs={12} sm={1}>
                              <TextField
                                label="GST Rate"
                                fullWidth
                                size="small"
                                name="gst_rate"
                                autoComplete="off"
                                value={
                                  formDataDetail.gst_rate || gstCode || gstRateCode
                                }
                                onChange={(e) => {
                                  validateNumericInput(e);
                                  handleChangeDetail(e);
                                }}
                                disabled={!isEditing && addOneButtonEnabled}
                              />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="GST Amount"
                                fullWidth
                                size="small"
                                name="gst_amt"
                                autoComplete="off"
                                value={
                                  calculatedValues.gstAmtDetail ||
                                  (formDataDetail.Buyer_Quantal *
                                    formDataDetail.Sale_Rate *
                                    gstCode) /
                                  100
                                }
                                onChange={(e) => {
                                  validateNumericInput(e);
                                  handleChangeDetail(e);
                                }}
                                disabled={!isEditing && addOneButtonEnabled}
                              />
                            </Grid>
                            <Grid item xs={12} sm={1}>
                              <TextField
                                label="TCS Rate"
                                fullWidth
                                size="small"
                                name="tcs_rate"
                                autoComplete="off"
                                value={
                                  formDataDetail.tcs_rate || formData.TCS_Rate || ""
                                }
                                onChange={(e) => {
                                  handleChangeDetail(e);
                                }}
                                onKeyDown={TCSCalculationDetail}
                                disabled={!isEditing && addOneButtonEnabled}
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="TCS Amount"
                                fullWidth
                                size="small"
                                name="tcs_amt"
                                autoComplete="off"
                                value={formDataDetail.tcs_amt}
                                onChange={(e) => {
                                  handleChangeDetail(e);
                                }}
                                disabled={!isEditing && addOneButtonEnabled}
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Net Amount"
                                fullWidth
                                size="small"
                                value={calculatedValues.lblNetAmount}
                                disabled
                              />
                            </Grid>
                          </Grid>
                        </form>
                      </div>

                    </form>
                  </div>
                  <div className="TenderPurchase-custom-modal-footer">
                    {selectedUser.id ? (
                      <DetailUpdateButton updateUser={updateUser} />
                    ) : (
                      <DetailAddButtom addUser={addUser} />
                    )}
                    <DetailCloseButton closePopup={closePopup} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <br></br>
          <TableContainer component={Paper} sx={{ margin: '-18px', marginBottom: "20px" }}  >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellStyle}>Actions</TableCell>
                  <TableCell sx={headerCellStyle}>ID</TableCell>
                  <TableCell sx={headerCellStyle}>Party</TableCell>
                  <TableCell sx={headerCellStyle}>Party Name</TableCell>
                  <TableCell sx={headerCellStyle}>Broker Name</TableCell>
                  <TableCell sx={headerCellStyle}>ShipTo Name</TableCell>
                  <TableCell sx={headerCellStyle}>Quintal</TableCell>
                  <TableCell sx={headerCellStyle}>Sale Rate</TableCell>
                  <TableCell sx={headerCellStyle}>Commission</TableCell>
                  <TableCell sx={headerCellStyle}>Sauda Date</TableCell>
                  <TableCell sx={headerCellStyle}>Sauda Narration</TableCell>
                  <TableCell sx={headerCellStyle}>Delivery Type</TableCell>
                  <TableCell sx={headerCellStyle}>Dispatched</TableCell>
                  <TableCell sx={headerCellStyle}>Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        {(user.rowaction === "add" ||
                          user.rowaction === "update" ||
                          user.rowaction === "Normal") && (
                            <>
                              <EditButton
                                editUser={editUser}
                                user={user}
                                isEditing={isEditing}
                                disabled={!isEditing || index === 0}
                              />
                              <DeleteButton
                                deleteModeHandler={deleteModeHandler}
                                user={user}
                                isEditing={isEditing}
                                disabled={!isEditing || index === 0}
                              />
                            </>
                          )}
                        {(user.rowaction === "DNU" ||
                          user.rowaction === "delete") && (
                            <OpenButton openDelete={openDelete} user={user} />
                          )}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>{user.id}</TableCell>
                    <TableCell sx={{ padding: '2px 4px', textAlign: 'left', fontSize: '12px' }}>{user.Buyer}</TableCell>
                    <TableCell sx={{ padding: '2px 4px', textAlign: 'left', fontSize: '12px' }}>{user.billtoName}</TableCell>
                    <TableCell sx={{ padding: '2px 4px', textAlign: 'left', fontSize: '12px' }}>{user.buyerPartyName}</TableCell>
                    <TableCell sx={{ padding: '2px 4px', textAlign: 'left', fontSize: '12px' }}>{user.shiptoName}</TableCell>
                    <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>{user.Buyer_Quantal}</TableCell>
                    <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>{user.Sale_Rate}</TableCell>
                    <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>{user.Commission_Rate}</TableCell>
                    <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>{user.Sauda_Date}</TableCell>
                    <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>{user.Narration}</TableCell>
                    <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>{user.Delivery_Type || dispatchType}</TableCell>
                    <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>{user.despatched}</TableCell>
                    <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>{user.balance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </form>
    </>
  );
};
export default TenderPurchase;
