import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Grid,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import PageNotFound from "../../../Common/PageNotFound/PageNotFound";
import Pagination from "../../../Common/UtilityCommon/Pagination";
import SearchBar from "../../../Common/UtilityCommon/SearchBar";
import PerPageSelect from "../../../Common/UtilityCommon/PerPageSelect";
import axios from "axios";



function CommissionBillUtility() {
  const companyCode = sessionStorage.getItem("Company_Code");
  const yearCode = sessionStorage.getItem("Year_Code");
  const uid = sessionStorage.getItem('uid');
  const apiURL = process.env.REACT_APP_API;
  
  const [fetchedData, setFetchedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterValue, setFilterValue] = useState("");
  const [canView, setCanView] = useState(null);
  const [permissionsData, setPermissionData] = useState({});
  const [tranType, setTranType] = useState(sessionStorage.getItem("Tran_Type") || "LV");
  const navigate = useNavigate();

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    day = day < 10 ? "0" + day : day;
    month = month < 10 ? "0" + month : month;

    return `${day}/${month}/${year}`;
  }

  useEffect(() => {
    const checkPermissions = async () => {
      try {
          const userCheckUrl = `${apiURL}/get_user_permissions?Company_Code=${companyCode}&Year_Code=${yearCode}&Program_Name=/CommissionBill-utility&uid=${uid}`;
          const response = await axios.get(userCheckUrl);
          setPermissionData(response.data?.UserDetails);
          if (response.data?.UserDetails?.canView === 'Y') {
              setCanView(true);
              fetchData();
          } else {
              setCanView(false);
          }
      } catch (error) {
          console.error("Error fetching user permissions:", error);
          setCanView(false);
      }
  };
    const fetchData = async () => {
      try {
        const apiUrl = `${apiURL}/getall-CommissionBill?Year_Code=${yearCode}&Company_Code=${companyCode}&Tran_Type=${tranType}`;
        const response = await axios.get(apiUrl);
        setFetchedData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    checkPermissions();
  }, [tranType]);

  useEffect(() => {
    const searchTermLower = searchTerm.toLowerCase();

    const filtered = fetchedData.filter((post) => {
      const purpose = (post.PartyName || post.millname || "").toLowerCase();
      const docNoMatch = searchTermLower ? post.doc_no.toString().includes(searchTermLower) : true;

      return (
        (filterValue === "" || post.doc_no.toString() === filterValue) &&
        (docNoMatch || purpose.includes(searchTermLower))
      );
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterValue, fetchedData]);

  if (canView === false) {
    return <PageNotFound />;
}

  const handleSearchTermChange = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
  };

  const pageCount = Math.ceil(filteredData.length / perPage);

  const paginatedPosts = filteredData.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePerPageChange = (event) => {
    setPerPage(event.target.value);
    setCurrentPage(1);
  };

  const handleSearchClick = () => {
    setFilterValue("");
  };

  const handleClick = () => {
    navigate("/commission-bill",{ state: { tranType, permissionsData } });
    window.location.reload()
    
  };

  const handleRowClick = (doc_no, tranType) => {
    // Find the selected record based on doc_no and tranType
    const selectedRecord = fetchedData.find(
      (commission_bill) => commission_bill.doc_no === doc_no
    );
  
    if (selectedRecord) {
      // Navigate to the commission-bill page and pass the tranType and selectedRecord
      navigate("/commission-bill", {
        state: {
          selectedRecord,
          tranType,
          permissionsData
        },
      });
    } else {
      console.error("Record not found for the provided doc_no and tranType.");
    }
  };
  

  const handleBackButton = () => {
    navigate("/DashBoard");
  };

  const handleTranTypeChange = (event) => {
    const value = event.target.value;
    setTranType(value);
  };

  return (
    <div>
      <Grid container spacing={3}>
        <Grid item xs={0}>
          <Button variant="contained" style={{ marginTop: "20px" }} onClick={handleClick}>
            Add
          </Button>
        </Grid>
        <Grid item xs={0}>
          <Button variant="contained" style={{ marginTop: "20px" }} onClick={handleBackButton}>
            Back
          </Button>
        </Grid>
        <Grid item xs={0} sx={{mt:"3px" }}>
        <PerPageSelect value={perPage} onChange={handlePerPageChange} />
        </Grid>
        <Grid item xs={1} sx={{width:"60px"}} >
          <FormControl >
            <InputLabel id="tran-type-label">Tran Type</InputLabel>
            <Select
              labelId="tran-type-label"
              id="tran-type"
              value={tranType}
              onChange={handleTranTypeChange}
            >
              <MenuItem value="LV">LV</MenuItem>
              <MenuItem value="CV">CV</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={8}>
          <SearchBar
            value={searchTerm}
            onChange={handleSearchTermChange}
            onSearchClick={handleSearchClick}
          />
        </Grid>
        <Grid item xs={12}>
          <Paper elevation={3}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Doc No</TableCell>
                    <TableCell>Doc Date</TableCell>
                    <TableCell>Account Name</TableCell>
                    <TableCell>Item</TableCell>
                    <TableCell>Mill Name</TableCell>
                    <TableCell>Quantal</TableCell>
                    <TableCell>GST Code</TableCell>
                    <TableCell>Diff Amount</TableCell>
                    <TableCell>Taxable Amount</TableCell>
                    <TableCell>Bill Amount</TableCell>
                    <TableCell>TDS%</TableCell>
                    <TableCell>ACK No</TableCell>
                    <TableCell>Commission ID</TableCell>
                    <TableCell>Tran Type</TableCell>
                    <TableCell>DO No</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedPosts.map((post) => (
                    <TableRow
                      key={post.doc_no}
                      className="row-item"
                      style={{ cursor: "pointer" }}
                      onDoubleClick={() => handleRowClick(post.doc_no, tranType)}
                    >
                      <TableCell>{post.doc_no}</TableCell>
                      <TableCell>{formatDate(post.doc_date)}</TableCell>
                      <TableCell>{post.PartyName}</TableCell>
                      <TableCell>{post.Itemcode}</TableCell>
                      <TableCell>{post.millname}</TableCell>
                      <TableCell>{post.qntl}</TableCell>
                      <TableCell>{post.gst_code}</TableCell>
                      <TableCell>{post.subtotal}</TableCell>
                      <TableCell>{post.texable_amount}</TableCell>
                      <TableCell>{post.bill_amount}</TableCell>
                      <TableCell>{post.TDS_Per}</TableCell>
                      <TableCell>{post.ackno}</TableCell>
                      <TableCell>{post.commissionid}</TableCell>
                      <TableCell>{post.Tran_Type}</TableCell>
                      <TableCell>{post.link_no}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Pagination
            pageCount={pageCount}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        </Grid>
      </Grid>
    </div>
  );
}

export default CommissionBillUtility;
