import React from "react";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { HashLoader } from 'react-spinners';
import {
  Grid,
  TextField,
  Typography,
  FormControl
} from "@mui/material";
import "react-toastify/dist/ReactToastify.css";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";

const API_URL = process.env.REACT_APP_API;

var Exps_Name = "";
var newExps_Ac = "";

const OtherGSTInput = () => {
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
  const [accountCode, setAccountCode] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const companyCode = sessionStorage.getItem("Company_Code");
  const yearCode = sessionStorage.getItem("Year_Code");

  const navigate = useNavigate();
  //In utility page record doubleClicked that recod show for edit functionality
  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;
  const permissions = location.state?.permissionsData;
  const dateInputRef = useRef(null);
  const initialFormData = {
    Doc_No: "",
    TRAN_TYPE: "",
    Doc_Date:new Date().toISOString().split('T')[0],
    SGST_Amt: "",
    CGST_Amt: "",
    IGST_Amt: "",
    Exps_Ac: "",
    Narration: "",
    Company_Code: companyCode,
    Created_By: "",
    Modified_By: "",
    Year_Code: yearCode,
    Created_Date: new Date().toISOString().split('T')[0],
    ea: "",
    Modified_Date: new Date().toISOString().split('T')[0],
  };

  useEffect(() => {
    if (isEditing) {
      if (dateInputRef.current) {
        dateInputRef.current.focus();
      }
    }
  }, [isEditing]);
  const [formData, setFormData] = useState(initialFormData);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => {
      const updatedFormData = { ...prevState, [name]: value };
      return updatedFormData;
    });
  };

  const handleAccountMasterGroupCode = (code,accoid) => {
    setAccountCode(code);
    setFormData({
      ...formData,
      Exps_Ac: code,
      ea:accoid
    });
  };


  const fetchLastRecord = () => {
    const apiUrl = `${API_URL}/getNextDocNo_OtherGSTInput?Company_Code=${companyCode}&Year_Code=${yearCode}`;
  
    fetch(apiUrl)
      .then((response) => { 
        if (!response.ok) {
          throw new Error(`Failed to fetch last record, status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data && data.next_doc_no) {
          setFormData((prevState) => ({
            ...prevState,
            Doc_No: data.next_doc_no, 
          }));
        } else {
          console.error("Next document number is not found in the response");
        }
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
    fetchLastRecord();
    setFormData(initialFormData);
    setAccountCode("");
    Exps_Name = "";
    newExps_Ac = "";
    setTimeout(() => {
      dateInputRef.current?.focus();
    }, 0);
  };

  const handleSaveOrUpdate = () => {
  setLoading(true);

  const preparedData = {
    ...formData,
  };

  const apiUrl = isEditMode
    ? `${API_URL}/update-OtherGSTInput?Doc_No=${formData.Doc_No}&Company_Code=${companyCode}&Year_Code=${yearCode}`
    : `${API_URL}/create-OtherGSTInput?Company_Code=${companyCode}&Year_Code=${yearCode}`;

  const request = isEditMode ? axios.put(apiUrl, preparedData) : axios.post(apiUrl, preparedData);

  request
    .then((response) => {
      toast.success(isEditMode ? 'Data updated successfully!' : 'Data saved successfully!');
      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);
      setUpdateButtonClicked(true);
      setIsEditing(false);
      setLoading(false);
    })
    .catch((error) => {
      console.error(isEditMode ? 'Error updating data:' : 'Error saving data:', error);
      toast.error('Something went wrong. Please try again.');
      handleCancel();
      setLoading(false);
    });
};


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
  const handleCancel = () => {
    axios
      .get(
        `${API_URL}/get_last_OtherGSTInput?Company_Code=${companyCode}&Year_Code=${yearCode}`
      )
      .then((response) => {
        const data = response.data;
        newExps_Ac = data.Exps_Ac;
        Exps_Name = data.Account_Name;

        setFormData({
          ...formData,
          ...data,
          Exps_Ac: newExps_Ac,
        });
      })
      .catch((error) => {
        console.error("Error fetching latest data for edit:", error);
        toast.error("Failed to fetch latest data.");
      });
    setIsEditing(false);
    setIsEditMode(false);
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
  };

  const handleDelete = async () => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete this record ${formData.Doc_No}?`
    );

    if (isConfirmed) {
      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);

      try {
        const deleteApiUrl = `${API_URL}/delete-OtherGSTInput?Doc_No=${formData.Doc_No}&Company_Code=${companyCode}&Year_Code=${yearCode}`;
        const response = await axios.delete(deleteApiUrl);
         toast.success("Record deleted successfully!");
        handleCancel();
      } catch (error) {
         toast.error("Deletion cancelled");
        console.error("Error during API call:", error);
      }
    } else {
      console.log("Deletion cancelled");
    }
  };

  const handleBack = () => {
    navigate("/OtherGSTInput-utility");
  };

  useEffect(() => {
    if (selectedRecord) {
      handlerecordDoubleClicked();
    } else {
      handleAddOne();
    }
  }, [selectedRecord]);

  //Handle Record DoubleCliked in Utility Page Show that record for Edit
  const handlerecordDoubleClicked = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/get-OtherGSTInput-by-DocNo?Company_Code=${companyCode}&Doc_No=${selectedRecord.Doc_No}&Year_Code=${yearCode}`
      );
      const data = response.data;
      newExps_Ac = data.Exps_Ac;
      Exps_Name = data.Account_Name;
      setFormData({
        ...formData,
        ...data,
        Exps_Ac: newExps_Ac,
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
    } else {
      handleAddOne();
    }
  }, [selectedRecord]);

  //change No functionality to get that particular record
  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(
          `${API_URL}/get-OtherPurchaseSelectedRecord?Company_Code=${companyCode}&______=${changeNoValue}`
        );
        const data = response.data;
        setFormData(data);
        setIsEditing(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  //Navigation Buttons
  const handleFirstButtonClick = async () => {
    try {
      const response = await fetch(
        `${API_URL}/get-first-OtherGSTInput?Company_Code=${companyCode}&Year_Code=${yearCode}`
      );
      if (response.ok) {
        const data = await response.json();
        const firstUserCreation = data;
        Exps_Name = data.Account_Name;
        newExps_Ac = data.Exps_Ac;
        setFormData({
          ...formData,
          ...firstUserCreation,
          Exps_Ac: newExps_Ac,
        });
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
        `${API_URL}/get_previous_OtherGSTInput?Doc_No=${formData.Doc_No}&Company_Code=${companyCode}&Year_Code=${yearCode}`
      );

      if (response.ok) {
        const data = await response.json();
        newExps_Ac = data.Exps_Ac;
        Exps_Name = data.Account_Name;
        setFormData({
          ...formData,
          ...data,
          Exps_Ac: newExps_Ac,
        });
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
        `${API_URL}/get_next_OtherGSTInput?Doc_No=${formData.Doc_No}&Company_Code=${companyCode}&Year_Code=${yearCode}`
      );

      if (response.ok) {
        const data = await response.json();
        Exps_Name = data.Account_Name;
        newExps_Ac = data.Exps_Ac;
        setFormData({
          ...formData,
          ...data,
          Exps_Ac: newExps_Ac,
        });
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
        `${API_URL}/get_last_OtherGSTInput?Company_Code=${companyCode}&Year_Code=${yearCode}`
      );
      if (response.ok) {
        const data = await response.json();
        const last_Navigation = data;
        newExps_Ac = data.Exps_Ac;

        setFormData({
          ...formData,
          ...last_Navigation,
          Exps_Ac: newExps_Ac,
        });
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

  return (
    <>
      <div>
      <h5>Other GST Input</h5>
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

      
      
        <form>
          
  
          <Grid item xs={12} sx={6} mt={1}>
          <TextField
                label="Doc No"
                id="Doc_No"
                name="Doc_No"
                value={formData.Doc_No || ""}
                onChange={handleChange}
                disabled
                size="small"
                sx={{
                  width:"25%"
                }}
              />
         </Grid>
       

        
          <Grid item xs={12} sx={3} mt={1}>
          <TextField
                label="Date"
                id="Doc_Date"
                name="Doc_Date"
                type="date"
                inputRef={dateInputRef}
                value={formData.Doc_Date || ""}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                sx={{
                  width:"25%"
                }}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
         </Grid>
        
        
          <Grid item xs={12} sx={3} mt={1}>
          <TextField
                label="CGST Amount"
                id="CGST_Amt"
                name="CGST_Amt"
                value={formData.CGST_Amt || ""}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                sx={{
                  width:"25%"
                }}
                size="small"
              />
         </Grid>
       


        
          <Grid item xs={12} sx={3} mt={1}>
          <TextField
                label="SGST Amount"
                id="SGST_Amt"
                name="SGST_Amt"
                value={formData.SGST_Amt || ""}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                sx={{
                  width:"25%"
                }}
                size="small"
              />
         </Grid>
        
       
          <Grid item xs={12} sx={3} mt={1}>
          <TextField
                label="IGST Amount"
                id="IGST_Amt"
                name="IGST_Amt"
                value={formData.IGST_Amt || ""}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                sx={{
                  width:"25%"
                }}
                size="small"
              />
         </Grid>
         

         {/* <Typography>Expenses A/C</Typography>
         <FormControl fullWidth variant="outlined" size="small" disabled={!isEditing && addOneButtonEnabled}>
            <AccountMasterHelp
              name="Exps_Ac"
              onAcCodeClick={handleAccountMasterGroupCode}
              CategoryName={Exps_Name}
              CategoryCode={newExps_Ac}
              Ac_type=""
              tabIndex={6}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
          </FormControl> */}

          <Grid container spacing={1}>
          <label htmlFor="Exps_Ac" style={{ marginTop: "30px", marginLeft: "83vh" }}>Expenses A/C</label>
          <Grid item xs={5} sx={{ mt: -4 , ml: "93vh"}}>
            <FormControl fullWidth variant="outlined" size="small" >
            <AccountMasterHelp
              name="Exps_Ac"
              onAcCodeClick={handleAccountMasterGroupCode}
              CategoryName={Exps_Name}
              CategoryCode={newExps_Ac}
              Ac_type=""
              tabIndex={6}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
            </FormControl>
          </Grid>
        </Grid>
        
          
          <Grid item xs={12} sx={12} mt={1}>
          <TextField
                label="Narration"
                id="Narration"
                name="Narration"
                value={formData.Narration || ""}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                multiline
                rows={4}
                sx={{
                  width:"25%"
                }}
                size="small"
              />
         </Grid>
         
          {loading && (
                        <div className="loading-overlay">
                            <div className="spinner-container">
                                <HashLoader color="#007bff" loading={loading} size={80} />
                            </div>
                        </div>
                    )}
        </form>
     
    </>
  );
};
export default OtherGSTInput;
