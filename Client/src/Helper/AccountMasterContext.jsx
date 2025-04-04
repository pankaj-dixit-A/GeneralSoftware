import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AccountMasterContext = createContext();

export const AccountMasterProvider = ({ children,hideNavbarPaths }) => {
    const [accountData, setAccountData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [acTypeFilter, setAcTypeFilter] = useState([]);

    const fetchData = async () => {
        
        const CompanyCode = sessionStorage.getItem("Company_Code");
        const API_URL = process.env.REACT_APP_API;

        try {
            const response = await axios.get(`${API_URL}/account_master_all?Company_Code=${CompanyCode}`);
            setAccountData(response.data);
        } catch (error) {
            setError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredAccountData = acTypeFilter.length > 0
        ? accountData.filter(item => acTypeFilter.includes(item.Ac_type))
        : accountData;

    return (
        <AccountMasterContext.Provider value={{ accountData : filteredAccountData , loading, error,hideNavbarPaths,setAcTypeFilter}}>
            {children}
        </AccountMasterContext.Provider>
    );
};

export const useAccountMaster = () => useContext(AccountMasterContext);