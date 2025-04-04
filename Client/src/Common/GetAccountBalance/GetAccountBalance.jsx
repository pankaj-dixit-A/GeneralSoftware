import axios from 'axios';

export async function fetchAccountBalance(acCode) {
    const Company_Code = sessionStorage.getItem("Company_Code");
    const Year_Code = sessionStorage.getItem("Year_Code");

    try {
        const response = await axios.get(
            `${process.env.REACT_APP_API}/get_balance`,
            {
                params: {
                    company_code: Company_Code,
                    year_code: Year_Code,
                    ac_code: acCode,
                },
            }
        );

        if (response.data && response.data.Balance !== undefined) {
            return response.data.Balance;
        } else {
            console.log("Data Not Found!");
        }
    } catch (err) {
        // Handle 404 error specifically
        if (err.response && err.response.status === 404) {
            return 0;
        } else {
            console.error("Error fetching balance:", err);
            throw new Error("Error fetching balance.");
        }
    }
}
