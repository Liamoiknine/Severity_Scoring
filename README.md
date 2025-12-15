# Wolfram Syndrome Severity Scoring Tool

A web application for visualizing and analyzing Wolfram Syndrome patient data from the Urano Lab at Washington University in St. Louis. This tool helps researchers and clinicians explore patterns in disease manifestation and calculate predicted severity scores based on genetic mutations.

## What It Does

The application provides two main features:

**Severity Score Calculator** - Enter two genetic mutations (in standard protein or coding sequence notation) and get back a predicted severity score on a 1-6 scale. The scoring algorithm considers whether mutations are in-frame or out-of-frame, and whether they fall within transmembrane domains of the WFS1 protein. Higher scores indicate more severe predicted disease progression.

**Data Visualization Dashboard** - Explore the patient registry through interactive visualizations. You can:
- Compare age of onset between different manifestations (Diabetes Mellitus, Optic Atrophy, Diabetes Insipidus, Hearing Loss) using scatter plots
- View distribution patterns with box plots and violin plots
- Filter patients by sex or severity score
- Track specific mutation combinations and see how they compare to the overall dataset
- View detailed statistics and patient information panels

All patient data is de-identified and represents real cases from the lab's registry. The severity scoring system is based on research developed at the Urano Lab.

## Technical Details

The app is built with a React frontend and Flask backend. Patient data is stored in Firebase/Firestore and preloaded into memory on server startup for fast querying. The frontend uses D3.js for custom visualizations and React Router for navigation. The backend API handles mutation parsing (supporting both protein and coding sequence notation), statistical calculations, and data filtering.

**Frontend:** React, D3.js, React Router  
**Backend:** Flask (Python), Firebase Admin SDK, NumPy  
