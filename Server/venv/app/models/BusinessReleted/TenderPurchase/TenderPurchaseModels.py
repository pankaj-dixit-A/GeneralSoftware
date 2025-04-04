# project_folder/app/models/tender.py
from app import db 
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

class TenderHead(db.Model):
    __tablename__ = 'nt_1_tender'
    Tender_No = db.Column(db.Integer)
    Company_Code = db.Column(db.Integer)
    Tender_Date = db.Column(db.Date)
    Lifting_Date = db.Column(db.Date)
    Mill_Code = db.Column(db.Integer)
    Grade = db.Column(db.String(50))
    Quantal = db.Column(db.DECIMAL)
    Packing =  db.Column(db.Integer)
    Bags =  db.Column(db.Integer)
    Payment_To =  db.Column(db.Integer)
    Tender_From =  db.Column(db.Integer)
    Tender_DO =  db.Column(db.Integer)
    Voucher_By =  db.Column(db.Integer)
    Broker =  db.Column(db.Integer)
    Excise_Rate =  db.Column(db.DECIMAL)
    Narration =  db.Column(db.String(500))
    Mill_Rate =  db.Column(db.DECIMAL)
    Created_By =  db.Column(db.String(50))
    Modified_By =  db.Column(db.String(50))
    Year_Code =  db.Column(db.Integer)
    Purc_Rate =  db.Column(db.DECIMAL)
    type =  db.Column(db.CHAR(1))
    Branch_Id =  db.Column(db.Integer)
    Voucher_No =  db.Column(db.Integer)
    Sell_Note_No =  db.Column(db.String(50))
    Brokrage =  db.Column(db.DECIMAL)
    tenderid =  db.Column(db.Integer, primary_key=True)
    mc =  db.Column(db.Integer)
    itemcode =  db.Column(db.Integer)
    season =  db.Column(db.String(20))
    pt =  db.Column(db.Integer)
    tf =  db.Column(db.Integer)
    td =  db.Column(db.Integer)
    vb =  db.Column(db.Integer)
    bk =  db.Column(db.Integer)
    ic =  db.Column(db.Integer)
    gstratecode =  db.Column(db.Integer)
    CashDiff =  db.Column(db.DECIMAL)
    TCS_Rate =  db.Column(db.Numeric)
    TCS_Amt =  db.Column(db.DECIMAL)
    commissionid =  db.Column(db.Integer)
    Voucher_Type = db.Column(db.String(2))
    Party_Bill_Rate = db.Column(db.DECIMAL)
    TDS_Rate = db.Column(db.DECIMAL)
    TDS_Amt = db.Column(db.DECIMAL)
    Temptender = db.Column(db.String(1))
    AutoPurchaseBill = db.Column(db.String(1))
    # Bp_Account = db.Column(db.Integer)
    # bp = db.Column(db.Integer)
    # groupTenderNo = db.Column(db.Integer)
    # groupTenderId = db.Column(db.Integer)
    LockedRecord = db.Column(db.Boolean, nullable=False, default=False)
    LockedUser = db.Column(db.String(50),default='',nullable=True)

    details = db.relationship('TenderDetails', backref='head', lazy=True)
 
class TenderDetails(db.Model):
    __tablename__ = 'nt_1_tenderdetails'
    Tender_No = db.Column(db.Integer)
    Company_Code = db.Column(db.Integer)
    Buyer = db.Column(db.Integer)
    Buyer_Quantal = db.Column(db.DECIMAL)
    Sale_Rate = db.Column(db.DECIMAL)
    Commission_Rate = db.Column(db.DECIMAL)
    Sauda_Date = db.Column(db.Date)
    Lifting_Date = db.Column(db.Date)
    Narration = db.Column(db.String(255))
    ID = db.Column(db.Integer)
    Buyer_Party = db.Column(db.Integer)
    AutoID = db.Column(db.Integer)
    IsActive = db.Column(db.Integer)
    year_code = db.Column(db.Integer)
    Branch_Id = db.Column(db.Integer)
    Delivery_Type = db.Column(db.String(10))
    tenderid = db.Column(db.Integer, ForeignKey('nt_1_tender.tenderid'))
    tenderdetailid = db.Column(db.Integer, primary_key=True)
    buyerid = db.Column(db.Integer)
    buyerpartyid = db.Column(db.Integer)
    sub_broker = db.Column(db.Integer)
    sbr = db.Column(db.Integer)
    tcs_rate = db.Column(db.DECIMAL)
    gst_rate = db.Column(db.DECIMAL)
    tcs_amt = db.Column(db.DECIMAL)
    gst_amt = db.Column(db.DECIMAL)
    ShipTo = db.Column(db.Integer)
    CashDiff = db.Column(db.DECIMAL)
    shiptoid = db.Column(db.Integer)
    # BP_Detail = db.Column(db.Integer)
    # bpid = db.Column(db.Integer)
    # loding_by_us = db.Column(db.String(1))
    # DetailBrokrage = db.Column(db.DECIMAL)
    

    
    