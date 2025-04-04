import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  TextField,
  Button,
  Stack,
  CircularProgress,
  Typography,
  Box,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from "recharts";
import BackButton from "../../Common/Buttons/BackButton";
import RefreshIcon from "@mui/icons-material/Refresh";

const API_URL = process.env.REACT_APP_API;

const PeriodicSaleAnalyticsLineChart = () => {
  const today = new Date();
  const formattedToday = today.toISOString().split("T")[0];

  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(formattedToday);
  const [endDate, setEndDate] = useState(formattedToday);
  const [loading, setLoading] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const navigate = useNavigate();

  const handleFetchData = async () => {
    setIsClicked(true);
    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date cannot be later than the end date.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const datesResponse = await axios.get(
        `${API_URL}/get-periodic-sale-dates`,
        {
          params: { start_date_str: startDate, end_date_str: endDate },
        }
      );

      if (datesResponse.status === 200) {
        const dataResponse = await axios.get(
          `${API_URL}/get-periodic-sale-data`,
          {
            params: { start_date_str: startDate, end_date_str: endDate },
          }
        );

        if (dataResponse.data && dataResponse.data.length > 0) {
          setData(dataResponse.data);
          setError(null);
        } else {
          console.log("No data available for the selected date range.");
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDataForChart = () => {
    if (data && data.length > 0) {
      const formattedData = data
        .map((item) => ({
          date: new Date(item.Doc_date),
          dayqntl: parseFloat(item.dayqntl),
          average: parseFloat(item.average),
          target: parseFloat(item.target), // Assuming there's a target field
        }))
        .filter(
          (item) => item.dayqntl > 0 && item.average > 0 && item.target > 0
        );

      return formattedData;
    }
    return [];
  };

  const formattedChartData = formatDataForChart();

  useEffect(() => {
    if (formattedChartData.length === 0) {
      console.log("No valid data available for the chart.");
    }
  }, [formattedChartData]);

  const handleBack = () => {
    navigate("/DashBoard");
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom style={{ marginTop: "20px" }}>
        Analysis Of Sales
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          mb: 2,
        }}
      >
        <Stack direction="row" spacing={2}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 200 }}
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 200 }}
          />
          <Button
            variant="contained"
            color="secondary"
            onClick={handleFetchData}
            disabled={loading}
            style={{ height: "40px", marginTop: "5px" }}
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
        </Stack>

        {/* Back button on the right end */}
        <Box>
          <BackButton onClick={handleBack} />
        </Box>
      </Box>
      {loading && <CircularProgress />}

      {error && <div style={{ color: "red" }}>{error}</div>}

      {formattedChartData && formattedChartData.length > 0 && (
        <ResponsiveContainer width="100%" height={700}>
          <LineChart data={formattedChartData}>
            <CartesianGrid stroke="#444" strokeDasharray="5 5" />
            <XAxis
              dataKey="date"
              tickFormatter={(tick) => tick.toLocaleDateString()}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[0, "dataMax"]}
              tickCount={10} // Fixed gap of 10
              tickFormatter={(tick) => tick}
              interval="preserveStartEnd"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
              formatter={(value) => value.toFixed(2)}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="dayqntl"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="average"
              stroke="#82ca9d"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#ff7300"
              dot={false}
            />
            <Brush
              dataKey="date"
              height={30}
              stroke="#8884d8"
              startIndex={0}
              endIndex={10}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default PeriodicSaleAnalyticsLineChart;
