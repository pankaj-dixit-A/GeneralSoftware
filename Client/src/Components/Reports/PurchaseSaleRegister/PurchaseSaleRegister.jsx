import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./PurchaseSaleRegister.css";
import { Typography } from "@mui/material";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import { CircularProgress } from '@mui/material';

const PurchaseSaleRegisterReport = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const AccountYear = sessionStorage.getItem("Accounting_Year");
    const Year_Code = sessionStorage.getItem("Year_Code");
    const Company_Code = sessionStorage.getItem("Company_Code");

    const [acCode, setAcCode] = useState("");
    const [accoid, setAccoid] = useState("");
    const [acname, setAcname] = useState("");

    useEffect(() => {
        const currentDate = new Date().toISOString().split("T")[0];
        setFromDate(currentDate);
        setToDate(currentDate);
    }, []);

    const handleAc_Code = (code, id, name) => {
        setAcCode(code);
        setAccoid(id);
        setAcname(name);
    };

    const generateReportUrl = (base) => {
        return `${base}?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&companyCode=${encodeURIComponent(Company_Code)}&yearCode=${encodeURIComponent(Year_Code)}&acCode=${encodeURIComponent(acCode)}`;
    };

    const handleReportClick = (url) => {
        setLoading(true);
        setTimeout(() => {
            window.open(url, "_blank", "toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600");
            setLoading(false);
        }, 500);
    };

    return (
        <div className="container" style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
            <Typography variant="h6" align="center" fontWeight="bold" mt={2}>
                Purchase Sale Register
            </Typography>

            <div className="PurchaseSaleregister-row">
                <label htmlFor="AC_CODE" className="PurchaseSaleregisterlabel">Account Code:</label>
                <AccountMasterHelp onAcCodeClick={handleAc_Code} name="AC_CODE" CategoryName={acname} CategoryCode={acCode} Ac_type="" />
            </div>

            <div className="PurchaseSaleregister-row">
                <label htmlFor="fromDate" className="PurchaseSaleregisterlabel">From Date:</label>
                <input type="date" id="fromDate" className="form-control" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />

                <label htmlFor="toDate" className="PurchaseSaleregisterlabel">To Date:</label>
                <input type="date" id="toDate" className="form-control" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            <div className="grid-container">
                {[

                    { label: "Sale Register", url: "/Sale-registers" },

                    { label: "Sale TDS", url: "/SaleTDS-registers" },
                    { label: "Sale TCS", url: "/SaleTCS-registers" },
                    { label: "Sale Return Sale Register", url: "/SaleReturnSale-registers" },
                    { label: "Purchase Register", url: "/Purchase-registers" },
                    { label: "Purchase TDS", url: "/PurchaseTDS-registers" },
                    { label: "Purchase TCS", url: "/PurchaseTCS-registers" },
                    { label: "Purchase Return Register", url: "/PurchaseReturn-registers" },

                    { label: "Mill Sale Report", url: "/MillSaleReport-registers" },
                    { label: "Sale Month Wise", url: "/SaleMonthWise-registers" },
                    { label: "Purchase Month Wise", url: "/PurchaseMonthWise-registers" },
                    { label: "RCM", url: "/RCM-registers" }
                ].map((item, index) => (
                    <button
                        key={index}
                        type="button"
                        className="submit-button"
                        onClick={() => handleReportClick(generateReportUrl(item.url))}
                        style={{ width: "200px", height: "70px", fontSize: "16px", padding: "10px 20px" }}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default PurchaseSaleRegisterReport;
