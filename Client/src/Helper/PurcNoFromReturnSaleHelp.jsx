import React, { useState, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";
import axios from "axios";
import "../App.css";

const CompanyCode = sessionStorage.getItem("Company_Code");
const API_URL = process.env.REACT_APP_API;
const Year_Code = sessionStorage.getItem("Year_Code");

var lActiveInputFeild = "";

const PurcNoFromReturnSaleHelp = ({
    onAcCodeClick,
    name,
    purchaseNo,
    OnSaleBillHead,
    OnSaleBillDetail,
    disabledFeild,
    tabIndexHelp,
    Type,
    sugarSaleReturnSale
}) => {
    const [showModal, setShowModal] = useState(false);
    const [popupContent, setPopupContent] = useState([]);
    const [enteredAcCode, setEnteredAcCode] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
    const [selectedItems, setSelectedItems] = useState([]);
    const [totalQuintal, setTotalQuintal] = useState(0);
    const [totalBillAmount, setTotalBillAmount] = useState(0);
    const [loading, setLoading] = useState(false); 
    const [type, setType] = useState("");

    const fetchAndOpenPopup = async () => {
        try {
            const response = await axios.get(`${API_URL}/PurcNoFromReturnSale?Company_Code=${CompanyCode}`);
            const data = response.data;
            const filteredData = data.filter(item => {
                const partyName = item.PartyName ? item.PartyName.toLowerCase() : "";
                const millName = item.MillName ? item.MillName.toLowerCase() : "";
                return partyName.includes(searchTerm.toLowerCase()) || millName.includes(searchTerm.toLowerCase());
            });
            setPopupContent(filteredData);
            setShowModal(true);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        setEnteredAcCode(purchaseNo);
        setType(Type);
    }, [purchaseNo, Type]);

    const handleMillCodeButtonClick = () => {
        fetchAndOpenPopup();
        if (onAcCodeClick) {
            onAcCodeClick({ enteredAcCode });
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleAcCodeChange = async (event) => {
        const { value } = event.target;
        setEnteredAcCode(value);
        try {
            const response = await axios.get(`${API_URL}/PurcNoFromReturnSale?Company_Code=${CompanyCode}`);
            const data = response.data;
            setPopupContent(data);
            const matchingItem = data.find((item) => item.doc_no === parseInt(value, 10));
            if (matchingItem) {
                setEnteredAcCode(matchingItem.doc_no);
                setType(data.Tran_Type);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleCheckboxChange = (item, checked) => {
        // Don't update popupContent; only manage selected items and totals
        if (checked) {
            // Add the item to selectedItems if it's checked and not already selected
            const alreadyExists = selectedItems.some(selectedItem => selectedItem.doc_no === item.doc_no);
            if (!alreadyExists) {
                setSelectedItems([...selectedItems, item]);
                setTotalQuintal(prevTotal => prevTotal + parseFloat(item.Quantal));
                setTotalBillAmount(prevTotal => prevTotal + parseFloat(item.Bill_Amount));
            }
        } else {
            // Remove the item from selectedItems if unchecked
            const updatedSelectedItems = selectedItems.filter(selectedItem => selectedItem.doc_no !== item.doc_no);
            setSelectedItems(updatedSelectedItems);
            setTotalQuintal(prevTotal => prevTotal - parseFloat(item.Quantal));
            setTotalBillAmount(prevTotal => prevTotal - parseFloat(item.Bill_Amount));
        }
    };

    const fetchSaleBillData = async (purchaNo) => {
        setLoading(true); 
        try {
            const response = await axios.get(`${API_URL}/get-sugarpurchasereturn-by-id?doc_no=${purchaNo}&Company_Code=${CompanyCode}&Year_Code=${Year_Code}`);
            
            console.log("Full API Response:", response.data);
            
            const saleBillHead = response.data.last_head_data;
            const saleBillDetail = response.data.detail_data; 
            const saleBillLabels = response.data.last_labels_data; 
    
            console.log("Sale Bill Head:", saleBillHead);
            console.log("Sale Bill Detail:", saleBillDetail);
            console.log("Sale Bill Labels:", saleBillLabels);
    
            if (Array.isArray(saleBillDetail) && saleBillDetail.length > 0 && Array.isArray(saleBillLabels)) {
                saleBillDetail.forEach((detail, index) => {
                    const label = saleBillLabels[index] || {};
                    const combinedDetail = {
                        ...detail,
                        ...label,
                    };
                    OnSaleBillDetail(combinedDetail);
                    setShowModal(true);  
                });
            } else {
                console.warn("No sale bill details or labels available.");
                OnSaleBillDetail([]);
            }
            
            OnSaleBillHead(saleBillHead);
    
        } catch (error) {
            console.error("Error fetching SaleBill data:", error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleSelectClick = () => {
        if (sugarSaleReturnSale) {
            sugarSaleReturnSale(totalBillAmount, totalQuintal, selectedItems);
        }
        setShowModal(false);
    };

    const handleRecordDoubleClick = (item) => {
        setEnteredAcCode(item.PURCNO);
        setType(item.Tran_Type);
        
        fetchSaleBillData(item.doc_no)
            .then(() => {
                setShowModal(false);
            })
            .catch((error) => {
                console.error("Error during fetch or modal close:", error);
            });
    
        if (onAcCodeClick) {
            onAcCodeClick(item.doc_no, item.Tran_Type);
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
    };

    const filteredData = popupContent.filter(item =>
        item.PartyName && item.PartyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredData.slice(startIndex, endIndex);

      useEffect(() => {
                if (purchaseNo === "") {
                    setEnteredAcCode("");
                } else {
                    setEnteredAcCode(purchaseNo);
                }
            }, [purchaseNo]);
    

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "F1") {
                if (event.target.id === name) {
                    lActiveInputFeild = name;
                    setSearchTerm(event.target.value);
                    fetchAndOpenPopup();
                    event.preventDefault();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [name, fetchAndOpenPopup]);

    useEffect(() => {
        const handleKeyNavigation = (event) => {
            if (showModal) {
                if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setSelectedRowIndex((prev) => Math.max(prev - 1, 0));
                } else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setSelectedRowIndex((prev) => Math.min(prev + 1, itemsToDisplay.length - 1));
                } else if (event.key === "Enter" && selectedRowIndex >= 0) {
                    handleRecordDoubleClick(itemsToDisplay[selectedRowIndex]);
                }
            }
        };

        window.addEventListener("keydown", handleKeyNavigation);
        return () => {
            window.removeEventListener("keydown", handleKeyNavigation);
        };
    }, [showModal, selectedRowIndex, itemsToDisplay]);

    return (
        <div className="d-flex flex-row">
            <div className="d-flex">
                <div className="d-flex">
                    <input
                        type="text"
                        className="form-control ms-2"
                        id={name}
                        autoComplete="off"
                        value={enteredAcCode}
                        onChange={handleAcCodeChange}
                        style={{ width: "100px", height: "35px" }}
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
                    <label id="name" className="form-labels ms-2"  style={{ whiteSpace: 'nowrap',fontSize:"14px",fontWeight:"bold",marginTop:"5px"}}>
                        {type !== '' ? type : Type}
                    </label>
                </div>
            </div>
            <Modal show={showModal} onHide={handleCloseModal} dialogClassName="modal-dialog">
                <Modal.Header closeButton>
                    <Modal.Title>Popup</Modal.Title>
                </Modal.Header>
                <DataTableSearch data={popupContent} onSearch={handleSearch} />
                <Modal.Body>
                    <div className="table-responsive">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                const updatedContent = itemsToDisplay.map(item => ({
                                                    ...item,
                                                    isSelected: checked,
                                                }));
                                                setPopupContent(updatedContent);
                                            }}
                                        />
                                    </th>
                                    <th>Doc_no</th>
                                    <th>Date</th>
                                    <th>Tran Type</th>
                                    <th>Mill Name</th>
                                    <th>Quintal</th>
                                    <th>Party Name</th>
                                    <th>Bill Amount</th>
                                    <th>Year Code</th>
                                    <th>Purchase Id</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itemsToDisplay.map((item, index) => (
                                    <tr
                                        key={index}
                                        className={selectedRowIndex === index ? "selected-row" : ""}
                                        onDoubleClick={() => handleRecordDoubleClick(item)}
                                    >
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.some(selectedItem => selectedItem.doc_no === item.doc_no)}
                                                onChange={(e) => handleCheckboxChange(item, e.target.checked)}
                                            />
                                        </td>
                                        <td>{item.doc_no}</td>
                                        <td>{item.doc_date}</td>
                                        <td>{item.Tran_Type}</td>
                                        <td>{item.MillName}</td>
                                        <td>{item.Quantal}</td>
                                        <td>{item.PartyName}</td>
                                        <td>{item.Bill_Amount}</td>
                                        <td>{item.Year_Code}</td>
                                        <td>{item.prid}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <div>
                        <p>Total Quintal: {totalQuintal}</p>
                        <p>Total Bill Amount: {totalBillAmount}</p>
                    </div>
                    <Button variant="primary" onClick={handleSelectClick}>
                        Select
                    </Button>
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

export default PurcNoFromReturnSaleHelp;
