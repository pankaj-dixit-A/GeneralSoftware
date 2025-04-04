from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
import os

API_URL = os.getenv('API_URL')

@app.route(API_URL+'/sales-gst-report', methods=['GET'])
def sales_gst_report():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        with db.session.begin_nested():
            query = db.session.execute(text('''
                SELECT 
                    (CASE WHEN ISNULL(Carporate_Sale_No, 0) = 0 THEN Ac_Code ELSE carporate_ac END) AS Ac_Code,
                    (CASE WHEN ISNULL(Carporate_Sale_No, 0) = 0 THEN PartyName ELSE Ac_Name_E END) AS PartyName,
                    (CASE WHEN ISNULL(Carporate_Sale_No, 0) = 0 THEN [GSTIN/UIN of Recipient] ELSE LTRIM(RTRIM(Gst_No)) END) AS [GSTIN/UIN of Recipient],
                    (CASE WHEN ISNULL(Carporate_Sale_No, 0) = 0 THEN PartyStateCode ELSE ISNULL(NULLIF(CA_GSTStateCode, ''), 0) END) AS PartyStateCode,
                    'SB2024-25-' + CONVERT(NVARCHAR, doc_no) AS [Invoice Number],
                    REPLACE(CONVERT(CHAR(11), doc_date, 106), ' ', '-') AS [Invoice date],
                    [Invoice Value],
                    (CASE WHEN ISNULL(Carporate_Sale_No, 0) = 0 THEN [Place Of Supply] ELSE RIGHT('0' + CONVERT(NVARCHAR, CA_GSTStateCode), 2) + '-' + LTRIM(RTRIM(state_name)) END) AS [Place Of Supply],
                    'N' AS [Reverse Charge],
                    'Regular' AS [Invoice Type],
                    '' AS [E-Commerce GSTIN],
                    Rate,
                    [Taxable Value],
                    '' AS [Cess Amount]
                FROM qrysaleheadfor_GSTReturn
                WHERE doc_date >= '2017-07-01'
                    AND doc_date BETWEEN :from_date AND :to_date
                    AND IsDeleted != 0
                    AND Company_Code = 1
                    AND Year_Code = 3
                    AND UnregisterGST = 0
                    AND doc_no != 0
            '''), {'from_date': from_date, 'to_date': to_date})

            result = query.fetchall()

        response = [dict(row._asdict()) for row in result]

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

#Sale Summary GST Report 
@app.route(API_URL+'/salebill-summary', methods=['GET'])
def SaleBill_Summary():
    try:
        from_date = request.args.get('fromDate')
        to_date = request.args.get('toDate')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        accode = request.args.get('accode')

        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not company_code or not year_code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        query_str = '''
            SELECT 
                ROW_NUMBER() OVER(ORDER BY doc_date) AS SR_No,
                'SB' + CONVERT(NVARCHAR, doc_no) AS Invoice_No,
                billtogstno AS PartyGSTNo,
                Ac_Code AS PartyCode,
                billtoname AS PartyName,
                millshortname AS Mill_Name,
                partygststatecode AS billtogststatecode,
                CONVERT(VARCHAR(10), doc_date, 103) AS Invoice_Date,
                LORRYNO AS Vehicle_No,
                SUM(Quantal) AS Quintal,
                CASE WHEN SUM(Quantal) <> 0 THEN SUM(item_Amount) / SUM(Quantal) ELSE 0 END AS Rate,
                SUM(TaxableAmount) AS TaxableAmount,
                SUM(CGSTAmount) AS CGST,
                SUM(SGSTAmount) AS SGST,
                SUM(IGSTAmount) AS IGST,
                SUM(Bill_Amount) AS Payable_Amount,
                DO_No,
                ackno AS ACKNo
            FROM qrysalebillresgistersummary
            WHERE 
                doc_no != 0 
                AND doc_date BETWEEN :from_date AND :to_date
                AND Company_Code = :company_code
                AND Year_Code = :year_code
                AND IsDeleted = 1
        '''
        
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'company_code': company_code,
            'year_code': year_code
        }

        if accode:  # Only add Ac_Code condition if provided
            query_str += " AND Ac_Code = :accode"
            params['accode'] = accode

        query_str += '''
            GROUP BY doc_no, billtogstno, Ac_Code, billtoname, millshortname,
                     partygststatecode, doc_date, LORRYNO, DO_No, ackno
            ORDER BY doc_date
        '''

        with db.session.begin():
            query = db.session.execute(text(query_str), params)
            results = query.mappings().all()
        
        return jsonify([dict(row) for row in results])

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

#Purchase Summary GST Report 
@app.route(API_URL+'/purchasebill-summary', methods=['GET'])
def purchasebill_Summary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        accode = request.args.get('accode')

        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not company_code or not year_code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        query_str = '''
            SELECT 
                ROW_NUMBER() OVER(ORDER BY doc_date, doc_no) AS SR_No,
                'PS' + CONVERT(NVARCHAR, doc_no) AS OurNo,
                Bill_No AS MillInvoiceNo,
                EWay_Bill_No AS MillEwayBill_NO,
                suppliergstno AS FromGSTNo,
                Ac_Code AS Party_Code,
                suppliername AS Party_Name,
                millshortname AS Mill_Name,
                GSTStateCode AS FromStateCode,
                CONVERT(VARCHAR(10), doc_date, 103) AS Date,
                LORRYNO AS Vehicle_No,
                SUM(ISNULL(Quantal, 0)) AS Quintal,
                rate AS Rate,
                subTotal AS TaxableAmount,
                CGSTAmount AS CGST,
                SGSTAmount AS SGST,
                IGSTAmount AS IGST,
                Bill_Amount AS Payable_Amount,
                PURCNO AS DO
            FROM qrypurchaseheaddetail  
            WHERE  
                doc_date >= '2017-07-01'
                AND doc_date BETWEEN :from_date AND :to_date
                AND Company_Code = :company_code
                AND Year_Code = :year_code
        '''

        params = {
            'from_date': from_date,
            'to_date': to_date,
            'company_code': company_code,
            'year_code': year_code
        }

        if accode:  # Append Ac_Code condition if provided
            query_str += " AND Ac_Code = :accode"
            params['accode'] = accode

        query_str += '''
            GROUP BY doc_no, Bill_No, Ac_Code, suppliername, suppliergstno, GSTStateCode, doc_date, 
                     LORRYNO, rate, subTotal, CGSTAmount, SGSTAmount, IGSTAmount, Bill_Amount, PURCNO, 
                     EWay_Bill_No, millshortname
            ORDER BY doc_date, doc_no
        '''

        with db.session.begin():
            query = db.session.execute(text(query_str), params)
            results = query.mappings().all()

        return jsonify([dict(row) for row in results])

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


    #Purchase Summary GST Report 


