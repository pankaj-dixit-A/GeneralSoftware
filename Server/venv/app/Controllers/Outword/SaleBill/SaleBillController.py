import traceback
from flask import Flask, jsonify, request
from app import app, db
from app.models.Outword.SaleBill.SaleBillModels import SaleBillHead,SaleBillDetail
from app.models.Reports.GLedeger.GLedgerModels import Gledger
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import func
import os
import requests
from app.models.Outword.SaleBill.SaleBillSchema import SaleBillDetailSchema, SaleBillHeadSchema
from app.utils.CommonGLedgerFunctions import fetch_company_parameters,get_accoid,getSaleAc,get_acShort_Name,create_gledger_entry,send_gledger_entries
from flask_socketio import SocketIO
from datetime import datetime

API_URL= os.getenv('API_URL')
API_URL_SERVER = os.getenv('API_URL_SERVER')

# Define schemas
saleBill_head_schema = SaleBillHeadSchema()
saleBill_head_schemas = SaleBillHeadSchema(many=True)

saleBill_detail_schema = SaleBillDetailSchema()
saleBill_detail_schemas = SaleBillDetailSchema(many=True)

#Common Query to GET the all lable from the database
TASK_DETAILS_QUERY = '''
SELECT        accode.Ac_Code AS partyaccode, accode.Ac_Name_E AS partyname, accode.accoid AS partyacid, mill.Ac_Code AS millaccode, mill.Ac_Name_E AS millname, mill.accoid AS millacid, unit.Ac_Code AS unitaccode, 
                         unit.Ac_Name_E AS unitname, broker.Ac_Code AS brokeraccode, broker.Ac_Name_E AS brokername, unit.accoid AS unitacid, broker.accoid AS brokeracid, item.systemid, item.System_Code, item.System_Name_E AS itemname, 
                         dbo.nt_1_gstratemaster.Doc_no AS gstdocno, dbo.nt_1_gstratemaster.Rate AS gstrate, dbo.nt_1_gstratemaster.gstid AS gstdocid, dbo.Brand_Master.Code AS brandocno, dbo.Brand_Master.Marka AS brandname, 
                         dbo.nt_1_sugarsaledetails.doc_no, dbo.nt_1_sugarsaledetails.detail_id, dbo.nt_1_sugarsaledetails.item_code, dbo.nt_1_sugarsaledetails.narration, dbo.nt_1_sugarsaledetails.Quantal, dbo.nt_1_sugarsaledetails.packing, 
                         dbo.nt_1_sugarsaledetails.bags, dbo.nt_1_sugarsaledetails.rate, dbo.nt_1_sugarsaledetails.item_Amount, dbo.nt_1_sugarsaledetails.Company_Code, dbo.nt_1_sugarsaledetails.Year_Code, 
                         dbo.nt_1_sugarsaledetails.saledetailid, dbo.nt_1_sugarsaledetails.saleid, dbo.nt_1_sugarsaledetails.ic, dbo.nt_1_sugarsaledetails.Brand_Code, dbo.nt_1_sugarsale.ac, dbo.nt_1_sugarsale.uc, dbo.nt_1_sugarsale.mc, 
                         dbo.nt_1_sugarsale.bk, dbo.nt_1_sugarsale.tc, transport.Ac_Code AS transportaccode, transport.Ac_Name_E AS transportname, dbo.nt_1_sugarsale.Bill_To, dbo.nt_1_sugarsale.bt, billto.Ac_Code AS billtoaccode, 
                         billto.Ac_Name_E AS billtoname, billto.accoid AS billtoacid, transport.accoid AS transportacid, dbo.nt_1_gstratemaster.GST_Name AS GSTName, accode.Mobile_No AS PartyMobNo, unit.Mobile_No AS UnitMobNo, 
                         transport.Mobile_No AS TransportMobNo, mill.Gst_No AS MillGSTNo
FROM            dbo.nt_1_accountmaster AS accode RIGHT OUTER JOIN
                         dbo.nt_1_accountmaster AS billto RIGHT OUTER JOIN
                         dbo.nt_1_sugarsale ON billto.accoid = dbo.nt_1_sugarsale.bt LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS broker LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS transport ON broker.Ac_Name_R = transport.Mobile_No ON dbo.nt_1_sugarsale.tc = transport.accoid AND dbo.nt_1_sugarsale.bk = broker.accoid ON 
                         accode.accoid = dbo.nt_1_sugarsale.ac LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS unit ON dbo.nt_1_sugarsale.uc = unit.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS mill ON dbo.nt_1_sugarsale.mc = mill.accoid LEFT OUTER JOIN
                         dbo.nt_1_gstratemaster ON dbo.nt_1_sugarsale.gstid = dbo.nt_1_gstratemaster.gstid LEFT OUTER JOIN
                         dbo.nt_1_systemmaster AS item RIGHT OUTER JOIN
                         dbo.nt_1_sugarsaledetails ON item.systemid = dbo.nt_1_sugarsaledetails.ic LEFT OUTER JOIN
                         dbo.Brand_Master ON dbo.nt_1_sugarsaledetails.Brand_Code = dbo.Brand_Master.Code ON dbo.nt_1_sugarsale.saleid = dbo.nt_1_sugarsaledetails.saleid
WHERE   dbo.nt_1_sugarsale.saleid=:saleid
'''

#Format Dated
def format_dates(task):
    return {
        "doc_date": task.doc_date.strftime('%Y-%m-%d') if task.doc_date else None,
        "newsbdate": task.newsbdate.strftime('%Y-%m-%d') if task.newsbdate else None,
        "EwayBillValidDate": task.EwayBillValidDate.strftime('%Y-%m-%d') if task.EwayBillValidDate else None,
    }

#Create a GLedger Entries
ac_code=0
ordercode=0
doc_no=0
narration=''
trans_type='SB'

def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid,ordercode,narration, saleid):
    if amount > 0:
        entry = create_gledger_entry(data, amount, drcr, ac_code, accoid,ordercode,trans_type,doc_no,narration)
        entry['saleid'] = saleid
        entries.append(entry)

#Genrate the narration for the sale bill
def generate_narration(headData, unitcode, accode):
    saleacnarration = (
    f"{get_acShort_Name(headData['mill_code'], headData['Company_Code'])} "
    f"Qntl: {headData['NETQNTL']} "
    f"L: {headData['LORRYNO']} "
    f"SB: {get_acShort_Name(headData['Ac_Code'], headData['Company_Code'])}"
)

    Transportnarration = (
            'Qntl: ' + str(headData.get('NETQNTL', '') or '') + ' ' + str(headData.get('cash_advance', '') or '') +
                str(get_acShort_Name(headData.get('mill_code', '') or '', headData.get('Company_Code', '') or '') or '') +
                str(get_acShort_Name(headData.get('Transport_Code', '') or '', headData.get('Company_Code', '') or '') or '') +
                ' L: ' + str(headData.get('LORRYNO', '') or '')
            )

    if accode==unitcode :
        creditnarration = (
                str(get_acShort_Name(headData.get('mill_code', '') or '', headData.get('Company_Code', '') or '') or '') +
                str(headData.get('NETQNTL', '') or '') + 
                ' L: ' + str(headData.get('LORRYNO', '') or '') + 
                ' PB' + str(headData.get('PURCNO', '') or '') + 
                ' R: ' + str(headData.get('LESS_FRT_RATE', '') or '')
            )
               
    elif accode!=unitcode :
        creditnarration = (
                str(get_acShort_Name(headData.get('mill_code', '') or '', headData.get('Company_Code', '') or '') or '') +
                str(headData.get('NETQNTL', '') or '') + 
                ' L: ' + str(headData.get('LORRYNO', '') or '') + 
                ' PB' + str(headData.get('PURCNO', '') or '') + 
                ' R: ' + str(headData.get('LESS_FRT_RATE', '') or '') +
                ' Shiptoname: ' + str(get_acShort_Name(headData.get('Unit_Code', '') or '', headData.get('Company_Code', '') or '') or '')
            )

    return saleacnarration, Transportnarration, creditnarration

