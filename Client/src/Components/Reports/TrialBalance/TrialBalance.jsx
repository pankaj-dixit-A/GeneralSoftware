import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import './TrialBalance.css';
import { Typography } from '@mui/material';

const TrialBalance = () => {
    // GET values from session Storage
    const companyCode = sessionStorage.getItem("Company_Code");
    const AccountYear = sessionStorage.getItem('Accounting_Year');

    const navigate = useNavigate();
    const [selectType, setSelectType] = useState('Mill Wise');
    const [receiptPaymentType, setReceiptPaymentType] = useState('Against Sauda');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [accountType, setAccountType] = useState('');
    const [groupTypes, setGroupTypes] = useState([]);
    const [groupType, setGroupType] = useState('0');
    const API_URL = process.env.REACT_APP_API;
    const [radioValue, setRadioValue] = useState('B');
    const [isDropdownDisabled, setIsDropdownDisabled] = useState(false);

    useEffect(() => {
        if (AccountYear) {
            const dates = AccountYear.split(' - ');
            if (dates.length === 2) {
                setFromDate(dates[0]);
                setToDate(dates[1]);
            }
        }
    }, [AccountYear]);

    useEffect(() => {
        const fetchGroupTypes = async () => {
            try {
                const response = await axios.get(
                    `${API_URL}/GettingGroupType?Company_Code=${companyCode}`
                );
                const data = await response.data;
                setGroupTypes(data);
            } catch (error) {
                console.error('Error fetching group types:', error);
            }
        };
        fetchGroupTypes();
    }, []);

    const handleGenerateReport = () => {
        if (!fromDate || !toDate) {
            setError('Please select both From Date and To Date.');
            return;
        }
        setError('');
        setLoading(true);
        setTimeout(() => {
            const url = `/TrialBalance-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&groupType=${encodeURIComponent(groupType)}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);
    };

   

    const handleChange = (event) => {
        setAccountType(event.target.value);
    };

    const handleChangeGroupType = (event) => {
        setGroupType(event.target.value);
    };

    const handleRadioChange = (event) => {
        const value = event.target.value;
        setRadioValue(value);
    };

    const handleDaywisetrialBalanceReport = () => {
        if (!fromDate || !toDate) {
            setError('Please select both From Date and To Date.');
            return;
        }
        setError('');
        setLoading(true);
        navigate('/DaywiseTrialBalance-reports', { state: { fromDate, toDate, selectType, receiptPaymentType } });
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    };

    const handleGenerateTrialBalanceDetailReport = () => {
        if (!fromDate || !toDate) {
            setError('Please select both From Date and To Date.');
            return;
        }
        setError('');
        setLoading(true);
        navigate('/TrialBalanceDetails-reports', { state: { fromDate, toDate, groupType } });
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    };

    const handleOpeningBalance = () => {
        if (!fromDate || !toDate) {
            setError('Please select both From Date and To Date.');
            return;
        }
        setError('');
        setLoading(true);
        navigate('/OpeningBalanceDetails-reports', { state: { fromDate, toDate, selectType, receiptPaymentType } });
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    };

    const handleJVreport = () => {
        if (!fromDate || !toDate) {
            setError('Please select both From Date and To Date.');
            return;
        }
        setError('');
        setLoading(true);
        setTimeout(() => {
            const url = `/JVReport-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);
    };


    return (
        <div className="trial-balance-container">
            <div className="trial-balance-card">

                <Typography
                    variant="h5"
                    style={{ fontWeight: "bold", fontSize: "24px", marginBottom: "30px" }}
                >
                    Trial Balance
                </Typography>

                <div className="form-group">
                    <label htmlFor="fromDate" className="form-label">From Date</label>
                    <input
                        type="date"
                        id="fromDate"
                        className="form-input"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="toDate" className="form-label">To Date</label>
                    <input
                        type="date"
                        id="toDate"
                        className="form-input"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                    />
                </div>

                <div className="form-group radio-group">
                    <div className="form-check">
                        <input
                            type="radio"
                            value="B"
                            checked={radioValue === 'B'}
                            onChange={handleRadioChange}
                            className="form-check-input"
                            id="balancesheetGroupB"
                        />
                        <label htmlFor="balancesheetGroupB" className="form-check-label">
                            Balancesheet Group
                        </label>
                    </div>

                    <div className="form-check">
                        <input
                            type="radio"
                            value="A"
                            checked={radioValue === 'A'}
                            onChange={handleRadioChange}
                            className="form-check-input"
                            id="balancesheetGroupA"
                        />
                        <label htmlFor="balancesheetGroupA" className="form-check-label">
                            Account Type
                        </label>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="Ac_type">Account Type:</label>
                    <select
                        id="Ac_type"
                        name="Ac_type"
                        value={accountType}
                        onChange={handleChange}
                        className="form-select"
                        disabled={radioValue === 'B'}
                    >
                        <option value="Q">All</option>
                        <option value="P" selected>Party</option>
                        <option value="L">Local</option>
                        <option value="PM">Party & Mill</option>
                        <option value="S">Supplier</option>
                        <option value="B">Bank</option>
                        <option value="C">Cash</option>
                        <option value="R">Relative</option>
                        <option value="F">Fixed Assets</option>
                        <option value="I">Interest Party</option>
                        <option value="E">Income/Expenses</option>
                        <option value="O">Trading</option>
                        <option value="M">Mill</option>
                        <option value="T">Transport</option>
                        <option value="BR">Broker</option>
                        <option value="RP">Retail Party</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="Group_type">Group Type:</label>
                    <select
                        id="Group_type"
                        name="Group_type"
                        value={groupType}
                        onChange={handleChangeGroupType}
                        className="form-select"
                        disabled={radioValue === 'A'}
                    >
                        <option value="" disabled>
                            Select Group Type
                        </option>
                        {groupTypes.map((type) => (
                            <option key={type.group_Code} value={type.group_Code}>
                                {type.group_Name_E}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <p>Selected Group Type Code: {groupType || 'None'}</p>
                </div>

                <div className="form-buttons">
                    <button
                        className="submit-button"
                        onClick={handleGenerateReport}
                    >
                      Trial Balance
                    </button>
                    <button
                        className="submit-button"
                        onClick={handleGenerateTrialBalanceDetailReport}
                    >
                       Detail Report
                    </button>
                    <button
                        className="submit-button"
                        onClick={handleDaywisetrialBalanceReport}
                    >
                        Day Wise TrialBalance Report
                    </button>
                    <button
                        className="submit-button"
                        onClick={handleOpeningBalance}
                    >
                    Opening Balance Report
                    </button>
                    <button
                        className="submit-button"
                        onClick={handleJVreport}
                    >
                      JV Report
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}
            </div>
        </div>
    );
};

export default TrialBalance;