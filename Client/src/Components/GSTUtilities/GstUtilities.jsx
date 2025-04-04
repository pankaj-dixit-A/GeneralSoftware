import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './GSTutility.css';
import AccountMasterHelp from "../../Helper/AccountMasterHelp";
import { useNavigate } from 'react-router-dom';
import SaleBillSummary from './SaleBillSummary';
import PurchaseBillSummary from './PurchaseBillSummary';
import RetailSaleBillSummary from './RetailSaleBillSummary';
import FrieghtSummary from './FrieghtSummary';
import DebitNoteSummary from './DebitNoteSummary';
import CreditnoteSummary from './CreditNoteSummary';
import ServiceBillSummary from './ServiceBillSummary';
import OtherPurchaseSummary from './OtherPurchaseSummary';
import SaleTCSSummary from './SaleTCSSummary';
import SaleTDSSummary from './SaleTDSSummary';
import PurchaseTCSSummary from './PurchaseTCSSummary';
import PurchaseTDSSummary from './PurchaseTDSSummary';
import HSNWiseSummary from './HSNWiseSummary';
import GSTRateWiseSummary from './GSTRateWiseSumamry';
import SaleTCSTDSSummary from './SaleTCSTDSSummary';
import PurchaseTCSTDSSummary from './PurchaseTCSTDSSummary';
import DebitCreditNoteSummary from './DebitCreditNoteSummaray';
import CreateB2BFile from './CreateB2BFile';
import CreateB2ClFile from './CreateB2CL';
import CreateB2CSFile from './CreateB2CS';
import ShowEntryNo from './ShowEntryNo';
import { Typography } from "@mui/material";
import { Tabs, Tab, Container, Row, Col } from 'react-bootstrap';

