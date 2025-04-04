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
        "Inv_date": task['Inv_date'].strftime('%d-%m-%y') if task['Inv_date'] else None,
        #  "date": task['date'].strftime('%Y-%m-%d') if task['date'] else None,
    }


    
@app.route(API_URL+'/SaleTDS_Register', methods=['GET'])
def SaleTDS_Register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('toDate')
        CompanyCode=request.args.get('companyCode')
        YearCode=request.args.get('YearCode')
        acCode=request.args.get('acCode')

        print(from_date)
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        with db.session.begin_nested():
            if(acCode == ''):
                query = db.session.execute(text('''
                    select Pan,[Name Of Party] as Name_Of_Party ,Taxable_Amt,CGST,SGST,IGST,Bill_Amount,TDS_Amt,Party_Code,Inv_date,InvoiceNo from qryTCSSaleUnion where Inv_date between :from_date and :to_date
                                                and TDS_Amt !=0 and IsDeleted!=0  and  Company_Code=:CompanyCode and Year_Code= :Year_Code
                '''), {'from_date': from_date, 'to_date': to_date,'Year_Code' : YearCode,'CompanyCode' :CompanyCode})
            else:
                 query = db.session.execute(text('''
                    select Pan,[Name Of Party] as Name_Of_Party ,Taxable_Amt,CGST,SGST,IGST,Bill_Amount,TDS_Amt,Party_Code,Inv_date,InvoiceNo from qryTCSSaleUnion where Inv_date between :from_date and :to_date
                                                and TDS_Amt !=0 and IsDeleted!=0  and  Company_Code=:CompanyCode and Year_Code= :Year_Code and Party_Code= :acCode
                '''), {'from_date': from_date, 'to_date': to_date,'Year_Code' : YearCode,'CompanyCode' :CompanyCode,'acCode' : acCode})
          
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

@app.route(API_URL+'/SaleTCS_Register', methods=['GET'])
def SaleTCS_Register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('toDate')
        CompanyCode=request.args.get('companyCode')
        YearCode=request.args.get('YearCode')
        acCode=request.args.get('acCode')

        print(from_date)
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        with db.session.begin_nested():
            if(acCode == ''):
                query = db.session.execute(text('''
                    select Pan,[Name Of Party] as Name_Of_Party ,Taxable_Amt,CGST,SGST,IGST,Bill_Amount,TCS,Party_Code,Inv_date,InvoiceNo from qryTCSSaleUnion where Inv_date between :from_date and :to_date
                                                and TCS !=0 and IsDeleted!=0  and  Company_Code=:CompanyCode and Year_Code= :Year_Code
                '''), {'from_date': from_date, 'to_date': to_date,'Year_Code' : YearCode,'CompanyCode' :CompanyCode})
            else:
                 query = db.session.execute(text('''
                    select Pan,[Name Of Party] as Name_Of_Party ,Taxable_Amt,CGST,SGST,IGST,Bill_Amount,TCS,Party_Code,Inv_date,InvoiceNo from qryTCSSaleUnion where Inv_date between :from_date and :to_date
                                                and TCS !=0 and IsDeleted!=0  and  Company_Code=:CompanyCode and Year_Code= :Year_Code and Party_Code= :acCode
                '''), {'from_date': from_date, 'to_date': to_date,'Year_Code' : YearCode,'CompanyCode' :CompanyCode,'acCode' : acCode})
          
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

