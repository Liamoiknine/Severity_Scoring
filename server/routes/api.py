# routes/api.py
from flask import jsonify, request, session
from . import api_bp
from firebase_client import get_patients, get_feature, get_feature_grouped, check_alleles, get_allele_data, get_data_given_alleles
import numpy as np

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
    allele_dict = get_allele_data()
    return (jsonify(allele_dict))

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
        "Mean":                round(float(mean), 2),
        "Count":               count,
        "Standard Deviation":  round(float(std), 2),
        "Median":              round(float(median), 2),
        "First Quartile":      round(float(q1), 2),
        "Third Quartile":      round(float(q3), 2),
        "Minimum":             round(float(min), 2),
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
