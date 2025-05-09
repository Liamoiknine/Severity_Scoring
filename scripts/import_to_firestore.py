import csv
import os
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize admin connection to firestore db
cred_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', '../../firebase.json')
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)

db = firestore.client()

CSV_PATH = 'data.csv'
COLL     = 'patients'

with open(CSV_PATH, newline='') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Cast integers
        if row['id'] != '':
            row['id'] = int(row['id'])
        else:
            row['id'] = None

        if row['sex'] != '':
            row['sex'] = int(row['sex'])
        else:
            row['sex'] = None

        if row['age'] != '':
            row['age'] = int(row['age'])
        else:
            row['age'] = None

        if row['hu'] != '':
            row['hu'] = int(row['hu'])
        else:
            row['hu'] = None

        if row['position_1'] != '':
            row['position_1'] = int(row['position_1'])
        else:
            row['position_1'] = None

        if row['tmem_1'] != '':
            row['tmem_1'] = int(row['tmem_1'])
        else:
            row['tmem_1'] = None

        if row['position_2'] != '':
            row['position_2'] = int(row['position_2'])
        else:
            row['position_2'] = None

        if row['tmem_2'] != '':
            row['tmem_2'] = int(row['tmem_2'])
        else:
            row['tmem_2'] = None

        if row['n_nsfs'] != '':
            row['n_nsfs'] = int(row['n_nsfs'])
        else:
            row['n_nsfs'] = None

        if row['n_tm'] != '':
            row['n_tm'] = int(row['n_tm'])
        else:
            row['n_tm'] = None

        # Cast floats
        if row['severity'] != '':
            row['severity'] = float(row['severity'])
        else:
            row['severity'] = None

        if row['dm'] != '':
            row['dm'] = float(row['dm'])
        else:
            row['dm'] = None

        if row['oa'] != '':
            row['oa'] = float(row['oa'])
        else:
            row['oa'] = None

        if row['di'] != '':
            row['di'] = float(row['di'])
        else:
            row['di'] = None

        if row['hl'] != '':
            row['hl'] = float(row['hl'])
        else:
            row['hl'] = None

        # Cast Booleans
        if row['has_dm'] == 'Y':
            row['has_dm'] = True
        elif row['has_dm'] == 'N':
            row['has_dm'] = False
        else:
            row['has_dm'] = None

        if row['has_oa'] == 'Y':
            row['has_oa'] = True
        elif row['has_oa'] == 'N':
            row['has_oa'] = False
        else:
            row['has_oa'] = None

        if row['has_di'] == 'Y':
            row['has_di'] = True
        elif row['has_di'] == 'N':
            row['has_di'] = False
        else:
            row['has_di'] = None

        if row['has_hl'] == 'Y':
            row['has_hl'] = True
        elif row['has_hl'] == 'N':
            row['has_hl'] = False
        else:
            row['has_hl'] = None

        # Leave remaining features as strings

        # Write to Firestore --> doc = id
        doc_id = row.get('id')
        if doc_id is not None:
            db.collection(COLL).document(str(doc_id)).set(row)

        print(f"Imported {doc_id or '(new)'}")

print("Done.")
