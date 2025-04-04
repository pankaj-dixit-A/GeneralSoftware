import React from "react";
import "./Footer.css";

const Footer = () => {
  const Accounting_Year = sessionStorage.getItem("Accounting_Year");
  const Company_Name = sessionStorage.getItem("Company_Name");

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <span className="footer-text">
            Logged in as <span className="highlight-text">{Company_Name}</span>
          </span>
        </div>
        <div className="footer-center">
          <span className="footer-text">
            Financial Year: <span className="highlight-text">{Accounting_Year}</span>
          </span>
        </div>
        <div className="footer-right">
          <span className="footer-text">
            Copyrights © 2025 <span className="highlight-text">JK Sugars & Commodities Pvt Ltd.</span>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;