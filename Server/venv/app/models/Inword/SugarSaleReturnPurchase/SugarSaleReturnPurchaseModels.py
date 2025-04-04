from app import db

class SugarPurchaseReturnHead(db.Model):
    __tablename__ = 'nt_1_sugarpurchasereturn'
    doc_no = db.Column(db.Integer, nullable=True)
    PURCNO = db.Column(db.Integer, nullable=True)
    PurcTranType = db.Column(db.String(4), nullable=True)
    Tran_Type = db.Column(db.String(2), nullable=True)
    doc_date = db.Column(db.Date, nullable=True)
    Ac_Code = db.Column(db.Integer, nullable=True)
    Unit_Code = db.Column(db.Integer, nullable=True)
    mill_code = db.Column(db.Integer, nullable=True)
    FROM_STATION = db.Column(db.String(255), nullable=True)
    TO_STATION = db.Column(db.String(255), nullable=True)
    LORRYNO = db.Column(db.String(50), nullable=True)
    BROKER = db.Column(db.Integer, nullable=True)
    wearhouse = db.Column(db.Text, nullable=True)
    subTotal = db.Column(db.Numeric(18, 2), nullable=True)
    LESS_FRT_RATE = db.Column(db.Numeric(18, 2), nullable=True)
    freight = db.Column(db.Numeric(18, 2), nullable=True)
    cash_advance = db.Column(db.Numeric(18, 2), nullable=True)
    bank_commission = db.Column(db.Numeric(18, 2), nullable=True)
    OTHER_AMT = db.Column(db.Numeric(18, 2), nullable=True)
    Bill_Amount = db.Column(db.Numeric(18, 2), nullable=True)
    Due_Days = db.Column(db.Integer, nullable=True)
    NETQNTL = db.Column(db.Numeric(18, 2), nullable=True)
    Company_Code = db.Column(db.Integer, nullable=True)
    Year_Code = db.Column(db.Integer, nullable=True)
    Branch_Code = db.Column(db.Integer, nullable=True)
    Created_By = db.Column(db.String(255), nullable=True)
    Modified_By = db.Column(db.String(255), nullable=True)
    Bill_No = db.Column(db.String(50), nullable=True)
    CGSTRate = db.Column(db.Numeric(18, 2), nullable=True)
    CGSTAmount = db.Column(db.Numeric(18, 2), nullable=True)
    SGSTRate = db.Column(db.Numeric(18, 2), nullable=True)
    SGSTAmount = db.Column(db.Numeric(18, 2), nullable=True)
    IGSTRate = db.Column(db.Numeric(18, 2), nullable=True)
    IGSTAmount = db.Column(db.Numeric(18, 2), nullable=True)
    GstRateCode = db.Column(db.Integer, nullable=True)
    purcyearcode = db.Column(db.Integer, nullable=True)
    Bill_To = db.Column(db.Integer, nullable=True)
    prid = db.Column(db.Integer, nullable=False, primary_key=True)
    srid = db.Column(db.Integer, nullable=True)
    ac = db.Column(db.Integer, nullable=True)
    uc = db.Column(db.Integer, nullable=True)
    mc = db.Column(db.Integer, nullable=True)
    bc = db.Column(db.Integer, nullable=True)
    bt = db.Column(db.Integer, nullable=True)
    sbid = db.Column(db.Integer, nullable=True)
    TCS_Rate = db.Column(db.Numeric(18, 3), nullable=True)
    TCS_Amt = db.Column(db.Numeric(18, 2), nullable=True)
    TCS_Net_Payable = db.Column(db.Numeric(18, 2), nullable=True)
    einvoiceno = db.Column(db.String(500), nullable=True)
    ackno = db.Column(db.String(500), nullable=True)
    TDS_Rate = db.Column(db.Numeric(18, 3), nullable=True)
    TDS_Amt = db.Column(db.Numeric(18, 2), nullable=True)
    QRCode = db.Column(db.Text, nullable=True)
    gstid = db.Column(db.Integer, nullable=True)
    LockedRecord = db.Column(db.Boolean, nullable=False, default=False)
    LockedUser = db.Column(db.String(50),default='',nullable=True)

    details = db.relationship('SugarPurchaseReturnDetail', backref='sugarPurchaseReturnHead', lazy=True)


class SugarPurchaseReturnDetail(db.Model):
    __tablename__ = 'nt_1_sugarpurchasedetailsreturn'
    doc_no = db.Column(db.Integer, nullable=True)
    detail_id = db.Column(db.Integer, nullable=True)
    Tran_Type = db.Column(db.String(2), nullable=True)
    item_code = db.Column(db.Integer, nullable=True)
    narration = db.Column(db.Text, nullable=True)
    Quantal = db.Column(db.Numeric(18, 2), nullable=True)
    packing = db.Column(db.Integer, nullable=True)
    bags = db.Column(db.Integer, nullable=True)
    rate = db.Column(db.Numeric(18, 2), nullable=True)
    item_Amount = db.Column(db.Numeric(18, 2), nullable=True)
    Company_Code = db.Column(db.Integer, nullable=True)
    Year_Code = db.Column(db.Integer, nullable=True)
    Branch_Code = db.Column(db.Integer, nullable=True)
    Created_By = db.Column(db.String(255), nullable=True)
    Modified_By = db.Column(db.String(255), nullable=True)
    ic = db.Column(db.Integer, nullable=True)
    prdid = db.Column(db.Integer, nullable=False, primary_key=True)
    prid = db.Column(db.Integer, db.ForeignKey('nt_1_sugarpurchasereturn.prid'), nullable=False)
