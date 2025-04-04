from flask import Flask, jsonify, request
from app import app, db
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import func
import os
import requests
from datetime import datetime
import uuid

API_URL= os.getenv('API_URL')

API_URL_EINVOICE = os.getenv('API_URL_EINVOICE')
TOKEN_URL = os.getenv('TOKEN_URL')
GSP_APP_ID = os.getenv('GSP_APP_ID')
GSP_APP_SECRET = os.getenv('GSP_APP_SECRET')
USER_NAME=os.getenv('USER_NAME')
EWAY_PASSWORD=os.getenv('EWAY_PASSWORD')
EWAY_GSTIN=os.getenv('EWAY_GSTIN')

def generate_request_id():
    return str(uuid.uuid4())


# # Genrate Eway bill Token genration.
@app.route(API_URL+'/get-token', methods=['POST'])
def get_token():
    try:
        headers = {
            'gspappid': GSP_APP_ID,
            'gspappsecret': GSP_APP_SECRET,
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        params = {'grant_type': 'token'}

        response = requests.post(TOKEN_URL, headers=headers, params=params)

        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({'message': 'Error during token generation', 'error': response.text}), 500
    except Exception as e:
        return jsonify({'message': 'Error during token generation', 'error': str(e)}), 500

# Genrate Eway bill and E-Invoice
@app.route(API_URL+'/create-invoice', methods=['POST'])
def create_invoice():
    try:
        token = request.json.get('token')
        if not token:
            return jsonify({'message': 'Token is required'}), 400
        
        request_id = generate_request_id()

        api_url = f"{API_URL_EINVOICE}/invoice"

        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}',
            'user_name': USER_NAME,
            'password': EWAY_PASSWORD,
            'gstin': EWAY_GSTIN,
            'requestid': request_id
        }

        body = request.json.get('invoice_data')

        if not body:
            return jsonify({'message': 'Invoice data is required'}), 400

        response = requests.post(api_url, json=body, headers=headers)

        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({'message': 'Error during invoice creation', 'error': response.text}), 500

    except Exception as e:
        return jsonify({'message': 'Error during invoice creation', 'error': str(e)}), 500


# @app.route(API_URL + '/updateEInvoiceData', methods=['PUT'])
# def updateEInvoiceData():
#     try:
#         doc_no = request.args.get("doc_no")
#         Company_Code = request.args.get("Company_Code")
#         Year_Code = request.args.get("Year_Code")
#         tran_type = request.args.get("tran_type")

#         if not (doc_no and Company_Code and Year_Code and tran_type):
#             return jsonify({
#                 "error": "doc_no, Company_Code, Year_Code, and tran_type are required as query parameters."
#             }), 400

#         data = request.get_json()
#         if not data:
#             return jsonify({"error": "Request body is required."}), 400

#         ackno = data.get('AckNo')
#         invoiceno = data.get('Irn')
#         QRCode = data.get('SignedQRCode')

#         valid_debitcredit_types = ['DN', 'DS', 'CN', 'CS']
#         if tran_type in valid_debitcredit_types:
#             if not ackno:
#                 return jsonify({
#                     "error": "AckNo is required in the JSON body for debit/credit note types."
#                 }), 400

#             update_query = text('''
#                 UPDATE debitnotehead
#                    SET ackno       = :ackno,
#                        Ewaybillno  = :invoiceno,
#                        QRCode      = :QRCode
#                  WHERE company_code = :Company_Code
#                    AND year_code    = :Year_Code
#                    AND tran_type    = :tran_type
#                    AND doc_no       = :doc_no
#             ''')

#             db.session.execute(update_query, {
#                 'ackno': ackno,
#                 'invoiceno': invoiceno,
#                 'QRCode': QRCode,
#                 'doc_no': doc_no,
#                 'Company_Code': Company_Code,
#                 'Year_Code': Year_Code,
#                 'tran_type': tran_type
#             })
#             db.session.commit()

#             return jsonify({
#                 "message": f"Successfully updated E-Invoice data in 'debitnotehead' for doc_no={doc_no}."
#             }), 200

#         elif tran_type == 'RB':
#             if not ackno:
#                 return jsonify({
#                     "error": "AckNo is required in the JSON body for rent bills (RB)."
#                 }), 400

