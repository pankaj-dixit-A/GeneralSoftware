import React, { useState, useEffect, useRef } from "react";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./OtherPurchase.css";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import GSTRateMasterHelp from "../../../Helper/GSTRateMasterHelp";
import GroupMasterHelp from "../../../Helper/SystemmasterHelp";
import { useRecordLocking } from '../../../hooks/useRecordLocking';
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import { Typography } from "@mui/material";
import { TextField, Grid, FormControl, InputLabel, FormHelperText } from '@mui/material';
import Swal from "sweetalert2";
import SaveUpdateSpinner from "../../../Common/Spinners/SaveUpdateSpinner";

//API Credentials
const API_URL = process.env.REACT_APP_API;

//Labels Global variables
var SupplierName = ""
var SupplierCode = ""
var Exp_Ac_Code = ""
var Exp_Ac_Name = ""
var TDSCutAcCode = ""
var TDSCutAcName = ""
var TDSAcCodeNew = ""
var TDSAcName = ""
var GStrateCode = ""
var GStrateName = ""
var Provision_Ac_Code = ""
var Provision_Ac_Name = ""
var GroupCode = ""
var GroupName = ""

const OtherPurchase = () => {

  //GET values from session storage
  const Year_Code = sessionStorage.getItem("Year_Code")
  const companyCode = sessionStorage.getItem("Company_Code");
  const username = sessionStorage.getItem("username");

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
  const [Exp_Ac, setExp_Ac] = useState('');
  const [Supplier, setSupplier] = useState('');
  const [SupplierAccoid, setSupplierAccoid] = useState('');
  const [TDSCuttAcCode, setTDSCuttAcCode] = useState('')
  const [TDSAcCode, setTDSAcCode] = useState('')
  const [gstRateCode, setgstRateCode] = useState('')
  const [formErrors, setFormErrors] = useState({});
  const [GstRate, setGstRate] = useState(0.0);
  const [matchStatus, setMatchStatus] = useState(null);
  const [groupCode, setGroupCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTDSACCodeManually, setIsTDSACCodeManually] = useState(false);
  const [tdsCutAcCodeName, setTDSCutAcCodeName] = useState('')

  const navigate = useNavigate();
  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;
  const inputRef = useRef(null)

  const searchParams = new URLSearchParams(location.search);
  const navigatedRecord = searchParams.get('navigatedRecord');

  const initialFormData = {
    Doc_Date: new Date().toISOString().slice(0, 10),
    Supplier_Code: "",
    Exp_Ac: "",
    Narration: "",
    Taxable_Amount: 0.00,
    GST_RateCode: 0.00,
    CGST_Rate: 0.00,
    CGST_Amount: 0.00,
    SGST_Rate: 0.00,
    SGST_Amount: 0.00,
    IGST_Rate: 0.00,
    IGST_Amount: 0.00,
    Other_Amount: 0.00,
    Bill_Amount: 0.00,
    Company_Code: companyCode,
    Year_Code: Year_Code,
    TDS_Amt: 0.00,
    TDS_Per: 0.00,
    TDS: 0.00,
    TDS_Cutt_AcCode: 0,
    TDS_AcCode: 0,
    sc: "",
    ea: "",
    tca: "",
    tac: "",
    billno: "",
    ASN_No: "",
    einvoiceno: "",
    Group_Code: 0,
    gcid: 0,
    ProvisionAmt: 0.00,
    ExpensisAmt: 0.00,
    Provision_Ac: 0,
    pa: 0
  };

  const [formData, setFormData] = useState(initialFormData);

  const { isRecordLockedByUser, lockRecord, unlockRecord } = useRecordLocking(formData.Doc_No, undefined, companyCode, Year_Code, "other_purchase");

  // Manage the States of application
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => {
      const updatedFormData = { ...prevState, [name]: value };
      return updatedFormData;
    });
  };

  //Fetch last record
  const fetchLastRecord = () => {
    fetch(`${API_URL}/get-next-doc-no-OtherPurchase?Company_Code=${companyCode}&Year_Code=${Year_Code}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch last record");
        }
        return response.json();
      })
      .then((data) => {
        setFormData((prevState) => ({
          ...prevState,
          Doc_No: data.next_doc_no,
        }));
      })
      .catch((error) => {
        console.error("Error fetching record:", error);
      });
  };

  //API Integration and Button Functionality
  const handleAddOne = () => {
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);
    fetchLastRecord();
    setFormData(initialFormData);
    SupplierName = ""
    SupplierCode = ""
    Exp_Ac_Code = ""
    Exp_Ac_Name = ""
    TDSCutAcCode = ""
    TDSCutAcName = ""
    TDSAcCodeNew = ""
    TDSAcName = ""
    GStrateCode = ""
    GStrateName = ""
    Provision_Ac_Code = ""
    Provision_Ac_Name = ""
    GroupCode = ""
    GroupName = ""
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
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

  const calculateDependentValues = async (
    name,
    input,
    formData,
    matchStatus,
    gstRate
  ) => {
    const updatedFormData = { ...formData, [name]: input };
    const provisionAmt = parseFloat(updatedFormData.ProvisionAmt) || 0.0;
    const expAmt = parseFloat(updatedFormData.ExpensisAmt) || 0.0;
    updatedFormData.Taxable_Amount = (provisionAmt + expAmt).toFixed(2)
    const rate = gstRate;

    if (matchStatus === "TRUE") {
      updatedFormData.CGST_Rate = (rate / 2).toFixed(2);
      updatedFormData.SGST_Rate = (rate / 2).toFixed(2);
      updatedFormData.IGST_Rate = 0.0;

      updatedFormData.CGST_Amount = (
        (updatedFormData.Taxable_Amount * updatedFormData.CGST_Rate) /
        100
      ).toFixed(2);
      updatedFormData.SGST_Amount = (
        (updatedFormData.Taxable_Amount * updatedFormData.SGST_Rate) /
        100
      ).toFixed(2);
      updatedFormData.IGST_Amount = 0.0;
    } else {
      updatedFormData.IGST_Rate = rate.toFixed(2);
      updatedFormData.CGST_Rate = 0.0;
      updatedFormData.SGST_Rate = 0.0;

      updatedFormData.IGST_Amount = (
        (updatedFormData.Taxable_Amount * updatedFormData.IGST_Rate) /
        100
      ).toFixed(2);
      updatedFormData.CGST_Amount = 0.0;
      updatedFormData.SGST_Amount = 0.0;
    }

    const miscAmount = parseFloat(updatedFormData.Other_Amount) || 0.0;
    updatedFormData.Bill_Amount = (
      (parseFloat(updatedFormData.Taxable_Amount) || 0.0) +
      (parseFloat(updatedFormData.CGST_Amount) || 0.0) +
      (parseFloat(updatedFormData.SGST_Amount) || 0.0) +
      (parseFloat(updatedFormData.IGST_Amount) || 0.0) +
      miscAmount
    ).toFixed(2);

    const tdsRate = parseFloat(updatedFormData.TDS_Per) || 0.0;
    const tdsAmount = Math.round((updatedFormData.TDS_Amt * tdsRate) / 100);
    const formattedTDS = (tdsAmount / 1.00).toFixed(2);
    updatedFormData.TDS = formattedTDS;
    return updatedFormData;
  };

  const handleKeyDownCalculations = async (event) => {
    if (event.key === "Tab") {
      const { name, value } = event.target;
      const matchStatus = await checkMatchStatus(
        formData.Supplier_Code,
        companyCode,
        Year_Code
      );
      let gstRate = GstRate;

      if (!gstRate || gstRate === 0) {
        const cgstRate = parseFloat(formData.CGST_Rate) || 0;
        const sgstRate = parseFloat(formData.SGST_Rate) || 0;
        const igstRate = parseFloat(formData.IGST_Rate) || 0;

        gstRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
      }
      const updatedFormData = await calculateDependentValues(
        name,
        value,
        formData,
        matchStatus,
        gstRate
      );
      setFormData(updatedFormData);
    }
  };

  //Insert and Update record Functionality
  const handleSaveOrUpdate = () => {
    if (formData.TDS_Amt != 0) {
      if (formData.TDS_AcCode === 0) {
        Swal.fire({
          title: "Error",
          text: "Please Enter TDS Account Code.!",
          icon: "error",
          confirmButtonText: "OK"
        });
        return;
      }
    };

    if (formData.Supplier_Code === "") {
      Swal.fire({
        title: "Error",
        text: "Please Select Supplier Code.!",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    };

    if (formData.GST_RateCode === "") {
      Swal.fire({
        title: "Error",
        text: "Please Select GST Code.!",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    };
    setIsLoading(true);
    let headData = {
      ...formData,
      GST_RateCode: gstRateCode || GStrateCode
    }
    if (isEditMode) {
      headData = {
        ...headData,
        Modified_By: username
      }
      axios
        .put(
          `${API_URL}/update-OtherPurchase?Doc_No=${formData.Doc_No}&Company_Code=${companyCode}&Year_Code=${Year_Code}`,
          headData
        )
        .then((response) => {
          toast.success("Record update successfully!");
          unlockRecord();
          setTimeout(() => {
            window.location.reload();
          }, 1000);

          setIsEditMode(false);
          setAddOneButtonEnabled(true);
          setEditButtonEnabled(true);
          setDeleteButtonEnabled(true);
          setBackButtonEnabled(true);
          setSaveButtonEnabled(false);
          setCancelButtonEnabled(false);
          setUpdateButtonClicked(true);
          setIsEditing(false);
          setIsLoading(false);
        })
        .catch((error) => {
          handleCancel();
          setIsLoading(false)
          console.error("Error updating data:", error);
        });
    } else {
      headData = {
        ...headData,
        Created_By: username
      }
      axios
        .post(
          `${API_URL}/create-Record-OtherPurchase?Company_Code=${companyCode}&Year_Code=${Year_Code}`,
          headData
        )
        .then((response) => {
          toast.success("Record Create successfully!");
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          setIsEditMode(false);
          setAddOneButtonEnabled(true);
          setEditButtonEnabled(true);
          setDeleteButtonEnabled(true);
          setBackButtonEnabled(true);
          setSaveButtonEnabled(false);
          setCancelButtonEnabled(false);
          setUpdateButtonClicked(true);
          setIsLoading(false);
          setIsEditing(false);
        })
        .catch((error) => {
          console.error("Error saving data:", error);
        });
    }
  };

  //handle Edit record functionality.
  const handleEdit = async () => {
    axios.get(`${API_URL}/get-OtherPurchaseSelectedRecord?Company_Code=${companyCode}&Year_Code=${Year_Code}&Doc_No=${formData.Doc_No}`)
      .then((response) => {
        const data = response.data;
        const isLockedNew = data.selected_Record_data.LockedRecord;
        const isLockedByUserNew = data.selected_Record_data.LockedUser;

        if (isLockedNew) {
          Swal.fire({
            icon: "warning",
            title: "Record Locked",
            text: `This record is locked by ${isLockedByUserNew}`,
            confirmButtonColor: "#d33",
          });
          return;
        } else {
          lockRecord()
        }
        setFormData({
          ...formData,
          ...data.last_head_data
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
        console.error("Error fetching data", error);
      });
  };


  //Show last record on Screen
  const handleCancel = () => {
    axios
      .get(
        `${API_URL}/get-OtherPurchase-lastRecord?Company_Code=${companyCode}&Year_Code=${Year_Code}`
      )
      .then((response) => {
        const data = response.data;
        SupplierName = data.labels.SupplierName;
        SupplierCode = data.last_OtherPurchase_data.Supplier_Code;
        Exp_Ac_Name = data.labels.ExpAcName;
        Exp_Ac_Code = data.last_OtherPurchase_data.Exp_Ac;
        TDSCutAcName = data.labels.TDSCutAcName;
        TDSCutAcCode = data.last_OtherPurchase_data.TDS_Cutt_AcCode;
        TDSAcName = data.labels.tdsacname;
        TDSAcCodeNew = data.last_OtherPurchase_data.TDS_AcCode;
        GStrateName = data.labels.GST_Name;
        GStrateCode = data.last_OtherPurchase_data.GST_RateCode;
        Provision_Ac_Code = data.last_OtherPurchase_data.Provision_Ac;
        Provision_Ac_Name = data.labels.provisionAcName;
        GroupCode = data.last_OtherPurchase_data.Group_Code;
        GroupName = data.labels.groupName;

        setFormData({
          ...formData,
          ...data.last_OtherPurchase_data,
        });

      })

      .catch((error) => {
        console.error("Error fetching edit:", error);
      });
    unlockRecord();
    // Reset other state variables
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

  //Record Delete Functionality
  const handleDelete = async () => {
    try {
      const response = await axios.get(`${API_URL}/get-OtherPurchaseSelectedRecord?Company_Code=${companyCode}&Year_Code=${Year_Code}&Doc_No=${formData.Doc_No}`);
      const data = response.data;
      const isLockedNew = data.selected_Record_data.LockedRecord;
      const isLockedByUserNew = data.selected_Record_data.LockedUser;

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
        text: `You won't be able to revert this Doc No: ${formData.Doc_No}`,
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

        const deleteApiUrl = `${API_URL}/delete-OtherPurchase?Doc_No=${formData.Doc_No}&Company_Code=${companyCode}&Year_Code=${Year_Code}`;
        await axios.delete(deleteApiUrl);

        toast.success("Record deleted successfully!");
        setIsLoading(false);
        handleCancel();
      } else {
        Swal.fire({
          title: "Cancelled",
          text: "Your record is safe 🙂",
          icon: "info",
        });
      }
    } catch (error) {
      toast.error("Deletion cancelled. Error occurred during the operation.");
      console.error("Error during API call:", error);
    }
  };

  //Gledger onCliked set record
  const handleNavigateRecord = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/get-OtherPurchaseSelectedRecord?Company_Code=${companyCode}&Year_Code=${Year_Code}&Doc_No=${navigatedRecord}`
      );
      const data = response.data;
      SupplierName = data.labels.SupplierName;
      SupplierCode = data.selected_Record_data.Supplier_Code;
      Exp_Ac_Name = data.labels.ExpAcName;
      Exp_Ac_Code = data.selected_Record_data.Exp_Ac;
      TDSCutAcName = data.labels.TDSCutAcName;
      TDSCutAcCode = data.selected_Record_data.TDS_Cutt_AcCode;
      TDSAcName = data.labels.tdsacname;
      TDSAcCodeNew = data.selected_Record_data.TDS_AcCode;
      GStrateName = data.labels.GST_Name;
      GStrateCode = data.selected_Record_data.GST_RateCode;
      Provision_Ac_Code = data.selected_Record_data.Provision_Ac;
      Provision_Ac_Name = data.labels.provisionAcName;
      GroupCode = data.selected_Record_data.Group_Code;
      GroupName = data.labels.groupName;

      setFormData({
        ...formData,
        ...data.selected_Record_data,
      });
      setIsEditing(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);
      setCancelButtonClicked(true);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };


  const handleBack = () => {
    navigate("/other-purchaseutility");
  };

  //Handle Record DoubleCliked in Utility Page Show that record for Edit
  const handlerecordDoubleClicked = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/get-OtherPurchaseSelectedRecord?Company_Code=${companyCode}&Year_Code=${Year_Code}&Doc_No=${selectedRecord.Doc_No}`
      );
      const data = response.data;
      SupplierName = data.labels.SupplierName;
      SupplierCode = data.selected_Record_data.Supplier_Code;
      Exp_Ac_Name = data.labels.ExpAcName;
      Exp_Ac_Code = data.selected_Record_data.Exp_Ac;
      TDSCutAcName = data.labels.TDSCutAcName;
      TDSCutAcCode = data.selected_Record_data.TDS_Cutt_AcCode;
      TDSAcName = data.labels.tdsacname;
      TDSAcCodeNew = data.selected_Record_data.TDS_AcCode;
      GStrateName = data.labels.GST_Name;
      GStrateCode = data.selected_Record_data.GST_RateCode;
      Provision_Ac_Code = data.selected_Record_data.Provision_Ac;
      Provision_Ac_Name = data.labels.provisionAcName;
      GroupCode = data.selected_Record_data.Group_Code;
      GroupName = data.labels.groupName;
      setFormData({
        ...formData,
        ...data.selected_Record_data,
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
    if (selectedRecord) {
      handlerecordDoubleClicked();
    } else if (navigatedRecord) {
      handleNavigateRecord()
    } else {
      handleAddOne();
    }
  }, [selectedRecord, navigatedRecord]);

  //change No functionality to get that particular record
  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(
          `${API_URL}/get-OtherPurchaseSelectedRecord?Company_Code=${companyCode}&Year_Code=${Year_Code}&Doc_No=${changeNoValue}`
        );
        const data = response.data;
        SupplierName = data.labels.SupplierName;
        SupplierCode = data.selected_Record_data.Supplier_Code;
        Exp_Ac_Name = data.labels.ExpAcName;
        Exp_Ac_Code = data.selected_Record_data.Exp_Ac;
        TDSCutAcName = data.labels.TDSCutAcName;
        TDSCutAcCode = data.selected_Record_data.TDS_Cutt_AcCode;
        TDSAcName = data.labels.tdsacname;
        TDSAcCodeNew = data.selected_Record_data.TDS_AcCode;
        GStrateName = data.labels.GST_Name;
        GStrateCode = data.selected_Record_data.GST_RateCode;
        Provision_Ac_Code = data.selected_Record_data.Provision_Ac;
        Provision_Ac_Name = data.labels.provisionAcName;
        GroupCode = data.selected_Record_data.Group_Code;
        GroupName = data.labels.groupName;

        setFormData({
          ...formData,
          ...data.selected_Record_data,
        });
        setIsEditing(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  //Navigation Buttons
  const handleFirstButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/get-first-OtherPurchase?Company_Code=${companyCode}&Year_Code=${Year_Code}`);
      if (response.ok) {
        const data = await response.json();
        SupplierName = data.labels.SupplierName;
        SupplierCode = data.first_OtherPurchase_data.Supplier_Code;
        Exp_Ac_Name = data.labels.ExpAcName;
        Exp_Ac_Code = data.first_OtherPurchase_data.Exp_Ac;
        TDSCutAcName = data.labels.TDSCutAcName;
        TDSCutAcCode = data.first_OtherPurchase_data.TDS_Cutt_AcCode;
        TDSAcName = data.labels.tdsacname;
        TDSAcCodeNew = data.first_OtherPurchase_data.TDS_AcCode;
        GStrateName = data.labels.GST_Name;
        GStrateCode = data.first_OtherPurchase_data.GST_RateCode;
        Provision_Ac_Code = data.first_OtherPurchase_data.Provision_Ac;
        Provision_Ac_Name = data.labels.provisionAcName;
        GroupCode = data.first_OtherPurchase_data.Group_Code;
        GroupName = data.labels.groupName;
        setFormData({
          ...formData,
          ...data.first_OtherPurchase_data,
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

  const handlePreviousButtonClick = async () => {
    try {
      const response = await fetch(
        `${API_URL}/get-previous-OtherPurchase?Company_Code=${companyCode}&Year_Code=${Year_Code}&Doc_No=${formData.Doc_No}`
      );
      if (response.ok) {
        const data = await response.json();
        SupplierName = data.labels.SupplierName;
        SupplierCode = data.previous_OtherPurchase_data.Supplier_Code;
        Exp_Ac_Name = data.labels.ExpAcName;
        Exp_Ac_Code = data.previous_OtherPurchase_data.Exp_Ac;
        TDSCutAcName = data.labels.TDSCutAcName;
        TDSCutAcCode = data.previous_OtherPurchase_data.TDS_Cutt_AcCode;
        TDSAcName = data.labels.tdsacname;
        TDSAcCodeNew = data.previous_OtherPurchase_data.TDS_AcCode;
        GStrateName = data.labels.GST_Name;
        GStrateCode = data.previous_OtherPurchase_data.GST_RateCode;
        Provision_Ac_Code = data.previous_OtherPurchase_data.Provision_Ac;
        Provision_Ac_Name = data.labels.provisionAcName;
        GroupCode = data.previous_OtherPurchase_data.Group_Code;
        GroupName = data.labels.groupName;
        setFormData({
          ...formData,
          ...data.previous_OtherPurchase_data,
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

  const handleNextButtonClick = async () => {
    try {
      const response = await fetch(
        `${API_URL}/get-next-OtherPurchase?Company_Code=${companyCode}&Year_Code=${Year_Code}&Doc_No=${formData.Doc_No}`
      );
      if (response.ok) {
        const data = await response.json();
        SupplierName = data.labels.SupplierName;
        SupplierCode = data.next_OtherPurchase_data.Supplier_Code;
        Exp_Ac_Name = data.labels.ExpAcName;
        Exp_Ac_Code = data.next_OtherPurchase_data.Exp_Ac;
        TDSCutAcName = data.labels.TDSCutAcName;
        TDSCutAcCode = data.next_OtherPurchase_data.TDS_Cutt_AcCode;
        TDSAcName = data.labels.tdsacname;
        TDSAcCodeNew = data.next_OtherPurchase_data.TDS_AcCode;
        GStrateName = data.labels.GST_Name;
        GStrateCode = data.next_OtherPurchase_data.GST_RateCode;
        Provision_Ac_Code = data.next_OtherPurchase_data.Provision_Ac;
        Provision_Ac_Name = data.labels.provisionAcName;
        GroupCode = data.next_OtherPurchase_data.Group_Code;
        GroupName = data.labels.groupName;

        setFormData({
          ...formData,
          ...data.next_OtherPurchase_data,
        });
      } else {
        console.error(
          "Failed to fetch  record:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handleLastButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/get-OtherPurchase-lastRecord?Company_Code=${companyCode}&Year_Code=${Year_Code}`);
      if (response.ok) {
        const data = await response.json();
        SupplierName = data.labels.SupplierName;
        SupplierCode = data.last_OtherPurchase_data.Supplier_Code;
        Exp_Ac_Name = data.labels.ExpAcName;
        Exp_Ac_Code = data.last_OtherPurchase_data.Exp_Ac;
        TDSCutAcName = data.labels.TDSCutAcName;
        TDSCutAcCode = data.last_OtherPurchase_data.TDS_Cutt_AcCode;
        TDSAcName = data.labels.tdsacname;
        TDSAcCodeNew = data.last_OtherPurchase_data.TDS_AcCode;
        GStrateName = data.labels.GST_Name;
        GStrateCode = data.last_OtherPurchase_data.GST_RateCode;
        Provision_Ac_Code = data.last_OtherPurchase_data.Provision_Ac;
        Provision_Ac_Name = data.labels.provisionAcName;
        GroupCode = data.last_OtherPurchase_data.Group_Code;
        GroupName = data.labels.groupName;
        setFormData({
          ...formData,
          ...data.last_OtherPurchase_data,
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

  //Helper Compoents Function For manage the labels 
  const handleSupplier = async (code, accoid, name) => {
    setSupplier(code);
    setTDSCutAcCodeName(name)
    let updatedFormData = {
      ...formData,
      Supplier_Code: code,
      sc: accoid,
    };
    if (!isTDSACCodeManually) {
      setTDSCuttAcCode(code);
      setFormData((prevFormData) => ({
        ...prevFormData,
        TDS_Cutt_AcCode: code,
        tca: accoid
      }));
    }
    try {
      const matchStatusResult = await checkMatchStatus(
        code,
        companyCode,
        Year_Code
      );
      setMatchStatus(matchStatusResult);
      let gstRate = GstRate;

      if (!gstRate || gstRate === 0) {
        const cgstRate = parseFloat(formData.CGST_Rate) || 0;
        const sgstRate = parseFloat(formData.SGST_Rate) || 0;
        const igstRate = parseFloat(formData.IGST_Rate) || 0;

        gstRate = igstRate > 0 ? igstRate : cgstRate + sgstRate;
      }
      updatedFormData = await calculateDependentValues(
        "GST_RateCode",
        GstRate,
        updatedFormData,
        matchStatusResult,
        gstRate
      );
      setFormData((prevState) => ({
        ...updatedFormData,
        TDS_Cutt_AcCode: isTDSACCodeManually ? prevState.TDS_Cutt_AcCode : code,
        tca: isTDSACCodeManually ? prevState.tca : accoid
      }));
    } catch (error) {
      console.error("Error in handleBillFrom:", error);
    }
  }


  const handleExpAc = (code, accoid) => {
    setExp_Ac(code);
    setFormData({
      ...formData,
      Exp_Ac: code,
      ea: accoid
    });
  }

  const handleProvisionAc = (code, accoid) => {
    setExp_Ac(code);
    setFormData({
      ...formData,
      Provision_Ac: code,
      pa: accoid
    });
  }

  const handleGroupCode = (code, accoid) => {
    setGroupCode(code);
    setFormData({
      ...formData,
      Group_Code: code,
      gcid: accoid
    });
  };
  const handleTDSCutting = (code, accoid, name) => {
    setIsTDSACCodeManually(true)
    setTDSCuttAcCode(code);
    setTDSCutAcCodeName(name)
    setFormData({
      ...formData,
      TDS_Cutt_AcCode: code,
      tca: accoid
    });
  }
  const handleTDSAc = (code, accoid) => {
    setTDSAcCode(code);
    setFormData({
      ...formData,
      TDS_AcCode: code,
      tac: accoid
    });
  }

  const handleGstRateCode = async (code, Rate) => {
    setgstRateCode(code);
    let rate = parseFloat(Rate);
    setFormData({
      ...formData,
      GST_RateCode: code,
    });


    const updatedFormData = {
      ...formData,
      GST_RateCode: code,
    };
    setGstRate(rate);

    try {
      const matchStatusResult = await checkMatchStatus(
        updatedFormData.Supplier_Code,
        companyCode,
        Year_Code
      );
      setMatchStatus(matchStatusResult);

      const newFormData = await calculateDependentValues(
        "GST_RateCode",
        rate,
        updatedFormData,
        matchStatusResult,
        rate
      );

      setFormData(newFormData);
    } catch (error) { }
  };


  return (
    <>
      <UserAuditInfo
        createdBy={formData.Created_By}
        modifiedBy={formData.Modified_By}
        title={"Other Purchase"}
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
        />
        <div>
          <NavigationButtons
            handleFirstButtonClick={handleFirstButtonClick}
            handlePreviousButtonClick={handlePreviousButtonClick}
            handleNextButtonClick={handleNextButtonClick}
            handleLastButtonClick={handleLastButtonClick}
            highlightedButton={highlightedButton}
            isEditing={isEditing}
          />
        </div>
      </div>
      <br></br>
      <div >
        <form >
          <Grid container spacing={2}>
            <Grid item xs={1}>
              <FormControl fullWidth disabled={!addOneButtonEnabled}>
                <TextField
                  type="text"
                  id="changeNo"
                  label="Change No"
                  name="changeNo"
                  autoComplete="off"
                  onKeyDown={handleKeyDown}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </FormControl>
            </Grid>

            <Grid item xs={1}>
              <FormControl fullWidth disabled>
                <TextField
                  type="text"
                  id="Doc_No"
                  label="Entry No"
                  name="Doc_No"
                  value={formData.Doc_No}
                  onChange={handleChange}
                  variant="outlined"
                  size="small"
                  disabled
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </FormControl>
            </Grid>
            <Grid item xs={1}>
              <FormControl fullWidth >
                <TextField
                  type="date"
                  id="Doc_Date"
                  label="Date"
                  name="Doc_Date"
                  value={formData.Doc_Date}
                  onChange={handleChange}
                  inputRef={inputRef}
                  variant="outlined"
                  size="small"
                  disabled={!isEditing && addOneButtonEnabled}
                 
                  InputLabelProps={{
                    style: { fontSize: '12px' },
                  }}
                  InputProps={{
                    style: { fontSize: '12px', height: '40px' },
                  }}
                />
              </FormControl>
            </Grid>
          </Grid>

          <div className="otherpurchase-row" style={{marginTop:"10px"}}>
            <label htmlFor="Supplier_Code">Supplier :</label>
            <div className="otherpurchase-formgroup-item">
              <AccountMasterHelp
                onAcCodeClick={handleSupplier}
                CategoryName={SupplierName}
                CategoryCode={SupplierCode}
                name="Supplier_Code"
                Ac_type={[]}
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>
          </div>

          <div className="otherpurchase-row">
            <label htmlFor="Exp_Ac">Expense A/C :</label>
            <div className="otherpurchase-formgroup-item">
              <AccountMasterHelp
                onAcCodeClick={handleExpAc}
                CategoryName={Exp_Ac_Name}
                CategoryCode={Exp_Ac_Code}
                name="Exp_Ac"
                Ac_type={[]}
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>

          </div>
          <div className="otherpurchase-row">
            <label htmlFor="Provision_Ac">Provision A/C :</label>
            <div className="otherpurchase-formgroup-item">
              <AccountMasterHelp
                onAcCodeClick={handleProvisionAc}
                CategoryName={Provision_Ac_Name}
                CategoryCode={Provision_Ac_Code}
                name="Provision_Ac"
                Ac_type={[]}
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>

          </div>
          <div className="otherpurchase-row">
            <label htmlFor="Group_Code">Group Code :</label>
            <div className="otherpurchase-formgroup-item">
              <GroupMasterHelp
                onAcCodeClick={handleGroupCode}
                CategoryName={GroupName}
                CategoryCode={GroupCode}
                SystemType="C"
                name="Group_Code"
                disabledField={!isEditing && addOneButtonEnabled}
              />
            </div>

          </div>
          <div className="otherpurchase-row">
            <label htmlFor="GST_RateCode">GST Code :</label>
            <div className="otherpurchase-formgroup-item">
              <GSTRateMasterHelp
                onAcCodeClick={handleGstRateCode}
                GstRateName={GStrateName}
                GstRateCode={GStrateCode}
                name="GST_RateCode"
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>
          </div>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={1}>
              <FormControl fullWidth>
                <TextField
                  type="number"
                  id="ProvisionAmt"
                  label="Provision Amount"
                  name="ProvisionAmt"
                  autoComplete="off"
                  value={formData.ProvisionAmt !== null ? formData.ProvisionAmt : 0.00}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  variant="outlined"
                  size="small"
                  inputProps={{ step: "0.01" }}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={1}>
              <FormControl fullWidth>
                <TextField
                  type="number"
                  id="ExpensisAmt"
                  label="Expense Amount"
                  name="ExpensisAmt"
                  autoComplete="off"
                  value={formData.ExpensisAmt !== null ? formData.ExpensisAmt : 0.00}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  variant="outlined"
                  size="small"
                  inputProps={{ step: "0.01" }}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={1}>
              <FormControl fullWidth>
                <TextField
                  type="number"
                  id="Taxable_Amount"
                  label="Taxable Amount"
                  name="Taxable_Amount"
                  autoComplete="off"
                  value={formData.Taxable_Amount !== null ? formData.Taxable_Amount : 0.00}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled
                  variant="outlined"
                  size="small"
                  inputProps={{ step: "0.01" }}
                />
              </FormControl>
            </Grid>
          </Grid>
          <br></br>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={1}>
              <FormControl fullWidth>
                <TextField
                  type="text"
                  id="CGST_Rate"
                  label="CGST %"
                  name="CGST_Rate"
                  autoComplete="off"
                  value={formData.CGST_Rate !== null ? formData.CGST_Rate : 0.00}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled
                  size="small"
                  variant="outlined"
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <FormControl fullWidth>
                <TextField
                  type="text"
                  id="CGST_Amount"
                  label="CGST Amount"
                  name="CGST_Amount"
                  autoComplete="off"
                  value={formData.CGST_Amount !== null ? formData.CGST_Amount : 0.00}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled
                  size="small"
                  variant="outlined"
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <FormControl fullWidth>
                <TextField
                  type="text"
                  id="SGST_Rate"
                  label="SGST %"
                  name="SGST_Rate"
                  autoComplete="off"
                  value={formData.SGST_Rate !== null ? formData.SGST_Rate : 0.00}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled
                  size="small"
                  variant="outlined"
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <FormControl fullWidth>
                <TextField
                  type="text"
                  id="SGST_Amount"
                  label="SGST Amount"
                  name="SGST_Amount"
                  autoComplete="off"
                  value={formData.SGST_Amount !== null ? formData.SGST_Amount : ""}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled
                  size="small"
                  variant="outlined"
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <FormControl fullWidth>
                <TextField
                  type="text"
                  id="IGST_Rate"
                  label="IGST %"
                  name="IGST_Rate"
                  autoComplete="off"
                  value={formData.IGST_Rate !== null ? formData.IGST_Rate : 0.00}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled
                  size="small"
                  variant="outlined"
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <FormControl fullWidth>
                <TextField
                  type="text"
                  id="IGST_Amount"
                  label="IGST Amount"
                  name="IGST_Amount"
                  autoComplete="off"
                  value={formData.IGST_Amount !== null ? formData.IGST_Amount : 0.00}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled
                  size="small"
                  variant="outlined"
                />
              </FormControl>
            </Grid>
          </Grid>

          <br></br>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={1}>
              <FormControl fullWidth>
                <TextField
                  type="number"
                  id="Other_Amount"
                  label="Other Amount"
                  name="Other_Amount"
                  autoComplete="off"
                  size="small"
                  value={formData.Other_Amount !== null ? formData.Other_Amount : 0.00}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  variant="outlined"
                  inputProps={{ step: "0.01" }}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <FormControl fullWidth>
                <TextField
                  type="number"
                  id="Bill_Amount"
                  label="Bill Amount"
                  name="Bill_Amount"
                  autoComplete="off"
                  size="small"
                  value={formData.Bill_Amount !== null ? formData.Bill_Amount : 0.00}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  variant="outlined"
                  inputProps={{ step: "0.01" }}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={1}>
              <FormControl fullWidth>
                <TextField
                  type="number"
                  id="TDS_Amt"
                  label="TDS Amount"
                  name="TDS_Amt"
                  autoComplete="off"
                  value={parseFloat(formData.TDS_Amt) || 0.00}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  variant="outlined"
                  size="small"
                  inputProps={{ step: "0.01" }}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={1}>
              <FormControl fullWidth>
                <TextField
                  type="number"
                  id="TDS_Per"
                  label="TDS %"
                  name="TDS_Per"
                  autoComplete="off"
                  value={formData.TDS_Per || 0.00}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  variant="outlined"
                  size="small"
                  inputProps={{ step: "0.01" }}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={1}>
              <FormControl fullWidth>
                <TextField
                  type="number"
                  id="TDS"
                  label="TDS"
                  name="TDS"
                  autoComplete="off"
                  value={formData.TDS}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  variant="outlined"
                  size="small"
                  inputProps={{ step: "0.01" }}
                />
              </FormControl>
            </Grid>
          </Grid>
          <div className="otherpurchase-row">
            <label htmlFor="TDS_Ac_Cutt">TDS Cut AC :</label>
            <div className="otherpurchase-formgroup-item">
              <AccountMasterHelp
                onAcCodeClick={handleTDSCutting}
                CategoryName={TDSCutAcName || tdsCutAcCodeName}
                CategoryCode={TDSCutAcCode ? TDSCutAcCode : formData.TDS_Cutt_AcCode}
                name="TDS_Ac_Cutt"
                Ac_type={[]}
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>
          </div>
          <div className="otherpurchase-row">
            <label htmlFor="TDS_Ac">TDS AC :</label>
            <div className="otherpurchase-formgroup-item">
              <AccountMasterHelp
                onAcCodeClick={handleTDSAc}
                CategoryName={TDSAcName}
                CategoryCode={TDSAcCodeNew}
                name="TDS_Ac"
                Ac_type={[]}
                disabledFeild={!isEditing && addOneButtonEnabled}
              />
            </div>
          </div>
          <br></br>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <TextField
                  type="text"
                  id="billno"
                  label="Bill No"
                  name="billno"
                  autoComplete="off"
                  value={formData.billno}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  variant="outlined"
                  size="small"
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <TextField
                  type="text"
                  id="ASN_No"
                  label="ASN No"
                  name="ASN_No"
                  autoComplete="off"
                  value={formData.ASN_No}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  variant="outlined"
                  size="small"
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <TextField
                  type="text"
                  id="einvoiceno"
                  label="EInvoice No"
                  name="einvoiceno"
                  autoComplete="off"
                  value={formData.einvoiceno}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  variant="outlined"
                  size="small"
                />
              </FormControl>
            </Grid>

            <Grid item xs={8}>
              <FormControl fullWidth>
                <TextField
                  id="Narration"
                  name="Narration"
                  label="Narration"
                  autoComplete="off"
                  value={formData.Narration}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  variant="outlined"
                  multiline
                  rows={2}
                  placeholder="Enter narration here"
                />
              </FormControl>
            </Grid>
          </Grid>
          {isLoading && (
            <div className="loading-overlay">
              <div className="spinner-container">
                <SaveUpdateSpinner />
              </div>
            </div>
          )}
        </form>
      </div>
    </>
  );
};
export default OtherPurchase;
