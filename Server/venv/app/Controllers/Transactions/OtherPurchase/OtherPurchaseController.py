import traceback
from flask import Flask, jsonify, request
from app import app, db
from app.models.Transactions.OtherPurchaseModels import OtherPurchase
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import func
import os
import requests
from app.utils.CommonGLedgerFunctions import fetch_company_parameters,get_accoid,getPurchaseAc,create_gledger_entry,send_gledger_entries

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')
API_URL_SERVER = os.getenv('API_URL_SERVER')


#Add GLedger Enteries
trans_typeNew  = "XP"
DRCRHead = "C"
DRCRDetail ="D"
ac_code=0
ordercode=0
new_doc_no=0
narration=''

def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid,ordercode):
    if amount > 0:
        entries.append(create_gledger_entry(data, amount, drcr, ac_code, accoid,ordercode,trans_typeNew,new_doc_no,narration))

#Create GLedger Enteries
def create_gledger_entries(headData, detailData, doc_no):
    gledger_entries = []
    
    IGSTAmount = float(headData.get('IGST_Amount', 0) or 0)
    SGSTAmount = float(headData.get('SGST_Amount', 0) or 0)
    CGSTAmount = float(headData.get('CGST_Amount', 0) or 0)
    Other_Amount = float(headData.get('Other_Amount', 0) or 0)
    TDS_Amt = float(headData.get('TDS', 0) or 0)
    bill_amount = float(headData.get('Bill_Amount', 0) or 0)
    ExpensisAmt = float(headData.get('ExpensisAmt', 0) or 0)
    ProvisionAmt = float(headData.get('ProvisionAmt', 0) or 0)

    company_parameters = fetch_company_parameters(headData.get('Company_Code'), headData.get('Year_Code'))
    ordercode = 0

    for amount, ac_code in [
        (IGSTAmount, company_parameters.PurchaseIGSTAc),
        (CGSTAmount, company_parameters.PurchaseCGSTAc),
        (SGSTAmount, company_parameters.PurchaseSGSTAc),
    ]:
        if amount > 0:
            ordercode += 1
            accoid = get_accoid(ac_code, headData.get('Company_Code'))
            add_gledger_entry(gledger_entries, headData, amount, DRCRDetail, ac_code, accoid, ordercode)

    if bill_amount > 0:
        add_gledger_entry(gledger_entries, headData, bill_amount,DRCRHead, headData['Supplier_Code'], get_accoid(headData['Supplier_Code'],headData['Company_Code']),ordercode)

    if Other_Amount != 0:
        if Other_Amount > 0:
            ordercode += 1
            ac_code = company_parameters.RoundOff
            accoid = get_accoid(ac_code, headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, Other_Amount, DRCRDetail, ac_code, accoid, ordercode)

        else:
            ordercode += 1
            ac_code = company_parameters.RoundOff
            accoid = get_accoid(ac_code, headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, abs(Other_Amount), DRCRHead, ac_code, accoid, ordercode)

    if headData['TDS_AcCode'] > 0:
        if TDS_Amt > 0:
            ordercode += 1
            ac_code = headData['TDS_Cutt_AcCode']
            accoid = get_accoid(ac_code, headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, TDS_Amt, DRCRDetail, ac_code, accoid, ordercode)

            ordercode += 1
            ac_code = headData['TDS_AcCode']
            accoid = get_accoid(ac_code, headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, TDS_Amt, DRCRHead, ac_code, accoid, ordercode)

    if ProvisionAmt > 0:
        ordercode += 1
        ac_code = headData['Provision_Ac']
        accoid = get_accoid(ac_code, headData['Company_Code'])
        add_gledger_entry(gledger_entries, headData, ProvisionAmt, DRCRDetail, ac_code, accoid, ordercode)

    if ExpensisAmt > 0:
        ordercode += 1
        ac_code = headData['Exp_Ac']
        accoid = get_accoid(ac_code, headData['Company_Code'])
        add_gledger_entry(gledger_entries, headData, ExpensisAmt, DRCRDetail, ac_code, accoid, ordercode)
    
    
    return gledger_entries



