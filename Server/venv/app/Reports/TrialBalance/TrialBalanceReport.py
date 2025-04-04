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


@app.route(API_URL + '/TrialBalance-Report', methods=['GET'])
def TrialBalance_Report():
    try:
        # Extract query parameters
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')
        groupType = int(request.args.get('groupType', 0))  # Convert to integer with default 0 if not provided

        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        print(f"GroupType: {groupType}")

        with db.session.begin_nested():
            # Choose query based on groupType
            if groupType == 0:
                query = db.session.execute(text('''
                    SELECT 
                        AC_CODE, 
                        Ac_Name_E, 
                        CityName, 
                        SUM(CASE drcr WHEN 'D' THEN AMOUNT WHEN 'C' THEN -AMOUNT END) AS Balance, 
                        group_Type, 
                        Group_Code, 
                        group_Name_E
                    FROM qrygledger 
                    WHERE COMPANY_CODE = :company_code 
                      AND ((group_Type = 'B' AND DOC_DATE <= :to_date) 
                           OR (group_Type != 'B' AND DOC_DATE BETWEEN :from_date AND :to_date))
                    GROUP BY AC_CODE, Ac_Name_E, CityName, group_Type, Group_Code, group_Name_E 
                    HAVING SUM(CASE drcr WHEN 'D' THEN AMOUNT WHEN 'C' THEN -AMOUNT END) != 0 
                    ORDER BY Ac_Name_E, CityName;
                '''), {'from_date': from_date, 'to_date': to_date, 'company_code': company_code})
            else:
                query = db.session.execute(text('''
                    SELECT 
                        AC_CODE, 
                        Ac_Name_E, 
                        CityName, 
                        SUM(CASE drcr WHEN 'D' THEN AMOUNT WHEN 'C' THEN -AMOUNT END) AS Balance, 
                        group_Type, 
                        Group_Code, 
                        group_Name_E
                    FROM qrygledger 
                    WHERE Group_Code = :groupType 
                      AND COMPANY_CODE = :company_code 
                      AND ((group_Type = 'B' AND DOC_DATE <= :to_date) 
                           OR (group_Type != 'B' AND DOC_DATE BETWEEN :from_date AND :to_date))
                    GROUP BY AC_CODE, Ac_Name_E, CityName, group_Type, Group_Code, group_Name_E 
                    HAVING SUM(CASE drcr WHEN 'D' THEN AMOUNT WHEN 'C' THEN -AMOUNT END) != 0 
                    ORDER BY Ac_Name_E, CityName;
                '''), {'from_date': from_date, 'to_date': to_date, 'company_code': company_code, 'groupType': groupType})

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


@app.route(API_URL+'/TrialBalanceDetail-Report', methods=['GET'])
def TrialBalanceDetail_Report():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')
        # year_code = request.args.get('Year_Code')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        with db.session.begin_nested():
            query = db.session.execute(text('''
                select ac_code,SUM(case when DOC_DATE < :from_date then case when DRCR='D' then AMOUNT  else -amount end else 0 end ) as opbal ,
SUM(case when DOC_DATE between :from_date and :to_date then case when DRCR='D' then AMOUNT else 0 end else 0 end ) as debit, 
SUM(case when DOC_DATE between :from_date and :to_date then case when DRCR='C' then AMOUNT else 0 end else 0 end ) as credit,Ac_Name_E,group_Type, 
 0 as Op_Debit,0 as Op_Credit,0 as Tran_Debit, 0 as Tran_Credit,0 as Closing_Debit,0 as Closing_Credit 
from qryGledgernew 
        where DOC_DATE <= :to_date and Company_Code=1 group by ac_code,Ac_Name_E,group_Type  
having SUM(case when DOC_DATE < :from_date then case when DRCR='D' then AMOUNT  else -amount end else 0 end ) <> 0 and
SUM(case when DOC_DATE between :from_date and :to_date then case when DRCR='D' then AMOUNT else 0 end else 0 end ) <>0  and  SUM(case when DOC_DATE
between :from_date and :to_date then case when DRCR='C' then AMOUNT else 0 end else 0 end ) <> 0 
            '''), {'from_date': from_date, 'to_date': to_date,'company_code' :company_code})
           
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


