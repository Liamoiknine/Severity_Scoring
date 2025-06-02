# routes/api.py
from flask import jsonify, request, session
from . import api_bp
from firebase_client import get_patients, get_feature, get_feature_grouped, check_alleles, get_allele_data, get_data_given_alleles
import numpy as np
import re


# Get a dict of patients and their data filtered based on passed parameters
# Returns {"age": x, "allele_1": xxx, etc...}, {"age": x, "allele_1": xxx, etc...}, ...
@api_bp.route('/patients')
def read_patients():
    try:
        # takes in arguments (sex, severity, manifestation) *can be null
        sex = request.args.get('sex')
        severity = request.args.get('severity')
        manifestation = request.args.get('manifestation')
        
        # Debug message
        print(f"Received request with params: sex={sex}, severity={severity}, manifestation={manifestation}")
        
        # Returns a list of all patients in the database
        patients = get_patients()
        
        # Apply filters based on which parameters were provided
        if sex:
            # Convert sex to integer (1 for male, 0 for female)
            if sex == "Male":
                sex_value = 0
            elif sex == "Female":
                sex_value = 1
            else:
                return jsonify({'error': 'Invalid sex value'}), 400
            patients = [p for p in patients if p.get('sex') == sex_value]


        if severity:
            patients = [p for p in patients if p.get('severity') == int(severity)]

        if manifestation:
            # Get the manifestation's key
            manifestation_key = {
                'Diabetes Mellitus': 'dm',
                'Optic Atrophy': 'oa',
                'Diabetes Insipidus': 'di',
                'Hearing Loss': 'hl'
            }.get(manifestation)

            if manifestation_key:
                patients = [p for p in patients if p.get(manifestation_key) is not None]

        if not patients:
            return jsonify({'error': 'No patients found matching the criteria'}), 404
            
        return jsonify(patients)
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# Get the data associated with a specific manifestation
@api_bp.route('/data/<string:manifestation>')
def send_feature(manifestation):
    manifestation_list = get_feature(manifestation)
    if not manifestation_list:
        return jsonify({'error': f'Query failed for manifestation {manifestation}'}), 404
    
    return jsonify(manifestation_list), 200