#             update_query = text('''
#                 UPDATE nt_1_rentbillhead
#                    SET ackno       = :ackno,
#                        einvoiceno  = :invoiceno,
#                        QRCode      = :QRCode
#                  WHERE company_code = :Company_Code
#                    AND year_code    = :Year_Code
#                    AND doc_no       = :doc_no
#             ''')
#             db.session.execute(update_query, {
#                 'ackno': ackno,
#                 'invoiceno': invoiceno,
#                 'QRCode': QRCode,
#                 'doc_no': doc_no,
#                 'Company_Code': Company_Code,
#                 'Year_Code': Year_Code
#             })
#             db.session.commit()

#             return jsonify({
#                 "message": f"Successfully updated E-Invoice data in 'nt_1_rentbillhead' for doc_no={doc_no}."
#             }), 200

#         elif tran_type == 'SB':
#             if not ackno:
#                 return jsonify({
#                     "error": "AckNo is required in the JSON body for sale bills (SB)."
#                 }), 400

#             getDo = text ('''
#                 select doc_no from nt_1_deliveryorder where SB_No = :doc_no and 
#                 Company_Code = :Company_Code and Year_Code = :Year_Code
#             ''')
#             db.session.execute(getDo,{
#             'doc_no': doc_no,
#             'Company_Code': Company_Code,
#             'Year_Code': Year_Code
#             }).fetchone()

#             DONo = getDo.doc_no

#             if DONo == 0 or DONo == "":
#                 updateDO = text ('''
#                     update NT_1_deliveryorder set ackno= :ackno,einvoiceno= :invoiceno where WHERE company_code = :Company_Code
#                    AND year_code    = :Year_Code
#                    AND doc_no       = :DONo and tran_type='DO'
#                 ''')
#                 db.session.execute(updateDO, {
#                 'ackno': ackno,
#                 'invoiceno': invoiceno,
#                 'doc_no': doc_no,
#                 'Company_Code': Company_Code,
#                 'Year_Code': Year_Code,
#                 'DONo': DONo
#                 })
#                 db.session.commit()

#                 updateSale = text ('''
#                     update NT_1_SugarSale set ackno = :ackno,einvoiceno = :einvoiceno, QRCode = :QRCode where WHERE company_code = :Company_Code
#                    AND year_code    = :Year_Code
#                    AND DO_No       = :DONo 
#                 ''')
#                 db.session.execute(updateSale, {
#                 'ackno': ackno,
#                 'invoiceno': invoiceno,
#                 'doc_no': doc_no,
#                 'QRCode': QRCode,
#                 'Company_Code': Company_Code,
#                 'Year_Code': Year_Code,
#                 'DONo':DONo
#                 })
#                 db.session.commit()
#             else:
#                 update_query_sale = text('''
#                       update NT_1_SugarSale set ackno = :ackno,einvoiceno = :einvoiceno, QRCode = :QRCode where WHERE company_code = :Company_Code
#                    AND year_code    = :Year_Code
#                    AND doc_no       = :doc_no 
#                 ''')
#                 db.session.execute(update_query, {
#                     'ackno': ackno,
#                     'invoiceno': invoiceno,
#                     'QRCode': QRCode,
#                     'doc_no': doc_no,
#                     'Company_Code': Company_Code,
#                     'Year_Code': Year_Code
#                 })
#                 db.session.commit()

#             return jsonify({
#                 "message": f"Successfully updated E-Invoice data in 'nt_1_rentbillhead' for doc_no={doc_no}."
#             }), 200


#         else:
#             # Unsupported tran_type
#             return jsonify({
#                 "error": f"Tran type '{tran_type}' is not supported. "
#                          f"Expected one of {valid_debitcredit_types} or 'RB'."
#             }), 400

#     except Exception as e:
#         db.session.rollback()
#         print(f"Error occurred: {e}")
#         return jsonify({"error": "Internal server error", "details": str(e)}), 500


