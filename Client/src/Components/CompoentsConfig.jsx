// routesConfig.js
import CompanyUtility from '../Components/Company/CreateCompany/CompanyUtility';
import CreateCompany from "../Components/Company/CreateCompany/CreateCompany";
import SelectCompany from './Company/CreateCompany/SelectCompany';
import CreateAccountYearData from './Company/AccountingYear/CreateAccountingYear';
import SelectAccoungYear from './Company/AccountingYear/SelectAccountingYear';
import FinicialGroupsUtility from "./Master/AccountInformation/FinicialMasters/FinicialMasterUtility"
import FinicialMaster from "./Master/AccountInformation/FinicialMasters/FinicialMaster"
import GstStateMasterUtility from "./Master//OtherMasters/GSTStateMaster/GstStateMasterUtility"
import GstStateMaster from "./Master/OtherMasters/GSTStateMaster/GstStateMaster"
import CityMasterUtility from "./Master/AccountInformation/CityMaster/CityMasterUtility";
import CityMaster from "./Master/AccountInformation/CityMaster/CityMaster"
import BrandMasterUtility from "./Master/OtherMasters/BrandMaster/BrandMasterUtility";
import BrandMaster from "./Master/OtherMasters/BrandMaster/BrandMaster"
import GSTRateMasterUtility from "./Master/OtherMasters/GSTRateMaster/GSTRateMasterUtility"
import GSTRateMaster from './Master/OtherMasters/GSTRateMaster/GSTRateMaster';
import OtherPurchase from './Transactions/OtherPurchase/OtherPurchase';
import DeliveryOrderUtility from './BusinessRelated/DeliveryOrder/DeliveryOrderUtility';
import DeliveryOrder from './BusinessRelated/DeliveryOrder/DeliveryOrder';
import SystemMasterUtility from './Master/OtherMasters/SystemMaster/SystemMasterUtility';
import SystemMaster from './Master/OtherMasters/SystemMaster/SystemMaster';
import OtherPurchaseUtility from './Transactions/OtherPurchase/OtherPurchaseUtility';
import TenderPurchaseUtility from './BusinessRelated/TenderPurchase/TenderPurchaseUtility';
import DebitCreditNoteUtility from './Transactions/DebitCreditNote/DebitCreditNoteUtility';
import DebitCreditNote from './Transactions/DebitCreditNote/DebitCreditNote';
import PurchaseBillUtility from './Inword/SugarPurchase/SugarPurchaseBillUtility';
import SugarPurchase from './Inword/SugarPurchase/SugarPurchase';
import SaleBillUtility from './Outward/SaleBill/SaleBillUtility';
import SaleBill from './Outward/SaleBill/SaleBill';
import CommissionBill from './Outward/CommissionBill/CommissionBill';
import CommissionBillUtility from './Outward/CommissionBill/CommissionBillUtility';
import OtherGSTInput from './Inword/OtherGSTInput/OtherGSTInput';
import OtherGSTInputUtility from './Inword/OtherGSTInput/OtherGSTInputUtility'
import PartyUnitMaster from './Master/AccountInformation/PartyUnitMaster/PartyUnitMaster'
import PartyUnitMasterUtility from './Master/AccountInformation/PartyUnitMaster/PartyUnitMasterUtility';
import PaymentNote from './Transactions/PaymentNote/PaymentNote';
import PaymentNoteUtility from './Transactions/PaymentNote/PaymentNoteUtility';
import WhatsAppURLManager from './Master/WhatsAppAPIIntegration/WhatsAppURLManager';
import CompanyPrintingInfo from './Utilities/CompanyPrintingInformation/CompanyPrintingInfo';
import PostDateManager from './Utilities/PostDate/PostDate';
import CompanyParameters from './Master/CompanyParamter/CompanyParameters';
import AccountMaster from './Master/AccountInformation/AccountMaster/AccountMaster';
import AccountMasterUtility from './Master/AccountInformation/AccountMaster/AccountMasterUtility';
import EBuySugarianUserUtility from './EBuySugarian/EBuySugarinUser/EBuySugarianUserUtility';
import EBuySugarAccountMasterUtility from './EBuySugarian/EBuySugarinUser/EBuySugarAccountMasterUtility';
import DeliveryOredrUtility from './BusinessRelated/DeliveryOrder/DeliveryOrderUtility';
import SugarSaleReturnPurchase from './Inword/SugarSaleReturnPurchase/SugarSaleReturnPurchase';
import SugarSaleReturnPurchaseUtility from './Inword/SugarSaleReturnPurchase/SugarSaleReturnPurchaseUtility';
import TenderPurchase from './BusinessRelated/TenderPurchase/TenderPurchase';
import SugarSaleReturnSale from './Outward/SugarSaleReturnSale/SugarSaleReturnSale';
import PendingDO from './BusinessRelated/DeliveryOrder/PendingDOUtility'
import ServiceBill from './Outward/ServiceBill/ServiceBill'
import ServiceBillUtility from './Outward/ServiceBill/ServiceBillUtility'
import UserCreationWithPermission from './Utilities/UserCreationWithPermission/UserCreationWithPermission.jsx';
import Letter from './BusinessRelated/Letter/Letter.jsx';
import LetterUtility from './BusinessRelated/Letter/LetterUtility.jsx';
import UTREntryUtility from './Transactions/UTR/UTREntryUtility.jsx'
import UTREntry from './Transactions/UTR/UTREntry.jsx';
import RecieptPayment from './Transactions/RecieptPayment/RecieptPayment.jsx'
import JournalVoucher from './Transactions/JournalVoucher/JournalVoucher.jsx'
import SugarSaleReturnSaleUtility from './Outward/SugarSaleReturnSale/SugarSaleReturnSaleUtility.jsx';
import RecieptPaymentUtility from './Transactions/RecieptPayment/RecieptPaymentUtility';
import JournalVoucher_Utility from './Transactions/JournalVoucher/JournalVoucher_Utility';
import Ledger from './Reports/Ledger/Ledger.jsx';
import GledgerReport from './Reports/Ledger/GledgerReport.jsx'
import AllGledgerReport from "./Reports/Ledger/GetAllGledgerReport.jsx"