#create a sale Bill GLedger Effects Enteries
def create_sale_gledger_entries(headData, detailData, doc_no, saleid):
    gledger_entries = []    
    # Extract tax amounts from headData
    tax_data = {
        'CGSTAmount': float(headData.get('CGSTAmount', 0) or 0),
        'SGSTAmount': float(headData.get('SGSTAmount', 0) or 0),
        'IGSTAmount': float(headData.get('IGSTAmount', 0) or 0),
        'TCS_Amt': float(headData.get('TCS_Amt', 0) or 0),
        'TDS_Amt': float(headData.get('TDS_Amt', 0) or 0),
        'Bill_Amount': float(headData.get('Bill_Amount', 0) or 0),
        'cash_advance': float(headData.get('cash_advance', 0) or 0),
        'RoundOff': float(headData.get('RoundOff', 0) or 0),
        'TaxableAmount': float(headData.get('TaxableAmount', 0) or 0),
        'subTotal': float(headData.get('subTotal', 0) or 0),
        
    }

    company_parameters = fetch_company_parameters(headData.get('Company_Code'), headData.get('Year_Code'))
    ordercode = 0

    def add_entry(ac_code, amount, drcr, narration, increase_ordercode=True):
        nonlocal ordercode
        if increase_ordercode:
            ordercode += 1
        accoid = get_accoid(ac_code, headData.get('Company_Code'))
        add_gledger_entry(gledger_entries, headData, amount, drcr, ac_code, accoid, ordercode, narration, saleid)

    saleacnarration, Transportnarration, creditnarration = generate_narration(headData, headData['Unit_Code'], headData['Ac_Code'])

    if tax_data['CGSTAmount'] > 0:
        add_entry(company_parameters.CGSTAc, tax_data['CGSTAmount'], 'C', creditnarration)

    if tax_data['SGSTAmount'] > 0:
        add_entry(company_parameters.SGSTAc, tax_data['SGSTAmount'], 'C', creditnarration)

    if tax_data['IGSTAmount'] > 0:
        add_entry(company_parameters.IGSTAc, tax_data['IGSTAmount'], 'C', creditnarration)

    if tax_data['TCS_Amt'] > 0:
        add_entry(headData['Ac_Code'], tax_data['TCS_Amt'], 'D', creditnarration)
        add_entry(company_parameters.SaleTCSAc, tax_data['TCS_Amt'], 'C', creditnarration)

    if tax_data['TDS_Amt'] > 0:
        add_entry(headData['Ac_Code'], tax_data['TDS_Amt'], 'C', creditnarration)
        add_entry(company_parameters.SaleTDSAc, tax_data['TDS_Amt'], 'D', creditnarration)

    if tax_data['Bill_Amount'] > 0:
        add_entry(headData['Ac_Code'], tax_data['Bill_Amount'], 'D', creditnarration)
        add_entry(getSaleAc(detailData[0].get('ic')), tax_data['TaxableAmount'], 'C', saleacnarration)

    if tax_data['cash_advance'] > 0:
        add_entry(headData['Transport_Code'], tax_data['cash_advance'], 'C', Transportnarration)

    if tax_data['RoundOff'] != 0:
        drcr = 'C' if tax_data['RoundOff'] > 0 else 'D'
        add_entry(company_parameters.RoundOff, abs(tax_data['RoundOff']), drcr, creditnarration, False)

    return gledger_entries

#GET Next Doc_no from database
@app.route(API_URL + "/get-next-doc-no", methods=["GET"])
def get_next_doc_no():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        max_doc_no = db.session.query(func.max(SaleBillHead.doc_no)).filter_by(Company_Code=company_code, Year_Code=year_code).scalar()
        next_doc_no = max_doc_no + 1 if max_doc_no else 1
        response = {
            "next_doc_no": next_doc_no
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get data from both tables SaleBill and SaleBilllDetail
@app.route(API_URL+"/getdata-SaleBill", methods=["GET"])
def getdata_SaleBill():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = ('''SELECT mill.accoid AS millacid, accode.Gst_No AS BillFromGSTNo, dbo.nt_1_sugarsale.doc_no, dbo.nt_1_sugarsale.doc_date, dbo.nt_1_sugarsale.Bill_Amount, dbo.nt_1_sugarsale.NETQNTL, dbo.nt_1_sugarsale.DO_No, 
                  dbo.nt_1_sugarsale.EWay_Bill_No, dbo.nt_1_sugarsale.ackno, dbo.nt_1_sugarsale.IsDeleted, dbo.nt_1_sugarsale.saleid, mill.Short_Name AS MillName, shipTo.Short_Name AS ShipToName, accode.Short_Name AS billFromName
FROM     dbo.nt_1_accountmaster AS shipTo RIGHT OUTER JOIN
                  dbo.nt_1_sugarsale ON shipTo.accoid = dbo.nt_1_sugarsale.uc AND shipTo.company_code = dbo.nt_1_sugarsale.Company_Code LEFT OUTER JOIN
                  dbo.nt_1_accountmaster AS accode ON dbo.nt_1_sugarsale.Company_Code = accode.company_code AND dbo.nt_1_sugarsale.ac = accode.accoid LEFT OUTER JOIN
                  dbo.nt_1_accountmaster AS mill ON dbo.nt_1_sugarsale.mc = mill.accoid
                 where dbo.nt_1_sugarsale.Company_Code = :company_code and dbo.nt_1_sugarsale.Year_Code = :year_code order by dbo.nt_1_sugarsale.doc_no desc
                                 '''
            )
        additional_data = db.session.execute(text(query), {"company_code": company_code, "year_code": year_code})

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]

        for data in all_data:
            if 'doc_date' in data:
                data['doc_date'] = data['doc_date'].strftime('%Y-%m-%d') if data['doc_date'] else None
 
        response = {
            "all_data": all_data
        }

        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# # We have to get the data By the Particular doc_no AND tran_type
@app.route(API_URL+"/SaleBillByid", methods=["GET"])
def getSaleBillByid():
    try:
        saleid = request.args.get('saleid')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code, saleid]):
            return jsonify({"error": "Missing required parameters"}), 400

        saleBill_head = SaleBillHead.query.filter_by(saleid=saleid,Company_Code=Company_Code,Year_Code=Year_Code).first()

        newsaleid = saleBill_head.saleid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"saleid": newsaleid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        last_head_data = {column.name: getattr(saleBill_head, column.name) for column in saleBill_head.__table__.columns}
        last_head_data.update(format_dates(saleBill_head))

        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

