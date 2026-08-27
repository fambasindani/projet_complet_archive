from flask import Flask, request, jsonify
from flask_restful import Api, Resource
from functools import wraps
import os
import uuid
from werkzeug.utils import secure_filename
import PyPDF2
import pdfplumber
import pytesseract
from pdf2image import convert_from_path
import tempfile
import logging
import textwrap
import time
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
api = Api(app)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}
MAX_CONTENT_LENGTH = 50 * 1024 * 1024

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

API_TOKEN = os.environ.get('FLASK_API_TOKEN', 'change_me_secret_token')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def require_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return {'status': 'error', 'message': 'Token manquant'}, 401
        token = auth_header.split('Bearer ')[-1].strip()
        if token != API_TOKEN:
            return {'status': 'error', 'message': 'Token invalide'}, 403
        return f(*args, **kwargs)
    return decorated


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def format_text(text, width=100):
    if not text:
        return ""
    paragraphs = text.split('\n')
    formatted = []
    for p in paragraphs:
        if p.strip():
            formatted.append(textwrap.fill(p, width=width, break_long_words=True, break_on_hyphens=True))
        else:
            formatted.append('')
    return '\n'.join(formatted)


def extract_text_pdfplumber(pdf_path):
    try:
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"pdfplumber error: {e}")
        return None


def extract_text_pypdf2(pdf_path):
    try:
        text = ""
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"PyPDF2 error: {e}")
        return None


def extract_text_tesseract(pdf_path):
    try:
        text = ""
        with tempfile.TemporaryDirectory() as tmpdir:
            images = convert_from_path(pdf_path, dpi=300, output_folder=tmpdir)
            for i, img in enumerate(images):
                page_text = pytesseract.image_to_string(img, lang='fra+eng')
                text += f"\n--- Page {i+1} ---\n{page_text}\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Tesseract error: {e}")
        return None


def count_pdf_pages(pdf_path):
    try:
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            return len(reader.pages)
    except:
        return 0


def extract_text_combined(pdf_path):
    text = extract_text_pdfplumber(pdf_path)
    if text and len(text) >= 100:
        return text, 'pdfplumber'

    logger.info("Texte natif insuffisant, tentative Tesseract...")
    text2 = extract_text_pypdf2(pdf_path)
    if text2 and len(text2) >= 100:
        return text2, 'pypdf2'

    ocr_text = extract_text_tesseract(pdf_path)
    if ocr_text:
        return ocr_text, 'tesseract'

    fallback = text or text2 or ""
    return fallback or "Aucun texte extrait", 'none'


class HealthCheck(Resource):
    def get(self):
        return {'status': 'ok', 'service': 'ocr', 'message': 'OCR service running'}, 200


class OCRSingle(Resource):
    @require_token
    def post(self):
        try:
            if 'file' not in request.files:
                return {'status': 'error', 'message': 'Aucun fichier'}, 400

            file = request.files['file']
            if file.filename == '' or not allowed_file(file.filename):
                return {'status': 'error', 'message': 'Fichier invalide (PDF requis)'}, 400

            start_time = time.time()
            filename = secure_filename(file.filename)
            safe_name = f"{uuid.uuid4().hex}_{filename}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_name)
            file.save(file_path)
            logger.info(f"Fichier reçu: {filename} ({os.path.getsize(file_path)} bytes)")

            pages_count = count_pdf_pages(file_path)
            extracted_text, method = extract_text_combined(file_path)
            formatted_text = format_text(extracted_text)
            processing_time = round(time.time() - start_time, 3)

            os.remove(file_path)

            result = {
                'status': 'success',
                'data': {
                    'text': formatted_text,
                    'raw_text': extracted_text,
                    'pages': pages_count,
                    'method': method,
                    'text_length': len(extracted_text),
                    'word_count': len(extracted_text.split()),
                    'processing_time': processing_time,
                }
            }
            logger.info(f"OCR terminé: {method}, {len(extracted_text)} chars, {processing_time}s")
            return result, 200

        except Exception as e:
            if 'file_path' in locals() and os.path.exists(file_path):
                os.remove(file_path)
            logger.error(f"Erreur OCR: {e}")
            return {'status': 'error', 'message': str(e)}, 500


class OCRBatch(Resource):
    @require_token
    def post(self):
        try:
            files = request.files.getlist('files')
            if not files:
                return {'status': 'error', 'message': 'Aucun fichier'}, 400

            results = []
            for file in files:
                if file.filename == '' or not allowed_file(file.filename):
                    results.append({'filename': file.filename, 'status': 'error', 'message': 'Format invalide'})
                    continue

                try:
                    start_time = time.time()
                    filename = secure_filename(file.filename)
                    safe_name = f"{uuid.uuid4().hex}_{filename}"
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_name)
                    file.save(file_path)

                    pages_count = count_pdf_pages(file_path)
                    extracted_text, method = extract_text_combined(file_path)
                    formatted_text = format_text(extracted_text)
                    processing_time = round(time.time() - start_time, 3)

                    os.remove(file_path)

                    results.append({
                        'filename': filename,
                        'status': 'success',
                        'text': formatted_text,
                        'raw_text': extracted_text,
                        'pages': pages_count,
                        'method': method,
                        'text_length': len(extracted_text),
                        'word_count': len(extracted_text.split()),
                        'processing_time': processing_time,
                    })
                except Exception as e:
                    if 'file_path' in locals() and os.path.exists(file_path):
                        os.remove(file_path)
                    results.append({'filename': file.filename, 'status': 'error', 'message': str(e)})

            success_count = sum(1 for r in results if r['status'] == 'success')
            return {
                'status': 'success',
                'data': {
                    'results': results,
                    'total': len(files),
                    'success': success_count,
                    'failed': len(files) - success_count,
                }
            }, 200

        except Exception as e:
            logger.error(f"Erreur batch OCR: {e}")
            return {'status': 'error', 'message': str(e)}, 500


class OCRByText(Resource):
    @require_token
    def post(self):
        try:
            data = request.get_json()
            if not data or 'text' not in data:
                return {'status': 'error', 'message': 'Champ "text" requis'}, 400

            raw_text = data['text']
            formatted = format_text(raw_text, data.get('line_width', 100))

            return {
                'status': 'success',
                'data': {
                    'text': formatted,
                    'raw_text': raw_text,
                    'text_length': len(raw_text),
                    'word_count': len(raw_text.split()),
                }
            }, 200

        except Exception as e:
            return {'status': 'error', 'message': str(e)}, 500


api.add_resource(HealthCheck, '/api/health')
api.add_resource(OCRSingle, '/api/ocr')
api.add_resource(OCRBatch, '/api/ocr-batch')
api.add_resource(OCRByText, '/api/ocr-format')


@app.errorhandler(404)
def not_found(e):
    return jsonify({'status': 'error', 'message': 'Route non trouvée'}), 404

@app.errorhandler(413)
def too_large(e):
    return jsonify({'status': 'error', 'message': 'Fichier trop volumineux (max 50MB)'}), 413


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"OCR Service starting on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
