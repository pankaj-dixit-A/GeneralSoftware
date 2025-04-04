# app/routes/group_routes.py
from flask import jsonify, request
from app import app, db
from app.models.Masters.OtherMasters.GSTRateMasterModels import GSTRateMaster
import os
from sqlalchemy import text,func
import traceback
# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

# Get all groups API
@app.route(API_URL+"/getall-GSTRateMaster", methods=["GET"])
def getall_GSTRateMaster():
    try:
        Company_Code = request.args.get('Company_Code')
        if Company_Code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            Company_Code = int(Company_Code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        
        records = GSTRateMaster.query.filter_by(Company_Code=Company_Code).order_by(GSTRateMaster.Doc_no.desc()).all()
        print("records",records)
        if not records:  
            return jsonify({'message': 'No records found for the given Company_Code'}), 404

        record_data = []
        for record in records:
            if record:
                selected_Record_data = {column.key: getattr(record, column.key) for column in record.__table__.columns}
                record_data.append(selected_Record_data)

        return jsonify({"record_data": record_data})

    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500

 
 #GET Last Record
@app.route(API_URL + "/get-GSTRateMaster-lastRecord", methods=["GET"])
def get_GSTRateMaster_lastRecord():
     try:
         company_code = request.args.get('Company_Code')
         if company_code is None:
             return jsonify({'error': 'Missing Company_Code parameter'}), 400
 
         try:
             company_code = int(company_code)
         except ValueError:
             return jsonify({'error': 'Invalid Company_Code parameter'}), 400
 
         last_Record = GSTRateMaster.query.filter_by(Company_Code=company_code).order_by(GSTRateMaster.Doc_no.desc()).first()
 
         if last_Record is None:
             return jsonify({'error': 'No group found fOr the provided Company_Code'}), 404
 
         last_Record_data = {column.key: getattr(last_Record, column.key) for column in last_Record.__table__.columns}
 
         return jsonify(last_Record_data)
     except Exception as e:
         print (e)
         return jsonify({'error': 'internal server error'}), 500

#Get Particular record
@app.route(API_URL+"/get-GSTRateMasterSelectedRecord", methods=["GET"])
def get_GSTRateMasterSelectedRecord():
    try:
        selected_code = request.args.get('Doc_no')
        company_code = request.args.get('Company_Code')

        if selected_code is None or company_code is None:
            return jsonify({'error': 'Missing selected_code or Company_Code parameter'}), 400

        try:
            selected_Record = int(selected_code)
            company_code = int(company_code)
        except ValueError:
            return jsonify({'error': 'Invalid selected_Record Or Company_Code parameter'}), 400

        Record = GSTRateMaster.query.filter_by(Doc_no = selected_Record, Company_Code = company_code).first()

        if Record is None:
            return jsonify({'error': 'Selected Record not found'}), 404

        selected_Record_data = {column.key: getattr(Record, column.key) for column in Record.__table__.columns}

        return jsonify(selected_Record_data)
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500
  
# Create a new group API
@app.route(API_URL+"/create_GSTRateMaster", methods=["POST"])
def create_GSTRateMaster():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'Missing request data'}), 400
        
        max_doc_no = db.session.query(func.max(GSTRateMaster.Doc_no)).scalar()
        if max_doc_no is None:
            max_doc_no = 0
        
        data['Doc_no'] = max_doc_no + 1

        columns = ', '.join(data.keys())
        placeholders = ', '.join([f':{key}' for key in data.keys()])

        query = text(f"INSERT INTO nt_1_gstratemaster ({columns}) VALUES ({placeholders})")

        db.session.execute(query, data)
        db.session.commit()

        return jsonify({'message': 'GSTRateMaster record created successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# # Update a group API
@app.route(API_URL+"/update_GSTRateMaster", methods=["PUT"])
def update_GSTRateMaster():
    try:
        doc_no = request.args.get('Doc_no')
        if not doc_no:
            return jsonify({'error': 'Missing Doc_no parameter'}), 400
        
        data = request.json
        if not data:
            return jsonify({'error': 'Missing request data'}), 400
        
        record = GSTRateMaster.query.filter_by(Doc_no=doc_no).first()
        if not record:
            return jsonify({'error': 'Record not found'}), 404
        
        for key, value in data.items():
            setattr(record, key, value)
        
        db.session.commit()

        return jsonify({'message': 'GSTRateMaster record updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# # Delete a group API
@app.route(API_URL+"/delete_GSTRateMaster", methods=["DELETE"])
def delete_GSTRateMaster():
    try:
        doc_no = request.args.get('Doc_no')
        if not doc_no:
            return jsonify({'error': 'Missing Doc_no parameter'}), 400
        
        record = GSTRateMaster.query.filter_by(Doc_no=doc_no).first()
        if not record:
            return jsonify({'error': 'Record not found'}), 404
        
        db.session.delete(record)
        db.session.commit()

        return jsonify({'message': 'GSTRateMaster record deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

#Navigation APIS
@app.route(API_URL+"/get-first-GSTRateMaster", methods=["GET"])
def get_first_GSTRateMaster():
    try:
        first_user_creation = GSTRateMaster.query.order_by(GSTRateMaster.Doc_no.asc()).first()
        if first_user_creation:
            serialized_user_creation = {key: value for key, value in first_user_creation.__dict__.items() if not key.startswith('_')}
            return jsonify([serialized_user_creation])
        else:
            return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get-last-GSTRateMaster", methods=["GET"])
def get_last_GSTRateMaster():
    try:
        last_user_creation = GSTRateMaster.query.order_by(GSTRateMaster.Doc_no.desc()).first()
        if last_user_creation:
            serialized_last_user_creation = {}
            for key, value in last_user_creation.__dict__.items():
                if not key.startswith('_'):
                    serialized_last_user_creation [key] = value
            return jsonify([serialized_last_user_creation])
        else:
            return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get-previous-GSTRateMaster", methods=["GET"])
def get_previous_GSTRateMaster():
    try:
        Selected_Record = request.args.get('Doc_no')
        if Selected_Record is None:
            return jsonify({'errOr': 'Selected_Record parameter is required'}), 400

        previous_selected_record = GSTRateMaster.query.filter(GSTRateMaster.Doc_no < Selected_Record)\
            .order_by(GSTRateMaster.Doc_no.desc()).first()
        if previous_selected_record:
            serialized_previous_selected_record = {key: value for key, value in previous_selected_record.__dict__.items() if not key.startswith('_')}
            return jsonify(serialized_previous_selected_record)
        else:
            return jsonify({'error': 'No previous record found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get-next-GSTRateMaster", methods=["GET"])
def get_next_GSTRateMaster():
    try:
        Selected_Record = request.args.get('Doc_no')
        if Selected_Record is None:
            return jsonify({'error': 'Selected_Record parameter is required'}), 400

        next_Selected_Record = GSTRateMaster.query.filter(GSTRateMaster.Doc_no > Selected_Record)\
            .order_by(GSTRateMaster.Doc_no.asc()).first()
        if next_Selected_Record:
            serialized_next_Selected_Record = {key: value for key, value in next_Selected_Record.__dict__.items() if not key.startswith('_')}
            return jsonify({'nextSelectedRecord': serialized_next_Selected_Record})
        else:
            return jsonify({'error': 'No next record found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500