@app.route(API_URL+'/retailsalebill-summary', methods=['GET'])
def retailsalebill_Summary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        accode = request.args.get('accode')

        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not company_code or not year_code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        # Base query
        query_str = '''
            SELECT 
                h.Tran_Type,
                CONVERT(NVARCHAR, h.doc_no) AS Invoice_No,
                p.Gst_No AS PartyGSTNo,
                h.Party_Code,
                p.Ac_Name_E AS PartyName,
                p.GSTStateCode AS PartyStateCode,
                CONVERT(VARCHAR(10), h.doc_date, 103) AS Invoice_Date,
                h.Vahical_No,
                h.Taxable_Amount AS TaxableAmount,
                h.CGST_Amount AS CGST,
                h.SGST_Amount AS SGST,
                h.IGST_Amount AS IGST,
                h.NetValue AS Final_Amount
            FROM Retail_Head h  
            LEFT JOIN NT_1_AccountMaster p 
                ON h.Party_Code = p.Ac_Code 
                AND h.Company_Code = p.Company_Code
            WHERE h.doc_date >= '2017-07-01'
                AND h.doc_date BETWEEN :from_date AND :to_date  
                AND h.Company_Code = :company_code
                AND h.Year_Code = :year_code
        '''

        params = {
            'from_date': from_date,
            'to_date': to_date,
            'company_code': company_code,
            'year_code': year_code
        }

        if accode:  # Append Party_Code condition if provided
            query_str += " AND h.Party_Code = :accode"
            params['accode'] = accode

        query_str += " ORDER BY h.doc_date"

        # Execute query
        with db.session.begin():
            query = db.session.execute(text(query_str), params)
            results = query.mappings().all()

        return jsonify([dict(row) for row in results])

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route(API_URL+'/frieghtbill-summary', methods=['GET'])
def frieghtbill_Summary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        accode = request.args.get('accode')

        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not company_code or not year_code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        # Base query
        query_str = '''
            SELECT 
                '' AS Challan_No,
                d.doc_no AS DO_No,
                CONVERT(VARCHAR(10), d.doc_date, 103) AS Date,
                d.mill_code AS Mill_Code,
                m.Ac_Name_E AS MillName,
                d.MillGSTStateCode AS MillStateCode,
                d.SaleBillTo AS Billed_To,
                p.Ac_Name_E AS BillToName,
                CASE 
                    WHEN ISNULL(d.SaleBillTo, 0) = 0 THEN 27 
                    ELSE d.SalebilltoGstStateCode 
                END AS BillToStateCode, 
                T.Ac_Name_E AS TransportName,
                CASE 
                    WHEN ISNULL(d.SaleBillTo, 0) = 0 THEN 27 
                    ELSE d.TransportGSTStateCode 
                END AS TransportStateCode,  
                d.truck_no AS Vehicle_No,
                d.quantal AS Quintal,
                d.MM_Rate AS Rate,
                d.Memo_Advance AS Amount  
            FROM NT_1_deliveryorder d  
            LEFT JOIN dbo.nt_1_accountmaster AS T 
                ON d.transport = T.Ac_Code 
                AND d.company_code = T.company_code 
            LEFT JOIN NT_1_AccountMaster m 
                ON d.mill_code = m.Ac_Code 
                AND d.company_code = m.Company_Code  
            LEFT JOIN NT_1_AccountMaster p 
                ON d.SaleBillTo = p.Ac_Code 
                AND d.company_code = p.Company_Code  
            WHERE d.doc_date >= '2017-07-01' 
                AND d.doc_date BETWEEN :from_date AND :to_date 
                AND d.company_code = :company_code 
                AND d.Year_Code = :year_code  
                AND d.MM_Rate != 0  
                AND d.desp_type = 'DI' 
                AND d.memo_no != 0  
                AND d.SB_No != 0  
                AND d.purc_no != 0
        '''

        params = {
            'from_date': from_date,
            'to_date': to_date,
            'company_code': company_code,
            'year_code': year_code
        }

        if accode:  # Append transport condition if provided
            query_str += " AND d.transport = :transport"
            params['transport'] = accode

        query_str += " ORDER BY d.doc_date"

        # Execute query
        with db.session.begin():
            query = db.session.execute(text(query_str), params)
            results = query.mappings().all()

        return jsonify([dict(row) for row in results])

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@app.route(API_URL + '/Debitnote-summary', methods=['GET'])
def Debitnote_Summary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        accode = request.args.get('accode')

        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not company_code or not year_code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        # Base SQL query
        query_str = '''
            SELECT 
                ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS SR_No,
                CONVERT(VARCHAR(50), v.doc_no) AS DebitNote_No,
                a.Gst_No AS PartyGSTNo,
                v.ac_code AS PartyCode,
                a.Ac_Name_E AS PartyName,
                a.GSTStateCode AS PartyStateCode,
                CONVERT(VARCHAR(10), v.Doc_Date, 103) AS Date,
                v.qntl AS Quintal,
                ABS(v.purc_rate) AS Rate,
                ABS(v.texable_amount) AS TaxableAmount,
                ABS(v.cgst_amount) AS CGST,
                ABS(v.sgst_amount) AS SGST,
                ABS(v.igst_amount) AS IGST,
                ABS(v.bill_amount) AS Final_Amount,
                v.ackno AS ACKNO
            FROM commission_bill v
            LEFT JOIN NT_1_AccountMaster a 
                ON v.Ac_Code = a.Ac_Code 
                AND v.Company_Code = a.Company_Code
            WHERE v.texable_amount != 0
                AND v.doc_date >= '2017-07-01'
                AND v.doc_date BETWEEN :from_date AND :to_date
                AND v.Company_Code = :company_code
                AND v.Year_Code = :year_code
                AND v.bill_amount > 0
        '''

        params = {
            'from_date': from_date,
            'to_date': to_date,
            'company_code': company_code,
            'year_code': year_code
        }

        if accode:  # Append condition only if accode is provided
            query_str += " AND v.ac_code = :accode"
            params['accode'] = accode

        query_str += " ORDER BY v.Doc_Date"

        # Execute query
        with db.session.begin():
            query = db.session.execute(text(query_str), params)
            results = query.mappings().all()

        return jsonify([dict(row) for row in results])

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route(API_URL + '/Creditnote-summary', methods=['GET'])
def Creditnote_Summary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        accode = request.args.get('accode')

        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not company_code or not year_code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        # Base query
        query_str = """
            SELECT 
                ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,
                CONVERT(VARCHAR(50), v.doc_no) AS CreditNote_No,
                a.Gst_No AS PartyGSTNo,
                v.ac_code AS PartyCode,
                a.Ac_Name_E AS PartyName,
                a.GSTStateCode AS PartyStateCode,
                CONVERT(VARCHAR(10), v.Doc_Date, 103) AS Date,
                v.qntl AS Quintal,
                ABS(v.purc_rate) AS Rate,
                ABS(v.texable_amount) AS TaxableAmount,
                ABS(v.cgst_amount) AS CGST,
                ABS(v.sgst_amount) AS SGST,
                ABS(v.igst_amount) AS IGST,
                ABS(v.bill_amount) AS Final_Amount
            FROM commission_bill v  
            LEFT JOIN NT_1_AccountMaster a 
                ON v.Ac_Code = a.Ac_Code 
                AND v.Company_Code = a.Company_Code 
            WHERE 1=1
                AND v.texable_amount != 0
                AND v.doc_date >= '2017-07-01'
                AND v.doc_date BETWEEN :from_date AND :to_date
                AND v.Company_Code = :company_code
                AND v.Year_Code = :year_code
                AND v.bill_amount < 0
        """

        # Parameters dictionary
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'company_code': company_code,
            'year_code': year_code
        }

        # Add accode condition dynamically
        if accode:
            query_str += " AND v.ac_code = :accode"
            params['accode'] = accode

        query_str += " ORDER BY v.Doc_Date"

        # Execute query
        with db.session.begin():
            query = db.session.execute(text(query_str), params)
            results = query.mappings().all()

        return jsonify([dict(row) for row in results])

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route(API_URL + '/ServiceBill-summary', methods=['GET'])
def ServiceBill_Summary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        accode = request.args.get('accode')

        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not company_code or not year_code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        # Base SQL query
        query_str = '''
            SELECT 
                ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,
                'RB' + CONVERT(NVARCHAR, s.Doc_No) AS Invoice_No,
                s.Gst_No AS PartyGSTNo,
                s.Customer_Code AS PartyCode,
                s.Ac_Name_E AS PartyName,
                s.GSTStateCode AS PartyStateCode,
                CONVERT(VARCHAR(10), s.Date, 103) AS Invoice_Date,
                s.Subtotal AS TaxableAmount,
                s.CGSTAmount AS CGST,
                s.SGSTAmount AS SGST,
                s.IGSTAmount AS IGST,
                s.Final_Amount,
                s.ackno AS ACKNo
            FROM qryrentbillhead s
            WHERE s.Date >= '2017-07-01'
                AND s.Date BETWEEN :from_date AND :to_date
                AND s.Company_Code = :company_code
                AND s.Year_Code = :year_code
        '''

        # Add filter for accode if provided
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'company_code': company_code,
            'year_code': year_code
        }

        if accode:
            query_str += " AND s.Customer_Code = :accode"
            params['accode'] = accode

        query_str += " ORDER BY s.Date"

        # Execute query
        with db.session.begin():
            query = db.session.execute(text(query_str), params)
            results = query.mappings().all()

        return jsonify([dict(row) for row in results])

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
    
      

@app.route(API_URL + '/OtherPurchase-summary', methods=['GET'])
def OtherPurchase_Summary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        accode = request.args.get('accode')

        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not company_code or not year_code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        # Base SQL query
        query_str = '''
            SELECT 
                ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,
                s.Doc_No AS Invoice_No,
                s.Gst_No AS PartyGSTNo,
                s.Supplier_Code AS PartyCode,
                s.suppilername AS PartyName,
                s.GSTStateCode AS PartyStateCode,
                CONVERT(VARCHAR(10), s.doc_date, 103) AS Invoice_Date,
                s.Taxable_Amount AS TaxableAmount,
                s.CGST_Amount AS CGST,
                s.SGST_Amount AS SGST,
                s.IGST_Amount AS IGST,
                s.Bill_Amount,
                s.billno AS BillNo,
                s.TDS AS TDSAmount,
                s.Narration AS Narration
            FROM qryotherpurchase s
            WHERE s.doc_date >= '2017-07-01'
                AND s.doc_date BETWEEN :from_date AND :to_date
                AND s.Company_Code = :company_code
                AND s.Year_Code = :year_code
        '''

        # Add filter for accode if provided
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'company_code': company_code,
            'year_code': year_code
        }

        if accode:
            query_str += " AND s.Supplier_Code = :accode"
            params['accode'] = accode

        query_str += " ORDER BY s.doc_date"

        # Execute query
        with db.session.begin():
            query = db.session.execute(text(query_str), params)
            results = query.mappings().all()

        return jsonify([dict(row) for row in results])

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500  

