from flask import Flask, request, jsonify
from app import app, db
from sqlalchemy.sql import text
from flask_sqlalchemy import SQLAlchemy
from app.models.Reports.GLedeger.GLedgerModels import Gledger
from sqlalchemy import func, case
from datetime import datetime
import os

API_URL = os.getenv('API_URL')

@app.route(API_URL + '/interest-statement', methods=['GET'])
def interest_statement():
    try:
        accode = request.args.get('accode')
        fromdt = request.args.get('fromdt')
        todt = request.args.get('todt')
        int_rate = float(request.args.get('intRate'))
        int_days = int(request.args.get('intDays'))
        company_code = request.args.get('company_code')

        from_date = datetime.strptime(fromdt, "%Y-%m-%d").date()
        to_date = datetime.strptime(todt, "%Y-%m-%d").date()

        op_bal_query = db.session.query(
            func.sum(
                case(
                    (Gledger.DRCR == 'D', Gledger.AMOUNT),
                    else_=-Gledger.AMOUNT
                )
            ).label('OpBal')
        ).filter(
            Gledger.DOC_DATE < from_date,
            Gledger.AC_CODE == accode,
            Gledger.COMPANY_CODE == company_code
        ).group_by(Gledger.AC_CODE)

        op_bal = float(op_bal_query.scalar() or 0.0)


        transactions_query = db.session.query(
            Gledger.TRAN_TYPE,
            Gledger.DOC_DATE,
            Gledger.AMOUNT,
            Gledger.DRCR
        ).filter(
            Gledger.AC_CODE == accode,
            Gledger.DOC_DATE.between(from_date, to_date),
            Gledger.COMPANY_CODE == company_code
        ).order_by(Gledger.DOC_DATE)

        transactions = transactions_query.all()

        statement = []
        balance = op_bal
        net_days, net_interest = 0, 0.0
        total_debit, total_credit = 0.0, 0.0


        if op_bal < 0:  
            total_credit += abs(op_bal)
        else:  
            total_debit += abs(op_bal)

        # Add Opening Balance to Statement (No days or interest calculation for opening balance)
        statement.append({
            'Tran_Type': 'OP',
            'Date': from_date.strftime("%d/%m/%Y"),
            'Debit_Amount': round(op_bal, 2) if op_bal > 0 else 0.0,
            'Credit_Amount': 0.0 if op_bal > 0 else round(-op_bal, 2),
            'Balance': abs(round(op_bal, 2)),
            'Bal_DC': 'Dr' if op_bal > 0 else 'Cr',
            'Days': 0, 
            'Interest': 0.0,  
            'Int_DC': ''  
        })

        
        prev_date = from_date
        prev_balance = balance  

        for i, transaction in enumerate(transactions):
            debit = float(transaction.AMOUNT) if transaction.DRCR == 'D' else 0.0
            credit = float(transaction.AMOUNT) if transaction.DRCR == 'C' else 0.0

            
            total_debit += debit
            total_credit += credit

            current_date = transaction.DOC_DATE
            if isinstance(current_date, str):
                current_date = datetime.strptime(current_date, "%Y-%m-%d").date()

            # Calculate Days and Interest for the previous balance
            used_days = (current_date - prev_date).days
            interest = 0.0
            if used_days > 0:
                interest = round(((abs(prev_balance) * int_rate / 100) / int_days) * used_days, 2)
                net_days += used_days
                net_interest += interest

            # Append interest and days calculated for the previous row to the current transaction
            statement.append({
                'Tran_Type': transaction.TRAN_TYPE,
                'Date': current_date.strftime("%d/%m/%Y"),
                'Debit_Amount': debit,
                'Credit_Amount': credit,
                'Balance': abs(round(balance, 2)),
                'Bal_DC': 'Dr' if balance > 0 else 'Cr',
                'Days': used_days,
                'Interest': interest,
                'Int_DC': 'Dr' if prev_balance > 0 else 'Cr'
            })

            # Update balance and set previous balance
            balance += debit - credit
            prev_balance = balance
            prev_date = current_date

        # Final Calculation for Days to to_date
        final_days = (to_date - prev_date).days + 1
        if final_days > 0:
            final_interest = round(((abs(prev_balance) * int_rate / 100) / int_days) * final_days, 2)
            statement.append({
                'Tran_Type': '',
                'Date': to_date.strftime("%d/%m/%Y"),
                'Debit_Amount': 0.0,
                'Credit_Amount': 0.0,
                'Balance': abs(round(balance, 2)),
                'Bal_DC': 'Dr' if balance > 0 else 'Cr',
                'Days': final_days,
                'Interest': final_interest,
                'Int_DC': 'Dr' if prev_balance > 0 else 'Cr'
            })
            net_days += final_days
            net_interest += final_interest

        # Totals
        totals = {
            'Total_Debit': round(total_debit, 2),
            'Total_Credit': round(total_credit, 2),
            'Net_Days': net_days,
            'Net_Interest': round(net_interest, 2),
            'Net_Balance': abs(round(balance, 2)),
            'Net_Balance_DC': 'Dr' if balance > 0 else 'Cr',
            'Net_Interest_DC': 'Dr' if balance > 0 else 'Cr'
        }

        return jsonify({'data': statement, 'totals': totals})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
