from flask import Flask, request, jsonify
from app import app, db
from sqlalchemy.sql import text
import os

API_URL = os.getenv('API_URL')

@app.route(API_URL + '/report-stock-book', methods=['GET'])
def get_stock_book():
    try:
        doc_date = request.args.get('doc_date')
        company_code = request.args.get('company_code')

        # Fetch data from the database
        query = text("""
            SELECT * 
            FROM qrystockbookfinal 
            WHERE doc_date <= :doc_date 
              AND Company_Code = :company_code
            ORDER BY item_code, doc_date
        """)

        result = db.session.execute(query, {'doc_date': doc_date, 'company_code': company_code}).fetchall()

        # Convert result to dictionary format
        raw_data = [dict(row._mapping) for row in result]

        # Initialize cumulative data by item_code
        cumulative_data = {}  # Cumulative data for each item_code
        processed_data = []

        for row in raw_data:
            item_code = row.get('item_code')
            item_name = row.get('Item_Name')
            doc_date = row.get('doc_date')

            # Initialize cumulative values for a new item_code
            if item_code not in cumulative_data:
                cumulative_data[item_code] = {
                    'op_qty': 0,
                    'op_value': 0,
                    'purc_qty': 0,
                    'purc_value': 0,
                    'sale_qty': 0,
                    'sale_val': 0,
                    'close_qty': 0,
                    'close_val': 0
                }

            # Extract the current row's data
            inward = row.get('inward', 0) or 0
            inward_value = row.get('inwardvalue', 0) or 0
            outward = row.get('outward', 0) or 0
            outward_value = row.get('outwardvalue', 0) or 0

            # Cumulative calculations
            op_qty = cumulative_data[item_code]['close_qty']
            op_value = cumulative_data[item_code]['close_val']
            purc_qty = inward
            purc_value = inward_value
            sale_qty = outward
            sale_val = outward_value
            close_qty = op_qty + purc_qty - sale_qty
            close_val = op_value + purc_value - sale_val

            # Update cumulative totals for the item_code
            cumulative_data[item_code]['op_qty'] = op_qty
            cumulative_data[item_code]['op_value'] = op_value
            cumulative_data[item_code]['purc_qty'] += purc_qty
            cumulative_data[item_code]['purc_value'] += purc_value
            cumulative_data[item_code]['sale_qty'] += sale_qty
            cumulative_data[item_code]['sale_val'] += sale_val
            cumulative_data[item_code]['close_qty'] = close_qty
            cumulative_data[item_code]['close_val'] = close_val

            # Add calculated fields to the row
            processed_row = {
                'doc_date': doc_date,
                'item_name': item_name,
                'op_qty': op_qty,
                'op_value': op_value,
                'purc_qty': purc_qty,
                'purc_value': purc_value,
                'sale_qty': sale_qty,
                'sale_val':sale_val,
                'close_qty': cumulative_data[item_code]['close_qty'],
                'close_val': cumulative_data[item_code]['close_val'],
            }

            processed_data.append(processed_row)

        return jsonify({'data': processed_data, 'count': len(processed_data)})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route(API_URL + '/stock-book-detail', methods=['GET'])
def get_stock_book_detail():
    try:
        ac_code = request.args.get('acCode')  
        doc_date = request.args.get('doc_date')  
        company_code = request.args.get('company_code')  

        if ac_code == "":
            query = text("""
                SELECT * 
                FROM qrystockbookDetail 
                WHERE doc_date <= :doc_date 
                  AND Company_Code = :company_code
            """)
            params = {'doc_date': doc_date, 'company_code': company_code}
        else:
            query = text("""
                SELECT * 
                FROM qrystockbookDetail 
                WHERE doc_date <= :doc_date 
                  AND item_code = :ac_code 
                  AND Company_Code = :company_code
            """)
            params = {'doc_date': doc_date, 'ac_code': ac_code, 'company_code': company_code}

        result = db.session.execute(query, params).fetchall()
        data = [dict(row._mapping) for row in result]

        total_balqntl = 0
        for item in data:
            item['inwqntl'] = item['Quantal'] if item.get('drcr') == "D" else 0
            item['outqntl'] = item['Quantal'] if item.get('drcr') == "C" else 0
            item['bal'] = item['inwqntl'] - item['outqntl']
            item['opqntl'] = total_balqntl + item['outqntl'] - item['inwqntl']
            total_balqntl = item['opqntl']

        return jsonify({'data': data, 'count': len(data)})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route(API_URL+'/retail-stock-book-detail', methods=['GET'])
def get_retail_stock_book_detail():
    try:
        ac_code = request.args.get('acCode', '') 
        doc_date = request.args.get('doc_date')  
        company_code = request.args.get('company_code')  

        if ac_code == "":
            query = text("""
                SELECT * 
                FROM qrystockbookDetailsefl 
                WHERE doc_date <= :doc_date 
                  AND Company_Code = :company_code
            """)
            params = {'doc_date': doc_date, 'company_code': company_code}
        else:
            query = text("""
                SELECT * 
                FROM qrystockbookDetailsefl 
                WHERE doc_date <= :doc_date 
                  AND item_code = :ac_code 
                  AND Company_Code = :company_code
            """)
            params = {'doc_date': doc_date, 'ac_code': ac_code, 'company_code': company_code}

        result = db.session.execute(query, params).fetchall()

        data = [dict(row._mapping) for row in result]

        total_balqntl = 0
        for item in data:
            item['inwqntl'] = item['Quantal'] if item.get('drcr') == "D" else 0
            item['outqntl'] = item['Quantal'] if item.get('drcr') == "C" else 0
            item['bal'] = item['inwqntl'] - item['outqntl']
            item['opqntl'] = total_balqntl + item['outqntl'] - item['inwqntl']
            total_balqntl = item['opqntl']

        return jsonify({'data': data, 'count': len(data)})

    except Exception as e:
        return jsonify({'error': str(e)}), 500