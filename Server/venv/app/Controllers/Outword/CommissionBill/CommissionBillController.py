import traceback
from flask import jsonify, request
from app import app, db
from app.models.Outword.CommissionBill.CommissionBillModel import CommissionBill
from sqlalchemy.sql import text, func
import os
import requests

from app.utils.CommonGLedgerFunctions import fetch_company_parameters,get_accoid,getSaleAc,get_acShort_Name

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')
API_URL_SERVER = os.getenv('API_URL_SERVER')

sql_query = text('''
    SELECT        dbo.commission_bill.ac_code, dbo.commission_bill.ac, party.Ac_Name_E AS PartyName, party.Ac_Code AS PartyCode, dbo.commission_bill.unit_code, dbo.commission_bill.uc, unit.Ac_Name_E AS UnitName, 
                         unit.Ac_Code AS Unitcode, dbo.commission_bill.broker_code, broker.Ac_Name_E AS brokername, broker.Ac_Code AS Brokercode, dbo.commission_bill.bc, dbo.commission_bill.transport_code, 
                         transport.Ac_Name_E AS transportname, dbo.commission_bill.tc, transport.Ac_Code AS transportcode, dbo.commission_bill.mill_code, dbo.commission_bill.mc, mill.Ac_Name_E AS millname, mill.Ac_Code AS millcode, 
                         dbo.commission_bill.TDS_Ac, dbo.commission_bill.ta, tdsac.Ac_Code AS tdsac, tdsac.Ac_Name_E AS tdsacname, dbo.commission_bill.item_code, dbo.commission_bill.ic, itemcode.System_Code AS Itemcode, 
                         itemcode.System_Name_E AS Itemname, dbo.commission_bill.gst_code, gstratecode.GST_Name AS gstratename, gstratecode.Doc_no AS gstratecode
FROM            dbo.commission_bill LEFT OUTER JOIN
                         dbo.nt_1_gstratemaster AS gstratecode ON dbo.commission_bill.gst_code = gstratecode.Doc_no LEFT OUTER JOIN
                         dbo.nt_1_systemmaster AS itemcode ON dbo.commission_bill.ic = itemcode.systemid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS tdsac ON dbo.commission_bill.ta = tdsac.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS transport ON dbo.commission_bill.tc = transport.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS mill ON dbo.commission_bill.mc = mill.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS broker ON dbo.commission_bill.bc = broker.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS unit ON dbo.commission_bill.uc = unit.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS party ON dbo.commission_bill.ac = party.accoid
WHERE        itemcode.System_Type = 'I' and dbo.commission_bill.Tran_Type = :tran_type and dbo.commission_bill.doc_no = :doc_no and 
                 dbo.commission_bill.Company_Code = :company_code and dbo.commission_bill.Year_Code = :year_code
''')

#Format Dates
def format_dates(input):
    return input.doc_date.strftime('%Y-%m-%d') if input.doc_date else None

#GET all Data.
@app.route(API_URL + "/getall-CommissionBill", methods=["GET"])
def get_CommissionBillallData():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        tran_type = request.args.get('Tran_Type')
        
        if company_code is None or year_code is None or tran_type is None:
            return jsonify({'error': 'Missing Company_Code, Year_Code, or Tran_Type parameter'}), 400

        try:
            company_code = int(company_code)
            year_code = int(year_code)
            tran_type = str(tran_type)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, Year_Code, or Tran_Type parameter'}), 400

        records = CommissionBill.query.filter_by(Company_Code=company_code, Year_Code=year_code, Tran_Type=tran_type).order_by(CommissionBill.doc_no.desc()).all()

        result_list = []
        for record in records:
            record_data = {column.name: getattr(record, column.name) for column in record.__table__.columns}
            record_data['Formatted_Doc_Date'] = format_dates(record)

            account_details = db.session.execute(sql_query, {
                'doc_no': record.doc_no,
                'company_code': company_code,
                'year_code': year_code,
                'tran_type': tran_type
            })
            account_info = account_details.first()

            if account_info:
                result_keys = account_details.keys()
                for key, value in zip(result_keys, account_info):
                    record_data[key] = value if value is not None else ""

            result_list.append(record_data)

        return jsonify(result_list)
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500

