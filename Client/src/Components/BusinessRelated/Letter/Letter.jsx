import React, { useState, useEffect, useRef } from "react";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import { useNavigate, useLocation } from "react-router-dom";
import "./Letter.css";
import axios, { isCancel } from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = process.env.REACT_APP_API;

var partyCode = "";
var partyName = "";
var unitCode = "";
var unitName = "";

const Letter = () => {
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
  const [party, setParty] = useState("");
  const [unit, setUnit] = useState("");
  const companyCode = sessionStorage.getItem("Company_Code");
  const yearCode = sessionStorage.getItem("Year_Code");
  const navigate = useNavigate();
  const [party_Name, setPartyName] = useState("");

  const acCodeRef = useRef(null);
  const changeNoRef = useRef(null);
  //In utility page record doubleClicked that recod show for edit functionality
  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;
  const initialFormData = {
    DOC_NO: "",
    DOC_DATE: new Date().toISOString().split("T")[0],
    AC_CODE: 0.0,
    AC_NAME: "",
    ADDRESS: "",
    CITY: "",
    PINCODE: "",
    KIND_ATT: "",
    SUBJECT: "",
    REF_NO: "",
    REF_DT: new Date().toISOString().split("T")[0],
    MATTER: "",
    AUTHORISED_PERSON: "",
    DESIGNATION: "",
    Company_Code: parseInt(companyCode),
    Year_Code: parseInt(yearCode),
    Branch_Code: 0.0,
    Created_By: "",
    Modified_By: "",
  };
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
     if (isCancel) {
      if (changeNoRef.current) {
        changeNoRef.current.focus();
      }
    }
  }, [isEditing, isCancel]);

  // Handle change for all inputs
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => {
      const updatedFormData = { ...prevState, [name]: value };
      return updatedFormData;
    });
  };

  const handleParty = (code, accoid, name) => {
    setParty(code);
    setPartyName(name);
    setFormData({
      ...formData,
      AC_CODE: code,
      AC_NAME: name,
    });
  };

  const fetchLastRecord = () => {
    fetch(
      `${API_URL}/get-next-letter-no?Company_Code=${companyCode}&Year_Code=${yearCode}`
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
          DOC_NO: parseInt(data.next_doc_no),
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
    fetchLastRecord();
    setFormData(initialFormData);
    partyCode = "";
    partyName = "";
    setTimeout(() => {
      acCodeRef.current?.focus();
    }, 0);
  };

  const handleSaveOrUpdate = () => {
    if (isEditMode) {
      axios
        .put(`${API_URL}/update-Letter`, formData)
        .then((response) => {
          toast.success("Record update successfully!");
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
      axios
        .post(`${API_URL}/insert-Letter`, formData)
        .then((response) => {
          toast.success("Record Create successfully!");
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
    axios
      .get(
        `${API_URL}/getLast_Letter?Company_Code=${companyCode}&Year_Code=${yearCode}`
      )
      .then((response) => {
        const data = response.data;
        partyCode = data.lastLetterData.AC_CODE;

        setFormData({
          ...formData,
          ...data.lastLetterData,
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
    const isConfirmed = window.confirm(
      `Are you sure you want to delete this Entry ${formData.DOC_NO}?`
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
        const deleteApiUrl = `${API_URL}/delete-Letter?DOC_NO=${formData.DOC_NO}&Company_Code=${companyCode}&Year_Code=${yearCode}`;
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
    navigate("/letter");
  };

  //Handle Record DoubleCliked in Utility Page Show that record for Edit
  const handlerecordDoubleClicked = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/getByDocNo_Letter?Company_Code=${companyCode}&DOC_NO=${selectedRecord.DOC_NO}&Year_Code=${yearCode}`
      );
      const data = response.data;
      partyCode = data.letterData.AC_CODE;

      setFormData({
        ...formData,
        ...data.letterData,
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
      const inputName = event.target.name;
      const inputValue = event.target.value;

      let apiUrl = `${API_URL}/getByDocNo_Letter?Company_Code=${companyCode}&DOC_NO=${inputValue}&Year_Code=${yearCode}`;

      try {
        const response = await axios.get(apiUrl);
        const data = response.data;
        partyCode = data.letterData.AC_CODE;

        if (inputName === "changeNo") {
          setFormData({
            ...formData,
            ...data.letterData,
          });
        } else if (inputName === "copyLetterNo") {
          setFormData({
            ...formData,
            ...data.letterData,
            DOC_NO: formData.DOC_NO, 
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  //Navigation Buttons
  const handleFirstButtonClick = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/getFirst_Letter?Company_Code=${companyCode}&Year_Code=${yearCode}`
      );
      const data = response.data;
      partyCode = data.firstLetterData.AC_CODE;

      setFormData({
        ...formData,
        ...data.firstLetterData,
      });
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handlePreviousButtonClick = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/getPrevious_Letter?Company_Code=${companyCode}&Year_Code=${yearCode}&DOC_NO=${formData.DOC_NO}`
      );
      const data = response.data;
      partyCode = data.previousLetterData.AC_CODE;

      setFormData({
        ...formData,
        ...data.previousLetterData,
      });
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handleNextButtonClick = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/getNext_Letter?Company_Code=${companyCode}&Year_Code=${yearCode}&DOC_NO=${formData.DOC_NO}`
      );
      const data = response.data;
      partyCode = data.nextLetterData.AC_CODE;

      setFormData({
        ...formData,
        ...data.nextLetterData,
      });
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  return (
    <>
      <div className="container">
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
        />
        <div>
          <NavigationButtons
            handleFirstButtonClick={handleFirstButtonClick}
            handlePreviousButtonClick={handlePreviousButtonClick}
            handleNextButtonClick={handleNextButtonClick}
            handleLastButtonClick={handleCancel}
            highlightedButton={highlightedButton}
            isEditing={isEditing}
            isFirstRecord={formData.Company_Code === 1}
          />
        </div>
      </div>

      <div className="letter-form-container">
        <form>
          <h2>Letter</h2>
          <br />
          <div className="letter-form-group ">
            <label htmlFor="changeNo">Change No:</label>
            <input
              type="text"
              id="changeNo"
              Name="changeNo"
              tabIndex={1}
              onKeyDown={handleKeyDown}
              disabled={!addOneButtonEnabled}
              ref={changeNoRef}
            />
          </div>
          <div className="letter-form-group">
            <label htmlFor="DOC_NO">Letter No:</label>
            <input
              type="text"
              id="DOC_NO"
              Name="DOC_NO"
              value={formData.DOC_NO}
              tabIndex={2}
              onChange={handleChange}
              disabled={true}
            />

            <label htmlFor="copyLetterNo">From Letter No:</label>
            <input
              type="text"
              id="copyLetterNo"
              name="copyLetterNo"
              ref={acCodeRef}
              tabIndex={1}
              onKeyDown={handleKeyDown}
              disabled={!saveButtonEnabled}
            />

            <label htmlFor="DOC_DATE">Date</label>
            <input
              type="date"
              id="DOC_DATE"
              name="DOC_DATE"
              value={formData.DOC_DATE}
              tabIndex={2}
              onChange={handleChange}
              disabled={true}
            />
          </div>
          <div className="letter-form-group">
            <label htmlFor="AC_CODE">Party</label>
            <AccountMasterHelp
              key={Date.now()}
              onAcCodeClick={handleParty}
              CategoryName={null}
              CategoryCode={party || partyCode}
              name="AC_CODE"
              tabIndexHelp={3}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
            <input
              type="text"
              id="AC_NAME"
              name="AC_NAME"
              value={party_Name || formData.AC_NAME}
              onChange={(e) => setPartyName(e.target.value)}
              tabIndex={4}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </div>

          <div className="letter-form-group">
            <label htmlFor="ADDRESS">Address:</label>
            <input
              type="text"
              id="ADDRESS"
              Name="ADDRESS"
              value={formData.ADDRESS}
              tabIndex={5}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </div>

          <div className="letter-form-group">
            <label htmlFor="CITY">City:</label>
            <input
              type="text"
              id="CITY"
              Name="CITY"
              value={formData.CITY}
              tabIndex={5}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            />

            <label htmlFor="PINCODE">Pincode:</label>
            <input
              type="text"
              id="PINCODE"
              Name="PINCODE"
              value={formData.PINCODE}
              tabIndex={5}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </div>

          <div className="letter-form-group">
            <label htmlFor="KIND_ATT">KIND_ATT:</label>
            <input
              type="text"
              id="KIND_ATT"
              Name="KIND_ATT"
              value={formData.KIND_ATT}
              tabIndex={5}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </div>
          <div className="letter-form-group">
            <label htmlFor="REF_NO">REF_NO:</label>
            <input
              type="text"
              id="REF_NO"
              Name="REF_NO"
              value={formData.REF_NO}
              tabIndex={5}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            />
            <label htmlFor="REF_DT">Dated:</label>
            <input
              type="date"
              id="REF_DT"
              Name="REF_DT"
              value={formData.REF_DT}
              tabIndex={5}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </div>
          <div className="letter-form-group">
            <label htmlFor="SUBJECT">SUBJECT:</label>
            <input
              type="text"
              id="SUBJECT"
              Name="SUBJECT"
              value={formData.SUBJECT}
              tabIndex={5}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </div>
          <div className="letter-form-group">
            <label htmlFor="MATTER">MATTER:</label>
            <textarea
              type="text"
              id="MATTER"
              Name="MATTER"
              value={formData.MATTER}
              tabIndex={5}
              rows={10}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </div>
          <div className="letter-form-group">
            <label htmlFor="AUTHORISED_PERSON">Authorized Person:</label>
            <input
              type="text"
              id="AUTHORISED_PERSON"
              Name="AUTHORISED_PERSON"
              value={formData.AUTHORISED_PERSON}
              tabIndex={5}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            />
            <label htmlFor="DESIGNATION">Designation:</label>
            <input
              type="text"
              id="DESIGNATION"
              Name="DESIGNATION"
              value={formData.DESIGNATION}
              tabIndex={5}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </div>
        </form>
      </div>
    </>
  );
};

export default Letter;
