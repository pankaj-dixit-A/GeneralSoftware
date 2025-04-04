from flask import Flask, jsonify, request
from app import app, db
import requests
from app.models.Transactions.ReceiptPayment.ReceiptPaymentModels import ReceiptPaymentHead, ReceiptPaymentDetail
from app.models.Transactions.ReceiptPayment.ReceiptPaymentSchema import ReceiptPaymentHeadSchema, ReceiptPaymentDetailSchema
from app.utils.CommonGLedgerFunctions import fetch_company_parameters, get_accoid, getSaleAc, get_acShort_Name,get_ac_Name,create_gledger_entry,send_gledger_entries
from sqlalchemy import text, func
from sqlalchemy.exc import SQLAlchemyError
import os
import requests
import traceback
import logging

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')
API_URL_SERVER = os.getenv('API_URL_SERVER')
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


RECEIPT_PAYMENT_DETAILS_QUERY = '''
SELECT        cashbank.Ac_Name_E AS cashbankname, debitac.Ac_Name_E AS debitacname, creditac.Ac_Name_E AS creditacname, unit.Ac_Name_E AS unitacname, adjustedac.Ac_Name_E AS adjustedacname, 
                         dbo.nt_1_transactdetail.credit_ac, dbo.nt_1_transactdetail.Unit_Code, dbo.nt_1_transactdetail.AcadjAccode, dbo.nt_1_transactdetail.debit_ac, cashbank.Ac_Code AS cashAc, dbo.nt_1_transactdetail.Group_Code, 
                         dbo.nt_1_systemmaster.System_Name_E
FROM            dbo.nt_1_accountmaster AS unit RIGHT OUTER JOIN
                         dbo.nt_1_accountmaster AS adjustedac RIGHT OUTER JOIN
                         dbo.nt_1_systemmaster RIGHT OUTER JOIN
                         dbo.nt_1_transactdetail ON dbo.nt_1_systemmaster.systemid = dbo.nt_1_transactdetail.gcid ON adjustedac.accoid = dbo.nt_1_transactdetail.ac ON unit.accoid = dbo.nt_1_transactdetail.uc LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS creditac ON dbo.nt_1_transactdetail.ca = creditac.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS debitac ON dbo.nt_1_transactdetail.da = debitac.accoid RIGHT OUTER JOIN
                         dbo.nt_1_transacthead LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS cashbank ON dbo.nt_1_transacthead.cb = cashbank.accoid ON dbo.nt_1_transactdetail.tranid = dbo.nt_1_transacthead.tranid
WHERE 
    dbo.nt_1_transacthead.tranid = :tranid
'''

receipt_payment_head_schema = ReceiptPaymentHeadSchema()
receipt_payment_head_schemas = ReceiptPaymentHeadSchema(many=True)

receipt_payment_detail_schema = ReceiptPaymentDetailSchema()
receipt_payment_detail_schemas = ReceiptPaymentDetailSchema(many=True)

def format_dates(task):
    return {
        "doc_date": task.doc_date.strftime('%Y-%m-%d') if task.doc_date else None,
    }

# def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid, order_code, tran_type, doc_no, narration):
#     if amount > 0:
#         entries.append(create_gledger_entry(data, amount, drcr, ac_code, accoid, order_code, tran_type, doc_no, narration))

def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid, order_code, trans_type, doc_no, narration, drcr_head=0, gcid=0):
    entry = create_gledger_entry(data, amount, drcr, ac_code, accoid, order_code, trans_type, doc_no, narration)
    entry['DRCR_HEAD'] = drcr_head
    entry['gcid'] = gcid
    entries.append(entry)

