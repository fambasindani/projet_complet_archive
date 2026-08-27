import os
import pytesseract

class Config:
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024
    ALLOWED_EXTENSIONS = {'pdf'}
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    FLASK_API_TOKEN = os.environ.get('FLASK_API_TOKEN', 'change_me_secret_token')
    TESSERACT_PATH = os.environ.get('TESSERACT_PATH', r'C:\Program Files\Tesseract-OCR\tesseract.exe')

    @classmethod
    def init_app(cls, app):
        if os.name == 'nt':
            pytesseract.pytesseract.tesseract_cmd = cls.TESSERACT_PATH