# Retrieve statistics for a given manifestation for ONLY those patients that fit in the current subgroup defined by params
@api_bp.route('/stats/<string:manifestation>')
def get_stats(manifestation):
    try:
        sex = request.args.get('sex')
        severity = request.args.get('severity')
        manifestation2 = request.args.get('manifestation2')
        
        patients = get_patients()
        
        # apply selectors
        if sex:
            if sex == "Male":
                sex_value = 0
            elif sex == "Female":
                sex_value = 1
            else:
                return jsonify({'error': 'Invalid sex value'}), 400
            patients = [p for p in patients if p.get('sex') == sex_value]
            
        if severity:
            patients = [p for p in patients if p.get('severity') == int(severity)]
        
        # If manifestation2 is provided, calculate correlation stats
        if manifestation2:
            manifestation_key1 = manifestation  # The first manifestation is already the key
            manifestation_key2 = manifestation2  # The second manifestation is already the key
            
            # Get pairs of values where both manifestations are present
            pairs = [(p.get(manifestation_key1), p.get(manifestation_key2)) 
                    for p in patients 
                    if p.get(manifestation_key1) is not None and p.get(manifestation_key2) is not None]
            
            if not pairs:
                return jsonify({'error': 'No data found for the given manifestations'}), 404
                
            # Calculate correlation statistics
            x_values, y_values = zip(*pairs)
            correlation = np.corrcoef(x_values, y_values)[0, 1]
            
            # Calculate regression line
            slope, intercept = np.polyfit(x_values, y_values, 1)
            
            stats = {
                "Correlation Coefficient": round(float(correlation), 3),
                "Regression Slope": round(float(slope), 3),
                "Regression Intercept": round(float(intercept), 3),
                "Sample Size": len(pairs),
                f"{manifestation} Mean": round(float(np.mean(x_values)), 2),
                f"{manifestation2} Mean": round(float(np.mean(y_values)), 2),
                f"{manifestation} Std Dev": round(float(np.std(x_values)), 2),
                f"{manifestation2} Std Dev": round(float(np.std(y_values)), 2)
            }
            return jsonify(stats)
        
        # Original single manifestation stats logic
        if manifestation == 'all':
            all_values = []
            for patient in patients:
                for key in ['dm', 'oa', 'di', 'hl']:
                    if patient.get(key) is not None:
                        all_values.append(patient[key])
            manifestation_list = all_values
        else:
            # For specific feature, get values for that feature only
            manifestation_list = [p.get(manifestation) for p in patients if p.get(manifestation) is not None]
        
        if not manifestation_list:
            return jsonify({'error': f'No data found{" for all manifestations" if manifestation == "all" else f" for manifestation {manifestation}"} with the given filters'}), 404
            
        stats = calculate_stats(manifestation_list)
        return jsonify(stats)
        
    except Exception as e:
        print(f"Error in get_stats: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# Retrive stats associated with a specific feature grouped by another feature
@api_bp.route('/relative-stats')
def get_relative_stats():
    value_feature = request.args.get('value')
    group_feature = request.args.get('group')
    feature_dict = get_feature_grouped(value_feature, group_feature)
    
    if not feature_dict:
        return jsonify({'error': f'Query failed for feature {value_feature} or {group_feature}'}), 404
    
    stats_dict = {
        group: calculate_stats(values)
        for group, values in feature_dict.items()
    }
    
    return jsonify(stats_dict)

# Check if the provided combination of alleles exists in db, if so, return the full data associated with that patient
@api_bp.route('check_alleles')
def  check_allele_validity():
    allele1 = request.args.get('allele1')
    allele2 = request.args.get('allele2')

    is_valid = check_alleles(allele1, allele2)

    if not is_valid:
        return jsonify(None), 200
    
    full_allele_data = get_data_given_alleles(allele1, allele2)
    new_mut = {
        "allele1":     full_allele_data["allele_1"][0],
        "allele2":     full_allele_data["allele_2"][0],
        "inheritance": full_allele_data["inheritance"][0],
        "dm":          full_allele_data["dm"][0],
        "oa":          full_allele_data["oa"][0],
        "di":          full_allele_data["di"][0],
        "hl":          full_allele_data["hl"][0],
        'sex':         full_allele_data['sex'][0],
        'severity':    full_allele_data['severity'][0],
    }

    current = session.get('mutations', [])
    if new_mut not in current:
        current.append(new_mut)
        session['mutations'] = current
        return jsonify(new_mut)

    return jsonify(None), 200

# Retrieve a dict of all the values for allele_1 and allele_2
@api_bp.route('get_alleles')
def get_alleles():
    allele_list = get_allele_data()
    return jsonify(allele_list)

# Retrieve a list of all patient data - stored in session variable
@api_bp.route('/get_mutation_list')
def get_mutation_list():
    # Retrieve the list (or default to empty list)
    mutations = session.get('mutations', [])
    return jsonify(mutations), 200
    

# Local function for calculating stats based on a given list of patients
def calculate_stats(feature_list):
    if not feature_list:
        return {'error': f'Stats failed for feature'}
    # calculate stats
    mean = np.mean(feature_list)
    sum = np.sum(feature_list)
    count = len(feature_list)
    std = np.std(feature_list)
    median = np.median(feature_list)
    q1 = np.quantile(feature_list, 0.25)
    q3 = np.quantile(feature_list, 0.75)
    min = np.min(feature_list)
    max = np.max(feature_list)

    # assemble into a JSON‑serializable dict
    stats = {
        "Count":               count,
        "Mean":                round(float(mean), 2),
        "Median":              round(float(median), 2),
        "Standard Deviation":  round(float(std), 2),
        "Minimum":             round(float(min), 2),
        "First Quartile":      round(float(q1), 2),
        "Third Quartile":      round(float(q3), 2),
        "Maximum":             round(float(max), 2)
    }
    return stats

# Removes mutation from the mutations session variable
@api_bp.route('/remove_mutation', methods=['POST'])
def remove_mutation():
    data = request.get_json() or {}
    allele1 = data.get('allele1')
    allele2 = data.get('allele2')
    

    # Filter out target
    current = session.get('mutations', [])
    new_list = [
        m for m in current
        if not (m.get('allele1') == allele1 and m.get('allele2') == allele2)
    ]
    session['mutations'] = new_list

    return jsonify({ 'success': True, 'mutations': new_list }), 200



















@api_bp.route('/score', methods=['GET'])
def get_score():
    m1 = request.args.get('m1')
    m2 = request.args.get('m2')
    print("Received m1:", m1)
    print("Received m2:", m2)
    if not m1 or not m2:
        return jsonify({
            "success": False,
            "score":   None,
            "error":   "Please enter values for both 'Mutation 1' and 'Mutation 2'"
        }), 400

    try:
        info1 = parse_mutation(m1)
        print("First mutation:", info1)
    except ValueError as e:
        print("Failure!", e)
        return jsonify({
            "success": False,
            "score":   None,
            "error":   "Invalid entry for 'Mutation 1'. Please see 'Expected Mutation Form' for more information"
        }), 400
    
    try:
        info2 = parse_mutation(m2)
        print("Second mutation:", info2)
    except ValueError as e:
        print("Failure!", e)
        return jsonify({
            "success": False,
            "score":   None,
            "error":   "Invalid entry for 'Mutation 2'. Please see 'Expected Mutation Form' for more information"
        }), 400

    in_frame     = {"substitution", "delins", "insertion", "duplication", "deletion", "missense"}
    out_of_frame = {"frameshift", "nonsense"}

    m1_in_frame = (True  if info1["mutation_type"] in  in_frame
                   else False if info1["mutation_type"] in out_of_frame
                   else None)
    m2_in_frame = (True  if info2["mutation_type"] in  in_frame
                   else False if info2["mutation_type"] in out_of_frame
                   else None)
    m1_tmem = info1["is_transmembrane"]
    m2_tmem = info2["is_transmembrane"]

    if any(x is None for x in (m1_in_frame, m2_in_frame, m1_tmem, m2_tmem)):
        return jsonify({
            "success": False,
            "score":   None,
            "error":   "At least on mutation entry was invalid. See  'Expected Mutation Form' for more information'"
        }), 400

    # scoring logic
    if m1_in_frame and m2_in_frame:
        if m1_tmem and m2_tmem:
            score = 3
        elif m1_tmem or m2_tmem:
            score = 2
        else:
            score = 1
    elif m1_in_frame and not m2_in_frame:
        score = 5 if m1_tmem else 4
    elif not m1_in_frame and m2_in_frame:
        score = 5 if m2_tmem else 4
    else:
        score = 6

    return jsonify({"success": True, "score": score})


def parse_mutation(mutation):
    print("inside parse mutation:", mutation)
    prot = None

    # 1) "(p.…)" notation?
    m = re.search(r'\((p\.[^)]+)\)', mutation)
    if m:
        prot = m.group(1)
    # 2) bare "p.…"
    elif mutation.lower().startswith("p."):
        prot = mutation

    if prot:
        try:
            return parse_protein_mutation(prot)
        except ValueError as e:
            print("protein parse failed:", e)
            # fall back to coding‐DNA
            pass

    # strip off any trailing " (p.…)" before coding parse
    coding_only = re.sub(r'\s*\(p\.[^)]+\)', '', mutation)
    print("Trying coding on:", coding_only)
    return parse_coding_sequence_mutation(coding_only)


def parse_protein_mutation(mutation):
    print("inside parse PROTEIN mutation:", mutation)

    info = dict.fromkeys([
        'notation_type','aa_format','orig_aa','new_aa',
        'start','end','ref','alt','position',
        'mutation_type','is_transmembrane'
    ], None)

    AA_THREE_TO_ONE = {
        'Ala':'A','Arg':'R','Asn':'N','Asp':'D','Cys':'C',
        'Gln':'Q','Glu':'E','Gly':'G','His':'H','Ile':'I',
        'Leu':'L','Lys':'K','Met':'M','Phe':'F','Pro':'P',
        'Ser':'S','Thr':'T','Trp':'W','Tyr':'Y','Val':'V',
        'Ter':'*','Sec':'U','Pyl':'O'
    }

    prot_patterns = [
        # three‐letter nonsense: p.Glu753* or p.Glu753X
        ('nonsense_3', re.compile(r'^(?:p\.)?([A-Za-z]{3})(\d+)(\*|X)$', re.IGNORECASE)),
        ('del_single', re.compile(r'^(?:p\.)?([A-Za-z]{3})(\d+)del$',       re.IGNORECASE)),
        ('del_range',  re.compile(r'^(?:p\.)?([A-Za-z]{3})(\d+)_([A-Za-z]{3})(\d+)del$', re.IGNORECASE)),
        ('dup_range',  re.compile(r'^(?:p\.)?([A-Za-z]{3})(\d+)_([A-Za-z]{3})(\d+)dup$', re.IGNORECASE)),
        ('ins',        re.compile(r'^(?:p\.)?([A-Za-z]{3})(\d+)_([A-Za-z]{3})(\d+)ins([A-Za-z]{3})$', re.IGNORECASE)),
        ('sub_3',      re.compile(
                          r'^(?:p\.)?([A-Za-z]{3})(\d+)([A-Za-z]{3})(fs\*?\d*|\*|X)?$',
                          re.IGNORECASE
                      )),
        ('sub_1',      re.compile(
                          r'^(?:p\.)?([ACDEFGHIKLMNPQRSTVWY])'      # orig
                          r'(\d+)'                                   # pos
                          r'([ACDEFGHIKLMNPQRSTVWYX\*])'            # new
                          r'(fs\*?\d*)?$',                          # optional frameshift suffix
                          re.IGNORECASE
                      )),
    ]

    for kind, pat in prot_patterns:
        m = pat.match(mutation)
        if not m:
            continue

        info['notation_type'] = 'protein'
        groups = m.groups()

        if kind == 'nonsense_3':
            orig3, pos, _ = groups
            orig3 = orig3.title()
            info.update({
                'aa_format':     'three_letter',
                'orig_aa':       AA_THREE_TO_ONE[orig3],
                'new_aa':        '*',
                'start':         int(pos),
                'end':           int(pos),
                'position':      int(pos),
                'mutation_type': 'nonsense'
            })

        elif kind == 'del_single':
            orig3, pos = groups
            orig3 = orig3.title()
            info.update({
                'aa_format':     'three_letter',
                'orig_aa':       AA_THREE_TO_ONE[orig3],
                'new_aa':        None,
                'start':         int(pos),
                'end':           int(pos),
                'position':      int(pos),
                'mutation_type': 'deletion'
            })

        elif kind == 'del_range':
            _, s, _, e = groups
            info.update({
                'aa_format':     'three_letter',
                'start':         int(s),
                'end':           int(e),
                'position':      int(s),
                'mutation_type': 'deletion'
            })

        elif kind == 'dup_range':
            _, s, _, e = groups
            info.update({
                'aa_format':     'three_letter',
                'start':         int(s),
                'end':           int(e),
                'position':      int(s),
                'mutation_type': 'duplication'
            })

        elif kind == 'ins':
            _, s, _, e, ins3 = groups
            ins3 = ins3.title()
            info.update({
                'aa_format':     'three_letter',
                'new_aa':        AA_THREE_TO_ONE[ins3],
                'start':         int(s),
                'end':           int(e),
                'position':      int(s),
                'mutation_type': 'insertion'
            })

        elif kind == 'sub_3':
            orig3, pos, new3, suffix = groups
            orig3, new3 = orig3.title(), new3.title()
            one_orig = AA_THREE_TO_ONE[orig3]
            one_new  = AA_THREE_TO_ONE[new3]
            info.update({
                'aa_format':     'three_letter',
                'orig_aa':       one_orig,
                'new_aa':        one_new,
                'position':      int(pos),
            })
            if suffix and suffix.lower().startswith('fs'):
                info['mutation_type'] = 'frameshift'
            elif one_new == '*' or suffix in ('*', 'X'):
                info['mutation_type'] = 'nonsense'
            else:
                info['mutation_type'] = 'missense'

        elif kind == 'sub_1':
            orig1, pos, new1, suffix = groups
            orig1, new1 = orig1.upper(), new1.upper()
            info.update({
                'aa_format':     'one_letter',
                'orig_aa':       orig1,
                'new_aa':        new1,
                'position':      int(pos),
            })
            if suffix and suffix.lower().startswith('fs'):
                info['mutation_type'] = 'frameshift'
            elif new1 in ('*', 'X'):
                info['mutation_type'] = 'nonsense'
            else:
                info['mutation_type'] = 'missense'

        # set TM status if we have a position
        if info['position'] is not None:
            info['is_transmembrane'] = is_in_transmembrane(info['position'])

        return info

    # if nothing matched
    raise ValueError(f"Unrecognized protein mutation format: {mutation!r}")


def parse_coding_sequence_mutation(mutation):
    print("inside parse CODING mutation:", mutation)

    info = dict.fromkeys([
        'notation_type','aa_format','orig_aa','new_aa',
        'start','end','ref','alt','position',
        'mutation_type','is_transmembrane'
    ], None)

    coding_patterns = [
        ('substitution', re.compile(r'^c\.(\d+)([ACGTNatgcy]+)>([ACGTNatgcy]+)$', re.IGNORECASE)),
        ('delins',       re.compile(r'^c\.(\d+)_(\d+)delins([A-Za-z0-9]+)$', re.IGNORECASE)),
        ('insertion',    re.compile(r'^c\.(\d+)_(\d+)ins([A-Za-z0-9]+)$', re.IGNORECASE)),
        ('duplication',  re.compile(r'^c\.(\d+)(?:_(\d+))?dup([A-Za-z0-9]*)$', re.IGNORECASE)),
        ('deletion',     re.compile(r'^c\.(\d+)(?:_(\d+))?del([A-Za-z0-9]+)$', re.IGNORECASE)),
    ]

    for name, pat in coding_patterns:
        m = pat.match(mutation)
        if not m:
            continue

        info['notation_type'] = 'coding'
        groups = m.groups()

        if name == 'substitution':
            start, ref, alt = groups
            info.update({
                'mutation_type':'substitution',
                'start':        int(start),
                'position':     int(start),
                'ref':          ref,
                'alt':          alt
            })
        elif name == 'delins':
            s, e, alt = groups
            info.update({
                'mutation_type':'delins',
                'start':        int(s),
                'end':          int(e),
                'alt':          alt,
                'position':     int(s)
            })
        elif name == 'insertion':
            s, e, alt = groups
            info.update({
                'mutation_type':'insertion',
                'start':        int(s),
                'end':          int(e),
                'alt':          alt,
                'position':     int(s)
            })
        elif name == 'duplication':
            s, e, dup = groups
            info.update({
                'mutation_type':'duplication',
                'start':        int(s),
                'end':          int(e) if e else None,
                'alt':          dup,
                'position':     int(s)
            })
        elif name == 'deletion':
            s, e, ref = groups
            info.update({
                'mutation_type':'deletion',
                'start':        int(s),
                'end':          int(e) if e else None,
                'ref':          ref,
                'position':     int(s)
            })

        if info['position'] is not None:
            aa_pos = (info['position'] + 2) // 3
            info['is_transmembrane'] = is_in_transmembrane(aa_pos)

        return info

    raise ValueError(f"Unrecognized coding mutation format: {mutation!r}")


def is_in_transmembrane(pos):
    transmembrane_domains = [
        (314, 334), (340, 360), (402, 422), (427, 447),
        (465, 485), (496, 516), (529, 549), (563, 583),
        (589, 609), (632, 652), (870, 890)
    ]
    return any(s <= pos <= e for s, e in transmembrane_domains)
