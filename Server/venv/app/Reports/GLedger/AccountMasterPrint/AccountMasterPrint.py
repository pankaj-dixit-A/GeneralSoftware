from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
from flask import Flask, jsonify, request
import os

API_URL = os.getenv('API_URL')

@app.route(API_URL+'/accountmaster-print', methods=['GET'])
def account_master_report():
    try:
        
        ac_type = request.args.get('Ac_Type')  
        group_code = request.args.get('Group_Code')  
        company_code = request.args.get('Company_Code')  
        statewise = request.args.get('Statewise', 'false').lower() == 'true'  

        if not company_code and not statewise:
            return jsonify({'error': 'Company_Code is required unless Statewise is true'}), 400

        query = "SELECT * FROM qrymstaccountmaster"
        params = {}

        if not statewise:
            query += " WHERE Company_Code = :company_code"
            params['company_code'] = company_code

            if ac_type:
                query += " AND Ac_Type = :ac_type"
                params['ac_type'] = ac_type

            if group_code:
                query += " AND Group_Code = :group_code"
                params['group_code'] = group_code

        result = db.session.execute(text(query), params)
        records = [dict(row._mapping) for row in result]

        return jsonify({'data': records})

    except SQLAlchemyError as e:
        return jsonify({'error': str(e)}), 500