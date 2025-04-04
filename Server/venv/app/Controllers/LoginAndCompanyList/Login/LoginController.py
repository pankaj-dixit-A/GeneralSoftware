from flask import jsonify, request
from flask_jwt_extended import create_access_token,jwt_required,get_jwt_identity
from app import app
from app.models.LoginModels.LoginModels import GroupUser 
from datetime import timedelta
import os
API_URL= os.getenv('API_URL')

# API route for user login
@app.route(API_URL + '/login', methods=['POST'])
def login():
    login_data = request.json
    if not login_data:
        return jsonify({'error': 'No data provided'}), 400
    login_name = login_data.get('Login_Name')
    password = login_data.get('Password')

    if not login_name or not password:
        return jsonify({'error': 'Login name and password are required'}), 400
    user = GroupUser.query.filter_by(Login_Name=login_name).first() 

    if not user:
        return jsonify({'error': 'Invalid Login Credentials'}), 401

    if user.Password != password:
        return jsonify({'error': 'Invalid Login Credentials'}), 401

    user_data = user.__dict__

    user_data.pop('_sa_instance_state', None)
    user_data.pop('Password', None)

    access_token = create_access_token(identity=login_name, fresh=True, expires_delta=timedelta(minutes=60))
    return jsonify({'message': 'Login successful', 'user_data': user_data, 'access_token': access_token}), 200

@app.route(API_URL + '/check-token', methods=['GET'])
@jwt_required()
def check_token():
    identity = get_jwt_identity()
    new_token = create_access_token(identity=identity, expires_delta=timedelta(minutes=60))
    return jsonify({
        "msg": "Token is valid",
        "new_token": new_token
    }), 200