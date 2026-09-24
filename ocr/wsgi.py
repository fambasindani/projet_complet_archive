import sys
import os

# ============================================
# CHEMIN DU PROJET
# ============================================
project_home = '/home/sindani/ocr'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# ============================================
# ACTIVATION DU VIRTUALENV (si présent)
# ============================================
venv_path = '/home/sindani/ocr/venv'
activate = os.path.join(venv_path, 'bin', 'activate_this.py')
if os.path.exists(activate):
    with open(activate) as f:
        exec(f.read(), {'__file__': activate})
    print("✅ Virtualenv activé")
else:
    print("ℹ️ Pas de virtualenv détecté (dépendances user attendues)")

# ============================================
# IMPORT DE L'APPLICATION
# ============================================
try:
    from app import app as application
    print("✅ Application importée avec succès depuis /home/sindani/ocr")
except ImportError as e:
    error_message = str(e)
    print(f"❌ Erreur import: {error_message}")

    # Fallback pour debug
    from flask import Flask
    application = Flask(__name__)

    @application.route('/')
    def error_page():
        return f"""
        <h1>❌ Erreur d'import</h1>
        <p>Impossible d'importer 'app' depuis /home/sindani/ocr</p>
        <p><strong>Erreur:</strong> {error_message}</p>
        <p>Vérifiez que le fichier app.py existe dans /home/sindani/ocr</p>
        <p><strong>Contenu du dossier:</strong></p>
        <pre>{os.listdir('/home/sindani/ocr')}</pre>
        <h2>Solutions:</h2>
        <ol>
            <li>pip install --user -r requirements.txt</li>
            <li>ou: source venv/bin/activate puis pip install -r requirements.txt</li>
            <li>Vérifier que app.py contient bien 'app = Flask(__name__)'</li>
            <li>Reload l'application</li>
        </ol>
        """

    @application.route('/test')
    def test_page():
        return f"""
        <h1>✅ Test réussi</h1>
        <p>Le serveur fonctionne mais l'application principale a une erreur.</p>
        <p><strong>Erreur:</strong> {error_message}</p>
        """

# ============================================
# CRÉATION DES DOSSIERS NÉCESSAIRES
# ============================================
def create_folders():
    folders = [
        '/home/sindani/ocr/uploads',
        '/home/sindani/ocr/temp',
        '/home/sindani/ocr/logs'
    ]
    for folder in folders:
        if not os.path.exists(folder):
            try:
                os.makedirs(folder)
                print(f"✅ Dossier créé: {folder}")
            except Exception as e:
                print(f"❌ Erreur création {folder}: {e}")

create_folders()