@app.route(API_URL + '/updateEInvoiceData', methods=['PUT'])
def updateEInvoiceData():
    try:
        doc_no = request.args.get("doc_no")
        Company_Code = request.args.get("Company_Code")
        Year_Code = request.args.get("Year_Code")
        tran_type = request.args.get("tran_type")

        if not (doc_no and Company_Code and Year_Code and tran_type):
            return jsonify({
                "error": "doc_no, Company_Code, Year_Code, and tran_type are required as query parameters."
            }), 400

        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required."}), 400

        ackno = data.get('AckNo')
        invoiceno = data.get('Irn')
        QRCode = data.get('SignedQRCode')

        valid_debitcredit_types = ['DN', 'DS', 'CN', 'CS']
        if tran_type in valid_debitcredit_types:
            if not ackno:
                return jsonify({
                    "error": "AckNo is required in the JSON body for debit/credit note types."
                }), 400

            update_query = text('''
                UPDATE debitnotehead
                   SET ackno       = :ackno,
                       Ewaybillno  = :invoiceno,
                       QRCode      = :QRCode
                 WHERE company_code = :Company_Code
                   AND year_code    = :Year_Code
                   AND tran_type    = :tran_type
                   AND doc_no       = :doc_no
            ''')

            db.session.execute(update_query, {
                'ackno': ackno,
                'invoiceno': invoiceno,
                'QRCode': QRCode,
                'doc_no': doc_no,
                'Company_Code': Company_Code,
                'Year_Code': Year_Code,
                'tran_type': tran_type
            })
            db.session.commit()

            return jsonify({
                "message": f"Successfully updated E-Invoice data in 'debitnotehead' for doc_no={doc_no}."
            }), 200

        elif tran_type == 'RB':
            if not ackno:
                return jsonify({
                    "error": "AckNo is required in the JSON body for rent bills (RB)."
                }), 400

            update_query = text('''
                UPDATE nt_1_rentbillhead
                   SET ackno       = :ackno,
                       einvoiceno  = :invoiceno,
                       QRCode      = :QRCode
                 WHERE company_code = :Company_Code
                   AND year_code    = :Year_Code
                   AND doc_no       = :doc_no
            ''')
            db.session.execute(update_query, {
                'ackno': ackno,
                'invoiceno': invoiceno,
                'QRCode': QRCode,
                'doc_no': doc_no,
                'Company_Code': Company_Code,
                'Year_Code': Year_Code
            })
            db.session.commit()

            return jsonify({
                "message": f"Successfully updated E-Invoice data in 'nt_1_rentbillhead' for doc_no={doc_no}."
            }), 200

        elif tran_type == 'SB':
            if not ackno:
                return jsonify({
                    "error": "AckNo is required in the JSON body for sale bills (SB)."
                }), 400

            getDoQuery = text('''
                SELECT doc_no FROM nt_1_deliveryorder 
                WHERE SB_No = :doc_no 
                  AND Company_Code = :Company_Code 
                  AND Year_Code = :Year_Code
            ''')
            do_result = db.session.execute(getDoQuery, {
                'doc_no': doc_no,
                'Company_Code': Company_Code,
                'Year_Code': Year_Code
            }).fetchone()

            DONo = do_result.doc_no if do_result else None

            if DONo:
                updateDO = text('''
                    UPDATE NT_1_deliveryorder 
                       SET ackno = :ackno, einvoiceno = :invoiceno 
                     WHERE company_code = :Company_Code
                       AND year_code    = :Year_Code
                       AND doc_no       = :DONo 
                       AND tran_type    = 'DO'
                ''')
                db.session.execute(updateDO, {
                    'ackno': ackno,
                    'invoiceno': invoiceno,
                    'DONo': doc_no,
                    'Company_Code': Company_Code,
                    'Year_Code': Year_Code
                })
                db.session.commit()

                updateSale = text('''
                    UPDATE NT_1_SugarSale 
                       SET ackno = :ackno, einvoiceno = :invoiceno, QRCode = :QRCode 
                     WHERE company_code = :Company_Code
                       AND year_code    = :Year_Code
                       AND DO_No        = :DONo
                ''')
                db.session.execute(updateSale, {
                    'ackno': ackno,
                    'invoiceno': invoiceno,
                    'QRCode': QRCode,
                    'DONo': doc_no,
                    'Company_Code': Company_Code,
                    'Year_Code': Year_Code
                })
                db.session.commit()
            else:

                print('Sales')
                update_query_sale = text('''
                    UPDATE NT_1_SugarSale 
                       SET ackno = :ackno, einvoiceno = :invoiceno, QRCode = :QRCode 
                     WHERE company_code = :Company_Code
                       AND year_code    = :Year_Code
                       AND doc_no       = :doc_no
                ''')
                db.session.execute(update_query_sale, {
                    'ackno': ackno,
                    'invoiceno': invoiceno,
                    'QRCode': QRCode,
                    'doc_no': doc_no,
                    'Company_Code': Company_Code,
                    'Year_Code': Year_Code
                })
                db.session.commit()

            return jsonify({
                "message": f"Successfully updated E-Invoice data for doc_no={doc_no}."
            }), 200

        else:
            return jsonify({
                "error": f"Tran type '{tran_type}' is not supported. "
                         f"Expected one of {valid_debitcredit_types} or 'RB', 'SB'."
            }), 400

    except Exception as e:
        db.session.rollback()
        print(f"Error occurred: {e}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