import PendingReports from './Reports/PendingReports/PendingReports.jsx';
import TrialBalance from './Reports/TrialBalance/TrialBalance.jsx'
import TenderReports from "./Reports/PendingReports/TenderReports.jsx";
import UTRDetailReport from "./Reports/PendingReports/UTRDetailReport.jsx";
import UserCreationWithPermissionUtility from './Utilities/UserCreationWithPermission/UserCreationWithPermissionUtility.jsx';

import GSTUtilitiesForm from './GSTUtilities/GstUtilities';
import UserRegistrationForm from './UserRegistration/UserRegistrationForm.jsx';
import BalanceStockReport from './BusinessRelated/StockReport/BalanceStockReport/BalanceStockReport.jsx';
import MillWiseLiftingWise from './BusinessRelated/StockReport/BalanceStockReport/MillWiseLiftingWise.jsx';
import SelfStockReport from './BusinessRelated/StockReport/BalanceStockReport/SelfStockReport.jsx';
import ProfitNLoss from './BusinessRelated/StockReport/ProfitNLossReport/ProfitNLoss.jsx';
import ProfitNLossReport from './BusinessRelated/StockReport/ProfitNLossReport/ProfitNLossReport.jsx';

import TrialBalanceReport from './Reports/TrialBalance/TrialBalanceReport.jsx';
import TrialBalanceDetailReport from './Reports/TrialBalance/TrialBalanceDetialReport.jsx';
import DaywiseTrialBalanceReport from './Reports/TrialBalance/DaywiseTrialBalance.jsx';
import JVReport from './Reports/TrialBalance/JVReport.jsx';
import BankBook from './Reports/Ledger/BankBook/BankBook.jsx';
import BankBookReport from './Reports/Ledger/BankBook/BankBookReport.jsx';
import AccountMasterPrint from './Reports/Ledger/AccountMasterPrint/AccountMasterPrint.jsx';
import AccountMasterPrintReport from './Reports/Ledger/AccountMasterPrint/AccountMasterPrintReport.jsx';
import InterestStatement from './Reports/Ledger/InterestStatement/InterestStatement.jsx';
import InterestStatementReport from './Reports/Ledger/InterestStatement/InterestStatementReport.jsx';
import StockBookDetail from './Reports/StockBookDetail/StockBookDetail.jsx';
import StockBookReport from './Reports/StockBookDetail/StockBookReport.jsx';
import StockReportDetail from './Reports/StockBookDetail/StockBookDetailReport.jsx';
import RetailDetailReport from './Reports/StockBookDetail/RetailDetailReport.jsx';
import Register from './BusinessRelated/StockReport/Register/Register.jsx';
import DispatchDetailsReport from './BusinessRelated/StockReport/Register/DisptachDetailReport.jsx';
import ProfitLoss from './Reports/ProfitLossBalanceSheet/ProfitLoss.jsx'
import ProfitLossreport from './Reports/ProfitLossBalanceSheet/ProfitLossReport.jsx'
import UTRReportSummary from './Reports/PendingReports/UTRReportSummary.jsx';
import MillPaymentSummary from './Reports/PendingReports/MillPaymentSummary.jsx';
import DuePaymentSummary from './Reports/PendingReports/DuePaymentSummary.jsx';
import SaudaSummary from './Reports/PendingReports/SaudaSummary.jsx'
import BalancesheetReport from './Reports/ProfitLossBalanceSheet/BalancesheetReport.jsx'
import MultipleLedger from './Reports/MultipleLedger/MultipleLedger.jsx'
import DayBookReport from './Reports/Ledger/DayBook/DayBookReport.jsx'
import DayBook from './Reports/Ledger/DayBook/DayBook.jsx'