const GStUtilities = () => {
    const navigate = useNavigate();
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const AccountYear = sessionStorage.getItem('Accounting_Year');
    const Year_Code = sessionStorage.getItem('Year_Code');
    const Company_Code = sessionStorage.getItem('Company_Code');
    const [accountType, setAccountType] = useState('AL');
    const [PurchaseType, setPurchaseType] = useState('AL');
    const [GSTRateType, setGSTRateType] = useState('');
    const [GSTRateTypes, setGSTRateTypes] = useState([]);
    const [DebitType, setDebitType] = useState('AL');
    const [acCode, setAcCode] = useState("");
    const [accoid, setAccoid] = useState("");
    const [acname, setAcname] = useState("");
    const [updateTrigger, setUpdateTrigger] = useState(0);
    const API_URL = process.env.REACT_APP_API;

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
        const fetchGSTRate = async () => {
            try {
                const response = await axios.get(
                    `${API_URL}/GettingGSTRateWise?Company_Code=${Company_Code}`
                )
                const data = await response.data;
                setGSTRateTypes(data);
            } catch (error) {
                console.error('Error fetching group types:', error);
            }
        };
        fetchGSTRate();
    }, []);

    const handleAc_Code = (code, id, name) => {
        if (!code) {
            setAcCode("");
            setAccoid("");
            setAcname();
        }
        setAcCode(code);
        setAccoid(id);
        setAcname(name);
        setUpdateTrigger((prev) => prev + 1);
    };

    const handleChange = (event) => {
        setAccountType(event.target.value);
    };
    const handleChangePurchaseType = (event) => {
        setPurchaseType(event.target.value);
    };
    const handleChangeGSTRate = (event) => {
        setGSTRateType(event.target.value);
    };

    const handleChangeDebitType = (event) => {
        setDebitType(event.target.value);
    };

    return (
        <>
            <Typography
                variant="h6"
                style={{
                    textAlign: "center",
                    fontSize: "24px",
                    fontWeight: "bold",
                    marginTop: "20px",
                }}
            >
                GST Utilities
            </Typography>

            <div className="GSTUtilities-container">
                <div className="GSTUtilities-row">
                    <label htmlFor="AC_CODE" className="GSTUtilitieslabel">
                        Account Code:
                    </label>
                    <div>
                        <AccountMasterHelp
                            onAcCodeClick={handleAc_Code}
                            name="AC_CODE"
                            CategoryName={acname}
                            CategoryCode={acCode}
                            Ac_type=""
                        />
                    </div>
                </div>

                <div className="GSTUtilities-row">
                    <label htmlFor="fromDate" className="GSTUtilitieslabel">From Date :</label>
                    <input
                        type="date"
                        id="fromDate"
                        className="form-control"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                    />

                    <label htmlFor="toDate" className="GSTUtilitieslabel">To Date :</label>
                    <input
                        type="date"
                        id="toDate"
                        className="form-control"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                    />
                </div>

                <div className="GSTUtilities-row">
                    <label htmlFor="SaleTCSTDS" className="GSTUtilitieslabel">Sale Type :</label>
                    <select
                        id="SaleTCSTDS"
                        name="SaleTCSTDS"
                        value={accountType}
                        onChange={handleChange}
                        className="form-select"
                    >
                        <option value="AL">All Bill</option>
                        <option value="SB">Sale Bill</option>
                        <option value="SC">Sale Bill Corporate</option>
                        <option value="NC">Sale Bill Non Corporate</option>
                        <option value="RS">Sale Return Sale</option>
                        <option value="RR">Retail Sale</option>
                        <option value="LV">Commission Bill</option>
                        <option value="CB">Cold Storage Sale</option>
                        <option value="RB">Rent Bill</option>
                    </select>

                    <label htmlFor="PurchaseTCSTDS" className="GSTUtilitieslabel">Purchase Type :</label>
                    <select
                        id="PurchaseTCSTDS"
                        name="PurchaseTCSTDS"
                        value={PurchaseType}
                        onChange={handleChangePurchaseType}
                        className="form-select"
                    >
                        <option value="AL">All Bill</option>
                        <option value="PS">Purchase Bill</option>
                        <option value="RP">Retail Purchase</option>
                    </select>

                    <label htmlFor="GSTRate" className="GSTUtilitieslabel">GST Rate :</label>
                    <select
                        id="GSTRate"
                        name="GSTRate"
                        value={GSTRateType}
                        onChange={handleChangeGSTRate}
                        className="form-select"
                    >
                        <option value="" disabled>
                            GST Rate
                        </option>
                        {GSTRateTypes.map((type) => (
                            <option key={type.Doc_no} value={type.Rate}>
                                {type.Rate}
                            </option>
                        ))}
                    </select>

                    <label htmlFor="DebitCreditNote" className="GSTUtilitieslabel">Debit/Credit Note :</label>
                    <select
                        id="DebitCreditNote"
                        name="DebitCreditNote"
                        value={DebitType}
                        onChange={handleChangeDebitType}
                        className="form-select"
                    >
                        <option value="AL">All</option>
                        <option value="DN">Debit Note to Customer</option>
                        <option value="CN">Credit Note to Customer</option>
                        <option value="DS">Debit Note to Supplier</option>
                        <option value="CS">Credit Note to Supplier</option>
                    </select>
                </div>
            </div>

            <div >
                <Tabs defaultActiveKey="purchase" id="gst-tabs" >
                <Tab eventKey="purchase" title="1 .Purchase Bill Summary">
                        <Container>
                            <Row>
                                <PurchaseBillSummary fromDate={fromDate} toDate={toDate} companyCode={Company_Code} yearCode={Year_Code} accode={acCode || ""} />
                                <PurchaseTCSSummary fromDate={fromDate} toDate={toDate} companyCode={Company_Code} yearCode={Year_Code} Tran_type={PurchaseType} accode={acCode || ""} />
                                <PurchaseTDSSummary fromDate={fromDate} toDate={toDate} companyCode={Company_Code} yearCode={Year_Code} Tran_type={PurchaseType} accode={acCode || ""} />
                                <PurchaseTCSTDSSummary fromDate={fromDate} toDate={toDate} companyCode={Company_Code} yearCode={Year_Code} accode={acCode || ""} />
                            </Row>

                        </Container>
                    </Tab>

                    <Tab eventKey="sale" title="2 .Sale Bill Summary">
                        <Row >
                            <SaleBillSummary fromDate={fromDate} toDate={toDate} companyCode={Company_Code} yearCode={Year_Code} accode={acCode || ""} />

                            <SaleTCSSummary fromDate={fromDate} toDate={toDate} companyCode={Company_Code} yearCode={Year_Code} Tran_type={accountType} accode={acCode || ""} />

                            <SaleTDSSummary fromDate={fromDate} toDate={toDate} companyCode={Company_Code} yearCode={Year_Code} Tran_type={accountType} accode={acCode || ""} />

                            <SaleTCSTDSSummary fromDate={fromDate} toDate={toDate} companyCode={Company_Code} yearCode={Year_Code} accode={acCode || ""} />
                        </Row>
                    </Tab>

                    <Tab eventKey="DebitCredit" title="3 .Debit/Credit Note Summary">
                        <Container>
                            <Row>
                                <DebitCreditNoteSummary fromDate={fromDate} toDate={toDate} companyCode={Company_Code} yearCode={Year_Code} Tran_Type={DebitType} accode={acCode || ""} />
                                <OtherPurchaseSummary fromDate={fromDate} toDate={toDate} companyCode={Company_Code} yearCode={Year_Code} />
                                <DebitNoteSummary fromDate={fromDate} toDate={toDate} companyCode={Company_Code} yearCode={Year_Code} accode={acCode || ""} />
                                <CreditnoteSummary fromDate={fromDate} toDate={toDate} companyCode={Company_Code} yearCode={Year_Code} />
                            </Row>
                        </Container>
                    </Tab>

                    <Tab eventKey="miscellaneous" title="4 .Miscellaneous Summary">
                        <Container>
                            <Row>
                                <RetailSaleBillSummary fromDate={fromDate} toDate={toDate} companyCode={Company_Code} yearCode={Year_Code} accode={acCode || ""} />
                                <FrieghtSummary fromDate={fromDate} toDate={toDate} companyCode={Company_Code} yearCode={Year_Code} accode={acCode || ""} />
                            </Row>
                        </Container>
                    </Tab>

                    <Tab eventKey="gstRateWise" title="5 .GST Rate Wise Summary">
                        <Container>
                            <Row>
                                <HSNWiseSummary fromDate={fromDate} toDate={toDate} companyCode={Company_Code} yearCode={Year_Code} />
                                <GSTRateWiseSummary fromDate={fromDate} toDate={toDate} companyCode={Company_Code} yearCode={Year_Code} GSTRate={GSTRateType} />
                            </Row>
                        </Container>
                    </Tab>

                    <Tab eventKey="utilities" title="6 .Other Utilities">
                        <Container>
                            <Row>
                                <CreateB2BFile fromDate={fromDate} toDate={toDate} companyCode={Company_Code} yearCode={Year_Code} />
                                <CreateB2ClFile fromDate={fromDate} toDate={toDate} companyCode={Company_Code} yearCode={Year_Code} />
                                <CreateB2CSFile fromDate={fromDate} toDate={toDate} companyCode={Company_Code} yearCode={Year_Code} />
                                <ShowEntryNo fromDate={fromDate} toDate={toDate} companyCode={Company_Code} yearCode={Year_Code} />
                            </Row>
                        </Container>
                    </Tab>
                </Tabs>
                {error && <div className="alert alert-danger">{error}</div>}
            </div>
        </>
    );

};

export default GStUtilities;