def process_gledger_entries(detailData, headData, gledger_entries, order_code):
    for item in detailData:
        amount = float(item.get('amount', 0))
        narration = item.get('narration', '')
        tran_type = headData.get('tran_type')
        gcid = item.get('gcid', 0)
        if amount > 0:
            if tran_type == "JV":
                dr_cr = item['drcr']
                account_code = item['debit_ac'] if dr_cr == 'D' else item['credit_ac']
                accoid = get_accoid(account_code, headData['company_code'])
                order_code += 1
                add_gledger_entry(gledger_entries, headData, amount, dr_cr, account_code, accoid, order_code, tran_type, headData['doc_no'], narration)
            elif tran_type in ["BR", "CR", "CP", "BP"]:
                credit_ac = item['credit_ac']
                cashbank = headData['cashbank']
                credit_accoid = get_accoid(credit_ac, headData['company_code'])
                cashbank_accoid = get_accoid(cashbank, headData['company_code'])
                creditName = get_ac_Name(credit_ac, headData['company_code'])
                cashName = get_ac_Name(cashbank, headData['company_code'])
                drcr_head = cashbank
                
                if tran_type in ["CP", "BP"]:
                    order_code += 1
                    add_gledger_entry(gledger_entries, headData, amount, "C", cashbank, cashbank_accoid, order_code, tran_type, headData['doc_no'],str(creditName)  + ' # ' + str(narration), credit_ac, gcid)
                    order_code += 1
                    add_gledger_entry(gledger_entries, headData, amount, "D", credit_ac, credit_accoid, order_code + 1, tran_type, headData['doc_no'], str(cashName) + ' # ' + str(narration), drcr_head, gcid)
                elif tran_type in ["BR", "CR"]:
                    order_code += 1
                    add_gledger_entry(gledger_entries, headData, amount, "D", cashbank, cashbank_accoid, order_code, tran_type, headData['doc_no'],str(creditName)  + ' # ' + str(narration),credit_ac, gcid)
                    order_code += 1
                    add_gledger_entry(gledger_entries, headData, amount, "C", credit_ac, credit_accoid, order_code + 1, tran_type, headData['doc_no'], str(cashName) + ' # ' + str(narration),drcr_head, gcid)
    return gledger_entries


# Get data from both tables ReceiptPaymentHead and ReceiptPaymentDetail
@app.route(API_URL + "/getdata-receiptpayment", methods=["GET"])
def getdata_receiptpayment():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        tran_type = request.args.get('tran_type')

        if not all([Company_Code, Year_Code, tran_type]):
            return jsonify({"error": "Missing required parameters"}), 400


        query = """
        SELECT        creditac.Ac_Name_E AS creditacname, dbo.nt_1_transactdetail.credit_ac, dbo.nt_1_transactdetail.amount, dbo.nt_1_transacthead.tran_type, dbo.nt_1_transacthead.doc_no, dbo.nt_1_transacthead.doc_date, 
                         dbo.nt_1_transactdetail.narration, dbo.nt_1_transacthead.tranid, dbo.nt_1_transactdetail.da, dbo.nt_1_transactdetail.trandetailid, debitac.Ac_Name_E AS debitName, dbo.nt_1_transactdetail.debit_ac, dbo.nt_1_transacthead.cashbank, dbo.nt_1_transacthead.cb, 
                         dbo.nt_1_accountmaster.Ac_Name_E as bank_name
FROM            dbo.nt_1_accountmaster RIGHT OUTER JOIN
                         dbo.nt_1_transacthead ON dbo.nt_1_accountmaster.accoid = dbo.nt_1_transacthead.cb LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS debitac RIGHT OUTER JOIN
                         dbo.nt_1_transactdetail ON debitac.accoid = dbo.nt_1_transactdetail.da LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS creditac ON dbo.nt_1_transactdetail.ca = creditac.accoid ON dbo.nt_1_transacthead.tranid = dbo.nt_1_transactdetail.tranid
        WHERE 
            dbo.nt_1_transacthead.Company_Code = :Company_Code AND
            dbo.nt_1_transacthead.Year_Code = :Year_Code AND
            dbo.nt_1_transacthead.tran_type = :tran_type
        ORDER BY 
            dbo.nt_1_transacthead.doc_no DESC
        """

        results = db.session.execute(
            text(query),
            {
                "Company_Code": Company_Code,
                "Year_Code": Year_Code,
                "tran_type": tran_type
            }
        )
        rows = results.fetchall()

        all_records_data = []
        for row in rows:
            record = dict(row._mapping)
            if record.get("doc_date"):
                record["doc_date"] = record["doc_date"].strftime('%Y-%m-%d')
            all_records_data.append(record)

        if not all_records_data:
            return jsonify({"error": "No records found"}), 404

        response = {
            "all_data_receiptpayment": all_records_data
        }
        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get data by the particular doc_no