TASK_DETAILS_QUERY = '''
SELECT        dbo.nt_1_gstratemaster.GST_Name, qrymsttdaccode.Ac_Name_E AS tdsacname, qrymsttdscutaccode.Ac_Name_E AS TDSCutAcName, qrymstexp.Ac_Name_E AS ExpAcName, qrymstsuppiler.Ac_Name_E AS SupplierName, 
                         ProvisionAc.Ac_Name_E AS provisionAcName, dbo.nt_1_systemmaster.System_Name_E AS groupName
FROM            dbo.nt_1_other_purchase INNER JOIN
                         dbo.nt_1_systemmaster ON dbo.nt_1_other_purchase.gcid = dbo.nt_1_systemmaster.systemid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS ProvisionAc ON dbo.nt_1_other_purchase.pa = ProvisionAc.accoid LEFT OUTER JOIN
                         dbo.nt_1_gstratemaster ON dbo.nt_1_other_purchase.Company_Code = dbo.nt_1_gstratemaster.Company_Code AND dbo.nt_1_other_purchase.GST_RateCode = dbo.nt_1_gstratemaster.Doc_no LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymsttdaccode ON dbo.nt_1_other_purchase.tac = qrymsttdaccode.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymsttdscutaccode ON dbo.nt_1_other_purchase.tca = qrymsttdscutaccode.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymstexp ON dbo.nt_1_other_purchase.ea = qrymstexp.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymstsuppiler ON dbo.nt_1_other_purchase.sc = qrymstsuppiler.accoid
WHERE dbo.nt_1_other_purchase.opid=:opid
'''

def format_dates(task):
    return {
        "Doc_Date": task.Doc_Date.strftime('%Y-%m-%d') if task.Doc_Date else None,
    }

@app.route(API_URL + "/getall-OtherPurchase", methods=["GET"])
def get_OtherPurchase():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = ('''SELECT       qrymstsuppiler.Ac_Name_E AS SupplierName, dbo.nt_1_other_purchase.Doc_No, dbo.nt_1_other_purchase.Doc_Date, dbo.nt_1_other_purchase.Bill_Amount, dbo.nt_1_other_purchase.Narration, 
                         dbo.nt_1_other_purchase.opid
FROM            dbo.nt_1_other_purchase LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymstsuppiler ON dbo.nt_1_other_purchase.sc = qrymstsuppiler.accoid
                 				 where dbo.nt_1_other_purchase.Company_Code = :company_code and dbo.nt_1_other_purchase.Year_Code= :year_code
ORDER BY dbo.nt_1_other_purchase.Doc_No DESC
                                 '''
            )
        additional_data = db.session.execute(text(query), {"company_code": company_code, "year_code": year_code})

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]

        for data in all_data:
            if 'Doc_Date' in data:
                data['Doc_Date'] = data['Doc_Date'].strftime('%Y-%m-%d') if data['Doc_Date'] else None

        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
@app.route(API_URL + "/get-next-doc-no-OtherPurchase", methods=["GET"])
def get_next_doc_no_OtherPurchase():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        try:
            Company_Code = int(Company_Code)
            Year_Code = int(Year_Code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or Year_Code parameter'}), 400

        max_doc_no = db.session.query(func.max(OtherPurchase.Doc_No)).filter_by(Company_Code=Company_Code, Year_Code=Year_Code).scalar()

        if max_doc_no is None:
            next_doc_no = 1
        else:
            next_doc_no = max_doc_no + 1

        return jsonify({"next_doc_no": next_doc_no}), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/get-OtherPurchase-lastRecord", methods=["GET"])
def get_OtherPurchase_lastRecord():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        last_Record = OtherPurchase.query.filter_by(Company_Code=Company_Code, Year_Code=Year_Code).order_by(OtherPurchase.Doc_No.desc()).first()

        if not last_Record:
            return jsonify({"error": "No record found for the provided Company_Code and Year_Code"}), 404

        last_Record_data = {column.name: getattr(last_Record, column.name) for column in last_Record.__table__.columns}
        last_Record_data.update(format_dates(last_Record))

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"opid": last_Record.opid})
        additional_data_row = additional_data.fetchone()

        labels = dict(additional_data_row._mapping) if additional_data_row else {}

        response = {
            "last_OtherPurchase_data": last_Record_data,
            "labels": labels
        }

        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/get-OtherPurchaseSelectedRecord", methods=["GET"])
