import React, { useState } from "react";

function DataTableSearch({ data, onSearch }) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    onSearch(event.target.value);
  };

  const inputStyle = {
    height: "40px",
    fontSize: "16px",
    width: "50%",
    padding: "8px 12px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
    margin: "0 auto",
    display: "block",
  };

  const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  };

  return (
    <div className="container my-3" style={containerStyle}>
      <div className="input-group">
        <input
          type="text"
          placeholder="Search..."
          autoComplete="off"
          style={inputStyle}
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
    </div>
  );
}

export default DataTableSearch;