#Insert Record and Gldger Effects of DebitcreditNote and DebitcreditNoteDetail
@app.route(API_URL + "/insert-SaleBill", methods=["POST"])
def insert_SaleBill():
    def get_max_doc_no():
        return db.session.query(func.max(SaleBillHead.doc_no)).scalar() or 1
    try:
        data = request.get_json()
        headData = data['headData']
        detailData = data['detailData']

        new_doc_no = 0

        dono=headData['DO_No']
        print('dono',dono)
        if    dono is None or dono!=0:
            new_doc_no=0
            headData['doc_no'] = new_doc_no
        else :
            max_doc_no = get_max_doc_no()
            new_doc_no = max_doc_no + 1
            headData['doc_no'] = new_doc_no
           

        print("Doc_No", new_doc_no)

        new_head = SaleBillHead(**headData)
        db.session.add(new_head)
        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []
        headData['saleid'] = new_head.saleid

        print('SaleId', headData['saleid'])

        for item in detailData:
            item['doc_no'] = new_doc_no
            item['saleid'] = new_head.saleid

            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    new_detail = SaleBillDetail(**item)
                    new_head.details.append(new_detail)
                    createdDetails.append(new_detail)
                    

                elif item['rowaction'] == "update":
                    saledetailid = item['saledetailid']
                    update_values = {k: v for k, v in item.items() if k not in ('saledetailid', 'rowaction', 'saleid')}
                    db.session.query(SaleBillDetail).filter(SaleBillDetail.saledetailid == saledetailid).update(update_values)
                    updatedDetails.append(saledetailid)
                    

                elif item['rowaction'] == "delete":
                    saledetailid = item['saledetailid']
                    detail_to_delete = db.session.query(SaleBillDetail).filter(SaleBillDetail.saledetailid == saledetailid).one_or_none()
                    if detail_to_delete:
                        db.session.delete(detail_to_delete)
                        deletedDetailIds.append(saledetailid)
                        
        db.session.commit()
        print('newsaleid',new_head.saleid)
        gledger_entries = create_sale_gledger_entries(headData, detailData, new_doc_no, new_head.saleid)
        print('gledger_entries',gledger_entries)
        response = send_gledger_entries(headData, gledger_entries,trans_type)
        
        if response.status_code != 201:
            db.session.rollback()
            print("Traceback",traceback.format_exc())
            return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code


        return jsonify({
            "message": "Data Inserted successfully",
            "head": saleBill_head_schema.dump(new_head),
            "addedDetails": saleBill_detail_schemas.dump(createdDetails),
            "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 201

    except Exception as e:
        print("Traceback", traceback.format_exc())
    
        try:
            # Extract necessary details for the DeleteTransaction API call
            psno = headData.get('PURCNO')  # Assuming 'doc_no' is the identifier to pass
            Company_Code = headData.get('Company_Code')
            Year_Code = headData.get('Year_Code')
            DO_No = headData.get('DO_No')
            
            # Create the correct URL with the parameters
            delete_url = f"http://localhost:8080/api/sugarian/DeleteTransactionSale?PURCNO={psno}&Company_Code={Company_Code}&Year_Code={Year_Code}&DO_No={DO_No}"
            
            # Make the DELETE request to DeleteTransaction API
            response = requests.delete(delete_url)
            
            if response.status_code != 200:
                print(f"Failed to delete related records: {response.text}")
        
        except Exception as inner_exception:
            print(f"Error occurred while calling DeleteTransaction API: {inner_exception}")
        
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    

#Update Record and Gldger Effects of SaleBill and SaleBill
@app.route(API_URL + "/update-SaleBill", methods=["PUT"])
def update_SaleBill():     
    try:
        data = request.get_json()
        headData = data['headData']
        detailData = data['detailData']
        dono=headData['DO_No']
        doc_no=headData['doc_no']
        if dono!=0  :
            if doc_no == 0 :
                headData['doc_no'] = 0
                updateddoc_no = 0

        saleid = request.args.get('saleid')
        if saleid is None:
            return jsonify({"error": "Missing 'saleid' parameter"}), 400

        tran_type = headData.get('Tran_Type')
        if tran_type is None:
             return jsonify({"error": "Bad Request", "message": "tran_type and bill_type is required"}), 400

        # Update the head data
        updatedHeadCount = db.session.query(SaleBillHead).filter(SaleBillHead.saleid == saleid).update(headData)
        updated_debit_head = db.session.query(SaleBillHead).filter(SaleBillHead.saleid == saleid).one()
        updateddoc_no = updated_debit_head.doc_no
        print("updateddoc_no",updateddoc_no)

        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []
        dono=headData['DO_No']
        for item in detailData:
            item['saleid'] = updated_debit_head.saleid

            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    item['doc_no'] = updateddoc_no
                    new_detail = SaleBillDetail(**item)
                    updated_debit_head.details.append(new_detail)
                    createdDetails.append(new_detail)

                elif item['rowaction'] == "update":
                    if dono=="" and dono==0:
                        dcdetailid = item['saledetailid']                  
                        update_values = {k: v for k, v in item.items() if k not in ('saledetailid', 'rowaction', 'saleid')}
                        db.session.query(SaleBillDetail).filter(SaleBillDetail.saledetailid == dcdetailid).update(update_values)
                        updatedDetails.append(dcdetailid)
                    else:
                        dcdetailid = item['saledetailid']                  
                        update_values = {k: v for k, v in item.items() if k not in ('saledetailid', 'rowaction', 'saleid')}
                        db.session.query(SaleBillDetail).filter(SaleBillDetail.saleid == saleid).update(update_values)
                        updatedDetails.append(dcdetailid)   

                elif item['rowaction'] == "delete":
                    dcdetailid = item['saledetailid']
                    detail_to_delete = db.session.query(SaleBillDetail).filter(SaleBillDetail.saledetailid == dcdetailid).one_or_none()
                    if detail_to_delete:
                        db.session.delete(detail_to_delete)
                        deletedDetailIds.append(dcdetailid)
                        
        db.session.commit()

        gledger_entries = create_sale_gledger_entries(headData, detailData, doc_no, updated_debit_head.saleid)

        response = send_gledger_entries(headData, gledger_entries,trans_type)

        if response.status_code != 201:
            db.session.rollback()
            return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

        return jsonify({
            "message": "Data Inserted successfully",
            "head": updatedHeadCount,
            "addedDetails": saleBill_detail_schemas.dump(createdDetails),
            "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Delete record from datatabse based Dcid and also delete that record GLeder Effects.  
@app.route(API_URL + "/delete_data_by_saleid", methods=["DELETE"])
def delete_data_by_saleid():
    try:
        saleid = request.args.get('saleid')
        Company_Code = request.args.get('Company_Code')
        doc_no = request.args.get('doc_no')
        Year_Code = request.args.get('Year_Code')

        if not all([saleid, Company_Code, doc_no, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        # Start a transaction
        with db.session.begin():
            deleted_saleBillHead_rows = SaleBillDetail.query.filter_by(saleid=saleid).delete()

            deleted_saleBillDetail_rows = SaleBillHead.query.filter_by(saleid=saleid).delete()

        if deleted_saleBillHead_rows > 0 and deleted_saleBillDetail_rows > 0:
            query_params = {
                'Company_Code': Company_Code,
                'DOC_NO': doc_no,
                'Year_Code': Year_Code,
                'TRAN_TYPE': "SB",
            }

            response = requests.delete(API_URL_SERVER+"/delete-Record-gLedger", params=query_params)
            
            if response.status_code != 200:
                raise Exception("Failed to create record in gLedger")

            db.session.commit()

        return jsonify({
            "message": f"Deleted {deleted_saleBillHead_rows} saleBillHead_row(s) and {deleted_saleBillDetail_rows} saleBillDetail row(s) successfully"
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Navigations API    
#Get First record from database 
@app.route(API_URL+"/get-firstSaleBill-navigation", methods=["GET"])
def get_firstSaleBill_navigation():
    try:

        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400
        
        first_saleBill = SaleBillHead.query.filter_by(Company_Code=Company_Code,Year_Code=Year_Code).order_by(SaleBillHead.saleid.asc()).first()

        if not first_saleBill:
            return jsonify({"error": "No records found in Task_Entry table"}), 404

        first_saleid = first_saleBill.saleid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"saleid": first_saleid})

        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None

        first_head_data = {column.name: getattr(first_saleBill, column.name) for column in first_saleBill.__table__.columns}
        first_head_data.update(format_dates(first_saleBill))

        first_details_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "first_head_data": first_head_data,
            "first_details_data": first_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Get last Record from Database
@app.route(API_URL+"/get-lastSaleBill-navigation", methods=["GET"])
def get_lastSaleBill_navigation():
    try:

        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        last_saleBill = SaleBillHead.query.filter_by(Company_Code=Company_Code,Year_Code=Year_Code).order_by(SaleBillHead.saleid.desc()).first()

        if not last_saleBill:
            return jsonify({"error": "No records found in Task_Entry table"}), 404

        last_saleid = last_saleBill.saleid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"saleid": last_saleid})

        additional_data_rows = additional_data.fetchall()
      
        row = additional_data_rows[0] if additional_data_rows else None
        last_head_data = {column.name: getattr(last_saleBill, column.name) for column in last_saleBill.__table__.columns}
        last_head_data.update(format_dates(last_saleBill))

        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }
        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#Get Previous record by database 
@app.route(API_URL+"/get-previousSaleBill-navigation", methods=["GET"])
def get_previousSaleBill_navigation():
    try:
        current_doc_no = request.args.get('currentDocNo')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code, current_doc_no]):
            return jsonify({"error": "Missing required parameters"}), 400

        previous_saleBill = SaleBillHead.query.filter(SaleBillHead.doc_no < current_doc_no).filter_by(Company_Code=Company_Code,Year_Code=Year_Code).order_by(SaleBillHead.doc_no.desc()).first()
    
        
        if not previous_saleBill:
            return jsonify({"error": "No previous records found"}), 404

        previous_sale_id = previous_saleBill.saleid
        
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"saleid": previous_sale_id})

        additional_data_rows = additional_data.fetchall()
        
        row = additional_data_rows[0] if additional_data_rows else None
        previous_head_data = {column.name: getattr(previous_saleBill, column.name) for column in previous_saleBill.__table__.columns}
        previous_head_data.update(format_dates(previous_saleBill))

        previous_details_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "previous_head_data": previous_head_data,
            "previous_details_data": previous_details_data
        }
        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#Get Next record by database 
