import React, { useState, useEffect, useRef } from 'react';
import ActionButtonGroup from '../../../../Common/CommonButtons/ActionButtonGroup';
import NavigationButtons from "../../../../Common/CommonButtons/NavigationButtons";
import { useNavigate, useLocation } from 'react-router-dom';
import './GSTRateMaster.css';
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserAuditInfo from "../../../../Common/UserAuditInfo/UserAuditInfo";
import Swal from "sweetalert2";

const API_URL = process.env.REACT_APP_API;

const GSTRateMaster = () => {
  //Fetch necessary values from the session.
  const companyCode = sessionStorage.getItem('Company_Code')
  const year_code = sessionStorage.getItem('Year_Code')
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
  const inputRef = useRef(null);
  const navigate = useNavigate();

  //In utility page record doubleClicked that recod show for edit functionality
  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;
  const permissions = location.state?.permissionsData;

  const initialFormData = {
    CGST: '',
    Company_Code: companyCode,
    Doc_no: '',
    GST_Name: '',
    IGST: '',
    Rate: '',
    Remark: '',
    SGST: '',
    Year_Code: year_code
  };
  const [formData, setFormData] = useState(initialFormData);

  // Handle change for all inputs
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevState => {
      const updatedFormData = { ...prevState, [name]: value };
      return updatedFormData;
    });
  };

  const fetchLastGSTRateDocNo = () => {
    fetch(`${API_URL}/get-GSTRateMaster-lastRecord?Company_Code=${companyCode}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch last company code');
        }
        return response.json();
      })
      .then(data => {
        setFormData(prevState => ({
          ...prevState,
          Doc_no: data.Doc_no + 1
        }));
      })
      .catch(error => {
        console.error('Error fetching last company code:', error);
      });
  };

  const handleAddOne = () => {
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);
    fetchLastGSTRateDocNo()
    setFormData(initialFormData)
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }

  const handleSaveOrUpdate = () => {
    let updatedFormData = {
      ...formData
    }
    if (isEditMode) {
      updatedFormData = {
        ...updatedFormData,
        Modified_By: username
      }
      axios
        .put(
          `${API_URL}/update_GSTRateMaster?Company_Code=${companyCode}&Doc_no=${formData.Doc_no}`, updatedFormData
        )
        .then((response) => {
          toast.success("Record updated successfully!");
          setIsEditMode(false);
          setAddOneButtonEnabled(true);
          setEditButtonEnabled(true);
          setDeleteButtonEnabled(true);
          setBackButtonEnabled(true);
          setSaveButtonEnabled(false);
          setCancelButtonEnabled(false);
          setUpdateButtonClicked(true);
          setIsEditing(false);
        })
        .catch((error) => {
          handleCancel();
          console.error("Error updating data:", error);
        });
    } else {
      updatedFormData = {
        ...updatedFormData,
        Created_By: username
      }
      axios
        .post(`${API_URL}/create_GSTRateMaster`, updatedFormData)
        .then((response) => {
          toast.success("Record successfully Created!");
          setIsEditMode(false);
          setAddOneButtonEnabled(true);
          setEditButtonEnabled(true);
          setDeleteButtonEnabled(true);
          setBackButtonEnabled(true);
          setSaveButtonEnabled(false);
          setCancelButtonEnabled(false);
          setUpdateButtonClicked(true);
          setIsEditing(false);
        })
        .catch((error) => {
          console.error("Error saving data:", error);
        });
    }
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
    axios.get(`${API_URL}/get-GSTRateMaster-lastRecord?Company_Code=${companyCode}`)
      .then((response) => {
        const data = response.data;
        setFormData({
          ...formData, ...data
        });
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
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You won't be able to revert this Doc No : ${formData.Doc_no}`,
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

      try {
        const deleteApiUrl = `${API_URL}/delete_GSTRateMaster?Company_Code=${companyCode}&Doc_no=${formData.Doc_no}`;
        const response = await axios.delete(deleteApiUrl);
        toast.success("Record deleted successfully!");
        handleCancel();

      } catch (error) {
        toast.error("Deletion cancelled");
        console.error("Error during API call:", error);
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
    navigate("/gst-rate-masterutility")
  }

  //Navigation Buttons 
  const handleFirstButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/get-first-GSTRateMaster`);
      if (response.ok) {
        const data = await response.json();
        const firstUserCreation = data[0];

        setFormData({
          ...formData, ...firstUserCreation,

        });

      } else {
        console.error("Failed to fetch first tender data:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handlePreviousButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/get-previous-GSTRateMaster?Doc_no=${formData.Doc_no}`);

      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...formData, ...data,
        });

      } else {
        console.error("Failed to fetch previous tender data:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handleNextButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/get-next-GSTRateMaster?Doc_no=${formData.Doc_no}`);

      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...formData, ...data.nextSelectedRecord

        });
      } else {
        console.error("Failed to fetch next company creation data:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handleLastButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/get-last-GSTRateMaster`);
      if (response.ok) {
        const data = await response.json();
        const last_Navigation = data[0];
        setFormData({
          ...formData, ...last_Navigation,
        });
      } else {
        console.error("Failed to fetch first tender data:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  }

  //Handle Record DoubleCliked in Utility Page Show that record for Edit
  const handlerecordDoubleClicked = async () => {
    try {
      const response = await axios.get(`${API_URL}/get-GSTRateMasterSelectedRecord?Company_Code=${companyCode}&Doc_no=${selectedRecord.Doc_no}`);
      const data = response.data;
      setFormData({
        ...formData, ...data
      });
      setIsEditing(false);

    } catch (error) {
      console.error('Error fetching data:', error);
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
  }

  useEffect(() => {
    if (selectedRecord) {
      handlerecordDoubleClicked();
    } else {
      handleAddOne()
    }

  }, [selectedRecord]);

  //change No functionality to get that particular record
  const handleKeyDown = async (event) => {
    if (event.key === 'Tab') {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(`${API_URL}/get-GSTRateMasterSelectedRecord?Company_Code=${companyCode}&Doc_no=${changeNoValue}`);
        const data = response.data;
        setFormData(data);
        setIsEditing(false);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
  };

  return (
    <>
      <UserAuditInfo
        createdBy={formData.Created_By}
        modifiedBy={formData.Modified_By}
      />
      <br></br>
      <br></br>
      <br></br>
      <div >
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
          permissions={permissions}
          nextTabIndex={8}
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
      <div >
        <form className="gst-rate-master-form">
          <h2 className="form-titlegstratemaster">GST Rate Master</h2>
          <br />
          <div className="groupgstratemaster">
            <label htmlFor="changeNo" className="form-labelgstratemaster">Change No :</label>
            <input
              type="text"
              id="changeNo"
              name="changeNo"
              onKeyDown={handleKeyDown}
              disabled={!addOneButtonEnabled}
              className="form-inputgstratemaster"
              tabIndex={1}
            />
          </div>
          <div className="groupgstratemaster">
            <label htmlFor="Doc_no" className="form-labelgstratemaster">Doc No :</label>
            <input
              type="text"
              id="Doc_no"
              name="Doc_no"
              autoComplete='off'
              value={formData.Doc_no}
              onChange={handleChange}
              disabled
              className="form-inputgstratemaster"
              tabIndex={2}
            />
          </div>
          <div className="groupgstratemaster">
            <label htmlFor="GST_Name" className="form-labelgstratemaster">GST Name :</label>
            <input
              type="text"
              id="GST_Name"
              name="GST_Name"
              autoComplete='off'
              value={formData.GST_Name}
              ref={inputRef}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              className="form-inputgstratemaster"
              tabIndex={3}
            />
          </div>
          <div className="groupgstratemaster">
            <label htmlFor="Rate" className="form-labelgstratemaster">Rate :</label>
            <input
              type="number"
              id="Rate"
              name="Rate"
              autoComplete='off'
              value={formData.Rate}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              className="form-inputgstratemaster"
              tabIndex={4}
            />
          </div>
          <div className="groupgstratemaster">
            <label htmlFor="IGST" className="form-labelgstratemaster">IGST :</label>
            <input
              type="number"
              id="IGST"
              name="IGST"
              autoComplete='off'
              value={formData.IGST}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              className="form-inputgstratemaster"
              tabIndex={5}
            />
          </div>
          <div className="groupgstratemaster">
            <label htmlFor="SGST" className="form-labelgstratemaster">SGST :</label>
            <input
              type="number"
              id="SGST"
              name="SGST"
              autoComplete='off'
              value={formData.SGST}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              className="form-inputgstratemaster"
              tabIndex={6}
            />
          </div>
          <div className="groupgstratemaster">
            <label htmlFor="CGST" className="form-labelgstratemaster">CGST :</label>
            <input
              type="number"
              id="CGST"
              name="CGST"
              autoComplete='off'
              value={formData.CGST}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              className="form-inputgstratemaster"
              tabIndex={7}
            />
          </div>
        </form>
      </div>
    </>
  );
};

export default GSTRateMaster;
