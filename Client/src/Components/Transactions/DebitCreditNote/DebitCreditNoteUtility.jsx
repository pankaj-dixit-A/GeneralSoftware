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
    Select,
    MenuItem,
    Grid,
    Paper,
    Typography,
    Box
} from "@mui/material";
import Pagination from "../../../Common/UtilityCommon/Pagination";
import SearchBar from "../../../Common/UtilityCommon/SearchBar";
import PerPageSelect from "../../../Common/UtilityCommon/PerPageSelect";
import PageNotFound from "../../../Common/PageNotFound/PageNotFound";
import axios from "axios";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import BackButton from "../../../Common/Buttons/BackButton";
import CreateNewButton from "../../../Common/Buttons/CreateNewButton";
import CircularSpinner from "../../../Common/Spinners/CircularSpinner";

const API_URL = process.env.REACT_APP_API;

function DebitCreditNoteUtility() {

    //GET values from session.
    const uid = sessionStorage.getItem('uid');
    const companyCode = sessionStorage.getItem('Company_Code');
    const Year_Code = sessionStorage.getItem('Year_Code');

    const [fetchedData, setFetchedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [perPage, setPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [filterValue, setFilterValue] = useState("DN");
    const [canView, setCanView] = useState(null);
    const [permissionsData, setPermissionData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkPermissions = async () => {
            try {
                const userCheckUrl = `${API_URL}/get_user_permissions?Company_Code=${companyCode}&Program_Name=/debitcreditnote-utility&uid=${uid}`;
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
            setIsLoading(true);
            try {
                const apiUrl = `${API_URL}/getdata-debitcreditNote?Company_Code=${companyCode}&Year_Code=${Year_Code}`;
                const response = await axios.get(apiUrl);
                if (response.data && response.data.all_data) {
                    setFetchedData(response.data.all_data);
                    filterData(response.data.all_data, filterValue);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
            finally {
                setIsLoading(false);
            }
        };

        checkPermissions();
    }, []);

    const filterData = (data, filterValue) => {
        const filtered = data.filter(post => {
            const searchTermLower = searchTerm.toLowerCase();
            const tranTypeMatch = (post.tran_type || '').toLowerCase() === filterValue.toLowerCase();
            return tranTypeMatch && (
                String(post.doc_no).toLowerCase().includes(searchTermLower) ||
                (post.doc_date || '').toLowerCase().includes(searchTermLower) ||
                (post.AccountName || '').toLowerCase().includes(searchTermLower) ||
                String(post.bill_amount).toLowerCase().includes(searchTermLower) ||
                String(post.dcid).toLowerCase().includes(searchTermLower) ||
                (post.ShipTo || '').toLowerCase().includes(searchTermLower) ||
                String(post.bill_id || '').toLowerCase().includes(searchTermLower) ||
                (post.ackno || '').toLowerCase().includes(searchTermLower) ||
                String(post.IsDeleted).toLowerCase().includes(searchTermLower)
            );
        });

        setFilteredData(filtered);
        setCurrentPage(1);
    };

    useEffect(() => {
        filterData(fetchedData, filterValue);
    }, [searchTerm, filterValue, fetchedData]);

    if (canView === false) {
        return <PageNotFound />;
    }

    const handlePerPageChange = (event) => {
        setPerPage(event.target.value);
        setCurrentPage(1);
    };

    const handleSearchTermChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleRowClick = (doc_no) => {
        const selectedRecord = filteredData.find(record => record.doc_no === doc_no);
        navigate("/debitcreditnote", { state: { selectedRecord, permissionsData } });
    };

    const handleBack = () => {
        navigate("/DashBoard");
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleButtonClick = () => {
        navigate("/debitcreditnote", {
            state: { tran_type: filterValue, permissionsData }
        })
    };

    const pageCount = Math.ceil(filteredData.length / perPage);
    const paginatedPosts = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);

    return (
        <div style={{ padding: '5px', overflow: 'hidden' }}>
            <Grid container spacing={1} alignItems="center">
                <Grid item>
                    {/* <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate("/debitcreditnote", { state: { tran_type: filterValue, permissionsData } })}>
                        Create New
                    </Button> */}
                    <CreateNewButton
                        onClick={handleButtonClick}
                        disabled={permissionsData.canSave === "N"}
                        permissionsData={permissionsData}
                    />
                </Grid>
                <Grid item>
                    {/* <Button variant="contained" color="secondary" onClick={handleBack}>
                        Back
                    </Button> */}
                    <BackButton onClick={handleBack} />
                </Grid>
                <Grid item mt={1}>
                    <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                </Grid>

                <Grid item xs={12} sm={2} mt={1}>
                    <FormControl fullWidth>
                        <Select
                            labelId="filterSelect-label"
                            id="filterSelect"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            size="small"
                        >
                            <MenuItem value="DN">Debit Note To Customer</MenuItem>
                            <MenuItem value="CN">Credit Note To Customer</MenuItem>
                            <MenuItem value="DS">Debit Note To Supplier</MenuItem>
                            <MenuItem value="CS">Credit Note To Supplier</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={2} ml={15}>
                    <Typography variant="h6" style={{ textAlign: 'center', fontWeight: 'bold' }}>
                        Debit Credit Note
                    </Typography>
                </Grid>
                <Grid item xs={10} sm={5}>
                    <SearchBar
                        value={searchTerm}
                        onChange={handleSearchTermChange}
                    />
                </Grid>
                <Grid item xs={12} mt={-2}>
                    {isLoading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" height="600px">
                            <CircularSpinner />
                        </Box>
                    ) : (
                        <Paper elevation={20}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Doc No</TableCell>
                                            <TableCell>Tran Type</TableCell>
                                            <TableCell>Doc Date</TableCell>
                                            <TableCell>Account Name</TableCell>
                                            <TableCell>Bill Amount</TableCell>
                                            <TableCell>DcID</TableCell>
                                            <TableCell>Ship To Name</TableCell>
                                            <TableCell>Old Bill ID</TableCell>
                                            <TableCell>Ack No</TableCell>
                                            <TableCell>Is Deleted</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedPosts.map((post) => (
                                            <TableRow
                                                key={post.doc_no}
                                                className="row-item"
                                                style={{ cursor: "pointer" }}
                                                onDoubleClick={() => handleRowClick(post.doc_no)}
                                                sx={{
                                                    '&:hover': {
                                                        backgroundColor: '#f3f388',
                                                    },
                                                }}
                                            >
                                                <TableCell>{post.doc_no}</TableCell>
                                                <TableCell>{post.tran_type}</TableCell>
                                                <TableCell>{post.doc_date}</TableCell>
                                                <TableCell>{post.AccountName}</TableCell>
                                                <TableCell>{formatReadableAmount(post.bill_amount)}</TableCell>
                                                <TableCell>{post.dcid}</TableCell>
                                                <TableCell>{post.ShipTo}</TableCell>
                                                <TableCell>{post.bill_id}</TableCell>
                                                <TableCell>{post.ackno}</TableCell>
                                                <TableCell>{post.IsDeleted}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}
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

export default DebitCreditNoteUtility;
