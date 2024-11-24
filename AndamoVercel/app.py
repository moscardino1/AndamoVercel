from flask import Flask, render_template, jsonify, request, abort
import os
import logging
from dotenv import load_dotenv
from io import BytesIO
from datetime import datetime
import qrcode
import base64
import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/info')
def info():
    return render_template('info.html')

@app.route('/donate')
def donate():
    USDT_ADDRESS = "0xDC92534Be92780c87f232CD525D99e26892E15f7"
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
    qr.add_data(USDT_ADDRESS)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    qr_image = base64.b64encode(buffered.getvalue()).decode('utf-8')

    return render_template('donate.html', usdt_address=USDT_ADDRESS, qr_image=qr_image)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/locations')
def get_locations():
    # This would be replaced with your actual data fetching logic
    SHEET_ID = os.getenv('GOOGLE_SHEET_ID', '18qq79HtX5uFhIRPC2jgV_j9nGfH3CcFR5Pj5-RW9k4A')
    # Add your Google Sheets integration here
    return jsonify({"status": "success"})
 

@app.before_request
def log_request_info():
    logger.debug('Headers: %s', request.headers)
    logger.debug('Body: %s', request.get_data())

@app.after_request
def log_response_info(response):
    logger.debug('Response Status: %s', response.status)
    logger.debug('Response Headers: %s', response.headers)
    return response

if __name__ == '__main__':
    logger.info("Starting application")
    app.run(debug=True)
