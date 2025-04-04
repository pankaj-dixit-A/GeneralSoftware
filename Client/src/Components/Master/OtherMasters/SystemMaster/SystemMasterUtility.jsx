import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageNotFound from "../../../../Common/PageNotFound/PageNotFound";

import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Paper,
    Typography
} from "@mui/material";
import Pagination from "../../../../Common/UtilityCommon/Pagination";
import SearchBar from "../../../../Common/UtilityCommon/SearchBar";
import PerPageSelect from "../../../../Common/UtilityCommon/PerPageSelect";
import axios from "axios";

const API_URL = process.env.REACT_APP_API;


function SystemMasterUtility() {

    const companyCode = sessionStorage.getItem('Company_Code');
    const Year_Code = sessionStorage.getItem('Year_Code');
    const uid = sessionStorage.getItem('uid');
    const [fetchedData, setFetchedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [perPage, setPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [filterValue, setFilterValue] = useState("G");
    const [canView, setCanView] = useState(null);
    const [permissionsData, setPermissionData] = useState({});
    const navigate = useNavigate();

    useEffect(() => {

        const checkPermissions = async () => {
            try {
                const userCheckUrl = `${API_URL}/get_user_permissions?Company_Code=${companyCode}&Program_Name=/syetem-masterutility&uid=${uid}`;
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
            const companyCode = sessionStorage.getItem('Company_Code');
            try {
                const apiUrl = `${API_URL}/getall-SystemMaster?Company_Code=${companyCode}`;
                const response = await axios.get(apiUrl);
                setFetchedData(response.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        checkPermissions();
    }, []);


    useEffect(() => {
        const filtered = fetchedData.filter(post => {
            const searchTermLower = searchTerm.toLowerCase();
            return (
                (filterValue === "" || post.System_Type === filterValue) &&
                (String(post.System_Code).includes(searchTermLower) ||
                    post.System_Name_E.toLowerCase().includes(searchTermLower))
            );
        });

        setFilteredData(filtered);
        setCurrentPage(1);
    }, [searchTerm, filterValue, fetchedData]);

    if (canView === false) {
        return <PageNotFound />;
    }

    const handlePerPageChange = (event) => {
        setPerPage(event.target.value);
        setCurrentPage(1);
    };

    const handleSearchTermChange = (event) => {
        const term = event.target.value;
        setSearchTerm(term);
    };

    const pageCount = Math.ceil(filteredData.length / perPage);

    const paginatedPosts = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleClick = () => {
        const selectedfilter = filterValue
        navigate("/syetem-master", { state: { selectedfilter } });
       
    };

    const handleRowClick = (System_Code) => {
        const selectedRecord = filteredData.find(record => record.System_Code === System_Code);
        console.log("selectedRecord", selectedRecord)
        navigate("/syetem-master", { state: { selectedRecord } });
    };

    const handleSearchClick = () => {
        setFilterValue("");
    };

    const handleBack = () => {
        navigate("/DashBoard")
    }

    return (
        <div >
             <h5 className="mt-4 mb-4 text-center custom-heading">System Master</h5>
            <Grid container spacing={3}>
           
            <Grid container spacing={3} alignItems="center">
    <Grid item xs="auto" ml={4}>
        <Button variant="contained" style={{ marginTop: "5vh" }} onClick={handleClick}>
            Add
        </Button>
    </Grid>
    <Grid item xs="auto">
        <Button variant="contained" style={{ marginTop: "5vh" }} onClick={handleBack}>
            Back
        </Button>
    </Grid>
    

    {/* PerPageSelect */}
    <Grid item xs={2} sm={2} style={{ marginTop: "4vh" }}>
        <PerPageSelect value={perPage} onChange={handlePerPageChange} />
    </Grid>

    {/* SearchBar */}
    <Grid item xs={5} sm={5} style={{ marginTop: "5vh", marginLeft:"25vh" }}>
        <SearchBar
            value={searchTerm}
            onChange={handleSearchTermChange}
            onSearchClick={handleSearchClick}
        />
    </Grid>

    {/* Filter by Type Select */}
    <Grid item xs={2} sm={2} style={{ marginTop: "5vh" }}>
        <FormControl fullWidth>
            <InputLabel>Filter by Type:</InputLabel>
            <Select
                labelId="filterSelect-label"
                id="filterSelect"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
            >
                <MenuItem value="G">Mobile Group</MenuItem>
                <MenuItem value="N">Narration</MenuItem>
                <MenuItem value="V">Vat</MenuItem>
                <MenuItem value="I">Item</MenuItem>
                <MenuItem value="S">Grade</MenuItem>
                <MenuItem value="Z">Season</MenuItem>
                <MenuItem value="U">Unit</MenuItem>
            </Select>
        </FormControl>
    </Grid>
</Grid>

                <Grid item xs={12}>
                    <Paper elevation={20}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>System Code</TableCell>
                                        <TableCell>System Type</TableCell>
                                        <TableCell>System Name</TableCell>
                                        <TableCell>System_Rate</TableCell>
                                        <TableCell>HSN</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedPosts.map((post) => (
                                        <TableRow
                                            key={post.System_Code}
                                            className="row-item"
                                            style={{ cursor: "pointer" }}
                                            onDoubleClick={() => handleRowClick(post.System_Code)}
                                        >
                                            <TableCell>{post.System_Code}</TableCell>
                                            <TableCell>{post.System_Type}</TableCell>
                                            <TableCell>{post.System_Name_E}</TableCell>
                                            <TableCell>{post.System_Rate}</TableCell>
                                            <TableCell>{post.HSN}</TableCell>
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

export default SystemMasterUtility;
