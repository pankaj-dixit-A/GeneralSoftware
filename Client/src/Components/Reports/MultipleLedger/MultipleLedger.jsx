import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Pagination from "../../../Common/UtilityCommon/Pagination";
import SearchBar from "../../../Common/UtilityCommon/SearchBar";
import PerPageSelect from "../../../Common/UtilityCommon/PerPageSelect";
import "./MultipleLedger.css";
import axios from "axios";
import { Typography, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, Button } from '@mui/material';

const API_URL = process.env.REACT_APP_API;

const MultipleLedger = () => {
  
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [groupCodes, setGroupCodes] = useState([]);
  const [selectedGroupCode, setSelectedGroupCode] = useState("1");
  const [accounts, setAccounts] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [perPage, setPerPage] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
   const [filteredData, setFilteredData] = useState([]);
   const [selectedAccounts, setSelectedAccounts] = useState({})
   const [loading,setLoading] = useState(false)
   const [selectAll, setSelectAll] = useState(false);


  const AccountYear = sessionStorage.getItem("Accounting_Year");
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");

  useEffect(() => {
    if (AccountYear) {
      const dates = AccountYear.split(" - ");
      if (dates.length === 2) {
        setFromDate(dates[0]);
        setToDate(dates[1]);
      }
    }
    fetchGroupCodes();
  }, [AccountYear]);

  useEffect(() => {
    const filtered = accounts.filter(account =>
      account.Ac_Name_E.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setCurrentPage(1); // Reset to first page when search term changes
    setShowTable(filtered.length > 0);
  }, [searchTerm, accounts]);

  useEffect(() => {
    const newSelectedAccounts = {};
    filteredData.forEach(account => {
      newSelectedAccounts[account.AC_CODE] = selectAll;
    });
    setSelectedAccounts(newSelectedAccounts);
  }, [selectAll, filteredData]);


  const fetchGroupCodes = async () => {
    try {
      const response = await axios.get(`${API_URL}/getAll-groupCodes`); // Adjust the URL based on your routing setup
      setGroupCodes(response.data.all_Groups);
    } catch (error) {
      console.error('Failed to fetch group codes:', error);
    }
  };

  const navigate = useNavigate();

  const getAccounts = async(e) =>{
    e.preventDefault();
    try {
      const response = await axios.get(`${API_URL}/getAll-AccountsWithCounts?groupCode=${selectedGroupCode}`);
      setAccounts(response.data.all_Accounts);
      setFilteredData(response.data.all_Accounts);
      setShowTable(true)
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      setShowTable(false)
    }
  }

  const handlePerPageChange = (event) => {
    setPerPage(event.target.value);
    setCurrentPage(1);
};

const handleSearchTermChange = (event) => {
    setSearchTerm(event.target.value);
};

const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
};

const toggleAccountSelection = (acCode) => {
  setSelectedAccounts(prev => ({
    ...prev,
    [acCode]: !prev[acCode]
  }));
};

const handleSelectAllChange = () => {
  setSelectAll(!selectAll);
};


const handleMultipleLedger = (e) => {
  e.preventDefault();
  setLoading(true);
  const selectedAccountCodes = Object.entries(selectedAccounts).filter(([_, isSelected]) => isSelected).map(([acCode, _]) => acCode);
  
  setTimeout(() => {
    const url = `/getAllledger-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&selectedAccountCodes=${selectedAccountCodes.join(',')}`;
    // Open in a new window with specific size and features
    window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
    setLoading(false);
    setSelectedAccounts({})
    setSelectAll(false);
  }, 500);
};


  const pageCount = Math.ceil(filteredData.length / perPage);
    const paginatedPosts = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="multi-ledger-container">
      <div>
         {/* <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold",marginBottom:"10px"}}>Multiple Ledger Report</Typography> */}
         
        <form>
          <div className="multi-ledger-form">
          <div className="multi-ledger-form-group">
          
          
            <label htmlFor="fromDate" className="multi-ledger-form-label">
              From Date:
            </label>
            <input
              type="date"
              id="fromDate"
              className="multi-ledger-form-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <label htmlFor="toDate" className="multi-ledger-form-label">
              To Date:
            </label>
            <input
              type="date"
              id="toDate"
              className="multi-ledger-form-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
            <label htmlFor="groupCode" className="multi-ledger-form-label">Group Code:</label>
            <Select
              labelId="groupCode-label"
              id="groupCode"
              value={selectedGroupCode}
              label="Group Code"
              onChange={(e) => setSelectedGroupCode(e.target.value)}
            >
              {groupCodes.map((group) => (
                <MenuItem key={group.group_Code} value={group.group_Code}>
                  {group.group_Name_E}
                </MenuItem>
              ))}
            </Select>
            
        {/* <button onClick={unselectAllAccounts} className="multi-ledger-submit-button">Unselect All</button> */}
            <button type="submit" onClick={getAccounts} className="multi-ledger-submit-button">
            Multiple Ledgers
          </button>
          <PerPageSelect value={perPage} onChange={handlePerPageChange} />
          <SearchBar value={searchTerm} onChange={handleSearchTermChange} />
          <button onClick={handleMultipleLedger}  disabled={loading} className="multi-ledger-submit-button">{loading ? "Generating..." : "📑 Get Report"}</button>
          </div>
          </div>
          
        </form>
        <div className="checkbox-container">
  <Checkbox checked={selectAll} onChange={handleSelectAllChange} />
  <label>Select All</label>
</div>

        {showTable && (
        <TableContainer component={Paper} className="table-container">
        <Table stickyHeader aria-label="accounts table">
          <TableHead>
            <TableRow>
              <TableCell>AcCode</TableCell>
              <TableCell>AcName</TableCell>
              <TableCell>Transaction Count</TableCell>
              <TableCell>Select</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
          {paginatedPosts.map((account) => (
                <TableRow key={account.AC_CODE}>
                  <TableCell>{account.AC_CODE}</TableCell>
                  <TableCell>{account.Ac_Name_E}</TableCell>
                  <TableCell>{account.counts}</TableCell>
                  <TableCell>
                  <Checkbox
                        checked={!!selectedAccounts[account.AC_CODE]}
                        onChange={() => toggleAccountSelection(account.AC_CODE)}
                      />
                  </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
        )}
        {showTable && pageCount > 1 && (
        <Pagination
          pageCount={pageCount}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      )}
      </div>
    </div>
  );
};

export default MultipleLedger;