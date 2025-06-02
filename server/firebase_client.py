import firebase_admin
from firebase_admin import credentials, firestore

# Global variables
db = None
_patients_cache = None

# Called at server start-up, initialize connection to firebase as db. Retrieve all data and store locally
def init_firebase(app):
    # Initialize Firebase Admin SDK and preload all patient records once at startup
    cred = credentials.Certificate(app.config['FIREBASE_CRED'])
    firebase_admin.initialize_app(cred)
    global db, _patients_cache
    db = firestore.client()
    # Single Firestore query at startup
    docs = db.collection('patients').get()
    _patients_cache = [doc.to_dict() for doc in docs if doc.exists]
    print(f"[Init] Preloaded {len(_patients_cache)} patient records into cache")

# Return dict of all patients and their associated data
def get_patients():
    return _patients_cache if _patients_cache is not None else []

# Gets all the values for a specific feature
def get_feature(feature):
    return [record.get(feature) for record in _patients_cache if record.get(feature) is not None]

# Gets all the values for a specific feature, for only those instances that fit within the chosen group
def get_feature_grouped(value_feature, group_feature):
    grouped = {}
    for record in _patients_cache:
        val = record.get(value_feature)
        grp = record.get(group_feature)
        if val is None or grp is None:
            continue
        grouped.setdefault(grp, []).append(val)
    return grouped

# Get all of allele_1 and all of allele_2
def get_allele_data():
    data = []
    for record in _patients_cache:
        a1 = record.get("allele_1")
        a2 = record.get("allele_2")
        if a1 is not None and a2 is not None:
            data.append({
                "allele_1": a1,
                "allele_2": a2
            })
    return data

# Get the full patient data associated with a given combination of alleles
def get_data_given_alleles(a1, a2):
    fields = ["allele_1", "allele_2", "inheritance", "dm", "oa", "di", "hl", 'sex', 'severity']
    data = { field: [] for field in fields }

    for record in _patients_cache:
        if record.get("allele_1") == a1 and (a2 is None or record.get("allele_2") == a2):
            data["allele_1"].append(record.get("allele_1"))
            data["allele_2"].append(record.get("allele_2"))
            for feature in fields[2:]:
                data[feature].append(record.get(feature))
    return data

# Determine if for any one patient, their feature "allele_1" and "allele_2" match a1 and a2 provided
def check_alleles(a1, a2):
    for record in _patients_cache:
        if a2 is None and record.get("allele_1") == a1:
            return True

        if record.get("allele_1") == a1 and record.get("allele_2") == a2:
            return True
    return False
