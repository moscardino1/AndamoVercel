from flask import Flask, render_template, jsonify, request, abort
import os
import logging
from dotenv import load_dotenv
from io import BytesIO
import qrcode
import base64
import pandas as pd

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)

def fetch_sheet_data():
    SHEET_ID = os.getenv('GOOGLE_SHEET_ID', '18qq79HtX5uFhIRPC2jgV_j9nGfH3CcFR5Pj5-RW9k4A')
    url = f'https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv'
    
    try:
        df = pd.read_csv(url)
        locations = df.to_dict('records')
        return locations
    except Exception as e:
        logger.error(f"Error fetching sheet data: {str(e)}")
        return []

@app.route('/')
def home():
    locations = fetch_sheet_data()
    return render_template('index.html', locations=locations)

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

@app.route('/api/locations')
def get_locations():
    try:
        locations = fetch_sheet_data()
        cleaned_locations = []
        for loc in locations:
            # Remove nan values and create clean dictionary
            cleaned_loc = {
                'name': loc['name'],
                'address': loc['address'],
                'city': loc['city'],
                'type': loc['type'],
                'description': loc['description'],
                'latitude': float(loc['latitude']),
                'longitude': float(loc['longitude']),
                'image': loc['image']
            }
            cleaned_locations.append(cleaned_loc)
        return jsonify({
            "status": "success",
            "data": cleaned_locations
        })

    except Exception as e:
        logger.error(f"Error in /api/locations: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


if __name__ == '__main__':
    logger.info("Starting application")
    app.run(debug=True)