from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
from flask import Flask, jsonify, request
import os

API_URL = os.getenv('API_URL')

def format_dates(task):
    return {
        "Tender_Date": task['Tender_Date'].strftime('%Y-%m-%d') if task['Tender_Date'] else None
        
    }
    
@app.route(API_URL+'/pendingreport-MillPayment-Summary', methods=['GET'])
def Pendingreport_MillPayment_Summary():
    try:
    #    company_code = request.args.get('Company_Code')
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        with db.session.begin_nested():
            query = db.session.execute(text('''
              select * from qryMillpaymentBalancewithdispatch where IsDeleted!=0 and
                 Tender_Date BETWEEN :from_date AND :to_date
                                           
            '''), {'from_date': from_date, 'to_date': to_date})

            result = query.fetchall()

        response = []
        for row in result:
            row_dict = row._asdict()
            formatted_dates = format_dates(row_dict)
            row_dict.update(formatted_dates)
            response.append(row_dict)

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
