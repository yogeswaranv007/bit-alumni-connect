/**
 * Institutional mapping and validation for BIT University Register Numbers and Roll Numbers.
 * Extract alphabetic characters to ensure department consistency (e.g. 7376232IT286 -> IT).
 */

const DEPT_TO_ALLOWED_CODES = {
  IT: ['IT', 'INF'],
  CSE: ['CS', 'CSE'],
  AIDS: ['AD', 'AIDS'],
  AIML: ['AL', 'AIML'],
  ECE: ['EC', 'ECE'],
  EEE: ['EE', 'EEE'],
  MECH: ['ME', 'MECH'],
  CIVIL: ['CE', 'CIVIL'],
  AGRI: ['AG', 'AGRI'],
  BT: ['BT', 'BIO'],
  BME: ['BM', 'BME'],
  FT: ['FT', 'FOOD'],
  TT: ['TT', 'TXT'],
  FD: ['FD'],
  CT: ['CT'],
  CSBS: ['CB', 'CSBS'],
  MTR: ['MC', 'MTR'],
  AERO: ['AE', 'AERO'],
  AUTO: ['AU', 'AUTO'],
  MBA: ['MB', 'MBA'],
  MCA: ['MCA'],
};

const CODE_TO_DEPT_NAME = {
  IT: 'Information Technology',
  INF: 'Information Technology',
  CS: 'Computer Science and Engineering',
  CSE: 'Computer Science and Engineering',
  AD: 'Artificial Intelligence and Data Science',
  AIDS: 'Artificial Intelligence and Data Science',
  AL: 'Artificial Intelligence and Machine Learning',
  AIML: 'Artificial Intelligence and Machine Learning',
  EC: 'Electronics and Communication Engineering',
  ECE: 'Electronics and Communication Engineering',
  EE: 'Electrical and Electronics Engineering',
  EEE: 'Electrical and Electronics Engineering',
  ME: 'Mechanical Engineering',
  MECH: 'Mechanical Engineering',
  CE: 'Civil Engineering',
  CIVIL: 'Civil Engineering',
  AG: 'Agricultural Engineering',
  AGRI: 'Agricultural Engineering',
  BT: 'Biotechnology',
  BIO: 'Biotechnology',
  BM: 'Biomedical Engineering',
  BME: 'Biomedical Engineering',
  FT: 'Food Technology',
  FOOD: 'Food Technology',
  TT: 'Textile Technology',
  TXT: 'Textile Technology',
  FD: 'Fashion Technology',
  CT: 'Computer Technology',
  CB: 'Computer Science and Business Systems',
  CSBS: 'Computer Science and Business Systems',
  MC: 'Mechatronics Engineering',
  MTR: 'Mechatronics Engineering',
  AE: 'Aeronautical Engineering',
  AERO: 'Aeronautical Engineering',
  AU: 'Automobile Engineering',
  AUTO: 'Automobile Engineering',
  MB: 'Master of Business Administration',
  MBA: 'Master of Business Administration',
  MCA: 'Master of Computer Applications',
};

/**
 * Extracts uppercase letters from input string (e.g. "7376232IT286" -> "IT").
 */
export function extractDeptLetters(value) {
  if (!value || typeof value !== 'string') return '';
  const match = value.match(/[a-zA-Z]+/);
  return match ? match[0].toUpperCase() : '';
}

/**
 * Validates whether the given register number or roll number matches the selected department code.
 * @param {string} selectedDeptCode e.g. "AIDS" or "IT"
 * @param {string} registerNumber e.g. "7376232IT286"
 * @param {string} rollNumber e.g. "20IT101"
 * @returns {{ valid: boolean, regMismatch: string | null, rollMismatch: string | null }}
 */
export function validateDeptCodeMatch(selectedDeptCode, registerNumber, rollNumber) {
  if (!selectedDeptCode) {
    return { valid: true, regMismatch: null, rollMismatch: null };
  }

  const deptCode = String(selectedDeptCode).trim().toUpperCase();
  const allowed = DEPT_TO_ALLOWED_CODES[deptCode] || [deptCode];

  let regMismatch = null;
  let rollMismatch = null;

  if (registerNumber && registerNumber.trim()) {
    const letters = extractDeptLetters(registerNumber);
    if (letters && !allowed.includes(letters)) {
      const detectedDeptName = CODE_TO_DEPT_NAME[letters] || letters;
      regMismatch = `Register number contains '${letters}' (${detectedDeptName}), which does not match selected department (${deptCode}).`;
    }
  }

  if (rollNumber && rollNumber.trim()) {
    const letters = extractDeptLetters(rollNumber);
    if (letters && !allowed.includes(letters)) {
      const detectedDeptName = CODE_TO_DEPT_NAME[letters] || letters;
      rollMismatch = `Roll number contains '${letters}' (${detectedDeptName}), which does not match selected department (${deptCode}).`;
    }
  }

  return {
    valid: !regMismatch && !rollMismatch,
    regMismatch,
    rollMismatch,
  };
}
