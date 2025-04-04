import React from "react";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import axios from "axios";
import {
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton
} from "@mui/material";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import RecieptVoucherNoHelp from "../../../Helper/RecieptVoucherNoHelp";
import GroupMasterHelp from "../../../Helper/SystemmasterHelp";
import "./RecieptPayment.css";
import { useRecordLocking } from "../../../hooks/useRecordLocking";
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import AddButton from "../../../Common/Buttons/AddButton";
import EditButton from "../../../Common/Buttons/EditButton";
import DeleteButton from "../../../Common/Buttons/DeleteButton";
import OpenButton from "../../../Common/Buttons/OpenButton";
import DetailAddButtom from "../../../Common/Buttons/DetailAddButton";
import DetailCloseButton from "../../../Common/Buttons/DetailCloseButton";
import DetailUpdateButton from "../../../Common/Buttons/DetailUpdateButton";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import RecieptPaymentReport from "./RecieptPaymentReport";
import Swal from "sweetalert2";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import SaveUpdateSpinner from "../../../Common/Spinners/SaveUpdateSpinner";

const API_URL = process.env.REACT_APP_API;

var lblbankname;
var newcashbank;
var newcredit_ac;
var lblacname;
var newUnitCode;
var lblUnitname;
var newAcadjAccode;
var lblAcadjAccodename;
var newVoucher_No;
var globalTotalAmount = 0.0;
var GroupCode = ""
var GroupName = ""

//Common table Heading style
const headerCellStyle = {
  fontWeight: "bold",
  backgroundColor: "#3f51b5",
  color: "white",
  padding: "6px",
  "&:hover": {
    backgroundColor: "#303f9f",
    cursor: "pointer",
  },
};