//Reports -> Purchase Register Report
import PurchaseSaleRegister from './Reports/PurchaseSaleRegister/PurchaseSaleRegister.jsx';
import SaleTDSRegister from './Reports/PurchaseSaleRegister/SaleTDSRegister.jsx';
import SaleTDSPartWiseRegister from './Reports/PurchaseSaleRegister/SaleTDSpartywiseRegister.jsx';
import SaleTCSRegister from './Reports/PurchaseSaleRegister/SaleTCSRegister.jsx';
import SaleTCSPartWiseRegister from './Reports/PurchaseSaleRegister/SaleTCSpartywiseRegister.jsx';
import PurchaseTCSPartWiseRegister from './Reports/PurchaseSaleRegister/PurchaseTCSPartywiseRegister.jsx';
import PurchaseTCSRegister from './Reports/PurchaseSaleRegister/PurchaseTCSRegister.jsx';
import PurchaseTDSRegister from './Reports/PurchaseSaleRegister/PurchaseTDSRegister.jsx';
import PurchaseTDSPartywiseRegister from './Reports/PurchaseSaleRegister/PurchaseTDSPartyWiseRegiter.jsx';
import PurchaseRegister from './Reports/PurchaseSaleRegister/PurchaseRegister.jsx';
import SaleRegister from './Reports/PurchaseSaleRegister/SaleRegister.jsx';
import PurchaseReturnRegister from './Reports/PurchaseSaleRegister/SugarPurchaseReturnRegister.jsx';
import SaleReturnSaleRegister from './Reports/PurchaseSaleRegister/SugarSaleReturnSale.jsx';
import MillSaleReport from './Reports/PurchaseSaleRegister/MillSaleReport.jsx';
import SaleMonthWise from './Reports/PurchaseSaleRegister/SaleMonthWise.jsx';
import PurchaseMonthWise from './Reports/PurchaseSaleRegister/PurchaseMonthWise.jsx';
import RCMRegister from './Reports/PurchaseSaleRegister/RCMRegister.jsx';


//Online Rack Railway
import RackMillInfoUtility from './OnlineRailwayRackBuy/RackMillInfo/RackMillInfoUtility.jsx';
import RackMillInfo from './OnlineRailwayRackBuy/RackMillInfo/RackMillInfo.jsx';
import RackRailwaystationMasterUtility from './OnlineRailwayRackBuy/RackRailwaystationMaster/RackRailwaystationMasterUtility.jsx';
import RackRailwaystationMaster from './OnlineRailwayRackBuy/RackRailwaystationMaster/RackRailwaystationMaster.jsx';
import RackLinkrailwaystationUtility from './OnlineRailwayRackBuy/RackLinkrailwaystation/RackLinkrailwaystationUtility.jsx';
import RackLinkrailwaystation from './OnlineRailwayRackBuy/RackLinkrailwaystation/RackLinkrailwaystation.jsx';
import RackFromToRailwayStationRateUtility from './OnlineRailwayRackBuy/RackFromToRailwayStationRate/RackFromToRailwayStationRateUtility.jsx';
import RackFromToRailwayStationRate from './OnlineRailwayRackBuy/RackFromToRailwayStationRate/RackFromToRailwayStationRate.jsx';
import RackRailwayMillRateReport from './OnlineRailwayRackBuy/Reports/RackRailwayMillRate/RackRailwayMillRateReport.jsx';
import MillRateReportTable from './OnlineRailwayRackBuy/Reports/RackRailwayMillRate/MillRateInfoReport.jsx';

