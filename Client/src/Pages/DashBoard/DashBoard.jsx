// DashBoard.js
import React from 'react';
import { FaUserPlus, FaTruck, FaMoneyBillWave, FaFileInvoice, FaDatabase, FaShoppingBag, FaReceipt, FaBalanceScale, FaBoxOpen, FaClipboardCheck, FaTruckMoving, FaBook, FaChartBar, FaFileAlt, FaCalendarAlt, FaUsers, FaHandshake, FaFileExcel, FaChartLine, FaBookReader, FaFacebookMessenger } from 'react-icons/fa';
import DashboardButton from '../../Common/Buttons/DashboardButton';
import "./DashBoard.css";

const DashBoard = () => {

  return (
    <>
      <div className="CommonbuttonContainer" style={{ marginTop: "100px" }}>
        <DashboardButton label="Ledger" icon={FaFileAlt} path="/ledger" />
        <DashboardButton label="Receipt Payment" icon={FaReceipt} path="/receipt-payment" />
        <DashboardButton label="UTR Entry" icon={FaMoneyBillWave} path="/utr-entry" />
        <DashboardButton label="Delivery Order" icon={FaTruck} />
        <DashboardButton label="Trial Balance" icon={FaBalanceScale} path="/trial-balance" />
      </div>

      <div className="CommonbuttonContainer">
        <DashboardButton label="Corporate Sale" icon={FaShoppingBag} path="/corporate-sale" />
        <DashboardButton label="Multiple Receipt" icon={FaReceipt} path="/multiple-receipt" />
        <DashboardButton label="Tender Purchase" icon={FaFileInvoice} path="/tender-purchase" />
        <DashboardButton label="Register" icon={FaUserPlus} path="/register" />
        <DashboardButton label="Sugar Balance Stock" icon={FaBoxOpen} path="/sugar-balance-stock" />
      </div>

      <div className="CommonbuttonContainer">
        <DashboardButton label="Dispatch Summary" icon={FaClipboardCheck} path="/dispatch-summary" />
        <DashboardButton label="Transport SMS" icon={FaFacebookMessenger} path="/transport-sms" />
        <DashboardButton label="Stock Book" icon={FaBook} path="/stock-book" />
        <DashboardButton label="Stock Summary" icon={FaBookReader} path="/stock-summary" />
        <DashboardButton label="Grain Purchase Bill" icon={FaFileInvoice} path="/grain-purchase-bill" />
      </div>

      <div className="CommonbuttonContainer">
        <DashboardButton label="Daily Report" icon={FaCalendarAlt} path="/daily-report" />
        <DashboardButton label="Database Backup" icon={FaDatabase} path="/database-backup" />
        <DashboardButton label="Corporate Register" icon={FaUsers} path="/corporate-register" />
        {/* <DashboardButton label="Broker Report" icon={FaHandshake} path="/broker-report" />
        <DashboardButton label="Grain Sale Bill" icon={FaFileExcel} path="/grain-sale-bill" /> */}
        <DashboardButton label="Periodic Sale Report" icon={FaChartLine} path="/periodic-sale-report" />
        <DashboardButton label="Periodic Sale Report" icon={FaChartBar} path="/periodic-sale-report-bar-chart" />
      </div>
    </>
  );
}

export default DashBoard;
