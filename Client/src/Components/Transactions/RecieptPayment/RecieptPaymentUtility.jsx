import React, { useState, useEffect, useMemo } from "react";
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
    MenuItem,
    Select,
    FormControl,
    Typography,
    Box
} from "@mui/material";
import Pagination from "../../../Common/UtilityCommon/Pagination";
import SearchBar from "../../../Common/UtilityCommon/SearchBar";
import PerPageSelect from "../../../Common/UtilityCommon/PerPageSelect";
import axios from "axios";
import PageNotFound from "../../../Common/PageNotFound/PageNotFound";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import BackButton from "../../../Common/Buttons/BackButton";
import CreateNewButton from "../../../Common/Buttons/CreateNewButton";
import CircularSpinner from "../../../Common/Spinners/CircularSpinner";

const API_URL = process.env.REACT_APP_API;

function RecieptPaymentUtility() {
    const Year_Code = sessionStorage.getItem("Year_Code");
    const companyCode = sessionStorage.getItem("Company_Code");
    const uid = sessionStorage.getItem('uid');

    const [fetchedData, setFetchedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [perPage, setPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [tranType, setTranType] = useState("BR");
    const [isLoading, setIsLoading] = useState(false);
    const [canView, setCanView] = useState(null);
    const [permissionsData, setPermissionData] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const checkPermissions = async () => {
            try {
                const userCheckUrl = `${API_URL}/get_user_permissions?Company_Code=${companyCode}&Program_Name=/RecieptPaymentUtility&uid=${uid}`;
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
            setFetchedData([]);
            try {
                const offset = (currentPage - 1) * perPage;
                const apiUrl = `${API_URL}/getdata-receiptpayment?Company_Code=${companyCode}&Year_Code=${Year_Code}&tran_type=${tranType}`;
                const response = await axios.get(apiUrl);

                if (response.data && Array.isArray(response.data.all_data_receiptpayment)) {
                    setFetchedData(response.data.all_data_receiptpayment);
                    setFilteredData(response.data.all_data_receiptpayment);
                } else {
                    console.error("Unexpected response format:", response.data);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkPermissions();
    }, [tranType, perPage, companyCode, Year_Code]);

    const paginatedData = useMemo(() => {
        const filtered = fetchedData.filter((post) => {
            const searchTermLower = searchTerm.toLowerCase();
            return (
                String(post.doc_no || "").toLowerCase().includes(searchTermLower) ||
                String(post.tran_type || "").toLowerCase().includes(searchTermLower) ||
                String(post.doc_date || "").toLowerCase().includes(searchTermLower) ||
                String(post.bank_name || "").toLowerCase().includes(searchTermLower) ||
                String(post.amount || "").toLowerCase().includes(searchTermLower) ||
                String(post.credit_ac || "").toLowerCase().includes(searchTermLower) ||
                String(post.creditacname || "").toLowerCase().includes(searchTermLower) ||
                String(post.narration || "").toLowerCase().includes(searchTermLower)
            );
        });

        const pageCount = Math.ceil(filtered.length / perPage);
        const paginatedPosts = filtered.slice(
            (currentPage - 1) * perPage,
            currentPage * perPage
        );

        return { paginatedPosts, pageCount };
    }, [fetchedData, searchTerm, perPage, currentPage]);

    const handleTranTypeChange = (event) => {
        setTranType(event.target.value);
        setFilteredData([]);
        setCurrentPage(1);
    };

    const handlePerPageChange = (event) => {
        setPerPage(Number(event.target.value));
        setCurrentPage(1);
    };

    if (canView === false) {
        return <PageNotFound />;
    }

    const handleSearchTermChange = (event) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleClick = () => {
        navigate("/receipt-payment", { state: { tranType, permissionsData } });
    };

    const handleRowClick = (tranid) => {
        const selectedRecord = fetchedData.find(
            (record) => record.tranid === tranid
        );
        navigate("/receipt-payment", { state: { selectedRecord, permissionsData } });
    };

    const handleBack = () => {
        navigate("/DashBoard");
    };

    return (
        <div>
            <Grid  >
                <Grid item xs={12}>
                    <Grid container alignItems="center" spacing={1}>
                        <Grid item>
                            <CreateNewButton
                                onClick={handleClick}
                                disabled={!tranType || permissionsData.canSave === "N"}
                                permissionsData={permissionsData}
                            />
                        </Grid>
                        <Grid item>
                            <BackButton onClick={handleBack} />
                        </Grid>
                        <Grid item mt={1}>
                            <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                        </Grid>
                        <Grid item mt={1}>
                            <FormControl>
                                <Select value={tranType} onChange={handleTranTypeChange} size="small">
                                    <MenuItem value="BR">Bank Receipt</MenuItem>
                                    <MenuItem value="BP">Bank Payment</MenuItem>
                                    <MenuItem value="CR">Cash Receipt</MenuItem>
                                    <MenuItem value="CP">Cash Payment</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={2} ml={40} >
                            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Receipt Payment</Typography>
                        </Grid>

                        <Grid item xs={4} sx={{ justifyContent: "flex-end" }} >
                            <SearchBar value={searchTerm} onChange={handleSearchTermChange} />
                        </Grid>
                    </Grid>
                </Grid>

                <Grid item xs={12}>
                    {isLoading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" height="600px">
                            <CircularSpinner />
                        </Box>
                    ) : (
                        <Paper elevation={3}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Doc No</TableCell>
                                            <TableCell>Tran Type</TableCell>
                                            <TableCell>Doc Date</TableCell>
                                            <TableCell>Bank Name</TableCell>
                                            <TableCell>Amount</TableCell>
                                            <TableCell>Credit Code</TableCell>
                                            <TableCell>Credit Name</TableCell>
                                            <TableCell>Narration</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody >
                                        {paginatedData.paginatedPosts.map((post) => (
                                            <TableRow
                                                key={post.trandetailid}
                                                onDoubleClick={() => handleRowClick(post.tranid)}
                                                style={{ cursor: "pointer" }}
                                                sx={{
                                                    '&:hover': {
                                                        backgroundColor: '#f3f388',
                                                    },
                                                }}
                                            >
                                                <TableCell>{post.doc_no || ""}</TableCell>
                                                <TableCell>{post.tran_type || ""}</TableCell>
                                                <TableCell>{post.doc_date || ""}</TableCell>
                                                <TableCell>{post.bank_name || ""}</TableCell>
                                                <TableCell>{formatReadableAmount(post.amount) || ""}</TableCell>
                                                <TableCell>{post.credit_ac || ""}</TableCell>
                                                <TableCell>{post.creditacname || ""}</TableCell>
                                                <TableCell>{post.narration || ""}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}
                </Grid>

                <Grid item xs={12} mb={15}>
                    <Pagination
                        pageCount={paginatedData.pageCount}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                    />
                </Grid>
            </Grid>
        </div>
    );
}

export default RecieptPaymentUtility;