const RecieptPayment = () => {
  //GET Values from session
  const companyCode = sessionStorage.getItem("Company_Code");
  const YearCode = sessionStorage.getItem("Year_Code");
  const username = sessionStorage.getItem("username");

  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMode, setPopupMode] = useState("add");
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
  const [cashbankcode, setcashbankcode] = useState("");
  const [cashbankcodeid, setcashbankcodeid] = useState("");
  const [Creditcodecode, setCreditcodecode] = useState("");
  const [Creditcodecodeid, setCreditcodecodeid] = useState("");
  const [Creditcodecodename, setCreditcodecodename] = useState("");

  const [unitcodestate, setunitcodestate] = useState("");
  const [unitcodestateid, setunitcodestateid] = useState("");
  const [unitcodestatename, setunitcodestatename] = useState("");

  const [AcadjAccodenamecode, setAcadjAccodenamecode] = useState("");
  const [AcadjAccodenameid, setAcadjAccodenameid] = useState("");
  const [AcadjAccodenamename, setAcadjAccodenamename] = useState("");

  const [groupCode, setGroupCode] = useState('');
  const [gcId, setGCID] = useState('');
  const [groupName, setGroupName] = useState('');

  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState({});
  const [users, setUsers] = useState([]);
  let [TyanTypeState, setTyanTypeState] = useState("");
  const [secondSelectOptions, setSecondSelectOptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("BR");
  const [VoucherNoState, setVoucherNoState] = useState("");
  const [tenderDetails, setTenderDetails] = useState({});
  const [lastTenderDetails, setLastTenderDetails] = useState([]);
  const [lastTenderData, setLastTenderData] = useState({});

  const inputRef = useRef(null);

  const addButtonRef = useRef(null);
  const firstInputRef = useRef(null);

  const [amountInWords, setAmountInWords] = useState('');

  //SET focus to first input feild
  const setFocusToFirstField = () => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
      setAmountInWords('')
    }
  };

  //Navigation state
  const navigate = useNavigate();
  const location = useLocation();

  //Record Double Click
  const selectedRecord = location.state?.selectedRecord;
  const tranType = location.state?.tranType;
  const permissions = location.state?.permissionsData;

  const searchParams = new URLSearchParams(location.search);
  const navigatedRecord = searchParams.get('navigatedRecord');
  const navigatedTranType = searchParams.get('navigatedTranType');


  const options = {
    CP: [
      { value: "A", text: "--Select--" },
      { value: "T", text: "Against Transport Advance" },
      { value: "N", text: "Against Manualy Purchase" },
      { value: "O", text: "Against OnAc" },
      { value: "Z", text: "Advance Payment" },
      { value: "Q", text: "Other Payment" },
    ],
    BP: [
      { value: "A", text: "--Select--" },
      { value: "T", text: "Against Transport Advance" },
      { value: "N", text: "Against Manualy Purchase" },
      { value: "O", text: "Against OnAc" },
      { value: "Z", text: "Advance Payment" },
      { value: "Q", text: "Other Payment" },
    ],
    CR: [
      { value: "X", text: "Against RetailSale Bill" },
      { value: "Y", text: "Against SaleBill" },
      { value: "Q", text: "Other Payment" },
    ],
    BR: [
      { value: "S", text: "Against Sauda" },
      { value: "B", text: "Against SaleBill" },
      { value: "D", text: "Against Debit Note" },
      { value: "P", text: "Against Credit Bill" },
      { value: "O", text: "Against OnAc" },
      { value: "R", text: "OAgainst RetailSale Bill" },
      { value: "Q", text: "Other Payment" },
    ],
  };

  const validateNumericInput = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.-]/g, "");
  };

  const initialFormData = {
    tran_type: tranType ? tranType : "CP",
    doc_no: "",
    doc_date: new Date().toISOString().split("T")[0],
    cashbank: 0,
    total: 0,
    company_code: companyCode,
    year_code: YearCode,
    cb: 0,
    Created_By: "",
    Modified_By: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const [formDataDetail, setFormDataDetail] = useState({
    amount: 0,
    narration: "",
    narration2: "",
    detail_id: 1,
    Voucher_No: 0,
    Voucher_Type: "",
    Adjusted_Amount: 0.0,
    Tender_No: 0,
    drpFilterValue: "O",
    AcadjAmt: 0.0,
    TDS_Rate: 0.0,
    TDS_Amt: 0.0,
    GRN: "",
    TReceipt: "",
  });

  //record lock-unlock
  const { isRecordLockedByUser, lockRecord, unlockRecord } = useRecordLocking(
    formData.doc_no,
    formData.tran_type,
    companyCode,
    YearCode,
    "receipt_payment"
  );

  //state management for user input
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => {
      const updatedFormData = { ...prevState, [name]: value };
      return updatedFormData;
    });
  };

  const handleCashBank = (code, accoid) => {
    setcashbankcode(code);
    setcashbankcodeid(accoid);
    setFormData({
      ...formData,
      cashbank: code,
      cb: accoid,
    });
  };

  const handleAcadjAccodename = (code, accoid, name) => {
    setAcadjAccodenamecode(code);
    setAcadjAccodenameid(accoid);
    setAcadjAccodenamename(name);
  };

  const handleUnitCode = (code, accoid, name) => {
    setunitcodestate(code);
    setunitcodestateid(accoid);
    setunitcodestatename(name);
  };

  const handleAccode = (code, accoid, name) => {
    setCreditcodecode(code);
    setCreditcodecodeid(accoid);
    setCreditcodecodename(name);
  };

  const handleGroupCode = (code, accoid, HSN, name) => {
    setGroupCode(code);
    setGCID(accoid);
    setGroupName(name)
  };

  const handleDropdownvalueChange = (event) => {
    const { name, value } = event.target;
    setFormDataDetail((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  //GET Last record from the database
  const fetchLastRecord = () => {
    fetch(
      `${API_URL}/get_next_paymentRecord_docNo?Company_Code=${companyCode}&tran_type=${formData.tran_type || tranType
      }&Year_Code=${YearCode}`
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


  const handleDetailDropdownChange = (selectedValue) => {
    updateSecondSelect(selectedValue);
  };

  const updateSecondSelect = (selectedValue) => {
    setSelectedCategory(selectedValue);
    setSecondSelectOptions(options[selectedValue] || []);
  };

  const handleDropdownChange = async (event) => {
    const selectedValue = event.target.value;

    setTyanTypeState(selectedValue);
    setFormData((prevData) => ({
      ...prevData,
      tran_type: selectedValue,
    }));

    const url = `${API_URL}/get-lastreceiptpayment-navigation?Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${selectedValue}`;
    await handleNavigation(url, "last_head_data", "last_details_data");
  };

  const handleAddOne = async () => {
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);
    fetchLastRecord();
    setFormData(initialFormData);
    setLastTenderDetails([]);
    globalTotalAmount = "";
    lblbankname = "";
    newcashbank = "";
    newcredit_ac = "";
    lblacname = "";
    newUnitCode = "";
    lblUnitname = "";
    newAcadjAccode = "";
    lblAcadjAccodename = "";
    setCreditcodecodename("");
    GroupName = "";
    GroupCode = "";
    const effectiveTranType = tranType || TyanTypeState || formData.tran_type;
    setFormData((prevData) => ({
      ...prevData,
      tran_type: effectiveTranType
    }));
    handleDetailDropdownChange(effectiveTranType);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  //Handle Save Or Update the information
  const handleSaveOrUpdate = async () => {
    if (formData.cashbank === "" || formData.cashbank === 0) {
      await Swal.fire({
        title: "Error",
        text: "Please select Cash/Bank",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    // Check if there are any valid entries in the detail grid
    if (users.length === 0 || users.every(user => user.rowaction === "DNU" || user.rowaction === "delete")) {
      await Swal.fire({
        title: "Error",
        text: "Please add at least one entry in the detail grid.",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    setIsLoading(true);
    try {
      let head_data = { ...formData };
      if (isEditMode) {
        head_data = {
          ...head_data,
          Modified_By: username,
        };
      } else {
        head_data = {
          ...head_data,
          Created_By: username,
        };
      }
      const detail_data = users.map((user) => ({
        rowaction: user.rowaction,
        detail_id: user.detail_id,
        credit_ac: user.credit_ac,
        Unit_Code: user.Unit_Code,
        Voucher_No: user.Voucher_No,
        Voucher_Type: user.Voucher_Type,
        Tender_No: user.Tender_No,
        tenderdetailid: user.tenderdetailid,
        amount: user.amount,
        Adjusted_Amount: user.Adjusted_Amount,
        narration: user.narration,
        narration2: user.narration2,
        drpFilterValue: user.drpFilterValue,
        YearCodeDetail: user.YearCodeDetail,
        trandetailid: user.trandetailid,
        AcadjAmt: user.AcadjAmt || 0,
        Group_Code: user.Group_Code,
        AcadjAccode: user.AcadjAccode,
        ca: user.ca,
        uc: user.uc,
        ac: user.ac,
        gcid: user.gcid,
        TDS_Rate: user.TDS_Rate || 0,
        TDS_Amt: user.TDS_Amt || 0,
        GRN: user.GRN,
        TReceipt: user.TReceipt,
        Company_Code: companyCode,
        Year_Code: YearCode,
      }));

      const requestData = {
        head_data: {
          ...head_data,
          tranid: isEditMode ? undefined : head_data.tranid,
        },
        detail_data,
      };

      const apiUrl = isEditMode
        ? `${API_URL}/update-receiptpayment?tranid=${formData.tranid}`
        : `${API_URL}/insert-receiptpayment`;

      const response = await axios[isEditMode ? "put" : "post"](
        apiUrl,
        requestData
      );

      if (response.status === 200 || response.status === 201) {
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
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error("Error saving or updating data:", error);
      toast.error("An error occurred while saving or updating data.");
    } finally {
      setIsLoading(false);
    }
  };


  //Handle Edit the information
  const handleEdit = async () => {
    axios
      .get(
        `${API_URL}/getreceiptpaymentByid?Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${formData.tran_type}&doc_no=${formData.doc_no}`
      )
      .then((response) => {
        const data = response.data;
        const isLockedNew = data.receipt_payment_head.LockedRecord;
        const isLockedByUserNew = data.receipt_payment_head.LockedUser;
        if (isLockedNew) {
          Swal.fire({
            icon: "warning",
            title: "Record Locked",
            text: `This record is locked by ${isLockedByUserNew}`,
            confirmButtonColor: "#d33",
          });
          return;
        } else {
          lockRecord();
        }
        setFormData({
          ...formData,
          ...data.receipt_payment_head,
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
        console.error(error);
      });
  };

  //Handle Cancel the information
  const handleCancel = async () => {
    const url = `${API_URL}/get-lastreceiptpayment-navigation?Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${formData.tran_type || tranType
      }`;
    await handleNavigation(url, "last_head_data", "last_details_data");
    unlockRecord();
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

  //Handle Delete the information
  const handleDelete = async () => {
    try {
      const response = await axios.get(`${API_URL}/getreceiptpaymentByid`, {
        params: {
          Company_Code: companyCode,
          Year_Code: YearCode,
          tran_type: formData.tran_type,
          doc_no: formData.doc_no,
        },
      });
      const data = response.data;
      const isLockedNew = data.receipt_payment_head.LockedRecord;
      const isLockedByUserNew = data.receipt_payment_head.LockedUser;

      if (isLockedNew) {
        Swal.fire({
          icon: "warning",
          title: "Record Locked",
          text: `This record is locked by ${isLockedByUserNew}`,
          confirmButtonColor: "#d33",
        });
        return;
      }

      const result = await Swal.fire({
        title: "Are you sure?",
        text: `You won't be able to revert this Doc No : ${formData.doc_no}`,
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
          const deleteApiUrl = `${API_URL}/delete_data_by_tranid`;
          const deleteResponse = await axios.delete(deleteApiUrl, {
            params: {
              tranid: formData.tranid,
              company_code: companyCode,
              year_code: YearCode,
              doc_no: formData.doc_no,
              Tran_Type: formData.tran_type || tranType,
            },
          });
          toast.success("Record deleted successfully!");
          handleCancel();
        } catch (error) {
          toast.error("Deletion failed.");
          console.error("Error during API call:", error);
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
    } catch (error) {
      toast.error("Error fetching data.");
    }
  };

  //hand back to Dashboard
  const handleBack = () => {
    navigate("/RecieptPaymentUtility");
  };

  useEffect(() => {
    if (selectedRecord) {
      handleRecordDoubleClicked();
    }
    else if (navigatedRecord && !isNaN(navigatedRecord) && parseInt(navigatedRecord) > 0) {
      handleNavigateRecord();
    }
    else {
      handleAddOne();
    }
  }, [selectedRecord, navigatedRecord]);

  //Handle Calculations
  const handleKeyDownCalculations = (e) => {
    if (e.key === "Tab") {
      const { amount = 0, Adjusted_Amount = 0, TDS_Rate = 0 } = formDataDetail;

      const adjustedValue = parseFloat(Adjusted_Amount) || 0;
      const NewAmount = parseFloat(amount) || 0;

      const TDSApplicableAmount = NewAmount + adjustedValue;
      const NewTDSAmount = (TDSApplicableAmount * TDS_Rate) / 100;

      setFormDataDetail((prevData) => ({
        ...prevData,
        TDS_Amt: parseFloat(NewTDSAmount),
      }));
    }
  };

  useEffect(() => {
    if (selectedRecord) {
      setUsers(
        lastTenderDetails.map((detail) => ({
          rowaction: "Normal",
          Company_Code: companyCode,
          Year_Code: YearCode,
          Tran_Type: TyanTypeState || tranType,
          credit_ac: detail.credit_ac,
          Creditcodecodename: detail.Creditcodecodename,
          Unit_Code: detail.Unit_Code,
          unitcodestatename: detail.unitcodestatename,
          Group_Code: detail.Group_Code,
          groupName: detail.groupName,
          amount: detail.amount,
          narration: detail.narration,
          narration2: detail.narration2,
          detail_id: detail.detail_id,
          Voucher_No: detail.Voucher_No,
          Voucher_Type: detail.Voucher_Type,
          Adjusted_Amount: detail.Adjusted_Amount,
          Tender_No: detail.Tender_No,
          TenderDetail_ID: detail.TenderDetail_ID,
          drpFilterValue: detail.drpFilterValue,
          ca: detail.ca,
          uc: detail.uc,
          gcid: detail.gcid,
          tenderdetailid: detail.tenderdetailid,
          AcadjAccode: detail.AcadjAccode,
          AcadjAccodenamename: detail.AcadjAccodenamename,
          AcadjAmt: detail.AcadjAmt,
          ac: detail.ac,
          TDS_Rate: detail.TDS_Rate,
          TDS_Amt: detail.TDS_Amt,
          GRN: detail.GRN,
          TReceipt: detail.TReceipt,
          trandetailid: detail.trandetailid,
          id: detail.trandetailid,
        }))
      );
    }
  }, [selectedRecord, lastTenderDetails]);

  useEffect(() => {
    setUsers(
      lastTenderDetails.map((detail) => ({
        rowaction: "Normal",
        Company_Code: companyCode,
        Year_Code: YearCode,
        Tran_Type: TyanTypeState || tranType,
        credit_ac: detail.credit_ac,
        Creditcodecodename: detail.creditacname,
        Unit_Code: detail.Unit_Code,
        unitcodestatename: detail.unitacname,
        Group_Code: detail.Group_Code,
        groupName: detail.System_Name_E,
        amount: detail.amount,
        narration: detail.narration,
        narration2: detail.narration2,
        detail_id: detail.detail_id,
        Voucher_No: detail.Voucher_No,
        Voucher_Type: detail.Voucher_Type,
        Adjusted_Amount: detail.Adjusted_Amount,
        Tender_No: detail.Tender_No,
        TenderDetail_ID: detail.TenderDetail_ID,
        drpFilterValue: detail.drpFilterValue,
        ca: detail.ca,
        uc: detail.uc,
        gcid: detail.gcid,
        tenderdetailid: detail.tenderdetailid,
        AcadjAccode: detail.AcadjAccode,
        AcadjAccodenamename: detail.adjustedacname,
        AcadjAmt: detail.AcadjAmt,
        ac: detail.ac,
        TDS_Rate: detail.TDS_Rate,
        TDS_Amt: detail.TDS_Amt,
        GRN: detail.GRN,
        TReceipt: detail.TReceipt,
        trandetailid: detail.trandetailid,
        id: detail.trandetailid,
      }))
    );
  }, [lastTenderDetails]);

  const handleNavigation = async (url, headKey, detailsKey) => {
    try {
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        const { labels, [headKey]: headData, [detailsKey]: detailsData } = data;

        const DetailsArray = Array.isArray(detailsData) ? detailsData : [];

        lblbankname = labels[0]?.cashbankname || "";
        newcashbank = headData?.cashbank || "";
        lblAcadjAccodename = labels[0]?.adjustedacname || "";
        newAcadjAccode = headData?.AcadjAccode || "";
        lblUnitname = labels[0]?.unitacname || "";
        newUnitCode = headData?.Unit_Code || "";
        lblacname = labels[0]?.creditacname || "";
        newcredit_ac = headData?.credit_ac || "";
        GroupCode = headData?.Group_Code || "";
        GroupName = labels[0]?.System_Name_E;

        const itemNameMap = labels.reduce((map, label) => {
          if (label.credit_ac !== undefined && label.creditacname) {
            map[label.credit_ac] = label.creditacname;
            map[label.Unit_Code] = label.unitacname;
            map[label.AcadjAccode] = label.adjustedacname;
            map[label.cashAc] = label.cashbankname;
            map[label.Group_Code] = label.System_Name_E;
          }
          return map;
        }, {});

        const enrichedDetails = DetailsArray.map((detail) => ({
          ...detail,
          creditacname: itemNameMap[detail.credit_ac] || "",
          unitacname: itemNameMap[detail.Unit_Code] || "",
          adjustedacname: itemNameMap[detail.AcadjAccode] || "",
          cashbankname: itemNameMap[detail.cashAc] || "",
          System_Name_E: itemNameMap[detail.Group_Code] || "",
        }));

        const totalItemAmount = enrichedDetails.reduce(
          (total, user) => total + parseFloat(user.amount),
          0
        );
        globalTotalAmount = totalItemAmount.toFixed(2);

        setFormData((prevData) => ({
          ...prevData,
          ...headData,
          total: globalTotalAmount,
        }));

        setLastTenderData(headData || {});
        setLastTenderDetails(enrichedDetails);
      } else {
        console.error(
          `Failed to fetch data: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  // Function to handle the double-click action
  const handleRecordDoubleClicked = async () => {
    setIsEditing(false);
    setIsEditMode(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setCancelButtonClicked(true);

    const url = `${API_URL}/getreceiptpaymentByid?Company_Code=${companyCode}&tranid=${selectedRecord.tranid}&tran_type=${selectedRecord.tran_type}&doc_no=${selectedRecord.doc_no}&Year_Code=${YearCode}`;

    await handleNavigation(
      url,
      "receipt_payment_head",
      "receipt_payment_details"
    );
  };

  // Navigation Button Handlers
  const handleFirstButtonClick = async () => {
    const url = `${API_URL}/get-firstreceiptpayment-navigation?Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${formData.tran_type}`;
    await handleNavigation(url, "first_head_data", "first_details_data");
  };

  const handlePreviousButtonClick = async () => {
    const url = `${API_URL}/get-previousreceiptpayment-navigation?currentDocNo=${formData.doc_no}&Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${formData.tran_type}`;
    await handleNavigation(url, "previous_head_data", "previous_details_data");
  };

  const handleNextButtonClick = async () => {
    const url = `${API_URL}/get-nextreceiptpayment-navigation?currentDocNo=${formData.doc_no}&Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${formData.tran_type}`;
    await handleNavigation(url, "next_head_data", "next_details_data");
  };

  const handleLastButtonClick = async () => {
    const url = `${API_URL}/get-lastreceiptpayment-navigation?Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${formData.tran_type}`;
    await handleNavigation(url, "last_head_data", "last_details_data");
  };

  // Tab Key Down Handler
  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      const url = `${API_URL}/getreceiptpaymentByid?Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${formData.tran_type}&doc_no=${changeNoValue}`;

      await handleNavigation(
        url,
        "receipt_payment_head",
        "receipt_payment_details"
      );
    }
  };

  const handleNavigateRecord = async () => {
    const url = `${API_URL}/getreceiptpaymentByid?Company_Code=${companyCode}&Year_Code=${YearCode}&tran_type=${navigatedTranType}&doc_no=${navigatedRecord}`;
    await handleNavigation(
      url,
      "receipt_payment_head",
      "receipt_payment_details"
    );
    setIsEditing(false);
    setIsEditMode(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setCancelButtonClicked(true);
  }


  //Detail Part
  //declaring details function
  const handleChangeDetail = (event) => {
    const { name, value } = event.target;
    let updatedFormDataDetail = { ...formDataDetail, [name]: value };

    if (name === 'amount') {
      const convertedAmountInWords = ConvertNumberToWord(value);
      setAmountInWords(convertedAmountInWords);
    }

    setFormDataDetail(updatedFormDataDetail);
  };


  const openPopup = (mode) => {
    setShowPopup(true);
    const selectedValue = formData.tran_type || tranType;

    handleDetailDropdownChange(selectedValue);
    if (mode === "add") {
      clearForm();
    }
  };

  const clearForm = () => {
    setFormDataDetail({
      amount: 0,
      narration: "",
      narration2: null,
      detail_id: 1,
      Voucher_No: null,
      Voucher_Type: "",
      Adjusted_Amount: 0.0,
      Tender_No: 0,
      TenderDetail_ID: 0,
      drpFilterValue: "O",
      tenderdetailid: 0,
      AcadjAmt: 0.0,
      TDS_Rate: 0.0,
      TDS_Amt: 0.0,
      GRN: "",
      TReceipt: "",
    });
    setAcadjAccodenamecode("");
    setCreditcodecode("");
    setunitcodestate("");
    setAcadjAccodenamename("");
    setCreditcodecodename("");
    setunitcodestatename("");
    setGroupCode("")
    setGroupName("")
  };

  const deleteModeHandler = async (userToDelete) => {
    let updatedUsers;
    const amountToDeduct = parseFloat(userToDelete.amount || 0);

    if (isEditMode && userToDelete.rowaction === "add") {
      setDeleteMode(true);
      setSelectedUser(userToDelete);
      updatedUsers = users.map((u) =>
        u.id === userToDelete.id ? { ...u, rowaction: "DNU" } : u
      );
    } else if (isEditMode) {
      setDeleteMode(true);
      setSelectedUser(userToDelete);
      updatedUsers = users.map((u) =>
        u.id === userToDelete.id ? { ...u, rowaction: "delete" } : u
      );
    } else {
      setDeleteMode(true);
      setSelectedUser(userToDelete);
      updatedUsers = users.map((u) =>
        u.id === userToDelete.id ? { ...u, rowaction: "DNU" } : u
      );
    }

    setFormData((prevData) => ({
      ...prevData,
      total: (parseFloat(prevData.total || 0) - amountToDeduct).toFixed(2),
    }));

    setUsers(updatedUsers);
    setSelectedUser({});
  };

  //close popup function
  const closePopup = () => {
    setShowPopup(false);
    setSelectedUser({});
    clearForm();
    setAmountInWords('')
  };

  const handleRecieptvoucher = (Tenderno) => {
    setVoucherNoState(Tenderno);
    setFormDataDetail({
      ...formDataDetail,
      Voucher_No: Tenderno,
    });
  };

  const handleTenderDetailsFetched = (details) => {
    setTenderDetails(details.last_details_data[0]);
    const newData = {
      Voucher_Type: details.last_details_data[0].Tran_Type,
      tenderdetailid: details.last_details_data[0].autoId,
      narration: details.last_details_data[0].Narration,
      YearCodeDetail: details.last_details_data[0].EntryYearCode,
    };

    setFormDataDetail((prevState) => ({
      ...prevState,
      ...newData,
      Tran_Type: TyanTypeState || tranType,
      debit_ac: formData.cashbank,
      da: formData.ca,
    }));

    return newData;
  };
  const updateUser = async () => {
    if (formDataDetail.amount === "0" || formDataDetail.amount === "") {
      await Swal.fire({
        title: "Error",
        text: "Please Enter Amount.!",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }
    addButtonRef.current.focus();

    const updatedUsers = users.map((user) => {

      if (user.id === selectedUser.id) {

        const updatedRowaction =
          user.rowaction === "Normal" ? "update" : user.rowaction;

        return {
          ...user,
          credit_ac: Creditcodecode,
          Creditcodecodename: Creditcodecodename,
          ca: Creditcodecodeid,
          AcadjAccode: AcadjAccodenamecode,
          AcadjAccodenamename: AcadjAccodenamename,
          ac: AcadjAccodenameid,
          Unit_Code: unitcodestate,
          unitcodestatename: unitcodestatename,
          uc: unitcodestateid,
          Group_Code: groupCode,
          gcid: gcId,
          amount: formDataDetail.amount,
          narration: formDataDetail.narration,
          narration2: formDataDetail.narration2,
          detail_id: user.detail_id,
          Voucher_No: user.Voucher_No,
          Voucher_Type: user.Voucher_Type,
          Adjusted_Amount: user.Adjusted_Amount,
          Tender_No: user.Tender_No,
          TenderDetail_ID: user.TenderDetail_ID,
          drpFilterValue: user.drpFilterValue,
          tenderdetailid: user.tenderdetailid,
          AcadjAccode: AcadjAccodenamecode,
          AcadjAmt: formDataDetail.AcadjAmt,
          TDS_Rate: formDataDetail.TDS_Rate,
          TDS_Amt: user.TDS_Amt,
          GRN: formDataDetail.GRN,
          TReceipt: user.TReceipt,
          rowaction: updatedRowaction,
        };
      } else {
        return user;
      }

    });

    setUsers(updatedUsers);

    const totalItemAmount = updatedUsers.reduce((total, user) => {
      return total + parseFloat(user.amount);
    }, 0);
    globalTotalAmount = totalItemAmount.toFixed(2);
    setFormData((prevData) => ({
      ...prevData,
      total: globalTotalAmount,
    }));

    closePopup();
  };

  const addUser = async () => {

    if (formDataDetail.amount === 0) {
      await Swal.fire({
        title: "Error",
        text: "Please Enter Amount",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }
    const nextUserId =
      users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1;

    const maxDetailId =
      users.length > 0
        ? Math.max(...users.map((user) => user.detail_id)) + 1
        : 1;
    const newUser = {
      id: nextUserId,
      credit_ac: Creditcodecode,
      Creditcodecodename: Creditcodecodename,
      ca: Creditcodecodeid,
      Unit_Code: unitcodestate,
      unitcodestatename: unitcodestatename,
      uc: unitcodestateid,
      AcadjAccode: AcadjAccodenamecode,
      AcadjAccodenamename: AcadjAccodenamename,
      Group_Code: groupCode,
      gcid: gcId,
      groupName: groupName,
      ac: AcadjAccodenameid,
      ...formDataDetail,
      detail_id: maxDetailId,
      Voucher_No: tenderDetails.doc_no || newVoucher_No || "",

      rowaction: "add",
    };
    const newUsers = [...users, newUser];
    setUsers(newUsers);
    const totalItemAmount = newUsers
      .filter((user) => user.rowaction !== "delete" && user.rowaction !== "DNU")
      .reduce((total, user) => total + parseFloat(user.amount || 0), 0);
    globalTotalAmount = totalItemAmount.toFixed(2);
    setFormData((prevData) => ({
      ...prevData,

      total: globalTotalAmount,
    }));
    closePopup();
    addButtonRef.current.focus();
  };

  const editUser = (user) => {
    setSelectedUser(user);
    setCreditcodecode(user.credit_ac);
    setCreditcodecodename(user.Creditcodecodename);
    setCreditcodecodeid(user.ca);
    setAcadjAccodenamecode(user.AcadjAccode);
    setAcadjAccodenamename(user.AcadjAccodenamename);
    setAcadjAccodenameid(user.ac);
    setunitcodestate(user.Unit_Code);
    setunitcodestatename(user.unitcodestatename);
    setunitcodestateid(user.uc);
    setGroupCode(user.Group_Code);
    setGCID(user.gcid);
    setGroupName(user.groupName);
    setFormDataDetail({
      amount: user.amount || "",
      narration: user.narration || "",
      narration2: user.narration2 || "",
      detail_id: user.trandetailid,
      Voucher_No: user.Voucher_No || "",
      Voucher_Type: user.Voucher_Type || "",
      Adjusted_Amount: user.Adjusted_Amount || 0.0,
      Tender_No: user.Tender_No || "",
      TenderDetail_ID: user.TenderDetail_ID || "",
      drpFilterValue: user.drpFilterValue || "",
      AcadjAmt: user.AcadjAmt || "",
      TDS_Rate: user.TDS_Rate || "",
      TDS_Amt: user.TDS_Amt || "",
      GRN: user.GRN || "",
      TReceipt: user.TReceipt || "",
    });
    setVoucherNoState(user.Voucher_No);
    openPopup("edit");

    let amount = ConvertNumberToWord(user.amount)
    setAmountInWords(amount)
  };
  const openDelete = async (user) => {
    let updatedUsers;
    const amountToAdd = parseFloat(user.amount || 0);
    setDeleteMode(true);
    setSelectedUser(user);
    if (isEditMode && user.rowaction === "delete") {
      updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, rowaction: "Normal" } : u
      );
    } else {
      updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, rowaction: "add" } : u
      );
    }
    setFormData((prevData) => ({
      ...prevData,
      total: (parseFloat(prevData.total || 0) + amountToAdd).toFixed(2),
    }));
    setFormDataDetail({
      ...formDataDetail,
    });
    setUsers(updatedUsers);
    setSelectedUser({});
  };

  return (
    <>
      <UserAuditInfo
        createdBy={formData.Created_By}
        modifiedBy={formData.Modified_By}
        title={"Receipt Payment"}
      />
      <div>
        <ToastContainer autoClose={500} />
        <br></br>
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
          component={<RecieptPaymentReport doc_no={formData.doc_no} Tran_Type={formData.tran_type} disabledFeild={!addOneButtonEnabled} />}
        />

        <div>
          <NavigationButtons
            handleFirstButtonClick={handleFirstButtonClick}
            handlePreviousButtonClick={handlePreviousButtonClick}
            handleNextButtonClick={handleNextButtonClick}
            handleLastButtonClick={handleLastButtonClick}
            highlightedButton={highlightedButton}
            isEditing={isEditing}
            isFirstRecord={formData.Company_Code === 1}
          />
        </div>
      </div>
      <div>
        <br></br>
        <form>
          <Grid
            container
            spacing={2}
            alignItems="center"
            sx={{ justifyContent: "flex-start" }}
          >
            <Grid item xs={12} sm={1} sx={{ textAlign: "left" }}>
              <TextField
                label="Change No"
                id="changeNo"
                name="changeNo"
                autoComplete="off"
                onKeyDown={handleKeyDown}
                disabled={!addOneButtonEnabled}
                size="small"
                InputLabelProps={{
                  shrink: true,
                  style: { fontWeight: 'bold' },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={1.2}>
              <FormControl fullWidth>
                <InputLabel id="tran_type_label">Tran Type</InputLabel>
                <Select
                  labelId="tran_type_label"
                  id="tran_type"
                  name="tran_type"
                  value={formData.tran_type}
                  onChange={handleDropdownChange}
                  disabled={!addOneButtonEnabled}
                  size="small"
                  InputLabelProps={{
                    style: { fontWeight: 'bold' },
                  }}
                >
                  <MenuItem value="BR">Bank Receipt</MenuItem>
                  <MenuItem value="BP">Bank Payment</MenuItem>
                  <MenuItem value="CR">Cash Receipt</MenuItem>
                  <MenuItem value="CP">Cash Payment</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={0.8}>
              <TextField
                label="Doc No"
                id="doc_no"
                name="doc_no"
                value={formData.doc_no}
                onChange={handleChange}
                disabled={true}
                fullWidth
                size="small"
                InputLabelProps={{
                  style: { fontWeight: 'bold' },
                }}
              
                InputProps={{
                  style: { fontSize: '12px', height: '35px' },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={1} sx={{ padding: 0.5, minWidth: '100px', maxWidth: '100px' }}>
              <TextField
                label="Doc Date"
                id="doc_date"
                name="doc_date"
                type="date"
                value={formData.doc_date}
                inputRef={inputRef}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                fullWidth
                InputLabelProps={{
                  style: { fontSize: '12px' },
                }}
                InputProps={{
                  style: { fontSize: '12px', height: '35px' },
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel shrink style={{ fontWeight: 'bold' }}>Cash/Bank</InputLabel>
                <AccountMasterHelp
                  name="cashbank"
                  onAcCodeClick={handleCashBank}
                  CategoryName={lblbankname}
                  CategoryCode={newcashbank}
                  Ac_type={["B","C"]}
                  disabledFeild={!isEditing && addOneButtonEnabled}
                  size="small"
                />
              </FormControl>
            </Grid>
          </Grid>
        </form>
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner-container">
              <SaveUpdateSpinner />
            </div>
          </div>
        )}
        <div>
          <div style={{ marginTop: "10px" }}>
            <AddButton openPopup={openPopup} isEditing={isEditing} ref={addButtonRef} setFocusToFirstField={setFocusToFirstField} />
          </div>
          {showPopup && (
            <div className="RecieptPaymentmodal" >
              <div className="RecieptPaymentmodal-dialog" style={{
                display: "block",
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: "1050",
                width: "100%",
                maxWidth: "1200px"
              }} >
                <div className="RecieptPaymentmodal-content">
                  <div className="RecieptPaymentmodal-header">
                    <h5 className="RecieptPaymentmodal-title" style={{ marginBottom: "-20px" }}>
                      {selectedUser.id
                        ? "Edit Receipt Payment"
                        : "Add Receipt Payment"}
                    </h5>
                    <button
                      type="button"
                      onClick={closePopup}
                      aria-label="Close"
                      style={{
                        marginLeft: "90%",
                        width: "50px",
                        height: "50px",
                        backgroundColor: "#9bccf3",
                        borderRadius: "4px",
                        marginTop: "-40px",
                      }}
                    >
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                  <div className="RecieptPaymentmodal-body">
                    <form>
                      <div className="receiptpaymentdiv">
                        <label htmlFor="credit_ac" className="receiptpaymentlabel">
                          A/C Code :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group">
                            <AccountMasterHelp
                              name="credit_ac"
                              onAcCodeClick={handleAccode}
                              CategoryName={Creditcodecodename}
                              CategoryCode={Creditcodecode}
                              Ac_type={[]}
                              firstInputRef={firstInputRef}
                              disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="receiptpaymentdiv">
                        <label htmlFor="Unit_Code" className="receiptpaymentlabel">
                          Unit A/C :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group">
                            <AccountMasterHelp
                              name="Unit_Code"
                              onAcCodeClick={handleUnitCode}
                              CategoryName={unitcodestatename}
                              CategoryCode={unitcodestate}
                              Ac_type={[]}
                              disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="receiptpaymentdiv">
                        <label htmlFor="Group_Code" className="receiptpaymentlabel">
                          Group Code :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group">
                            <GroupMasterHelp
                              onAcCodeClick={handleGroupCode}
                              CategoryName={groupName}
                              CategoryCode={groupCode}
                              SystemType="C"
                              name="Group_Code"
                              disabledField={!isEditing && addOneButtonEnabled}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="receiptpaymentdiv">
                        <label htmlFor="drpFilterValue" className="receiptpaymentlabel">
                          Select :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group  col-md-2">
                            <select
                              id="drpFilterValue"
                              name="drpFilterValue"
                              value={formDataDetail.drpFilterValue}
                              onChange={handleDropdownvalueChange}
                              disabled={!isEditing && !addOneButtonEnabled}
                              className="custom-select"
                            >
                              {secondSelectOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.text}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="receiptpaymentdiv">
                        <label htmlFor="Voucher_No" className="receiptpaymentlabel">
                          Voucher No :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group">
                            <RecieptVoucherNoHelp
                              onAcCodeClick={handleRecieptvoucher}
                              name="Voucher_No"
                              VoucherNo={
                                newVoucher_No ||
                                VoucherNoState ||
                                formDataDetail.Voucher_No
                              }
                              disabledFeild={
                                (!isEditing && addOneButtonEnabled) ||
                                formDataDetail.drpFilterValue === "O"
                              }
                              Accode={formDataDetail.credit_ac || Creditcodecode}
                              onTenderDetailsFetched={handleTenderDetailsFetched}
                              FilterType={formDataDetail.drpFilterValue}
                              Tran_Type={
                                formData.tran_type || TyanTypeState || tranType
                              }
                              Ac_type={[]}
                            />
                          </div>
                        </div>

                        <label htmlFor="Voucher_Type" className="receiptpaymentlabel">
                          Voucher Type :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group">
                            <input
                              type="text"
                              name="Voucher_Type"
                              autoComplete="off"
                              value={formDataDetail.Voucher_Type}
                              disabled={
                                (!isEditing && addOneButtonEnabled) ||
                                formDataDetail.drpFilterValue === "O"
                              }
                              onChange={handleChangeDetail}
                              style={{ maxWidth: 100 }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="receiptpaymentdiv" style={{marginLeft:"10px"}}>
                        <label htmlFor="amount" className="receiptpaymentlabel">
                          Amount :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group col-md-4">
                            <input
                              type="text"
                              name="amount"
                              autoComplete="off"
                              value={formDataDetail.amount}
                              onChange={(e) => {
                                validateNumericInput(e);
                                handleChangeDetail(e);
                              }}
                              onKeyDown={handleKeyDownCalculations}
                            />
                          </div>
                        </div>
                        <label htmlFor="tenderdetailid" className="receiptpaymentlabel">
                          Tender ID :
                        </label>
                        <div className="receiptpayment-col" style={{marginRight:"40px"}}>
                          <div className="receiptpayment-form-group">
                            <input
                              type="text"
                              name="tenderdetailid"
                              autoComplete="off"
                              value={formDataDetail.tenderdetailid}
                              disabled={
                                (!isEditing && addOneButtonEnabled) ||
                                formDataDetail.drpFilterValue === "O"
                              }
                              onChange={handleChangeDetail}
                              style={{ maxWidth: 100, marginLeft: 10 }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="receiptpaymentdiv">
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group">
                            <label style={{ fontWeight: "bold" }}>Amount in Words : </label>
                            <p style={{ marginLeft: "5px", marginTop: '20px', color: "blue", fontWeight: "bold" }}>{amountInWords}</p>
                          </div>
                        </div>
                      </div>

                      <div className="receiptpaymentdiv"  style={{marginLeft:"10px"}}>
                        <label htmlFor="Adjusted_Amount" className="receiptpaymentlabel">
                          Adj Amount :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group col-md-4">
                            <input
                              type="text"
                              name="Adjusted_Amount"
                              autoComplete="off"
                              value={formDataDetail.Adjusted_Amount}
                              onChange={(e) => {
                                validateNumericInput(e);
                                handleChangeDetail(e);
                              }}
                              onKeyDown={handleKeyDownCalculations}
                            />
                          </div>
                        </div>
                        <label htmlFor="AcadjAccode" className="receiptpaymentlabel">
                          Adjusted A/C :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group">
                            <AccountMasterHelp
                              name="AcadjAccode"
                              onAcCodeClick={handleAcadjAccodename}
                              CategoryName={AcadjAccodenamename}
                              CategoryCode={AcadjAccodenamecode}
                              Ac_type={[]}
                              disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="receiptpaymentdiv"  style={{marginLeft:"10px"}}>
                        <label htmlFor="TDS_Rate" className="receiptpaymentlabel">
                          TDS % :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group col-md-6">
                            <input
                              type="text"
                              name="TDS_Rate"
                              autoComplete="off"
                              value={formDataDetail.TDS_Rate}
                              onChange={(e) => {
                                validateNumericInput(e);
                                handleChangeDetail(e);
                              }}
                              onKeyDown={handleKeyDownCalculations}
                              style={{ maxWidth: 100 }}
                            />
                          </div>
                        </div>

                        <label htmlFor="TDS_Amt" className="receiptpaymentlabel" style={{marginLeft:"40px"}}>
                          TDS Amount :
                        </label>
                        <div className="receiptpayment-col" >
                          <div className="receiptpayment-form-group">
                            <input
                              type="text"
                              name="TDS_Amt"
                              autoComplete="off"
                              value={parseFloat(formDataDetail.TDS_Amt).toFixed(2)}
                              onChange={(e) => {
                                validateNumericInput(e);
                                handleChangeDetail(e);
                              }}

                              style={{ maxWidth: 100 }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="receiptpaymentdiv" style={{marginLeft:"10px"}}>
                        <label htmlFor="narration" className="receiptpaymentlabel">
                          Narration :
                        </label>
                        <div className="receiptpayment-col">
                          <div className="receiptpayment-form-group col-md-6">
                            <textarea
                              name="narration"
                              autoComplete="off"
                              value={formDataDetail.narration}
                              onChange={handleChangeDetail}
                            />
                          </div>
                        </div>
                      </div>

                      {/* <div className="form-row">
                        <div className="form-group col-md-6">
                          <label>Narration 2:</label>
                          <textarea
                            name="narration2"
                            autoComplete="off"
                            value={formDataDetail.narration2}
                            onChange={handleChangeDetail}
                          />
                        </div>
                        <div className="form-group col-md-6">
                          <label>GRN:</label>
                          <input
                            type="text"
                            name="GRN"
                            autoComplete="off"
                            value={formDataDetail.GRN}
                            onChange={handleChangeDetail}
                          />
                        </div>
                      </div> */}

                      {/* <div className="form-row">
                        <div className="form-group col-md-6">
                          <label>TReceipt:</label>
                          <input
                            type="text"
                            name="TReceipt"
                            autoComplete="off"
                            value={formDataDetail.TReceipt}
                            onChange={handleChangeDetail}
                          />
                        </div>
                      </div> */}

                    </form>
                  </div>
                  <div className="modal-footer">
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

          <TableContainer component={Paper} style={{ marginTop: '16px', width: '100%', marginBottom: "20px" }}>
            <Table sx={{ minWidth: 650 }} >
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellStyle}>Actions</TableCell>
                  <TableCell sx={headerCellStyle}>ID</TableCell>
                  <TableCell sx={headerCellStyle}>Ac Code</TableCell>
                  <TableCell sx={headerCellStyle}>A/C Name</TableCell>
                  <TableCell sx={headerCellStyle}>Amount</TableCell>
                  <TableCell sx={headerCellStyle}>Narration</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} sx={{
                    height: '30px', '&:hover': {
                      backgroundColor: '#f3f388',
                      cursor: "pointer",
                    },
                  }} >
                    <TableCell sx={{ padding: '4px 8px' }}>
                      {user.rowaction === 'add' || user.rowaction === 'update' || user.rowaction === 'Normal' ? (
                        <>
                          <EditButton editUser={editUser} user={user} isEditing={isEditing} />
                          <DeleteButton deleteModeHandler={deleteModeHandler} user={user} isEditing={isEditing} />
                        </>
                      ) : user.rowaction === 'DNU' || user.rowaction === 'delete' ? (
                        <IconButton onClick={() => openDelete(user)}>
                          <OpenButton openDelete={openDelete} user={user} />
                        </IconButton>
                      ) : null}
                    </TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>{user.detail_id}</TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>{user.credit_ac}</TableCell>
                    <TableCell sx={{ padding: '4px 8px', textAlign: 'left' }}>{user.Creditcodecodename}</TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>{formatReadableAmount(user.amount)}</TableCell>
                    <TableCell sx={{ padding: '4px 8px' }}>{user.narration}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

        </div>
        <div className="receiptpaymentdiv" style={{ marginTop: "30px", marginBottom: '20px',width:"20%" }}>
            <label htmlFor="total" className="receiptpaymentlabel">Total:</label>
            <input
              type="text"
              id="total"
              name="total"
              value={formatReadableAmount(formData.total)}
              onChange={handleChange}
              disabled
            />
        </div>
      </div>
    </>
  );
};
export default RecieptPayment;