@app.route(API_URL+"/get-nextSaleBill-navigation", methods=["GET"])
def get_nextSaleBill_navigation():
    try:
        current_doc_no = request.args.get('currentDocNo')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code, current_doc_no]):
            return jsonify({"error": "Missing required parameters"}), 400

        next_saleBill = SaleBillHead.query.filter(SaleBillHead.doc_no > current_doc_no).filter_by(Company_Code=Company_Code,Year_Code=Year_Code).order_by(SaleBillHead.doc_no.asc()).first()

        if not next_saleBill:
            return jsonify({"error": "No next records found"}), 404

        next_sale_id = next_saleBill.saleid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"saleid": next_sale_id})
        
        additional_data_rows = additional_data.fetchall()
        
        row = additional_data_rows[0] if additional_data_rows else None
        next_head_data = {column.name: getattr(next_saleBill, column.name) for column in next_saleBill.__table__.columns}
        next_head_data.update(format_dates(next_saleBill))

        next_details_data = [dict(row._mapping) for row in additional_data_rows]

        # Prepare response data
        response = {
            "next_head_data": next_head_data,
            "next_details_data": next_details_data
        }
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/Generate_SaleBill", methods=["PUT"])
def Generate_SaleBill():
    def get_max_doc_no():
        return db.session.query(func.max(SaleBillHead.doc_no)).scalar() or 0

    try:
        max_doc_no = get_max_doc_no()
        updated_doc_no = max_doc_no + 1
        print("New Update Document Number:", updated_doc_no)

        saleid = request.args.get('saleid')
        Company_Code = request.args.get('CompanyCode')
        Year_Code = request.args.get('Year_Code')
        Do_no = request.args.get('DoNo')
        
        if not saleid:
            return jsonify({"error": "Missing 'saleid' parameter"}), 400

        with db.session.begin_nested():
            db.session.execute(
                text('''UPDATE nt_1_sugarsale 
                        SET doc_no = :doc_no
                        WHERE Year_Code = :Year_Code 
                        AND Company_Code = :Company_Code 
                        AND saleid = :saleid'''),
                {'Year_Code': Year_Code, 'Company_Code': Company_Code,
                 'doc_no': updated_doc_no, 'saleid': saleid}
            )
            db.session.execute(
                text('''UPDATE nt_1_sugarsaledetails 
                        SET doc_no = :doc_no
                        WHERE Year_Code = :Year_Code 
                        AND Company_Code = :Company_Code 
                        AND saleid = :saleid'''),
                {'Year_Code': Year_Code, 'Company_Code': Company_Code,
                 'doc_no': updated_doc_no, 'saleid': saleid}
            )

            db.session.execute(
                text('''UPDATE nt_1_deliveryorder 
                        SET SB_No = :SB_No
                        WHERE Year_Code = :Year_Code 
                        AND company_code = :Company_Code 
                        AND doc_no = :Do_no'''),
                {'Year_Code': Year_Code, 'Company_Code': Company_Code,
                 'SB_No': updated_doc_no, 'Do_no': Do_no}
            )
            
            db.session.execute(
                text('''UPDATE nt_1_gledger 
                        SET DOC_NO = :DOC_NO
                        WHERE Year_Code = :Year_Code 
                        AND COMPANY_CODE = :Company_Code 
                        AND saleid = :saleid
                        AND TRAN_TYPE = 'SB' '''),
                {'Year_Code': Year_Code, 'Company_Code': Company_Code,
                 'DOC_NO': updated_doc_no, 'saleid': saleid}
            )

        db.session.commit()   
        
        return jsonify({'Successfully Updated': updated_doc_no}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": "Database error", "message": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500   


@app.route(API_URL+"/generating_saleBill_report", methods=["GET"])
def generating_saleBill_report():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        doc_no = request.args.get('doc_no')

        if not company_code or not year_code or not doc_no:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = ('''SELECT        dbo.qrysalehead.doc_no, dbo.qrysalehead.PURCNO, dbo.qrysalehead.doc_date, dbo.qrysalehead.Ac_Code, dbo.qrysalehead.Unit_Code, dbo.qrysalehead.mill_code, dbo.qrysalehead.FROM_STATION, 
                         dbo.qrysalehead.TO_STATION, dbo.qrysalehead.LORRYNO, dbo.qrysalehead.BROKER, dbo.qrysalehead.wearhouse, dbo.qrysalehead.subTotal, dbo.qrysalehead.LESS_FRT_RATE, dbo.qrysalehead.freight, 
                         dbo.qrysalehead.cash_advance, dbo.qrysalehead.bank_commission, dbo.qrysalehead.OTHER_AMT, dbo.qrysalehead.Bill_Amount, dbo.qrysalehead.Due_Days, dbo.qrysalehead.NETQNTL, dbo.qrysalehead.Company_Code, 
                         dbo.qrysalehead.Year_Code, dbo.qrysalehead.Branch_Code, dbo.qrysalehead.Created_By, dbo.qrysalehead.Modified_By, dbo.qrysalehead.Tran_Type, dbo.qrysalehead.DO_No, dbo.qrysalehead.Transport_Code, 
                         dbo.qrysalehead.RateDiff, dbo.qrysalehead.ASN_No, dbo.qrysalehead.GstRateCode, dbo.qrysalehead.CGSTRate, dbo.qrysalehead.CGSTAmount, dbo.qrysalehead.SGSTRate, dbo.qrysalehead.SGSTAmount, 
                         dbo.qrysalehead.IGSTRate, dbo.qrysalehead.IGSTAmount, dbo.qrysalehead.TaxableAmount, dbo.qrysalehead.EWay_Bill_No, dbo.qrysalehead.EWayBill_Chk, dbo.qrysalehead.MillInvoiceNo, dbo.qrysalehead.RoundOff, 
                         dbo.qrysalehead.saleid, dbo.qrysalehead.ac, dbo.qrysalehead.uc, dbo.qrysalehead.mc, dbo.qrysalehead.bk, dbo.qrysalehead.billtoname, dbo.qrysalehead.billtoaddress, dbo.qrysalehead.billtogstno, 
                         dbo.qrysalehead.billtopanno, dbo.qrysalehead.billtopin, dbo.qrysalehead.billtopincode, dbo.qrysalehead.billtocitystate, dbo.qrysalehead.billtogststatecode, dbo.qrysalehead.shiptoname, dbo.qrysalehead.shiptoaddress, 
                         dbo.qrysalehead.shiptogstno, dbo.qrysalehead.shiptopanno, dbo.qrysalehead.shiptocityname, dbo.qrysalehead.shiptocitypincode, dbo.qrysalehead.shiptocitystate, dbo.qrysalehead.shiptogststatecode, 
                         dbo.qrysalehead.billtoemail, dbo.qrysalehead.shiptoemail, dbo.qrysalehead.millname, dbo.qrysalehead.brokername, dbo.qrysalehead.GST_Name, dbo.qrysalehead.gstrate, dbo.qrysaledetail.detail_id AS itemcode, 
                         dbo.qrysaledetail.item_code, dbo.qrysaledetail.narration, dbo.qrysaledetail.Quantal, dbo.qrysaledetail.packing, dbo.qrysaledetail.bags, dbo.qrysaledetail.rate AS salerate, dbo.qrysaledetail.item_Amount, dbo.qrysaledetail.ic, 
                         dbo.qrysaledetail.saledetailid, dbo.qrysaledetail.itemname, dbo.qrysaledetail.HSN, dbo.qrysalehead.doc_dateConverted, dbo.qrysalehead.tc, dbo.qrysalehead.transportname, dbo.qrysalehead.transportmobile, 
                         dbo.qrysalehead.billtomobileto, dbo.qrysalehead.GSTStateCode AS partygststatecode, dbo.qrysalehead.shiptostatecode, dbo.qrysalehead.DoNarrtion, dbo.qrysalehead.TCS_Rate, dbo.qrysalehead.TCS_Amt, 
                         dbo.qrysalehead.TCS_Net_Payable, dbo.qrysalehead.newsbno, dbo.qrysalehead.newsbdate, dbo.qrysalehead.einvoiceno, dbo.qrysalehead.ackno, dbo.qrysalehead.Delivery_type, dbo.qrysalehead.millshortname, 
                         dbo.qrysalehead.billtostatename, dbo.qrysalehead.shiptoshortname, dbo.qrysalehead.shiptomobileno, dbo.qrysalehead.shiptotinno, dbo.qrysalehead.shiptolocallicno, dbo.qrysaledetail.Brand_Code, CONVERT(varchar, 
                         dbo.qrysalehead.EwayBillValidDate, 103) AS EwayBillValidDate, dbo.qrysalehead.FSSAI_BillTo, dbo.qrysalehead.FSSAI_ShipTo, dbo.qrysalehead.BillToTanNo, dbo.qrysalehead.ShipToTanNo, dbo.qrysalehead.TDS_Rate, 
                         dbo.qrysalehead.TDS_Amt, dbo.qrysalehead.IsDeleted, dbo.qrysalehead.SBNarration, dbo.qrysalehead.QRCode, dbo.qrysalehead.MillFSSAI_No, dbo.qrysaledetail.Brand_Name, '' AS FreightPerQtl, 
                         dbo.company.State_E AS companyStateName, dbo.nt_1_companyparameters.GSTStateCode AS companyGSTStateCode, dbo.qrysalehead.grade, dbo.tblvoucherheadaddress.bankdetail, dbo.company.GST AS companyGSTNo, 
                         dbo.company.City_E AS companyCity, dbo.company.FSSAI_No AS companyFSSAI, dbo.company.Pan_No AS companyPan, dbo.company.TIN AS companyTIN, dbo.tblvoucherheadaddress.AL1, dbo.tblvoucherheadaddress.AL2, 
                         dbo.tblvoucherheadaddress.AL3, dbo.tblvoucherheadaddress.AL4, dbo.tblvoucherheadaddress.Other, dbo.tblvoucherheadaddress.BillFooter, dbo.company.Company_Name_E, dbo.qrysalehead.season, 
                         dbo.qrysalehead.driver_no, dbo.company.PHONE, dbo.carporatehead.created_by AS Expr1, dbo.carporatehead.pono, dbo.accountingyear.year, dbo.qrysalehead.Carporate_Sale_No AS carporateSaleDoc, 
                         dbo.qrysalehead.CarporateBillToGst_No, dbo.qrysalehead.CarporateBillToEmailID, dbo.qrysalehead.Carporate_Tanno, dbo.qrysalehead.CarporateState_Code, dbo.qrysalehead.Carporate_Pan, 
                         dbo.qrysalehead.Carporate_Address, dbo.qrysalehead.CarporateBillTo_Name, dbo.qrysalehead.Mobile_No AS carporateBillToMobileNo, dbo.qrysalehead.cityname AS carporateBillToCityName, 
                         dbo.qrysalehead.Pincode AS carporateBillToPincode, dbo.qrysalehead.State_Name AS carporateBillToStateName, dbo.qrysalehead.FSSAI AS carporateBillToFSSAI, dbo.qrysalehead.sale_rate AS DOSalerate, 
                         dbo.qrysalehead.Tender_Commission, dbo.carporatehead.selling_type, dbo.qrysalehead.BillToWpNo, dbo.qrysalehead.TransportWpNo, dbo.qrysalehead.ShipToWpNo, dbo.qrysalehead.CarporateBillToWpNo, 
                         dbo.qrysalehead.RefWpNo, dbo.qrysalehead.RefMail, dbo.qrysalehead.TransportEmail
FROM            dbo.nt_1_companyparameters INNER JOIN
                         dbo.tblvoucherheadaddress ON dbo.nt_1_companyparameters.Company_Code = dbo.tblvoucherheadaddress.Company_Code INNER JOIN
                         dbo.accountingyear ON dbo.nt_1_companyparameters.Company_Code = dbo.accountingyear.Company_Code AND dbo.nt_1_companyparameters.Year_Code = dbo.accountingyear.yearCode RIGHT OUTER JOIN
                         dbo.carporatehead RIGHT OUTER JOIN
                         dbo.qrysalehead ON dbo.carporatehead.doc_no = dbo.qrysalehead.Carporate_Sale_No AND dbo.carporatehead.company_code = dbo.qrysalehead.Company_Code ON 
                         dbo.nt_1_companyparameters.Year_Code = dbo.qrysalehead.Year_Code AND dbo.nt_1_companyparameters.Company_Code = dbo.qrysalehead.Company_Code LEFT OUTER JOIN
                         dbo.qrysaledetail ON dbo.qrysalehead.saleid = dbo.qrysaledetail.saleid FULL OUTER JOIN
                         dbo.company ON dbo.qrysalehead.Company_Code = dbo.company.Company_Code
                 where dbo.qrysalehead.Company_Code = :company_code and dbo.qrysalehead.Year_Code = :year_code and dbo.qrysalehead.doc_no = :doc_no
                                 '''
            )
        additional_data = db.session.execute(text(query), {"company_code": company_code, "year_code": year_code, "doc_no": doc_no})

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]

        for data in all_data:
            if 'doc_date' in data:
                data['doc_date'] = data['doc_date'].strftime('%Y-%m-%d') if data['doc_date'] else None
        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