@app.route(API_URL+'/SaleTCS-summary', methods=['GET'])
def SaleTCS_Summary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        Tran_type = request.args.get('Tran_type')
        accode=request.args.get('accode')

        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not Company_Code or not Year_Code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        # Begin a nested transaction session
        with db.session.begin_nested():

            if Tran_type == 'SB' :
                if not accode :
                    query = db.session.execute(text('''
                        select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'SB'+convert(varchar(50),doc_no) as InvoiceNo,
                        CONVERT(varchar(10),doc_date,103) as date,REPLACE(REPLACE(billtoname,',',' '),'.','') as [Name Of Party], 
                        REPLACE(billtopanno,',',' ') as Pan, REPLACE(BillToTanNo,',',' ') as Tan,
                       REPLACE(REPLACE(billtoaddress,',',' '),'.','') as Address,[TaxableAmount] as Taxable_Amt, 
                         CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,Bill_Amount as Bill_Amt,TCS_Amt as TCS 
                          from qrysalehead where doc_date>='2017-07-01' and doc_date between :from_date and :to_date 
                         and Company_Code= :Company_Code and Year_Code= :Year_Code and TCS_Amt!=0  order by doc_date     '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code
                
                                })
                else:
                     query = db.session.execute(text('''
                        select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'SB'+convert(varchar(50),doc_no) as InvoiceNo,
                        CONVERT(varchar(10),doc_date,103) as date,REPLACE(REPLACE(billtoname,',',' '),'.','') as [Name Of Party], 
                        REPLACE(billtopanno,',',' ') as Pan, REPLACE(BillToTanNo,',',' ') as Tan,
                       REPLACE(REPLACE(billtoaddress,',',' '),'.','') as Address,[TaxableAmount] as Taxable_Amt, 
                         CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,Bill_Amount as Bill_Amt,TCS_Amt as TCS 
                          from qrysalehead where doc_date>='2017-07-01' and doc_date between :from_date and :to_date 
                         and Company_Code= :Company_Code and Year_Code= :Year_Code and TCS_Amt!=0 and Ac_Code =:Ac_Code  order by doc_date     '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code,
                                    'Ac_Code' :accode
                                })
               
            if Tran_type == 'SC' :
                if not accode : 
                    query = db.session.execute(text('''
                    select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'SB'+convert(varchar(50),doc_no) as 
                     InvoiceNo,CONVERT(varchar(10),doc_date,103) as date,
                       REPLACE(REPLACE(Ac_Name_E,',',' '),'.','') as [Name Of Party], REPLACE(AC_Pan,',',' ')
                  as Pan, REPLACE(Tin_no,',',' ') as Tan, REPLACE(REPLACE(Address_E,',',' '),'.','') as Address,
                [Taxable Value] as Taxable_Amt, CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,
                    [Invoice Value] as Bill_Amt,TCS_Amt as TCS from qrysaleheadfor_GSTReturn 
                  where doc_date>='2017-07-01' and Carporate_Sale_No!=0 and 
                     doc_date between :from_date and   :to_date
                        and Company_Code= :Company_Code  and Year_Code= :to_date and TCS_Amt!=0  order by doc_date
                            '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code
                
                                })
                else:
                    query = db.session.execute(text('''
                    select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'SB'+convert(varchar(50),doc_no) as 
                     InvoiceNo,CONVERT(varchar(10),doc_date,103) as date,
                       REPLACE(REPLACE(Ac_Name_E,',',' '),'.','') as [Name Of Party], REPLACE(AC_Pan,',',' ')
                  as Pan, REPLACE(Tin_no,',',' ') as Tan, REPLACE(REPLACE(Address_E,',',' '),'.','') as Address,
                [Taxable Value] as Taxable_Amt, CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,
                    [Invoice Value] as Bill_Amt,TCS_Amt as TCS from qrysaleheadfor_GSTReturn 
                  where doc_date>='2017-07-01' and Carporate_Sale_No!=0 and 
                     doc_date between :from_date and   :to_date
                        and Company_Code= :Company_Code  and Year_Code= :to_date and TCS_Amt!=0 and Ac_Code =: Ac_Code order by doc_date
                            '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code,
                                    'Ac_Code' : accode
                                })
               
            if Tran_type == 'NC' :
                if not accode : 
                    query = db.session.execute(text('''
                    select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'SB'+convert(varchar(50),doc_no) as 
                     InvoiceNo,CONVERT(varchar(10),doc_date,103) as date,
                       REPLACE(REPLACE(Ac_Name_E,',',' '),'.','') as [Name Of Party], REPLACE(AC_Pan,',',' ')
                  as Pan, REPLACE(Tin_no,',',' ') as Tan, REPLACE(REPLACE(Address_E,',',' '),'.','') as Address,
                [Taxable Value] as Taxable_Amt, CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,
                    [Invoice Value] as Bill_Amt,TCS_Amt as TCS from qrysaleheadfor_GSTReturn 
                  where doc_date>='2017-07-01' and Carporate_Sale_No!=0 and 
                     doc_date between :from_date and   :to_date
                        and Company_Code= :Company_Code  and Year_Code= :Year_Code and TCS_Amt!=0  order by doc_date
                            '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code
                
                                })
                else :
                    query = db.session.execute(text('''
                    select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'SB'+convert(varchar(50),doc_no) as 
                     InvoiceNo,CONVERT(varchar(10),doc_date,103) as date,
                       REPLACE(REPLACE(Ac_Name_E,',',' '),'.','') as [Name Of Party], REPLACE(AC_Pan,',',' ')
                  as Pan, REPLACE(Tin_no,',',' ') as Tan, REPLACE(REPLACE(Address_E,',',' '),'.','') as Address,
                [Taxable Value] as Taxable_Amt, CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,
                    [Invoice Value] as Bill_Amt,TCS_Amt as TCS from qrysaleheadfor_GSTReturn 
                  where doc_date>='2017-07-01' and Carporate_Sale_No!=0 and 
                     doc_date between :from_date and   :to_date
                        and Company_Code= :Company_Code  and Year_Code= :Year_Code and TCS_Amt!=0 and Ac_Code=: Ac_Code order by doc_date
                            '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code,
                                    'Ac_Code' : accode
                                })

            if Tran_type == 'RS' :
                if not accode :
                    query = db.session.execute(text('''
                select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'RS'+convert(varchar(50),doc_no) as InvoiceNo,
                  CONVERT(varchar(10),doc_date,103) as date, REPLACE(REPLACE(FromAcName,',',' '),'.','')  
               as [Name Of Party], REPLACE(CompanyPan,',',' ') as Pan,REPLACE(Tan_no,',',' ') as Tan,
                REPLACE(REPLACE(billtoaddress,',',' '),'.','') as Address,SUBTOTAL as Taxable_Amt, 
                  CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,TCS_Net_Payable as Bill_Amt,
                 TCS_Amt as TCS from qrysugarsalereturnhead  where doc_date>='2017-07-01' 
                 and doc_date between :from_date and :to_date
               and Company_Code= :Company_Code and Year_Code= :Year_Code and TCS_Amt!=0  order by doc_date
                       '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code
                
                                })
                else :
                     query = db.session.execute(text('''
                select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'RS'+convert(varchar(50),doc_no) as InvoiceNo,
                  CONVERT(varchar(10),doc_date,103) as date, REPLACE(REPLACE(FromAcName,',',' '),'.','')  
               as [Name Of Party], REPLACE(CompanyPan,',',' ') as Pan,REPLACE(Tan_no,',',' ') as Tan,
                REPLACE(REPLACE(billtoaddress,',',' '),'.','') as Address,SUBTOTAL as Taxable_Amt, 
                  CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,TCS_Net_Payable as Bill_Amt,
                 TCS_Amt as TCS from qrysugarsalereturnhead  where doc_date>='2017-07-01' 
                 and doc_date between :from_date and :to_date
               and Company_Code= :Company_Code and Year_Code= :Year_Code and TCS_Amt!=0 and Ac_Code =:Ac_Code order by doc_date
                       '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code,
                                    'Ac_Code' :accode
                                })

            if Tran_type == 'RR' :
                if not accode :
                    query = db.session.execute(text('''
                    select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'RR'+convert(varchar(50),doc_no) as 
                     InvoiceNo,CONVERT(varchar(10),doc_date,103) as date,
                    REPLACE(REPLACE(PartyName,',',' '),'.','') as [Name Of Party], REPLACE(CompanyPan,',',' ')
                      as Pan,REPLACE(BillToTan,',',' ') as Tan,REPLACE(REPLACE(billtoaddress,',',' '),'.','') as
                     Address,Taxable_Amount as Taxable_Amt, CGSTAmount as CGST, SGSTAmount as SGST,
                    IGSTAmount as IGST,NetPayble as Bill_Amt,TCS_Amount as TCS 
                      from qryRetailSale where doc_date>='2017-07-01' and 
                       doc_date between :from_date and :to_date and Company_Code= :Company_Code and Year_Code=:Year_Code 
                     and TCS_Amount!=0  order by doc_date
                   '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code
                
            
                          })
                else:
                    query = db.session.execute(text('''
                    select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'RR'+convert(varchar(50),doc_no) as 
                     InvoiceNo,CONVERT(varchar(10),doc_date,103) as date,
                    REPLACE(REPLACE(PartyName,',',' '),'.','') as [Name Of Party], REPLACE(CompanyPan,',',' ')
                      as Pan,REPLACE(BillToTan,',',' ') as Tan,REPLACE(REPLACE(billtoaddress,',',' '),'.','') as
                     Address,Taxable_Amount as Taxable_Amt, CGSTAmount as CGST, SGSTAmount as SGST,
                    IGSTAmount as IGST,NetPayble as Bill_Amt,TCS_Amount as TCS 
                      from qryRetailSale where doc_date>='2017-07-01' and 
                       doc_date between :from_date and :to_date and Company_Code= :Company_Code and Year_Code=:Year_Code 
                     and TCS_Amount!=0 Party_Code =:Party_Code order by doc_date
                   '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code,
                                    'Party_Code' :accode,
            
                          })

            if Tran_type == 'LV' : 
                if not accode :
                    query = db.session.execute(text('''  
               select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'LV'+convert(varchar(50),doc_no) as InvoiceNo,
                 CONVERT(varchar(10),doc_date,103) as date,REPLACE(REPLACE(Ac_Name_E,',',' '),'.','') as [Name Of Party],
                 REPLACE(CompanyPan,',',' ') as Pan,REPLACE(Tan_no,',',' ') as Tan,REPLACE(REPLACE(Address_E,',',' '),
                 '.','') as Address,bill_amount as Taxable_Amt, cgst_amount as CGST, 
                   sgst_amount as SGST,igst_amount as IGST,TCS_Net_Payable as Bill_Amt,TCS_Amt as TCS 
                  from qrycommissionbill where doc_date>='2017-07-01' and doc_date between :from_date and :to_date 
                  and Company_Code= :Company_Code and Year_Code= :Year_Code and TCS_Amt!=0  order by doc_date
                   '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code
                
            
                          })      
                else:
                     query = db.session.execute(text('''  
               select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'LV'+convert(varchar(50),doc_no) as InvoiceNo,
                 CONVERT(varchar(10),doc_date,103) as date,REPLACE(REPLACE(Ac_Name_E,',',' '),'.','') as [Name Of Party],
                 REPLACE(CompanyPan,',',' ') as Pan,REPLACE(Tan_no,',',' ') as Tan,REPLACE(REPLACE(Address_E,',',' '),
                 '.','') as Address,bill_amount as Taxable_Amt, cgst_amount as CGST, 
                   sgst_amount as SGST,igst_amount as IGST,TCS_Net_Payable as Bill_Amt,TCS_Amt as TCS 
                  from qrycommissionbill where doc_date>='2017-07-01' and doc_date between :from_date and :to_date 
                  and Company_Code= :Company_Code and Year_Code= :Year_Code and TCS_Amt!=0 and ac_code =:ac_code  order by doc_date
                   '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code,
                                    'ac_code' :accode
            
                          })      
                
            if Tran_type == 'CB' : 
                if not accode :
                    query = db.session.execute(text('''  
                    select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'CB'+convert(varchar(50),doc_no) 
                  as InvoiceNo,CONVERT(varchar(10),Date,103) as date,REPLACE(REPLACE(Ac_Name_E,',',' '),'.','')
                as [Name Of Party], REPLACE(CompanyPan,',',' ') as Pan,REPLACE(Tan_no,',',' ') as Tan,
                 REPLACE(REPLACE(Address_E,',',' '),'.','')  as Address,Subtotal as Taxable_Amt, 
                  CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,TCS_Net_Payable as Bill_Amt,
                 TCS_Amt as TCS from qryColdStorageHead 
                 where Date>='2017-07-01' and Date between :from_date and :to_date and 
                 Company_Code= :Company_Code and Year_Code= :Year_Code  and TCS_Amt!=0 order by Date
               '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code
                
            
                          })       
                else:
                    query = db.session.execute(text('''  
                    select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'CB'+convert(varchar(50),doc_no) 
                  as InvoiceNo,CONVERT(varchar(10),Date,103) as date,REPLACE(REPLACE(Ac_Name_E,',',' '),'.','')
                as [Name Of Party], REPLACE(CompanyPan,',',' ') as Pan,REPLACE(Tan_no,',',' ') as Tan,
                 REPLACE(REPLACE(Address_E,',',' '),'.','')  as Address,Subtotal as Taxable_Amt, 
                  CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,TCS_Net_Payable as Bill_Amt,
                 TCS_Amt as TCS from qryColdStorageHead 
                 where Date>='2017-07-01' and Date between :from_date and :to_date and 
                 Company_Code= :Company_Code and Year_Code= :Year_Code  and TCS_Amt!=0 and Customer_Code =:Customer_Code order by Date
               '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code,
                                    'Customer_Code' :accode
            
                          })       
               
            if Tran_type == 'RB' : 
                if not accode :
                    query = db.session.execute(text('''  
                   select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'RB'+convert(varchar(50),doc_no) 
                  as InvoiceNo,CONVERT(varchar(10),Date,103) as date,REPLACE(REPLACE(Ac_Name_E,',',' '),'.','') 
                 as [Name Of Party], REPLACE(CompanyPan,',',' ') as Pan,REPLACE(Tan_no,',',' ') as Tan, 
                 REPLACE(REPLACE(Address_E,',',' '),'.','') as Address,Subtotal AS Taxable_Amt, 
                  CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,Final_Amount as Bill_Amt,
                TCS_Amt as TCS from qryrentbillhead where Date>='2017-07-01' and 
                  Date between :from_date and :to_date and Company_Code= :Company_Code and Year_Code= :Year_Code
                      and TCS_Amt!=0  order by Date
               '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code
                
            
                          })       
                else:
                    query = db.session.execute(text('''  
                   select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'RB'+convert(varchar(50),doc_no) 
                  as InvoiceNo,CONVERT(varchar(10),Date,103) as date,REPLACE(REPLACE(Ac_Name_E,',',' '),'.','') 
                 as [Name Of Party], REPLACE(CompanyPan,',',' ') as Pan,REPLACE(Tan_no,',',' ') as Tan, 
                 REPLACE(REPLACE(Address_E,',',' '),'.','') as Address,Subtotal AS Taxable_Amt, 
                  CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,Final_Amount as Bill_Amt,
                TCS_Amt as TCS from qryrentbillhead where Date>='2017-07-01' and 
                  Date between :from_date and :to_date and Company_Code= :Company_Code and Year_Code= :Year_Code
                      and TCS_Amt!=0 and Ac_Code =:Ac_Code order by Date
               '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code,
                                    'Ac_Code' :accode
            
                          })       
                   
                # Fetch all results and map to dictionaries
            
            if Tran_type == 'AL' :
                if not accode :    
                    query = db.session.execute(text('''  
                 select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No, InvoiceNo,CONVERT(varchar(10),date,103) as date, 
                 [Name Of Party],  REPLACE(Pan,',',' ') as Pan,REPLACE(Tan,',',' ') as Tan, 
                   REPLACE(REPLACE(Address,',',' '),'.','') as Address, Taxable_Amt, CGST, SGST, IGST,
                   Net as Bill_Amt, TCS from qryTCSAllUnion where date>='2017-07-01' and 
                 date between :from_date and :to_date
                   and Company_Code= :Company_Code  and Year_Code= :Year_Code and TCS!=0 
               '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code
                
            
                          })       
                else:
                   query = db.session.execute(text('''  
                 select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No, InvoiceNo,CONVERT(varchar(10),date,103) as date, 
                 [Name Of Party],  REPLACE(Pan,',',' ') as Pan,REPLACE(Tan,',',' ') as Tan, 
                   REPLACE(REPLACE(Address,',',' '),'.','') as Address, Taxable_Amt, CGST, SGST, IGST,
                   Net as Bill_Amt, TCS from qryTCSAllUnion where date>='2017-07-01' and 
                 date between :from_date and :to_date
                   and Company_Code= :Company_Code  and Year_Code= :Year_Code and TCS!=0 and Party_Code=:Party_Code
               '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code,
                                    'Party_Code' :accode
                
            
                          })       
                  
                  
                # Fetch all results and map to dictionaries
            
            results = query.mappings().all()
            response_data = [dict(row) for row in results]

            return jsonify(response_data)

    except SQLAlchemyError as e:
        print(f"Error occurred: {e}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
       
@app.route(API_URL+'/SaleTDS-summary', methods=['GET'])
def SaleTDS_Summary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        Tran_type = request.args.get('Tran_type')
        accode=request.args.get('accode')

        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not Company_Code or not Year_Code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        # Begin a nested transaction session
        with db.session.begin_nested():

            if Tran_type == 'SB' :
                if not accode :
                    query = db.session.execute(text('''
                        select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'SB'+convert(varchar(50),doc_no) as InvoiceNo,
                        CONVERT(varchar(10),doc_date,103) as date,REPLACE(REPLACE(billtoname,',',' '),'.','') as [Name Of Party], 
                        REPLACE(billtopanno,',',' ') as Pan, REPLACE(BillToTanNo,',',' ') as Tan,
                       REPLACE(REPLACE(billtoaddress,',',' '),'.','') as Address,[TaxableAmount] as Taxable_Amt, 
                         CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,Bill_Amount as Bill_Amt,TDS_Amt as TDS 
                          from qrysalehead where doc_date>='2017-07-01' and doc_date between :from_date and :to_date 
                         and Company_Code= :Company_Code and Year_Code= :Year_Code and TDS_Amt!=0  order by doc_date     '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code
                
                                })
                else:
                     query = db.session.execute(text('''
                        select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'SB'+convert(varchar(50),doc_no) as InvoiceNo,
                        CONVERT(varchar(10),doc_date,103) as date,REPLACE(REPLACE(billtoname,',',' '),'.','') as [Name Of Party], 
                        REPLACE(billtopanno,',',' ') as Pan, REPLACE(BillToTanNo,',',' ') as Tan,
                       REPLACE(REPLACE(billtoaddress,',',' '),'.','') as Address,[TaxableAmount] as Taxable_Amt, 
                         CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,Bill_Amount as Bill_Amt,TDS_Amt as TDS 
                          from qrysalehead where doc_date>='2017-07-01' and doc_date between :from_date and :to_date 
                         and Company_Code= :Company_Code and Year_Code= :Year_Code and TDS_Amt!=0 and Ac_Code =:Ac_Code  order by doc_date     '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code,
                                    'Ac_Code' :accode
                                })
               
            if Tran_type == 'SC' :
                if not accode : 
                    query = db.session.execute(text('''
                    select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'SB'+convert(varchar(50),doc_no) as 
                     InvoiceNo,CONVERT(varchar(10),doc_date,103) as date,
                       REPLACE(REPLACE(Ac_Name_E,',',' '),'.','') as [Name Of Party], REPLACE(AC_Pan,',',' ')
                  as Pan, REPLACE(Tin_no,',',' ') as Tan, REPLACE(REPLACE(Address_E,',',' '),'.','') as Address,
                [Taxable Value] as Taxable_Amt, CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,
                    [Invoice Value] as Bill_Amt,TDS_Amt as TDS from qrysaleheadfor_GSTReturn 
                  where doc_date>='2017-07-01' and Carporate_Sale_No!=0 and 
                     doc_date between :from_date and   :to_date
                        and Company_Code= :Company_Code  and Year_Code= :to_date and TDS_Amt!=0  order by doc_date
                            '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code
                
                                })
                else:
                    query = db.session.execute(text('''
                    select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'SB'+convert(varchar(50),doc_no) as 
                     InvoiceNo,CONVERT(varchar(10),doc_date,103) as date,
                       REPLACE(REPLACE(Ac_Name_E,',',' '),'.','') as [Name Of Party], REPLACE(AC_Pan,',',' ')
                  as Pan, REPLACE(Tin_no,',',' ') as Tan, REPLACE(REPLACE(Address_E,',',' '),'.','') as Address,
                [Taxable Value] as Taxable_Amt, CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,
                    [Invoice Value] as Bill_Amt,TDS_Amt as TDS from qrysaleheadfor_GSTReturn 
                  where doc_date>='2017-07-01' and Carporate_Sale_No!=0 and 
                     doc_date between :from_date and   :to_date
                        and Company_Code= :Company_Code  and Year_Code= :to_date and TDS_Amt!=0 and Ac_Code =: Ac_Code order by doc_date
                            '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code,
                                    'Ac_Code' : accode
                                })
               
            if Tran_type == 'NC' :
                if not accode : 
                    query = db.session.execute(text('''
                    select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'SB'+convert(varchar(50),doc_no) as 
                     InvoiceNo,CONVERT(varchar(10),doc_date,103) as date,
                       REPLACE(REPLACE(Ac_Name_E,',',' '),'.','') as [Name Of Party], REPLACE(AC_Pan,',',' ')
                  as Pan, REPLACE(Tin_no,',',' ') as Tan, REPLACE(REPLACE(Address_E,',',' '),'.','') as Address,
                [Taxable Value] as Taxable_Amt, CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,
                    [Invoice Value] as Bill_Amt,TDS_Amt as TDS from qrysaleheadfor_GSTReturn 
                  where doc_date>='2017-07-01' and Carporate_Sale_No!=0 and 
                     doc_date between :from_date and   :to_date
                        and Company_Code= :Company_Code  and Year_Code= :Year_Code and TDS_Amt!=0  order by doc_date
                            '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code
                
                                })
                else :
                    query = db.session.execute(text('''
                    select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'SB'+convert(varchar(50),doc_no) as 
                     InvoiceNo,CONVERT(varchar(10),doc_date,103) as date,
                       REPLACE(REPLACE(Ac_Name_E,',',' '),'.','') as [Name Of Party], REPLACE(AC_Pan,',',' ')
                  as Pan, REPLACE(Tin_no,',',' ') as Tan, REPLACE(REPLACE(Address_E,',',' '),'.','') as Address,
                [Taxable Value] as Taxable_Amt, CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,
                    [Invoice Value] as Bill_Amt,TDS_Amt as TDS from qrysaleheadfor_GSTReturn 
                  where doc_date>='2017-07-01' and Carporate_Sale_No!=0 and 
                     doc_date between :from_date and   :to_date
                        and Company_Code= :Company_Code  and Year_Code= :Year_Code and TDS_Amt!=0 and Ac_Code=: Ac_Code order by doc_date
                            '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code,
                                    'Ac_Code' : accode
                                })

            if Tran_type == 'RS' :
                if not accode :
                    query = db.session.execute(text('''
                select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'RS'+convert(varchar(50),doc_no) as InvoiceNo,
                  CONVERT(varchar(10),doc_date,103) as date, REPLACE(REPLACE(FromAcName,',',' '),'.','')  
               as [Name Of Party], REPLACE(CompanyPan,',',' ') as Pan,REPLACE(Tan_no,',',' ') as Tan,
                REPLACE(REPLACE(billtoaddress,',',' '),'.','') as Address,SUBTOTAL as Taxable_Amt, 
                  CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,TCS_Net_Payable as Bill_Amt,
                 TDS_Amt as TDS from qrysugarsalereturnhead  where doc_date>='2017-07-01' 
                 and doc_date between :from_date and :to_date
               and Company_Code= :Company_Code and Year_Code= :Year_Code and TDS_Amt!=0  order by doc_date
                       '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code
                
                                })
                else :
                     query = db.session.execute(text('''
                select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'RS'+convert(varchar(50),doc_no) as InvoiceNo,
                  CONVERT(varchar(10),doc_date,103) as date, REPLACE(REPLACE(FromAcName,',',' '),'.','')  
               as [Name Of Party], REPLACE(CompanyPan,',',' ') as Pan,REPLACE(Tan_no,',',' ') as Tan,
                REPLACE(REPLACE(billtoaddress,',',' '),'.','') as Address,SUBTOTAL as Taxable_Amt, 
                  CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,TCS_Net_Payable as Bill_Amt,
                 TDS_Amt as TDS from qrysugarsalereturnhead  where doc_date>='2017-07-01' 
                 and doc_date between :from_date and :to_date
               and Company_Code= :Company_Code and Year_Code= :Year_Code and TDS_Amt!=0 and Ac_Code =:Ac_Code order by doc_date
                       '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code,
                                    'Ac_Code' :accode
                                })

            if Tran_type == 'RR' :
                if not accode :
                    query = db.session.execute(text('''
                    select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'RR'+convert(varchar(50),doc_no) as 
                     InvoiceNo,CONVERT(varchar(10),doc_date,103) as date,
                    REPLACE(REPLACE(PartyName,',',' '),'.','') as [Name Of Party], REPLACE(CompanyPan,',',' ')
                      as Pan,REPLACE(BillToTan,',',' ') as Tan,REPLACE(REPLACE(billtoaddress,',',' '),'.','') as
                     Address,Taxable_Amount as Taxable_Amt, CGSTAmount as CGST, SGSTAmount as SGST,
                    IGSTAmount as IGST,NetPayble as Bill_Amt,TCS_Amount as TDS 
                      from qryRetailSale where doc_date>='2017-07-01' and 
                       doc_date between :from_date and :to_date and Company_Code= :Company_Code and Year_Code=:Year_Code 
                     and TCS_Amount!=0  order by doc_date
                   '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code
                
            
                          })
                else:
                    query = db.session.execute(text('''
                    select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'RR'+convert(varchar(50),doc_no) as 
                     InvoiceNo,CONVERT(varchar(10),doc_date,103) as date,
                    REPLACE(REPLACE(PartyName,',',' '),'.','') as [Name Of Party], REPLACE(CompanyPan,',',' ')
                      as Pan,REPLACE(BillToTan,',',' ') as Tan,REPLACE(REPLACE(billtoaddress,',',' '),'.','') as
                     Address,Taxable_Amount as Taxable_Amt, CGSTAmount as CGST, SGSTAmount as SGST,
                    IGSTAmount as IGST,NetPayble as Bill_Amt,TCS_Amount as TDS 
                      from qryRetailSale where doc_date>='2017-07-01' and 
                       doc_date between :from_date and :to_date and Company_Code= :Company_Code and Year_Code=:Year_Code 
                     and TCS_Amount!=0 Party_Code =:Party_Code order by doc_date
                   '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code,
                                    'Party_Code' :accode,
            
                          })

            if Tran_type == 'LV' : 
                if not accode :
                    query = db.session.execute(text('''  
               select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'LV'+convert(varchar(50),doc_no) as InvoiceNo,
                 CONVERT(varchar(10),doc_date,103) as date,REPLACE(REPLACE(Ac_Name_E,',',' '),'.','') as [Name Of Party],
                 REPLACE(CompanyPan,',',' ') as Pan,REPLACE(Tan_no,',',' ') as Tan,REPLACE(REPLACE(Address_E,',',' '),
                 '.','') as Address,bill_amount as Taxable_Amt, cgst_amount as CGST, 
                   sgst_amount as SGST,igst_amount as IGST,TCS_Net_Payable as Bill_Amt,TDS_Amt as TDS 
                  from qrycommissionbill where doc_date>='2017-07-01' and doc_date between :from_date and :to_date 
                  and Company_Code= :Company_Code and Year_Code= :Year_Code and TDS_Amt!=0  order by doc_date
                   '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code
                
            
                          })      
                else:
                     query = db.session.execute(text('''  
               select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'LV'+convert(varchar(50),doc_no) as InvoiceNo,
                 CONVERT(varchar(10),doc_date,103) as date,REPLACE(REPLACE(Ac_Name_E,',',' '),'.','') as [Name Of Party],
                 REPLACE(CompanyPan,',',' ') as Pan,REPLACE(Tan_no,',',' ') as Tan,REPLACE(REPLACE(Address_E,',',' '),
                 '.','') as Address,bill_amount as Taxable_Amt, cgst_amount as CGST, 
                   sgst_amount as SGST,igst_amount as IGST,TCS_Net_Payable as Bill_Amt,TDS_Amt as TDS 
                  from qrycommissionbill where doc_date>='2017-07-01' and doc_date between :from_date and :to_date 
                  and Company_Code= :Company_Code and Year_Code= :Year_Code and TDS_Amt!=0 and ac_code =:ac_code  order by doc_date
                   '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code,
                                    'ac_code' :accode
            
                          })      
                
            if Tran_type == 'CB' : 
                if not accode :
                    query = db.session.execute(text('''  
                    select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'CB'+convert(varchar(50),doc_no) 
                  as InvoiceNo,CONVERT(varchar(10),Date,103) as date,REPLACE(REPLACE(Ac_Name_E,',',' '),'.','')
                as [Name Of Party], REPLACE(CompanyPan,',',' ') as Pan,REPLACE(Tan_no,',',' ') as Tan,
                 REPLACE(REPLACE(Address_E,',',' '),'.','')  as Address,Subtotal as Taxable_Amt, 
                  CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,TCS_Net_Payable as Bill_Amt,
                 TDS_Amt as TDS from qryColdStorageHead 
                 where Date>='2017-07-01' and Date between :from_date and :to_date and 
                 Company_Code= :Company_Code and Year_Code= :Year_Code  and TDS_Amt!=0 order by Date
               '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code
                
            
                          })       
                else:
                    query = db.session.execute(text('''  
                    select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'CB'+convert(varchar(50),doc_no) 
                  as InvoiceNo,CONVERT(varchar(10),Date,103) as date,REPLACE(REPLACE(Ac_Name_E,',',' '),'.','')
                as [Name Of Party], REPLACE(CompanyPan,',',' ') as Pan,REPLACE(Tan_no,',',' ') as Tan,
                 REPLACE(REPLACE(Address_E,',',' '),'.','')  as Address,Subtotal as Taxable_Amt, 
                  CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,TCS_Net_Payable as Bill_Amt,
                 TDS_Amt as TDS from qryColdStorageHead 
                 where Date>='2017-07-01' and Date between :from_date and :to_date and 
                 Company_Code= :Company_Code and Year_Code= :Year_Code  and TDS_Amt!=0 and Customer_Code =:Customer_Code order by Date
               '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code,
                                    'Customer_Code' :accode
            
                          })       
               
            if Tran_type == 'RB' : 
                if not accode :
                    query = db.session.execute(text('''  
                   select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'RB'+convert(varchar(50),doc_no) 
                  as InvoiceNo,CONVERT(varchar(10),Date,103) as date,REPLACE(REPLACE(Ac_Name_E,',',' '),'.','') 
                 as [Name Of Party], REPLACE(CompanyPan,',',' ') as Pan,REPLACE(Tan_no,',',' ') as Tan, 
                 REPLACE(REPLACE(Address_E,',',' '),'.','') as Address,Subtotal AS Taxable_Amt, 
                  CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,Final_Amount as Bill_Amt,
                TDS_Amt as TDS from qryrentbillhead where Date>='2017-07-01' and 
                  Date between :from_date and :to_date and Company_Code= :Company_Code and Year_Code= :Year_Code
                      and TDS_Amt!=0  order by Date
               '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code
                
            
                          })       
                else:
                    query = db.session.execute(text('''  
                   select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,'RB'+convert(varchar(50),doc_no) 
                  as InvoiceNo,CONVERT(varchar(10),Date,103) as date,REPLACE(REPLACE(Ac_Name_E,',',' '),'.','') 
                 as [Name Of Party], REPLACE(CompanyPan,',',' ') as Pan,REPLACE(Tan_no,',',' ') as Tan, 
                 REPLACE(REPLACE(Address_E,',',' '),'.','') as Address,Subtotal AS Taxable_Amt, 
                  CGSTAmount as CGST, SGSTAmount as SGST,IGSTAmount as IGST,Final_Amount as Bill_Amt,
                TDS_Amt as TDS from qryrentbillhead where Date>='2017-07-01' and 
                  Date between :from_date and :to_date and Company_Code= :Company_Code and Year_Code= :Year_Code
                      and TDS_Amt!=0 and Ac_Code =:Ac_Code order by Date
               '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code,
                                    'Ac_Code' :accode
            
                          })       
                   
                # Fetch all results and map to dictionaries
            
            if Tran_type == 'AL' :
                if not accode :    
                    query = db.session.execute(text('''  
                 select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No, InvoiceNo,CONVERT(varchar(10),date,103) as date, 
                 [Name Of Party],  REPLACE(Pan,',',' ') as Pan,REPLACE(Tan,',',' ') as Tan, 
                   REPLACE(REPLACE(Address,',',' '),'.','') as Address, Taxable_Amt, CGST, SGST, IGST,
                   Net as Bill_Amt, TDS_Amt as TDS from qryTCSAllUnion where date>='2017-07-01' and 
                 date between :from_date and :to_date
                   and Company_Code= :Company_Code  and Year_Code= :Year_Code and TDS_Amt!=0 
               '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code
                
            
                          })       
                else:
                   query = db.session.execute(text('''  
                 select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No, InvoiceNo,CONVERT(varchar(10),date,103) as date, 
                 [Name Of Party],  REPLACE(Pan,',',' ') as Pan,REPLACE(Tan,',',' ') as Tan, 
                   REPLACE(REPLACE(Address,',',' '),'.','') as Address, Taxable_Amt, CGST, SGST, IGST,
                   Net as Bill_Amt,TDS_Amt as TDS from qryTCSAllUnion where date>='2017-07-01' and 
                 date between :from_date and :to_date
                   and Company_Code= :Company_Code  and Year_Code= :Year_Code and TDS_Amt!=0 and Party_Code=:Party_Code
               '''), 
                                {
                                    'from_date': from_date,
                                    'to_date': to_date,
                                    'Company_Code': Company_Code,
                                    'Year_Code': Year_Code,
                                    'Party_Code' :accode
                
            
                          })       
                  
                  
                # Fetch all results and map to dictionaries
            
            results = query.mappings().all()
            response_data = [dict(row) for row in results]

            return jsonify(response_data)

    except SQLAlchemyError as e:
        print(f"Error occurred: {e}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
       
              
@app.route(API_URL+'/PurchaseTCS-summary', methods=['GET'])
def PurchaseTCS_Summary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        Tran_type = request.args.get('Tran_type')
        accode = request.args.get('accode')

        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not Company_Code or not Year_Code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        # Begin a nested transaction session
        with db.session.begin_nested():
            # Define base query and table
            table_mapping = {
                'PS': 'qrypurchasehead',
                'RP': 'qryRetailPurchase',
                'AL': 'qrypurchasehead'
            }
            
            table_name = table_mapping.get(Tran_type)
            if not table_name:
                return jsonify({'error': 'Invalid Tran_type'}), 400

            # Construct SQL query dynamically
            base_query = text(f"""
                SELECT 
                    ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,
                    '{Tran_type}'+CONVERT(VARCHAR(50), doc_no) AS PSNo,
                    CONVERT(VARCHAR(10), doc_date, 103) AS date,
                    suppliername AS [Name Of Party], 
                    CompanyPan AS Pan,
                    Tan_no AS Tan,
                    supplieraddress AS Address,
                    Bill_Amount AS Net, 
                    CGSTAmount AS CGST, 
                    SGSTAmount AS SGST,
                    IGSTAmount AS IGST,
                    TCS_Amt AS TCS
                FROM {table_name}
                WHERE doc_date >= '2017-07-01' 
                AND doc_date BETWEEN :from_date AND :to_date
                AND Company_Code = :Company_Code 
                AND Year_Code = :Year_Code 
                AND TCS_Amt != 0
                { "AND Ac_Code = :accode" if accode else "" }
                ORDER BY doc_date
            """)

            # Execute query
            params = {
                'from_date': from_date,
                'to_date': to_date,
                'Company_Code': Company_Code,
                'Year_Code': Year_Code
            }
            if accode:
                params['accode'] = accode

            query = db.session.execute(base_query, params)
            results = query.mappings().all()
            response_data = [dict(row) for row in results]

            return jsonify(response_data)

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL+'/PurchaseTDS-summary', methods=['GET'])
def PurchaseTDS_Summary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        Tran_type = request.args.get('Tran_type')
        accode = request.args.get('accode')

        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not Company_Code or not Year_Code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        # Base query
        base_query = """
            SELECT ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No, 
                   '{tran_prefix}'+CONVERT(varchar(50), doc_no) AS PSNo,
                   CONVERT(varchar(10), doc_date, 103) AS date,
                   {name_field} AS [Name Of Party], 
                   CompanyPan AS Pan, Tan_no AS Tan, 
                   {address_field} AS Address, 
                   {net_field} AS Net, CGSTAmount AS CGST, 
                   SGSTAmount AS SGST, IGSTAmount AS IGST, 
                   {tds_field} AS TDS 
            FROM {table_name}
            WHERE doc_date >= '2017-07-01' 
              AND doc_date BETWEEN :from_date AND :to_date
              AND Company_Code = :Company_Code 
              AND Year_Code = :Year_Code 
              AND {tds_field} != 0
        """

        # Assign table names and columns based on Tran_type
        if Tran_type == 'PS':
            query_params = {
                'tran_prefix': 'PS', 'name_field': 'suppliername',
                'address_field': 'supplieraddress', 'net_field': 'Bill_Amount',
                'tds_field': 'TDS_Amt', 'table_name': 'qrypurchasehead'
            }
        elif Tran_type == 'RP':
            query_params = {
                'tran_prefix': 'RP', 'name_field': 'partyname',
                'address_field': 'billtoaddress', 'net_field': 'NetPayble',
                'tds_field': 'TDS_Amt', 'table_name': 'qryRetailPurchase'
            }
        elif Tran_type == 'AL':
            query_params = {
                'tran_prefix': 'PS', 'name_field': 'suppliername',
                'address_field': 'supplieraddress', 'net_field': 'Bill_Amount',
                'tds_field': 'TDS_Amt', 'table_name': 'qrypurchasehead'
            }
        else:
            return jsonify({'error': 'Invalid Tran_type'}), 400

        # Modify query if `accode` is provided
        if accode:
            base_query += " AND Ac_Code = :Ac_Code"
        
        base_query += " ORDER BY doc_date"

        # Execute query
        with db.session.begin_nested():
            query = db.session.execute(text(base_query.format(**query_params)), {
                'from_date': from_date,
                'to_date': to_date,
                'Company_Code': Company_Code,
                'Year_Code': Year_Code,
                'Ac_Code': accode if accode else None
            })

            results = query.mappings().all()
            response_data = [dict(row) for row in results]

        return jsonify(response_data)

    except SQLAlchemyError as e:
        print(f"Error occurred: {e}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
       
@app.route(API_URL+'/HSNWise-summary', methods=['GET'])
def HSNWise_Summary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not Company_Code or not Year_Code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        # Begin a nested transaction session
        with db.session.begin_nested():
            query = db.session.execute(text('''
                select HSN,sum(CgstAmt) as CgstAmt,sum(SgstAmt) as SgstAmt,
             sum(IgstAmt) as IgstAmt,sum(TCSAmt) as TCSAmt,sum(NetPayable) as NetPayable,sum(Quantal) as Quantal ,sum(TaxableAmount) as TaxableAmount,sum(TDS_Amt) as TDSAMT from qryHSNSale 
                where doc_date between :from_date and :to_date and Company_Code= :Company_Code 
                 and Year_Code= :Year_Code group by HSN 
             '''), {
                'from_date': from_date,
                'to_date': to_date,
                'Company_Code': Company_Code,
                'Year_Code': Year_Code
            })

            # Fetch all results and map to dictionaries
            results = query.mappings().all()
            response_data = [dict(row) for row in results]

            return jsonify(response_data)

    except SQLAlchemyError as e:
        print(f"Error occurred: {e}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    

@app.route(API_URL+'/GettingGSTRate', methods=['GET'])
def GettingGSTRate():
    try:
       
        company_code = request.args.get('Company_Code')
       

        if not company_code :
            return jsonify({'error': 'Company_Code required'}), 400

        with db.session.begin_nested():
            query = db.session.execute(text('''
                        Select Rate from nt_1_gstratemaster 
                        where Company_Code=:company_code  order by Rate
                  '''), {'company_code' :company_code})
           
            result = query.fetchall()
        print(query)

        response = []
        for row in result:
            row_dict = row._asdict()
        #    // formatted_dates = format_dates(row_dict)
        #    / row_dict.update(formatted_dates)
            response.append(row_dict)

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL+'/GSTRateWise-summary', methods=['GET'])
def GSTRateWiseSummary_Summary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        GSTRate =request.args.get('GSTRate')
        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not Company_Code or not Year_Code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        # Begin a nested transaction session
        with db.session.begin_nested():
            
            query = db.session.execute(text('''
            select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,convert(varchar(50),InvoiceNo) as InvoiceNo,
            CONVERT(varchar(10),date,103) as date,Name_Of_Party,HSN_NO,TaxableAmt,CGST,SGST,IGST,BillAmt,TCS,
            Qntl from qryGSTRatewiseSaleSummary where date>='2017-07-01' and 
              date between :from_date and :to_date and Rate= :GSTRate and Company_Code= :Company_Code and 
             Year_Code= :Year_Code order by date
               
             '''), {
                'from_date': from_date,
                'to_date': to_date,
                'Company_Code': Company_Code,
                'Year_Code': Year_Code,
                'GSTRate' : GSTRate
            })

            # Fetch all results and map to dictionaries
            results = query.mappings().all()
            response_data = [dict(row) for row in results]

            return jsonify(response_data)

    except SQLAlchemyError as e:
        print(f"Error occurred: {e}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
@app.route(API_URL+'/GettingGSTRateWise', methods=['GET'])
def GettingGSTRateWise():
    try:
       
        company_code = request.args.get('Company_Code')
       

        if not company_code :
            return jsonify({'error': 'Company_Code required'}), 400

        with db.session.begin_nested():
            query = db.session.execute(text('''
                        Select Rate from nt_1_gstratemaster 
                        where Company_Code=:company_code  order by Rate
                  '''), {'company_code' :company_code})
           
            result = query.fetchall()
        print(query)

        response = []
        for row in result:
            row_dict = row._asdict()
        #    // formatted_dates = format_dates(row_dict)
        #    / row_dict.update(formatted_dates)
            response.append(row_dict)

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL+'/SaleTCSTDS-summary', methods=['GET'])
def SaleTCSTDS_Summary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        accode = request.args.get('accode')

        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not Company_Code or not Year_Code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        # Base query
        base_query = """
            SELECT ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,
                   FORMAT(CAST(:from_date AS DATE), 'dd-MM-yyyy') AS fromDate, 
                   FORMAT(CAST(:to_date AS DATE), 'dd-MM-yyyy') AS ToDate,
                   [Name Of Party] AS Name_Of_Party, PartyGst_No,
                   REPLACE(Pan, ',', ' ') AS Pan, REPLACE(Tan, ',', ' ') AS Tan,
                   SUM(Taxable_Amt) AS Taxable_Amt, SUM(CGST) AS CGST,
                   SUM(SGST) AS SGST, SUM(IGST) AS IGST, SUM(TCS) AS TCS,
                   SUM(TDS_Amt) AS TDS, SUM(Net) AS Bill_Amt, Party_Email,
                   '' AS GSTPermission, '' AS TDSPermission, '' AS TCSPermission, '' AS Permission
            FROM qryTCSAllUnion
            WHERE date >= '2017-07-01'
              AND date BETWEEN :from_date AND :to_date
              AND Company_Code = :Company_Code
              AND Year_Code = :Year_Code
        """

        # Parameters dictionary
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'Company_Code': Company_Code,
            'Year_Code': Year_Code
        }

        # Conditionally add accode filter
        if accode:
            base_query += " AND Party_Code = :Party_Code"
            params['Party_Code'] = accode

        # Append GROUP BY clause
        base_query += " GROUP BY [Name Of Party], PartyGst_No, Pan, Tan, Party_Email"

        # Execute query
        with db.session.begin_nested():
            query = db.session.execute(text(base_query), params)
            results = query.mappings().all()
            response_data = [dict(row) for row in results]

        return jsonify(response_data)

    except SQLAlchemyError as e:
        print(f"Error occurred: {e}")  # Replace with logging in production
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
@app.route(API_URL+'/PurchaseTCSTDS-summary', methods=['GET'])
def PurchaseTCSTDS_Summary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
       
        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not Company_Code or not Year_Code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        # Begin a nested transaction session
        with db.session.begin_nested():
            
            query = db.session.execute(text('''
           select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) AS SR_No,FORMAT(CAST(:from_date AS DATE), 'dd-MM-yyyy') AS fromDate, 
            FORMAT(CAST(:to_date AS DATE), 'dd-MM-yyyy') AS ToDate,
         [Name Of Party] as Name_Of_Party,PartyGst_No ,REPLACE(Pan,',',' ') as Pan,REPLACE(Tan,',',' ') as Tan,
          sum(Taxable_Amt) as Taxable_Amt, sum(CGST) as CGST, sum(SGST) as SGST, sum(IGST) as IGST, 
         sum(TCS) as TCS,sum(TDS_Amt) as TDS,sum(Bill_Amount) as Bill_Amt,Party_Email,'' as GSTPermission,
           '' as TDSPermission,'' as TCSPermission,'' as Permission from qryTCSPurchaseUnion 
          where date>='2017-07-01' and date between :from_date and :to_date and Company_Code= :Company_Code 
          and Year_Code= :Year_Code group by [Name Of Party],PartyGst_No,Pan,Tan,Party_Email
               
             '''), {
                'from_date': from_date,
                'to_date': to_date,
                'Company_Code': Company_Code,
                'Year_Code': Year_Code
                
            })

            # Fetch all results and map to dictionaries
            results = query.mappings().all()
            response_data = [dict(row) for row in results]

            return jsonify(response_data)

    except SQLAlchemyError as e:
        print(f"Error occurred: {e}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500



@app.route(API_URL+'/DebitCreditNote-summary', methods=['GET'])
def DebitCreditNote_Summary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        Tran_Type = request.args.get('Tran_Type')
        accode = request.args.get('accode')

        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not Company_Code or not Year_Code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        # Base query
        base_query = """
            SELECT 0 + ROW_NUMBER() OVER(ORDER BY Company_Code) AS SRNO,
                   Inovice_No, Invoice_Date, [Bill To ACC NO], BilltoName, [BILL TO GSTIN], 
                   [BillToStateCode], 
                   (RIGHT('0' + CONVERT(NVARCHAR, BillToStateCode), 2) + '-' + LTRIM(RTRIM(shiptostatename))) AS PlaceOfSupply,
                   TaxableAmt, CGST, SGST, IGST, TCS, Payable_Amount, 
                   OldInvNo, OldInvDate, ackno AS ACKNo 
            FROM qryDebitcreditnote_GST
            WHERE doc_date BETWEEN :from_date AND :to_date
              AND Company_Code = :Company_Code
              AND Year_Code = :Year_Code
        """

        # Parameters dictionary
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'Company_Code': Company_Code,
            'Year_Code': Year_Code
        }

        # Append conditions dynamically
        if Tran_Type and Tran_Type != 'AL':
            base_query += " AND tran_type = :Tran_Type"
            params['Tran_Type'] = Tran_Type

        if accode:
            base_query += " AND ac_code = :accode"
            params['accode'] = accode

        # Append order by clause
        base_query += " ORDER BY Invoice_Date"

        # Execute query
        with db.session.begin_nested():
            query = db.session.execute(text(base_query), params)
            results = query.mappings().all()
            response_data = [dict(row) for row in results]

        return jsonify(response_data)

    except SQLAlchemyError as e:
        print(f"Error occurred: {e}")  # Replace with proper logging in production
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL+'/CreateB2BFileData-summary', methods=['GET'])
def CreateB2BFileDate_Summary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        
        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not Company_Code or not Year_Code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        # Begin a nested transaction session
        with db.session.begin_nested():
           
            query = db.session.execute(text('''
                  select (case when  isnull(Carporate_Sale_No,0)=0 then Ac_Code else carporate_ac end) as Ac_Code , (case when  isnull(Carporate_Sale_No,0)=0 then PartyName else Ac_Name_E end) as
                        PartyName, (case when  isnull(Carporate_Sale_No,0)=0 then [GSTIN/UIN of Recipient] else  LTRIM(RTRIM(Gst_No))end) as [GSTIN/UIN of Recipient], 
                        (case when  isnull(Carporate_Sale_No,0)=0 then PartyStateCode else ISNULL(NULLIF (CA_GSTStateCode, ''),0) end) as PartyStateCode, 'SB'+CONVERT(NVARCHAR,doc_no) as [Invoice Number],
                        REPLACE(CONVERT(CHAR(11),doc_date, 106),' ','-') as [Invoice date],  [Invoice Value],(case when isnull(Carporate_Sale_No,0)=0 then [Place Of Supply] else
                        RIGHT('0' + CONVERT(NVARCHAR,  CA_GSTStateCode), 2) +'-' + LTRIM(RTRIM(state_name)) end )as [Place Of Supply], 'N' as [Reverse Charge],'Regular' as [Invoice Type],
                        '' as [E-Commerce GSTIN],Rate,[Taxable Value],  '' as [Cess Amount] from qrysaleheadfor_GSTReturn where doc_date>='2017-07-01' and 
                        doc_date between :from_date and :to_date and IsDeleted!=0 and Company_Code=:Company_Code and Year_Code= :Year_Code and UnregisterGST=0 and doc_no!=0
                        union
                        select Ac_Code,Ac_Name_E as PartyName,LTRIM(RTRIM(Gst_No)) as [GSTIN/UIN of Recipient],ISNULL(NULLIF(GSTStateCode,''),0) as PartyStateCode, 
                        'LV'+CONVERT(NVARCHAR,doc_no) as [Invoice Number],REPLACE(CONVERT(CHAR(11),doc_date, 106),' ','-') as [Invoice date], Bill_Amount as [Invoice Value],
                        (RIGHT('0'+CONVERT(NVARCHAR,GSTStateCode),2) +'-'+ LTRIM(RTRIM(billtostatename))) as [Place Of Supply], 'N' as [Reverse Charge],'Regular' as [Invoice Type],'' as [E-Commerce GSTIN],
                        Rate as Rate,texable_amount as [Taxable Value], '' as [Cess Amount] from qrycommissionbill where doc_date>='2017-07-01' and doc_date between :from_date and '2024-10-29' 
                        and Company_Code= :Company_Code and Year_Code= :Year_Code and UnregisterGST=0 and doc_no!=0 and Bill_Amount!=0
                        union
                        select Party_Code as Ac_Code,partyname as PartyName,LTRIM(RTRIM(PartyGst_No)) as [GSTIN/UIN of Recipient],ISNULL(NULLIF(GSTStateCode,''),0) as PartyStateCode, 
                        'RR'+CONVERT(NVARCHAR,doc_no) as [Invoice Number],REPLACE(CONVERT(CHAR(11),doc_date, 106),' ','-') as [Invoice date], NetValue as [Invoice Value],(RIGHT('0'+CONVERT(NVARCHAR,
                        GSTStateCode),2) +'-'+ LTRIM(RTRIM(billtostatename))) as [Place Of Supply], 'N' as [Reverse Charge],'Regular' as [Invoice Type],'' as [E-Commerce GSTIN],Gstrate as Rate,
                         Taxable_Amount as [Taxable Value], '' as [Cess Amount] from qryRetailSale
                         where doc_date>='2017-07-01' and doc_date between :from_date and  :to_date  and Company_Code= :Company_Code and Year_Code= :Year_Code and UnregisterGST=0 and doc_no!=0 and IsDelete!=0 GROUP BY Doc_No,Doc_Date, GSTStateCode, billtostatename,Gstrate,partyname,Party_Code,PartyGst_No,NetValue,Taxable_Amount
                        union
                        select  FromAc as Ac_Code,FromAcName as PartyName,LTRIM(RTRIM(BillToGst_No)) as [GSTIN/UIN of Recipient],ISNULL(NULLIF(BillToGSTStateCode,''),0) as PartyStateCode,
                        'RS'+CONVERT(NVARCHAR,doc_no) as [Invoice Number],REPLACE(CONVERT(CHAR(11),doc_date, 106),' ','-') as [Invoice date], Bill_Amount as [Invoice Value],
                        (RIGHT('0'+CONVERT(NVARCHAR,BillToGSTStateCode),2) +'-'+ LTRIM(RTRIM(BillToState))) as [Place Of Supply], 'N' as [Reverse Charge],'Regular' as [Invoice Type],
                        '' as [E-Commerce GSTIN],gstrate as Rate,subTotal as [Taxable Value], '' as [Cess Amount] from qrysugarsalereturnhead where doc_date>='2017-07-01' and 
                        doc_date between :from_date and :to_date and Company_Code= :Company_Code and Year_Code= :Year_Code and UnregisterGST=0 and doc_no!=0
                        
                        union
                        select  Customer_Code as Ac_Code,Ac_Name_E as PartyName,LTRIM(RTRIM(Gst_No)) as [GSTIN/UIN of Recipient],ISNULL(NULLIF(GSTStateCode,''),0) as PartyStateCode, 
                        'RB'+CONVERT(NVARCHAR,doc_no) as [Invoice Number],REPLACE(CONVERT(CHAR(11),Date, 106),' ','-') as [Invoice date], Total as [Invoice Value],(RIGHT('0'+CONVERT(NVARCHAR,GSTStateCode),
                        2) +'-'+ LTRIM(RTRIM(billtostatename))) as [Place Of Supply], 'N' as [Reverse Charge],'Regular' as [Invoice Type],'' as [E-Commerce GSTIN],gstrate as Rate,
                        subTotal as [Taxable Value], '' as [Cess Amount] from qryrentbillhead where Date>='2017-07-01' and Date between :from_date and :to_date and Company_Code=:Company_Code and Year_Code= :Year_Code 
                        and UnregisterGST=0 and doc_no!=0
                        union
                        select  Customer_Code as Ac_Code,Ac_Name_E as PartyName,LTRIM(RTRIM(Gst_No)) as [GSTIN/UIN of Recipient],ISNULL(NULLIF(CustomerStateCode,''),0) as PartyStateCode,
                        'CB'+CONVERT(NVARCHAR,doc_no) as [Invoice Number],REPLACE(CONVERT(CHAR(11),Date, 106),' ','-') as [Invoice date], Total as [Invoice Value],
                        (RIGHT('0'+CONVERT(NVARCHAR,CustomerStateCode),2) +'-'+ LTRIM(RTRIM(CustomerStateName))) as [Place Of Supply], 'N' as [Reverse Charge],'Regular' as [Invoice Type],
                        '' as [E-Commerce GSTIN],rate as Rate,subTotal as [Taxable Value], '' as [Cess Amount] from qryColdStorageHead where Date>='2017-07-01' and 
                        Date between :from_date and :to_date and Company_Code= :Company_Code and Year_Code= :Year_Code and UnregisterGST=0 and doc_no!=0
                        union
                        select [Bill To ACC NO] as Ac_Code,BilltoName as PartyName,LTRIM(RTRIM([BILL TO GSTIN])) as [GSTIN/UIN of Recipient], ISNULL(NULLIF(BillToStateCode,''),0) as PartyStateCode, 
                        Inovice_No as [Invoice Number], REPLACE(CONVERT(CHAR(11),doc_date, 106),' ','-') as [Invoice date], bill_amount as [Invoice Value], 
                        (RIGHT('0'+CONVERT(NVARCHAR,BillToStateCode),2) +'-'+ LTRIM(RTRIM(shiptostatename))) as [Place Of Supply],  'N' as [Reverse Charge],'Regular' as [Invoice Type],
                        '' as [E-Commerce GSTIN],Rate as Rate,TaxableAmt as [Taxable Value],  '' as [Cess Amount] from qryDebitcreditnote_GST where doc_date>='2017-07-01' and 
                        doc_date between :from_date and :to_date and Company_Code= :Company_Code and Year_Code= :Year_Code and UnregisterGST=0 and tran_type='DN'

                       '''), {
                        'from_date': from_date,
                        'to_date': to_date,
                        'Company_Code': Company_Code,
                        'Year_Code': Year_Code
                        
                    })

            # Fetch all results and map to dictionaries
            results = query.mappings().all()
            response_data = [dict(row) for row in results]

            return jsonify(response_data)

    except SQLAlchemyError as e:
        print(f"Error occurred: {e}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL+'/CreateB2ClFileData-summary', methods=['GET'])
def CreateB2ClFileDate_Summary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        
        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not Company_Code or not Year_Code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        # Begin a nested transaction session
        with db.session.begin_nested():
           
            query = db.session.execute(text('''
                    select 'SB'+CONVERT(NVARCHAR,doc_no) as [Invoice Number],REPLACE(CONVERT(CHAR(11),doc_date, 106),' ','-') as [Invoice date], [Invoice Value],
                    (case when isnull(Carporate_Sale_No,0)=0 then [Place Of Supply] else RIGHT('0' + CONVERT(NVARCHAR,  CA_GSTStateCode), 2) +'-' + LTRIM(RTRIM(state_name)) end )as [Place Of Supply],
                    Rate,[Taxable Value],'' as [Cess Amount],'' as [E-Commerce GSTIN] from qrysaleheadfor_GSTReturn where  doc_date>='2017-07-01' and doc_date between  :from_date and :to_date 
                    and IsDeleted!=0  and Company_Code= :Company_Code and Year_Code= :Year_Code and UnregisterGST=1 and [Invoice Value]>250000
                    UNION    
                    select 'LV'+CONVERT(NVARCHAR,doc_no) as [Invoice Number],REPLACE(CONVERT(CHAR(11),doc_date, 106),' ','-') as [Invoice date],  Bill_Amount as [Invoice Value],
                    (RIGHT('0'+CONVERT(NVARCHAR,GSTStateCode),2) +'-'+ LTRIM(RTRIM(billtostatename))) as [Place Of Supply],  Rate as Rate,texable_amount as [Taxable Value],'' as [Cess Amount],
                    '' as [E-Commerce GSTIN] from qrycommissionbill where  doc_date>='2017-07-01' and doc_date between  :from_date and :to_date  
                    and Company_Code= :Company_Code and Year_Code= :Year_Code and UnregisterGST=1  and Bill_Amount>250000
                    UNION   
                    select 'RR'+CONVERT(NVARCHAR,doc_no) as [Invoice Number],REPLACE(CONVERT(CHAR(11),doc_date, 106),' ','-') as [Invoice date],  sum(NetValue) as [Invoice Value],
                    (RIGHT('0'+CONVERT(NVARCHAR,GSTStateCode),2) +'-'+ LTRIM(RTRIM(billtostatename))) as [Place Of Supply],  Gstrate as Rate,sum(Taxable_Amount) as [Taxable Value],
                    '' as [Cess Amount],'' as [E-Commerce GSTIN] from qryRetailSale where  doc_date>='2017-07-01' and doc_date between  :from_date and :to_date  
                    and Company_Code= :Company_Code and Year_Code= :Year_Code and UnregisterGST=1 and NetValue>250000 and IsDelete!=0 group by doc_no,doc_date,GSTStateCode,billtostatename,Gstrate
                    UNION
                    select 'RS'+CONVERT(NVARCHAR,doc_no) as [Invoice Number],REPLACE(CONVERT(CHAR(11),doc_date, 106),' ','-') as [Invoice date],  Bill_Amount as [Invoice Value],
                    (RIGHT('0'+CONVERT(NVARCHAR,BillToGSTStateCode),2) +'-'+ LTRIM(RTRIM(billtostatename))) as [Place Of Supply],  gstrate as Rate,subTotal as [Taxable Value],
                    '' as [Cess Amount],'' as [E-Commerce GSTIN] from qrysugarsalereturnhead where  doc_date>='2017-07-01' and doc_date between  :from_date and :to_date  
                    and Company_Code= :Company_Code and Year_Code= :Year_Code and UnregisterGST=1 and Bill_Amount>250000
                    UNION
                    select 'RB'+CONVERT(NVARCHAR,doc_no) as [Invoice Number],REPLACE(CONVERT(CHAR(11),Date, 106),' ','-') as [Invoice date],  Total as [Invoice Value],
                    (RIGHT('0'+CONVERT(NVARCHAR,GSTStateCode),2) +'-'+ LTRIM(RTRIM(billtostatename))) as [Place Of Supply],  gstrate as Rate,subTotal as [Taxable Value],'' as [Cess Amount],
                    '' as [E-Commerce GSTIN] from qryrentbillhead where  Date>='2017-07-01' and Date between  :from_date and :to_date  
                    and Company_Code= :Company_Code and Year_Code= :Year_Code and UnregisterGST=1  and Total>250000
                    UNION    
                    select 'CB'+CONVERT(NVARCHAR,doc_no) as [Invoice Number],REPLACE(CONVERT(CHAR(11),Date, 106),' ','-') as [Invoice date],  Total as [Invoice Value],
                    (RIGHT('0'+CONVERT(NVARCHAR,CustomerStateCode),2) +'-'+ LTRIM(RTRIM(CustomerStateName))) as [Place Of Supply],  rate as Rate,subTotal as [Taxable Value],'' as [Cess Amount],
                    '' as [E-Commerce GSTIN] from qryColdStorageHead where  Date>='2017-07-01' and Date between  :from_date and :to_date  
                    and Company_Code= :Company_Code and Year_Code= :Year_Code and UnregisterGST=1 and Total>250000
                    UNION
                    select Inovice_No as [Invoice Number],REPLACE(CONVERT(CHAR(11),doc_date, 106),' ','-') as [Invoice date], bill_amount as [Invoice Value], 
                    (RIGHT('0'+CONVERT(NVARCHAR,BillToStateCode),2) +'-'+ LTRIM(RTRIM([Bill To ACC NO]))) as [Place Of Supply],   rate as Rate,TaxableAmt as [Taxable Value],'' as [Cess Amount],
                    '' as [E-Commerce GSTIN] from qryDebitcreditnote_GST where  doc_date>='2017-07-01' and doc_date between  :from_date and :to_date  and Company_Code= :Company_Code and Year_Code= :Year_Code
                    and UnregisterGST=1 and bill_amount>250000 and tran_type='DN'
                                            
                       '''), {
                        'from_date': from_date,
                        'to_date': to_date,
                        'Company_Code': Company_Code,
                        'Year_Code': Year_Code
                        
                    })

           

            
            # Fetch all results and map to dictionaries
            results = query.mappings().all()
            response_data = [dict(row) for row in results]

            return jsonify(response_data)

    except SQLAlchemyError as e:
        print(f"Error occurred: {e}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL+'/CreateB2CSFileData-summary', methods=['GET'])
def CreateB2CSFileDate_Summary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        
        # Validate required parameters
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400
        if not Company_Code or not Year_Code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        # Begin a nested transaction session
        with db.session.begin_nested():
           
            query = db.session.execute(text('''
                select 'OE' as Type,(case when Carporate_Sale_No=0 then [Place Of Supply] else RIGHT('0' + CONVERT(NVARCHAR,  CA_GSTStateCode), 2) +'-' 
                + LTRIM(RTRIM(state_name)) end )as [Place Of Supply], Rate,sum([Taxable Value]) as [Taxable Value],'' as [Cess Amount],'' as [E-Commerce GSTIN] 
                from qrysaleheadfor_GSTReturn where doc_date>='2017-07-01' and doc_date between  :from_date and :to_date and IsDeleted!=0 and 
                Company_Code= :Company_Code and Year_Code= :Year_Code and UnregisterGST=1 and [Invoice Value]<=250000 group by rate,Carporate_Sale_No,[Place Of Supply],CA_GSTStateCode,state_name
                UNION
                select 'OE' as Type,(RIGHT('0'+CONVERT(NVARCHAR,GSTStateCode),2) +'-'+ LTRIM(RTRIM(billtostatename))) as [Place Of Supply], Rate as Rate,
                sum(texable_amount) as [Taxable Value],'' as [Cess Amount],'' as [E-Commerce GSTIN] from qrycommissionbill  where doc_date>='2017-07-01' and 
                doc_date between  :from_date and :to_date  and Company_Code= :Company_Code and Year_Code= :Year_Code and 
                UnregisterGST=1 and Bill_Amount<=250000 group by GSTStateCode,billtostatename,Rate
                UNION
                select 'OE' as Type,(RIGHT('0'+CONVERT(NVARCHAR,GSTStateCode),2) +'-'+ LTRIM(RTRIM(billtostatename))) as [Place Of Supply], 5.00 as Rate,sum(Taxable_Amount) as [Taxable Value],
                '' as [Cess Amount],'' as [E-Commerce GSTIN] from qryRetailheadnew  where doc_date>='2017-07-01' and doc_date between  :from_date and :to_date 
                and Company_Code= :Company_Code and Year_Code= :Year_Code and UnregisterGST=1 and NetValue<=250000 and IsDelete!=0 group by GSTStateCode,billtostatename
                UNION
                select 'OE' as Type,(RIGHT('0'+CONVERT(NVARCHAR,BillToGSTStateCode),2) +'-'+ LTRIM(RTRIM(billtostatename))) as [Place Of Supply], gstrate as Rate,sum(subTotal) as [Taxable Value],
                '' as [Cess Amount],'' as [E-Commerce GSTIN] from qrysugarsalereturnhead  where doc_date>='2017-07-01' and doc_date between  :from_date and :to_date 
                and Company_Code= :Company_Code and Year_Code= :Year_Code and  UnregisterGST=1 and Bill_Amount<=250000 group by BillToGSTStateCode,billtostatename,gstrate
                UNION
                select 'OE' as Type,(RIGHT('0'+CONVERT(NVARCHAR,GSTStateCode),2) +'-'+ LTRIM(RTRIM(billtostatename))) as [Place Of Supply], gstrate as Rate,sum(subTotal) as [Taxable Value],
                '' as [Cess Amount],'' as [E-Commerce GSTIN] from qryrentbillhead  where Date>='2017-07-01' and Date between  :from_date and :to_date  
                and Company_Code= :Company_Code and Year_Code= :Year_Code and  UnregisterGST=1 and Total<=250000 group by GSTStateCode,billtostatename,gstrate
                UNION
                select 'OE' as Type,(RIGHT('0'+CONVERT(NVARCHAR,CustomerStateCode),2) +'-'+ LTRIM(RTRIM(CustomerStateName))) as [Place Of Supply], rate as Rate,sum(subTotal) as [Taxable Value],
                '' as [Cess Amount],'' as [E-Commerce GSTIN] from qryColdStorageHead  where Date>='2017-07-01' and Date between  :from_date and :to_date  and Company_Code= :Company_Code and Year_Code= :Year_Code
                and  UnregisterGST=1 and Total<=250000 group by CustomerStateCode,CustomerStateName,rate
                                            
                       '''), {
                        'from_date': from_date,
                        'to_date': to_date,
                        'Company_Code': Company_Code,
                        'Year_Code': Year_Code
                        
                    })

           

            
            # Fetch all results and map to dictionaries
            results = query.mappings().all()
            response_data = [dict(row) for row in results]

            return jsonify(response_data)

    except SQLAlchemyError as e:
        print(f"Error occurred: {e}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
    
@app.route(API_URL + '/ShowEntryNo-summary', methods=['GET'])
def ShowEntryNo_summary():
    try:
        From_Date = request.args.get('from_date')
        To_Date =request.args.get('to_date')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

       
        if not From_Date or not To_Date or not Company_Code or not Year_Code:
            return jsonify({'error': 'Missing required parameter'}), 400

        # Call the stored procedure
        query = db.session.execute(text('''
            EXEC SP_ShowEntry_Nonew 
                :yearcode, 
                :companaycode, 
                :Fromdate,
                :Todate,  
                :Flag                                             
        '''), {
            'yearcode': Year_Code,
            'companaycode': Company_Code,
            'Fromdate': From_Date,
            'Todate' : To_Date,
            'Flag' : 1
        })

         # Fetch the results
        results = query.mappings().all()
        response_data = [dict(row) for row in results]

        return jsonify(response_data)

    except SQLAlchemyError as e:
        print(f"Database error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500 