@app.route(API_URL+'/PurchaseTCS_Register', methods=['GET'])
def PurchaseTCS_Register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('toDate')
        CompanyCode=request.args.get('companyCode')
        YearCode=request.args.get('YearCode')
        acCode=request.args.get('acCode')

        print(from_date)
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        with db.session.begin_nested():
            if(acCode == ''):
                query = db.session.execute(text('''
                   select Pan,[Name Of Party] as Name_Of_Party,TCS ,Taxable_Amt,CGST,SGST,IGST,Bill_Amount,TCS,Party_Code,convert(varchar(10),date,103) as date,PSNo,Bill_No,dono from qryTCSPurchaseUnion where date between :from_date and :to_date
                                                and TCS !=0 and  Company_Code=:CompanyCode and Year_Code= :Year_Code
                '''), {'from_date': from_date, 'to_date': to_date,'Year_Code' : YearCode,'CompanyCode' :CompanyCode})
            else:
                 query = db.session.execute(text('''
                    select Pan,[Name Of Party] as Name_Of_Party,TCS ,Taxable_Amt,CGST,SGST,IGST,Bill_Amount,TCS,Party_Code,convert(varchar(10),date,103) as date,PSNo,Bill_No,dono from qryTCSPurchaseUnion where date between :from_date and :to_date
                                                and TCS !=0  and  Company_Code=:CompanyCode and Year_Code= :Year_Code and Party_Code= :acCode
                '''), {'from_date': from_date, 'to_date': to_date,'Year_Code' : YearCode,'CompanyCode' :CompanyCode,'acCode' : acCode})
          
            result = query.fetchall()

        response = []
        for row in result:
            row_dict = row._asdict()
            # formatted_dates = format_dates(row_dict)
            # row_dict.update(formatted_dates)
            response.append(row_dict)

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
@app.route(API_URL+'/PurchaseTDS_Register', methods=['GET'])
def PurchaseTDS_Register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('toDate')
        CompanyCode=request.args.get('companyCode')
        YearCode=request.args.get('YearCode')
        acCode=request.args.get('acCode')

        print(from_date)
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        with db.session.begin_nested():
            if(acCode == ''):
                query = db.session.execute(text('''
                    select Pan,[Name Of Party] as Name_Of_Party ,TDS_Amt,Taxable_Amt,CGST,SGST,IGST,Bill_Amount,TCS,Party_Code,convert(varchar(10),date,103) as date,PSNo,Bill_No,dono from qryTCSPurchaseUnion where date between :from_date and :to_date
                                                and TDS_Amt !=0 and  Company_Code=:CompanyCode and Year_Code= :Year_Code
                '''), {'from_date': from_date, 'to_date': to_date,'Year_Code' : YearCode,'CompanyCode' :CompanyCode})
            else:
                 query = db.session.execute(text('''
                    select Pan,[Name Of Party] as Name_Of_Party,TDS_Amt ,Taxable_Amt,CGST,SGST,IGST,Bill_Amount,TCS,Party_Code,convert(varchar(10),date,103) as date,PSNo,Bill_No,dono from qryTCSPurchaseUnion where date between :from_date and :to_date
                                                and TDS_Amt !=0  and  Company_Code=:CompanyCode and Year_Code= :Year_Code and Party_Code= :acCode
                '''), {'from_date': from_date, 'to_date': to_date,'Year_Code' : YearCode,'CompanyCode' :CompanyCode,'acCode' : acCode})
          
            result = query.fetchall()

        response = []
        for row in result:
            row_dict = row._asdict()
            # formatted_dates = format_dates(row_dict)
            # row_dict.update(formatted_dates)
            response.append(row_dict)

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500    

@app.route(API_URL + '/Purchase_Register', methods=['GET'])
def Purchase_Register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        CompanyCode = request.args.get('Company_Code')
        YearCode = request.args.get('Year_code')
        acCode = request.args.get('acCode')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        query_str = '''
            SELECT * FROM qrypurchasehead 
            WHERE doc_date BETWEEN :from_date AND :to_date
            AND Company_Code = :CompanyCode 
            AND Year_Code = :YearCode
        '''
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'CompanyCode': CompanyCode,
            'YearCode': YearCode
        }

        if acCode:  # Only add Ac_Code if it's provided
            query_str += " AND Ac_Code = :acCode"
            params['acCode'] = acCode

        with db.session.begin():
            result = db.session.execute(text(query_str), params).fetchall()

        response = [dict(row._asdict()) for row in result]

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


