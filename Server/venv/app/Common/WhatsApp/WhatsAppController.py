import requests
from flask import Flask, request, jsonify
import base64
import os
from app import db, app

API_URL = os.getenv('API_URL')

GITHUB_API_URL = 'https://api.github.com'
GITHUB_USERNAME = 'RutujaChougule1008'  
GITHUB_REPO = 'GautamEWayBillPortal'  # Replace with your repository name
GITHUB_TOKEN = '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'  # Replace with your GitHub personal access token
BRANCH = 'main'  # Default branch (use 'main' or 'master', depending on your repo)

@app.route(API_URL + '/upload-to-github', methods=['POST'])
def upload_to_github():
    # Get the file from the request
    file = request.files.get('file')  # Assuming the file is sent with the key 'file'
    if not file:
        return jsonify({"status": "error", "message": "No file provided"}), 400

    file_content = file.read()
    file_name = file.filename

    encoded_content = base64.b64encode(file_content).decode('utf-8')

    # Construct the GitHub API URL to upload the file
    url = f"{GITHUB_API_URL}/repos/{GITHUB_USERNAME}/{GITHUB_REPO}/contents/{file_name}"

    # Define the commit message and the content to be uploaded
    data = {
        "message": f"Upload {file_name}",
        "content": encoded_content,
        "branch": BRANCH  # Specify the branch (e.g., 'main')
    }

    try:
        # Check if the file already exists by sending a GET request
        check_url = f"{GITHUB_API_URL}/repos/{GITHUB_USERNAME}/{GITHUB_REPO}/contents/{file_name}?ref={BRANCH}"
        check_response = requests.get(
            check_url,
            headers={"Authorization": f"token {GITHUB_TOKEN}"}
        )

        if check_response.status_code == 200:
            # File exists, get the sha to overwrite it
            existing_file = check_response.json()
            sha = existing_file['sha']
            # Update the data to include the sha
            data["sha"] = sha
            data["message"] = f"Update {file_name}"

        # Send the PUT request to GitHub API (either new upload or update existing file)
        response = requests.put(
            url,
            json=data,
            headers={"Authorization": f"token {GITHUB_TOKEN}"}
        )

        # Handle the response from GitHub API
        if response.status_code == 201 or response.status_code == 200:
            # Extract the URL of the uploaded file (use download_url for raw content)
            file_url = response.json().get('content', {}).get('download_url')
            return jsonify({
                "status": "success",
                "message": f"File {file_name} uploaded successfully!",
                "file_url": file_url  # Return the raw content URL
            }), 201
        else:
            try:
                # Try to parse the response as JSON
                error_message = response.json().get('message', 'Unknown error')
            except ValueError:
                # If JSON parsing fails, fall back to raw response
                error_message = response.text

            return jsonify({"status": "error", "message": error_message}), response.status_code

    except requests.exceptions.RequestException as e:
        return jsonify({"status": "error", "message": f"An error occurred: {str(e)}"}), 500
