import React, { useState, useEffect, useMemo } from "react";
import { Button, Modal } from "react-bootstrap";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";
import axios from "axios";
import "../App.css";

const API_URL = process.env.REACT_APP_API;
var lActiveInputFeild = ''
const CityMasterHelp = ({ onAcCodeClick, name, CityName, CityCode, disabledFeild, tabIndexHelp }) => {
    const CompanyCode = sessionStorage.getItem("Company_Code");
    const [showModal, setShowModal] = useState(false);
    const [popupContent, setPopupContent] = useState([]);
    const [enteredAcCode, setEnteredAcCode] = useState(CityCode || "");
    const [enteredAcName, setEnteredAcName] = useState(CityName || "");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRowIndex, setSelectedRowIndex] = useState(-1);

    const itemsPerPage = 10;

    // Fetch data once on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${API_URL}/group_city_master?Company_Code=${CompanyCode}`);
                setPopupContent(response.data || []);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, []);

    // Update enteredAcCode and enteredAcName when props change
    useEffect(() => {
        setEnteredAcCode(CityCode || "");
        setEnteredAcName(CityName || "");
    }, [CityCode, CityName]);

    // Filter data locally based on search term
    const filteredData = useMemo(() => {
        return popupContent.filter((item) =>
            item.city_name_e?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [popupContent, searchTerm]);

    // Paginated data
    const itemsToDisplay = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    // Handle search
    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
        setCurrentPage(1); // Reset to the first page when search changes
    };

    // Handle modal toggle
    const handleMillCodeButtonClick = () => {
        setShowModal(true);
    };

    // Close modal
    const handleCloseModal = () => {
        setShowModal(false);
    };

    // Handle input change for code field
    const handleAcCodeChange = (event) => {
        const value = event.target.value;
        setEnteredAcCode(value);
        setEnteredAcName(""); // Clear name while searching locally

        const matchingItem = popupContent.find((item) => item.city_code.toString() === value);
        if (matchingItem) {
            setEnteredAcName(matchingItem.city_name_e);
            onAcCodeClick?.(matchingItem.city_code, matchingItem.cityid, matchingItem.city_name_e, matchingItem.pincode);
        }
    };

    // Handle double-click on a record in the modal
    const handleRecordDoubleClick = (item) => {
        setEnteredAcCode(item.city_code);
        setEnteredAcName(item.city_name_e);
        setShowModal(false);
        onAcCodeClick?.(item.city_code, item.cityid, item.city_name_e, item.pincode);
    };

    // Handle pagination number change
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    // Handle keyboard navigation (F1 and Tab keys)
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "F1") {
                if (event.target.id === name) {
                    lActiveInputFeild = name;
                    setSearchTerm(event.target.value);
                    event.preventDefault();
                    setShowModal(true);
                }
            } else if (event.key === "Tab" && showModal) {
                event.preventDefault();
                if (selectedRowIndex >= itemsToDisplay.length - 1) {
                    setSelectedRowIndex(0); // Loop back to the first item
                } else {
                    setSelectedRowIndex((prev) => prev + 1); // Move to the next item
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [showModal, selectedRowIndex, itemsToDisplay]);


    useEffect(() => {
        const handleKeyNavigation = (event) => {
            if (showModal) {
                if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setSelectedRowIndex((prev) => Math.max(prev - 1, 0));
                } else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setSelectedRowIndex((prev) => Math.min(prev + 1, itemsToDisplay.length - 1));
                } else if (event.key === "Enter") {
                    event.preventDefault();
                    if (selectedRowIndex >= 0) {
                        handleRecordDoubleClick(itemsToDisplay[selectedRowIndex]);
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyNavigation);

        return () => {
            window.removeEventListener("keydown", handleKeyNavigation);
        };
    }, [showModal, selectedRowIndex, itemsToDisplay, handleRecordDoubleClick]);

    return (
        <div className="d-flex flex-row">
            <div className="d-flex">
                <input
                    type="text"
                    className="form-control ms-2"
                    id={name}
                    autoComplete="off"
                    value={enteredAcCode}
                    onChange={handleAcCodeChange}
                    style={{ width: "150px", height: "35px" }}
                    disabled={disabledFeild}
                    tabIndex={tabIndexHelp}
                />
                <Button
                    variant="primary"
                    onClick={handleMillCodeButtonClick}
                    className="ms-1"
                    style={{ width: "30px", height: "35px" }}
                    disabled={disabledFeild}
                    tabIndex={tabIndexHelp}
                >
                    ...
                </Button>
                <label id="acNameLabel" className="form-labels ms-2" style={{ whiteSpace: 'nowrap', fontSize: "14px", fontWeight: "bold", marginTop: "5px" }}>
                    {enteredAcName}
                </label>
            </div>
            <Modal
                show={showModal}
                onHide={handleCloseModal}
                dialogClassName="modal-dialog"
            >
                {/* <Modal.Header closeButton>
                    <Modal.Title>City Selection</Modal.Title>
                </Modal.Header> */}
                <Modal.Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Modal.Title>City Master</Modal.Title>
                    <Button
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'blue' }}
                        onClick={handleCloseModal}
                    >
                        X
                    </Button>
                </Modal.Header>
                <Modal.Body>
                    <DataTableSearch data={popupContent} onSearch={handleSearch} />
                    <div className="table-responsive">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>City Code</th>
                                    <th>City Name</th>
                                    <th>City Id</th>
                                    <th>Pin Code</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itemsToDisplay.map((item, index) => (
                                    <tr
                                        key={index}
                                        className={selectedRowIndex === index ? "selected-row" : ""}
                                        onDoubleClick={() => handleRecordDoubleClick(item)}
                                    >
                                        <td>{item.city_code}</td>
                                        <td>{item.city_name_e}</td>
                                        <td>{item.cityid}</td>
                                        <td>{item.pincode}</td>
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

export default CityMasterHelp;