@app.route(API_URL + "/getreceiptpaymentByid", methods=["GET"])
def getreceiptpaymentByid():
    try:
        Company_Code = request.args.get('Company_Code')
        doc_no = request.args.get('doc_no')
        Year_Code = request.args.get('Year_Code')
        tran_type = request.args.get('tran_type')
        if not all([Company_Code, Year_Code, tran_type, doc_no]):
            return jsonify({"error": "Missing required parameters"}), 400

        receipt_payment_head = ReceiptPaymentHead.query.filter_by(doc_no=doc_no, company_code=Company_Code, year_code=Year_Code, tran_type=tran_type).first()
        if not receipt_payment_head:
            return jsonify({"error": "No records found"}), 404

        tranid = receipt_payment_head.tranid
        additional_data = db.session.execute(text(RECEIPT_PAYMENT_DETAILS_QUERY), {"tranid": tranid})
        additional_data_rows = additional_data.fetchall()

        labels = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "receipt_payment_head": {
                **{column.name: getattr(receipt_payment_head, column.name) for column in receipt_payment_head.__table__.columns},
                **format_dates(receipt_payment_head)
            },
            "labels": labels,
            "receipt_payment_details": [{
                **{column.name: getattr(detail, column.name) for column in detail.__table__.columns},
                **format_dates(detail)
            } for detail in ReceiptPaymentDetail.query.filter_by(tranid=tranid).all()]
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Insert record for ReceiptPaymentHead and ReceiptPaymentDetail
@app.route(API_URL + "/insert-receiptpayment", methods=["POST"])
def insert_receiptpayment():
    def get_max_doc_no(tran_type,company_code,year_code):
        return db.session.query(func.max(ReceiptPaymentHead.doc_no)).filter(ReceiptPaymentHead.tran_type == tran_type, ReceiptPaymentHead.company_code == company_code, ReceiptPaymentHead.year_code == year_code).scalar() or 0
         
    try:
        data = request.get_json()
        
        headData = data['head_data']
        detailData = data['detail_data']

        company_code = headData["company_code"]
        year_code = headData["year_code"]

        if not company_code or not year_code:
            return jsonify({"error": "Bad Request", "message": "Missing required paramters"}), 400
       
        tran_type = headData.get('tran_type')
        if not tran_type:
            return jsonify({"error": "Bad Request", "message": "tran_type is required"}), 400

        max_doc_no = get_max_doc_no(tran_type,company_code,year_code)
        new_doc_no = max_doc_no + 1
        headData['doc_no'] = new_doc_no
        new_head = ReceiptPaymentHead(**headData)
        db.session.add(new_head)

        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []
        
        for item in detailData:
            item['doc_no'] = new_doc_no
            item['tranid'] = new_head.tranid
            item['Tran_Type'] = new_head.tran_type
            item['doc_date'] = new_head.doc_date
        
            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    new_detail = ReceiptPaymentDetail(**item)
                    new_head.details.append(new_detail)
                    createdDetails.append(new_detail)

                elif item['rowaction'] == "update":
                    trandetailid = item['trandetailid']
                    update_values = {k: v for k, v in item.items() if k not in ('trandetailid', 'rowaction', 'tranid')}
                    db.session.query(ReceiptPaymentDetail).filter(ReceiptPaymentDetail.trandetailid == trandetailid).update(update_values)
                    updatedDetails.append(trandetailid)

                elif item['rowaction'] == "delete":
                    trandetailid = item['trandetailid']
                    detail_to_delete = db.session.query(ReceiptPaymentDetail).filter(ReceiptPaymentDetail.trandetailid == trandetailid).one_or_none()
                    if detail_to_delete:
                        db.session.delete(detail_to_delete)
                        deletedDetailIds.append(trandetailid)

        db.session.commit()

        gledger_entries = []
        order_code=0
        gledger_entries = process_gledger_entries(detailData, headData, gledger_entries, order_code)
        if gledger_entries:
            response = send_gledger_entries(headData, gledger_entries, tran_type)
            if response.status_code != 200:
                db.session.rollback()
                return jsonify({"error": "Failed to create GLedger record", "details": response.text}), response.status_code
        
        return jsonify({
            "message": "Data Inserted successfully",
            "head": receipt_payment_head_schema.dump(new_head),
            "addedDetails": receipt_payment_detail_schemas.dump(createdDetails),
            "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 200

    except Exception as e:
        logger.error("Traceback: %s", traceback.format_exc())
        logger.error("Error fetching data: %s", e)
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Update record for ReceiptPaymentHead and ReceiptPaymentDetail
@app.route(API_URL + "/update-receiptpayment", methods=["PUT"])
def update_receiptpayment():      
    try:
        tranid = request.args.get('tranid')
        if not tranid:
            return jsonify({"error": "Missing 'tranid' parameter"}), 400

        data = request.get_json()
        headData = data['head_data']
        detailData = data['detail_data']
        
        tran_type = headData.get('tran_type')
        if not tran_type:
            return jsonify({"error": "Bad Request", "message": "tran_type is required"}), 400

        updated_head_count = db.session.query(ReceiptPaymentHead).filter(ReceiptPaymentHead.tranid == tranid).update(headData)
        updated_head = ReceiptPaymentHead.query.filter_by(tranid=tranid).first()

        doc_date = updated_head.doc_date

        created_details = []
        updated_details = []
        deleted_detail_ids = []
        for item in detailData:
            item['tranid'] = updated_head.tranid
            item['Tran_Type'] = updated_head.tran_type
            item['doc_date'] = doc_date

            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    item['doc_no'] = updated_head.doc_no
                    new_detail = ReceiptPaymentDetail(**item)
                    db.session.add(new_detail)
                    created_details.append(new_detail)

                elif item['rowaction'] == "update":
                    trandetailid = item['trandetailid']
                    update_values = {k: v for k, v in item.items() if k not in ('trandetailid', 'rowaction', 'tranid')}
                    db.session.query(ReceiptPaymentDetail).filter(ReceiptPaymentDetail.trandetailid == trandetailid).update(update_values)
                    updated_details.append(trandetailid)

                elif item['rowaction'] == "delete":
                    trandetailid = item['trandetailid']
                    detail_to_delete = db.session.query(ReceiptPaymentDetail).filter(ReceiptPaymentDetail.trandetailid == trandetailid).one_or_none()
                    if detail_to_delete:
                        db.session.delete(detail_to_delete)
                        deleted_detail_ids.append(trandetailid)
                    continue

        db.session.commit()
        
        filtered_detail_data_for_gledger = [
            item for item in detailData
            if item.get('rowaction') not in ['delete', 'DNU']
        ]

        gledger_entries = []
        order_code=0

        gledger_entries = process_gledger_entries(filtered_detail_data_for_gledger, headData, gledger_entries, order_code)

        if gledger_entries:
            response = send_gledger_entries(headData, gledger_entries, tran_type)
            if response.status_code != 200:
                db.session.rollback()
                return jsonify({"error": "Failed to create GLedger record", "details": response.text}), response.status_code

        return jsonify({
            "message": "Data updated successfully",
            "head": updated_head_count,
            "created_details": receipt_payment_detail_schemas.dump(created_details),
            "updated_details": updated_details,
            "deleted_detail_ids": deleted_detail_ids
        }), 200

    except Exception as e:
        logger.error("Traceback: %s", traceback.format_exc())
        logger.error("Error fetching data: %s", e)
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Delete record from database based on tranid
@app.route(API_URL + "/delete_data_by_tranid", methods=["DELETE"])
def delete_data_by_tranid():
    try:
        tranid = request.args.get('tranid')
        company_code = request.args.get('company_code')
        year_code = request.args.get('year_code')
        doc_no = request.args.get('doc_no')
        tran_type = request.args.get('Tran_Type')

        if not all([tranid, company_code,year_code,doc_no,tran_type]):
            return jsonify({"error": "Missing required parameters"}), 400

        with db.session.begin():
            deleted_detail_rows = ReceiptPaymentDetail.query.filter_by(tranid=tranid).delete()
            deleted_head_rows = ReceiptPaymentHead.query.filter_by(tranid=tranid).delete()

        if deleted_detail_rows > 0 and deleted_head_rows > 0:
            query_params = {
                'Company_Code': company_code,
                'DOC_NO': doc_no,
                'Year_Code': year_code,
                'TRAN_TYPE': tran_type,
            }

            response = requests.delete(API_URL_SERVER+"/delete-Record-gLedger", params=query_params)
            
            if response.status_code != 200:
                raise Exception("Failed to create record in gLedger")    

        db.session.commit()

        return jsonify({
            "message": f"Deleted {deleted_head_rows} head row(s) and {deleted_detail_rows} detail row(s) successfully"
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/get-firstreceiptpayment-navigation", methods=["GET"])
def get_firstreceiptpayment_navigation():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        tran_type = request.args.get('tran_type')
        if not all([Company_Code, Year_Code, tran_type]):
            return jsonify({"error": "Missing required parameters"}), 400

        first_receipt_payment_head = ReceiptPaymentHead.query.filter_by(company_code=Company_Code, year_code=Year_Code, tran_type=tran_type).order_by(ReceiptPaymentHead.doc_no.asc()).first()
        if not first_receipt_payment_head:
            return jsonify({"error": "No records found"}), 404

        tranid = first_receipt_payment_head.tranid
        additional_data = db.session.execute(text(RECEIPT_PAYMENT_DETAILS_QUERY), {"tranid": tranid})
        additional_data_rows = additional_data.fetchall()

        labels = [dict(row._mapping) for row in additional_data_rows]

        first_head_data = {
            **{column.name: getattr(first_receipt_payment_head, column.name) for column in first_receipt_payment_head.__table__.columns},
            **format_dates(first_receipt_payment_head)
        }

        first_details_data = [
            {
                **{column.name: getattr(detail, column.name) for column in detail.__table__.columns},
                **format_dates(detail)
            } for detail in ReceiptPaymentDetail.query.filter_by(tranid=tranid).all()
        ]

        response = {
            "first_head_data": first_head_data,
            "labels": labels,
            "first_details_data": first_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get last record from the database
@app.route(API_URL + "/get-lastreceiptpayment-navigation", methods=["GET"])
def get_lastreceiptpayment_navigation():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        tran_type = request.args.get('tran_type')
        if not all([Company_Code, Year_Code, tran_type]):
            return jsonify({"error": "Missing required parameters"}), 400

        last_receipt_payment_head = ReceiptPaymentHead.query.filter_by(company_code=Company_Code, year_code=Year_Code, tran_type=tran_type).order_by(ReceiptPaymentHead.doc_no.desc()).first()
        if not last_receipt_payment_head:
            return jsonify({"error": "No records found"}), 404

        tranid = last_receipt_payment_head.tranid
        additional_data = db.session.execute(text(RECEIPT_PAYMENT_DETAILS_QUERY), {"tranid": tranid})
        additional_data_rows = additional_data.fetchall()

        labels = [dict(row._mapping) for row in additional_data_rows]

        last_head_data = {
            **{column.name: getattr(last_receipt_payment_head, column.name) for column in last_receipt_payment_head.__table__.columns},
            **format_dates(last_receipt_payment_head)
        }

        last_details_data = [
            {
                **{column.name: getattr(detail, column.name) for column in detail.__table__.columns},
                **format_dates(detail)
            } for detail in ReceiptPaymentDetail.query.filter_by(tranid=tranid).all()
        ]

        response = {
            "last_head_data": last_head_data,
            "labels": labels,
            "last_details_data": last_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get previous record from the database
@app.route(API_URL + "/get-previousreceiptpayment-navigation", methods=["GET"])
def get_previousreceiptpayment_navigation():
    try:
        current_doc_no = request.args.get('currentDocNo')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        tran_type = request.args.get('tran_type')
        if not all([Company_Code, Year_Code, current_doc_no, tran_type]):
            return jsonify({"error": "Missing required parameters"}), 400

        previous_receipt_payment_head = ReceiptPaymentHead.query.filter(ReceiptPaymentHead.doc_no < current_doc_no).filter_by(company_code=Company_Code, year_code=Year_Code, tran_type=tran_type).order_by(ReceiptPaymentHead.doc_no.desc()).first()
        if not previous_receipt_payment_head:
            return jsonify({"error": "No previous records found"}), 404

        tranid = previous_receipt_payment_head.tranid
        additional_data = db.session.execute(text(RECEIPT_PAYMENT_DETAILS_QUERY), {"tranid": tranid})
        additional_data_rows = additional_data.fetchall()

        labels = [dict(row._mapping) for row in additional_data_rows]

        previous_head_data = {
            **{column.name: getattr(previous_receipt_payment_head, column.name) for column in previous_receipt_payment_head.__table__.columns},
            **format_dates(previous_receipt_payment_head)
        }

        previous_details_data = [
            {
                **{column.name: getattr(detail, column.name) for column in detail.__table__.columns},
                **format_dates(detail)
            } for detail in ReceiptPaymentDetail.query.filter_by(tranid=tranid).all()
        ]

        response = {
            "previous_head_data": previous_head_data,
            "labels": labels,
            "previous_details_data": previous_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get next record from the database
@app.route(API_URL + "/get-nextreceiptpayment-navigation", methods=["GET"])
def get_nextreceiptpayment_navigation():
    try:
        current_doc_no = request.args.get('currentDocNo')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        tran_type = request.args.get('tran_type')
        if not all([Company_Code, Year_Code, current_doc_no, tran_type]):
            return jsonify({"error": "Missing required parameters"}), 400

        next_receipt_payment_head = ReceiptPaymentHead.query.filter(ReceiptPaymentHead.doc_no > current_doc_no).filter_by(company_code=Company_Code, year_code=Year_Code, tran_type=tran_type).order_by(ReceiptPaymentHead.doc_no.asc()).first()
        if not next_receipt_payment_head:
            return jsonify({"error": "No next records found"}), 404

        tranid = next_receipt_payment_head.tranid
        additional_data = db.session.execute(text(RECEIPT_PAYMENT_DETAILS_QUERY), {"tranid": tranid})
        additional_data_rows = additional_data.fetchall()

        labels = [dict(row._mapping) for row in additional_data_rows]

        next_head_data = {
            **{column.name: getattr(next_receipt_payment_head, column.name) for column in next_receipt_payment_head.__table__.columns},
            **format_dates(next_receipt_payment_head)
        }

        next_details_data = [
            {
                **{column.name: getattr(detail, column.name) for column in detail.__table__.columns},
                **format_dates(detail)
            } for detail in ReceiptPaymentDetail.query.filter_by(tranid=tranid).all()
        ]

        response = {
            "next_head_data": next_head_data,
            "labels": labels,
            "next_details_data": next_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/get_next_paymentRecord_docNo", methods=["GET"])
def get_next_paymentRecord_docNo():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        tranType = request.args.get('tran_type')

        if not company_code or not year_code or not tranType:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' or 'Tran_Type' parameter"}), 400

        max_doc_no = db.session.query(func.max(ReceiptPaymentHead.doc_no)).filter_by(company_code=company_code, year_code=year_code, tran_type=tranType).scalar()

        next_doc_no = max_doc_no + 1 if max_doc_no else 1
        response = {
            "next_doc_no": next_doc_no
        }
        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL+"/generating_RecieptPaymrnt_report", methods=["GET"])
def generating_RecieptPaymrnt_report():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        doc_no = request.args.get('doc_no')
        tran_type=request.args.get('TranType')
        if not company_code or not year_code or not doc_no:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = ('''
                      
               SELECT        dbo.qrytransheaddetail.*, dbo.tblvoucherheadaddress.AL1, dbo.tblvoucherheadaddress.AL2, dbo.tblvoucherheadaddress.AL3, dbo.tblvoucherheadaddress.AL4, dbo.tblvoucherheadaddress.Other, 
                         dbo.company.Company_Name_E
FROM            dbo.qrytransheaddetail LEFT OUTER JOIN
                         dbo.company ON dbo.qrytransheaddetail.company_code = dbo.company.Company_Code LEFT OUTER JOIN
                         dbo.tblvoucherheadaddress ON dbo.company.Company_Code = dbo.tblvoucherheadaddress.Company_Code
WHERE        (dbo.qrytransheaddetail.doc_no = :doc_no) AND (dbo.qrytransheaddetail.tran_type = :TranType) AND 
                 (dbo.qrytransheaddetail.company_code = :company_code) AND (dbo.qrytransheaddetail.year_code = :year_code)
                                 '''
            )
        additional_data = db.session.execute(text(query), {"company_code": company_code,
                      "year_code": year_code, "doc_no": doc_no,'TranType' :tran_type})

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