def get_OtherPurchaseSelectedRecord():
    try:
        Doc_No = request.args.get('Doc_No')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([Doc_No, Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        try:
            Doc_No = int(Doc_No)
            Company_Code = int(Company_Code)
            Year_Code = int(Year_Code)
        except ValueError:
            return jsonify({"error": "Invalid Doc_No, Company_Code, or Year_Code parameter"}), 400

        Record = OtherPurchase.query.filter_by(Doc_No=Doc_No, Company_Code=Company_Code, Year_Code=Year_Code).first()

        if not Record:
            return jsonify({"error": "Selected Record not found"}), 404

        Record_data = {column.name: getattr(Record, column.name) for column in Record.__table__.columns}
        Record_data.update(format_dates(Record))

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"opid": Record.opid})
        additional_data_row = additional_data.fetchone()

        labels = dict(additional_data_row._mapping) if additional_data_row else {}

        response = {
            "selected_Record_data": Record_data,
            "labels": labels
        }

        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/create-Record-OtherPurchase", methods=["POST"])
def create_OtherPurchase():
    try:
        Company_Code = request.json.get('Company_Code')
        Year_Code = request.json.get('Year_Code')
        
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing Company_Code or Year_Code parameter"}), 400

        try:
            Company_Code = int(Company_Code)
            Year_Code = int(Year_Code)
        except ValueError:
            return jsonify({"error": "Invalid Company_Code or Year_Code parameter"}), 400

        max_doc_no = db.session.query(func.max(OtherPurchase.Doc_No)).filter_by(Company_Code=Company_Code, Year_Code=Year_Code).scalar() or 0

        new_record_data = request.json
        new_record_data['Doc_No'] = max_doc_no + 1
        new_record_data['Company_Code'] = Company_Code
        new_record_data['Year_Code'] = Year_Code

        new_record = OtherPurchase(**new_record_data)
        db.session.add(new_record)
        db.session.commit()

        gledger_entries = create_gledger_entries(new_record_data, '', new_record.Doc_No)

        response = send_gledger_entries(new_record_data, gledger_entries,trans_typeNew)

        if response.status_code != 201:
            db.session.rollback()
            
            return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

        return jsonify({
            "message": "Record created successfully",
            "record": new_record_data
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route(API_URL + "/update-OtherPurchase", methods=["PUT"])
def update_OtherPurchase():
    try:
        Company_Code = request.json.get('Company_Code')
        Doc_No = request.json.get('Doc_No')
        Year_Code = request.json.get('Year_Code')
        
        if not all([Company_Code, Doc_No, Year_Code]):
            return jsonify({"error": "Missing Company_Code, Doc_No, or Year_Code parameter"}), 400

        try:
            Company_Code = int(Company_Code)
            Doc_No = int(Doc_No)
            Year_Code = int(Year_Code)
        except ValueError:
            return jsonify({"error": "Invalid Company_Code, Doc_No, or Year_Code parameter"}), 400

        existing_record = OtherPurchase.query.filter_by(Doc_No=Doc_No, Company_Code=Company_Code, Year_Code=Year_Code).first()
        if not existing_record:
            return jsonify({"error": "Record not found"}), 404

        update_data = request.json
        for key, value in update_data.items():
            setattr(existing_record, key, value)

        db.session.commit()

        gledger_entries = create_gledger_entries(update_data, '', Doc_No)

        response = send_gledger_entries(update_data, gledger_entries,trans_typeNew)

        if response.status_code != 201:
            db.session.rollback()
            
            return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

        return jsonify({
            "message": "Record updated successfully",
            "record": update_data
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route(API_URL + "/delete-OtherPurchase", methods=["DELETE"])
def delete_OtherPurchase():
    try:
        Doc_No = request.args.get('Doc_No')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([Doc_No, Company_Code, Year_Code]):
            return jsonify({"error": "Missing Doc_No, Company_Code, or Year_Code parameter"}), 400

        try:
            Doc_No = int(Doc_No)
            Company_Code = int(Company_Code)
            Year_Code = int(Year_Code)
        except ValueError:
            return jsonify({"error": "Invalid Doc_No, Company_Code, or Year_Code parameter"}), 400

        existing_record = OtherPurchase.query.filter_by(Doc_No=Doc_No, Company_Code=Company_Code, Year_Code=Year_Code).first()
        print("existing_record",existing_record)
        if not existing_record:
            return jsonify({"error": "Record not found"}), 404

        db.session.delete(existing_record)
        if existing_record:
                query_params = {
                    'Company_Code': Company_Code,
                    'DOC_NO': Doc_No,
                    'Year_Code': Year_Code,
                    'TRAN_TYPE': "XP",
            }

        response = requests.delete(API_URL_SERVER+"/delete-Record-gLedger", params=query_params)
            
        if response.status_code != 200:
            raise Exception("Failed to create record in gLedger")
        
        db.session.commit()


        return jsonify({"message": "Record deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route(API_URL + "/get-first-OtherPurchase", methods=["GET"])
def get_first_OtherPurchase():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        first_Record = OtherPurchase.query.filter_by(Company_Code=Company_Code, Year_Code=Year_Code).order_by(OtherPurchase.Doc_No.asc()).first()
        
        if not first_Record:
            return jsonify({"error": "No records found for the provided Company_Code and Year_Code"}), 404

        first_Record_data = {column.name: getattr(first_Record, column.name) for column in first_Record.__table__.columns}
        first_Record_data.update(format_dates(first_Record))

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"opid": first_Record.opid})
        additional_data_row = additional_data.fetchone()

        labels = dict(additional_data_row._mapping) if additional_data_row else {}

        response = {
            "first_OtherPurchase_data": first_Record_data,
            "labels": labels
        }

        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500



@app.route(API_URL + "/get-previous-OtherPurchase", methods=["GET"])
def get_previous_OtherPurchase():
    try:
        Doc_No = request.args.get('Doc_No')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([Doc_No, Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        try:
            Doc_No = int(Doc_No)
            Company_Code = int(Company_Code)
            Year_Code = int(Year_Code)
        except ValueError:
            return jsonify({"error": "Invalid Doc_No, Company_Code, or Year_Code parameter"}), 400

        previous_Record = OtherPurchase.query.filter(
            OtherPurchase.Doc_No < Doc_No,
            OtherPurchase.Company_Code == Company_Code,
            OtherPurchase.Year_Code == Year_Code
        ).order_by(OtherPurchase.Doc_No.desc()).first()

        if not previous_Record:
            return jsonify({"error": "No previous record found"}), 404

        previous_Record_data = {column.name: getattr(previous_Record, column.name) for column in previous_Record.__table__.columns}
        previous_Record_data.update(format_dates(previous_Record))

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"opid": previous_Record.opid})
        additional_data_row = additional_data.fetchone()

        labels = dict(additional_data_row._mapping) if additional_data_row else {}

        response = {
            "previous_OtherPurchase_data": previous_Record_data,
            "labels": labels
        }

        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/get-next-OtherPurchase", methods=["GET"])
def get_next_OtherPurchase():
    try:
        Doc_No = request.args.get('Doc_No')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([Doc_No, Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        try:
            Doc_No = int(Doc_No)
            Company_Code = int(Company_Code)
            Year_Code = int(Year_Code)
        except ValueError:
            return jsonify({"error": "Invalid Doc_No, Company_Code, or Year_Code parameter"}), 400

        next_Record = OtherPurchase.query.filter(
            OtherPurchase.Doc_No > Doc_No,
            OtherPurchase.Company_Code == Company_Code,
            OtherPurchase.Year_Code == Year_Code
        ).order_by(OtherPurchase.Doc_No.asc()).first()

        if not next_Record:
            return jsonify({"error": "No next record found"}), 404

        next_Record_data = {column.name: getattr(next_Record, column.name) for column in next_Record.__table__.columns}
        next_Record_data.update(format_dates(next_Record))

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"opid": next_Record.opid})
        additional_data_row = additional_data.fetchone()

        labels = dict(additional_data_row._mapping) if additional_data_row else {}

        response = {
            "next_OtherPurchase_data": next_Record_data,
            "labels": labels
        }

        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
