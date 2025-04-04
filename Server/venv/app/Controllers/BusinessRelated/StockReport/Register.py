from app import app, db
from flask import request, jsonify, session
from sqlalchemy import text
import traceback
from datetime import datetime
import os

API_URL = os.getenv('API_URL')


def format_date(date_str):
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").strftime("%Y-%m-%d")
    except ValueError:
        return date_str


@app.route(API_URL + '/dispatch-details', methods=['GET'])
def dispatch_details():
    try:
        # Get query parameters
        mill_code = request.args.get("Mill_Code", "")
        from_dt = request.args.get("fromDT")
        to_dt = request.args.get("toDT")
        lot_no = request.args.get("Lot_No", "")
        sr_no = request.args.get("Sr_No", "")
        branch_code = request.args.get("Branch_Code", "")
        company_code = request.args.get("Company_Code")
        year_code = request.args.get("Year_Code")

        # Validate required parameters
        if not from_dt or not to_dt:
            return jsonify({"error": "fromDT and toDT are required."}), 400

        # Format dates
        from_dt = format_date(from_dt)
        to_dt = format_date(to_dt)

        # Base query for DOHead table
        do_query = """
            SELECT doc_no AS detail_id, doc_dateConverted as DI_Date, salebillname AS Getpass,
                   shiptoshortname AS ShippedTo, truck_no, quantal AS DI_Qty,
                   doshortname AS DI_DO, purc_no
            FROM qrydohead
            WHERE company_code = :company_code
              AND Year_Code = :year_code
              AND doc_date BETWEEN :from_dt AND :to_dt
              AND tran_type = 'DO'
        """
        do_params = {
            "company_code": company_code,
            "year_code": year_code,
            "from_dt": from_dt,
            "to_dt": to_dt
        }
        if sr_no:
            do_query += " AND purc_order = :sr_no"
            do_params["sr_no"] = sr_no

        # Execute DOHead query
        do_results = db.session.execute(text(do_query), do_params).fetchall()

        # Base query for Tender details
        tender_query = """
            SELECT DISTINCT Tender_No, Tender_DateConverted as Tender_Date , millshortname AS Mill, Mill_Code,
                            Grade, Quantal, Mill_Rate, Lifting_Date, tenderdoname AS Tender_DO
            FROM qrytenderheaddetail
            WHERE company_code = :company_code
              AND Tender_Date BETWEEN :from_dt AND :to_dt
        """
        tender_params = {
            "company_code": company_code,
            "from_dt": from_dt,
            "to_dt": to_dt
        }

        # Apply conditions for Tender details
        if mill_code:
            tender_query += " AND Mill_Code = :mill_code"
            tender_params["mill_code"] = mill_code

            if lot_no:
                tender_query += " AND Tender_No = :lot_no"
                tender_params["lot_no"] = lot_no

                if sr_no:
                    tender_query += " AND ID = :sr_no"
                    tender_params["sr_no"] = sr_no

        elif lot_no:
            tender_query += " AND Tender_No = :lot_no"
            tender_params["lot_no"] = lot_no

            if sr_no:
                tender_query += " AND ID = :sr_no"
                tender_params["sr_no"] = sr_no

        # Execute Tender query
        tender_results = db.session.execute(text(tender_query), tender_params).fetchall()

        # Add Dispatched column to Tender results
        tender_data = []
        for row in tender_results:
            tender_no = row["Tender_No"]
            dispatched_query = """
                SELECT SUM(Quantal) AS Dispatched
                FROM nt_1_deliveryorder
                WHERE company_code = :company_code
                  AND Year_Code = :year_code
                  AND Purc_No = :tender_no
                  AND Tran_Type = 'DO'
            """
            dispatched = db.session.execute(
                text(dispatched_query),
                {"company_code": company_code, "year_code": year_code, "tender_no": tender_no}
            ).scalar() or 0

            row_data = dict(row._mapping)  # Convert SQLAlchemy row to dictionary
            row_data["Dispatched"] = dispatched
            tender_data.append(row_data)

        # Prepare response
        response_data = {
            "do_results": [dict(row._mapping) for row in do_results],  # Convert DOHead rows to list of dictionaries
            "tender_results": tender_data,
            "do_count": len(do_results),
            "tender_count": len(tender_data)
        }


        return jsonify(response_data)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