@app.route(API_URL + "/DeleteTransactionSale", methods=["DELETE"])
def DeleteTransactionSale():
    try:
        pursno = request.args.get('PURCNO')
        Company_Code = request.args.get("Company_Code")
        Year_Code = request.args.get("Year_Code")
        DO_No = request.args.get("DO_No")


        with db.session.begin():  # Start a transaction
            db.session.execute(
                text('''
                    DELETE FROM nt_1_deliveryorder 
                    WHERE doc_no = :Do_no AND Year_Code = :Year_Code AND company_code = :Company_Code
                '''),
                {'Company_Code': Company_Code, 'Year_Code': Year_Code, 'Do_no': DO_No}
            )

            db.session.execute(
                text('''
                    DELETE FROM nt_1_dodetails 
                    WHERE doc_no = :Do_no AND Year_Code = :Year_Code AND company_code = :Company_Code
                '''),
                {'Company_Code': Company_Code, 'Year_Code': Year_Code, 'Do_no': DO_No}
            )

            db.session.execute(
                text('''
                    DELETE FROM nt_1_gledger 
                    WHERE doc_no = :Do_no AND Year_Code = :Year_Code AND company_code = :Company_Code 
                    AND TRAN_TYPE = 'DO'
                '''),
                {'Company_Code': Company_Code, 'Year_Code': Year_Code, 'Do_no': DO_No}
            )

            db.session.execute(
                text('''
                    DELETE FROM nt_1_sugarpurchase 
                    WHERE doc_no = :Do_no AND Year_Code = :Year_Code AND Company_Code = :Company_Code 
                    
                '''),
                {'Company_Code': Company_Code, 'Year_Code': Year_Code, 'Do_no': pursno}
            )
            
            db.session.execute(
                text('''
                    DELETE FROM nt_1_sugarpurchasedetails 
                    WHERE doc_no = :Do_no AND Year_Code = :Year_Code AND Company_Code = :Company_Code 
                    
                '''),
                {'Company_Code': Company_Code, 'Year_Code': Year_Code, 'Do_no': pursno}
            )    

            db.session.execute(
                text('''
                    DELETE FROM nt_1_gledger 
                    WHERE doc_no = :Do_no AND Year_Code = :Year_Code AND company_code = :Company_Code 
                    AND TRAN_TYPE = 'PS'
                '''),
                {'Company_Code': Company_Code, 'Year_Code': Year_Code, 'Do_no': pursno}
            )

        db.session.commit()

        return jsonify({"message": f"Transaction {DO_No} deleted successfully."}), 200

    except Exception as e:
        db.session.rollback()
       
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
@app.route(API_URL+"/getEwayBillGeneratioData_SB", methods=["GET"])
def getEwayBillGeneratioData_SB():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        doc_no = request.args.get('doc_no')

        if not company_code or not year_code or not doc_no:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = ('''SELECT        dbo.NT_1qryEwaybill.doc_no, CONVERT(varchar, dbo.NT_1qryEwaybill.doc_date, 103) AS doc_date, UPPER(dbo.NT_1qryEwaybill.BillToName) AS BillToName, UPPER(dbo.NT_1qryEwaybill.BillToGst) AS BillToGst, 
                         UPPER(dbo.NT_1qryEwaybill.ShippTo) AS ShippTo, UPPER(dbo.NT_1qryEwaybill.Address_E) AS Address_E, UPPER(dbo.NT_1qryEwaybill.city_name_e) AS city_name_e, (CASE Pincode WHEN 0 THEN 999999 ELSE pincode END)
                          AS pincode, dbo.NT_1qryEwaybill.State_Name, dbo.NT_1qryEwaybill.NETQNTL, dbo.NT_1qryEwaybill.TaxableAmount, CONVERT(varchar, dbo.NT_1qryEwaybill.CGSTRate, 0) + '+' + CONVERT(varchar, 
                         dbo.NT_1qryEwaybill.SGSTRate, 0) + '+' + CONVERT(varchar, dbo.NT_1qryEwaybill.IGSTRate, 0) + '+' + '0' + '+' + '0' AS Taxrate, dbo.NT_1qryEwaybill.CGSTAmount, dbo.NT_1qryEwaybill.SGSTAmount, 
                         dbo.NT_1qryEwaybill.IGSTAmount, 0 AS Distance, dbo.NT_1qryEwaybill.LORRYNO, UPPER(dbo.NT_1qryEwaybill.millname) AS millname, UPPER(dbo.NT_1qryEwaybill.milladdress) AS milladdress, 
                         (CASE millpincode WHEN 0 THEN 999999 ELSE millpincode END) AS millpincode, dbo.NT_1qryEwaybill.millcityname, dbo.NT_1qryEwaybill.DO_No, dbo.NT_1qryEwaybill.millstatename, CONVERT(varchar, 
                         dbo.NT_1qryEwaybill.doc_date, 103) AS TransDate, dbo.NT_1qryEwaybill.CGSTRate, dbo.NT_1qryEwaybill.SGSTRate, dbo.NT_1qryEwaybill.IGSTRate, dbo.NT_1qryEwaybill.state_code_billto as toStateCode, 
                         dbo.NT_1qryEwaybill.millstatecode, dbo.NT_1qryEwaybill.GSTStateCode, dbo.NT_1qryEwaybill.mill_code, dbo.NT_1qryEwaybill.Unit_Code, dbo.NT_1qryEwaybill.System_Name_E, dbo.NT_1qryEwaybill.HSN, 
                         dbo.NT_1qryEwaybill.Unit, dbo.company.Company_Name_E, dbo.company.City_E, dbo.company.State_E AS companyState, dbo.company.GST AS fromGstin, dbo.accountingyear.year, 
                         dbo.nt_1_companyparameters.GSTStateCode AS fromStateCode,dbo.NT_1qryEwaybill.Pincode AS ShipToPinCode, dbo.company.PIN, dbo.NT_1qryEwaybill.BillToPinCode


FROM            dbo.NT_1qryEwaybill INNER JOIN
                         dbo.company ON dbo.NT_1qryEwaybill.Company_Code = dbo.company.Company_Code INNER JOIN
                         dbo.accountingyear ON dbo.NT_1qryEwaybill.Company_Code = dbo.accountingyear.Company_Code AND dbo.NT_1qryEwaybill.Year_Code = dbo.accountingyear.yearCode INNER JOIN
                         dbo.nt_1_companyparameters ON dbo.NT_1qryEwaybill.Company_Code = dbo.nt_1_companyparameters.Company_Code AND dbo.NT_1qryEwaybill.Year_Code = dbo.nt_1_companyparameters.Year_Code
WHERE        (dbo.NT_1qryEwaybill.Company_Code = :company_code) AND (dbo.NT_1qryEwaybill.doc_no = :doc_no) AND (dbo.NT_1qryEwaybill.Year_Code = :year_code)
                                 '''
            )
        additional_data = db.session.execute(text(query), {"company_code": company_code, "year_code": year_code, "doc_no": doc_no})

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]

        for data_row in all_data:
            if 'doc_date' in data_row and data_row['doc_date']:
                try:
                    date_obj = datetime.strptime(data_row['doc_date'], "%d/%m/%Y")
                    data_row['doc_date'] = date_obj.strftime("%Y-%m-%d")
                except ValueError:
                    data_row['doc_date'] = None
            else:
                data_row['doc_date'] = None

        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/get_eInvoice_generationData_SB", methods=["GET"])
