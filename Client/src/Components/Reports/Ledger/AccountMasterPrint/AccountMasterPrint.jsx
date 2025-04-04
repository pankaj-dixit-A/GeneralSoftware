import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GroupMasterHelp from "../../../../Helper/GroupMasterHelp"; 
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import "../Ledger.css";

const companyCode = sessionStorage.getItem('Company_Code')
var label;
const AccountMasterPrint = () => {
  const [groupCode, setGroupCode] = useState(""); 
  const [accoid, setAccoid] = useState("");
  const [groupName, setGroupName] = useState("");
  const [acType, setAcType] = useState(""); 
  
  const navigate = useNavigate();


  const handleGroupCode = (code, bsId) => {
    setGroupCode(code);
    setAccoid(bsId);
  };

  const handleGetReportClick = (type) => {
    let state = {};
  
    switch (type) {
      case "acType":
        if (!acType) {
          alert("Please select an Account Type");
          return;
        }
        state = { acType, companyCode, label:"Account Type wise list" }; // Include companyCode for AcType-based reports
        break;
  
      case "groupCode":
        if (!groupCode) {
          alert("Please select a Group Code");
          return;
        }
        state = { groupCode, companyCode, label:"Group Code wise list" }; // Include companyCode for groupCode-based reports
        break;
  
      case "stateWise":
        state = { stateWise: true , label:"State wise list"}; // Include only stateWise=true, no companyCode
        break;
  
      default:
        alert("Invalid report type");
        return;
    }
  
    navigate(`/accountmaster-print-report`, { state });
  };
  

  return (
    <div className="ledger-form-container">
      <h2>Account List</h2>
      <form>
        {/* Account Type Selector */}
        <div className="form-row">
          <label htmlFor="Ac_Type">Account Type:</label>
          <FormControl size="small" fullWidth sx={{ width: "20vh" }}>
            <InputLabel>Type</InputLabel>
            <Select
              id="Ac_Type"
              name="Ac_Type"
              value={acType}
              onChange={(e) => setAcType(e.target.value)}
            >
              <MenuItem value="P">Party</MenuItem>
              <MenuItem value="OP">Other Than Party</MenuItem>
              <MenuItem value="S">Supplier</MenuItem>
              <MenuItem value="B">Bank</MenuItem>
              <MenuItem value="C">Cash</MenuItem>
              <MenuItem value="R">Relative</MenuItem>
              <MenuItem value="F">Fixed Assets</MenuItem>
              <MenuItem value="I">Interest Party</MenuItem>
              <MenuItem value="EX">Income</MenuItem>
              <MenuItem value="E">Expenses</MenuItem>
              <MenuItem value="O">Trading</MenuItem>
              <MenuItem value="M">Mill</MenuItem>
              <MenuItem value="T">Transport</MenuItem>
              <MenuItem value="BR">Broker</MenuItem>
              <MenuItem value="RP">Retail Party</MenuItem>
              <MenuItem value="CR">Cash Retail Party</MenuItem>
              <MenuItem value="CP">Capital</MenuItem>
            </Select>
          </FormControl>
          <button
            type="button"
            onClick={() => handleGetReportClick("acType")}
          >
            Account Type Wise List
          </button>
        </div>

        {/* Group Code Selector */}
        <div className="form-row">
          <label htmlFor="Group_Code">Group Code:</label>
          <GroupMasterHelp
            onAcCodeClick={handleGroupCode}
            name="Group_Code"
            GroupName={groupName}
            GroupCode={groupCode}
          />
          <button
            type="button"
            onClick={() => handleGetReportClick("groupCode")}
          >
            Group Code Wise Account List
          </button>
        </div>

        {/* State-Wise Button */}
        <div className="form-row">
          <button
            type="button"
            onClick={() => handleGetReportClick("stateWise")}
          >
            State Wise Account List
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountMasterPrint;
