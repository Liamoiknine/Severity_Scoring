/**
 * Centralized Color Palette for JavaScript/JSX Usage
 * Import this file in components that need to use colors programmatically.
 * 
 * Example usage:
 * import colors from '../config/colors';
 * <div style={{ color: colors.primary }}>...</div>
 */

const colors = {
  // Primary Colors
  primary: '#1a3d82',
  primaryDark: '#153366',
  primaryDarker: '#0f2a5c',
  primaryLight: '#4a6ba8',
  primaryLighter: '#e6ecf5',
  
  // Accent Colors
  accentPurple: '#6b2fb3',
  accentBlue: '#2196f3',
  accentOrange: '#ff7300',
  
  // Text Colors
  textPrimary: '#333',
  textSecondary: '#666',
  textTertiary: '#7a7a7a',
  textMuted: '#6c757d',
  textDark: '#2c3e50',
  textLight: '#4a5568',
  textLighter: '#495057',
  textLightest: '#a0aec0',
  textBlack: '#000',
  textWhite: '#fff',
  
  // Background Colors
  bgPrimary: '#f8f9fa',
  bgSecondary: '#fff',
  bgTertiary: '#f0f0f0',
  bgGradientStart: '#ebf8ff',
  bgGradientEnd: '#e0e7ff',
  bgHover: '#e9ecef',
  bgTableHeader: '#f3f4f6',
  bgTableRow: '#f9fafb',
  bgTableHover: '#eef2ff',
  bgLoader: '#f3f3f3',
  bgProgress: '#eee',
  
  // Border Colors
  borderPrimary: '#e0e0e0',
  borderSecondary: '#ced4da',
  borderTertiary: '#ccc',
  borderLight: '#ddd',
  borderLighter: '#bbb',
  borderDark: '#666666',
  borderWhite: '#fff',
  borderNav: '#eee',
  
  // Status Colors
  statusSuccess: '#48bb78',
  statusWarning: '#f6ad55',
  statusError: '#f56565',
  statusErrorRed: '#ff0000',
  statusInfo: '#007bff',
  
  // Shadow Colors
  shadowSm: 'rgba(0, 0, 0, 0.05)',
  shadowMd: 'rgba(0, 0, 0, 0.1)',
  shadowLg: 'rgba(0, 0, 0, 0.2)',
  shadowPrimary: 'rgba(107, 47, 179, 0.1)',
  shadowPrimaryLight: 'rgba(26, 61, 130, 0.2)',
  
  // Chart/Plot Colors
  chartPrimary: '#6b2fb3',
  chartSelected: '#ff0000',
  chartOutlier: '#ff7300',
  chartDefault: '#8884d8',
};

export default colors;

