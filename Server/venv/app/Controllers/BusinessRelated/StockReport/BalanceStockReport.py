from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
from flask import Flask, jsonify, request
from flask_mail import Mail, Message
from collections import defaultdict
import os

API_URL = os.getenv('API_URL')

    
@app.route(API_URL+'/partywise-stockReport', methods=['GET'])
def partywise_stockReport():
    try:
        company_code = request.args.get('Company_Code')
        if company_code is None:
            return jsonify({"error": "Missing 'company_code' parameter"}), 400

        with db.session.begin_nested():
            query = db.session.execute(text('''
               select  Tender_No,tenderid,millshortname,Grade,Mill_Rate,
(Sale_Rate+Commission_Rate) as Sale_Rate,
Lifting_DateConverted as Tender_Date,
Buyer_Quantal,DESPATCH,BALANCE,tenderdoshortname,
Buyer,tenderdetailid, buyername from qrytenderdobalanceview 
where  Company_Code = :company_code and   Buyer_Quantal!=0  
GROUP BY Tender_No,tenderid,millshortname,Grade,Mill_Rate,Sale_Rate,Tender_Date,Buyer_Quantal,
DESPATCH,BALANCE,tenderdoname,Lifting_DateConverted,tenderdoshortname,Buyer,Commission_Rate,
tenderdetailid, buyername order by buyername 
            '''),{'company_code':company_code})

            result = query.fetchall()

        response = []
        for row in result:
            row_dict = row._asdict()
            response.append(row_dict)

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


@app.route(API_URL + '/millwise-stock-report', methods=['GET'])
def tender_reports():
    company_code = request.args.get('Company_Code')

    if not company_code:
        return jsonify({"error": "Missing 'Company_Code' parameter"}), 400

    try:
        tender_details_query = text('''
            SELECT DISTINCT Tender_No, Tender_DateConverted AS Tender_Date, millshortname AS millname,
                            Grade, Quantal, Mill_Rate, Purc_Rate, Lifting_DateConverted AS Lifting_Date,
                            tenderdoshortname AS doname, Lifting_DateConverted AS ld
            FROM qrytenderdobalanceview
            WHERE BALANCE != 0 AND Company_Code = :company_code
            ORDER BY Tender_No ASC;
        ''')
        tender_details_result = db.session.execute(tender_details_query, {'company_code': company_code}).fetchall()

        if not tender_details_result:
            return jsonify({"error": "No tender details found for the given Company_Code"}), 404

        sales_details_query = text('''
            SELECT ID, buyername AS buyerbrokerfullname, (Sale_Rate + Commission_Rate) AS Sale_Rate,
                   Buyer_Quantal, DESPATCH AS despatchqty, BALANCE, Tender_No
            FROM qrytenderdobalanceview
            WHERE Company_Code = :company_code;
        ''')
        sales_details_result = db.session.execute(sales_details_query, {'company_code': company_code}).fetchall()

        if not sales_details_result:
            return jsonify({"error": "No sales details found for the given Company_Code"}), 404

        # Group tender details by Tender_No
        tender_grouped = defaultdict(list)
        for row in tender_details_result:
            row_dict = dict(row._mapping)
            tender_grouped[row_dict['Tender_No']].append(row_dict)

        # Group sales details by Tender_No
        sales_grouped = defaultdict(list)
        for row in sales_details_result:
            row_dict = dict(row._mapping)
            sales_grouped[row_dict['Tender_No']].append(row_dict)

        response = {
            "tender_details": [{"Tender_No": tender_no, "details": details} for tender_no, details in tender_grouped.items()],
            "sales_details": [{"Tender_No": tender_no, "details": details} for tender_no, details in sales_grouped.items()]
        }
        return jsonify(response)

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to fetch data due to an error.', 'exception': str(e)}), 500


@app.route(API_URL + '/self-stock-report', methods=['GET'])
def get_self_report():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code or not year_code:
            return jsonify({"error": "Missing required query parameters: Company_Code, Year_Code"}), 400

        sql_query = text('''
            SELECT Tender_No, tenderid, millshortname, Grade, Mill_Rate, 
                   Sale_Rate + Commission_Rate AS Sale_Rate, 
                   Lifting_DateConverted AS Tender_Date, Buyer_Quantal, DESPATCH, BALANCE, 
                   tenderdoshortname, Buyer, tenderdetailid, buyername
            FROM dbo.qrytenderdobalanceview
            WHERE Company_Code = :company_code AND Year_Code = :year_code AND Buyer_Quantal <> 0 AND Buyer = 2
            GROUP BY Tender_No, tenderid, millshortname, Grade, Mill_Rate, Sale_Rate, Tender_Date, Buyer_Quantal, 
                     DESPATCH, BALANCE, tenderdoname, Lifting_DateConverted, tenderdoshortname, Buyer, Commission_Rate, 
                     tenderdetailid, buyername
            ORDER BY millshortname
        ''')

        with db.engine.connect() as connection:
            result = connection.execute(sql_query, {'company_code': company_code, 'year_code': year_code})

            self_stock_report_detail = [dict(row._mapping) for row in result]

        return jsonify(self_stock_report_detail)

    except SQLAlchemyError as e:
        return jsonify({"error": "Failed to fetch data", "details": str(e)}), 500