@app.route(API_URL + '/Sale_Register', methods=['GET'])
def Sale_Register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        CompanyCode = request.args.get('Company_Code')
        YearCode = request.args.get('Year_code')
        acCode = request.args.get('acCode')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        query_str = '''
            SELECT * FROM qrysalehead 
            WHERE doc_date BETWEEN :from_date AND :to_date
            AND Company_Code = :CompanyCode 
            AND Year_Code = :YearCode
        '''
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'CompanyCode': CompanyCode,
            'YearCode': YearCode
        }

        if acCode:  # Only add Ac_Code if it's provided
            query_str += " AND Ac_Code = :acCode"
            params['acCode'] = acCode

        query_str += " ORDER BY doc_date,doc_no"  # Ensure ORDER BY is added at the end

        with db.session.begin():
            result = db.session.execute(text(query_str), params).fetchall()

        # Convert SQLAlchemy result to dictionary format
        response = [dict(row._asdict()) if hasattr(row, '_asdict') else dict(row) for row in result]

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL + '/PurchaseReturn_Register', methods=['GET'])
def PurchaseReturn_Register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        CompanyCode = request.args.get('Company_Code')
        YearCode = request.args.get('Year_code')
        acCode = request.args.get('acCode')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        query_str = '''
            SELECT * FROM qrysugarpurchasereturnhead 
            WHERE doc_date BETWEEN :from_date AND :to_date
            AND Company_Code = :CompanyCode 
            AND Year_Code = :YearCode
        '''
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'CompanyCode': CompanyCode,
            'YearCode': YearCode
        }

        if acCode:  # Only add Ac_Code if it's provided
            query_str += " AND Ac_Code = :acCode"
            params['acCode'] = acCode

        query_str += " ORDER BY doc_date,doc_no"  # Ensure ORDER BY is added at the end

        with db.session.begin():
            result = db.session.execute(text(query_str), params).fetchall()

        # Convert SQLAlchemy result to dictionary format
        response = [dict(row._asdict()) if hasattr(row, '_asdict') else dict(row) for row in result]

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL + '/SaleReturnSale_Register', methods=['GET'])
def SaleReturnSale_Register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        CompanyCode = request.args.get('Company_Code')
        YearCode = request.args.get('Year_code')
        acCode = request.args.get('acCode')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        query_str = '''
            SELECT * FROM qrysugarsalereturnhead 
            WHERE doc_date BETWEEN :from_date AND :to_date
            AND Company_Code = :CompanyCode 
            AND Year_Code = :YearCode
        '''
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'CompanyCode': CompanyCode,
            'YearCode': YearCode
        }

        if acCode:  # Only add Ac_Code if it's provided
            query_str += " AND Ac_Code = :acCode"
            params['acCode'] = acCode

        query_str += " ORDER BY doc_date,doc_no"  # Ensure ORDER BY is added at the end

        with db.session.begin():
            result = db.session.execute(text(query_str), params).fetchall()

        # Convert SQLAlchemy result to dictionary format
        response = [dict(row._asdict()) if hasattr(row, '_asdict') else dict(row) for row in result]

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL + '/MillSaleReport_Register', methods=['GET'])
def MillSaleReport_Register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        CompanyCode = request.args.get('Company_Code')
        YearCode = request.args.get('Year_code')
        acCode = request.args.get('acCode')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        query_str = '''
            SELECT * FROM qrysaleheaddetail 
            WHERE doc_date BETWEEN :from_date AND :to_date
            AND Company_Code = :CompanyCode and IsDeleted !='0'
            AND Year_Code = :YearCode
        '''
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'CompanyCode': CompanyCode,
            'YearCode': YearCode
        }

        if acCode:  # Only add Ac_Code if it's provided
            query_str += " AND mill_code = :acCode"
            params['acCode'] = acCode

        query_str += " ORDER BY doc_date"  # Ensure ORDER BY is added at the end

        with db.session.begin():
            result = db.session.execute(text(query_str), params).fetchall()

        # Convert SQLAlchemy result to dictionary format
        response = [dict(row._asdict()) if hasattr(row, '_asdict') else dict(row) for row in result]

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL + '/MonthSaleWise_Register', methods=['GET'])
def MonthSaleWise_Register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        CompanyCode = request.args.get('Company_Code')
        YearCode = request.args.get('Year_code')
        acCode = request.args.get('acCode')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        query_str = '''
           select YEAR(dbo.nt_1_sugarsale.doc_date) AS yr, MONTH(dbo.nt_1_sugarsale.doc_date) AS mn, 
           dbo.nt_1_sugarsale.Company_Code, dbo.nt_1_sugarsale.Year_Code, 
           ISNULL(SUM(dbo.nt_1_sugarsaledetails.Quantal), 0) AS qntl, 
           ISNULL(SUM(dbo.nt_1_sugarsaledetails.item_Amount), 0) AS itmamount 
           FROM dbo.nt_1_sugarsale INNER JOIN  dbo.nt_1_sugarsaledetails ON 
           dbo.nt_1_sugarsale.saleid = dbo.nt_1_sugarsaledetails.saleid 
           where dbo.nt_1_sugarsale.doc_date  between :from_date and :to_date and  
           nt_1_sugarsale.Company_Code= :CompanyCode and nt_1_sugarsale.Year_Code= :YearCode  
           GROUP BY dbo.nt_1_sugarsale.Company_Code, dbo.nt_1_sugarsale.Year_Code, 
           YEAR(dbo.nt_1_sugarsale.doc_date), MONTH(dbo.nt_1_sugarsale.doc_date)
        '''
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'CompanyCode': CompanyCode,
            'YearCode': YearCode
        }

        # if acCode:  # Only add Ac_Code if it's provided
        #     query_str += " AND mill_code = :acCode"
        #     params['acCode'] = acCode

        #query_str += " ORDER BY doc_date"  # Ensure ORDER BY is added at the end

        with db.session.begin():
            result = db.session.execute(text(query_str), params).fetchall()

        # Convert SQLAlchemy result to dictionary format
        response = [dict(row._asdict()) if hasattr(row, '_asdict') else dict(row) for row in result]

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL + '/PurchaseMonthWise_Register', methods=['GET'])
def PurchaseMonthWise_Register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        CompanyCode = request.args.get('Company_Code')
        YearCode = request.args.get('Year_code')
        acCode = request.args.get('acCode')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        query_str = '''
           SELECT dbo.nt_1_sugarpurchase.Company_Code, dbo.nt_1_sugarpurchase.Year_Code,
             YEAR(dbo.nt_1_sugarpurchase.doc_date) AS yr, MONTH(dbo.nt_1_sugarpurchase.doc_date) AS mn,
             ISNULL(SUM(dbo.nt_1_sugarpurchasedetails.Quantal), 0) AS qntl, 
             ISNULL(SUM(dbo.nt_1_sugarpurchasedetails.item_Amount), 0) AS itemamt 
             FROM dbo.nt_1_sugarpurchase INNER JOIN dbo.nt_1_sugarpurchasedetails ON  
             dbo.nt_1_sugarpurchase.purchaseid = dbo.nt_1_sugarpurchasedetails.purchaseid  
             where dbo.nt_1_sugarpurchase.doc_date  between :from_date and :to_date 
             and  dbo.nt_1_sugarpurchase.Company_Code= :CompanyCode and dbo.nt_1_sugarpurchase.Year_Code= :YearCode  
             GROUP BY dbo.nt_1_sugarpurchase.Company_Code, dbo.nt_1_sugarpurchase.Year_Code, 
             YEAR(dbo.nt_1_sugarpurchase.doc_date), MONTH(dbo.nt_1_sugarpurchase.doc_date)
        '''
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'CompanyCode': CompanyCode,
            'YearCode': YearCode
        }

        # if acCode:  # Only add Ac_Code if it's provided
        #     query_str += " AND mill_code = :acCode"
        #     params['acCode'] = acCode

        #query_str += " ORDER BY doc_date"  # Ensure ORDER BY is added at the end

        with db.session.begin():
            result = db.session.execute(text(query_str), params).fetchall()

        # Convert SQLAlchemy result to dictionary format
        response = [dict(row._asdict()) if hasattr(row, '_asdict') else dict(row) for row in result]

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL + '/RCM_register', methods=['GET'])
def RCM_register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        CompanyCode = request.args.get('Company_Code')
        YearCode = request.args.get('Year_code')
        acCode = request.args.get('acCode')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        query_str = '''
            SELECT * FROM qryRCM 
            WHERE doc_date BETWEEN :from_date AND :to_date
            AND Company_Code = :CompanyCode 
            AND Year_Code = :YearCode
        '''
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'CompanyCode': CompanyCode,
            'YearCode': YearCode
        }

        # if acCode:  # Only add Ac_Code if it's provided
        #     query_str += " AND mill_code = :acCode"
        #     params['acCode'] = acCode

        #query_str += " ORDER BY doc_date"  # Ensure ORDER BY is added at the end

        with db.session.begin():
            result = db.session.execute(text(query_str), params).fetchall()

        # Convert SQLAlchemy result to dictionary format
        response = [dict(row._asdict()) if hasattr(row, '_asdict') else dict(row) for row in result]

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
