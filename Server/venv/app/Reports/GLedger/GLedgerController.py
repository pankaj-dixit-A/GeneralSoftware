# app/routes/group_routes.py
from flask import jsonify, request
from app import app, db
from app.models.Reports.GLedeger.GLedgerModels import Gledger
import os
from sqlalchemy import text
import traceback
from datetime import datetime, time, timedelta
import logging
from decimal import Decimal 

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

def format_dates(task):
    return {
        "DOC_DATE": task.DOC_DATE.strftime('%Y-%m-%d') if task.DOC_DATE else None
    }
# Get all groups API
# Get all groups API
@app.route(API_URL+"/getall-Gledger", methods=["GET"])
def get_GledgerallData():
    try:
        # Extract Company_Code from query parameters
        Company_Code = request.args.get('Company_Code')
        yearCode = request.args.get('Year_Code')
        AC_CODE = request.args.get('AC_CODE')
        if Company_Code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            Company_Code = int(Company_Code)
            yearCode = int(yearCode)
            AC_CODE = int(AC_CODE)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code and Year Code and AC CODE parameter'}), 400

        # Fetch records by Company_Code
        records = Gledger.query.filter_by(COMPANY_CODE = Company_Code, YEAR_CODE = yearCode, AC_CODE = AC_CODE).order_by(Gledger.DOC_DATE,Gledger.TRAN_TYPE,Gledger.DOC_NO).all()

        # Convert groups to a list of dictionaries
        record_data = []
        for record in records:
            selected_Record_data = {column.key: getattr(record, column.key) for column in record.__table__.columns}
            # Format dates and append to selected_Record_data
            formatted_dates = format_dates(record)
            selected_Record_data.update(formatted_dates)
            record_data.append(selected_Record_data)

        return jsonify(record_data)
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500

  
# # Create a new group API
@app.route(API_URL+"/create-Record-gLedger", methods=["POST"])
def create_Record_Gledger():
    try:
        # Extract parameters from the request
        company_code = request.args.get('Company_Code')
        doc_no = request.args.get('DOC_NO')
        year_code = request.args.get('Year_Code')
        tran_type = request.args.get('TRAN_TYPE')
        
        # Check if required parameters are missing
        if None in [company_code, doc_no, year_code, tran_type]:
            return jsonify({'error': 'Missing parameters in the request'}), 400
        
        # Convert parameters to appropriate types
        company_code = int(company_code)
        doc_no = int(doc_no)
        year_code = int(year_code)
        tran_type = str(tran_type)

        # Check if the record exists
        sql = text("""
            DELETE FROM nt_1_gledger 
            WHERE COMPANY_CODE = :company_code 
              AND DOC_NO = :doc_no
              AND YEAR_CODE = :year_code
              AND TRAN_TYPE = :tran_type
        """)

        # Execute raw SQL query
        db.session.execute(sql, {
            'company_code': company_code,
            'doc_no': doc_no,
            'year_code': year_code,
            'tran_type': tran_type
        })
        
        db.session.commit()

        # Create new records
        new_records_data = request.json

        # Check if the request body is a list
        if not isinstance(new_records_data, list):
            return jsonify({'error': 'Request body must be a list of records'}), 400

        new_records = []
        for record_data in new_records_data:
            record_data['COMPANY_CODE'] = company_code
            record_data['DOC_NO'] = doc_no
            record_data['YEAR_CODE'] = year_code
            record_data['TRAN_TYPE'] = tran_type
            new_record = Gledger(**record_data)
            new_records.append(new_record)

        # Add new records to the session
        db.session.add_all(new_records)
        db.session.commit()

        return jsonify({
            'message': 'Records created successfully',
            'records': [record_data for record_data in new_records_data]
        }), 201

    except Exception as e:
        print("Traceback",traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route(API_URL + "/delete-Record-gLedger", methods=["DELETE"])
def delete_Record_Gledger():
    try:
        # Extract parameters from the request
        company_code = request.args.get('Company_Code')
        doc_no = request.args.get('DOC_NO')
        year_code = request.args.get('Year_Code')
        tran_type = request.args.get('TRAN_TYPE')
        
        # Check if required parameters are missing
        if None in [company_code, doc_no, year_code, tran_type]:
            return jsonify({'error': 'Missing parameters in the request'}), 400
        
        # Convert parameters to appropriate types
        try:
            company_code = int(company_code)
            doc_no = int(doc_no)
            year_code = int(year_code)
            tran_type = str(tran_type)
        except ValueError:
            return jsonify({'error': 'Invalid parameter type'}), 400

        # Start a transaction
        with db.session.begin():
            # Fetch and delete all existing records
            existing_records = Gledger.query.filter_by(
                COMPANY_CODE=company_code,
                DOC_NO=doc_no,
                YEAR_CODE=year_code,
                TRAN_TYPE=tran_type
            ).delete(synchronize_session='fetch')
        
        db.session.commit()

        return jsonify({
            'message': 'Records deleted successfully',
            'deleted_records_count': existing_records
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@app.route(API_URL + "/get_gLedgerReport_AcWise", methods=["GET"])
def get_gLedgerReport_AcWise():
    def format_date(date):
        if date:
            return date.strftime('%d/%m/%Y')
        return None
    try:
        # Get query parameters
        company_code = request.args.get('Company_Code')
        # year_code = request.args.get('Year_Code')
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        accode = int(request.args.get('Accode')) if request.args.get('Accode') else None

        # Ensure required parameters are present
        if not company_code :
            return jsonify({"error": "Missing 'Company_Code' Parameter"}), 400

        # Base SQL query
        query = '''
            SELECT dbo.nt_1_gledger.TRAN_TYPE, dbo.nt_1_gledger.DOC_NO, dbo.nt_1_gledger.DOC_DATE, dbo.nt_1_gledger.AC_CODE, dbo.nt_1_accountmaster.Ac_Name_E, 
                   dbo.nt_1_gledger.NARRATION, 
                   CASE WHEN dbo.nt_1_gledger.drcr = 'D' THEN dbo.nt_1_gledger.AMOUNT ELSE 0 END AS debit, 
                   CASE WHEN dbo.nt_1_gledger.drcr = 'C' THEN dbo.nt_1_gledger.AMOUNT ELSE 0 END AS credit,0 as Balance, dbo.nt_1_gledger.drcr,dbo.nt_1_gledger.AMOUNT
            FROM dbo.nt_1_gledger 
            LEFT OUTER JOIN dbo.nt_1_accountmaster 
            ON dbo.nt_1_gledger.ac = dbo.nt_1_accountmaster.accoid
            WHERE dbo.nt_1_gledger.COMPANY_CODE = :company_code 
            and dbo.nt_1_gledger.AC_CODE = :Accode
            
        '''
        if from_date and to_date :
            query += " AND dbo.nt_1_gledger.DOC_DATE BETWEEN :from_date AND :to_date order by DOC_DATE asc,tran_type,cashcredit,doc_no,SORT_TYPE,SORT_NO,ORDER_CODE "

        # Execute the query with parameters
        additional_data = db.session.execute(
            text(query), 
            {"company_code": company_code,"from_date": from_date, 
             "to_date": to_date,'Accode' : accode}
        )

        # Fetch results
        additional_data_rows = additional_data.fetchall()

        # Convert rows to dictionaries
        all_data = [dict(row._mapping) for row in additional_data_rows]

        # Format date fields
        for data in all_data:
            if 'DOC_DATE' in data:
                data['DOC_DATE'] = format_date(data['DOC_DATE'])

        with db.session.begin_nested():
            # Execute query2 first
            query2 = db.session.execute(
                text('''
                     SELECT top(1) group_Type from qrymstaccountmaster
            WHERE Company_Code = :company_code 
            
            and Ac_code = :Accode
                '''),
               {"company_code": company_code, "from_date": from_date, 
             "to_date": to_date,'Accode' : accode}
            )
            GroupData = [dict(row._mapping) for row in query2.fetchall()]
            GroupType=GroupData[0].get('group_Type', None)  

            if GroupType=='B' :
                    query3 = db.session.execute(
                    text('''
                        select AC_CODE,SUM(case drcr when 'D' then AMOUNT when 'C' then -amount end) as  OpBal from nt_1_gledger
                WHERE dbo.nt_1_gledger.COMPANY_CODE = :company_code 
                and dbo.nt_1_gledger.AC_CODE = :Accode
                and dbo.nt_1_gledger.DOC_DATE < :from_date  
                         group by AC_CODE          
                    '''),
                {"company_code": company_code,"from_date": from_date, 
                "to_date": to_date,'Accode' : accode}
                )
                    OpeingBalanceData = [dict(row._mapping) for row in query3.fetchall()]
                    
            else :
                    query3 = db.session.execute(
                    text('''
                        select AC_CODE,SUM(case drcr when 'D' then AMOUNT when 'C' then -amount end) as  OpBal from nt_1_gledger 
                WHERE dbo.nt_1_gledger.COMPANY_CODE = :company_code 
                
                and dbo.nt_1_gledger.AC_CODE = :Accode
                and dbo.nt_1_gledger.DOC_DATE >= :from_date  
                and dbo.nt_1_gledger.DOC_DATE < :from_date  
                         
                         group by nt_1_gledger.AC_CODE     
                    '''),
                {"company_code": company_code,"from_date": from_date, 
                "to_date": to_date,'Accode' : accode}
                )
                    OpeingBalanceData = [dict(row._mapping) for row in query3.fetchall()]
                    
        # Prepare response
        response = {
            "all_data": all_data,
            "Opening_Balance" :OpeingBalanceData,
        }

        # Return response
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/getAll-groupCodes", methods=["GET"])
def getAll_groupCodes():
    try:

        query = ('''SELECT         dbo.nt_1_bsgroupmaster.group_Name_E,dbo.nt_1_bsgroupmaster.group_Code
FROM            dbo.nt_1_accountmaster INNER JOIN
                         dbo.nt_1_gledger ON dbo.nt_1_accountmaster.Ac_Code = dbo.nt_1_gledger.AC_CODE AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_gledger.COMPANY_CODE INNER JOIN
                         dbo.nt_1_bsgroupmaster ON dbo.nt_1_accountmaster.Group_Code = dbo.nt_1_bsgroupmaster.group_Code AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_bsgroupmaster.Company_Code
GROUP BY  dbo.nt_1_bsgroupmaster.group_Name_E
,dbo.nt_1_bsgroupmaster.group_Code order by dbo.nt_1_bsgroupmaster.group_Code
                                 '''
            )
        additional_data = db.session.execute(text(query))

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]
 
        response = {
            "all_Groups": all_data
        }

        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/getAll-AccountsWithCounts", methods=["GET"])
def getAll_AccountsWithCounts():
    try:

        groupCode = request.args.get('groupCode')

        if not groupCode:
            return jsonify({"Missing GroupCode"}, 404)

        query = ('''SELECT        dbo.nt_1_accountmaster.Ac_Name_E, dbo.nt_1_gledger.AC_CODE, dbo.nt_1_bsgroupmaster.group_Name_E,dbo.nt_1_bsgroupmaster.group_Code, COUNT(*) AS counts
FROM            dbo.nt_1_accountmaster INNER JOIN
                         dbo.nt_1_gledger ON dbo.nt_1_accountmaster.Ac_Code = dbo.nt_1_gledger.AC_CODE AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_gledger.COMPANY_CODE INNER JOIN
                         dbo.nt_1_bsgroupmaster ON dbo.nt_1_accountmaster.Group_Code = dbo.nt_1_bsgroupmaster.group_Code AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_bsgroupmaster.Company_Code
                         where dbo.nt_1_bsgroupmaster.group_Code = :groupCode
GROUP BY dbo.nt_1_accountmaster.Ac_Name_E, dbo.nt_1_gledger.AC_CODE, dbo.nt_1_bsgroupmaster.group_Name_E,dbo.nt_1_bsgroupmaster.group_Code
order by  COUNT(*) desc
                                 '''
            )
        additional_data = db.session.execute(text(query),{'groupCode':groupCode})

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]
 
        response = {
            "all_Accounts": all_data
        }

        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + '/MultipleLedger', methods=['GET'])
