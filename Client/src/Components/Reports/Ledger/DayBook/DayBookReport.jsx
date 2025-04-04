import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { Card, CardContent, Typography, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Button } from "@mui/material";
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
import { formatDate } from "../../../../Common/FormatFunctions/FormatDate";
import "jspdf-autotable";

const DayBookReport = () => {
  const [groupedLedgerData, setGroupedLedgerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({ debit: 0, credit: 0 });
  const Company_Name = sessionStorage.getItem("Company_Name");
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  const companyCode = sessionStorage.getItem("Company_Code");
  const yearCode = sessionStorage.getItem("Year_Code");

  useEffect(() => {
    const fetchDayBookReport = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API}/get_DayBook`, {
          params: { from_date: fromDate, to_date: toDate, company_code: companyCode, year_code: yearCode },
        });
        const data = response.data.Day_Book || [];
        const groupedData = data.reduce((acc, item) => {
          const date = item.DOC_DATE;
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(item);
          return acc;
        }, {});

        setGroupedLedgerData(groupedData);
        const overallTotals = data.reduce(
          (acc, item) => {
            acc.debit += parseFloat(item.debit || 0);
            acc.credit += parseFloat(item.credit || 0);
            return acc;
          },
          { debit: 0, credit: 0 }
        );
        setTotals(overallTotals);

      } catch (err) {
        console.error("Error fetching report data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDayBookReport();
  }, [fromDate, toDate, companyCode, yearCode]);

  const printReport = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Day Book Report</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; border: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
            .total { background-color: #ffff99; }
            .overall-total { background-color: #e0e0e0; }
          </style>
        </head>
        <body>
          <h2 style="text-align:center;margin-bottom:-10px;">${Company_Name} </h2>
          <h4 style="text-align:center;gap:5px">Day Book Report</h4>
          <p style="text-align:center;gap:5px;"><strong>From:</strong> ${formatDate(fromDate)} <strong>To:</strong> ${formatDate(toDate)}</p>
          <table>
            <thead>
              <tr>
                <th style="font-size:10px; text-align:center;">Tran Type</th>
                <th style="font-size:10px; text-align:center;">Doc No</th>
                <th style="font-size:10px; text-align:center;">Date</th>
                <th style="font-size:10px; text-align:center;">Ac Code</th>
                <th style="font-size:10px; text-align:center;">Account Name / Narration</th>
                <th style="font-size:10px; text-align:center;">Debit</th>
                <th style="font-size:10px; text-align:center;">Credit</th>
              </tr>
            </thead>
            <tbody>
              ${Object.keys(groupedLedgerData).map(date => `
                <tr><td colspan="7" style="text-align:center; background-color: #e0e0e0; ">${formatDate(date)}</td></tr>
                ${groupedLedgerData[date].map(item => `
                  <tr>
                    <td style="font-size:10px;">${item.TRAN_TYPE}</td>
                    <td style="font-size:10px;">${item.DOC_NO}</td>
                    <td style="font-size:10px;">${formatDate(item.DOC_DATE)}</td>
                    <td style="font-size:10px;">${item.AC_CODE}</td>
                    <td style="font-size:10px;">${item.Ac_Name_E} ${item.NARRATION}</td>
                    <td style="font-size:10px;text-align:right;">${formatReadableAmount(item.debit)}</td>
                    <td style="font-size:10px;text-align:right;">${formatReadableAmount(item.credit)}</td>
                  </tr>
                `).join('')}
                <tr class="total">
                  <td colspan="5" style="font-size:12px;text-align:right;fontWeight:bold;">Total</td>
                  <td style="font-size:10px;text-align:right;">${formatReadableAmount(groupedLedgerData[date].reduce((sum, item) => sum + parseFloat(item.debit || 0), 0))}</td>
                  <td style="font-size:10px;text-align:right;">${formatReadableAmount(groupedLedgerData[date].reduce((sum, item) => sum + parseFloat(item.credit || 0), 0))}</td>
                </tr>
              `).join('')}
             
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h4" gutterBottom sx={{ color: 'blue' }}>
          {Company_Name}
        </Typography>
        <Typography variant="h5" gutterBottom>
          Day Book Report
        </Typography>
        <Button variant="contained" color="secondary" onClick={printReport} style={{ float: "right",marginBottom:"10px" }}>Print Report</Button>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
            <CircularProgress />
          </div>
        ) : (
          <>
           
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tran Type</TableCell>
                    <TableCell>Doc No</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Ac Code</TableCell>
                    <TableCell>Account Name / Narration</TableCell>
                    <TableCell align="right">Debit</TableCell>
                    <TableCell align="right">Credit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.keys(groupedLedgerData).map((date, index) => (
                    <React.Fragment key={index}>
                      <TableRow sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold"}}>
                        <TableCell colSpan={7} sx={{ padding: "4px", textAlign: "center",fontSize: "18px",marginTop: "30px",fontWeight: "bold"  }}>{formatDate(date)}</TableCell>
                      </TableRow>
                      {groupedLedgerData[date].map((item, itemIndex) => (
                        <TableRow key={itemIndex}>
                          <TableCell sx={{ padding: '4px' }}>{item.TRAN_TYPE}</TableCell>
                          <TableCell sx={{ padding: '4px' }}>{item.DOC_NO}</TableCell>
                          <TableCell sx={{ padding: '4px' }}>{formatDate(item.DOC_DATE)}</TableCell>
                          <TableCell sx={{ padding: '4px' }}>{item.AC_CODE}</TableCell>
                          <TableCell sx={{ padding: '4px' }}>
                            <div>{item.Ac_Name_E}</div>
                            <div style={{ marginTop: '4px' }}>{item.NARRATION}</div>
                          </TableCell>
                          <TableCell align="right" sx={{ padding: '4px' }}>
                            {formatReadableAmount(item.debit)}
                          </TableCell>
                          <TableCell align="right" sx={{ padding: '4px' }}>
                            {formatReadableAmount(item.credit)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ backgroundColor: "yellow", fontWeight: "bold" }}>
                        <TableCell colSpan={5} align="right">Total</TableCell>
                        <TableCell align="right">
                          {formatReadableAmount(groupedLedgerData[date].reduce((sum, item) => sum + parseFloat(item.debit || 0), 0))}
                        </TableCell>
                        <TableCell align="right">
                          {formatReadableAmount(groupedLedgerData[date].reduce((sum, item) => sum + parseFloat(item.credit || 0), 0))}
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                  <TableRow sx={{ backgroundColor: "#d0d0d0", fontWeight: "bold" }}>
                    <TableCell colSpan={5} align="right">Overall Total</TableCell>
                    <TableCell align="right">{formatReadableAmount(totals.debit)}</TableCell>
                    <TableCell align="right">{formatReadableAmount(totals.credit)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DayBookReport;
