import React, { useState, useEffect } from "react";
import { Typography } from '@mui/material';
import "./DayBook.css";

const DayBook = () => {
    const [acCode, setAcCode] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState(0);
    const [error, setError] = useState(null);

    const AccountYear = sessionStorage.getItem("Accounting_Year");
    const Compay_Code = sessionStorage.getItem("Company_Code");
    const Year_Code = sessionStorage.getItem("Year_Code");

    useEffect(() => {
        const currentDate = new Date().toISOString().split('T')[0];
        setFromDate(currentDate);
        setToDate(currentDate);
    }, []);

    const isValidDateRange = () => {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const timeDifference = to - from;
        const daysDifference = timeDifference / (1000 * 3600 * 24);

        if (from.getMonth() !== to.getMonth() || from.getFullYear() !== to.getFullYear()) {
            return "The date range cannot exceed 30 days!";
        }

        if (daysDifference > 30) {
            return "The date range cannot exceed 30 days!";
        }
        return null;
    };

    // Day Report onClick
    const handleGetDayBook = (e) => {
        e.preventDefault();
        const errorMessage = isValidDateRange();
        if (errorMessage) {
            alert(errorMessage);
            return;
        }

        setLoading(true);
        setTimeout(() => {
            const url = `/daybook-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);
    };

    return (
        <div className="bankBook-container">
            <div className="bankBook-card">
                <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold", marginBottom: "40px" }}>
                    Day Book Report
                </Typography>
                <form>
                    <div className="dayBookDiv">
                        <div className="bankBookform-group">
                            <label htmlFor="fromDate" className="bankBookform-label">
                                From Date:
                            </label>
                            <input
                                type="date"
                                id="fromDate"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>
                        <div className="bankBookform-group">
                            <label htmlFor="toDate" className="bankBookform-label">
                                To Date:
                            </label>
                            <input
                                type="date"
                                id="toDate"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <button className="submit-button" onClick={handleGetDayBook}>
                        DAY BOOK
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DayBook;
