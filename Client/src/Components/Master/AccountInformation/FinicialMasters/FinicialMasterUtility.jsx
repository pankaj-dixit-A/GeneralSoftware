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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Paper,
    Typography,
} from "@mui/material";
import Pagination from "../../../../Common/UtilityCommon/Pagination";
import SearchBar from "../../../../Common/UtilityCommon/SearchBar";
import PerPageSelect from "../../../../Common/UtilityCommon/PerPageSelect";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = process.env.REACT_APP_API;
const socketUrl = process.env.REACT_APP_API_URL;

function FinicialGroups() {
    const [fetchedData, setFetchedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [perPage, setPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [filterValue, setFilterValue] = useState("B");
    const navigate = useNavigate();

    const companyCode = sessionStorage.getItem('Company_Code');
    const Year_Code = sessionStorage.getItem('Year_Code');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiUrl = `${API_URL}/getall-finicial-groups?Company_Code=${companyCode}&Year_Code=${Year_Code}`;
                const response = await axios.get(apiUrl);
                setFetchedData(response.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const socket = io(socketUrl);

        socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        socket.on('addGroup', (newGroup) => {
            setFetchedData((prevData) => [...prevData, newGroup]);
            console.log('New group added:', newGroup);
        });

        socket.on('updateGroup', (updatedGroup) => {
            setFetchedData((prevData) =>
                prevData.map((group) =>
                    group.group_Code === updatedGroup.group_Code ? updatedGroup : group
                )
            );
            console.log("updatedGroup", updatedGroup);
        });

        socket.on('deleteGroup', (deletedGroup) => {
            setFetchedData((prevData) =>
                prevData.filter((group) => group.group_Code !== deletedGroup.group_Code)
            );
            console.log('Group deleted:', deletedGroup);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from socket server');
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        const filtered = fetchedData.filter(post => {
            const searchTermLower = searchTerm.toLowerCase();
    
            // Check if any of the fields in the post match the search term
            const groupCodeLower = String(post.group_Code).toLowerCase();
            const groupNameLower = (post.group_Name_E || '').toLowerCase();
            const groupOrderLower = String(post.group_Order).toLowerCase();
            const groupSummaryLower = (post.group_Summary || '').toLowerCase();
            const groupTypeLower = (post.group_Type || '').toLowerCase();
    
            return (
                (filterValue === "" || post.group_Type === filterValue) &&
                (
                    groupCodeLower.includes(searchTermLower) ||
                    groupNameLower.includes(searchTermLower) ||
                    groupOrderLower.includes(searchTermLower) ||
                    groupSummaryLower.includes(searchTermLower) ||
                    groupTypeLower.includes(searchTermLower)
                )
            );
        });
    
        setFilteredData(filtered);
        setCurrentPage(1);
    }, [searchTerm, filterValue, fetchedData]);
    
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
        const type = filterValue;
        navigate("/financial-groups", { state: { type } });
    };

    const handleRowClick = (group_Code) => {
        const selectedRecord = filteredData.find(record => record.group_Code === group_Code);
        navigate("/financial-groups", { state: { selectedRecord } });
    };

    const handleSearchClick = () => {
        //setFilterValue("");
    };

    const handleBack = () => {
        navigate("/DashBoard");
    };

    return (
        <div>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold", marginTop: "10px" }}>
                Group Master
            </Typography>

            <Grid container spacing={3} alignItems="center">
            <Grid item ml={1}>
                    <Button variant="contained" color="primary" onClick={handleClick}>
                        Create New
                    </Button>
                </Grid>
                <Grid item>
                    <Button variant="contained" color="secondary" onClick={handleBack}>
                        Back
                    </Button>
                </Grid>
                <Grid item ml={1}>
                    <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                </Grid>

                <Grid item ml={1}>
                    <FormControl>
                        <InputLabel>Filter by Type:</InputLabel>
                        <Select
                            labelId="filterSelect-label"
                            id="filterSelect"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                        >
                            <MenuItem value="B">Balance Sheet</MenuItem>
                            <MenuItem value="T">Trading</MenuItem>
                            <MenuItem value="P">Profit & Loss</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={4} >
                    <SearchBar
                        value={searchTerm}
                        onChange={handleSearchTermChange}
                        onSearchClick={handleSearchClick}
                    />
                </Grid>
            </Grid>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper elevation={20}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Group Code</TableCell>
                                        <TableCell>Group Name</TableCell>
                                        <TableCell>Group Order</TableCell>
                                        <TableCell>Group Summary</TableCell>
                                        <TableCell>Group Type</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedPosts.map((post) => (
                                        <TableRow
                                            key={post.group_Code}
                                            className="row-item"
                                            style={{ cursor: "pointer" }}
                                            onDoubleClick={() => handleRowClick(post.group_Code)}
                                        >
                                            <TableCell>{post.group_Code}</TableCell>
                                            <TableCell>{post.group_Name_E}</TableCell>
                                            <TableCell>{post.group_Order}</TableCell>
                                            <TableCell>{post.group_Summary}</TableCell>
                                            <TableCell>{post.group_Type}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
            <Grid container spacing={3} mt={2}>
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

export default FinicialGroups;