@app.route(API_URL+'/DaywiseTrialBalanceDetail-Report', methods=['GET'])
def DaywiseTrialBalanceDetail_Report():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')
        # year_code = request.args.get('Year_Code')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        with db.session.begin_nested():
            query = db.session.execute(text('''
                        SELECT     SUM(CASE WHEN DOC_DATE < :from_date THEN CASE WHEN dbo.nt_1_gledger.DRCR = 'D' THEN AMOUNT ELSE - amount END ELSE 0 END) AS opening,
                        SUM(CASE WHEN DOC_DATE = :from_date THEN CASE WHEN dbo.nt_1_gledger.DRCR = 'D' THEN AMOUNT ELSE 0 END ELSE 0 END) AS debit, 
                        SUM(CASE WHEN DOC_DATE = :from_date THEN CASE WHEN dbo.nt_1_gledger.DRCR = 'C' THEN AMOUNT ELSE 0 END ELSE 0 END) AS credit, 
                        SUM(CASE WHEN DOC_DATE < :from_date THEN CASE WHEN dbo.nt_1_gledger.DRCR = 'D' THEN AMOUNT ELSE - amount END ELSE 0 END)  
                        + SUM(CASE WHEN DOC_DATE = :from_date THEN CASE WHEN dbo.nt_1_gledger.DRCR = 'D' THEN AMOUNT ELSE 0 END ELSE 0 END)  
                        - SUM(CASE WHEN DOC_DATE = :from_date THEN CASE WHEN dbo.nt_1_gledger.DRCR = 'C' THEN AMOUNT ELSE 0 END ELSE 0 END) AS balance, 
                        dbo.nt_1_gledger.AC_CODE,  dbo.nt_1_accountmaster.Ac_Name_E, dbo.nt_1_citymaster.city_name_e  
                        FROM  dbo.nt_1_gledger INNER JOIN  dbo.nt_1_accountmaster ON dbo.nt_1_gledger.ac = dbo.nt_1_accountmaster.accoid INNER JOIN  
                        dbo.nt_1_citymaster ON dbo.nt_1_accountmaster.cityid = dbo.nt_1_citymaster.cityid  
                        GROUP BY dbo.nt_1_gledger.AC_CODE, dbo.nt_1_accountmaster.Ac_Name_E, dbo.nt_1_accountmaster.Group_Code, dbo.nt_1_citymaster.city_name_e  
                        HAVING    
                        (SUM(CASE WHEN DOC_DATE < :from_date THEN CASE WHEN dbo.nt_1_gledger.DRCR = 'D' THEN AMOUNT ELSE - amount END ELSE 0 END)  +
                        SUM(CASE WHEN DOC_DATE = :from_date THEN CASE WHEN dbo.nt_1_gledger.DRCR = 'D' THEN AMOUNT ELSE 0 END ELSE 0 END)  - 
                        SUM(CASE WHEN DOC_DATE = :from_date THEN CASE WHEN dbo.nt_1_gledger.DRCR = 'C' THEN AMOUNT ELSE 0 END ELSE 0 END) <> 0) 


                  '''), {'from_date': from_date, 'to_date': to_date,'company_code' :company_code})
           
            result = query.fetchall()
        print(query)

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

@app.route(API_URL + '/JV-Report', methods=['GET'])
def JV_Report():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        doc_no = request.args.get('doc_no', None)  

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        sql_query = '''
            SELECT TRAN_TYPE, DOC_NO, CONVERT(varchar(10), DOC_DATE, 103) AS DOC_DATE,
                   Ac_Name_E, NARRATION,
                   (CASE WHEN DRCR = 'D' THEN amount ELSE 0 END) AS Debit,
                   (CASE WHEN DRCR = 'C' THEN amount ELSE 0 END) AS Credit
            FROM NT_1_qryJVAll 
            WHERE Company_Code = :company_code AND Year_Code = :year_code
                  AND DOC_DATE BETWEEN :from_date AND :to_date
        '''

        params = {
            'from_date': from_date,
            'to_date': to_date,
            'company_code': company_code,
            'year_code': year_code
        }

        if doc_no:
            sql_query += " AND DOC_NO = :doc_no"
            params['doc_no'] = doc_no

        with db.session.begin_nested():
            query = db.session.execute(text(sql_query), params)
            result = query.fetchall()

        response = [row._asdict() for row in result]
        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


@app.route(API_URL+'/GettingGroupType', methods=['GET'])
def GettingGroupType():
    try:
       
        company_code = request.args.get('Company_Code')
       

        if not company_code :
            return jsonify({'error': 'from_date and to_date are required'}), 400

        with db.session.begin_nested():
            query = db.session.execute(text('''
                       select group_Code,group_Name_E from nt_1_bsgroupmaster
                        where Company_Code=:company_code 
                  '''), {'company_code' :company_code})
           
            result = query.fetchall()
        print(query)

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

