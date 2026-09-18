package com.bitconnect.backend.modules.alumni.util;

import com.bitconnect.backend.common.exception.BadRequestException;
import com.bitconnect.backend.modules.department.entity.Department;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Utility for extracting and validating academic department abbreviations
 * embedded in BIT university register numbers and roll numbers (e.g. 7376232IT286 -> IT).
 */
public class DepartmentCodeValidator {

    private static final Pattern ALPHA_PATTERN = Pattern.compile("[A-Za-z]+");

    private static final Map<String, Set<String>> DEPT_TO_ALLOWED_CODES = new HashMap<>();
    private static final Map<String, String> CODE_TO_DEPT_NAME = new HashMap<>();

    static {
        registerDept("IT", "Information Technology", "IT", "INF");
        registerDept("CSE", "Computer Science and Engineering", "CS", "CSE");
        registerDept("AIDS", "Artificial Intelligence and Data Science", "AD", "AIDS");
        registerDept("AIML", "Artificial Intelligence and Machine Learning", "AL", "AIML");
        registerDept("ECE", "Electronics and Communication Engineering", "EC", "ECE");
        registerDept("EEE", "Electrical and Electronics Engineering", "EE", "EEE");
        registerDept("MECH", "Mechanical Engineering", "ME", "MECH");
        registerDept("CIVIL", "Civil Engineering", "CE", "CIVIL");
        registerDept("AGRI", "Agricultural Engineering", "AG", "AGRI");
        registerDept("BT", "Biotechnology", "BT", "BIO");
        registerDept("BME", "Biomedical Engineering", "BM", "BME");
        registerDept("FT", "Food Technology", "FT", "FOOD");
        registerDept("TT", "Textile Technology", "TT", "TXT");
        registerDept("FD", "Fashion Technology", "FD");
        registerDept("CT", "Computer Technology", "CT");
        registerDept("CSBS", "Computer Science and Business Systems", "CB", "CSBS");
        registerDept("MTR", "Mechatronics Engineering", "MC", "MTR");
        registerDept("AERO", "Aeronautical Engineering", "AE", "AERO");
        registerDept("AUTO", "Automobile Engineering", "AU", "AUTO");
        registerDept("MBA", "Master of Business Administration", "MB", "MBA");
        registerDept("MCA", "Master of Computer Applications", "MCA");
    }

    private static void registerDept(String deptCode, String deptName, String... abbreviations) {
        Set<String> set = new HashSet<>();
        set.add(deptCode.toUpperCase());
        for (String abbr : abbreviations) {
            set.add(abbr.toUpperCase());
            CODE_TO_DEPT_NAME.put(abbr.toUpperCase(), deptName);
        }
        CODE_TO_DEPT_NAME.put(deptCode.toUpperCase(), deptName);
        DEPT_TO_ALLOWED_CODES.put(deptCode.toUpperCase(), set);
    }

    public static String extractDeptCode(String input) {
        if (input == null) return null;
        Matcher matcher = ALPHA_PATTERN.matcher(input);
        if (matcher.find()) {
            return matcher.group().toUpperCase();
        }
        return null;
    }

    /**
     * Validates that the department embedded inside registerNumber and rollNumber
     * matches the selected institutional department.
     *
     * @param department     the selected Department entity
     * @param registerNumber the university register number (e.g. 7376232IT286)
     * @param rollNumber     the college roll number (e.g. 23IT286)
     * @throws BadRequestException if the department code inside reg/roll number does not match the department
     */
    public static void validateDepartmentMatch(Department department, String registerNumber, String rollNumber) {
        if (department == null) return;
        String deptCode = department.getCode() != null ? department.getCode().trim().toUpperCase() : "";
        Set<String> allowedCodes = DEPT_TO_ALLOWED_CODES.getOrDefault(deptCode, Set.of(deptCode));

        // 1. Validate Register Number
        if (registerNumber != null && !registerNumber.trim().isEmpty()) {
            String regDept = extractDeptCode(registerNumber);
            if (regDept != null && !regDept.isEmpty()) {
                if (!allowedCodes.contains(regDept)) {
                    String detectedDept = CODE_TO_DEPT_NAME.getOrDefault(regDept, regDept);
                    throw new BadRequestException(
                            String.format("Register number '%s' contains department code '%s' (%s), which does not match the selected department '%s' (%s). Please select the correct department or check your register number.",
                                    registerNumber, regDept, detectedDept, department.getCode(), department.getName())
                    );
                }
            }
        }

        // 2. Validate Roll Number
        if (rollNumber != null && !rollNumber.trim().isEmpty()) {
            String rollDept = extractDeptCode(rollNumber);
            if (rollDept != null && !rollDept.isEmpty()) {
                if (!allowedCodes.contains(rollDept)) {
                    String detectedDept = CODE_TO_DEPT_NAME.getOrDefault(rollDept, rollDept);
                    throw new BadRequestException(
                            String.format("Roll number '%s' contains department code '%s' (%s), which does not match the selected department '%s' (%s). Please select the correct department or check your roll number.",
                                    rollNumber, rollDept, detectedDept, department.getCode(), department.getName())
                    );
                }
            }
        }
    }
}