def get_eInvoice_generationData_SB():
    try:
        doc_no = request.args.get('doc_no')
        do_no = request.args.get('do_no')
        companyCode = request.args.get('Company_Code')
        yearCode = request.args.get('Year_Code')

        if not doc_no or not companyCode or not yearCode:
            return jsonify({"error": "Missing required parameter"}), 400

        corporate_sale_check_query = '''
            SELECT Carporate_Sale_No 
            FROM dbo.NT_1qryEInvoiceCarporateSale
            WHERE Company_Code = :companyCode AND Year_Code = :yearCode AND doc_no = :doc_no
        '''

        corporate_sale_check = db.session.execute(
            text(corporate_sale_check_query), 
            {"companyCode": companyCode, "yearCode": yearCode, "doc_no": doc_no}
        ).fetchone()

        if do_no == 0 or do_no == "":

            if corporate_sale_check and 'Carporate_Sale_No' in corporate_sale_check and corporate_sale_check['Carporate_Sale_No'] != 0:
                query = '''
    SELECT  dbo.NT_1qryEInvoiceCarporateSale.doc_no AS Doc_No, CONVERT(varchar, dbo.NT_1qryEInvoiceCarporateSale.doc_date, 103) AS doc_date, UPPER(dbo.NT_1qryEInvoiceCarporateSale.BuyerGst_No) AS BuyerGst_No, 
                            UPPER(dbo.NT_1qryEInvoiceCarporateSale.Buyer_Name) AS Buyer_Name, UPPER(dbo.NT_1qryEInvoiceCarporateSale.Buyer_Address) AS Buyer_Address, UPPER(dbo.NT_1qryEInvoiceCarporateSale.Buyer_City) 
                            AS Buyer_City, (CASE Buyer_Pincode WHEN 0 THEN 999999 ELSE Buyer_Pincode END) AS Buyer_Pincode, UPPER(dbo.NT_1qryEInvoiceCarporateSale.Buyer_State_name) AS Buyer_State_name, 
                            dbo.NT_1qryEInvoiceCarporateSale.Buyer_State_Code, dbo.NT_1qryEInvoiceCarporateSale.Buyer_Phno, dbo.NT_1qryEInvoiceCarporateSale.Buyer_Email_Id, UPPER(dbo.NT_1qryEInvoiceCarporateSale.DispatchGst_No) 
                            AS DispatchGst_No, UPPER(dbo.NT_1qryEInvoiceCarporateSale.Dispatch_Name) AS Dispatch_Name, UPPER(dbo.NT_1qryEInvoiceCarporateSale.Dispatch_Address) AS Dispatch_Address, 
                            UPPER(dbo.NT_1qryEInvoiceCarporateSale.DispatchCity_City) AS DispatchCity_City, dbo.NT_1qryEInvoiceCarporateSale.Dispatch_GSTStateCode, (CASE Dispatch_Pincode WHEN 0 THEN 999999 ELSE Dispatch_Pincode END) 
                            AS Dispatch_Pincode, UPPER(dbo.NT_1qryEInvoiceCarporateSale.ShipToGst_No) AS ShipToGst_No, UPPER(dbo.NT_1qryEInvoiceCarporateSale.ShipTo_Name) AS ShipTo_Name, 
                            UPPER(dbo.NT_1qryEInvoiceCarporateSale.ShipTo_Address) AS ShipTo_Address, UPPER(dbo.NT_1qryEInvoiceCarporateSale.ShipTo_City) AS ShipTo_City, dbo.NT_1qryEInvoiceCarporateSale.ShipTo_GSTStateCode, 
                            (CASE ShipTo_Pincode WHEN 0 THEN 999999 ELSE ShipTo_Pincode END) AS ShipTo_Pincode, dbo.NT_1qryEInvoiceCarporateSale.NETQNTL, dbo.NT_1qryEInvoiceCarporateSale.rate, 
                            dbo.NT_1qryEInvoiceCarporateSale.CGSTAmount, dbo.NT_1qryEInvoiceCarporateSale.SGSTAmount, dbo.NT_1qryEInvoiceCarporateSale.IGSTAmount, dbo.NT_1qryEInvoiceCarporateSale.TaxableAmount, 
                            ISNULL(dbo.NT_1qryEInvoiceCarporateSale.CGSTRate, 0) AS CGSTRate, ISNULL(dbo.NT_1qryEInvoiceCarporateSale.SGSTRate, 0) AS SGSTRate, ISNULL(dbo.NT_1qryEInvoiceCarporateSale.IGSTRate, 0) AS IGSTRate, 
                            0 AS Expr1, dbo.NT_1qryEInvoiceCarporateSale.LORRYNO, dbo.NT_1qryEInvoiceCarporateSale.System_Name_E, dbo.NT_1qryEInvoiceCarporateSale.HSN, dbo.NT_1qryEInvoiceCarporateSale.GSTRate, 
                            dbo.NT_1qryEInvoiceCarporateSale.LESS_FRT_RATE, dbo.NT_1qryEInvoiceCarporateSale.saleid, dbo.NT_1qryEInvoiceCarporateSale.Bill_Amount AS billAmount, dbo.company.Company_Name_E, dbo.company.Address_E, 
                            dbo.company.City_E, dbo.company.State_E, dbo.company.PIN, dbo.company.PHONE, dbo.company.GST, dbo.tbluser.EmailId, dbo.eway_bill.Branch, dbo.eway_bill.Account_Details, dbo.eway_bill.Mode_of_Payment, 
                            dbo.nt_1_companyparameters.GSTStateCode, dbo.accountingyear.year
    FROM  dbo.eway_bill RIGHT OUTER JOIN
                            dbo.nt_1_companyparameters INNER JOIN
                            dbo.NT_1qryEInvoiceCarporateSale ON dbo.nt_1_companyparameters.Company_Code = dbo.NT_1qryEInvoiceCarporateSale.Company_Code AND 
                            dbo.nt_1_companyparameters.Year_Code = dbo.NT_1qryEInvoiceCarporateSale.Year_Code INNER JOIN
                            dbo.accountingyear ON dbo.NT_1qryEInvoiceCarporateSale.Company_Code = dbo.accountingyear.Company_Code AND dbo.NT_1qryEInvoiceCarporateSale.Year_Code = dbo.accountingyear.yearCode ON 
                            dbo.eway_bill.Company_Code = dbo.NT_1qryEInvoiceCarporateSale.Company_Code LEFT OUTER JOIN
                            dbo.company ON dbo.NT_1qryEInvoiceCarporateSale.Company_Code = dbo.company.Company_Code LEFT OUTER JOIN
                            dbo.tbluser ON dbo.company.Company_Code = dbo.tbluser.Company_Code AND dbo.company.Created_By = dbo.tbluser.EmailId
                WHERE dbo.NT_1qryEInvoiceCarporateSale.Company_Code = :companyCode
                AND dbo.NT_1qryEInvoiceCarporateSale.Year_Code = :yearCode
                AND dbo.NT_1qryEInvoiceCarporateSale.DO_No = :do_no
                '''
            else:
                query = '''
                        SELECT        dbo.NT_1qryEInvoice.doc_no AS Doc_No, CONVERT(varchar, dbo.NT_1qryEInvoice.doc_date, 103) AS doc_date, UPPER(dbo.NT_1qryEInvoice.BuyerGst_No) AS BuyerGst_No, UPPER(dbo.NT_1qryEInvoice.Buyer_Name) 
                         AS Buyer_Name, UPPER(dbo.NT_1qryEInvoice.Buyer_Address) AS Buyer_Address, UPPER(dbo.NT_1qryEInvoice.Buyer_City) AS Buyer_City, (CASE Buyer_Pincode WHEN 0 THEN 999999 ELSE Buyer_Pincode END) 
                         AS Buyer_Pincode, UPPER(dbo.NT_1qryEInvoice.Buyer_State_name) AS Buyer_State_name, dbo.NT_1qryEInvoice.Buyer_State_Code, dbo.NT_1qryEInvoice.Buyer_Phno, dbo.NT_1qryEInvoice.Buyer_Email_Id, 
                         UPPER(dbo.NT_1qryEInvoice.DispatchGst_No) AS DispatchGst_No, UPPER(dbo.NT_1qryEInvoice.Dispatch_Name) AS Dispatch_Name, UPPER(dbo.NT_1qryEInvoice.Dispatch_Address) AS Dispatch_Address, 
                         UPPER(dbo.NT_1qryEInvoice.DispatchCity_City) AS DispatchCity_City, dbo.NT_1qryEInvoice.Dispatch_GSTStateCode, (CASE Dispatch_Pincode WHEN 0 THEN 999999 ELSE Dispatch_Pincode END) AS Dispatch_Pincode, 
                         UPPER(dbo.NT_1qryEInvoice.ShipToGst_No) AS ShipToGst_No, UPPER(dbo.NT_1qryEInvoice.ShipTo_Name) AS ShipTo_Name, UPPER(dbo.NT_1qryEInvoice.ShipTo_Address) AS ShipTo_Address, 
                         UPPER(dbo.NT_1qryEInvoice.ShipTo_City) AS ShipTo_City, dbo.NT_1qryEInvoice.ShipTo_GSTStateCode, (CASE ShipTo_Pincode WHEN 0 THEN 999999 ELSE ShipTo_Pincode END) AS ShipTo_Pincode, 
                         dbo.NT_1qryEInvoice.NETQNTL, dbo.NT_1qryEInvoice.rate, dbo.NT_1qryEInvoice.CGSTAmount, dbo.NT_1qryEInvoice.SGSTAmount, dbo.NT_1qryEInvoice.IGSTAmount, dbo.NT_1qryEInvoice.TaxableAmount, 
                         ISNULL(dbo.NT_1qryEInvoice.CGSTRate, 0) AS CGSTRate, ISNULL(dbo.NT_1qryEInvoice.SGSTRate, 0) AS SGSTRate, ISNULL(dbo.NT_1qryEInvoice.IGSTRate, 0) AS IGSTRate, dbo.NT_1qryEInvoice.Distance, 
                         dbo.NT_1qryEInvoice.LORRYNO, dbo.NT_1qryEInvoice.System_Name_E, dbo.NT_1qryEInvoice.HSN, dbo.NT_1qryEInvoice.GSTRate, dbo.NT_1qryEInvoice.LESS_FRT_RATE, dbo.NT_1qryEInvoice.Unit, 
                         dbo.company.Company_Name_E, dbo.company.Address_E, dbo.company.City_E, dbo.company.State_E, dbo.company.PIN, dbo.company.Pan_No, dbo.company.PHONE, dbo.company.GST, dbo.tbluser.EmailId, 
                         dbo.eway_bill.Mode_of_Payment, dbo.eway_bill.Account_Details, dbo.eway_bill.Branch, dbo.nt_1_companyparameters.GSTStateCode, dbo.accountingyear.year
FROM            dbo.accountingyear RIGHT OUTER JOIN
                         dbo.NT_1qryEInvoice ON dbo.accountingyear.Company_Code = dbo.NT_1qryEInvoice.Company_Code AND dbo.accountingyear.yearCode = dbo.NT_1qryEInvoice.Year_Code LEFT OUTER JOIN
                         dbo.nt_1_companyparameters ON dbo.NT_1qryEInvoice.Company_Code = dbo.nt_1_companyparameters.Company_Code AND dbo.NT_1qryEInvoice.Year_Code = dbo.nt_1_companyparameters.Year_Code LEFT OUTER JOIN
                         dbo.eway_bill ON dbo.NT_1qryEInvoice.Company_Code = dbo.eway_bill.Company_Code LEFT OUTER JOIN
                         dbo.tbluser RIGHT OUTER JOIN
                         dbo.company ON dbo.tbluser.User_Name = dbo.company.Modified_By ON dbo.NT_1qryEInvoice.Company_Code = dbo.company.Company_Code
WHERE        (dbo.NT_1qryEInvoice.Company_Code = :companyCode) AND (dbo.NT_1qryEInvoice.Year_Code = :yearCode) AND (dbo.NT_1qryEInvoice.DO_No = :do_no)
                        '''
        else:
            query = '''
         SELECT        dbo.NT_1qryEInvoice.doc_no AS Doc_No, CONVERT(varchar, dbo.NT_1qryEInvoice.doc_date, 103) AS doc_date, UPPER(dbo.NT_1qryEInvoice.BuyerGst_No) AS BuyerGst_No, UPPER(dbo.NT_1qryEInvoice.Buyer_Name) 
                         AS Buyer_Name, UPPER(dbo.NT_1qryEInvoice.Buyer_Address) AS Buyer_Address, UPPER(dbo.NT_1qryEInvoice.Buyer_City) AS Buyer_City, (CASE Buyer_Pincode WHEN 0 THEN 999999 ELSE Buyer_Pincode END) 
                         AS Buyer_Pincode, UPPER(dbo.NT_1qryEInvoice.Buyer_State_name) AS Buyer_State_name, dbo.NT_1qryEInvoice.Buyer_State_Code, dbo.NT_1qryEInvoice.Buyer_Phno, dbo.NT_1qryEInvoice.Buyer_Email_Id, 
                         UPPER(dbo.NT_1qryEInvoice.DispatchGst_No) AS DispatchGst_No, UPPER(dbo.NT_1qryEInvoice.Dispatch_Name) AS Dispatch_Name, UPPER(dbo.NT_1qryEInvoice.Dispatch_Address) AS Dispatch_Address, 
                         UPPER(dbo.NT_1qryEInvoice.DispatchCity_City) AS DispatchCity_City, dbo.NT_1qryEInvoice.Dispatch_GSTStateCode, (CASE Dispatch_Pincode WHEN 0 THEN 999999 ELSE Dispatch_Pincode END) AS Dispatch_Pincode, 
                         UPPER(dbo.NT_1qryEInvoice.ShipToGst_No) AS ShipToGst_No, UPPER(dbo.NT_1qryEInvoice.ShipTo_Name) AS ShipTo_Name, UPPER(dbo.NT_1qryEInvoice.ShipTo_Address) AS ShipTo_Address, 
                         UPPER(dbo.NT_1qryEInvoice.ShipTo_City) AS ShipTo_City, dbo.NT_1qryEInvoice.ShipTo_GSTStateCode, (CASE ShipTo_Pincode WHEN 0 THEN 999999 ELSE ShipTo_Pincode END) AS ShipTo_Pincode, 
                         dbo.NT_1qryEInvoice.NETQNTL, dbo.NT_1qryEInvoice.rate, dbo.NT_1qryEInvoice.CGSTAmount, dbo.NT_1qryEInvoice.SGSTAmount, dbo.NT_1qryEInvoice.IGSTAmount, dbo.NT_1qryEInvoice.TaxableAmount, 
                         ISNULL(dbo.NT_1qryEInvoice.CGSTRate, 0) AS CGSTRate, ISNULL(dbo.NT_1qryEInvoice.SGSTRate, 0) AS SGSTRate, ISNULL(dbo.NT_1qryEInvoice.IGSTRate, 0) AS IGSTRate, dbo.NT_1qryEInvoice.Distance, 
                         dbo.NT_1qryEInvoice.LORRYNO, dbo.NT_1qryEInvoice.System_Name_E, dbo.NT_1qryEInvoice.HSN, dbo.NT_1qryEInvoice.GSTRate, dbo.NT_1qryEInvoice.LESS_FRT_RATE, dbo.nt_1_companyparameters.GSTStateCode, 
                         dbo.company.Company_Name_E, dbo.company.Address_E, dbo.company.City_E, dbo.company.State_E, dbo.company.PIN, dbo.company.PHONE, dbo.company.GST, dbo.eway_bill.Mode_of_Payment, 
                         dbo.eway_bill.Account_Details, dbo.tbluser.EmailId, dbo.eway_bill.Branch, dbo.NT_1qryEInvoice.saleid, dbo.NT_1qryEInvoice.IsService, dbo.NT_1qryEInvoice.Bill_Amount AS billAmount, dbo.accountingyear.year
FROM  dbo.accountingyear INNER JOIN
                         dbo.NT_1qryEInvoice ON dbo.accountingyear.yearCode = dbo.NT_1qryEInvoice.Year_Code AND dbo.accountingyear.Company_Code = dbo.NT_1qryEInvoice.Company_Code LEFT OUTER JOIN
                         dbo.tbluser RIGHT OUTER JOIN
                         dbo.nt_1_companyparameters ON dbo.tbluser.User_Name = dbo.nt_1_companyparameters.Created_By ON dbo.NT_1qryEInvoice.Company_Code = dbo.nt_1_companyparameters.Company_Code AND 
                         dbo.NT_1qryEInvoice.Year_Code = dbo.nt_1_companyparameters.Year_Code LEFT OUTER JOIN
                         dbo.company ON dbo.NT_1qryEInvoice.Company_Code = dbo.company.Company_Code LEFT OUTER JOIN
                         dbo.eway_bill ON dbo.NT_1qryEInvoice.Company_Code = dbo.eway_bill.Company_Code
            WHERE dbo.NT_1qryEInvoice.Company_Code = :companyCode
              AND dbo.NT_1qryEInvoice.Year_Code = :yearCode
              AND dbo.NT_1qryEInvoice.doc_no = :do_no
            '''

        # Execute the chosen query
        additional_data = db.session.execute(
            text(query), 
            {"companyCode": companyCode, "yearCode": yearCode, "doc_no": doc_no, "do_no": do_no}
        )

        # Process the results
        additional_data_rows = additional_data.fetchall()
        all_data = [dict(row._mapping) for row in additional_data_rows]

        for data in all_data:
            if 'doc_date' in data and data['doc_date']:
                date_obj = datetime.strptime(data['doc_date'], "%d/%m/%Y")
                data['doc_date'] = date_obj.strftime("%Y-%m-%d")
            else:
                data['doc_date'] = None

        # Return the response
        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

