from flask import Flask, request, jsonify, session
from sqlalchemy import  func, and_, or_
from sqlalchemy.sql import text
from datetime import datetime
from app.models.Masters.AccountInformation.AccountMaster.AccountMasterModel import AccountMaster
from app.models.Reports.GLedeger.GLedgerModels import Gledger
import os

API_URL = os.getenv('API_URL')
# Utility Functions
def format_date(date_str):
    try:
        return datetime.strptime(date_str, "%d/%m/%Y").strftime("%Y/%m/%d")
    except ValueError:
        return date_str

@app.route(API_URL+'/trial-balance-getData', methods=['GET'])
def trial_balance():
    try:
        ac_type = request.args.get("Ac_type")
        doc_date = format_date(request.args.get("doc_date"))
        company_code = request.args.get("company_code")

        if not doc_date or not company_code:
            return jsonify({"error": "Missing required parameters"}), 400

        base_query = db_session.query(
            Gledger.AC_CODE,
            Gledger.Ac_Name_E,
            Gledger.CityName,
            Gledger.Mobile_No,
            (func.sum(
                func.case([(Gledger.drcr == 'D', Gledger.AMOUNT),
                           (Gledger.drcr == 'C', -Gledger.AMOUNT)],
                          else_=0)
            )).label('Balance')
        ).filter(
            Gledger.DOC_DATE <= doc_date,
            Gledger.COMPANY_CODE == company_code
        )

        if ac_type != "A":
            base_query = base_query.filter(Gledger.Ac_type == ac_type)

        base_query = base_query.group_by(
            Gledger.AC_CODE,
            Gledger.Ac_Name_E,
            Gledger.CityName,
            Gledger.Mobile_No
        ).having(
            func.sum(
                func.case([(Gledger.drcr == 'D', Gledger.AMOUNT),
                           (Gledger.drcr == 'C', -Gledger.AMOUNT)],
                          else_=0)
            ) != 0
        ).order_by(Gledger.Ac_Name_E)

       
        result = base_query.all()

        data = []
        for row in result:
            balance = row.Balance
            debit_amt = balance if balance > 0 else 0
            credit_amt = -balance if balance < 0 else 0
            data.append({
                "accode": row.AC_CODE,
                "acname": row.Ac_Name_E,
                "city": row.CityName,
                "mobile": row.Mobile_No,
                "debitAmt": debit_amt,
                "creditAmt": credit_amt
            })

        return jsonify({"data": data, "count": len(data)})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route(API_URL+'/depreciation-data', methods=['POST'])
def calculate_depreciation_endpoint():
    try:
        request_data = request.get_json()
        start_date_str = request_data.get("start_date")
        end_date_str = request_data.get("end_date")
        company_code = request_data.get("company_code")

        if not start_date_str or not end_date_str or not company_code:
            return jsonify({"error": "Missing required parameters"}), 400

        start_date = format_date(start_date_str)
        end_date = format_date(end_date_str)
        six_month_date = datetime.strptime(start_date, "%Y/%m/%d").replace(month=9, day=30).strftime("%Y/%m/%d")

        accounts_query = db_session.query(AccountMaster).filter(
            AccountMaster.Ac_type == 'F',
            AccountMaster.company_code == company_code
        ).all()

        dtreturn = []

        for account in accounts_query:
            accode = account.AC_CODE
            acname = account.Ac_Name_E
            intrate = account.Ac_rate

            opening_balance_query = db_session.query(
                func.sum(
                    func.case([(Gledger.drcr == 'D', Gledger.AMOUNT),
                               (Gledger.drcr == 'C', -Gledger.AMOUNT)],
                              else_=0)
                ).label('OpeningBalance')
            ).filter(
                Gledger.AC_CODE == accode,
                Gledger.DOC_DATE < start_date,
                Gledger.COMPANY_CODE == company_code
            ).group_by(Gledger.AC_CODE)

            opening_balance = opening_balance_query.scalar() or 0

            # Additions before six_month_date
            additions_before_query = db_session.query(
                func.sum(Gledger.AMOUNT).label('AdditionsBefore')
            ).filter(
                Gledger.AC_CODE == accode,
                Gledger.drcr == 'D',
                Gledger.DOC_DATE >= start_date,
                Gledger.DOC_DATE <= six_month_date,
                Gledger.COMPANY_CODE == company_code
            )
            additions_before = additions_before_query.scalar() or 0

            # Additions after six_month_date
            additions_after_query = db_session.query(
                func.sum(Gledger.AMOUNT).label('AdditionsAfter')
            ).filter(
                Gledger.AC_CODE == accode,
                Gledger.drcr == 'D',
                Gledger.DOC_DATE > six_month_date,
                Gledger.DOC_DATE <= end_date,
                Gledger.COMPANY_CODE == company_code
            )
            additions_after = additions_after_query.scalar() or 0

            # Deletions during the year
            deletions_query = db_session.query(
                func.sum(Gledger.AMOUNT).label('Deletions')
            ).filter(
                Gledger.AC_CODE == accode,
                Gledger.drcr == 'C',
                Gledger.DOC_DATE >= start_date,
                Gledger.DOC_DATE <= end_date,
                Gledger.COMPANY_CODE == company_code
            )
            deletions = deletions_query.scalar() or 0

            # Calculate depreciation
            balance = opening_balance + additions_before + additions_after - deletions
            depreciation_before = (opening_balance + additions_before) * (intrate / 100)
            depreciation_after = additions_after * ((intrate / 2) / 100)
            total_depreciation = round(depreciation_before + depreciation_after, 2)
            final_amount = balance - total_depreciation

            # Append to result
            dtreturn.append({
                "accode": accode,
                "acname": acname,
                "OpeningBalance": round(opening_balance, 2),
                "Before": round(additions_before, 2),
                "After": round(additions_after, 2),
                "Deletion": round(deletions, 2),
                "Balance": round(balance, 2),
                "DepAmount": total_depreciation,
                "FinalBalance": round(final_amount, 2),
                "InterestRate": intrate
            })

        return jsonify({"data": dtreturn, "count": len(dtreturn)})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
