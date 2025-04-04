import React, { useState, useEffect, useRef } from "react";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from '../../../Common/CommonButtons/NavigationButtons';
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import { useNavigate, useLocation } from 'react-router-dom';
import axios, { isCancel } from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { TextField, Grid, InputAdornment, Typography, Box } from '@mui/material';

const API_URL = process.env.REACT_APP_API;

var bankCode = ""
var bankName = ""
var paymentToCode = ""
var paymentToName = ""

const PaymentNote = () => {
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
    const inputRef=useRef(null)
    //GET values from session storage 
    const companyCode = sessionStorage.getItem('Company_Code')
    const yearCode = sessionStorage.getItem('Year_Code')

    const navigate = useNavigate();
    const location = useLocation();

    const changeNoRef = useRef(null);
    const selectedRecord = location.state?.selectedRecord;
    const permissions = location.state?.permissionsData;


    const initialFormData = {
        doc_no: '',
        doc_date: new Date().toISOString().split("T")[0],
        bank_ac: '',
        payment_to: '',
        amount: '',
        narration: '',
        Company_Code: companyCode,
        Year_Code: yearCode,
        Created_By: '',
        Modified_By: '',
        ba: '',
        pt: '',
    }
    const [formData, setFormData] = useState(initialFormData);
    const [bankAc, setBank] = useState('')
    const [paymentTo, setPaymentTo] = useState('')

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
        setFormData(prevState => {
            const updatedFormData = { ...prevState, [name]: value };
            return updatedFormData;
        });
    };

    const handleDateChange = (event, fieldName) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            [fieldName]: event.target.value,
        }));
    };

    const handleBankAc = (code, accoid) => {
        setBank(code);
        setFormData({
            ...formData,
            bank_ac: code,
            ba: accoid,
        });
    };

    const handlePaymentTo = (code, accoid) => {
        setPaymentTo(code);
        setFormData({
            ...formData,
            payment_to: code,
            pt: accoid,
        });
    };

    const fetchLastRecord = () => {
        fetch(`${API_URL}/getNextDocNo_PaymentNote?Company_Code=${companyCode}&Year_Code=${yearCode}`)
            .then(response => {
                console.log("response", response)
                if (!response.ok) {
                    throw new Error('Failed to fetch last record');
                }
                return response.json();
            })
            .then(data => {
                setFormData(prevState => ({
                    ...prevState,
                    doc_no: data.next_doc_no
                }));
            })
            .catch(error => {
                console.error('Error fetching last record:', error);
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
        setFormData(initialFormData)
        paymentToCode = ""
        paymentToName = ""
        bankCode = ""
        bankName = ""
        setTimeout(() => {
            inputRef.current?.focus();
          }, 0);
    }

    const handleSaveOrUpdate = () => {
        if (isEditMode) {
            axios
                .put(
                    `${API_URL}/update-PaymentNote`, formData
                )
                .then((response) => {
                    toast.success("Record update successfully!");
                    setTimeout(() => {
                        window.location.reload()
                    }, 1000)

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
                .post(`${API_URL}/insert-PaymentNote`, formData)
                .then((response) => {
                    toast.success("Record Created successfully!");
                    setTimeout(() => {
                        window.location.reload()
                    }, 1000)

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
        axios.get(`${API_URL}/getLast_PaymentNote?Company_Code=${companyCode}&Year_Code=${yearCode}`)
            .then((response) => {
                const data = response.data;
                if (response.data && !response.data.error) {
                    paymentToName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].PaymentToName
                        : '';
                    bankName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].BankCashName : '';
                    paymentToCode = data.lastPaymentNoteData.payment_to
                    bankCode = data.lastPaymentNoteData.bank_ac


                    setFormData({
                        ...formData,
                        ...data.lastPaymentNoteData,
                    });
                }
                else if (response.data.error) {
                    toast.error(response.data.error);
                }
            })
            .catch((error) => {
                console.error("Error fetching latest data for edit:", error);
            });
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

    const handleDelete = async () => {
        const isConfirmed = window.confirm(`Are you sure you want to delete this Doc No ${formData.doc_no}?`);

        if (isConfirmed) {
            setIsEditMode(false);
            setAddOneButtonEnabled(true);
            setEditButtonEnabled(true);
            setDeleteButtonEnabled(true);
            setBackButtonEnabled(true);
            setSaveButtonEnabled(false);
            setCancelButtonEnabled(false);

            try {
                const deleteApiUrl = `${API_URL}/delete-PaymentNote?doc_no=${formData.doc_no}&Company_Code=${companyCode}&Year_Code=${yearCode}`;
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
        navigate("/PaymentNote-utility")
    }
    //Handle Record DoubleCliked in Utility Page Show that record for Edit
    const handlerecordDoubleClicked = async () => {
        try {
            const response = await axios.get(`${API_URL}/PaymentNoteById?Company_Code=${companyCode}&Year_Code=${yearCode}&doc_no=${selectedRecord.doc_no}`);
            if (response.data && !response.data.error) {
                const data = response.data;
                paymentToName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].PaymentToName : '';
                bankName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].BankCashName : '';
                paymentToCode = data.payment_Note_Data_By_Id.payment_to;
                bankCode = data.payment_Note_Data_By_Id.bank_ac;

                setFormData({
                    ...formData,
                    ...data.payment_Note_Data_By_Id,
                });
                setIsEditing(false);
            } else if (response.data.error) {
                console.log('Displaying error toast');
                toast.error(response.data.error);
            }
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
                const response = await axios.get(`${API_URL}/PaymentNoteById?Company_Code=${companyCode}&Year_Code=${yearCode}&doc_no=${changeNoValue}`);
                if (response.data && !response.data.error) {
                    const data = response.data;
                    paymentToName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].PaymentToName : '';
                    bankName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].BankCashName : '';
                    paymentToCode = data.payment_Note_Data_By_Id.payment_to;
                    bankCode = data.payment_Note_Data_By_Id.bank_ac;

                    setFormData({
                        ...formData,
                        ...data.payment_Note_Data_By_Id,
                    });
                    setIsEditing(false);
                } else if (response.data.error) {
                    console.log('Displaying error toast');
                    toast.error(response.data.error);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error(error.response?.data?.error || "An unexpected error occurred while fetching the data.");
            }
        }
    };


    //Navigation Buttons
    const handleFirstButtonClick = async () => {
        try {
            const response = await axios.get(`${API_URL}/getFirst_PaymentNote?Company_Code=${companyCode}&Year_Code=${yearCode}`);
            if (response.data && !response.data.error) {
                const data = response.data;
                paymentToName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].PaymentToName : '';
                bankName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].BankCashName : '';
                paymentToCode = data.firstPaymentNoteData.payment_to;
                bankCode = data.firstPaymentNoteData.bank_ac;

                setFormData({
                    ...formData,
                    ...data.firstPaymentNoteData,
                });
                setIsEditing(false);
            } else if (response.data.error) {
                console.log('Displaying error toast');
                toast.error(response.data.error);
            }
        } catch (error) {
            console.error("Error during API call:", error);
        }
    };

    const handlePreviousButtonClick = async () => {
        try {
            // Use formData.Company_Code as the current company code
            const response = await axios.get(`${API_URL}/getPrevious_PaymentNote?Company_Code=${companyCode}&Year_Code=${yearCode}&doc_no=${formData.doc_no}`);
            if (response.data && !response.data.error) {
                const data = response.data;
                paymentToName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].PaymentToName : '';
                bankName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].BankCashName : '';
                paymentToCode = data.previousPaymentNoteData.payment_to;
                bankCode = data.previousPaymentNoteData.bank_ac;

                setFormData({
                    ...formData,
                    ...data.previousPaymentNoteData,
                });
                setIsEditing(false);
            } else if (response.data.error) {
                console.log('Displaying error toast');
                toast.error(response.data.error);
            }
        } catch (error) {
            console.error("Error during API call:", error);
        }
    };

    const handleNextButtonClick = async () => {
        try {
            const response = await axios.get(`${API_URL}/getNext_PaymentNote?Company_Code=${companyCode}&Year_Code=${yearCode}&doc_no=${formData.doc_no}`);
            if (response.data && !response.data.error) {
                const data = response.data;
                paymentToName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].PaymentToName : '';
                bankName = data.paymentNoteLabels.length > 0 ? data.paymentNoteLabels[0].BankCashName : '';
                paymentToCode = data.nextPaymentNoteData.payment_to;
                bankCode = data.nextPaymentNoteData.bank_ac;

                setFormData({
                    ...formData,
                    ...data.nextPaymentNoteData,
                });
                setIsEditing(false);
            } else if (response.data.error) {
                console.log('Displaying error toast');
                toast.error(response.data.error);
            }
        } catch (error) {
            console.error("Error during API call:", error);
        }
    };

    //Input feild validation function.
    const validateNumericInput = (e) => {
        e.target.value = e.target.value.replace(/[^0-9.]/g, '');
    };

    return (
        <>
            <div>
                <h5>Payment Note</h5>
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
                        handleLastButtonClick={handleCancel}
                        highlightedButton={highlightedButton}
                        isEditing={isEditing}
                        isFirstRecord={formData.Company_Code === 1}

                    />
                </div>
            </div>

            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    padding: 2,
                }}
            >
                <form>
                    <Grid container spacing={2} direction="column" alignItems="center">
                        <Grid item xs={12}>
                            <TextField
                                label="Change No"
                                variant="outlined"
                                autoComplete="off"
                                fullWidth
                                value={formData.changeNo}
                                onChange={handleChange}
                                name="changeNo"
                                inputRef={changeNoRef}
                                disabled={!addOneButtonEnabled}
                                sx={{ width: 300 }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Entry No"
                                autoComplete="off"
                                variant="outlined"
                                fullWidth
                                value={formData.doc_no}
                                disabled
                                sx={{ width: 300 }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Date"
                                variant="outlined"
                                type="date"
                                autoComplete="off"
                                fullWidth
                                value={formData.doc_date}
                                onChange={(e) => handleDateChange(e, 'doc_date')}
                                disabled={!isEditing && addOneButtonEnabled}
                                inputRef={inputRef}
                                sx={{ width: 300 }}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body1">Cash/Bank:</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <AccountMasterHelp
                                onAcCodeClick={handleBankAc}
                                CategoryName={bankName}
                                CategoryCode={bankCode}
                                name="bank_ac"
                                Ac_type="B"

                                disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="body1">Payment To:</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <AccountMasterHelp
                                onAcCodeClick={handlePaymentTo}
                                CategoryName={paymentToName}
                                CategoryCode={paymentToCode}
                                name="payment_to"
                                Ac_type=""

                                disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Amount"
                                variant="outlined"
                                autoComplete="off"
                                fullWidth
                                value={formData.amount}
                                onChange={handleChange}
                                name="amount"
                                disabled={!isEditing && addOneButtonEnabled}
                                sx={{ width: 300 }}
                                inputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">$</InputAdornment>
                                    ),
                                    inputMode: 'decimal',
                                    pattern: '[0-9]*[.,]?[0-9]+',
                                    onInput: validateNumericInput,
                                }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Narration"
                                variant="outlined"
                                autoComplete="off"
                                fullWidth
                                value={formData.narration}
                                onChange={handleChange}
                                name="narration"
                                disabled={!isEditing && addOneButtonEnabled}
                                sx={{ width: 300 }}
                            />
                        </Grid>
                    </Grid>
                </form>
            </Box>
        </>);
};

export default PaymentNote
