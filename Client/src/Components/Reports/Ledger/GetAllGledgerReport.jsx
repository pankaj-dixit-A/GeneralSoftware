import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import '../../Reports/Ledger/GledgerReport.css';
import * as XLSX from 'xlsx';
import { RingLoader } from "react-spinners";

const GetAllGledgerReport = () => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const Start_Date = sessionStorage.getItem("Start_Date");
  const API_URL = process.env.REACT_APP_API;
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [groupedData, setGroupedData] = useState([])
  const [startDate, setStartDate] = useState("");
  const AccountYear = sessionStorage.getItem('Accounting_Year');
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const acCode = searchParams.get('selectedAccountCodes')
  const navigate = useNavigate();

  useEffect(() => {
    if (AccountYear) {
      const dates = AccountYear.split(' - ');
      if (dates.length === 2) {
        setStartDate(dates[0]);
      }
    }
  }, [AccountYear]);

  const calculateTotals = (data) => {
    const totals = data.reduce(
      (acc, item) => {
        acc.debit += parseFloat(item.Debit_Amount || 0);
        acc.credit += parseFloat(item.Credit_Amount || 0);
        return acc;
      },
      { debit: 0, credit: 0 }
    );
    return totals;
  };

  const [totals, setTotals] = useState({ debit: 0, credit: 0 });

  useEffect(() => {
    const fetchGLedgerReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(
          `${process.env.REACT_APP_API}/MultipleLedger`,
          {
            params: {
              from_date: fromDate,
              to_date: toDate,
              Company_Code: companyCode,
              Year_Code: Year_Code,
              Start_Date: startDate,
              ac_codes: acCode,
            },
          }
        );
        const data = response.data.LedgerData || [];
        setLedgerData(data);
        const grouped = data.reduce((acc, item) => {
          const key = `${item.AC_CODE}-${item.Ac_Name_E}`;
          if (!acc[key]) {
            acc[key] = {
              AC_CODE: item.AC_CODE,
              Ac_Name_E: item.Ac_Name_E,
              transactions: []
            };
          }
          acc[key].transactions.push(item);
          return acc;
        }, {});
        setGroupedData(grouped);
        const totals = calculateTotals(data);
        setTotals(totals);
      } catch (err) {
        setError("Error fetching report data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGLedgerReport();
  }, [acCode, fromDate, toDate]);

  const handleExportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const wsName = "Consolidated Ledger"; 
    const dataForSheet = []; 

    Object.entries(groupedData).forEach(([key, value]) => {
      dataForSheet.push([
        "Account Code:", value.AC_CODE, "Account Name:", value.Ac_Name_E
      ]);
      dataForSheet.push([
        "Tran Type", "Date", "Doc No", "Narration", "Detail Amount", "Debit", "Credit", "Balance", "DRCR"
      ]);

      let totalDebit = 0;
      let totalCredit = 0;
      let lastBalance = 0;

      value.transactions.sort((a, b) => new Date(a.DOC_DATE) - new Date(b.DOC_DATE));

      const openingTransaction = value.transactions.find(t => t.TRAN_TYPE === 'OP');
      if (openingTransaction) {
        dataForSheet.push([
          openingTransaction.TRAN_TYPE,
          openingTransaction.DOC_DATE,
          openingTransaction.DOC_NO,
          openingTransaction.NARRATION,
          "",
          { t: 'n', v: parseFloat(openingTransaction.Debit_Amount || 0).toFixed(2) },
          { t: 'n', v: parseFloat(openingTransaction.Credit_Amount || 0).toFixed(2) },
          { t: 'n', v: parseFloat(openingTransaction.Balance || 0).toFixed(2) },
          openingTransaction.DRCR
        ]);
        lastBalance = Math.abs(parseFloat(openingTransaction.Balance || 0));
      }

      value.transactions.forEach(transaction => {
        if (transaction.TRAN_TYPE !== 'OP') {
          dataForSheet.push([
            transaction.TRAN_TYPE,
            transaction.DOC_DATE,
            transaction.DOC_NO,
            transaction.NARRATION,
            "",
            { t: 'n', v: parseFloat(transaction.Debit_Amount || 0).toFixed(2) },
            { t: 'n', v: parseFloat(transaction.Credit_Amount || 0).toFixed(2) },
            { t: 'n', v: Math.abs(lastBalance += parseFloat(transaction.Debit_Amount || 0) - parseFloat(transaction.Credit_Amount || 0)).toFixed(2) }, // Balance as number
            transaction.DRCR
          ]);
          totalDebit += parseFloat(transaction.Debit_Amount || 0);
          totalCredit += parseFloat(transaction.Credit_Amount || 0);

          if (transaction.detailData && transaction.detailData.length > 0) {
            transaction.detailData.forEach(detail => {
              dataForSheet.push([
                "", "", "", `${detail.Ac_Name_E}: ${detail.NARRATION}`,
                { t: 'n', v: parseFloat(detail.AMOUNT || 0).toFixed(2) }, "", "", "", "", "", ""
              ]);
            });
          }
        }
      });

      dataForSheet.push([
        "Total", "", "", "", "",
        { t: 'n', v: Math.abs(totalDebit.toFixed(2)) },
        { t: 'n', v: Math.abs(totalCredit.toFixed(2)) },
        { t: 'n', v: Math.abs(lastBalance.toFixed(2)) }, ""
      ]);

      dataForSheet.push(["", "", "", "", "", "", ""]);
    });

    const ws = XLSX.utils.aoa_to_sheet(dataForSheet);
    XLSX.utils.book_append_sheet(workbook, ws, wsName);
    const filename = `Ledger_${acCode}_${fromDate}_${toDate}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const handleBack = () => {
    navigate('/ledger');
  };

  const renderLedgerRows = () => {
    const groupedData = ledgerData.reduce((acc, item) => {
      if (!acc[item.AC_CODE]) {
        acc[item.AC_CODE] = { Ac_Name_E: item.Ac_Name_E, transactions: [] };
      }
      acc[item.AC_CODE].transactions.push(item);
      return acc;
    }, {});

    return Object.entries(groupedData).map(([AC_CODE, { Ac_Name_E, transactions }]) => {
      const accountTotals = transactions.reduce(
        (totals, item, index, array) => {
          const debit = parseFloat(item.Debit_Amount || 0);
          const credit = parseFloat(item.Credit_Amount || 0);
          const balance = parseFloat(item.Balance || 0);

          totals.debit += debit;
          totals.credit += credit;

          if (index === array.length - 1) {
            totals.balance = balance;
          }

          return totals;
        },
        { debit: 0, credit: 0, balance: 0 }
      );

      return (
        <div key={AC_CODE}>
          <h3 style={{ fontWeight: 'bold', fontSize: '20px', color: '#333', marginTop: '20px' }}>
            Account Code: <span style={{ color: '#0056b3' }}>{AC_CODE}</span> - {Ac_Name_E}
          </h3>

          <table style={{ marginBottom: "60px" }} id="reportTable">
            <thead>
              <tr style={{ fontWeight: 'bold', textAlign: 'center' }}>
                <th style={{ textAlign: 'center' }}>Trans_Type</th>
                <th style={{ textAlign: 'center' }}>Doc_No</th>
                <th style={{ textAlign: 'center' }}>Doc Date</th>
                <th style={{ textAlign: 'center' }}>Narration</th>
                <th style={{ textAlign: 'center' }}></th>
                <th style={{ textAlign: 'center' }}></th>
                <th style={{ textAlign: 'center' }}></th>
                <th style={{ textAlign: 'center' }}></th>
                <th style={{ textAlign: 'center' }}></th>
                <th style={{ textAlign: 'center' }}></th>
                <th style={{ textAlign: 'center' }}></th>
                <th style={{ textAlign: 'center' }}></th>
                <th style={{ textAlign: 'center' }}></th>
                <th style={{ textAlign: 'center' }}>Debit</th>
                <th style={{ textAlign: 'center' }}>Credit</th>
                <th style={{ textAlign: 'center' }}>Balance</th>
                <th style={{ textAlign: 'center' }}>DRCR</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item, idx) => (
                <React.Fragment key={idx}>
                  <tr style={{
                    fontWeight: item.TRAN_TYPE === 'OP' ? 'normal' : 'bold',
                    color: item.TRAN_TYPE === 'OP' ? 'green' : 'blue',
                    backgroundColor: item.TRAN_TYPE === 'OP' ? '#ffebee' : '#e0f7fa',
                  }}>
                    <td>{item.TRAN_TYPE}</td>
                    <td>{item.DOC_NO}</td>
                    <td>{item.DOC_DATE}</td>
                    <td>{item.NARRATION}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td style={{ textAlign: 'right' }}>{parseFloat(item.Debit_Amount || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{parseFloat(item.Credit_Amount || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{item.Balance}</td>
                    <td>{item.DRCR}</td>
                  </tr>

                  {item.detailData && item.detailData.length > 0 && item.detailData.map((detail, idx) => (
                    <tr key={idx} style={{ color: 'grey' }}>
                      <td colSpan="4" style={{
                        paddingLeft: "100px",
                        wordWrap: "break-word"
                      }}>{`${detail.Ac_Name_E}: ${detail.NARRATION}`}</td>
                      <td colSpan="10" style={{ textAlign: 'left' }}>{parseFloat(detail.AMOUNT || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'left' }}></td>
                      <td style={{ textAlign: 'left' }}>{detail.Balance}</td>
                      <td>{""}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              <tr style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>
                <td colSpan="4" style={{ textAlign: 'right' }}>Total:</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td style={{ textAlign: 'right' }}>{accountTotals.debit.toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>{accountTotals.credit.toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>{accountTotals.balance.toFixed(2)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    });
  };

  return (
    <div className="ledger-report-container">
      <div className="col-auto">
        <button className="btn btn-secondary me-2">PDF</button>
        <button className="btn btn-success" onClick={handleExportToExcel}>Export to Excel</button>
        <button className="btn btn-warning ms-2" onClick={handleBack}>Back</button>
      </div>

      <div>
        <p><strong>From Date: {fromDate} To Date: {toDate}</strong></p>
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <RingLoader />
        </div>
      )}
      {error && <p className="error-message">{error}</p>}

      {renderLedgerRows()}
    </div>
  );
};

export default GetAllGledgerReport;
