from app import db
class SystemMaster(db.Model):
    __tablename__ = 'nt_1_systemmaster'
    System_Type = db.Column(db.String(1), nullable=False )
    System_Code = db.Column(db.Integer,nullable=False)
    System_Name_E = db.Column(db.String(50),nullable=True)
    System_Name_R = db.Column(db.String(50),nullable=True)
    System_Rate = db.Column(db.Numeric(18,2),nullable=True)
    Purchase_AC = db.Column(db.Integer,nullable=True)
    Sale_AC = db.Column(db.Integer,nullable=True)
    Vat_AC = db.Column(db.Integer,nullable=True)
    Opening_Bal = db.Column(db.Numeric(18,2),nullable=True)
    KgPerKatta = db.Column(db.Numeric(18,2),nullable=True)
    minRate = db.Column(db.Numeric(18,2),nullable=True)
    maxRate = db.Column(db.Numeric(18,2),nullable=True)
    Company_Code = db.Column(db.Integer,nullable=False)
    Year_Code = db.Column(db.Integer,nullable=False)
    Branch_Code = db.Column(db.Integer,nullable=True)
    Created_By = db.Column(db.String(255),nullable=True)
    Modified_By = db.Column(db.String(255),nullable=True)
    HSN = db.Column(db.String(50),nullable=True)
    systemid = db.Column(db.Integer,nullable=False,primary_key=True)
    Opening_Value = db.Column(db.Numeric(18,2),nullable=True)
    Gst_Code = db.Column(db.Numeric(18,0),nullable=True)
    MarkaSet = db.Column(db.String(1), nullable=True )
    Supercost = db.Column(db.String(1), nullable=True )
    Packing = db.Column(db.String(1), nullable=True )
    LodingGst = db.Column(db.String(1), nullable=True )
    MarkaPerc = db.Column(db.Numeric(18,2),nullable=True)
    SuperPerc = db.Column(db.Numeric(18,2),nullable=True)
    RatePer = db.Column(db.String(1), nullable=True )
    IsService = db.Column(db.String(1), nullable=True )
    # Width = db.Column(db.Numeric(18,2),nullable=True)
    # LENGTH = db.Column(db.Numeric(18,2),nullable=True)
    # levi = db.Column(db.Numeric(18,0),nullable=True)
    # Oldcompname = db.Column(db.String(255))
    # Insurance = db.Column(db.Numeric(18,0))
    # weight = db.Column(db.Numeric(18,2))
    # gstratecode = db.Column(db.Numeric(18,0))
    # category = db.Column(db.Numeric(50))
    #gstid = db.Column(db.Integer)


