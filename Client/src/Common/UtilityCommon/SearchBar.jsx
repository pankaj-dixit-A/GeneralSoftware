import React from "react";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";

function SearchBar({ value, onChange, onSearchClick }) {
  return (
    <div className="controls" style={{ display: "flex", justifyContent: "flex-end", margin: "20px" }}>
      <TextField
        id="search"
        variant="outlined"
        value={value}
        onChange={onChange}
        placeholder="Search..."
        autoComplete="off"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={onSearchClick}>
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          ),
          style: {
            borderRadius: "4px",
            height:"80%",
            display: "flex-end"
          },
        }}
        style={{
          width: "50%",
        }}
      />
    </div>
  );
}

export default SearchBar;