def MultipleLedger():
    try:
        From_Date = request.args.get('from_date')
        To_Date = request.args.get('to_date')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        ac_codes = request.args.get('ac_codes')

        if ac_codes:
            ac_codes = list(map(int, ac_codes.split(',')))

        if not From_Date or not To_Date or not Company_Code or not Year_Code:
            return jsonify({'error': 'Missing required parameter'}), 400
        
        From_Date = datetime.strptime(From_Date, '%Y-%m-%d').date()
        To_Date = datetime.strptime(To_Date, '%Y-%m-%d').date()

        query_opbal = db.session.execute(
            text('''
               SELECT        dbo.nt_1_gledger.AC_CODE, SUM(CASE dbo.nt_1_gledger.DRCR WHEN 'D' THEN dbo.nt_1_gledger.AMOUNT WHEN 'C' THEN - dbo.nt_1_gledger.AMOUNT END) AS OpBal
               FROM            dbo.nt_1_gledger INNER JOIN
                         dbo.nt_1_accountmaster ON dbo.nt_1_gledger.AC_CODE = dbo.nt_1_accountmaster.Ac_Code AND dbo.nt_1_gledger.COMPANY_CODE = dbo.nt_1_accountmaster.company_code
                                 WHERE  dbo.nt_1_gledger.COMPANY_CODE = :company_code and dbo.nt_1_gledger.DOC_DATE < '2024-04-01' AND dbo.nt_1_gledger.AC_CODE IN :ac_codes
                GROUP BY dbo.nt_1_gledger.AC_CODE
            '''), 
            {"company_code": Company_Code, 'ac_codes': tuple(ac_codes)}
        )

        OpBalData = {row[0]: row[1] for row in query_opbal.fetchall()}

        query3 = db.session.execute(
            text('''
               SELECT        dbo.nt_1_gledger.TRAN_TYPE, dbo.nt_1_gledger.CASHCREDIT, dbo.nt_1_gledger.DOC_NO, CONVERT(varchar,dbo.nt_1_gledger.DOC_DATE,103) AS DOC_DATE, dbo.nt_1_gledger.AC_CODE, dbo.nt_1_accountmaster.Ac_Name_E, 
                         dbo.nt_1_bsgroupmaster.group_Type, dbo.nt_1_gledger.NARRATION, dbo.nt_1_gledger.AMOUNT, dbo.nt_1_gledger.COMPANY_CODE, dbo.nt_1_gledger.YEAR_CODE, dbo.nt_1_gledger.DRCR, dbo.nt_1_gledger.DRCR_HEAD,dbo.nt_1_gledger.ORDER_CODE, 
                         nt_1_accountmaster_1.Ac_Name_E AS drcrname
FROM            dbo.nt_1_gledger INNER JOIN
                         dbo.nt_1_accountmaster ON dbo.nt_1_gledger.AC_CODE = dbo.nt_1_accountmaster.Ac_Code AND dbo.nt_1_gledger.COMPANY_CODE = dbo.nt_1_accountmaster.company_code INNER JOIN
                         dbo.nt_1_bsgroupmaster ON dbo.nt_1_accountmaster.Group_Code = dbo.nt_1_bsgroupmaster.group_Code AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_bsgroupmaster.Company_Code LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS nt_1_accountmaster_1 ON dbo.nt_1_gledger.DRCR_HEAD = nt_1_accountmaster_1.Ac_Code AND dbo.nt_1_gledger.COMPANY_CODE = nt_1_accountmaster_1.company_code
WHERE        dbo.nt_1_gledger.COMPANY_CODE = :company_code 
                AND dbo.nt_1_gledger.YEAR_CODE = :year_code 
                AND dbo.nt_1_gledger.DOC_DATE >= :from_date
                AND dbo.nt_1_gledger.DOC_DATE <= :to_date
                AND dbo.nt_1_gledger.AC_CODE IN :ac_codes
                ORDER BY Ac_Code, doc_date, doc_no, DRCR
            '''),
            {"company_code": Company_Code, "year_code": Year_Code, "to_date": To_Date,"from_date": From_Date, 'ac_codes': tuple(ac_codes) }
        )

        LedgerData = [dict(row._mapping) for row in query3.fetchall()]

        query_details = db.session.execute(
            text('''
                SELECT dbo.nt_1_gledger.AC_CODE, dbo.nt_1_accountmaster.Ac_Name_E AS Ac_Name_E, dbo.nt_1_gledger.DRCR, dbo.nt_1_gledger.TRAN_TYPE, dbo.nt_1_gledger.DOC_NO, CONVERT(varchar,dbo.nt_1_gledger.DOC_DATE,103) AS DOC_DATE, 
                         dbo.nt_1_gledger.COMPANY_CODE, dbo.nt_1_gledger.YEAR_CODE, dbo.nt_1_gledger.AMOUNT, dbo.nt_1_gledger.NARRATION
                        FROM  dbo.nt_1_gledger INNER JOIN
                         dbo.nt_1_accountmaster ON dbo.nt_1_gledger.AC_CODE = dbo.nt_1_accountmaster.Ac_Code
                WHERE (dbo.nt_1_gledger.TRAN_TYPE NOT IN ('BR', 'CR', 'BP', 'CP', 'JV')) AND (dbo.nt_1_gledger.COMPANY_CODE = :company_code) AND (dbo.nt_1_gledger.YEAR_CODE = :year_code) AND (dbo.nt_1_gledger.DOC_DATE BETWEEN :from_date AND 
                         :to_date) AND dbo.nt_1_gledger.AC_CODE IN :ac_codes
            '''),
            {"company_code": Company_Code, "year_code": Year_Code, "from_date": From_Date, "to_date": To_Date, 'ac_codes': tuple(ac_codes)}
        )

        detailData = [dict(row._mapping) for row in query_details.fetchall()]

        Balance = Decimal(0)  
        Debit_Amount = Decimal(0)  
        Credit_Amount = Decimal(0) 
        Account_Code = None
        final_response_data = []

        for row in LedgerData:
            if Account_Code != row['AC_CODE']:
                Account_Code = row['AC_CODE']
                OpBal = OpBalData.get(Account_Code, 0)

                if OpBal == 0:
                    Balance = Decimal(0)  
                else:
                    Balance = Decimal(OpBal) 

                opening_entry = {
                    "AC_CODE": Account_Code, 
                    "Ac_Name_E": row['Ac_Name_E'],
                    "Balance": abs(float(OpBal)),
                    "DOC_DATE": From_Date.strftime('%d/%m/%Y') if From_Date else None,  
                    "NARRATION": "Opening balance",
                    "TRAN_TYPE": "OP",
                    "BALANCEDRCR": 'Dr' if Balance > 0 else 'Cr',
                    "COMPANY_CODE": Company_Code,
                    "YEAR_CODE": Year_Code,
                    "DEBIT_AMOUNT": Balance if Balance > 0 else 0,
                    "CREDIT_AMOUNT":Balance if Balance < 0 else 0,
                    "DRCR" : 'D' if Balance > 0 else 'Cr',
                    "DRCR_NAME":row['drcrname'],
                    "ORDER_CODE":row['ORDER_CODE'],
                    "group_Type":row['group_Type']
                }
                final_response_data.append(opening_entry)  
                Debit_Amount = Decimal(0)
                Credit_Amount = Decimal(0)

            amount = Decimal(row['AMOUNT'])

            if row['DRCR'] == 'D': 
                Debit_Amount = amount
                Credit_Amount = 0
                Balance += amount
            elif row['DRCR'] == 'C': 
                Credit_Amount = amount
                Debit_Amount  = 0
                Balance -= amount

            row['Debit_Amount'] = float(Debit_Amount)
            row['Credit_Amount'] = float(Credit_Amount)
            row['Balance'] = abs(Balance)
            detail_entry_1 = [
                d for d in detailData
                if d['AC_CODE'] == row['AC_CODE'] 
                and d['TRAN_TYPE'] == row['TRAN_TYPE'] 
                and d['DOC_NO'] == row['DOC_NO'] 
                and d['DOC_DATE'] == row['DOC_DATE'] 
                and d['COMPANY_CODE'] == row['COMPANY_CODE'] 
                and d['YEAR_CODE'] == row['YEAR_CODE']
            ]

            detail_entry_2 = []
            for d in LedgerData:
                if d['TRAN_TYPE'] in ["CP", "BP", "CR", "BR"] and d['AC_CODE'] == row['AC_CODE'] and d['DOC_NO'] == row['DOC_NO']:
                    detail_entry_2.append({
                        'TRAN_TYPE': d['TRAN_TYPE'],
                        'DOC_NO': d['DOC_NO'],
                        'DOC_DATE': d['DOC_DATE'],
                        'COMPANY_CODE': d['COMPANY_CODE'],
                        'YEAR_CODE': d['YEAR_CODE'],
                        'AC_CODE': d['DRCR_HEAD'],
                        'DRCR': 'Cr' if d['DRCR'] == 'D' else 'Dr', 
                        'AMOUNT': d['AMOUNT'],
                        'Ac_Name_E': d['drcrname'],
                        'NARRATION': d['NARRATION']
                    })
                    break  

            if row['TRAN_TYPE'] == 'JV':
                if row['DRCR_HEAD'] == 'D':
                    for detail in LedgerData:
                        if detail['DRCR'] == 'C':  
                            detail_entry = {
                                'TRAN_TYPE': detail['TRAN_TYPE'],
                                'DOC_NO': detail['DOC_NO'],
                                'DOC_DATE': detail['DOC_DATE'],
                                'COMPANY_CODE': detail['COMPANY_CODE'],
                                'YEAR_CODE': detail['YEAR_CODE'],
                                'AC_CODE': detail['AC_CODE'],
                                'DRCR': detail['DRCR'],
                                'AMOUNT': detail['AMOUNT'],
                                'Ac_Name_E': detail.get('Ac_Name_E', 'No Name'),
                                'NARRATION': row['NARRATION']
                }
                            detail_entry_1.append(detail_entry)
                            break  

                elif row['DRCR_HEAD'] == 'C':
                    for detail in LedgerData:
                        if detail['DRCR'] == 'D': 
                            detail_entry = {
                    'TRAN_TYPE': detail['TRAN_TYPE'],
                    'DOC_NO': detail['DOC_NO'],
                    'DOC_DATE': detail['DOC_DATE'],
                    'COMPANY_CODE': detail['COMPANY_CODE'],
                    'YEAR_CODE': detail['YEAR_CODE'],
                    'AC_CODE': detail['AC_CODE'],
                    'DRCR': detail['DRCR'],
                    'AMOUNT': detail['AMOUNT'],
                    'Ac_Name_E': detail.get('Ac_Name_E', 'No Name'),
                    'NARRATION': row['NARRATION']
                }
                        detail_entry_1.append(detail_entry)
                        break  

            row['detailData'] = detail_entry_1 + detail_entry_2

            final_response_data.append(row)

        response_data = {
            'LedgerData': final_response_data
        }

        return jsonify(response_data)

    except Exception as e:
        print("Error:", str(e)) 
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#GET Day wise Ledger Statements
@app.route(API_URL+'/get_DayBook', methods=['GET'])
def get_DayBook():
    company_code = request.args.get('company_code')
    year_code = request.args.get('year_code')
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')
    
    query = '''
        SELECT dbo.nt_1_gledger.TRAN_TYPE, dbo.nt_1_gledger.DOC_NO, dbo.nt_1_gledger.DOC_DATE, 
               dbo.nt_1_gledger.AC_CODE, dbo.nt_1_accountmaster.Ac_Name_E, 
               dbo.nt_1_gledger.NARRATION, 
               CASE WHEN dbo.nt_1_gledger.drcr = 'D' THEN dbo.nt_1_gledger.AMOUNT ELSE 0 END AS debit, 
               CASE WHEN dbo.nt_1_gledger.drcr = 'C' THEN dbo.nt_1_gledger.AMOUNT ELSE 0 END AS credit, 
               0 as Balance, dbo.nt_1_gledger.drcr, dbo.nt_1_gledger.AMOUNT
        FROM dbo.nt_1_gledger 
        LEFT OUTER JOIN dbo.nt_1_accountmaster 
        ON dbo.nt_1_gledger.ac = dbo.nt_1_accountmaster.accoid
        WHERE dbo.nt_1_gledger.COMPANY_CODE = :company_code 
        AND dbo.nt_1_gledger.YEAR_CODE = :year_code
    '''
    
    params = {"company_code": company_code, "year_code": year_code}

    if from_date and to_date:
        query += " AND dbo.nt_1_gledger.DOC_DATE BETWEEN :from_date AND :to_date"
        params["from_date"] = from_date
        params["to_date"] = to_date
    
    query += " ORDER BY DOC_DATE ASC, tran_type, cashcredit, doc_no, SORT_TYPE, SORT_NO, ORDER_CODE"
    
    result = db.session.execute(text(query), params)
    all_data = [dict(row._mapping) for row in result]

    for data in all_data:
        if 'DOC_DATE' in data:
            data['DOC_DATE'] = data['DOC_DATE'].strftime('%Y-%m-%d') if data['DOC_DATE'] else None
 
    response = {"Day_Book": all_data}
    return jsonify(response), 200







