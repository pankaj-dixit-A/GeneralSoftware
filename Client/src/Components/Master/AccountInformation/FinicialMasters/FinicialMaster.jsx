import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
} from "react";
import ActionButtonGroup from "../../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../../Common/CommonButtons/NavigationButtons";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  TextField,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Container,
} from "@mui/material";
import UserAuditInfo from "../../../../Common/UserAuditInfo/UserAuditInfo";
import Swal from "sweetalert2";

const API_URL = process.env.REACT_APP_API;

const FinicialMaster = ({ isPopup = false }, ref) => {
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
  const companyCode = sessionStorage.getItem("Company_Code");
  const navigate = useNavigate();
  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;
  const permissions = location.state?.permissionsData;
  const type = location.state?.type;
  const username = sessionStorage.getItem("username");

  const inputRef = useRef(null);

  const initialFormData = {
    group_Code: "",
    group_Name_E: "",
    group_Summary: "Y",
    group_Type: type || selectedRecord?.group_Type || "B",
    group_Order: "",
    Created_By: "",
    Modified_By: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  useImperativeHandle(ref, () => ({
    getFormData: () => formData,
  }));

  // Handle change for all inputs
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => {
      const updatedFormData = { ...prevState, [name]: value };
      return updatedFormData;
    });
  };

  const fetchLastGrouCode = () => {
    fetch(
      `${API_URL}/get_last_group_by_company_code?Company_Code=${companyCode}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch last company code");
        }
        return response.json();
      })
      .then((data) => {
        setFormData((prevState) => ({
          ...prevState,
          group_Code: data.group_Code + 1,
        }));
      })
      .catch((error) => {
        console.error("Error fetching last company code:", error);
      });
  };

  const handleAddOne = () => {
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);
    fetchLastGrouCode();
    setFormData(initialFormData);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSaveOrUpdate = () => {

    const { group_Code, group_Name_E, group_Summary, group_Type, group_Order } = formData;

    if (isEditMode) {
      const form_data = {
        group_Code,
        group_Name_E,
        group_Summary,
        group_Type,
        group_Order,
        Modified_By: username,
      };

      axios
        .put(
          `${API_URL}/update-finicial-group?group_Code=${formData.group_Code}&Company_Code=${companyCode}`,
          form_data
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
      const form_data = {
        group_Code,
        group_Name_E,
        group_Summary,
        group_Type,
        group_Order,
        Created_By: username,
      };
      axios
        .post(
          `${API_URL}/create-finicial-group?Company_Code=${companyCode}`,
          form_data
        )
        .then((response) => {
          toast.success("Record Created successfully!");
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
        `${API_URL}/get_last_group_by_company_code?Company_Code=${companyCode}`
      )
      .then((response) => {
        const data = response.data;
        setFormData({
          ...formData,
          ...data,
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
      text: `You won't be able to revert this Group Code : ${formData.group_Code}`,
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
        const deleteApiUrl = `${API_URL}/delete-finicial-group?group_Code=${formData.group_Code}&Company_Code=${companyCode}`;
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
    navigate("/financial-groups-utility");
  };

  const handleFirstButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/get_First_GroupMaster`);
      if (response.ok) {
        const data = await response.json();
        const firstUserCreation = data[0];

        setFormData({
          ...formData,
          ...firstUserCreation,
        });
      } else {
        console.error(
          "Failed to fetch first tender data:",
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
        `${API_URL}/get_previous_GroupMaster?group_Code=${formData.group_Code}`
      );

      if (response.ok) {
        const data = await response.json();

        setFormData({
          ...formData,
          ...data,
        });
      } else {
        console.error(
          "Failed to fetch previous Group data:",
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
        `${API_URL}/get_next_GroupMaster?group_Code=${formData.group_Code}`
      );

      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...formData,
          ...data.nextSelectedRecord,
        });
      } else {
        console.error(
          "Failed to fetch next company group data:",
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
      const response = await fetch(`${API_URL}/get_last_GroupMaster`);
      if (response.ok) {
        const data = await response.json();
        const last_Navigation = data[0];

        setFormData({
          ...formData,
          ...last_Navigation,
        });
      } else {
        console.error(
          "Failed to fetch first tender data:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  //Handle Record DoubleCliked in Utility Page Show that record for Edit
  const handlerecordDoubleClicked = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/get-group-by-codes?Company_Code=${companyCode}&group_Code=${selectedRecord.group_Code}`
      );
      const data = response.data;
      setFormData(data);
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
    if (selectedRecord && !isPopup) {
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
          `${API_URL}/get-group-by-codes?Company_Code=${companyCode}&group_Code=${changeNoValue}`
        );
        const data = response.data;
        setFormData(data);
        setIsEditing(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  return (
    <>
      <UserAuditInfo
        createdBy={formData.Created_By}
        modifiedBy={formData.Modified_By}
      />
      {!isPopup && (
        <div>
          <br></br>
          <br></br>
          <br></br>
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
      )}
      <Container maxWidth="sm">
        <Box
          component="form"
          noValidate
          autoComplete="off"
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            maxWidth: 600,
            margin: "auto",
            padding: 3,
            boxShadow: 3,
            borderRadius: 2,
            backgroundColor: "background.paper",
          }}
        >
          <Typography
            sx={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "black",
              marginBottom: 2,
            }}
          >
            Group Master
          </Typography>

          <TextField
            label="Change No"
            id="changeNo"
            name="changeNo"
            onKeyDown={handleKeyDown}
            variant="outlined"
            fullWidth
            disabled={!addOneButtonEnabled}
          />

          <TextField
            label="Group Code"
            id="group_Code"
            name="group_Code"
            value={formData.group_Code}
            onChange={handleChange}
            variant="outlined"
            fullWidth
            disabled
          />
          <TextField
            label="Group Name"
            id="group_Name_E"
            name="group_Name_E"
            value={formData.group_Name_E}
            onChange={handleChange}
            inputRef={inputRef}
            variant="outlined"
            fullWidth
            disabled={!isEditing && addOneButtonEnabled}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Group Summary</InputLabel>
            <Select
              label="Group Summary"
              id="group_Summary"
              name="group_Summary"
              value={formData.group_Summary}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            >
              <MenuItem value="Y">Yes</MenuItem>
              <MenuItem value="N">No</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth variant="outlined">
            <InputLabel>Group Type</InputLabel>
            <Select
              label="Group Type"
              id="group_Type"
              name="group_Type"
              value={formData.group_Type ? formData.group_Type : type}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            >
              <MenuItem value="B">Balance Sheet</MenuItem>
              <MenuItem value="T">Trading</MenuItem>
              <MenuItem value="P">Profit & Loss</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Group Order"
            id="group_Order"
            name="group_Order"
            value={formData.group_Order}
            onChange={handleChange}
            variant="outlined"
            fullWidth
            disabled={!isEditing && addOneButtonEnabled}
          />
        </Box>
      </Container>
    </>
  );
};

export default forwardRef(FinicialMaster);
