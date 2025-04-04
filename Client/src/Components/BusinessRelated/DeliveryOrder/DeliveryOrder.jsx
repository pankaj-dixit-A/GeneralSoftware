import React from "react";
import { useEffect, useState, useRef } from "react";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import SystemHelpMaster from "../../../Helper/SystemmasterHelp";
import GSTStateMasterHelp from "../../../Helper/GSTStateMasterHelp";
import PurcnoHelp from "../../../Helper/PurcnoHelp";
import CarporateHelp from "../../../Helper/CarporateHelp";
import "./DeliveryOrder.css";
import "../../../App.css"
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import GSTRateMasterHelp from "../../../Helper/GSTRateMasterHelp";
import { useNavigate, useLocation } from "react-router-dom";
import DeliveryOrderOurDoReport from "./DeliveryOrderOurDOReport";
import SaleBillReport from '../../Outward/SaleBill/SaleBillReport'
import { initialFormData, checkMatchStatus, Acname } from './InitialFormDataDO'
import {
  TextField, Select, MenuItem, Grid, InputLabel, FormControl, OutlinedInput, Box, Table, TableHead, TableRow, TableCell, TableBody, Card, CardContent
} from "@mui/material";
import Swal from "sweetalert2";
import SaveUpdateSpinner from "../../../Common/Spinners/SaveUpdateSpinner";
import AddButton from "../../../Common/Buttons/AddButton";
import EditButton from "../../../Common/Buttons/EditButton";
import DeleteButton from "../../../Common/Buttons/DeleteButton";
import OpenButton from "../../../Common/Buttons/OpenButton";
import UserAuditInfo from "../../../Common/UserAuditInfo/UserAuditInfo";
import DetailCloseButton from "../../../Common/Buttons/DetailCloseButton";
import DetailUpdateButton from "../../../Common/Buttons/DetailUpdateButton";
import DetailAddButtomCommon from "../../../Common/Buttons/DetailAddButton";

const API_URL = process.env.REACT_APP_API;

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

var lblmillname;
var newmill_code;
var lblDoname;
var newDO;
var lblvoucherByname;
var newvoucher_by;
var lblbrokername;
var newbroker;
var lbltransportname;
var newtransport;
var lblvasuliacname;
var newvasuli;
var lblgetpasscodename;
var newGETPASSCODE;
var lblsalebilltoname;
var newSaleBillTo;
var lblvasuliacname;
var newVasuli_Ac;
var lblgstratename;
var newGstRateCode;
var lblgetpassstatename;
var GetpassByCode;
var VoucherByName;
var VoucherByCode;
var SaleBillByName;
var SaleBillByCode;
var MillByName;
var MillByCode;
var GetPassByName;
var lblBilltostatename;
var lblmillstatename;
var MillByCode;
var lbltransportstatename;
var newTransportGSTStateCode;
var lblitemname;
var newitemcode;
var lblcarporateacname;
var newcarporate_ac;
var lblbrandname;
var newbrandcode;
var lblcashdiffacname;
var newCashDiffAc;
var lbltdsacname;
var newTDSAc;
var newMemoGSTRate;
var lblMemoGSTRatename;
var ItemName = "";
var ItemCodeNew = "";
var lblbankname = "";
var bankcodenew = "";
var newDcid = "";
var newPurcno;
var lblTenderid;
var newpurcoder;
var TenderDetailsData = "";
var newcarporateno;
var voucherTitle = "";
var salebillTitle = "";
var getpassTitle = "";
var brokerTitle = "";
var voucherstatename = "";
var salebilltostatename = "";
var getpassstatename = "";
var newTenderDetailId = "";
var truckNo = "";
var OrderId = ""