#GET last record from the database.
@app.route("/api/sugarian/get-CommissionBill-lastRecord", methods=["GET"])
def get_CommissionBill_lastRecord():
    try:
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')
        if not company_code or not year_code or not tran_type:
            return jsonify({'error': 'Missing Company_Code, Tran_Type, or Year_Code parameter'}), 400
        try:
            company_code = int(company_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, Tran_Type, or Year_Code parameter'}), 400

        last_Record = CommissionBill.query.filter_by(Company_Code=company_code, Tran_Type=tran_type, Year_Code=year_code).order_by(CommissionBill.doc_no.desc()).first()
        if last_Record is None:
            response_data = {
                'Company_Code': company_code,
                'Tran_Type': tran_type,
                'Year_Code': year_code,
                'doc_no': 0 
            }
            return jsonify(response_data), 200
        account_details = db.session.execute(sql_query, {'doc_no': last_Record.doc_no, 'company_code': company_code, 'year_code': year_code, 'tran_type': tran_type})
        account_info = account_details.first() 

        last_Record_data = {column.name: getattr(last_Record, column.name) for column in last_Record.__table__.columns}
        last_Record_data['doc_date'] = format_dates(last_Record)

        if account_info:
            result_keys = account_details.keys() 
            for key, value in zip(result_keys, account_info):
                last_Record_data[key] = value if value is not None else ""

        return jsonify(last_Record_data)
    except Exception as e:
        print(e) 
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

#GET record by ID
@app.route(API_URL+"/get-CommissionBillSelectedRecord", methods=["GET"])
def get_CommissionBillSelectedRecord():
    try:
        selected_code = request.args.get('doc_no')
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')

        if selected_code is None or company_code is None or tran_type is None or year_code is None:
            return jsonify({'error': 'Missing selected_code, Company_Code, tran_type, or year code parameter'}), 400

        try:
            selected_code = int(selected_code)
            company_code = int(company_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid selected_Record, Company_Code, or tran_type parameter'}), 400

        Record = CommissionBill.query.filter_by(doc_no=selected_code, Company_Code=company_code, Tran_Type=tran_type, Year_Code=year_code).first()

        if Record is None:
            return jsonify({'error': 'Selected Record not found'}), 404
        
        account_details = db.session.execute(sql_query, {'doc_no': selected_code, 'company_code': company_code, 'year_code': year_code, 'tran_type': Record.Tran_Type})
        account_info = account_details.first()

        selected_Record_data = {column.name: getattr(Record, column.name) if getattr(Record, column.name) is not None else "" for column in Record.__table__.columns}
        selected_Record_data['doc_date'] = format_dates(Record)

        if account_info:
            result_keys = account_details.keys()
            for key, value in zip(result_keys, account_info):
                selected_Record_data[key] = value if value is not None else ""

        return jsonify(selected_Record_data)
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500
  
# Create Record
@app.route(API_URL + "/create-RecordCommissionBill", methods=["POST"])
def create_CommissionBill():
    def create_gledger_entry(data, amount, drcr, ac_code, accoid,narration):
        return {
            "TRAN_TYPE": new_Record_data['Tran_Type'],
            "DOC_NO": new_Record_data["doc_no"],
            "DOC_DATE": data['doc_date'],
            "AC_CODE": ac_code,
            "AMOUNT": amount,
            "COMPANY_CODE": new_Record_data['Company_Code'],
            "YEAR_CODE": new_Record_data['Year_Code'],
            "ORDER_CODE": 12,
            "DRCR": drcr,
            "UNIT_Code": 0,
            "NARRATION": narration,
            "TENDER_ID": 0,
            "TENDER_ID_DETAIL": 0,
            "VOUCHER_ID": 0,
            "DRCR_HEAD": 0,
            "ADJUSTED_AMOUNT": 0,
            "Branch_Code": 1,
            "SORT_TYPE": new_Record_data['Tran_Type'],
            "SORT_NO": new_Record_data['doc_no'],
            "vc": 0,
            "progid": 0,
            "tranid": 0,
            "saleid": 0,
            "ac": accoid
        }

    def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid,narration):
        if amount > 0:
            entries.append(create_gledger_entry(data, amount, drcr, ac_code, accoid,narration))
    
    try:
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')

        if company_code is None or tran_type is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code, Tran_Type, or Year_Code parameter'}), 400

        try:
            company_code = int(company_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, Tran_Type, or Year_Code parameter'}), 400

        max_record = db.session.query(db.func.max(CommissionBill.doc_no)).filter_by(Company_Code=company_code, Tran_Type=tran_type, Year_Code=year_code).scalar() or 0

        new_Record_data = request.json
        new_Record_data['doc_no'] = max_record + 1 
        new_Record_data['Company_Code'] = company_code
        new_Record_data['Tran_Type'] = tran_type
        new_Record_data['Year_Code'] = year_code

        new_Record = CommissionBill(**new_Record_data)
        
        company_parameters = fetch_company_parameters(new_Record_data['Company_Code'], new_Record_data['Year_Code'])
        
        gledger_entries = []
        bill_amount =new_Record.bill_amount
        drcr=""
        if bill_amount>0:
            drcr="D"
        else:
            drcr="C"    

        ac_code = company_parameters.RoundOff
        accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
        def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid, narration):
              
            if float(amount) > 0:
                entries.append(create_gledger_entry(data, amount, drcr, ac_code, accoid,new_Record_data["narration1"]))

        dono=new_Record_data['link_no']
        ac_code = new_Record_data['ac_code']
        accoid = get_accoid(ac_code, new_Record_data['Company_Code'])

        cgstamount=new_Record_data['cgst_amount']
        sgstamount=new_Record_data['sgst_amount']
        igstamount=new_Record_data['igst_amount']
        tcsamt=new_Record_data['TCS_Amt']
        tdsamt=new_Record_data['TDSAmount']
        tdsac=new_Record_data['TDS_Ac']
        resalecomm=new_Record_data['resale_commission']

        tcs_net_payable = new_Record_data['TCS_Net_Payable']
        if tcs_net_payable > 0:
            add_gledger_entry(gledger_entries, new_Record_data, tcs_net_payable, 'D', new_Record_data['ac_code'], accoid, new_Record_data["narration1"])
        
        if dono == 0:
            frieght_amount=new_Record_data['Frieght_amt']
            if frieght_amount>0:
                ac_code = company_parameters.SGSTAc
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, frieght_amount, 'C', ac_code, accoid, "")
            else:
                ac_code = company_parameters.Freight_Ac
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, frieght_amount, 'D', ac_code, accoid, "")
          
        if bill_amount>0:
            if cgstamount>0:
                ac_code = company_parameters.CGSTAc
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, cgstamount, 'C', ac_code, accoid, "")
            if sgstamount >0:    
                ac_code = company_parameters.SGSTAc
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, sgstamount, 'C', ac_code, accoid, "")
            if igstamount >0:    
                ac_code = company_parameters.IGSTAc
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, igstamount, 'C', ac_code, accoid, "")
            if tcsamt >0:    
                ac_code = company_parameters.SaleTCSAc
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, tcsamt, 'C', ac_code, accoid, "")
            
        else:
            if cgstamount!=0:
                ac_code = company_parameters.PurchaseCGSTAc
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, cgstamount, 'D', ac_code, accoid, "")
            if sgstamount !=0:    
                
                ac_code = company_parameters.PurchaseSGSTAc
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, sgstamount, 'D', ac_code, accoid, "")
            if igstamount !=0:    
                
                ac_code = company_parameters.PurchaseIGSTAc
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, igstamount, 'D', ac_code, accoid, "")
            if tcsamt >0:    
                
                ac_code = company_parameters.SaleTCSAc
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, tcsamt, 'C', ac_code, accoid, "")

        if tdsamt!=0 : 
            if tdsamt>0:
                
                ac_code = new_Record_data['ac_code']
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, tdsamt, 'C', ac_code, accoid, "")

                
                accoid = get_accoid(tdsac, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, tdsamt, 'D', tdsac, accoid, "")
            else:
                
                ac_code = new_Record_data['ac_code']
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, tdsamt, 'D', ac_code, accoid, "")

                
                accoid = get_accoid(tdsac, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, tdsamt, 'C', tdsac, accoid, "")

        if float(resalecomm) != 0:
            if resalecomm  >0:
                drcr="C"      
            else:
                drcr="D"  
            
            ac_code=company_parameters.COMMISSION_AC    
            accoid = get_accoid(tdsac, new_Record_data['Company_Code'])
            add_gledger_entry(gledger_entries, new_Record_data, resalecomm, drcr, ac_code, accoid, "")    
        
        commission_amount=float(new_Record_data['commission_amount'])
        qntl=float(new_Record_data['qntl'])

        if commission_amount !=0:
            if commission_amount>0:
                
                ac_code=company_parameters.RateDiffAc    
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, float(commission_amount * qntl), 'C', ac_code, accoid, "")  
            else:
                
                ac_code=company_parameters.RateDiffAc    
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, float(commission_amount * qntl), 'D', ac_code, accoid, "") 

        db.session.add(new_Record)
        db.session.commit()

        commisionid = new_Record.commissionid

        query_params = {
            'Company_Code': new_Record_data['Company_Code'],
            'DOC_NO': new_Record_data['doc_no'],
            'Year_Code': new_Record_data['Year_Code'],
            'TRAN_TYPE': new_Record_data['Tran_Type']
        }

        response = requests.post(API_URL_SERVER+"/create-Record-gLedger", params=query_params, json=gledger_entries)

        if response.status_code == 201:
            db.session.commit()
        else:
            db.session.rollback()
            return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

        return jsonify({
            'message': 'Record created successfully',
            'record': {
                "new_Record_data":new_Record_data,
                'commissionid': commisionid
            }
        }), 201
    except Exception as e:
        print("Traceback",traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
# Update a group API
@app.route(API_URL+"/update-CommissionBill", methods=["PUT"])
def update_CommissionBill():
    def create_gledger_entry(data, amount, drcr, ac_code, accoid,narration,ordercode):
        return {
            "TRAN_TYPE": tran_type,
            "DOC_NO": new_Record_data.doc_no,
            "DOC_DATE": data.doc_date,
            "AC_CODE": ac_code,
            "AMOUNT": amount,
            "COMPANY_CODE": new_Record_data.Company_Code,
            "YEAR_CODE": new_Record_data.Year_Code,
            "ORDER_CODE":  ordercode,
            "DRCR": drcr,
            "UNIT_Code": 0,
            "NARRATION": narration,
            "TENDER_ID": 0,
            "TENDER_ID_DETAIL": 0,
            "VOUCHER_ID": 0,
            "DRCR_HEAD": 0,
            "ADJUSTED_AMOUNT": 0,
            "Branch_Code": 1,
            "SORT_TYPE": tran_type,
            "SORT_NO": new_Record_data.doc_no,
            "vc": 0,
            "progid": 0,
            "tranid": 0,
            "saleid": 0,
            "ac": accoid
        }

    def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid,narration,ordercode):
        if amount > 0:
            entries.append(create_gledger_entry(data, amount, drcr, ac_code, accoid,narration,ordercode))
    
    try:
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')
        selected_code = request.args.get('doc_no')
        if company_code is None or selected_code is None or tran_type is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code, selected_Record, tran_type, or year code parameter'}), 400

        try:
            company_code = int(company_code)
            selected_code = int(selected_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, selected_code, tran_type, or year code parameter'}), 400

        update_Record_data = CommissionBill.query.filter_by(Company_Code=company_code, doc_no=selected_code, Tran_Type=tran_type, Year_Code=year_code).first()
        if update_Record_data is None:
            return jsonify({'error': 'Record not found'}), 404

        # Update selected record data
        update_data = request.json
        for key, value in update_data.items():
            setattr(update_Record_data, key, value)

        new_Record_data=update_Record_data
        new_Record=update_data
        print('new_Record_data',update_data)
        company_parameters = fetch_company_parameters(new_Record_data.Company_Code, new_Record_data.Year_Code)
        
        gledger_entries = []
        bill_amount = float(new_Record_data.bill_amount)
        drcr=""
        if bill_amount>0:
            drcr="D"
        else:
            drcr="C"    
        ac_code = company_parameters.RoundOff
        accoid = get_accoid(ac_code, new_Record_data.Company_Code)
        ordercode=0
        def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid, narration,ordercode):
            ordercode=ordercode+1
            if amount > 0:
                entries.append(create_gledger_entry(data, amount, drcr, ac_code, accoid,new_Record_data.narration1,ordercode))
    
        dono=new_Record_data.link_no
        ac_code = new_Record_data.ac_code
        accoid = get_accoid(ac_code, new_Record_data.Company_Code)

        cgstamount=float(new_Record_data.cgst_amount)
        sgstamount=float(new_Record_data.sgst_amount)
        igstamount=float(new_Record_data.igst_amount)
        tcsamt=float(new_Record_data.TCS_Amt)
        tdsamt=float(new_Record_data.TDSAmount)
        tdsac=float(new_Record_data.TDS_Ac)
        resalecomm=float(new_Record_data.resale_commission)

        ordercode=0
        tcs_net_payable = float(new_Record_data.TCS_Net_Payable)
        if tcs_net_payable > 0:
            ordercode=ordercode+1
            add_gledger_entry(gledger_entries, new_Record_data, tcs_net_payable, 'D', new_Record_data.ac_code, accoid, new_Record_data.narration1, ordercode)
       
        if dono == 0:
            frieght_amount=float(new_Record_data.Frieght_amt)
            if frieght_amount>0:
                ordercode=ordercode+1
                ac_code = company_parameters.SGSTAc
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, frieght_amount, 'C', ac_code, accoid, "",ordercode)
            else:
                ordercode=ordercode+1
                ac_code = company_parameters.Freight_Ac
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, frieght_amount, 'D', ac_code, accoid, "",ordercode)
          

        if bill_amount>0:
            if cgstamount>0:
                ordercode=ordercode+1
                ac_code = company_parameters.CGSTAc
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, cgstamount, 'C', ac_code, accoid, "",ordercode)
            if sgstamount >0:    
                ordercode=ordercode+1
                ac_code = company_parameters.SGSTAc
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, sgstamount, 'C', ac_code, accoid, "",ordercode)
            if igstamount >0:    
                ordercode=ordercode+1
                ac_code = company_parameters.IGSTAc
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, igstamount, 'C', ac_code, accoid, "",ordercode)
            if tcsamt >0:    
                ac_code = company_parameters.SaleTCSAc
                ordercode=ordercode+1
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, tcsamt, 'C', ac_code, accoid, "",ordercode)
             
        else:
            if cgstamount!=0:
                ordercode=ordercode+1
                ac_code = company_parameters.PurchaseCGSTAc
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, cgstamount, 'D', ac_code, accoid, "",ordercode)
            if sgstamount !=0:    
                ordercode=ordercode+1
                ac_code = company_parameters.PurchaseSGSTAc
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, sgstamount, 'D', ac_code, accoid, "",ordercode)
            if igstamount !=0:    
                ordercode=ordercode+1
                ac_code = company_parameters.PurchaseIGSTAc
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, igstamount, 'D', ac_code, accoid, "",ordercode)
            if tcsamt > 0:    
                ordercode=ordercode+1
                ac_code = company_parameters.SaleTCSAc
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, tcsamt, 'C', ac_code, accoid, "",ordercode)

        if tdsamt!=0 : 
            if tdsamt>0:
                ordercode=ordercode+1
                ac_code = new_Record_data.ac_code
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, tdsamt, 'C', ac_code, accoid, "",ordercode)

                ordercode=ordercode+1
                accoid = get_accoid(tdsac, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, tdsamt, 'D', tdsac, accoid, "",ordercode)
            else:
                ordercode=ordercode+1
                ac_code = new_Record_data.ac_code
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, tdsamt, 'D', ac_code, accoid, "",ordercode)

                ordercode=ordercode+1
                accoid = get_accoid(tdsac, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, tdsamt, 'C', tdsac, accoid, "",ordercode)

        if resalecomm != 0:
            if resalecomm  >0:
                drcr="C"      
            else:
                drcr="D"  
            ordercode=ordercode+1
            ac_code=company_parameters.COMMISSION_AC    
            accoid = get_accoid(tdsac, new_Record_data.Company_Code)
            add_gledger_entry(gledger_entries, new_Record_data, resalecomm, drcr, ac_code, accoid, "",ordercode)    
        
        commission_amount=float(new_Record_data.commission_amount)
        if commission_amount !=0:
            if commission_amount>0:
                ordercode=ordercode+1
                ac_code=company_parameters.RateDiffAc    
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, commission_amount, 'C', ac_code, accoid, "",ordercode)  
            else:
                ordercode=ordercode+1
                ac_code=company_parameters.RateDiffAc    
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, commission_amount, 'D', ac_code, accoid, "",ordercode) 

        db.session.commit()

        query_params = {
            'Company_Code': new_Record_data.Company_Code,
            'DOC_NO': new_Record_data.doc_no,
            'Year_Code': new_Record_data.Year_Code,
            'TRAN_TYPE': tran_type
        }

        response = requests.post(API_URL_SERVER+"/create-Record-gLedger", params=query_params, json=gledger_entries)

        if response.status_code == 201:
            db.session.commit()
        else:
            db.session.rollback()
            return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

        return jsonify({
            'message': 'Record updated successfully',
            'record': update_data
        })
    except Exception as e:
        print("Traceback",traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Delete a group API
@app.route(API_URL+"/delete-CommissionBill", methods=["DELETE"])
def delete_CommissionBill():
    try:
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')
        selected_code = request.args.get('doc_no')
        if company_code is None or selected_code is None or tran_type is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code, selected_code, tran_type, or year code parameter'}), 400

        try:
            company_code = int(company_code)
            selected_code = int(selected_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, selected_code, tran_type, or year code parameter'}), 400

        Deleted_Record = CommissionBill.query.filter_by(Company_Code=company_code, doc_no=selected_code, Tran_Type=tran_type, Year_Code=year_code).first()
        if Deleted_Record is None:
            return jsonify({'error': 'Record not found'}), 404

        db.session.delete(Deleted_Record)
        db.session.commit()

        return jsonify({'message': 'Record deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

#navigatrion APIS
@app.route(API_URL+"/get-first-CommissionBill", methods=["GET"])
def get_first_CommissionBill():
    try:
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')

        if company_code is None or tran_type is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code, tran_type, or year code parameter'}), 400

        try:
            company_code = int(company_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, tran_type, or year code parameter'}), 400
        
        first_record = CommissionBill.query.filter_by(Company_Code=company_code, Tran_Type=tran_type, Year_Code=year_code).order_by(CommissionBill.doc_no.asc()).first()
        
        if first_record:
            account_details = db.session.execute(sql_query, {'doc_no': first_record.doc_no, 'company_code': company_code, 'year_code': year_code, 'tran_type': first_record.Tran_Type})
            account_info = account_details.first()

            serialized_record = {column.name: getattr(first_record, column.name) if getattr(first_record, column.name) is not None else "" for column in first_record.__table__.columns}
            serialized_record['Formatted_Doc_Date'] = format_dates(first_record)
            
            if account_info:
                result_keys = account_details.keys()
                for key, value in zip(result_keys, account_info):
                    serialized_record[key] = value if value is not None else ""

            return jsonify([serialized_record])
        else:
            return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get-last-CommissionBill", methods=["GET"])
def get_last_CommissionBill():
    try:
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')

        if company_code is None or tran_type is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code, tran_type, or year code parameter'}), 400

        try:
            company_code = int(company_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, tran_type, or year code parameter'}), 400

        last_record = CommissionBill.query.filter_by(Company_Code=company_code, Tran_Type=tran_type, Year_Code=year_code).order_by(CommissionBill.doc_no.desc()).first()
        if last_record:
            account_details = db.session.execute(sql_query, {'doc_no': last_record.doc_no, 'company_code': company_code, 'year_code': year_code, 'tran_type': last_record.Tran_Type})
            account_info = account_details.first()

            serialized_record = {column.name: getattr(last_record, column.name) if getattr(last_record, column.name) is not None else "" for column in last_record.__table__.columns}
            serialized_record['Formatted_Doc_Date'] = format_dates(last_record)

            if account_info:
                result_keys = account_details.keys()
                for key, value in zip(result_keys, account_info):
                    serialized_record[key] = value if value is not None else ""

            return jsonify([serialized_record])
        else:
            return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get-previous-CommissionBill", methods=["GET"])
def get_previous_CommissionBill():
    try:
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')
        selected_code = request.args.get('doc_no')

        if company_code is None or tran_type is None or year_code is None or selected_code is None:
            return jsonify({'error': 'Missing Company_Code, tran_type, year code, or selected_code parameter'}), 400

        try:
            company_code = int(company_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
            selected_code = int(selected_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, tran_type, year code, or selected_code parameter'}), 400

        previous_record = CommissionBill.query.filter(CommissionBill.doc_no < selected_code).filter_by(Company_Code=company_code, Tran_Type=tran_type, Year_Code=year_code).order_by(CommissionBill.doc_no.desc()).first()
        if previous_record:
            account_details = db.session.execute(sql_query, {'doc_no': previous_record.doc_no, 'company_code': company_code, 'year_code': year_code, 'tran_type': previous_record.Tran_Type})
            account_info = account_details.first()

            serialized_record = {column.name: getattr(previous_record, column.name) if getattr(previous_record, column.name) is not None else "" for column in previous_record.__table__.columns}
            serialized_record['Formatted_Doc_Date'] = format_dates(previous_record)

            if account_info:
                result_keys = account_details.keys()
                for key, value in zip(result_keys, account_info):
                    serialized_record[key] = value if value is not None else ""

            return jsonify([serialized_record])
        else:
            return jsonify({'error': 'No previous record found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get-next-CommissionBill", methods=["GET"])
def get_next_CommissionBill():
    try:
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')
        selected_code = request.args.get('doc_no')

        if company_code is None or tran_type is None or year_code is None or selected_code is None:
            return jsonify({'error': 'Missing Company_Code, tran_type, year code, or selected_code parameter'}), 400

        try:
            company_code = int(company_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
            selected_code = int(selected_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, tran_type, year code, or selected_code parameter'}), 400

        next_record = CommissionBill.query.filter(CommissionBill.doc_no > selected_code).filter_by(Company_Code=company_code, Tran_Type=tran_type, Year_Code=year_code).order_by(CommissionBill.doc_no.asc()).first()
        if next_record:
            account_details = db.session.execute(sql_query, {'doc_no': next_record.doc_no, 'company_code': company_code, 'year_code': year_code, 'tran_type': next_record.Tran_Type})
            account_info = account_details.first()

            serialized_record = {column.name: getattr(next_record, column.name) if getattr(next_record, column.name) is not None else "" for column in next_record.__table__.columns}
            serialized_record['Formatted_Doc_Date'] = format_dates(next_record)

            if account_info:
                result_keys = account_details.keys()
                for key, value in zip(result_keys, account_info):
                    serialized_record[key] = value if value is not None else ""

            return jsonify([serialized_record])
        else:
            return jsonify({'error': 'No next record found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500

#GET Next Doc_no from database
@app.route(API_URL + "/get-next-doc-no-commissionBill", methods=["GET"])
def get_next_doc_no_commissionBill():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        tranType = request.args.get('Tran_Type')
        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        max_doc_no = db.session.query(func.max(CommissionBill.doc_no)).filter_by(Company_Code=company_code, Year_Code=year_code, Tran_Type = tranType).scalar()
        next_doc_no = max_doc_no + 1 if max_doc_no else 1
        response = {
            "next_doc_no": next_doc_no
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