//Analytics
import PeriodicSaleAnalyticsLineChart from '../Charts/PeriodicSaleAnalytics/PeriodicSaleAnalyticsLineChart.jsx';
import PeriodicSaleAnalyticsBarChart from '../Charts/PeriodicSaleAnalytics/PeriodicSaleAnalyticsBarChart.jsx';


const routes = [
  {
    path: '/create-utility',
    element: CompanyUtility
  },
  {
    path: '/create-company',
    element: CreateCompany
  },
  {
    path: '/select-company',
    element: SelectCompany
  },
  {
    path: '/create-accounting-year',
    element: CreateAccountYearData
  },
  {
    path: '/select-accounting-year',
    element: SelectAccoungYear
  },
  {
    path: '/financial-groups-utility',
    element: FinicialGroupsUtility
  },
  {
    path: '/financial-groups',
    element: FinicialMaster
  },
  //GST StateMaster Routes
  {
    path: '/gst-state-master-utility',
    element: GstStateMasterUtility
  },
  {
    path: '/gst-state-master',
    element: GstStateMaster
  },
  {
    path: '/city-master-utility',
    element: CityMasterUtility
  },
  {
    path: '/city-master',
    element: CityMaster
  },
  {
    path: '/brand-master-utility',
    element: BrandMasterUtility
  },
  {
    path: '/brand-master',
    element: BrandMaster
  },
  {
    path: '/gst-rate-masterutility',
    element: GSTRateMasterUtility
  },
  {
    path: '/gst-ratemaster',
    element: GSTRateMaster
  },
  {

    path: '/other-purchaseutility',
    element: OtherPurchaseUtility
  },
  {

    path: '/other-purchase',
    element: OtherPurchase
  },
  {
    path: '/delivery-order-utility',
    element: DeliveryOrderUtility
  },
  {
    path: '/delivery-order',
    element: DeliveryOrder
  },
  {
    path: '/syetem-masterutility',
    element: SystemMasterUtility
  },
  {
    path: '/syetem-master',
    element: SystemMaster
  },
  //Tender Routes
  {
    path: '/tender-purchaseutility',
    element: TenderPurchaseUtility
  },
  {
    path: '/tender_head',
    element: TenderPurchase

  },
  //Debit Credit Note Routes
  {
    path: '/debitcreditnote-utility',
    element: DebitCreditNoteUtility
  },
  {
    path: '/debitcreditnote',
    element: DebitCreditNote
  },
  //purchase bill
  {
    path: '/sugarpurchasebill-utility',
    element: PurchaseBillUtility
  },
  {
    path: '/sugarpurchasebill',
    element: SugarPurchase
  },

  //SaleBill
  {
    path: '/sale-bill',
    element: SaleBill
  },
  {
    path: '/SaleBill-utility',
    element: SaleBillUtility
  },

  //CommissionBill
  {
    path: '/commission-bill',
    element: CommissionBill
  },

  {
    path: '/CommissionBill-utility',
    element: CommissionBillUtility
  },

  //ServiceBill
  {
    path: '/service-bill',
    element: ServiceBill
  },

  //OtherGSTInput
  {
    path: '/other-gst-input',
    element: OtherGSTInput
  },
  {
    path: '/OtherGSTInput-utility',
    element: OtherGSTInputUtility
  },
  //Party Unit Master
  {
    path: '/corporate-customer-limit',
    element: PartyUnitMaster
  },
  {
    path: '/PartyUnitMaster-utility',
    element: PartyUnitMasterUtility
  },
  //PaymentNote
  {
    path: '/payment-note',
    element: PaymentNote
  },
  {
    path: '/PaymentNote-utility',
    element: PaymentNoteUtility
  },
  //WhatsApp API Integration
  {
    path: '/whatsapp-api',
    element: WhatsAppURLManager
  },
  //Our Office Address
  {
    path: '/our-office-address',
    element: CompanyPrintingInfo
  },
  //Post Date
  {
    path: '/post-date',
    element: PostDateManager
  },

  //Company Parameters
  {
    path: '/company-parameter',
    element: CompanyParameters
  },
  //Account Master
  {
    path: '/account-master',
    element: AccountMaster
  },
  {
    path: '/AccountMaster-utility',
    element: AccountMasterUtility
  },
  //Delivery Order
  {
    path: '/delivery-order',
    element: DeliveryOrder
  },
  {
    path: '/delivery-order-utility',
    element: DeliveryOredrUtility
  },

  //Pending DO
  {
    path: '/pending-do',
    element: PendingDO
  },
  {
    path: '/sugar-sale-return-purchase',
    element: SugarSaleReturnPurchase
  },
  {
    path: '/sugar-sale-return-purchase-utility',
    element: SugarSaleReturnPurchaseUtility
  },

  //SugarSaleReturnSale

  {
    path: '/sugar-sale-return-sale-utility',
    element: SugarSaleReturnSaleUtility
  },
  {
    path: '/sugar-sale-return-sale',
    element: SugarSaleReturnSale
  },

  //ServiceBill Utility
  {
    path: '/ServiceBill-utility',
    element: ServiceBillUtility
  },

  //ServiceBill
  {
    path: '/service-bill',
    element: ServiceBill
  },

  // User Creations
  {
    path: '/user-creation',
    element: UserCreationWithPermission
  }
  ,
  {
    path: '/user-permission-utility',
    element: UserCreationWithPermissionUtility
  }
  ,
  //Letter
  {
    path: '/letter',
    element: LetterUtility
  }, {
    path: '/letter-data',
    element: Letter
  },
  //UTR 
  {
    path: '/utrentry-Utility',
    element: UTREntryUtility
  },
  {
    path: '/utr-entry',
    element: UTREntry
  }
  ,

  //ReceiptPaymeny
  {
    path: '/receipt-payment',
    element: RecieptPayment
  },
  {
    path: '/RecieptPaymentUtility',
    element: RecieptPaymentUtility
  },

  //Journal Voucher
  {
    path: '/Journal-voucher',
    element: JournalVoucher
  },

  {
    path: '/JournalVoucher_Utility',
    element: JournalVoucher_Utility
  },

  //Reports
  {
    path: '/ledger',
    element: Ledger
  },
  {
    path: '/getAllledger-report',
    element: AllGledgerReport
  },
  {
    path: '/ledger-report',
    element: GledgerReport
  },

  {
    path: '/multiple-ledger',
    element: MultipleLedger
  },
  {
    path: '/daybook',
    element: DayBook
  },
  {
    path: '/daybook-report',
    element: DayBookReport
  },
  //Bank Book
  {
    path: '/bank-book',
    element: BankBook
  },
  {
    path: '/bank-book-report',
    element: BankBookReport
  },

  //Pending Reports routes
  {
    path: '/pending-reports',
    element: PendingReports
  },
  {
    path: '/tenderwise-reports',
    element: TenderReports
  },

  {
    path: '/utr_detail-report',
    element: UTRDetailReport
  },

  {
    path: '/UTRReportSummary-reports',
    element: UTRReportSummary
  },
  {
    path: '/MillPaymentSummary-reports',
    element: MillPaymentSummary
  },
  {
    path: '/DuepaymentSummary-reports',
    element: DuePaymentSummary
  },
  {
    path: '/SaudaSummary-reports',
    element: SaudaSummary
  },

  //GST Utilities
  {
    path: '/gstutilities',
    element: GSTUtilitiesForm
  },

  //TrialBalance
  {
    path: '/trial-balance',
    element: TrialBalance
  },


  {
    path: '/TrialBalance-reports',
    element: TrialBalanceReport
  },
  {
    path: '/TrialBalanceDetails-reports',
    element: TrialBalanceDetailReport
  },

  {
    path: '/DaywiseTrialBalance-reports',
    element: DaywiseTrialBalanceReport
  },
  {
    path: '/JVReport-reports',
    element: JVReport
  },

  {
    path: '/profit-loss-balance-sheet',
    element: ProfitLoss
  },

  {
    path: '/ProfitLoss-Report',
    element: ProfitLossreport
  },


  //eBuySugar
  {
    path: '/eBuySugarian-user-utility',
    element: EBuySugarianUserUtility
  },
  {
    path: '/eBuySugarian-AcMaster-utility',
    element: EBuySugarAccountMasterUtility
  },

  //Balance Stock Report
  {
    path: '/balance-stock',
    element: BalanceStockReport
  },

  {
    path: '/millwise-stock',
    element: MillWiseLiftingWise
  },

  {
    path: '/self-stock',
    element: SelfStockReport
  },

  //Profit Loss Report
  {
    path: '/profit-loss',
    element: ProfitNLoss
  },
  {
    path: '/profit-loss-report',
    element: ProfitNLossReport
  },

  {
    path: '/Balancesheet-Report',
    element: BalancesheetReport
  },

  //Account Master Print
  {
    path: '/account-master-print',
    element: AccountMasterPrint
  },

  {
    path: '/accountmaster-print-report',
    element: AccountMasterPrintReport
  },

  //Interest Statement
  {
    path: '/interest-statement',
    element: InterestStatement

  },
  {
    path: '/interest-statement-report',
    element: InterestStatementReport
  },
  //Report -> Stock Book
  {
    path: '/stock-book',
    element: StockBookDetail
  },

  //Report -> Stock Book Report
  {
    path: '/stock-book-report',
    element: StockBookReport
  },

  {
    path: '/stock-book-detail-report',
    element: StockReportDetail
  },

  {
    path: '/retail-stock-book-detail-report',
    element: RetailDetailReport

  },

  //Register
  {
    path: '/register',
    element: Register

  },
  {
    path: '/dispatch-details',
    element: DispatchDetailsReport
  },

  //Common User Registration Form
  {
    path: '/user-register-form',
    element: UserRegistrationForm
  },

  //Purchase Sale Register Report
  {
    path: '/purchase-sale-registers',
    element: PurchaseSaleRegister
  },
  {
    path: '/SaleTDS-registers',
    element: SaleTDSRegister
  },
  {
    path: '/SaleTDSPartyWise-registers',
    element: SaleTDSPartWiseRegister
  },
  {
    path: '/SaleTCS-registers',
    element: SaleTCSRegister
  },
  {
    path: '/SaleTCSPartyWise-registers',
    element: SaleTCSPartWiseRegister
  },
  {
    path: '/PurchaseTCS-registers',
    element: PurchaseTCSRegister
  },
  {
    path: '/PurchaseTCSpartywise-registers',
    element: PurchaseTCSPartWiseRegister
  },
  {
    path: '/PurchaseTDS-registers',
    element: PurchaseTDSRegister
  },
  {
    path: '/PurchaseTDSpartywise-registers',
    element: PurchaseTDSPartywiseRegister
  },
  {
    path: '/Purchase-registers',
    element: PurchaseRegister
  },
  {
    path: '/Sale-registers',
    element: SaleRegister
  },
  {
    path: '/PurchaseReturn-registers',
    element: PurchaseReturnRegister
  },
  {
    path: '/SaleReturnSale-registers',
    element: SaleReturnSaleRegister
  },
  {
    path: '/MillSaleReport-registers',
    element: MillSaleReport
  },
  {
    path: '/SaleMonthWise-registers',
    element: SaleMonthWise
  },
  {
    path: '/PurchaseMonthWise-registers',
    element: PurchaseMonthWise
  },
  {
    path: '/RCM-registers',
    element: RCMRegister
  },

  //OnlineRailwayRackBuy
  {
    path: '/rack-mill-info-utility',
    element: RackMillInfoUtility
  },
  {
    path: '/rack-mill-info',
    element: RackMillInfo
  },
  {
    path: '/rack-railway-station-master-utility',
    element: RackRailwaystationMasterUtility
  },
  {
    path: 'rack-railway-station-master',
    element: RackRailwaystationMaster
  },
  {
    path: '/rack-link-railway-station-utility',
    element: RackLinkrailwaystationUtility
  },
  {
    path: 'rack-link-railway-station',
    element: RackLinkrailwaystation
  },
  {
    path: '/rack-from-to-railway-station-rate-utility',
    element: RackFromToRailwayStationRateUtility
  },
  {
    path: '/rack-from-to-railway-station-rate',
    element: RackFromToRailwayStationRate
  },

  //Online RailWay Rack Report
  {
    path: '/railway-rack-buy-report',
    element: RackRailwayMillRateReport
  },
  {
    path: '/mill-rate-info-report',
    element: MillRateReportTable
  },

  {
    path:'/periodic-sale-report',
    element: PeriodicSaleAnalyticsLineChart
  },
  {
    path: '/periodic-sale-report-bar-chart',
    element: PeriodicSaleAnalyticsBarChart
  }

];

export default routes;
