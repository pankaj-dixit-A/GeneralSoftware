import React, { useState, useEffect, useCallback } from "react";
import { Button, Modal } from "react-bootstrap";
import axios from "axios";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";

const ProfitNLossLotNoHelp = ({ onLotNoClick, name, MillCode, tabIndexHelp, disabledFeild }) => {
    const CompanyCode = sessionStorage.getItem("Company_Code");
    const YearCode = sessionStorage.getItem("Year_Code");
    const API_URL = process.env.REACT_APP_API;
    const [showModal, setShowModal] = useState(false);
    const [popupContent, setPopupContent] = useState([]);
    const [enteredLotNo, setEnteredLotNo] = useState("");
    const [enteredDate, setEnteredDate] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
    const [apiDataFetched, setApiDataFetched] = useState(false);

    const fetchAndOpenPopup = async () => {
        if (!apiDataFetched) {
            await fetchData();
        }
        setShowModal(true);
    };

    const handleButtonClicked = () => {
        fetchAndOpenPopup();
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const fetchData = useCallback(async () => {
        try {
            const response = await axios.get(
                `${API_URL}/profit-loss-lot-no`,
                {
                    params: {
                        Company_Code: CompanyCode,
                        Year_Code: YearCode,
                        Mill_Code: MillCode,
                    },
                }
            );
            const data = response.data;
            setPopupContent(data);
            setApiDataFetched(true);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }, [CompanyCode, YearCode, MillCode, API_URL]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleLotNoChange = (event) => {
        const { value } = event.target;
        setEnteredLotNo(value);

        if (value === "") {
            setEnteredDate("");
        }
    };

    const handleKeyDown = async (event) => {
        if (event.key === "Tab" && event.target.id === name) {
            if (!apiDataFetched) {
                await fetchData();
            }

            const matchingItem = popupContent.find(item => item.Tender_No.toString() === enteredLotNo);
            if (matchingItem) {
                setEnteredDate(matchingItem.Tender_Date);

                if (onLotNoClick) {
                    onLotNoClick(matchingItem.Tender_No, matchingItem.Tender_Date);
                }
            } else {
                setEnteredDate("");
            }
        }
    };

    const handleRecordDoubleClick = (item) => {
        setEnteredLotNo(item.Tender_No);
        setEnteredDate(item.Tender_Date);

        if (onLotNoClick) {
            onLotNoClick(item.Tender_No, item.Tender_Date);
        }
        setShowModal(false);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
    };

    const filteredData = popupContent.filter((item) =>
        item.Tender_No && item.Tender_No.toString().includes(searchTerm.toLowerCase())
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredData.slice(startIndex, endIndex);

    return (
        <div className="d-flex flex-row ">
            <div className="d-flex ">
                <div className="d-flex">
                    <input
                        type="text"
                        className="form-control ms-2"
                        id={name}
                        autoComplete="off"
                        value={enteredLotNo}
                        onChange={handleLotNoChange}
                        onKeyDown={handleKeyDown}
                        style={{ width: "150px", height: "35px" }}
                        tabIndex={tabIndexHelp}
                        disabled={disabledFeild}
                    />
                    <Button
                        variant="primary"
                        onClick={handleButtonClicked}
                        className="ms-1"
                        style={{ width: "30px", height: "35px" }}
                        disabled={disabledFeild}
                    >
                        ...
                    </Button>
                    <label id="lotNoLabel" className="form-labels ms-2" style={{ whiteSpace: 'nowrap', fontSize: "14px", fontWeight: "bold", marginTop: "5px" }}>
                        {enteredDate ? `Date: ${enteredDate}` : ""}
                    </label>
                </div>
            </div>
            <Modal
                show={showModal}
                onHide={handleCloseModal}
                dialogClassName="modal-dialog modal-fullscreen"
            >
                <Modal.Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Modal.Title>Lot No Help</Modal.Title>
                    <Button
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'blue' }}
                        onClick={handleCloseModal}
                    >
                        X
                    </Button>
                </Modal.Header>
                <DataTableSearch data={popupContent} onSearch={handleSearch} />
                <Modal.Body>
                    <div style={{ overflowX: "auto" }}>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                marginBottom: "1rem",
                                backgroundColor: "#fff",
                            }}
                        >
                            <thead>
                                <tr style={{ backgroundColor: "#f8f9fa" }}>
                                    <th style={{ border: "1px solid #dee2e6", padding: "8px" }}>Lot No</th>
                                    <th style={{ border: "1px solid #dee2e6", padding: "8px" }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itemsToDisplay.map((item, index) => (
                                    <tr
                                        key={item.Tender_No}
                                        style={{
                                            cursor: "pointer",
                                            backgroundColor: selectedRowIndex === index ? "#d6e9f9" : "white",
                                        }}
                                        onClick={() => setSelectedRowIndex(index)}
                                        onDoubleClick={() => handleRecordDoubleClick(item)}
                                    >
                                        <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{item.Tender_No}</td>
                                        <td style={{ border: "1px solid #dee2e6", padding: "8px" }}>{item.Tender_Date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <DataTablePagination
                        totalItems={filteredData.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                    />
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ProfitNLossLotNoHelp;
