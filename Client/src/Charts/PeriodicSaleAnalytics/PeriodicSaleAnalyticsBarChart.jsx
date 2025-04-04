import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LabelList,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Grid, TextField, Button, Box } from "@mui/material";
import BackButton from "../../Common/Buttons/BackButton";
import RefreshIcon from "@mui/icons-material/Refresh";

const API_URL = process.env.REACT_APP_API;

const PeriodicSaleAnalyticsBarChart = () => {
  const [data, setData] = useState([]);
  const [totalSale, setTotalSale] = useState(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isClicked, setIsClicked] = useState(false);

  const navigate = useNavigate();
  const colors = [
    "#5a6268",
    "#007bff",
    "#28a745",
    "#ffc107",
    "#17a2b8",
    "#6f42c1",
    "#dc3545",
    "#20c997",
    "#fd7e14",
    "#6610f2",
    "#e83e8c",
    "#343a40",
  ];

  const getEndOfMonth = (dateStr) => {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d.toISOString().split("T")[0];
  };

  const loadChartData = async (start, end) => {
    try {
      const resp = await axios.get(`${API_URL}/get-periodic-sale-dates`, {
        params: { start_date_str: start, end_date_str: end },
      });
      if (resp.status === 200) {
        const res = await axios.get(`${API_URL}/get-periodic-sale-data`, {
          params: { start_date_str: start, end_date_str: end },
        });

        const json = res.data;

        if (!Array.isArray(json) || json.length === 0) {
          alert("No data returned from /get-periodic-sale-data!");
          setData([]);
          setTotalSale(0);
          return;
        }

        const monthMap = new Map();
        json.forEach((row) => {
          const monthKey = row.Doc_date.slice(0, 7);
          if (!monthMap.has(monthKey)) {
            monthMap.set(monthKey, +row.monthlysale);
          }
        });

        // Format data with color assignment
        const formatted = Array.from(monthMap.entries()).map(
          ([key, value], index) => ({
            date: key,
            monthlysale: value,
            fill: colors[index % colors.length],
          })
        );

        setData(formatted);

        const total = formatted.reduce(
          (sum, item) => sum + item.monthlysale,
          0
        );
        setTotalSale(total);
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };

  useEffect(() => {
    const currentDate = new Date().toISOString().split("T")[0];
    setFromDate(currentDate);
    setToDate(currentDate);

    const start = currentDate;
    const end = getEndOfMonth(currentDate);
    loadChartData(start, end);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const start = fromDate;
    const end = getEndOfMonth(toDate);
    setIsClicked(true);
    loadChartData(start, end);
  };

  const handlePrint = () => {
    const printContent = document.getElementById("charData").outerHTML;
    const win = window.open("", "", "height=700,width=900");
    win.document.write("<html><head><title>Print Chart</title></head><body>");
    win.document.write(printContent);
    win.document.write(
      `<div style='margin-top: 20px; font-size: 16px;'><strong>Total Monthly Sale:</strong> ${totalSale} Qntl</div>`
    );
    win.document.write("</body></html>");
    win.document.close();
    win.print();
  };

  const handleBack = () => {
    navigate("/DashBoard");
  };

  return (
    <div
      style={{
        fontFamily: "Segoe UI",
        padding: "1.5rem",
        backgroundColor: "#f8f9fa",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{ marginBottom: "1.5rem", width: "100%", maxWidth: "100%" }}
      >
        <Box
          sx={{
            backgroundColor: "#fff",
            padding: 3,
            borderRadius: 2,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Grid container spacing={1} alignItems="flex-end">
            <Grid item xs={12} sm={1}>
              <TextField
                label="From Date"
                type="date"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={1}>
              <TextField
                label="To Date"
                type="date"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={0.2} mb={1}>
              <Button
                variant="contained"
                fullWidth
                type="submit"
                sx={{
                  backgroundColor: isClicked ? "#b72a0d" : "#b72a0d",
                  "&:hover": {
                    backgroundColor: isClicked ? "#b72a0d" : "#b72a0d",
                  },
                  fontWeight: "bold",
                }}
              >
                <RefreshIcon />
              </Button>
            </Grid>

            <Grid item xs />

            <Grid item xs={12} sm={2} display="flex" justifyContent="flex-end">
              <BackButton onClick={handleBack} />
            </Grid>
          </Grid>
        </Box>
      </form>

      <div
        id="charData"
        style={{
          backgroundColor: "#fff",
          padding: "1rem",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          marginBottom: "1.5rem",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <ResponsiveContainer width="100%" height={620}>
          <BarChart data={data}>
            <XAxis dataKey="date" tick={{ fontSize: 14 }} />
            <YAxis tick={{ fontSize: 14 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="monthlysale">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList dataKey="monthlysale" position="top" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.5rem 1rem",
          backgroundColor: "#e9ecef",
          borderRadius: "6px",
          fontSize: "16px",
          fontWeight: "500",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <div>Total Monthly Sale : {totalSale} Quintal</div>
        <button
          onClick={handlePrint}
          style={{
            padding: "8px 14px",
            backgroundColor: "#6c757d",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Print Chart
        </button>
      </div>
    </div>
  );
};

export default PeriodicSaleAnalyticsBarChart;