const DeliveryOrder = () => {

  //GET Values from session
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const CompanyparametrselfAc = sessionStorage.getItem("SELF_AC");
  const CompanyparametrselfAcid = sessionStorage.getItem("Self_acid");

  const [updateButtonClicked, setUpdateButtonClicked] = useState(false);
  const [saveButtonClicked, setSaveButtonClicked] = useState(false);
  const [addOneButtonEnabled, setAddOneButtonEnabled] = useState(false);
  const [saveButtonEnabled, setSaveButtonEnabled] = useState(true);
  const [cancelButtonEnabled, setCancelButtonEnabled] = useState(true);
  const [editButtonEnabled, setEditButtonEnabled] = useState(false);
  const [deleteButtonEnabled, setDeleteButtonEnabled] = useState(false);
  const [backButtonEnabled, setBackButtonEnabled] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [highlightedButton, setHighlightedButton] = useState(null);
  const [cancelButtonClicked, setCancelButtonClicked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [lastTenderDetails, setLastTenderDetails] = useState([]);
  const [lastTenderData, setLastTenderData] = useState({});
  const [accountCode, setAccountCode] = useState("");
  const [gstCode, setGstCode] = useState("");
  const [gstRate, setGstRate] = useState("");
  const [getpassstatecode, setgetpassstatecode] = useState("");
  const [getpassstatecodename, setgetpassstatecodename] = useState("");
  const [voucherbystatename, setvoucherbystatename] = useState("");
  const [voucherbystatecode, setvoucherbystatecode] = useState("");
  const [millstatecode, setmillstatecode] = useState("");
  const [millstatename, setmillstatename] = useState("");
  const [salebilltostatecode, setsalebilltostatecode] = useState("");
  const [salebilltostatename, setsalebilltostatename] = useState("");
  const [transportstatecode, setTransportStateCode] = useState("");
  const [transportstatename, settransportstatename] = useState("");
  const [itemSelect, setItemSelect] = useState("");
  const [itemSelectAccoid, setItemSelectAccoid] = useState("");
  const [itemSelectname, setItemSelectname] = useState("");
  const [brandCode, setBrandCode] = useState("");
  const [brandCodeAccoid, setBrandCodeAccoid] = useState("");
  const [millcode, setmillcode] = useState("");
  const [millcodeacid, setmillcodeacid] = useState("");
  const [millcodename, setmillcodename] = useState("");
  const [getpasscode, setgetpasscode] = useState("");
  const [getpasscodeacid, setgetpasscodeacid] = useState("");
  const [getpasscodename, setgetpasscodename] = useState("");
  const [voucherbycode, setvoucherbycode] = useState("");
  const [voucherbycodeacid, setvoucherbycodeeacid] = useState("");
  const [voucherbycodename, setvoucherbycodename] = useState("");
  const [salebilltocode, setsalebilltocode] = useState("");
  const [salebilltocodeacid, setsalebilltocodeacid] = useState("");
  const [salebilltocodename, setsalebilltocodename] = useState("");
  const [transportcode, settransportcode] = useState("");
  const [transportcodeacid, settransportcodeacid] = useState("");
  const [transportcodename, settransportcodename] = useState("");
  const [brokercode, setbrokercode] = useState("");
  const [brokercodeacid, setbrokercodeacid] = useState("");
  const [brokercodename, setbrokercodename] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bankcode, setbankcode] = useState("");
  const [bankcodeacoid, setbankcodeacid] = useState("");
  const [bankcodeacname, setbankcodeacname] = useState("");
  const [DOcode, setDOcode] = useState("");
  const [DOcodeacoid, setDOcodeacid] = useState("");
  const [DOcodeacname, setDOcodeacname] = useState("");
  const [TDSACcode, setTDSACcode] = useState("");
  const [TDSACcodeacoid, setTDSACcodeacid] = useState("");
  const [TDSACcodeacname, setTDSACcodeacname] = useState("");
  const [vasuliaccode, setvasuliaccode] = useState("");
  const [Tvasuliaccodeacoid, setvasuliaccodeacid] = useState("");
  const [vasuliaccodeacname, setvasuliaccodeacname] = useState("");
  const [BPaccode, setBPaccode] = useState("");
  const [BPaccodeacoid, setBPaccodeacid] = useState("");
  const [BPaccodeacname, setBPaccodeacname] = useState("");
  const [Tenderno, setTenderno] = useState("");
  const [Tenderid, setTenderid] = useState("");
  const [Carporateno, setCarporateno] = useState("");

  const [selectedUser, setSelectedUser] = useState({});
  const [deleteMode, setDeleteMode] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [users, setUsers] = useState([]);
  const [tenderDetails, setTenderDetails] = useState({});
  const [detailRecords, setDetailRecords] = useState([]);
  const [Gst_Rate, setGstRatecode] = useState(0.0);
  const [matchStatus, setMatchStatus] = useState(null);
  const [GSTMemoGstcode, setGSTMemoGstcode] = useState("");
  const [GSTMemoGstrate, setGSTMemoGstrate] = useState("");
  const [pdspartystatecode, setpdspartystatecode] = useState("");
  const [pdsBilltostatecode, setpdsBilltostatecode] = useState("");
  const [PDSType, setPDSType] = useState("");
  const [PDSParty, setPDSParty] = useState("");
  const [PDSUnit, setPDSUnit] = useState("");
  const [CarporateState, setCarporateState] = useState({});
  const [ChangeData, setChangeData] = useState(false);
  const [pendingDOData, setPendingDOData] = useState("");

  const [Autopurchase, setAutopurchase] = useState("");
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const [popupMode, setPopupMode] = useState("add");

  //Head section state management
  const [formData, setFormData] = useState(initialFormData);
  const navigate = useNavigate();

  const addButtonRef = useRef(null);
  const firstInputRef = useRef(null);
  const setFocusToFirstField = () => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  };

  // Handle change for all inputs
  const handleChange = async (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,

      [name]: value,
    }));

  };

  const [formDataDetail, setFormDataDetail] = useState({
    ddType: "T",
    Narration: "",
    Amount: 0.00,
    UTR_NO: "",
    UtrYearCode: "",
    detail_Id: 1,
    LTNo: 0
  });


  //In utility page record doubleClicked that recod show for edit functionality
  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;
  const selectedRecordPendingDo = location.state?.selectedRecordPendingDo;

  //Help Functionality
  const handlemill_code = (code, accoid, name, mobileno, GSTNO, TDsApplicable, gststatecode, gstname) => {
    setmillcode(code);
    setmillcodeacid(accoid);
    setmillcodename(name);
    setmillstatecode(gststatecode);
    setmillstatename(gstname);

    setFormData({
      ...formData,
      mill_code: code,
      mc: accoid,
      MillGSTStateCode: gststatecode
    });
  };

  const handlePurcno = (Tenderno, Tenderid) => {
    setTenderno(Tenderno);
    setTenderid(Tenderid);

    const Dispatch_type =
      tenderDetails.DT === "D" ? formData.desp_type === "DO" : "DI";

    setFormData({
      ...formData,
      desp_type: Dispatch_type,
      purc_no: Tenderno,
      purc_order: Tenderid,
    });
  };

  const handleCarporate = (Carporateno) => {
    setCarporateno(Carporateno);

    setFormData({
      ...formData,
      Carporate_Sale_No: Carporateno,
    });
  };

  const handleDO = (code, accoid, name) => {
    setDOcode(code);
    setDOcodeacid(accoid);
    setDOcodeacname(name);
    setFormData({
      ...formData,
      DO: code,
      docd: accoid,
    });
  };
  const handleMemoGSTRate = (code, rate) => {
    setGSTMemoGstcode(code);
    setGSTMemoGstrate(rate);

    setFormData({
      ...formData,
      MemoGSTRate: code,
      newMemoGSTRate: code,
      lblMemoGSTRatename: rate
    });
  };
  const handlevoucher_by = (code, accoid, name, mobileno, GSTNO, TDsApplicable, gststatecode, gstname) => {
    setvoucherbycode(code);
    setvoucherbycodeeacid(accoid);
    setvoucherbycodename(name);
    setvoucherbystatecode(gststatecode);
    setvoucherbystatename(gstname);
    setFormData({
      ...formData,
      voucher_by: code,
      vb: accoid,
      VoucherbyGstStateCode: gststatecode
    });
  };
  const handlebroker = (code, accoid, name) => {
    setbrokercode(code);
    setbrokercodeacid(accoid);
    setbrokercodename(name);
    setFormData({
      ...formData,
      broker: code,
      bk: accoid,
    });
  };

  const handletransport = (code, accoid, name, mobileno, GSTNO, TDsApplicable, gststatecode, gstname) => {
    settransportcode(code);
    settransportcodename(name);
    settransportcodeacid(accoid);
    setTransportStateCode(gststatecode);
    settransportstatename(gstname);

    setFormData((prevFormData) => ({
      ...prevFormData,
      transport: code,
      tc: accoid,
      TransportGSTStateCode: gststatecode,
    }));
  };


  const handleGETPASSCODE = (code, accoid, name, mobileno, GSTNO, TDsApplicable, gststatecode, State_Name) => {
    setgetpasscode(code);
    setgetpasscodeacid(accoid);
    setgetpasscodename(name);
    setgetpassstatecode(gststatecode);
    setgetpassstatecodename(State_Name)
    setFormData({
      ...formData,
      GETPASSCODE: code,
      gp: accoid,
      GetpassGstStateCode: gststatecode,
    });
  };

  const handleSBGenerate = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      const saleid = lastTenderData.saleid;
      const Dono = lastTenderData.doc_no;
      const Companycode = lastTenderData.company_code;
      const Yearcode = lastTenderData.Year_Code;

      const updateApiUrl = `${API_URL}/Generate_SaleBill?DoNo=${Dono}&CompanyCode=${Companycode}&Year_Code=${Yearcode}&saleid=${saleid}`;
      const response = await axios.put(updateApiUrl);

      toast.success("Record updated successfully!");

      const changeNoValue = Dono;
      const fetchApiUrl = `${API_URL}/DOByid?company_code=${Companycode}&doc_no=${changeNoValue}&Year_Code=${Yearcode}`;

      const response2 = await axios.get(fetchApiUrl);
      const data = response2.data;

      CommonFeilds(data);
      setIsEditing(false);

      setIsLoading(false);
    } catch (error) {
      console.error("Error updating data:", error);
      toast.error("Failed to update data.");
      setIsLoading(false);
    }
  };


  const handleSaleBillTo = (code, accoid, name, mobileno, GSTNO, TDsApplicable, gststatecode, State_Name) => {
    setsalebilltocode(code);
    setsalebilltocodeacid(accoid);
    setsalebilltocodename(name);
    setsalebilltostatecode(gststatecode);
    setsalebilltostatename(State_Name);
    setFormData({
      ...formData,
      SaleBillTo: code,
      sb: accoid,
      SalebilltoGstStateCode: gststatecode,
    });
  };

  const handleVasuli_Ac = (code, accoid, name) => {
    setvasuliaccode(code);
    setvasuliaccodeacid(accoid);
    setvasuliaccodeacname(name);
    setFormData({
      ...formData,
      Vasuli_Ac: code,
      va: accoid,
    });
  };

  const handleGstRateCode = (code, rate) => {
    setGstCode(code);
    setGstRatecode(rate);
    setFormData({
      ...formData,
      GstRateCode: code,
    });
  };

  const handleGetpassGstStateCode = (code, name, gst) => {
    setgetpassstatecode(code);
    setgetpassstatecodename(name);

    setFormData({
      ...formData,
      GetpassGstStateCode: code,
    });
  };

  const handleVoucherbyGstStateCode = (code, name) => {
    setvoucherbystatecode(code);
    setvoucherbystatename(name);
    setFormData({
      ...formData,
      VoucherbyGstStateCode: code,
    });
  };

  const handleSalebilltoGstStateCode = (code, name) => {
    setsalebilltostatecode(code);
    setsalebilltostatename(name);
    setFormData({
      ...formData,
      SalebilltoGstStateCode: code,
    });
  };

  const handleMillGSTStateCode = (code, name) => {
    setmillstatecode(code);
    setmillstatename(name);
    setFormData({
      ...formData,
      MillGSTStateCode: code,
    });
  };

  const handleTransportGSTStateCode = (code, name) => {
    setTransportStateCode(code);
    settransportstatename(name);
    setFormData({
      ...formData,
      TransportGSTStateCode: code,
    });
  };

  const handlebrandcode = (code, accoid) => {
    setBrandCode(code);
    setBrandCodeAccoid(accoid);
    setFormData({
      ...formData,
      brandcode: code,
    });
  };

  const handleCashDiffAc = (code, accoid, name) => {
    setBPaccode(code);
    setBPaccodeacid(accoid);
    setBPaccodeacname(name);
    setFormData({
      ...formData,
      CashDiffAc: code,
      CashDiffAcId: accoid,
    });
  };

  const handleTDSAc = (code, accoid, name) => {
    setTDSACcode(code);
    setTDSACcodeacid(accoid);
    setTDSACcodeacname(name);
    setFormData({
      ...formData,
      TDSAc: code,
      TDSAcId: accoid,
    });
  };

  const handleItemSelect = (code, accoid, name) => {
    setItemSelect(code);
    setItemSelectAccoid(accoid);
    setItemSelectname(name);
    setFormData({
      ...formData,
      itemcode: code,
      ic: accoid,
    });
  };

  const handleBankCode = (code, accoid, name) => {
    setbankcode(code);
    setbankcodeacid(accoid);
    setbankcodeacname(name);
  };

  const handleCarporateDetailsFetched = (details) => {
    setCarporateno(details.last_Carporate_data[0]);
    let SellingType = details.last_Carporate_data[0].SellingType;
    newGETPASSCODE = details.last_Carporate_data[0].getpassselfac;
    voucherTitle = details.last_Carporate_data[0].Unitname;
    salebillTitle = details.last_Carporate_data[0].partyName;
    brokerTitle = details.last_Carporate_data[0].BrokerName;
    getpassTitle = details.last_Carporate_data[0].getpassselfname;

    const newData = {
      quantal: details.last_Carporate_data[0].balance,
      PDSType: details.last_Carporate_data[0].SellingType,
      PDSParty: details.last_Carporate_data[0].Ac_Code,
      PDSUnit: details.last_Carporate_data[0].Unitcode,
      SaleBillTo: details.last_Carporate_data[0].Ac_Code,
      sb: details.last_Carporate_data[0].ac,
      narration4: details.last_Carporate_data[0].partyName,
      voucher_by: details.last_Carporate_data[0].Unitcode,
      lblvoucherByname: details.last_Carporate_data[0].getpassselfname,
      lblsalebilltoname: details.last_Carporate_data[0].partyName,
      lblbrokername: details.last_Carporate_data[0].BrokerName,
      gp: details.last_Carporate_data[0].getpassselfacid,
      vb: details.last_Carporate_data[0].Unitid,
      broker: details.last_Carporate_data[0].BrokerCode,
      bk: details.last_Carporate_data[0].br,
      sale_rate: details.last_Carporate_data[0].Sale_Rate,
      Delivery_Type: details.last_Carporate_data[0].DeliveryType,
      newGETPASSCODE: details.last_Carporate_data[0].getpassselfac,
      Tender_Commission: details.last_Carporate_data[0].CommissionRate,
      VoucherbyGstStateCode: details.last_Carporate_data[0].UnitSatecode,
      VoucherByName: details.last_Carporate_data[0].unitstatename,
      SalebilltoGstStateCode: details.last_Carporate_data[0].acstatecode,
      lblBilltostatename: details.last_Carporate_data[0].acstatename,
    };

    setCarporateState(newData);
    setChangeData(true);
    setFormData((prevState) => ({
      ...prevState,
      ...newData,
    }));

    return newData;
  };

  useEffect(() => {
    if (selectedRecord) {
      handlerecordDoubleClicked();
    }
    else {
      handleAddOne();
    }
  }, [selectedRecord]);

  useEffect(() => {
    if (selectedRecordPendingDo) {
      handlerecordDoubleClickedPendingDO();
    } else {
      //handleAddOne();
    }
  }, [selectedRecordPendingDo]);

  const handleTenderWithoutCarpoDetailsFetched = async (details, event) => {
    let Carporate_Sale_No = formData.Carporate_Sale_No;
    let assingqntl = 0;
    let Dispatch_type =
      details.last_details_data[0].DT === "D"
        ? formData.desp_type === "DO"
        : "DI";

    if (Carporate_Sale_No === 0) {
      assingqntl = details.last_details_data[0].Quantal;
    } else {
      assingqntl = CarporateState.quantal;
    }
    const purcRate =
      parseFloat(details.last_details_data[0].Party_Bill_Rate) || 0;
    const exciseRate =
      parseFloat(details.last_details_data[0].Excise_Rate) || 0;
    const qtl = parseFloat(assingqntl) || 0;
    const rate = qtl !== 0 ? purcRate + exciseRate : 0;
    const millamount = qtl * rate;

    if (Dispatch_type === "DI") {
      setFormDataDetail((prevData) => {
        const newDetailData = {
          ...prevData,
          ddType: "T",
          Narration: "Transfer Letter",
          Amount: millamount,
          detail_Id: 1,
          Bank_Code: tenderDetails.Payment_To,
          bc: tenderDetails.pt,
          rowaction: "add",
        };
        setUsers([newDetailData]);
      });
    }

    setAutopurchase(details.last_details_data[0].AutoPurchaseBill);
    if (Carporate_Sale_No === 0) {
      const newData = {
        // purc_no : details.last_details_data[0].Quantal,
        quantal: details.last_details_data[0].Quantal,
        packing: details.last_details_data[0].Packing,
        bags: details.last_details_data[0].Bags,
        grade: details.last_details_data[0].Grade,
        excise_rate: details.last_details_data[0].Excise_Rate,
        mill_rate: details.last_details_data[0].Mill_Rate,
        Tender_Commission: details.last_details_data[0].CR,
        sale_rate: details.last_details_data[0].Sale_Rate,
        narration4: details.last_details_data[0].buyername,
        tenderdetailid: details.last_details_data[0].tenderdetailid,
        PurchaseRate: details.last_details_data[0].Party_Bill_Rate,
        Delivery_Type: details.last_details_data[0].DT,
        sb: details.last_details_data[0].buyerid,
        gp: details.last_details_data[0].Getpassnoid,
        ic: details.last_details_data[0].ic,
        bk: details.last_details_data[0].buyerpartyid,
        vb: details.last_details_data[0].buyerid,
        CashDiffAcId: details.last_details_data[0].buyerid,
        docd: details.last_details_data[0].td,
        SaleBillTo: details.last_details_data[0].Buyer,
        GETPASSCODE: details.last_details_data[0].Getpassno,
        lblgetpasscodename: details.last_details_data[0].Getpassnoname,
        voucher_by: details.last_details_data[0].Buyer,
        lblvoucherByname: details.last_details_data[0].buyername,
        DO: details.last_details_data[0].Tender_DO,
        CashDiffAc: details.last_details_data[0].Buyer,
        DO: details.last_details_data[0].Tender_DO,
        itemcode: details.last_details_data[0].itemcode,
        GstRateCode: details.last_details_data[0].gstratecode,
        broker: details.last_details_data[0].Buyer,
        SalebilltoGstStateCode: details.last_details_data[0].buyergststatecode,
        SaleBillByName: details.last_details_data[0].buyeridcitystate,
        VoucherbyGstStateCode: details.last_details_data[0].shiptostatecode,
        VoucherByName: details.last_details_data[0].shiptostatename,
        MillGSTStateCode: details.last_details_data[0].millstatecode,
        MillByName: details.last_details_data[0].millStatename,
        GetPassByName: details.last_details_data[0].Getpassnonamestatename,
        GetpassGstStateCode: details.last_details_data[0].Getpassnonamestatecode,

        Gst_Rate: details.last_details_data[0].gstrate,
        AutopurchaseBill: details.last_details_data[0].AutoPurchaseBill,
        desp_type: Dispatch_type,
      };

      let updatedFormData = await calculateDependentValues('quantal', qtl, { ...formData, ...newData });
      setFormData((prevState) => ({
        ...prevState,
        ...updatedFormData,
        amount: millamount
      }));
      setGstRatecode(details.last_details_data[0].gstrate)
      setTenderDetails(details.last_details_data[0]);

      // setTenderno(details.last_details_data[0].Tender_No);
      return updatedFormData;

    }
  };


  const handleTenderDetailsFetched = async (details) => {
    setTenderDetails(details.last_details_data[0]);
    let Carporate_Sale_No = formData.Carporate_Sale_No;
    let assingqntl = 0;

    if (Carporate_Sale_No === 0) {
      assingqntl = details.last_details_data[0].Quantal;
    } else {

      assingqntl = CarporateState.quantal;
    }
    const purcRate =
      parseFloat(details.last_details_data[0].Party_Bill_Rate) || 0;
    const exciseRate =
      parseFloat(details.last_details_data[0].Excise_Rate) || 0;
    const qtl = parseFloat(assingqntl) || 0;
    const rate = qtl !== 0 ? purcRate + exciseRate : 0;
    const millamount = qtl * rate;
    setFormDataDetail((prevData) => {
      const newDetailData = {
        ...prevData,
        ddType: "T",
        Narration: "Transfer Letter",
        Amount: millamount,
        detail_Id: 1,
        Bank_Code: tenderDetails.Payment_To,
        bc: tenderDetails.pt,
        rowaction: "add",
      };
      setUsers([newDetailData]);
    });

    if (Carporate_Sale_No != 0) {
      voucherTitle = CarporateState.lblvoucherByname;
      salebillTitle = CarporateState.lblsalebilltoname;
      brokerTitle = CarporateState.brokername;
      getpassTitle = CarporateState.getpassselfname;

      const newData = {
        packing: details.last_details_data[0].Packing,
        bags: details.last_details_data[0].Bags,
        grade: details.last_details_data[0].Grade,
        excise_rate: details.last_details_data[0].Excise_Rate,
        mill_rate: details.last_details_data[0].Mill_Rate,
        narration4: details.last_details_data[0].buyername,
        tenderdetailid: details.last_details_data[0].tenderdetailid,
        PurchaseRate: details.last_details_data[0].Party_Bill_Rate,
        ic: details.last_details_data[0].ic,
        CashDiffAcId: details.last_details_data[0].buyerid,
        docd: details.last_details_data[0].td,
        itemcode: details.last_details_data[0].itemcode,
        ic: details.last_details_data[0].ic,
        GstRateCode: details.last_details_data[0].gstratecode,
        Gst_Rate: details.last_details_data[0].gstrate,
        newPurcno: details.last_details_data[0].Tender_No,
        SalebilltoGstStateCode: details.last_details_data[0].acstatecode,
        SaleBillByName: details.last_details_data[0].acstatename,
        VoucherbyGstStateCode: details.last_details_data[0].unitstatecode,
        VoucherByName: details.last_details_data[0].unitstatename,
      };


      let updatedFormData = await calculateDependentValues('quantal', qtl, { ...formData, ...newData });

      setCarporateState(newData);
      setCarporateState((prevState) => ({
        ...prevState,
        ...updatedFormData,
      }));
      setFormData((prevState) => ({
        ...prevState,
        ...updatedFormData,
      }));
      setChangeData(true);
    }
    if (Carporate_Sale_No === "") {
      const newData = {
        quantal: details.last_details_data[0].Quantal,
        packing: details.last_details_data[0].Packing,
        bags: details.last_details_data[0].Bags,
        grade: details.last_details_data[0].Grade,
        excise_rate: details.last_details_data[0].Excise_Rate,
        mill_rate: details.last_details_data[0].Mill_Rate,
        Tender_Commission: details.last_details_data[0].Commission_Rate,
        sale_rate: details.last_details_data[0].Sale_Rate,
        narration4: details.last_details_data[0].buyername,
        tenderdetailid: details.last_details_data[0].tenderdetailid,
        PurchaseRate: details.last_details_data[0].Party_Bill_Rate,
        Delivery_Type: details.last_details_data[0].DT,
        sb: details.last_details_data[0].buyerid,
        gp: details.last_details_data[0].buyerid,
        ic: details.last_details_data[0].ic,
        bk: details.last_details_data[0].buyerpartyid,
        vb: details.last_details_data[0].buyerid,
        CashDiffAcId: details.last_details_data[0].buyerid,
        docd: details.last_details_data[0].td,
        SaleBillTo: details.last_details_data[0].Buyer,
        GETPASSCODE: details.last_details_data[0].Buyer,
        voucher_by: details.last_details_data[0].Buyer,
        lblvoucherByname: details.last_details_data[0].buyername,
        DO: details.last_details_data[0].Tender_DO,
        CashDiffAc: details.last_details_data[0].Buyer,
        DO: details.last_details_data[0].Tender_DO,
        itemcode: details.last_details_data[0].itemcode,
        GstRateCode: details.last_details_data[0].gstratecode,
        broker: details.last_details_data[0].Buyer,
        SalebilltoGstStateCode: details.last_details_data[0].Buyer,
        VoucherbyGstStateCode: details.last_details_data[0].Buyer,
        GetpassGstStateCode: details.last_details_data[0].Buyer,
        Gst_Rate: details.last_details_data[0].gstrate,
      };
      let updatedFormData = await calculateDependentValues('quantal', formData.quantal, { ...formData, ...newData });
      setFormData((prevState) => ({
        ...prevState,
        ...updatedFormData,
      }));
      assingqntl = ""
      return updatedFormData;
    }
  };

  const AmountCalculation = async (name, input, formData) => {
    formData = {
      ...formData,
      TCS_Rate: 0.00,
      Sale_TCS_Rate: 0.00,
      SaleTDSRate: 0.00,
      PurchaseTDSRate: 0.00,
    }

    let updatedFormData = { ...formData, [name]: input };
    let Amount = 0.00;
    let Amountf = 0.00;
    let SaleBillTo = updatedFormData.SaleBillTo;
    let Amt = 0.00;
    let SBBalAmt = 0.00;
    let gstRateExise = parseFloat(updatedFormData.excise_Rate) || 0.00
    let saleRate = 0.00;
    let actualSaleRate = parseFloat(updatedFormData.sale_rate) || 0.00
    let commision = parseFloat(updatedFormData.Tender_Commission) || 0.00
    let insurance = parseFloat(updatedFormData.Insurance) || 0.00
    let qt = parseFloat(updatedFormData.quantal) || 0.00;
    let SaleTDS = 0.00
    let PurchaseTDS = 0.00;

    let PSAmt = 0.00;
    let PSBalAmt = 0.00;
    let PSRate = parseFloat(updatedFormData.PurchaseRate) || 0.00;
    let PSAmountf = 0.00;
    let PSAmount = 0.00;
    let purcno = updatedFormData.purc_no || Tenderno || newPurcno
    let TCS_Rate = 0.00
    let Sale_TCS_Rate = 0.00
    let SaleTDSRate = 0.00
    let PurchaseTDSRate = 0.00

    const updateApiUrl = `${API_URL}/getAmountcalculationData?CompanyCode=${companyCode}&SalebilltoAc=${SaleBillTo}&Year_Code=${Year_Code}&purcno=${purcno}`;

    const response = await axios.get(updateApiUrl);
    const details = response.data;

    PSBalAmt = PSRate * qt;
    PSAmountf = details['PSAmt']
    Amountf = details['SBAmt']
    let balancelimit = details['Balancelimt']
    PurchaseTDS = details['PurchaseTDSApplicable']
    SaleTDS = details['SaleTDSApplicable_Data']
    PurchaseTDSRate = details['PurchaseTDSRate']
    let TCSRate = details['TCSRate']
    SaleTDSRate = details['SaleTDSRate']

    if (PSAmountf == 0) {
      PSAmountf = 0.00
    }
    PSAmount = PSAmountf + PSBalAmt;

    if (PSAmount >= balancelimit) {
      if (PurchaseTDS == "N") {
        updatedFormData.PurchaseTDSRate = 0.00;
        updatedFormData.TCS_Rate = TCSRate
      }
      else if (PurchaseTDS == "Y" || PurchaseTDS == "P") {
        updatedFormData.PurchaseTDSRate = PurchaseTDSRate
        updatedFormData.TCS_Rate = 0.00;
      }
    }
    else {
      updatedFormData.PurchaseTDSRate = 0.00;
      if (PurchaseTDS == "P") {
        updatedFormData.PurchaseTDSRate = PurchaseTDSRate
        updatedFormData.TCS_Rate = 0.00;
      }
      else if (PurchaseTDS == "B") {
        updatedFormData.PurchaseTDSRate = 0.00;
        updatedFormData.TCS_Rate = TCSRate
      }
      updatedFormData.TCS_Rate = 0.00;

    }

    if (PurchaseTDS == "L") {
      alert('Purchase Party Is Lock !');

    }
    if (SaleTDS == "L") {
      alert('Sale Party Is Lock !');

    }
    saleRate = actualSaleRate + commision + insurance;
    SBBalAmt = (saleRate * gstRate) / 100 + saleRate * qt;
    if (Amountf == 0) {
      Amountf = 0.00
    }
    Amountf = Amountf || 0.00;
    Amountf = parseFloat(Amountf);
    Amount = Amountf + SBBalAmt;
    if (Amount >= balancelimit) {
      if (SaleTDS == "Y" || SaleTDS == "S") {
        updatedFormData.SaleTDSRate = SaleTDSRate
        updatedFormData.Sale_TCS_Rate = 0.00
      }

      else if (SaleTDS == "U") {

        alert('Unregistered Person, Limit Exceeded over sale Limit!');
      }

      else {
        updatedFormData.SaleTDSRate = 0.00
        updatedFormData.Sale_TCS_Rate = TCSRate
      }
    }
    else {
      updatedFormData.SaleTDSRate = 0.00

      updatedFormData.Sale_TCS_Rate = 0.00
      if (PurchaseTDS == "B") {
        updatedFormData.TCS_Rate = TCSRate
      }
      if (SaleTDS == "S") {
        updatedFormData.SaleTDSRate = SaleTDSRate
        updatedFormData.Sale_TCS_Rate = 0.00
      }
      if (SaleTDS == "T") {
        updatedFormData.SaleTDSRate = 0.00;
        updatedFormData.Sale_TCS_Rate = TCSRate
      }

    }
    return updatedFormData;
  }

  //calculating memo gstamount
  const calculatememogstrateamount = async (
    name,
    input,
    formData,
    GSTMemoGstrate,
    matchStatus
  ) => {

    let updatedFormData = { ...formData, [name]: input };
    const RCMCGSTAmt = parseFloat(updatedFormData.MM_Rate) || 0.0;
    const RCMSGSTAmt = parseFloat(updatedFormData.MM_Rate) || 0.0;
    const RCMIGSTAmt = parseFloat(updatedFormData.MM_Rate) || 0.0;
    let rate = parseFloat(GSTMemoGstrate) || 0.0;
    let cgstrate = 0.0;
    let sgstrate = 0.0;
    let igstrate = 0.0;

    if (matchStatus === "TRUE") {
      cgstrate = (rate / 2).toFixed(2);
      sgstrate = (rate / 2).toFixed(2);
      igstrate = 0.0;

      updatedFormData.RCMCGSTAmt = (
        (updatedFormData.Memo_Advance * cgstrate) /
        100
      ).toFixed(2);

      updatedFormData.RCMSGSTAmt = (
        (updatedFormData.Memo_Advance * sgstrate) /
        100
      ).toFixed(2);

      updatedFormData.RCMIGSTAmt = 0.0;
    } else {
      cgstrate = 0.0;
      sgstrate = 0.0;
      igstrate = rate.toFixed(2);

      updatedFormData.RCMIGSTAmt = (
        (updatedFormData.Memo_Advance * igstrate) /
        100
      ).toFixed(2);

      updatedFormData.RCMCGSTAmt = 0.0;
      updatedFormData.RCMSGSTAmt = 0.0;
    }

    return updatedFormData;
  };


  const CommisionBillCalculation = async (name, input, formData, gstRate) => {
    formData = {
      ...formData,
      LV_CGSTAmount: 0.00,
      LV_SGSTAmount: 0.00,
      LV_IGSTAmount: 0.00,
      LV_TotalAmount: 0.00,
      LV_TCSRate: 0.00,
      LV_NETPayble: 0.00,
      LV_TCSAmt: 0.00,
      LV_TDSRate: 0.00,
      LV_TDSAmt: 0.00,
      LV_Igstrate: 0.00,
      LV_Cgstrate: 0.00,
      LV_taxableamount: 0.00,
      LV_Sgstrate: 0.00,
      LV_Commision_Amt: 0.00,
      LV_tender_Commision_Amt: 0.00
    };
    let updatedFormData = { ...formData, [name]: input };
    let LV_tender_Commision_Amt = 0.00
    let GSTRate = gstRate
    let igstrate = 0.00;
    let sgstrate = 0.00;
    let cgstrate = 0.00;
    let DIFF_AMOUNT = parseFloat(updatedFormData.diff_amount) || 0.00;
    let MEMO_ADVANCE = parseFloat(updatedFormData.Memo_Advance) || 0.00;
    let taxableamount = parseFloat(DIFF_AMOUNT + MEMO_ADVANCE) || 0.00;
    let DiffMemo = parseFloat(DIFF_AMOUNT + MEMO_ADVANCE) || 0.00;
    let salebillto = updatedFormData.SaleBillTo;
    const matchStatus = await checkMatchStatus(salebillto, companyCode, Year_Code);
    let LV_CGSTAmount = 0.00;
    let LV_SGSTAmount = 0.00;
    let LV_IGSTAmount = 0.00;
    let LV_TotalAmount = 0.00;
    let LV_TCSRate = 0.00;
    let LV_NETPayble = 0.00;
    let LV_TCSAmt = 0.00;
    let LV_TDSRate = 0.00;
    let LV_TDSAmt = 0.00;
    if (DiffMemo != 0) {

      if (matchStatus == "TRUE") {
        sgstrate = (GSTRate / 2).toFixed(2);
        cgstrate = (GSTRate / 2).toFixed(2);
        LV_CGSTAmount = Math.round(parseFloat(((DIFF_AMOUNT + MEMO_ADVANCE) * cgstrate) / 100));
        LV_SGSTAmount = Math.round(parseFloat(((DIFF_AMOUNT + MEMO_ADVANCE) * sgstrate) / 100));
        igstrate = 0.00;
        LV_IGSTAmount = 0;
      }
      else {
        igstrate = GSTRate;
        LV_IGSTAmount = Math.round(parseFloat(((DIFF_AMOUNT + MEMO_ADVANCE) * igstrate) / 100));
        cgstrate = 0;
        sgstrate = 0;
        LV_SGSTAmount = 0.00;
        LV_CGSTAmount = 0.00;
      }

    }

    LV_TotalAmount = Math.round(parseFloat((DIFF_AMOUNT + MEMO_ADVANCE) + LV_CGSTAmount + LV_SGSTAmount + LV_IGSTAmount));
    LV_TCSRate = parseFloat(updatedFormData.Sale_TCS_Rate) || 0;
    LV_TCSAmt = Math.round(parseFloat((LV_TotalAmount * LV_TCSRate) / 100));
    LV_NETPayble = Math.round(parseFloat((LV_TotalAmount + LV_TCSAmt)));
    LV_TDSRate = parseFloat(updatedFormData.SaleTDSRate) || 0.00;
    LV_TDSAmt = parseFloat((LV_TotalAmount * LV_TDSRate) / 100);
    let LV_diff_rate = parseFloat(updatedFormData.diff_rate) || 0.00;
    let LV_Tender_Commission = parseFloat(updatedFormData.Tender_Commission) || 0.00;

    let LV_Commision_Amt = parseFloat(LV_diff_rate - LV_Tender_Commission)
    LV_tender_Commision_Amt = parseFloat(LV_tender_Commision_Amt * parseFloat(updatedFormData.quantal)) || 0.00
    LV_NETPayble = LV_NETPayble;

    updatedFormData.LV_CGSTAmount = LV_CGSTAmount
    updatedFormData.LV_SGSTAmount = LV_SGSTAmount
    updatedFormData.LV_IGSTAmount = LV_IGSTAmount
    updatedFormData.LV_TotalAmount = LV_TotalAmount
    updatedFormData.LV_TCSRate = LV_TCSRate
    updatedFormData.LV_NETPayble = LV_NETPayble
    updatedFormData.LV_TCSAmt = LV_TCSAmt
    updatedFormData.LV_TDSRate = LV_TDSRate
    updatedFormData.LV_TDSAmt = LV_TDSAmt
    updatedFormData.LV_Igstrate = igstrate
    updatedFormData.LV_Cgstrate = cgstrate
    updatedFormData.LV_Sgstrate = sgstrate
    updatedFormData.LV_taxableamount = taxableamount
    updatedFormData.LV_Commision_Amt = LV_Commision_Amt
    updatedFormData.LV_tender_Commision_Amt = LV_tender_Commision_Amt

    if (LV_NETPayble > 0) {
      updatedFormData.voucher_type = "LV";
    }
    else {
      updatedFormData.voucher_type = "CV";
    }
    return updatedFormData;

  }

  const PurchaseBillCalculation = async (name, input, formData, gstRate) => {
    let updatedFormData = { ...formData, [name]: input };
    formData = {
      ...formData,
      PS_CGSTAmount: 0.0,
      PS_SGSTAmount: 0.0,
      PS_IGSTAmount: 0.0,
      PS_CGSTRATE: 0.0,
      PS_SGSTRATE: 0.0,
      PS_IGSTRATE: 0.0,
      TOTALPurchase_Amount: 0.0,
      PSTCS_Amt: 0.0,
      PSTDS_Amt: 0.0,
      PSNetPayble: 0.0,
      PS_SelfBal: 0.0,
      PS_amount: 0.0,
    };

    let rate = gstRate;
    let DESP_TYPE = updatedFormData.desp_type;
    let Getpasscode = updatedFormData.GETPASSCODE;
    let SELFAC = CompanyparametrselfAc;
    let autopurchasebill = Autopurchase;
    let PaymentGst = tenderDetails.Payment_To || bankcodenew;
    let Purchase_Rate = parseFloat(updatedFormData.PurchaseRate);
    let qntl = parseFloat(updatedFormData.quantal);
    let PS_amount = 0;
    let PS_CGSTAmount = 0.0;
    let PS_SGSTAmount = 0.0;
    let PS_IGSTAmount = 0.0;
    let cgstrate = 0.0;
    let sgstrate = 0.0;
    let igstrate = 0.0;
    let TOTALPurchase_Amount = 0.0;
    let TCS_Amt = 0.0;
    let TDS_Amt = 0.0;
    let NetPayble = 0.0;
    let PS_SelfBal = 0.0;
    let PSgepasscode = updatedFormData.GETPASSCODE;
    let PSsalebillto = updatedFormData.SaleBillTo;
    let PSTCS_Amt = 0.0;
    let PSTDS_Amt = 0.0;
    let PSNetPayble = 0.0;
    let PurchaseTDSrate = 0.0;
    let PSTCS_Rate = 0.0;

    if (DESP_TYPE == "DI" && (Getpasscode == SELFAC || PDSType == "P")) {
      if (autopurchasebill == "Y") {
        updatedFormData.voucher_type = "PS";

        PS_amount = Math.round(parseFloat(Purchase_Rate * qntl));

        if (PaymentGst == "" || PaymentGst == "0") {
          PaymentGst = updatedFormData.mill_code;
        }

        const matchStatus = await checkMatchStatus(
          PaymentGst,
          companyCode,
          Year_Code
        );

        if (matchStatus == "TRUE") {
          cgstrate = (rate / 2).toFixed(2);
          sgstrate = (rate / 2).toFixed(2);
          igstrate = 0.0;

          PS_CGSTAmount = Math.round(parseFloat((PS_amount * cgstrate) / 100));
          PS_SGSTAmount = Math.round(parseFloat((PS_amount * sgstrate) / 100));
          PS_IGSTAmount = 0;
        } else {
          cgstrate = 0;
          sgstrate = 0;
          igstrate = (rate / 2).toFixed(2);

          PS_CGSTAmount = 0;
          PS_SGSTAmount = 0;
          PS_IGSTAmount = Math.round(parseFloat((PS_amount * igstrate) / 100));
        }

        TOTALPurchase_Amount = Math.round(
          parseFloat(PS_amount + PS_CGSTAmount + PS_SGSTAmount + PS_IGSTAmount)
        );
        PSTCS_Amt = Math.round(
          (parseFloat(TOTALPurchase_Amount) * PSTCS_Rate) / 100
        );
        PSTDS_Amt = Math.round((parseFloat(PS_amount) * PurchaseTDSrate) / 100);
        PSNetPayble =
          parseFloat(TOTALPurchase_Amount) +
          parseFloat(PSTCS_Amt) -
          parseFloat(PSTDS_Amt);

        if (PSgepasscode == SELFAC && PSsalebillto == SELFAC) {
          PS_SelfBal = "Y";
        } else {
          PS_SelfBal = "N";
        }
      }
    }

    updatedFormData.PS_CGSTAmount = PS_CGSTAmount;
    updatedFormData.PS_SGSTAmount = PS_SGSTAmount;
    updatedFormData.PS_IGSTAmount = PS_IGSTAmount;
    updatedFormData.PS_CGSTRATE = cgstrate;
    updatedFormData.PS_SGSTRATE = sgstrate;
    updatedFormData.PS_IGSTRATE = igstrate;
    updatedFormData.TOTALPurchase_Amount = TOTALPurchase_Amount;
    updatedFormData.PSTCS_Amt = PSTCS_Amt;
    updatedFormData.PSTDS_Amt = PSTDS_Amt;
    updatedFormData.PSNetPayble = PSNetPayble;
    updatedFormData.PS_SelfBal = PS_SelfBal;
    updatedFormData.PS_amount = PS_amount;
    return updatedFormData;
  };

  const saleBillCalculation = async (name, input, formData, gstRate) => {
    formData = {
      ...formData,
      cgstrate: 0,
      sgstrate: 0,
      igstrate: 0,
      cgstamt: 0,
      sgstamt: 0,
      igstamt: 0,
      SaleDetail_Rate: 0,
      SB_freight: 0,
      SB_SubTotal: 0,
      SB_Less_Frt_Rate: 0,
      TotalGstSaleBillAmount: 0,
      TaxableAmountForSB: 0,
      Roundoff: 0,
      SBTCSAmt: 0,
      Net_Payble: 0,
      SBTDSAmt: 0,
      item_Amount: 0,
      SB_Ac_Code: 0,
      SB_Unit_Code: 0,
    };

    let updatedFormData = { ...formData, [name]: input };

    let rate = parseFloat(gstRate) || 0.0;
    let cgstrate = (rate / 2).toFixed(2);
    let sgstrate = (rate / 2).toFixed(2);
    let igstrate = 0.0;

    cgstrate = (rate / 2).toFixed(2);
    sgstrate = (rate / 2).toFixed(2);
    igstrate = (rate).toFixed(2);

    let RATES = 0.0;
    let SALE_RATE = parseFloat(updatedFormData.sale_rate) || 0.0;
    let FRIEGHT_RATE = parseFloat(updatedFormData.FreightPerQtl) || 0.0;
    let TenderCommision = parseFloat(updatedFormData.Tender_Commission) || 0.0;
    let VASULI_RATE_1 = parseFloat(updatedFormData.vasuli_rate1) || 0.0;
    let VASULI_AMOUNT_1 = parseFloat(updatedFormData.vasuli_amount1) || 0.0;
    let MEMO_ADVANCE = parseFloat(updatedFormData.Memo_Advance) || 0.0;

    let MM_Rate = parseFloat(updatedFormData.MM_Rate) || 0.0;

    let insurance = parseFloat(updatedFormData.Insurance) || 0.0;
    let lessfrtwithgst =
      SALE_RATE - FRIEGHT_RATE + TenderCommision + insurance - VASULI_RATE_1;
    RATES = SALE_RATE + TenderCommision + insurance;
    let SaleForNaka = RATES - FRIEGHT_RATE + MM_Rate;
    let expbamt = 0.0;
    let BillRoundOff = 0.0;
    let TaxableAmountForSB = 0.0;
    let Delivery_Type = updatedFormData.Delivery_Type;
    let qntl = updatedFormData.quantal;
    let SB_SaleRate = 0.0;
    let Carporate_Sale_No = updatedFormData.Carporate_Sale_No;

    if (Delivery_Type == "C") {
      TaxableAmountForSB = Math.round(
        parseFloat(RATES * qntl + MEMO_ADVANCE + VASULI_AMOUNT_1)
      );
    } else {
      if (Carporate_Sale_No == "0" || Carporate_Sale_No == "") {
        if (Delivery_Type == "N") {
          SB_SaleRate = parseFloat(
            (SaleForNaka / (SaleForNaka + (SaleForNaka * rate) / 100)) *
            SaleForNaka
          );
          SB_SaleRate = Math.round((SB_SaleRate + Number.EPSILON) * 100) / 100;
          expbamt = parseFloat(SaleForNaka * qntl);
        } else if (Delivery_Type == "A") {
          SB_SaleRate = SaleForNaka;
          var frieght = VASULI_RATE_1 * qntl;
          TaxableAmountForSB = SaleForNaka * qntl + frieght;
        } else {
          SB_SaleRate = lessfrtwithgst;
        }

        if (Delivery_Type == "N") {
          TaxableAmountForSB = Math.round(
            parseFloat((SB_SaleRate + VASULI_RATE_1) * qntl)
          );
        } else if (Delivery_Type == "A") {
        } else {
          TaxableAmountForSB = Math.round(parseFloat(SB_SaleRate * qntl));
        }
      } else {
        if (Delivery_Type == "N") {
          SB_SaleRate = parseFloat(
            (SaleForNaka / (SaleForNaka + (SaleForNaka * rate) / 100)) *
            SaleForNaka
          );
          SB_SaleRate = Math.round((SB_SaleRate + Number.EPSILON) * 100) / 100;
          expbamt = parseFloat(SaleForNaka * qntl);
        } else if (Delivery_Type == "A") {
          SB_SaleRate = SaleForNaka;
          SB_SaleRate = Math.round((SB_SaleRate + Number.EPSILON) * 100) / 100;
          expbamt = parseFloat(SaleForNaka * qntl);
        } else {
          SB_SaleRate = lessfrtwithgst;
        }
        if (Delivery_Type == "A") {
          TaxableAmountForSB = Math.round(
            parseFloat(
              (SB_SaleRate - (VASULI_RATE_1 + FRIEGHT_RATE) + MM_Rate) * qntl
            )
          );
        } else {
          TaxableAmountForSB = Math.round(parseFloat(SB_SaleRate * qntl));
        }
      }
    }

    let Sb_CheckState = 0;
    if (pdspartystatecode != "0" && pdspartystatecode != "") {
      Sb_CheckState = pdspartystatecode;
    } else if (pdsBilltostatecode != "0" && pdsBilltostatecode != "") {
      Sb_CheckState = pdsBilltostatecode;
    } else {
      Sb_CheckState = updatedFormData.SaleBillTo;
    }

    const matchStatus = await checkMatchStatus(
      Sb_CheckState,
      companyCode,
      Year_Code
    );
    let SB_CGSTAmount = 0.0;
    let SB_SGSTAmount = 0.0;
    let SB_IGSTAmount = 0.0;

    if (matchStatus == "TRUE") {
      SB_CGSTAmount = parseFloat((TaxableAmountForSB * cgstrate) / 100);
      SB_CGSTAmount = Math.round((SB_CGSTAmount + Number.EPSILON) * 100) / 100;

      SB_SGSTAmount = parseFloat((TaxableAmountForSB * sgstrate) / 100);
      SB_SGSTAmount = Math.round((SB_SGSTAmount + Number.EPSILON) * 100) / 100;
      SB_IGSTAmount = 0.0;
      igstrate = 0;
    } else {
      SB_CGSTAmount = 0.0;
      cgstrate = 0;
      SB_SGSTAmount = 0.0;
      sgstrate = 0;
      SB_IGSTAmount = parseFloat((TaxableAmountForSB * igstrate) / 100);
      SB_IGSTAmount = Math.round((SB_IGSTAmount + Number.EPSILON) * 100) / 100;
    }
    let TotalGstSaleBillAmount = 0;
    let SB_Other_Amount = parseFloat(updatedFormData.SB_Other_Amount) || 0.0;
    TotalGstSaleBillAmount = parseFloat(
      TaxableAmountForSB +
      SB_CGSTAmount +
      SB_SGSTAmount +
      SB_IGSTAmount +
      SB_Other_Amount
    );

    let Roundoff = 0.0;
    let SB_SubTotal = 0.0;
    let SB_Ac_Code = 0;
    let SB_Unit_Code = 0;

    if (PDSType == "P") {
      SB_Ac_Code = PDSParty;
      SB_Unit_Code = PDSUnit;

      if (Delivery_Type == "C") {
        Roundoff = Math.round(
          parseFloat(
            TotalGstSaleBillAmount -
            (TaxableAmountForSB +
              SB_CGSTAmount +
              SB_SGSTAmount +
              SB_IGSTAmount +
              SB_Other_Amount)
          )
        );

        SB_SubTotal = Math.round(parseFloat(qntl * RATES));
      } else {
        Roundoff = Math.round(
          parseFloat(
            TotalGstSaleBillAmount -
            (TaxableAmountForSB +
              SB_CGSTAmount +
              SB_SGSTAmount +
              SB_IGSTAmount +
              SB_Other_Amount)
          )
        );

        SB_SubTotal = Math.round(parseFloat(qntl * SB_SaleRate));
      }
    } else {
      SB_Ac_Code = updatedFormData.SaleBillTo;
      SB_Unit_Code = updatedFormData.voucher_by;

      if (Delivery_Type == "C") {
        Roundoff = Math.round(
          parseFloat(
            TotalGstSaleBillAmount -
            (TaxableAmountForSB +
              SB_CGSTAmount +
              SB_SGSTAmount +
              SB_IGSTAmount)
          )
        );
        SB_SubTotal = Math.round(parseFloat(qntl * RATES));
      } else {
        Roundoff = Math.round(
          parseFloat(
            TotalGstSaleBillAmount -
            (TaxableAmountForSB +
              SB_CGSTAmount +
              SB_SGSTAmount +
              SB_IGSTAmount)
          )
        );
        SB_SubTotal = Math.round(
          parseFloat(qntl * SB_SaleRate) - (MEMO_ADVANCE + VASULI_AMOUNT_1)
        );
      }
    }
    let SB_Less_Frt_Rate = 0.0;
    let SB_freight = 0.0;
    let item_Amount = 0.0;
    let SaleDetail_Rate = 0.0;

    if (Delivery_Type == "C") {
      SB_Less_Frt_Rate = Math.round(parseFloat(MM_Rate + VASULI_RATE_1));
      SB_freight = Math.round(parseFloat(MEMO_ADVANCE + VASULI_AMOUNT_1));

      item_Amount = Math.round(parseFloat(RATES * qntl + 0));
      SaleDetail_Rate = RATES;
    } else {
      SB_Less_Frt_Rate = Math.round(parseFloat(MM_Rate + VASULI_RATE_1));
      SB_freight = Math.round(parseFloat(MEMO_ADVANCE + VASULI_AMOUNT_1));

      item_Amount = Math.round(
        parseFloat(SB_SaleRate * qntl - MEMO_ADVANCE - VASULI_AMOUNT_1 + 0)
      );
      SB_SaleRate = SB_SubTotal / qntl;

      SaleDetail_Rate = SB_SaleRate;
    }

    let TCSRate_sale = updatedFormData.Sale_TCS_Rate;
    let TCSAmt = Math.round(
      (parseFloat(TotalGstSaleBillAmount) * TCSRate_sale) / 100
    );
    let cashdiffvalue = updatedFormData.Cash_diff;
    let cashdiff = SALE_RATE - cashdiffvalue;
    let SaleTDS = updatedFormData.SaleTDSRate;
    let TDSAmt = parseFloat(cashdiff * SaleTDS);

    let Net_Payble = Math.round(parseFloat(TotalGstSaleBillAmount) + TCSAmt);
    if (Delivery_Type == "N") {
      Roundoff = Math.round(TotalGstSaleBillAmount) - TotalGstSaleBillAmount;
    } else {
      Roundoff = Math.round(TotalGstSaleBillAmount) - TotalGstSaleBillAmount;
    }

    TotalGstSaleBillAmount = TotalGstSaleBillAmount + Roundoff;

    updatedFormData.cgstrate = cgstrate;
    updatedFormData.sgstrate = sgstrate;
    updatedFormData.igstrate = igstrate;
    updatedFormData.cgstamt = SB_CGSTAmount;
    updatedFormData.sgstamt = SB_SGSTAmount;
    updatedFormData.igstamt = SB_IGSTAmount;
    updatedFormData.SaleDetail_Rate = SaleDetail_Rate;
    updatedFormData.SB_freight = SB_freight;
    updatedFormData.SB_SubTotal = SB_SubTotal;
    updatedFormData.SB_Less_Frt_Rate = SB_Less_Frt_Rate;
    updatedFormData.TotalGstSaleBillAmount = TotalGstSaleBillAmount;
    updatedFormData.TaxableAmountForSB = TaxableAmountForSB;
    updatedFormData.Roundoff = Roundoff;
    updatedFormData.SBTCSAmt = TCSAmt;
    updatedFormData.Net_Payble = Net_Payble;
    updatedFormData.SBTDSAmt = TDSAmt;
    updatedFormData.item_Amount = item_Amount;
    updatedFormData.SB_Ac_Code = SB_Ac_Code;
    updatedFormData.SB_Unit_Code = SB_Unit_Code;

    return updatedFormData;
  };

  const handleKeyDownCalculations = async (event) => {

    if (event.key === "Tab") {
      const { name, value } = event.target;
      const updatedFormData = await calculateDependentValues(
        name,
        value,
        formData,
        matchStatus,
        Gst_Rate
      );

      setFormData(updatedFormData);

      setFormDataDetail((prevState) => ({
        ...prevState,
        Amount: updatedFormData.amount,
      }));
      setUsers((prevUsers) =>
        prevUsers.map((user) => ({
          ...user,
          Amount: updatedFormData.amount
        }))
      );
      if (updatedFormData.SaleBillTo !== 0) {
        const TDSTCSData = await AmountCalculation(
          name,
          value,
          updatedFormData
        );
        setFormData(TDSTCSData);
      }

    }
  }

  const calculateDependentValues = async (name, input, formData) => {
    let updatedFormData = { ...formData, [name]: input };
    const updatedFormDataDetail = { ...formDataDetail, [name]: input };
    let MMRate = parseFloat(updatedFormData.MM_Rate) || 0.0;
    let millamount = parseFloat(updatedFormData.amount) || 0.0;
    const PurcTcsRate = parseFloat(updatedFormData.TCS_Rate) || 0.0;
    const PurcTdsRate = parseFloat(updatedFormData.PurchaseTDSRate) || 0.0;
    const qntl = parseFloat(updatedFormData.quantal) || 0.0;
    const millamounttcs = millamount * PurcTcsRate * 100;
    const millamounttds = millamount * PurcTdsRate * 100;
    const purc_Rate = parseFloat(updatedFormData.PurchaseRate) || 0;
    const excise_Rate = parseFloat(updatedFormData.excise_rate) || 0;
    const MemoGST_Rate = parseFloat(GSTMemoGstcode) || 0;
    const salerate = parseFloat(updatedFormData.sale_rate) || 0;
    const insurance = parseFloat(updatedFormData.insurance) || 0;

    const rate = qntl !== 0 ? purc_Rate + excise_Rate : 0;
    millamount = qntl * rate;
    updatedFormData.amount = millamount;
    updatedFormData.final_amout = millamount;
    updatedFormData.Mill_AmtWO_TCS = millamount + millamounttcs;

    updatedFormData.bags = parseFloat((qntl / updatedFormData.packing) * 100);

    if (GSTMemoGstrate > 0) {
      const matchStatus = await checkMatchStatus(
        updatedFormData.transport,
        companyCode,
        Year_Code
      );
      if (GSTMemoGstrate != 0) {
        updatedFormData = await calculatememogstrateamount(
          name,
          input,
          updatedFormData,
          GSTMemoGstrate,
          matchStatus
        );
      }
    }
    let MemoAdvance = parseFloat(updatedFormData.Memo_Advance) || 0.0;
    updatedFormData.MM_Rate = parseFloat(MemoAdvance / qntl);

    let diffrate = 0.0;
    let diffamount = 0.0;
    diffrate = parseFloat(salerate - purc_Rate);
    diffamount = parseFloat(diffrate * qntl);
    updatedFormData.diff_rate = diffrate;
    updatedFormData.diff_amount = diffamount;

    let Frieghtrate = parseFloat(updatedFormData.FreightPerQtl) || 0.0;
    let Frieghtamt = parseFloat(updatedFormData.Freight_Amount) || 0.0;
    let vasulirate = parseFloat(updatedFormData.vasuli_rate) || 0.0;
    let vasuliamt = 0.0;
    if (qntl != 0 && Frieghtrate != 0) {
      Frieghtamt = parseFloat(qntl * Frieghtrate);
    } else {
      Frieghtamt = 0.0;
    }

    updatedFormData.Freight_Amount = Frieghtamt;

    if (qntl != 0 && vasulirate != 0) {
      vasuliamt = parseFloat(qntl * vasulirate);
    } else {
      vasuliamt = 0.0;
    }

    updatedFormData.vasuli_amount = vasuliamt;

    let tdsac = updatedFormData.TDSAc
    if (tdsac != 0) {
      let tdsrate = parseFloat(updatedFormData.TDSRate) || 0.0;
      updatedFormData.TDSAmt = (tdsrate * MemoAdvance) / 100
    }

    return updatedFormData;
  };

  const fetchLastRecord = () => {
    fetch(
      `${API_URL}/getNextDocNo_DeliveryOrder?Company_Code=${companyCode}&Year_Code=${Year_Code}`
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

  const handleAddOne = () => {

    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);

    setLastTenderDetails([]);
    setLastTenderData([]);
    MillByName = ""
    lblgetpassstatename = "";
    GetPassByName = "";
    lblgstratename = "";
    lblmillname = "";
    lblbrandname = "";
    lblbrokername = "";
    lblcashdiffacname = "";
    lblgetpasscodename = "";
    lblgetpassstatename = "";
    lblitemname = "";
    lblMemoGSTRatename = "";
    lblmillstatename = "";
    lblsalebilltoname = "";
    lbltdsacname = "";
    lbltransportname = "";
    lbltransportstatename = "";
    VoucherByName = "";
    lblvasuliacname = "";
    lblvoucherByname = "";
    lblDoname = "";
    lblBilltostatename = "";
    lblbrokername = "";
    newvoucher_by = "";
    newSaleBillTo = "";
    newGETPASSCODE = "";
    newCashDiffAc = "";
    newVasuli_Ac = "";
    GetpassByCode = "";
    VoucherByCode = "";
    SaleBillByName = "";
    MillByCode = "";
    newitemcode = "";
    newbrandcode = "";
    newGstRateCode = "";
    newMemoGSTRate = "";
    newCashDiffAc = "";
    newDO = "";
    newTDSAc = "";
    newbroker = "";
    newtransport = "";
    newTransportGSTStateCode = "";
    newmill_code = "";
    newPurcno = "";
    lblTenderid = "";
    setFormData(initialFormData)
    fetchLastRecord();

  };

  //Handle SaveOrUpdate Records
  const handleSaveOrUpdate = async () => {
    let desp_type = formData.desp_type;
    const { grade, quantal, packing, bags, mill_rate, sale_rate } = formData;

    if (!grade || quantal <= 0 || packing <= 0 || bags <= 0 || mill_rate <= 0 || sale_rate <= 0) {

      Swal.fire({
        title: "Error",
        text: "Please fill all required fields with values greater than 0!",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    const millamount = parseFloat(formData.amount) || 0;
    const bankamt = users.reduce((sum, user) => {
      return sum + parseFloat(user.Amount || 0);
    }, 0);

    if (millamount.toFixed(2) !== bankamt.toFixed(2)) {
      if (desp_type === "DI") {
        Swal.fire({
          title: "Error",
          text: "Mill Amount Does Not match with detail amount!",
          icon: "error",
          confirmButtonText: "OK"
        });
        return;
      }
    }
    setIsEditing(true);
    setIsLoading(true);

    let headData = {
      ...formData,
      purc_no: Tenderno || newPurcno || formData.purc_no,
      purc_order: Tenderid || newpurcoder || formData.purc_order
    };

    if (desp_type === "DI") {
      headData = await PurchaseBillCalculation(
        "save",
        "ps",
        headData,
        Gst_Rate
      );

      headData = await saleBillCalculation("save", "sale", headData, Gst_Rate);
    } else {
      headData = await CommisionBillCalculation(
        "save",
        "commi",
        headData,
        Gst_Rate
      );
    }

    // Remove dcid from headData if in edit mode
    if (isEditMode) {
      delete headData.doid;
      delete headData.doidnew;
      delete headData.millname;
      delete headData.brandname;
      delete headData.brokername;
      delete headData.cashdiffacname;
      delete headData.getpassname;
      delete headData.getpassstatename;
      delete headData.itemname;
      delete headData.memorategst;
      delete headData.millstatename;
      delete headData.salebillname;
      delete headData.salebilltostatename;
      delete headData.tdsacname;
      delete headData.transportname;
      delete headData.transportstatename;
      delete headData.vaoucherbystatename;
      delete headData.vasuliacname;
      delete headData.voucherbyname;
      delete headData.DOName;
    }
    else {
      delete headData.doid;
    }
    const detailData = users.map((user) => ({
      rowaction: user.rowaction,
      dodetailid: user.dodetailid,
      Bank_Code: user.Bank_Code || tenderDetails.Payment_To,
      ddType: user.ddType,
      Narration: user.Narration,
      Amount: user.Amount,
      detail_Id: 1,
      Company_Code: companyCode,
      Year_Code: Year_Code,

      LTNo: user.LTNo,
      bc: user.bc || tenderDetails.pt,
    }));

    const requestData = {
      headData,
      detailData,
    };
    try {
      if (isEditMode) {
        const updateApiUrl = `${API_URL}/update-DeliveryOrder?doid=${newDcid}`;
        const response = await axios.put(updateApiUrl, requestData);
        toast.success("Record updated successfully!");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const response = await axios.post(
          `${API_URL}/insert-DeliveryOrder`,
          requestData,
        );
        toast.success("Record saved successfully!");
        handleEdit();
        setIsEditMode(false);
        setAddOneButtonEnabled(true);
        setEditButtonEnabled(true);
        setDeleteButtonEnabled(true);
        setBackButtonEnabled(true);
        setSaveButtonEnabled(false);
        setCancelButtonEnabled(false);
        setIsEditing(true);

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      toast.error("Error occurred while saving data");
    } finally {
      setIsEditing(false);
      setIsLoading(false);
    }
  };

  //Record Edit Functionlity
  const handleEdit = () => {
    setIsEditMode(true);
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setBackButtonEnabled(true);
    setIsEditing(true);
  };

  const CommonFeilds = (data) => {
    newDcid = data.last_head_data.doid;
    bankcodenew = data.last_details_data[0].bankaccode;
    lblbankname = data.last_details_data[0].bankname;
    newmill_code = data.last_details_data[0].millacode;
    lblmillname = data.last_details_data[0].millname;
    MillByCode = data.last_details_data[0].millstatecode;
    MillByName = data.last_details_data[0].millstatename;
    newGETPASSCODE = data.last_head_data.GETPASSCODE;
    lblgetpasscodename = data.last_details_data[0].getpassname;
    GetPassByName = data.last_details_data[0].getpassstatename;
    GetpassByCode = data.last_details_data[0].getpassstatecode;
    newvoucher_by = data.last_details_data[0].voucherbyaccode;
    lblvoucherByname = data.last_details_data[0].voucherbyname;
    VoucherByName = data.last_details_data[0].vaoucherbystatename;
    VoucherByCode = data.last_head_data.voucherbystatecode;
    lblgstratename = data.last_details_data[0].gstratename;
    newGstRateCode = data.last_details_data[0].gstdocno;
    newSaleBillTo = data.last_details_data[0].salebillaccode;
    lblsalebilltoname = data.last_details_data[0].salebillname;
    lblBilltostatename = data.last_details_data[0].salebilltostatename;
    SaleBillByName =
      data.last_details_data[0].salebilltostatename;
    newtransport = data.last_details_data[0].transportaccode;
    lbltransportname = data.last_details_data[0].transportname;
    lbltransportstatename = data.last_details_data[0].transportstatename;
    newTransportGSTStateCode =
      data.last_details_data[0].transportstatecode;
    lblitemname = data.last_details_data[0].itemname;
    newitemcode = data.last_details_data[0].itemcode;
    lblbrandname = data.last_details_data[0].brandname;
    newbrandcode = data.last_details_data[0].brandcode;
    lblMemoGSTRatename = data.last_details_data[0].memorategst;
    newMemoGSTRate = data.last_details_data[0].MemoGSTRate;
    newVasuli_Ac = data.last_details_data[0].Vasuli_Ac;
    lblvasuliacname = data.last_details_data[0].vasuliacname;
    lblDoname = data.last_details_data[0].DOName;
    newDO = data.last_details_data[0].DOacCode;
    lbltdsacname = data.last_details_data[0].tdsacname;
    newTDSAc = data.last_details_data[0].TDSAc;
    lblbrokername = data.last_details_data[0].brokername;
    newbroker = data.last_details_data[0].broker;
    lblcashdiffacname = data.last_details_data[0].cashdiffacname;
    newCashDiffAc = data.last_details_data[0].CashDiffAc;
    lblTenderid = data.last_head_data.purc_order;

    setGstRatecode(data.last_details_data[0].Gstrate);
    setAutopurchase(data.last_details_data[0].AutoPurchaseBill);

    setFormData((prevData) => ({
      ...prevData,
      ...data.last_head_data,
    }));
    const desp_type = data.last_head_data.desp_type;

    setLastTenderData(data.last_head_data || {});

    if (desp_type === "DI") {
      setLastTenderDetails(data.last_details_data || []);
    }
    else {
      setLastTenderDetails([])

    }
  }

  //GET last record.
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
      const response = await axios.get(
        `${API_URL}/get-lastDO-navigation?company_code=${companyCode}&Year_Code=${Year_Code}`
      );
      if (response.status === 200) {
        const data = response.data;
        CommonFeilds(data);
      } else {
        toast.error(
          "Failed to fetch last data:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.log(error);
      toast.error("Error during API call:", error);
    }
  };

  //Record Delete Functionality
  const handleDelete = async () => {
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
        const headData = {
          ...formData,
        };
        const requestData = {
          headData,
        };

        const response = await axios.delete(
          `${API_URL}/delete_data_by_doid?doid=${formData.doid}&company_code=${companyCode}&Year_Code=${formData.Year_Code}&doc_no=${formData.doc_no}`,
          { data: requestData }
        );

        if (response.status === 200) {
          Swal.fire({
            title: "Deleted!",
            text: "The record has been deleted successfully.",
            icon: "success",
          });
          handleCancel();
        } else {
          Swal.fire({
            title: "Error",
            text: "Failed to delete the record.",
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

  const handleBack = () => {
    navigate("/delivery-order-utility");
  };

  //Handle Record DoubleCliked in Utility Page Show that record for Edit
  const handlerecordDoubleClicked = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/DOByid?company_code=${companyCode}&doc_no=${selectedRecord.doc_no}&Year_Code=${Year_Code}`
      );
      const data = response.data;

      CommonFeilds(data);
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

  //change No functionality to get that particular record
  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(
          `${API_URL}/DOByid?company_code=${companyCode}&doc_no=${changeNoValue}&Year_Code=${Year_Code}`
        );
        const data = response.data;

        CommonFeilds(data);
        setIsEditing(false);
      } catch (error) {
        Swal.fire({
          title: "Error",
          text: "Record Not Found.",
          icon: "error",
        });
      }
    }
  };

  //Navigation Buttons
  const handleFirstButtonClick = async () => {
    try {

      const response = await fetch(
        `${API_URL}/get-firstDO-navigation?company_code=${companyCode}&Year_Code=${Year_Code}`
      );
      if (response.ok) {
        const data = await response.json();

        CommonFeilds(data);

        setIsEditing(false);
      } else {
        console.error(
          "Failed to fetch first record:",
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
        `${API_URL}/get-previousDO-navigation?currentDocNo=${formData.doc_no}&company_code=${companyCode}&Year_Code=${Year_Code}`
      );

      if (response.ok) {
        const data = await response.json();
        CommonFeilds(data);
        setIsEditing(false);
      } else {
        console.error(
          "Failed to fetch previous record:",
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
        `${API_URL}/get-nextDO-navigation?currentDocNo=${formData.doc_no}&company_code=${companyCode}&Year_Code=${Year_Code}`
      );

      if (response.ok) {
        const data = await response.json();

        CommonFeilds(data);
        setIsEditing(false);
      } else {
        console.error(
          "Failed to fetch next record:",
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
      const response = await fetch(
        `${API_URL}/get-lastDO-navigation?company_code=${companyCode}&Year_Code=${Year_Code}`
      );
      if (response.ok) {
        const data = await response.json();

        CommonFeilds(data);

        setIsEditing(false);
      } else {
        console.error(
          "Failed to fetch last record:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handlePendingDO = () => {
    navigate("/pending-do")
  }

  const handlerecordDoubleClickedPendingDO = async () => {
    fetchLastRecord();

    try {
      const response = await axios.get(
        `${API_URL}/getByPendingDOId?tenderdetailid=${selectedRecordPendingDo.tenderdetailid}`
      );
      const data = response.data;
      OrderId = data.last_head_data.orderid
      setPendingDOData(data.last_head_data)
      const dummyEvent = { target: { value: selectedRecordPendingDo.tenderdetailid } };
      await handleKeyDownPendingDO(dummyEvent);

    } catch (error) {
      console.error("Error fetching data:", error);
    }

    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);
    setIsInputDisabled(true);
  };

  const handleKeyDownPendingDO = async (event) => {
    const changeNoValue = event.target.value;
    try {
      const response = await axios.get(
        `${API_URL}/getTenderNo_DataByTenderdetailId?tenderdetailid=${changeNoValue}`
      );
      const data = response.data;

      let assingqntl = 0;
      let Carporate_Sale_No = formData.Carporate_Sale_No
      let Dispatch_type =
        data.last_details_data[0].DT === "D"
          ? formData.desp_type === "DO"
          : "DI";
      if (Carporate_Sale_No === 0) {
        assingqntl = data.last_details_data[0].Quantal;
      } else {
        assingqntl = CarporateState.quantal;
      }
      const purcRate =
        parseFloat(data.last_details_data[0].Purc_Rate) || 0;
      const exciseRate =
        parseFloat(data.last_details_data[0].Excise_Rate) || 0;
      const qtl = parseFloat(assingqntl) || 0;
      const rate = qtl !== 0 ? purcRate + exciseRate : 0;
      const millamount = qtl * rate;
      bankcodenew = data.last_details_data[0].Payment_To;
      lblbankname = data.last_details_data[0].paymenttoname;
      if (Dispatch_type === "DI") {
        const newDetailData = {
          ddType: "T",
          Narration: "Transfer Letter",
          Amount: millamount,
          detail_Id: 1,
          Bank_Code: bankcodenew,
          bc: data.last_details_data[0].pt,
          rowaction: "add",
          bankcodeacname: lblbankname
        };
        setUsers([newDetailData]);
      }

      newmill_code = data.last_details_data[0].Mill_Code;
      lblmillname = data.last_details_data[0].millname;
      newGETPASSCODE = data.last_details_data[0].Getpassno;
      lblgetpasscodename = data.last_details_data[0].Getpassnoname;

      newvoucher_by = data.last_details_data[0].ship_to_ac_code;
      lblvoucherByname = data.last_details_data[0].Ship_To_name;
      VoucherByName = data.last_details_data[0].shiptostatename;
      VoucherByCode = data.last_details_data[0].shiptostatecode;

      lblgstratename = data.last_details_data[0].gstratename;
      newGstRateCode = data.last_details_data[0].gstratecode;
      newSaleBillTo = data.last_details_data[0].bill_to_ac_code;
      lblsalebilltoname = data.last_details_data[0].Bill_TO_Name;
      lblBilltostatename = data.last_details_data[0].salebilltostatename;

      newtransport = data.last_details_data[0].transport;

      lblitemname = data.last_details_data[0].itemname;
      newitemcode = data.last_details_data[0].itemcode;
      lblDoname = data.last_details_data[0].tenderdoname;
      newDO = data.last_details_data[0].Tender_DO;

      lblbrokername = data.last_details_data[0].brokername;
      newbroker = data.last_details_data[0].Broker;
      SaleBillByName = data.last_details_data[0].buyerpartygststatecode;
      lblBilltostatename = data.last_details_data[0].buyerpartystatename;

      const newData = {
        sb: data.last_details_data[0].bill_to_accoid,
        gp: data.last_details_data[0].Getpassnoid,
        ic: data.last_details_data[0].ic,
        mc: data.last_details_data[0].mc,
        bk: data.last_details_data[0].buyerid,
        vb: data.last_details_data[0].ship_to_accoid,

        desp_type: Dispatch_type,
        SaleBillTo: data.last_details_data[0].Buyer_Party,
        GETPASSCODE: data.last_details_data[0].Getpassno,
        voucher_by: data.last_details_data[0].Buyer_Party,
        DO: data.last_details_data[0].Tender_DO,
        CashDiffAc: data.last_details_data[0].Buyer,
        DO: data.last_details_data[0].Tender_DO,
        itemcode: data.last_details_data[0].itemcode,
        lblitemname: data.last_details_data[0].itemname,

        GstRateCode: data.last_details_data[0].gstratecode,
        newbroker: data.last_details_data[0].Broker,
        lblbrokername: data.last_details_data[0].Broker,
        Gst_Rate: data.last_details_data[0].gstrate,
        mill_rate: data.last_details_data[0].Mill_Rate,
        sale_rate: data.last_details_data[0].Sale_Rate,
        grade: data.last_details_data[0].Grade,
        PurchaseRate: data.last_details_data[0].Purc_Rate,
        purc_no: data.last_details_data[0].Tender_No,
        purc_order: data.last_details_data[0].ID,
        packing: data.last_details_data[0].Packing,
        bags: data.last_details_data[0].Bags,
        excise_rate: data.last_details_data[0].Excise_Rate,
        Tender_Commission: data.last_details_data[0].CR,
        truck_no: data.last_details_data[0].truck_no,
        tenderdetailid: data.last_details_data[0].tenderdetailid,
        quantal: data.last_details_data[0].Quantal,
        purc_order: data.last_details_data[0].ID,
        AutopurchaseBill: data.last_details_data[0].AutoPurchaseBill,
        quantal: data.last_details_data[0].Quantal,
        orderid: OrderId

      };

      setFormData((prevState) => ({
        ...prevState,
        ...newData,
      }));
      setIsEditing(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };


  //--------------------------------------- Delivery Order Detail Section ------------
  const handleChangeDetail = (event) => {
    const { name, value } = event.target;
    let updatedFormDataDetail = { ...formDataDetail, [name]: value };
    setFormDataDetail(updatedFormDataDetail);
  };

  //Handle Delete Functionality
  const deleteModeHandler = async (userToDelete) => {
    let updatedUsers;
    if (isEditMode && userToDelete.rowaction === "add") {
      updatedUsers = users.map((u) =>
        u.id === userToDelete.id ? { ...u, rowaction: "DNU" } : u
      );
    } else if (isEditMode) {
      updatedUsers = users.map((u) =>
        u.id === userToDelete.id ? { ...u, rowaction: "delete" } : u
      );
    } else {
      updatedUsers = users.map((u) =>
        u.id === userToDelete.id ? { ...u, rowaction: "DNU" } : u
      );
    }
    setFormDataDetail({
      ...formDataDetail,
      ...updatedUsers.find((u) => u.id === u.id),
    });
    setUsers(updatedUsers);
    setDeleteMode(true);
    setSelectedUser(userToDelete);
  };

  const openPopup = (mode) => {
    setShowPopup(true);
    if (mode === "add") {
      clearForm();
    }
  };

  const openDelete = async (user) => {
    setDeleteMode(true);
    setSelectedUser(user);
    let updatedUsers;
    if (isEditMode && user.rowaction === "delete") {
      updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, rowaction: "Normal" } : u
      );
    } else {
      updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, rowaction: "add" } : u
      );
    }
    setUsers(updatedUsers);
    setSelectedUser({});
  };

  // const openDelete = async (user) => { };
  const closePopup = () => {
    setShowPopup(false);
    setSelectedUser({});
    clearForm();
  };

  useEffect(() => {
    if (selectedRecord) {
      setUsers(
        lastTenderDetails.map((detail) => ({
          ddType: detail.ddType,
          Bank_Code: detail.bankcode || bankcodenew,
          bankcodeacname: detail.bankcodeacname,
          Narration: detail.Narration,
          Amount: detail.Amount,
          UTR_NO: detail.UTR_NO,
          LTNo: detail.LTNo,
          bc: detail.bc,
          dodetailid: detail.dodetailid,
          detail_Id: detail.detail_Id,
          id: detail.detail_Id,
          rowaction: "Normal",
        }))
      );
    }
  }, [selectedRecord, lastTenderDetails]);

  useEffect(() => {
    const updatedUsers = lastTenderDetails.map((detail) => ({
      ddType: detail.ddType,
      Bank_Code: detail.Bank_Code || bankcodenew,
      bankcodeacname: detail.bankname,
      Narration: detail.Narration,
      Amount: detail.Amount,
      UTR_NO: detail.UTR_NO,
      LTNo: detail.LTNo,
      bc: detail.bc,
      dodetailid: detail.dodetailid,
      detail_Id: detail.detail_Id,
      id: detail.detail_Id,
      rowaction: "Normal",
    }));
    setUsers(updatedUsers);
  }, [lastTenderDetails]);


  const clearForm = () => {
    setFormDataDetail({
      Narration: "",
      Amount: 0.0,
      UTR_NO: 0,
      UTR_NO: 0,
    });
    setbankcode("");
    setbankcodeacname("");
  };

  //Update Record on detail section
  const updateUser = async () => {
    const updatedUsers = users.map((user) => {
      if (user.id === selectedUser.id) {
        const updatedRowaction =
          user.rowaction === "Normal" ? "update" : user.rowaction;
        return {
          ...user,
          Bank_Code: bankcode,
          bk: bankcodeacoid,
          UTR_NO: users.UTR_NO,
          LTNo: users.LTNo,
          ...formDataDetail,
          amount: formData.mill_amountTCS1,
          rowaction: updatedRowaction,
        };
      } else {
        return user;
      }
    });
    setFormDataDetail({
      ...updatedUsers,
    });
    setUsers(updatedUsers);
    closePopup();
  };

  //Record Add Functionality
  const addUser = async () => {
    const newUser = {
      ...formDataDetail,
      id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1,
      Bank_Code: bankcode,
      bankcodeacname: bankcodeacname,
      bc: bankcodeacoid,

      rowaction: "add",
    };
    setFormDataDetail({
      ...newUser,
    });
    setUsers([...users, newUser]);
    closePopup();
  };

  //Record Edit Functionality
  const editUser = (user) => {
    setSelectedUser(user);
    setbankcode(user.Bank_Code);
    setbankcodeacname(user.bankcodeacname);

    setFormDataDetail({
      ddType: user.ddType || "",
      Narration: user.Narration || "",
      Amount: user.Amount || "",
      UTR_NO: user.UTR_NO || "",
      UTR_NO: user.UTR_NO || "",
    });
    openPopup("edit");
  };

  function handleSubmit(event) {
    event.preventDefault();

  }

  const validateNumericInput = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.-]/g, '');
  };


  return (
    <>
      <UserAuditInfo
        createdBy={formData.Created_By}
        modifiedBy={formData.Modified_By}
        title={"Delivery Order"}
      />
      <div style={{ marginTop: "35px" }} >
        <ToastContainer autoClose={500} />
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

        <NavigationButtons
          handleFirstButtonClick={handleFirstButtonClick}
          handlePreviousButtonClick={handlePreviousButtonClick}
          handleNextButtonClick={handleNextButtonClick}
          handleLastButtonClick={handleLastButtonClick}
          highlightedButton={highlightedButton}
          isEditing={isEditing}
        />
      </div>

      {/* <div style={{ display: "end" }}>
        <DeliveryOrderOurDoReport doc_no={formData.doc_no} disabledFeild={!addOneButtonEnabled} />
        <button onClick={handlePendingDO} disabled={!addOneButtonEnabled} >Pending DO</button>
      </div> */}

      <div>
        <form onSubmit={handleSubmit}>
          <br />
          <Card>
            <CardContent>
              <Grid container spacing={1}>
                <Grid item xs={0.8}>
                  <TextField
                    fullWidth
                    label="Change No"
                    variant="outlined"
                    id="changeNo"
                    name="changeNo"
                    onKeyDown={handleKeyDown}
                    disabled={!addOneButtonEnabled}
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '16px', fontWeight: 'bold' },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '30px',
                        padding: '0px 10px',
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={1}>
                  <TextField
                    fullWidth
                    label="Tender Detail ID"
                    variant="outlined"
                    id="tenderdetailid"
                    name="tenderdetailid"
                    value={formData.tenderdetailid}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    size="small"
                    style={{ fontSize: '16px' }}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '16px', fontWeight: 'bold' },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '30px',
                        padding: '0px 10px',
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={1}>
                  <TextField
                    fullWidth
                    label="Newsbdate"
                    type="date"
                    variant="outlined"
                    id="newsbdate"
                    name="newsbdate"
                    value={formData.newsbdate}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    size="small"
                    InputLabelProps={{
                      style: { fontSize: '12px', fontWeight: 'bold' },
                      shrink: true,
                    }}
                    InputProps={{
                      style: { fontSize: '12px', height: '30px' },
                    }}

                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    fullWidth
                    label="E-Invoice No"
                    variant="outlined"
                    id="einvoiceno"
                    name="einvoiceno"
                    autoComplete="off"
                    value={formData.einvoiceno}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    size="small"
                    style={{ fontSize: '16px' }}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '16px', fontWeight: 'bold' },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '30px',
                        padding: '0px 10px',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={2}>
                  <TextField
                    fullWidth
                    label="Ack No"
                    variant="outlined"
                    id="ackno"
                    name="ackno"
                    autoComplete="off"
                    value={formData.ackno}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    size="small"
                    style={{ fontSize: '16px' }}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '16px', fontWeight: 'bold' },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '30px',
                        padding: '0px 10px',
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={1} mt={0.2} alignItems="center" direction="row">
                <Grid item xs={0.8}>
                  <TextField
                    fullWidth
                    label="Doc No"
                    variant="outlined"
                    autoComplete="off"
                    id="doc_no"
                    name="doc_no"
                    size="small"
                    value={formData.doc_no}
                    onChange={handleChange}
                    disabled
                    style={{ fontSize: '16px' }}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '16px', fontWeight: 'bold' },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '30px',
                        padding: '0px 10px',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={1} mt={1}>
                  <FormControl
                    fullWidth
                    disabled={!isEditing && addOneButtonEnabled}
                    sx={{ height: '40px' }}
                  >
                    <InputLabel
                      id="desp_type-label"
                      sx={{ height: 'auto' }}
                    >
                      Desp Type
                    </InputLabel>
                    <Select
                      labelId="desp_type-label"
                      id="desp_type"
                      name="desp_type"
                      value={formData.desp_type}
                      onChange={handleChange}
                      label="Desp Type"
                      size="small"
                      sx={{ height: '30px' }}
                    >
                      <MenuItem value="DO">D.O</MenuItem>
                      <MenuItem value="DI">Dispatch</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>


                <Grid item xs={1}>
                  <TextField
                    fullWidth
                    label="Doc Date"
                    type="date"
                    variant="outlined"
                    autoComplete="off"
                    id="doc_date"
                    name="doc_date"
                    size="small"
                    value={formData.doc_date}
                    onChange={handleChange}
                    style={{ fontSize: '16px' }}
                    InputLabelProps={{
                      style: { fontSize: '12px' },
                      shrink: true,
                    }}
                    InputProps={{
                      style: { fontSize: '12px', height: '30px', fontWeight: 'bold' },
                    }}
                    disabled={!isEditing && addOneButtonEnabled}
                  />
                </Grid>

                <Grid item xs={1}>
                  <TextField
                    fullWidth
                    label="DO Date"
                    variant="outlined"
                    id="Do_DATE"
                    name="Do_DATE"
                    autoComplete="off"
                    value={formData.Do_DATE}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    size="small"
                    style={{ fontSize: '16px' }}
                    InputLabelProps={{
                      style: { fontSize: '12px' },
                      shrink: true,
                    }}
                    InputProps={{
                      style: { fontSize: '12px', height: '30px' },
                    }}
                  />
                </Grid>


                <Grid item xs={12} sm={1}>
                  <FormControl fullWidth>
                    <InputLabel shrink style={{ fontWeight: 'bold' }}>Carpo. Sale No</InputLabel>
                    <CarporateHelp
                      Name="Carporate_Sale_No"
                      onAcCodeClick={handleCarporate}
                      Carporate_no={Carporateno || formData.Carporate_Sale_No}
                      disabledFeild={!isEditing && addOneButtonEnabled}
                      onTenderDetailsFetched={handleCarporateDetailsFetched}
                    />
                  </FormControl>
                </Grid>

                <Grid item xs={1}>
                  <TextField
                    fullWidth
                    label="Carp. Sale Year Code"
                    variant="outlined"
                    id="Carporate_Sale_Year_Code"
                    name="Carporate_Sale_Year_Code"
                    autoComplete="off"
                    value={formData.Carporate_Sale_Year_Code}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '16px', fontWeight: 'bold' },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '30px',
                        padding: '0px 10px',
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <div >
                <div className="DeliveryOrderMainDiv">
                  <label htmlFor="mill_code" className="DeliveryOrderLabel">
                    Mill Code:
                  </label>
                  <div>
                    <AccountMasterHelp
                      name="mill_code"

                      onAcCodeClick={handlemill_code}
                      CategoryName={lblmillname}
                      CategoryCode={newmill_code}
                      Ac_type={[]}
                      disabledFeild={!isEditing && addOneButtonEnabled}
                    />
                  </div>

                  <label htmlFor="MillGSTStateCode" className="DeliveryOrderLabel" style={{ marginLeft: "15px" }} >
                    State Code:
                  </label>
                  <div >
                    <GSTStateMasterHelp
                      onAcCodeClick={handleMillGSTStateCode}
                      name="MillGSTStateCode"
                      GstStateName={MillByName || tenderDetails.millStatename || millstatename}
                      GstStateCode={MillByCode || tenderDetails.millstatecode || formData.MillGSTStateCode}
                      disabledFeild={!isEditing && addOneButtonEnabled}
                    />
                  </div>

                  <Grid item xs={8} mt={1} ml={2}>
                    <FormControl
                      fullWidth
                      disabled={!isEditing && addOneButtonEnabled}
                      sx={{ height: '40px' }}
                    >
                      <InputLabel
                        id="insured-label"
                        sx={{ height: 'auto', paddingTop: 0, paddingBottom: 0 }}
                      >
                        Insured
                      </InputLabel>

                      <Select
                        labelId="insured-label"
                        id="Insured"
                        name="Insured"
                        value={formData.Insured}
                        onChange={handleChange}
                        label="Insured"
                        size="small"
                        sx={{ height: '30px' }}
                      >
                        <MenuItem value="Y">Yes</MenuItem>
                        <MenuItem value="N">No</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>


                  <Grid item xs={0.5}>
                    <TextField
                      fullWidth
                      label="Detail Id:"
                      id="tenderdetailid"
                      name="tenderdetailid"
                      value={formData.tenderdetailid}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      style={{ width: "80%" }}
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '16px', fontWeight: 'bold' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "5px" }}>
                <div className="DeliveryOrderMainDiv">
                  <label htmlFor="mill_code" className="DeliveryOrderLabel">
                    Purc no:
                  </label>
                  <div >
                    <PurcnoHelp
                      onAcCodeClick={handlePurcno}
                      name="purc_no"
                      Tenderid={lblTenderid || Tenderid}
                      Tenderno={newPurcno || formData.purc_no || Tenderno}
                      disabledFeild={!isEditing && addOneButtonEnabled}
                      Millcode={formData.mill_code || millcode}
                      onTenderDetailsFetched={
                        ChangeData
                          ? handleTenderDetailsFetched
                          : handleTenderWithoutCarpoDetailsFetched
                      }
                    />
                  </div>
                </div>

                <div className="DeliveryOrderMainDiv">
                  <FormControl fullWidth disabled={!isEditing && addOneButtonEnabled}>
                    <InputLabel id="Delivery_Type">Delivery Type</InputLabel>
                    <Select
                      labelId="Delivery_Type"
                      id="Delivery_Type"
                      name="Delivery_Type"
                      value={
                        ChangeData
                          ? CarporateState.Delivery_Type
                          : tenderDetails.DT || formData.Delivery_Type
                      }
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      sx={{ width: '200px' }}

                    >
                      <MenuItem value="C">Commission</MenuItem>
                      <MenuItem value="N">With GST Naka Delivery</MenuItem>
                      <MenuItem value="A">Naka Delivery without GST Rate</MenuItem>
                      <MenuItem value="D">DO</MenuItem>
                    </Select>
                  </FormControl>
                </div>

                <div className="DeliveryOrderMainDiv">
                  <label htmlFor="mill_code" className="DeliveryOrderLabel">
                    Gst Rate:
                  </label>
                  <div >
                    <GSTRateMasterHelp
                      name="GstRateCode"
                      onAcCodeClick={handleGstRateCode}
                      GstRateName={tenderDetails.gstratename || lblgstratename}
                      GstRateCode={tenderDetails.gstratecode || newGstRateCode}
                      disabledFeild={!isEditing && addOneButtonEnabled}
                    />
                  </div>
                </div>

                <label htmlFor="Purchase_Date" className="DeliveryOrderLabel">Purchase Date:</label>
                <input
                  type="date"
                  id="Purchase_Date"
                  Name="Purchase_Date"
                  value={formData.Purchase_Date}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  style={{ width: "150px", height: "30px", marginTop: "-10px" }}
                />
              </div>

              <div className="form-group">
                <div className="DeliveryOrderMainDiv">
                  <label htmlFor="GetpassCode" className="DeliveryOrderLabel">
                    Get Pass Code:
                  </label>
                  <div  >
                    <AccountMasterHelp
                      name="GETPASSCODE"
                      Ac_type=''
                      onAcCodeClick={handleGETPASSCODE}
                      CategoryName={
                        ChangeData
                          ? getpassTitle
                          : tenderDetails.Getpassnoname ||
                          getpassTitle ||
                          lblgetpasscodename
                      }
                      CategoryCode={
                        ChangeData
                          ? CarporateState.newGETPASSCODE
                          : tenderDetails.Getpassno ||
                          newGETPASSCODE ||
                          formData.GETPASSCODE
                      }
                      disabledFeild={!isEditing && addOneButtonEnabled}
                    />
                  </div>
                </div>

                <div className="DeliveryOrderMainDiv">
                  <label htmlFor="GetpassGstStateCode" className="DeliveryOrderLabel">
                    Get Pass State:
                  </label>
                  <div className="debitCreditNote-col" >
                    <GSTStateMasterHelp
                      onAcCodeClick={handleGetpassGstStateCode}
                      name="GetpassGstStateCode"
                      GstStateName={tenderDetails.Getpassnonamestatename || GetPassByName || getpassstatecodename}
                      GstStateCode={tenderDetails.Getpassnonamestatecode || GetpassByCode || formData.GetpassGstStateCode}
                      disabledFeild={!isEditing && addOneButtonEnabled}
                    />
                  </div>
                </div>

                <div className="DeliveryOrderMainDiv">
                  <label htmlFor="Itemcode" className="DeliveryOrderLabel">
                    Itemcode:
                  </label>
                  <div className="debitCreditNote-col" >
                    <div className="debitCreditNote-form-group">
                      <SystemHelpMaster
                        onAcCodeClick={handleItemSelect}
                        CategoryName={tenderDetails.itemname || lblitemname}
                        CategoryCode={tenderDetails.itemcode || newitemcode}
                        name="Item_Select"
                        SystemType="I"
                        className="account-master-help"
                        disabledField={!isEditing && addOneButtonEnabled}
                      />
                    </div>
                  </div>
                </div>

                <div className="DeliveryOrderMainDiv">
                  <label htmlFor="Brandcode" className="DeliveryOrderLabel">
                    Brandcode:
                  </label>
                  <div className="debitCreditNote-col" >
                    <div className="debitCreditNote-form-group">
                      <SystemHelpMaster
                        name="brandcode"
                        onAcCodeClick={handlebrandcode}
                        CategoryName={lblbrandname}
                        CategoryCode={newbrandcode}
                        SystemType="I"
                        disabledField={!isEditing && addOneButtonEnabled}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <div className="DeliveryOrderMainDiv">
                  <label htmlFor="Voucher_by" className="DeliveryOrderLabel">
                    Voucher By:
                  </label>
                  <div className="debitCreditNote-col" >
                    <div className="debitCreditNote-form-group">
                      <AccountMasterHelp
                        name="voucher_by"
                        Ac_type=''
                        onAcCodeClick={handlevoucher_by}
                        CategoryName={
                          ChangeData
                            ? voucherTitle
                            : tenderDetails.buyername || voucherTitle || lblvoucherByname
                        }
                        CategoryCode={
                          ChangeData
                            ? CarporateState.voucher_by
                            : tenderDetails.Buyer || newvoucher_by
                        }
                        disabledFeild={!isEditing && addOneButtonEnabled}
                      />
                    </div>
                  </div>
                </div>

                <div className="DeliveryOrderMainDiv" style={{ marginLeft: "10px" }}>
                  <label htmlFor="Voucher_State_Code" className="DeliveryOrderLabel">
                    Voucher State:
                  </label>
                  <div className="debitCreditNote-col" >
                    <div className="debitCreditNote-form-group">
                      <GSTStateMasterHelp
                        onAcCodeClick={handleVoucherbyGstStateCode}
                        name="VoucherbyGstStateCode"
                        GstStateName={tenderDetails.shiptostatename || VoucherByName || voucherbystatename}
                        GstStateCode={tenderDetails.shiptostatecode || VoucherByCode || formData.VoucherbyGstStateCode}
                        disabledFeild={!isEditing && addOneButtonEnabled}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <div className="DeliveryOrderMainDiv">
                  <label htmlFor="Voucher_State_Code" className="DeliveryOrderLabel">
                    Sale Bill To:
                  </label>
                  <div className="debitCreditNote-col" >
                    <div className="debitCreditNote-form-group">
                      <AccountMasterHelp
                        name="SaleBillTo"
                        Ac_type=''
                        onAcCodeClick={handleSaleBillTo}
                        CategoryName={
                          ChangeData
                            ? salebillTitle
                            : tenderDetails.buyername ||
                            salebillTitle ||
                            lblsalebilltoname
                        }
                        CategoryCode={
                          ChangeData
                            ? CarporateState.SaleBillTo
                            : tenderDetails.Buyer || newSaleBillTo
                        }
                        disabledFeild={!isEditing && addOneButtonEnabled}
                      />
                    </div>
                  </div>
                </div>

                <div className="DeliveryOrderMainDiv" style={{ marginLeft: "10px" }}>
                  <label htmlFor="Voucher_State_Code" className="DeliveryOrderLabel">
                    Sale bill State:
                  </label>
                  <div className="debitCreditNote-col" >
                    <div className="debitCreditNote-form-group">
                      <GSTStateMasterHelp
                        onAcCodeClick={handleSalebilltoGstStateCode}
                        name="SalebilltoGstStateCode"
                        GstStateName={SaleBillByName || tenderDetails.buyeridcitystate || salebilltostatename}
                        GstStateCode={SaleBillByCode || tenderDetails.buyergststatecode || formData.SalebilltoGstStateCode}
                        disabledFeild={!isEditing && addOneButtonEnabled}
                      />
                    </div>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
          <br></br>
          <Card >
            <CardContent>
              <Box sx={{ padding: 1 }} mt={-2} >
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={1}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel htmlFor="grade" shrink style={{ fontSize: '16px', fontWeight: 'bold' }}>Grade</InputLabel>
                      <OutlinedInput
                        id="grade"
                        name="grade"
                        autoComplete="off"
                        value={tenderDetails.Grade || formData.grade}
                        onChange={handleChange}
                        disabled={!isEditing && addOneButtonEnabled}
                        label="Grade"
                        size="small"
                        style={{ height: '30px', fontSize: '14px' }}
                      />
                    </FormControl>
                  </Grid>

                  <Grid item xs={1}>
                    <FormControl fullWidth variant="outlined" size="small">
                      <InputLabel htmlFor="quantal" shrink style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        Quintal
                      </InputLabel>
                      <OutlinedInput
                        id="quantal"
                        name="quantal"
                        value={
                          formData.quantal
                        }
                        onChange={handleChange}
                        onKeyDown={handleKeyDownCalculations}
                        disabled={!isEditing && addOneButtonEnabled}
                        label="Quantal"
                        size="small"
                        autoComplete="off"
                        inputProps={{
                          onInput: validateNumericInput,
                        }}
                        style={{ height: '30px', fontSize: '14px' }}
                      />
                    </FormControl>
                  </Grid>

                  <Grid item xs={0.5}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel htmlFor="packing" style={{ fontSize: '16px', fontWeight: 'bold' }}>Packing</InputLabel>
                      <OutlinedInput
                        id="packing"
                        name="packing"
                        value={formData.packing}
                        onChange={handleChange}
                        disabled={!isEditing && addOneButtonEnabled}
                        label="Packing"
                        size="small"
                        inputProps={{
                          onInput: validateNumericInput,
                        }}
                        style={{ height: '30px', fontSize: '14px' }}
                      />
                    </FormControl>
                  </Grid>

                  <Grid item xs={0.5}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel htmlFor="bags" shrink style={{ fontSize: '16px', fontWeight: 'bold' }}>Bags</InputLabel>
                      <OutlinedInput
                        id="bags"
                        name="bags"
                        value={tenderDetails.Bags || formData.bags}
                        onChange={handleChange}
                        disabled={!isEditing && addOneButtonEnabled}
                        label="Bags"
                        size="small"
                        onInput={validateNumericInput}
                        InputLabelProps={{ shrink: true }}
                        style={{ height: '30px', fontSize: '14px' }}
                      />
                    </FormControl>
                  </Grid>

                  <Grid item xs={1}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel htmlFor="excise_rate" shrink style={{ fontSize: '16px', fontWeight: 'bold' }}>Excise Rate</InputLabel>
                      <OutlinedInput
                        id="excise_rate"
                        name="excise_rate"
                        value={tenderDetails.Excise_Rate || formData.excise_rate}
                        onChange={handleChange}
                        onKeyDown={handleKeyDownCalculations}
                        disabled={!isEditing && addOneButtonEnabled}
                        label="Excise Rate"
                        size="small"
                        onInput={validateNumericInput}
                        InputLabelProps={{ shrink: true }}
                        style={{ height: '30px', fontSize: '14px' }}
                      />
                    </FormControl>
                  </Grid>

                  <Grid item xs={1}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel htmlFor="final_amout" style={{ fontSize: '16px', fontWeight: 'bold' }}>Mill Amount</InputLabel>
                      <OutlinedInput
                        id="final_amout"
                        name="final_amout"
                        value={formData.final_amout}
                        onChange={handleChange}
                        disabled={!isEditing && addOneButtonEnabled}
                        label="Mill Amount"
                        size="small"
                        autoComplete="off"
                        onInput={validateNumericInput}
                        InputLabelProps={{ shrink: true }}
                        style={{ height: '30px', fontSize: '14px' }}
                      />
                    </FormControl>
                  </Grid>

                  <Grid item xs={1}>
                    <TextField
                      label="Mill Rate"
                      id="mill_rate"
                      name="mill_rate"
                      value={tenderDetails.mill_rate || formData.mill_rate}
                      onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations}
                      disabled={!isEditing && addOneButtonEnabled}
                      fullWidth
                      variant="outlined"
                      size="small"
                      onInput={validateNumericInput}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={1}>
                    <TextField
                      label="Sale Rate"
                      id="sale_rate"
                      name="sale_rate"
                      value={
                        formData.sale_rate
                      }
                      onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations}
                      disabled={!isEditing && addOneButtonEnabled}
                      fullWidth
                      variant="outlined"
                      size="small"
                      autoComplete="off"
                      onInput={validateNumericInput}
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '16px', fontWeight: 'bold' }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={1}>
                    <TextField
                      label="Purchase Rate"
                      id="PurchaseRate"
                      name="PurchaseRate"
                      autoComplete="off"
                      value={formData.PurchaseRate}
                      onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations}
                      disabled={!isEditing && addOneButtonEnabled}
                      fullWidth
                      variant="outlined"
                      size="small"
                      style={{ fontSize: '16px' }}
                      onInput={validateNumericInput}
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '16px', fontWeight: 'bold' }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Grid container spacing={1} mt={0.5}>
                <Grid item xs={0.5}>
                  <TextField
                    label="Commision"
                    id="Tender_Commission"
                    name="Tender_Commission"
                    autoComplete="off"
                    value={
                      ChangeData
                        ? CarporateState.Tender_Commission
                        : tenderDetails.CR || formData.Tender_Commission
                    }
                    onChange={handleChange}
                    onKeyDown={handleKeyDownCalculations}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    variant="outlined"
                    size="small"
                    onInput={validateNumericInput}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '16px', fontWeight: 'bold' }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '30px',
                        padding: '0px 10px',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={1}>
                  <TextField
                    label="Diff Rate"
                    id="diff_rate"
                    name="diff_rate"
                    autoComplete="off"
                    value={formData.diff_rate}
                    onChange={handleChange}
                    onKeyDown={handleKeyDownCalculations}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    variant="outlined"
                    size="small"
                    onInput={validateNumericInput}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '16px', fontWeight: 'bold' }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '30px',
                        padding: '0px 10px',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={1}>
                  <TextField
                    label="Insurance"
                    id="Insurance"
                    name="Insurance"
                    autoComplete="off"
                    value={formData.Insurance}
                    onChange={handleChange}
                    onKeyDown={handleKeyDownCalculations}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    variant="outlined"
                    size="small"
                    onInput={validateNumericInput}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '16px', fontWeight: 'bold' }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '30px',
                        padding: '0px 10px',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={1}>
                  <TextField
                    label="Purchase TCS Rate"
                    id="TCS_Rate"
                    name="TCS_Rate"
                    autoComplete="off"
                    value={formData.TCS_Rate}
                    onChange={handleChange}
                    onKeyDown={handleKeyDownCalculations}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    variant="outlined"
                    size="small"
                    onInput={validateNumericInput}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '16px', fontWeight: 'bold' }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '30px',
                        padding: '0px 10px',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={1}>
                  <TextField
                    label="Sale TCS Rate"
                    id="Sale_TCS_Rate"
                    name="Sale_TCS_Rate"
                    autoComplete="off"
                    value={formData.Sale_TCS_Rate}
                    onChange={handleChange}
                    onKeyDown={handleKeyDownCalculations}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    variant="outlined"
                    size="small"
                    onInput={validateNumericInput}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '16px', fontWeight: 'bold' }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '30px',
                        padding: '0px 10px',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={1}>
                  <TextField
                    label="Sale TDS Rate"
                    id="SaleTDSRate"
                    name="SaleTDSRate"
                    autoComplete="off"
                    value={formData.SaleTDSRate}
                    onChange={handleChange}
                    onKeyDown={handleKeyDownCalculations}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    variant="outlined"
                    size="small"
                    onInput={validateNumericInput}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '16px', fontWeight: 'bold' }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '30px',
                        padding: '0px 10px',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={1}>
                  <TextField
                    label="Purchase TDS Rate"
                    id="PurchaseTDSRate"
                    name="PurchaseTDSRate"
                    autoComplete="off"
                    value={formData.PurchaseTDSRate}
                    onChange={handleChange}
                    onKeyDown={handleKeyDownCalculations}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    variant="outlined"
                    size="small"
                    onInput={validateNumericInput}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '16px', fontWeight: 'bold' }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '30px',
                        padding: '0px 10px',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={1}>
                  <TextField
                    label="Amount"
                    id="amount"
                    name="amount"
                    autoComplete="off"
                    value={formData.amount}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    variant="outlined"
                    size="small"
                    onInput={validateNumericInput}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '16px', fontWeight: 'bold' }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '30px',
                        padding: '0px 10px',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={1}>
                  <TextField
                    label="Mill AmtWO TCS"
                    id="Mill_AmtWO_TCS"
                    name="Mill_AmtWO_TCS"
                    autoComplete="off"
                    value={formData.Mill_AmtWO_TCS}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    variant="outlined"
                    size="small"
                    onInput={validateNumericInput}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '16px', fontWeight: 'bold' }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '30px',
                        padding: '0px 10px',
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2} mt={1} alignItems="center">
                <Grid item xs={1}>
                  <TextField
                    label="Truck No"
                    id="truck_no"
                    name="truck_no"
                    autoComplete="off"
                    value={formData.truck_no}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '16px', fontWeight: 'bold' },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '30px',
                        padding: '0px 10px',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={1}>
                  <TextField
                    label="Driver Mob No"
                    id="driver_no"
                    name="driver_no"
                    autoComplete="off"
                    value={formData.driver_no}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    variant="outlined"
                    size="small"
                    onInput={validateNumericInput}
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '16px', fontWeight: 'bold' }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '30px',
                        padding: '0px 10px',
                      },
                    }}
                  />
                </Grid>

                <div className="DeliveryOrderMainDiv" style={{ marginTop: "10px" }}>
                  <label htmlFor="Transport" className="DeliveryOrderLabel" style={{ marginTop: "5px" }}>
                    Transport :
                  </label>
                  <div className="debitCreditNote-col" >
                    <div className="debitCreditNote-form-group">
                      <AccountMasterHelp
                        onAcCodeClick={handletransport}
                        name="transport"
                        CategoryName={lbltransportname || transportcodename}
                        CategoryCode={newtransport || formData.transport || transportcode}
                        disabledFeild={!isEditing && addOneButtonEnabled}
                        Ac_type=''
                        onKeyDown={handleKeyDownCalculations}
                      />
                    </div>
                  </div>
                </div>


                <Grid item xs={1}>
                  <TextField
                    label="Pan No"
                    id="Pan_No"
                    name="Pan_No"
                    autoComplete="off"
                    value={formData.Pan_No}
                    onChange={handleChange}
                    disabled={!isEditing && addOneButtonEnabled}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '16px', fontWeight: 'bold' },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '30px',
                        padding: '0px 10px',
                      },
                    }}
                  />
                </Grid>

                <div className="DeliveryOrderMainDiv" style={{ marginLeft: "10px", marginTop: "10px" }}>
                  <label htmlFor="TransportGSTStateCode" className="DeliveryOrderLabel" style={{ marginTop: "5px" }}>
                    TransportGSTStateCode :
                  </label>
                  <div className="debitCreditNote-col" >
                    <div className="debitCreditNote-form-group">
                      <GSTStateMasterHelp
                        onAcCodeClick={handleTransportGSTStateCode}
                        name="TransportGSTStateCode"
                        GstStateName={lbltransportstatename || transportstatename}
                        GstStateCode={newTransportGSTStateCode || formData.TransportGSTStateCode}
                        disabledFeild={!isEditing && addOneButtonEnabled}
                      />
                    </div>
                  </div>
                </div>
              </Grid>

              <br></br>

              <div>
                <Grid container spacing={1} mt={-2}>
                  <Grid item xs={1}>
                    <TextField
                      fullWidth
                      label="Diff Amount"
                      type="text"
                      id="diff_amount"
                      name="diff_amount"
                      autoComplete="off"
                      value={formData.diff_amount}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      onInput={validateNumericInput}
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '16px', fontWeight: 'bold' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={1}>
                    <TextField
                      fullWidth
                      label="Freight"
                      type="text"
                      id="FreightPerQtl"
                      name="FreightPerQtl"
                      autoComplete="off"
                      value={formData.FreightPerQtl}
                      onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      onInput={validateNumericInput}
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '16px', fontWeight: 'bold' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={1}>
                    <TextField
                      fullWidth
                      label="Freight Amount"
                      type="text"
                      id="Freight_Amount"
                      name="Freight_Amount"
                      autoComplete="off"
                      value={formData.Freight_Amount}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      onInput={validateNumericInput}
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '16px', fontWeight: 'bold' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={1}>
                    <FormControl
                      fullWidth
                      disabled={!isEditing && addOneButtonEnabled}
                      sx={{ height: '40px' }}
                    >
                      <InputLabel
                        id="MM_CC"
                        sx={{ height: 'auto', paddingTop: 0, paddingBottom: 0 }}
                      >
                        MM_CC
                      </InputLabel>

                      <Select
                        id="MM_CC"
                        name="MM_CC"
                        autoComplete="off"
                        value={formData.MM_CC}
                        onChange={handleChange}
                        onKeyDown={handleKeyDownCalculations}
                        disabled={!isEditing && addOneButtonEnabled}
                        size="small"
                        sx={{ height: '30px' }}
                      >
                        <MenuItem value="Credit">Credit</MenuItem>
                        <MenuItem value="Cash">Cash</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={1}>
                    <TextField
                      label="MM_Rate"
                      type="text"
                      id="MM_Rate"
                      Name="MM_Rate"
                      autoComplete="off"
                      value={formData.MM_Rate}
                      onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      onInput={validateNumericInput}
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '16px', fontWeight: 'bold' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={1}>
                    <TextField
                      fullWidth
                      label="Memo Advance"
                      type="text"
                      id="Memo_Advance"
                      name="Memo_Advance"
                      autoComplete="off"
                      value={formData.Memo_Advance}
                      onChange={handleChange}
                      onKeyDown={handleKeyDownCalculations}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      onInput={validateNumericInput}
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '16px', fontWeight: 'bold' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>

                  <div className="DeliveryOrderMainDiv" style={{ marginLeft: "10px", marginTop: "10px" }} >
                    <label htmlFor="MemoGSTRate" className="DeliveryOrderLabel">
                      MemoGSTRate Code :
                    </label>
                    <div className="debitCreditNote-col" >
                      <div className="debitCreditNote-form-group">
                        <GSTRateMasterHelp
                          name="MemoGSTRate"
                          onAcCodeClick={handleMemoGSTRate}
                          GstRateName={lblMemoGSTRatename || GSTMemoGstrate}
                          GstRateCode={newMemoGSTRate || GSTMemoGstcode}
                          disabledFeild={!isEditing && addOneButtonEnabled}
                        />
                      </div>
                    </div>
                  </div>

                  <Grid item xs={1}>
                    <TextField
                      fullWidth
                      label="RCM Number"
                      type="text"
                      id="RCMNumber"
                      name="RCMNumber"
                      autoComplete="off"
                      value={formData.RCMNumber}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '16px', fontWeight: 'bold' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </div>

              <br></br>
              <div className="form-group">

                <div className="DeliveryOrderMainDiv">
                  <label htmlFor="TDSAc" className="DeliveryOrderLabel">
                    TDS Ac :
                  </label>
                  <div className="debitCreditNote-col" >
                    <div className="debitCreditNote-form-group">
                      <AccountMasterHelp
                        name="TDSAc"
                        Ac_type=''
                        onAcCodeClick={handleTDSAc}
                        CategoryName={lbltdsacname}
                        CategoryCode={newTDSAc || formData.TDSAc}
                        disabledFeild={!isEditing && addOneButtonEnabled}
                      />
                    </div>
                  </div>
                </div>

                <label htmlFor="TDSRate" className="DeliveryOrderLabel">TDSRate :</label>
                <input
                  type="text"
                  id="TDSRate"
                  Name="TDSRate"
                  autoComplete="off"
                  value={formData.TDSRate}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  onInput={validateNumericInput}
                  style={{ width: "50px" }}
                />
                <input
                  type="text"
                  id="TDSAmt"
                  Name="TDSAmt"
                  autoComplete="off"
                  value={formData.TDSAmt}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  onInput={validateNumericInput}
                  style={{ width: "80px" }}
                />

                <label htmlFor="TDSCut" className="DeliveryOrderLabel">Tds cut :</label>
                <input
                  type="checkbox"
                  id="TDSCut"
                  Name="TDSCut"
                  autoComplete="off"
                  value={formData.TDSCut}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                />

                <label htmlFor="Cash_diff" className="DeliveryOrderLabel">BP :</label>
                <input
                  type="text"
                  id="Cash_diff"
                  Name="Cash_diff"
                  autoComplete="off"
                  value={formData.Cash_diff}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  onInput={validateNumericInput}
                  style={{ width: "80px" }}
                />
                <label htmlFor="CashDiffAc" className="DeliveryOrderLabel">B.P Ac :</label>
                <AccountMasterHelp
                  name="CashDiffAc"
                  Ac_type=''
                  onAcCodeClick={handleCashDiffAc}
                  CategoryName={tenderDetails.buyername || lblcashdiffacname}
                  CategoryCode={tenderDetails.Buyer || newCashDiffAc}
                  disabledFeild={!isEditing && addOneButtonEnabled}
                />
              </div>
              <div className="form-group" >
                <label htmlFor="vasuli_rate" className="DeliveryOrderLabel">Vasuli :</label>
                <input
                  type="text"
                  id="vasuli_rate"
                  Name="vasuli_rate"
                  autoComplete="off"
                  value={formData.vasuli_rate}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  style={{ width: "50px" }}
                />
                <input
                  type="text"
                  id="vasuli_amount"
                  Name="vasuli_amount"
                  autoComplete="off"
                  value={formData.vasuli_amount}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  style={{ width: "80px" }}
                />
                <label htmlFor="vasuli_rate1" className="DeliveryOrderLabel">vasuli_rate1 :</label>
                <input
                  type="text"
                  id="vasuli_rate1"
                  Name="vasuli_rate1"
                  autoComplete="off"
                  value={formData.vasuli_rate1}
                  onChange={handleChange}
                  onKeyDown={handleKeyDownCalculations}
                  disabled={!isEditing && addOneButtonEnabled}
                  style={{ width: "50px", marginLeft: "5px", marginTop: "5px" }}
                />

                <input
                  type="text"
                  id="vasuli_amount1"
                  Name="vasuli_amount1"
                  autoComplete="off"
                  value={formData.vasuli_amount1}
                  onChange={handleChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  style={{ width: "80px", marginTop: "5px" }}
                />
                <label htmlFor="Vasuli_Ac" className="DeliveryOrderLabel">Vasuli Ac :</label>
                <AccountMasterHelp
                  name="Vasuli_Ac"
                  Ac_type=''
                  onAcCodeClick={handleVasuli_Ac}
                  CategoryName={lblvasuliacname}
                  CategoryCode={newVasuli_Ac}
                  disabledFeild={!isEditing && addOneButtonEnabled}
                />
                <label htmlFor="DO" className="DeliveryOrderLabel">DO :</label>
                <AccountMasterHelp
                  name="DO"
                  Ac_type=''
                  onAcCodeClick={handleDO}
                  CategoryName={tenderDetails.tenderdoname || lblDoname}
                  CategoryCode={tenderDetails.Tender_DO || newDO}
                  disabledFeild={!isEditing && addOneButtonEnabled}
                />
              </div>

              <div>
                <Grid container spacing={2}>
                  <Grid item xs={1}>
                    <TextField
                      fullWidth
                      label="MillEwayBill"
                      type="text"
                      id="MillEwayBill"
                      name="MillEwayBill"
                      autoComplete="off"
                      value={formData.MillEwayBill}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '16px', fontWeight: 'bold' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={1}>
                    <TextField
                      fullWidth
                      label="MillInvoiceNo"
                      type="text"
                      id="MillInvoiceNo"
                      name="MillInvoiceNo"
                      autoComplete="off"
                      value={formData.MillInvoiceNo}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '16px', fontWeight: 'bold' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={1}>
                    <TextField
                      fullWidth
                      label="Mill inv date"
                      type="date"
                      id="mill_inv_date"
                      name="mill_inv_date"
                      autoComplete="off"
                      value={formData.mill_inv_date}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        style: { fontSize: '12px' },
                      }}
                      InputProps={{
                        style: { fontSize: '12px', height: '35px' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={1}>
                    <label htmlFor="TDSCut" className="DeliveryOrderLabel">EWayBillChk:</label>
                    <input
                      type="checkbox"
                      id="EWayBillChk"
                      Name="EWayBillChk"
                      label="EWayBillChk"
                      value={formData.EWayBillChk}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      style={{ fontSize: '16px' }}
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '22px', fontWeight: 'bold' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={1}>
                    <TextField
                      fullWidth
                      label="EWay_Bill_No"
                      type="text"
                      id="EWay_Bill_No"
                      name="EWay_Bill_No"
                      autoComplete="off"
                      value={formData.EWay_Bill_No}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '16px', fontWeight: 'bold' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={1}>
                    <TextField
                      fullWidth
                      label="EwayBillValidDate"
                      type="date"
                      id="EwayBillValidDate"
                      name="EwayBillValidDate"
                      autoComplete="off"
                      value={formData.EwayBillValidDate}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        style: { fontSize: '16px', fontWeight: 'bold' },
                      }}
                      InputProps={{
                        style: { fontSize: '16px', height: '35px' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </div>
              <div>

                <Grid container spacing={2}>

                  <div className="DeliveryOrderMainDiv">
                    <label htmlFor="Broker" className="DeliveryOrderLabel">
                      Broker:
                    </label>
                    <div className="debitCreditNote-col" >
                      <div className="debitCreditNote-form-group">
                        <AccountMasterHelp
                          name="broker"
                          Ac_type=''
                          onAcCodeClick={handlebroker}
                          CategoryName={
                            ChangeData
                              ? brokerTitle
                              : tenderDetails.buyerpartyname || brokerTitle || lblbrokername
                          }
                          CategoryCode={
                            ChangeData
                              ? CarporateState.broker
                              : tenderDetails.Buyer_Party || newbroker
                          }
                          disabledFeild={!isEditing && addOneButtonEnabled}
                        />
                      </div>
                    </div>
                  </div>

                  <Grid item xs={1}>
                    <TextField
                      fullWidth
                      label="Distance"
                      type="text"
                      id="Distance"
                      name="Distance"
                      autoComplete="off"
                      value={formData.Distance}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '16px', fontWeight: 'bold' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={1}>
                    <label htmlFor="mill_rcv" className="DeliveryOrderLabel">Invoice checked </label>
                    <input
                      type="checkbox"
                      id="mill_rcv"
                      Name="mill_rcv"
                      autoComplete="off"
                      value={formData.mill_rcv}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '16px', fontWeight: 'bold' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={1}>
                    <TextField
                      fullWidth
                      label="SB Other Amount"
                      type="text"
                      id="SB_Other_Amount"
                      name="SB_Other_Amount"
                      autoComplete="off"
                      value={formData.SB_Other_Amount}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '16px', fontWeight: 'bold' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={2}>
                    <TextField
                      fullWidth
                      label="UTR Narration"
                      type="text"
                      id="narration1"
                      name="narration1"
                      autoComplete="off"
                      value={formData.narration1}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '16px', fontWeight: 'bold' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={2}>
                    <TextField
                      fullWidth
                      label="B.P Narration"
                      type="text"
                      id="narration2"
                      name="narration2"
                      autoComplete="off"
                      value={formData.narration2}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '16px', fontWeight: 'bold' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </div>

              <br></br>
              <div>
                <Grid container spacing={1} mt={-2}>
                  <Grid item xs={2}>
                    <TextField
                      fullWidth
                      label="DO Narration"
                      type="text"
                      id="narration3"
                      name="narration3"
                      autoComplete="off"
                      value={formData.narration3}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '16px', fontWeight: 'bold' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={2}>
                    <TextField
                      fullWidth
                      label="Narration 4"
                      type="text"
                      id="narration4"
                      name="narration4"
                      autoComplete="off"
                      value={formData.narration4}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '16px', fontWeight: 'bold' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={2}>
                    <TextField
                      fullWidth
                      label="Freight Narration"
                      type="text"
                      id="narration5"
                      name="narration5"
                      autoComplete="off"
                      value={formData.narration5}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '16px', fontWeight: 'bold' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={2}>
                    <TextField
                      fullWidth
                      label="SB Narration"
                      type="text"
                      id="SBNarration"
                      name="SBNarration"
                      autoComplete="off"
                      value={formData.SBNarration}
                      onChange={handleChange}
                      disabled={!isEditing && addOneButtonEnabled}
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '16px', fontWeight: 'bold' },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </div>

              <div className="form-group">
                {/* <label htmlFor="MailSend">mail send:</label> */}
                <label id="lblMailsend"></label>
              </div>
              <br></br>

              <div className="form-group">
                <Grid container spacing={2}>
                  {/* Voucher No */}
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label="Voucher No"
                      id="voucher_no"
                      name="voucher_no"
                      value={formData.voucher_no}
                      onChange={handleChange}
                      fullWidth
                      disabled={!isEditing && addOneButtonEnabled}
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>

                  {/* Voucher Type */}
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label="Voucher Type"
                      id="voucher_type"
                      name="voucher_type"
                      value={formData.voucher_type}
                      onChange={handleChange}
                      fullWidth
                      disabled={!isEditing && addOneButtonEnabled}
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>

                  {/* SB No */}
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label="SB No"
                      id="SB_No"
                      name="SB_No"
                      value={formData.SB_No}
                      onChange={handleChange}
                      fullWidth
                      disabled={!isEditing && addOneButtonEnabled}
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '30px',
                          padding: '0px 10px',
                        },
                      }}
                    />
                  </Grid>
                </Grid>

                <button
                  className="btn btn-primary"
                  onClick={handleSBGenerate}
                  disabled={!formData.SB_No == 0}
                  style={{ whiteSpace: 'nowrap', marginTop: "15px" }}
                >
                  SB Generate
                </button>
                <DeliveryOrderOurDoReport doc_no={formData.doc_no} />
                {/* <PartyBillDoReport doc_no={formData.doc_no} /> */}
                <SaleBillReport doc_no={formData.SB_No} disabledFeild={formData.SB_No === 0 || formData.SB_No === ""} />
              </div>

            </CardContent>
          </Card>

        </form>
      </div>
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner-container">
            <SaveUpdateSpinner />
          </div>
        </div>
      )}

      <div style={{ marginTop: "10px" }}>
        <AddButton openPopup={openPopup} isEditing={isEditing} ref={addButtonRef} setFocusToFirstField={setFocusToFirstField} />
      </div>

      <div className=" mt-4">

        {showPopup && (
          <div className="deliverorder-modal" role="dialog" >
            <div className="deliverorder-modal-dialog" role="document">
              <div className="deliverorder-modal-content">
                <div className="deliverorder-modal-header">
                  <h5 className="deliverorder-modal-title">
                    {selectedUser.id ? "Update Delivery Order" : "Add Delivery Order"}
                  </h5>
                  <button
                    type="button"
                    onClick={closePopup}
                    aria-label="Close"
                    style={{
                      width: "50px",
                      height: "45px",
                      backgroundColor: "#9bccf3",
                      borderRadius: "4px"
                    }}
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="deliverorder-modal-body">
                  <form>
                    <div className="deliverorder-row">
                      <label className="deliverorder-form-label">DD Type :</label>
                      <div className="deliverorder-form-group">
                        <select
                          id="ddType"
                          name="ddType"
                          value={formDataDetail.ddType}
                          onChange={handleChangeDetail}
                          disabled={!isEditing && addOneButtonEnabled}
                          className="deliverorder-form-control"
                        >
                          <option value="T">Transfer Letter</option>
                          <option value="D">Demand Draft</option>
                        </select>
                      </div>
                    </div>

                    <div className="deliverorder-row">
                      <label className="deliverorder-form-label">Bank Code :</label>
                      <div className="deliverorder-form-group" style={{ marginRight: "10px" }}>
                        <AccountMasterHelp
                          onAcCodeClick={handleBankCode}
                          CategoryName={tenderDetails.paymenttoname || bankcodeacname}
                          CategoryCode={tenderDetails.Payment_To || bankcode || formDataDetail.Bank_Code}
                          name="Bank_Code"
                          Ac_type=""
                          disabledFeild={!isEditing && addOneButtonEnabled}
                          className="deliverorder-form-control"
                        />
                      </div>
                    </div>

                    <div className="deliverorder-row">
                      <label className="deliverorder-form-label">Narration :</label>
                      <div className="deliverorder-form-group">
                        <input
                          type="text"
                          className="deliverorder-form-control"
                          id="Narration"
                          name="Narration"
                          value={formDataDetail.Narration}
                          onChange={handleChangeDetail}
                          disabled={!isEditing && addOneButtonEnabled}
                        />
                      </div>
                    </div>

                    <div className="deliverorder-row">
                      <label className="deliverorder-form-label">Amount :</label>
                      <div className="deliverorder-form-group">
                        <input
                          type="text"
                          className="deliverorder-form-control"
                          id="Amount"
                          name="Amount"
                          value={formDataDetail.Amount}
                          onChange={handleChangeDetail}
                          disabled={!isEditing && addOneButtonEnabled}
                        />
                      </div>
                    </div>

                    <div className="deliverorder-row">
                      <label className="deliverorder-form-label">UTR_NO :</label>
                      <div className="deliverorder-form-group">
                        <input
                          type="text"
                          className="deliverorder-form-control"
                          id="UTR_NO"
                          name="UTR_NO"
                          value={formDataDetail.UTR_NO}
                          onChange={handleChangeDetail}
                          disabled={!isEditing && addOneButtonEnabled}
                        />
                      </div>
                    </div>

                    <div className="deliverorder-row">
                      <label className="deliverorder-form-label">LTNo :</label>
                      <div className="deliverorder-form-group">
                        <input
                          type="text"
                          className="deliverorder-form-control"
                          id="LTNo"
                          name="LTNo"
                          value={formDataDetail.LTNo}
                          onChange={handleChangeDetail}
                          disabled={!isEditing && addOneButtonEnabled}
                        />
                      </div>
                    </div>
                  </form>
                </div>
                <div className="deliverorder-modal-footer">
                  {selectedUser.id ? (
                    <DetailUpdateButton updateUser={updateUser} />
                  ) : (
                    <DetailAddButtomCommon addUser={addUser} />
                  )}
                  <DetailCloseButton closePopup={closePopup} />
                </div>
              </div>
            </div>
          </div>
        )}

        <Table className="mt-4" bordered style={{ marginBottom: "60px" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={headerCellStyle}>Actions</TableCell>
              <TableCell sx={headerCellStyle}>ID</TableCell>
              <TableCell sx={headerCellStyle}>DD Type</TableCell>
              <TableCell sx={headerCellStyle}>Bank Code</TableCell>
              <TableCell sx={headerCellStyle}>Bank Name</TableCell>
              <TableCell sx={headerCellStyle}>Narration</TableCell>
              <TableCell sx={headerCellStyle}>Amount</TableCell>
              <TableCell sx={headerCellStyle}>Utr No</TableCell>
              <TableCell sx={headerCellStyle}>Lot No</TableCell>
              <TableCell sx={headerCellStyle}>bc</TableCell>
              <TableCell sx={headerCellStyle}>dodetailid</TableCell>
              <TableCell sx={headerCellStyle}>Rowaction</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user,index) => (
              <TableRow key={user.id}>
                <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>
                  {user.rowaction === 'add' ||
                    user.rowaction === 'update' ||
                    user.rowaction === 'Normal' ? (
                    <>
                      <EditButton editUser={editUser} user={user} isEditing={isEditing} />
                      <DeleteButton deleteModeHandler={deleteModeHandler} user={user} isEditing={isEditing} disabled={!isEditing || index === 0} />
                    </>
                  ) : user.rowaction === 'DNU' || user.rowaction === 'delete' ? (
                    <OpenButton openDelete={openDelete} user={user} />
                  ) : null}
                </TableCell>
                <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>{user.id}</TableCell>
                <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>{user.ddType}</TableCell>
                <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>{user.Bank_Code || tenderDetails.Payment_To}</TableCell>
                <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>
                  {user.bankcodeacname ||
                    tenderDetails.paymenttoname
                  }
                </TableCell>
                <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>{user.Narration}</TableCell>
                <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>{user.Amount}</TableCell>
                <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>{user.UTR_NO}</TableCell>
                <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>{user.LTNo}</TableCell>
                <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>{user.bc || tenderDetails.pt}</TableCell>
                <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>{user.dodetailid}</TableCell>
                <TableCell sx={{ padding: '2px 4px', textAlign: 'center', fontSize: '12px' }}>{user.rowaction}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <br></br>
    </>
  );

};
export default DeliveryOrder;