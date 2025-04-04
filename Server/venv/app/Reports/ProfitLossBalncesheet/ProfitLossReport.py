from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
from flask import Flask, jsonify, request
from flask_mail import Mail, Message
import os

API_URL = os.getenv('API_URL')

def format_dates(task):
    return {
        # "PaymentDate": task['PaymentDate'].strftime('%Y-%m-%d') if task['PaymentDate'] else None,
        # "Sauda_Date": task['Sauda_Date'].strftime('%Y-%m-%d') if task['Sauda_Date'] else None,
    }

# Initialize Mail object
mail = Mail(app)


@app.route(API_URL + '/ProfitLoss_Report', methods=['GET'])
def ProfitLoss_Report():
    try:
        # Extract query parameters
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')
       

        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        with db.session.begin_nested():
            # Choose query based on groupType
            query = db.session.execute(text('''
                 select AC_CODE, Ac_Name_E,SUM(case drcr when 'D' then AMOUNT when 'C' then -amount end) as Balance ,
					 Group_Code,group_Summary,BSGroupName,group_Type,group_Order
					 from qryGledgernew 
					 where Company_Code= :company_code and DOC_DATE between :from_date and :to_date
					   group by AC_CODE,Ac_Name_E,Group_Code ,group_Summary,BSGroupName,group_Type,group_Order
					 having SUM(case drcr when 'D' then AMOUNT when 'C' then -amount end) !=0
                '''), {'from_date': from_date, 'to_date': to_date, 'company_code': company_code})

            # Fetch results
            result = query.fetchall()

            # Check if result is empty
            if not result:
                return jsonify({'message': 'No data found for the provided parameters'}), 404

            # Format response
            response = [
                {
                    **row._asdict(),
                    # Add any additional processing if required, e.g., formatting dates
                }
                for row in result
            ]

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)  # Log error stack
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    except ValueError as e:
        return jsonify({'error': 'Invalid input type for groupType'}), 400

@app.route(API_URL + '/Balancesheet_Report', methods=['GET'])
def Balancesheet_Report():
    try:
        # Extract query parameters
        
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')
        Year_Code=request.args.get('Year_Code')

        # Validate required parameters
        if not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        with db.session.begin_nested():
            # Choose query based on groupType
            query = db.session.execute(text('''
                 
                    select Group_Code,BSGroupName as groupname,group_Summary as summary,group_Order,AC_CODE, Ac_Name_E,
                    SUM(case drcr when 'D' then AMOUNT when 'C' then -amount end) as Balance,'' as acamount   from 
                    qryGledgernew where Company_Code =:company_code and YEAR_CODE <=:Year_Code
                    and group_Type='B' and DOC_DATE <= :to_date
                    group by Group_Code,BSGroupName,group_Summary,group_Order,AC_CODE,Ac_Name_E
                    having SUM(case drcr when 'D' then AMOUNT when 'C' then -amount end) <> 0 
                    order by group_Order,Group_Code 
  
                '''), {'Year_Code': Year_Code, 'to_date': to_date, 'company_code': company_code})

            # Fetch results
            result = query.fetchall()

            # Check if result is empty
            if not result:
                return jsonify({'message': 'No data found for the provided parameters'}), 404

            # Format response
            response = [
                {
                    **row._asdict(),
                    # Add any additional processing if required, e.g., formatting dates
                }
                for row in result
            ]

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)  # Log error stack
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    except ValueError as e:
        return jsonify({'error': 'Invalid input type for groupType'}), 400







