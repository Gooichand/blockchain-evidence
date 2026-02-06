/**
 * Comprehensive Registration Form System
 * Role-specific registration forms
 */

const COMMON_FIELDS = {
    firstName: { type: 'text', label: 'First Name', required: true, icon: 'user' },
    lastName: { type: 'text', label: 'Last Name', required: true, icon: 'user' },
    email: { type: 'email', label: 'Email Address', required: true, icon: 'mail', verify: true },
    phone: { type: 'tel', label: 'Phone Number', required: true, icon: 'phone', placeholder: '+91 98765 43210' },
    username: { type: 'text', label: 'Username', required: true, icon: 'at-sign', unique: true },
    password: { type: 'password', label: 'Password', required: true, icon: 'lock', strength: true },
    confirmPassword: { type: 'password', label: 'Confirm Password', required: true, icon: 'lock' },
    walletAddress: { type: 'text', label: 'MetaMask Wallet Address', required: true, icon: 'wallet', readonly: true },
    twoFactorAuth: { type: 'select', label: '2FA Method', required: true, icon: 'shield', options: ['SMS', 'Email', 'Authenticator App'] },
    termsAccepted: { type: 'checkbox', label: 'I accept the Terms & Conditions', required: true },
    privacyAccepted: { type: 'checkbox', label: 'I accept the Privacy Policy', required: true }
};

const PUBLIC_VIEWER_FIELDS = {
    firstName: { type: 'text', label: 'First Name', required: true, icon: 'user' },
    lastName: { type: 'text', label: 'Last Name', required: true, icon: 'user' },
    email: { type: 'email', label: 'Email Address', required: true, icon: 'mail', verify: true },
    phone: { type: 'tel', label: 'Phone Number', required: true, icon: 'phone', placeholder: '+91 98765 43210' },
    username: { type: 'text', label: 'Username', required: true, icon: 'at-sign', unique: true },
    password: { type: 'password', label: 'Password', required: true, icon: 'lock', strength: true },
    confirmPassword: { type: 'password', label: 'Confirm Password', required: true, icon: 'lock' },
    termsAccepted: { type: 'checkbox', label: 'I accept the Terms & Conditions', required: true },
    privacyAccepted: { type: 'checkbox', label: 'I accept the Privacy Policy', required: true }
};

const ROLE_SPECIFIC_FIELDS = {
    1: {
        countryOfResidence: { type: 'select', label: 'Country of Residence', icon: 'globe', required: false },
        organizationName: { type: 'text', label: 'Organization Name', icon: 'building', required: false },
        purposeOfAccess: { 
            type: 'select', 
            label: 'Purpose of Access', 
            icon: 'target', 
            required: true,
            options: ['Legal Research', 'Educational', 'Public Records Review', 'Other']
        }
    },

    2: {
        badgeNumber: { type: 'text', label: 'Badge/ID Number', icon: 'badge', required: true },
        departmentAgency: { type: 'autocomplete', label: 'Department/Agency Name', icon: 'building-2', required: true, api: 'departments' },
        positionTitle: { type: 'text', label: 'Position/Title', icon: 'briefcase', required: true },
        agencyContact: { type: 'email', label: 'Agency Contact (Superior Email)', icon: 'mail', required: true },
        jurisdiction: { type: 'autocomplete', label: 'Jurisdiction', icon: 'map-pin', required: true, api: 'states' },
        specialization: { 
            type: 'multiselect', 
            label: 'Investigative Specialization', 
            icon: 'target',
            options: ['Homicide', 'Narcotics', 'Cyber Crime', 'Sexual Assault', 'Financial Crimes', 'Other']
        },
        yearsExperience: { type: 'number', label: 'Years of Experience', icon: 'calendar', required: true },
        professionalLicense: { type: 'text', label: 'Professional License/Certification', icon: 'award' },
        backgroundCheckConsent: { type: 'checkbox', label: 'Background Check Consent', required: true },
        evidenceTrainingCert: { type: 'file', label: 'Evidence Handling Training Certificate', icon: 'file-text' }
    },

    3: {
        professionalLicenseNumber: { type: 'text', label: 'Professional License Number', icon: 'award', required: true },
        certifications: { 
            type: 'multiselect', 
            label: 'Certifications', 
            icon: 'certificate',
            options: ['ACFEI', 'IACIS', 'ACE', 'CCFP', 'ISFG', 'Other']
        },
        certificationExpiry: { type: 'date', label: 'Certification Expiry Date', icon: 'calendar', required: true },
        laboratoryName: { type: 'autocomplete', label: 'Laboratory Name/Organization', icon: 'building', required: true, api: 'laboratories' },
        labAccreditation: { 
            type: 'select', 
            label: 'Lab Accreditation', 
            icon: 'check-circle',
            options: ['ASCLD/LAB', 'ISO 17025', 'NABL', 'Other', 'None']
        },
        specializations: { 
            type: 'multiselect', 
            label: 'Specializations', 
            icon: 'microscope',
            options: ['Digital Forensics', 'DNA Analysis', 'Toxicology', 'Ballistics', 'Document Analysis', 'Cyber Forensics', 'Mobile Device Analysis', 'Other']
        },
        yearsExperience: { type: 'number', label: 'Years of Experience', icon: 'calendar', required: true },
        educationLevel: { 
            type: 'select', 
            label: 'Education Level', 
            icon: 'graduation-cap',
            options: ['BS', 'MS', 'PhD', 'Other']
        },
        departmentContact: { type: 'email', label: 'Department/Lab Contact', icon: 'mail', required: true },
        equipmentAccess: { 
            type: 'multiselect', 
            label: 'Equipment/Software Access', 
            icon: 'cpu',
            options: ['EnCase', 'FTK', 'Cellebrite', 'X-Ways', 'Autopsy', 'Other']
        }
    },

    4: {
        barLicenseNumber: { type: 'text', label: 'Bar License Number', icon: 'scale', required: true },
        barRegistrationState: { type: 'autocomplete', label: 'State/Country of Bar Registration', icon: 'map-pin', required: true, api: 'states' },
        barAdmissionDate: { type: 'date', label: 'Bar Admission Date', icon: 'calendar', required: true },
        lawFirmOrganization: { type: 'autocomplete', label: 'Law Firm/Organization Name', icon: 'building', required: true, api: 'lawFirms' },
        practiceArea: { 
            type: 'multiselect', 
            label: 'Practice Area', 
            icon: 'briefcase',
            options: ['Criminal Law', 'Civil Litigation', 'Evidence Law', 'Corporate Law', 'Administrative Law', 'Intellectual Property', 'Other']
        },
        yearsLegalPractice: { type: 'number', label: 'Years of Legal Practice', icon: 'calendar', required: true },
        educationLevel: { 
            type: 'select', 
            label: 'Education Level', 
            icon: 'graduation-cap',
            options: ['LLB', 'LLM', 'PhD', 'Other']
        },
        lawSchoolName: { type: 'autocomplete', label: 'Law School Name', icon: 'school', required: true, api: 'lawSchools' },
        barAssociations: { 
            type: 'multiselect', 
            label: 'Professional Bar Associations', 
            icon: 'users',
            options: ['Bar Council of India', 'State Bar Council', 'Local Bar Association', 'Other']
        },
        evidenceHandlingSpecialization: { type: 'select', label: 'Specialization in Evidence Handling', icon: 'file-check', options: ['Yes', 'No'] },
        courtAccessLevel: { 
            type: 'multiselect', 
            label: 'Court Access Level', 
            icon: 'building',
            options: ['District Court', 'High Court', 'Supreme Court']
        },
        officeAddress: { type: 'textarea', label: 'Office Address', icon: 'map-pin', required: true },
        firmContact: { type: 'email', label: 'Direct Contact (Supervisor/Firm)', icon: 'mail', required: true }
    },

    5: {
        courtName: { type: 'autocomplete', label: 'Court Name', icon: 'building', required: true, api: 'courts' },
        courtType: { 
            type: 'select', 
            label: 'Court Type', 
            icon: 'gavel',
            options: ['District Court', 'High Court', 'Supreme Court', 'Tribunal', 'Specialty Court']
        },
        judgeOfficialTitle: { type: 'text', label: 'Judge Name/Official Title', icon: 'user-check', required: true },
        judicialDistrict: { type: 'text', label: 'Judicial District', icon: 'map', required: true },
        officeLocation: { type: 'textarea', label: 'Office Location', icon: 'map-pin', required: true },
        yearsJudicialService: { type: 'number', label: 'Years in Judicial Service', icon: 'calendar', required: true },
        officialBadgeNumber: { type: 'text', label: 'Official Badge/Seal Number', icon: 'badge', required: true },
        judicialSpecialization: { type: 'text', label: 'Judicial Specialization', icon: 'target' }
    },

    6: {
        evidenceFacilityName: { type: 'autocomplete', label: 'Evidence Facility Name', icon: 'warehouse', required: true, api: 'evidenceFacilities' },
        facilityLocation: { type: 'textarea', label: 'Facility Location (Address & Coordinates)', icon: 'map-pin', required: true },
        propertyOfficerName: { type: 'text', label: 'Property Officer/Manager Name', icon: 'user-check', required: true },
        facilityType: { 
            type: 'select', 
            label: 'Facility Type', 
            icon: 'building',
            options: ['Police Department Property Room', 'Court Evidence Storage', 'Forensic Lab', 'Federal Facility', 'Third-party Storage']
        },
        yearsManagingEvidence: { type: 'number', label: 'Years Managing Evidence', icon: 'calendar', required: true },
        evidenceManagementTraining: { type: 'file', label: 'Evidence Management Training Certificate', icon: 'file-text' },
        facilityAccreditation: { 
            type: 'multiselect', 
            label: 'Facility Accreditation', 
            icon: 'check-circle',
            options: ['NABL', 'ISO 17025', 'Other', 'None']
        },
        inventoryManagementExperience: { type: 'number', label: 'Inventory Management Experience (Years)', icon: 'package' },
        chainOfCustodyTraining: { type: 'select', label: 'Chain of Custody Training', icon: 'link', options: ['Yes', 'No'] },
        securityClearance: { type: 'select', label: 'Physical Security Clearance', icon: 'shield', options: ['Yes', 'No'] },
        supervisorContact: { type: 'email', label: 'Supervisor/Facility Director Contact', icon: 'mail', required: true },
        buildingSecurityLevel: { 
            type: 'select', 
            label: 'Building Security Level', 
            icon: 'lock',
            options: ['Level 1 (Secure)', 'Level 2 (High Security)', 'Level 3 (Vault)']
        },
        climateControlSystems: { type: 'select', label: 'Climate Control Systems', icon: 'thermometer', options: ['Yes', 'No'] },
        assetTrackingSystem: { type: 'text', label: 'Asset Tracking System Used', icon: 'scan' }
    },

    7: {
        auditorLicenseNumber: { type: 'text', label: 'Auditor License/Certification Number', icon: 'award', required: true },
        auditingAuthority: { 
            type: 'select', 
            label: 'Auditing Authority', 
            icon: 'building',
            options: ['CAG (Comptroller and Auditor General)', 'State Auditor', 'CBI', 'ED (Enforcement Directorate)', 'ISO Auditor', 'Other Government Body']
        },
        certificationType: { 
            type: 'multiselect', 
            label: 'Certification Type', 
            icon: 'certificate',
            options: ['CIA', 'CISA', 'CA', 'CFE', 'CGAP', 'ISO Auditor', 'Other']
        },
        certificationExpiry: { type: 'date', label: 'Certification Expiry Date', icon: 'calendar', required: true },
        yearsAuditingExperience: { type: 'number', label: 'Years of Auditing Experience', icon: 'calendar', required: true },
        auditSpecialization: { 
            type: 'multiselect', 
            label: 'Audit Specialization', 
            icon: 'target',
            options: ['Evidence Handling Compliance', 'Chain of Custody Verification', 'Digital Security Audits', 'Regulatory Compliance', 'Financial Audits', 'System Security Audits']
        },
        organizationAffiliation: { type: 'autocomplete', label: 'Government/Organization Affiliation', icon: 'building', required: true, api: 'governmentOrgs' },
        auditAuthorityContact: { type: 'email', label: 'Audit Authority Contact', icon: 'mail', required: true },
        clearanceLevel: { 
            type: 'select', 
            label: 'Clearance Level', 
            icon: 'shield',
            options: ['None', 'Confidential', 'Secret', 'Top Secret']
        },
        scopeOfAuthority: { 
            type: 'select', 
            label: 'Scope of Authority', 
            icon: 'globe',
            options: ['Local', 'State', 'Regional', 'National']
        }
    }
};

const VERIFICATION_REQUIREMENTS = {
    1: ['email'],
    2: ['email', 'badge_verification', 'agency_approval', 'background_check'],
    3: ['email', 'license_verification', 'certification_verification', 'lab_verification', 'background_check'],
    4: ['email', 'bar_license_verification', 'law_firm_confirmation', 'background_check'],
    5: ['email', 'court_official_verification', 'judicial_records_confirmation', 'appointing_authority_confirmation'],
    6: ['email', 'facility_verification', 'property_officer_verification', 'background_check', 'security_clearance'],
    7: ['email', 'auditor_license_verification', 'certification_verification', 'authority_verification', 'security_clearance', 'government_background_check']
};

function generateRegistrationForm(roleId) {
    const roleFields = ROLE_SPECIFIC_FIELDS[roleId] || {};
    const baseFields = roleId === 1 ? PUBLIC_VIEWER_FIELDS : COMMON_FIELDS;
    const allFields = { ...baseFields, ...roleFields };
    
    let formHTML = '<form id="comprehensiveRegistrationForm" class="comprehensive-form">';
    
    formHTML += '<div class="form-section"><h3><i data-lucide="user"></i> Personal Information</h3>';
    formHTML += generateFieldsHTML(baseFields);
    formHTML += '</div>';
    
    if (Object.keys(roleFields).length > 0) {
        formHTML += '<div class="form-section"><h3><i data-lucide="briefcase"></i> Professional Information</h3>';
        formHTML += generateFieldsHTML(roleFields);
        formHTML += '</div>';
    }
    
    const verifications = VERIFICATION_REQUIREMENTS[roleId] || [];
    if (verifications.length > 0) {
        formHTML += '<div class="form-section verification-section">';
        formHTML += '<h3><i data-lucide="shield-check"></i> Verification Requirements</h3>';
        formHTML += '<div class="verification-list">';
        verifications.forEach(verification => {
            formHTML += `<div class="verification-item">
                <i data-lucide="clock"></i>
                <span>${formatVerificationName(verification)}</span>
                <span class="verification-status pending">Pending</span>
            </div>`;
        });
        formHTML += '</div></div>';
    }
    
    formHTML += `<div class="form-actions">
        <button type="submit" class="btn btn-success btn-large">
            <i data-lucide="user-plus"></i>
            Complete Registration
        </button>
        <p class="form-note">
            <i data-lucide="info"></i>
            Your account will be activated after verification is complete.
        </p>
    </div>`;
    
    formHTML += '</form>';
    
    return formHTML;
}

function generateFieldsHTML(fields) {
    let html = '';
    
    Object.entries(fields).forEach(([fieldName, field]) => {
        html += `<div class="form-group ${field.required ? 'required' : ''}">`;
        
        html += `<label for="${fieldName}">
            <i data-lucide="${field.icon || 'circle'}"></i>
            ${field.label}
            ${field.required ? '<span class="required-star">*</span>' : ''}
        </label>`;
        
        switch (field.type) {
            case 'select':
                html += `<select id="${fieldName}" class="form-control" ${field.required ? 'required' : ''}>
                    <option value="">Select ${field.label}</option>
                    ${field.options ? field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('') : ''}
                </select>`;
                break;
                
            case 'multiselect':
                html += `<div class="multiselect-container">`;
                if (field.options) {
                    field.options.forEach(option => {
                        html += `<label class="checkbox-label">
                            <input type="checkbox" name="${fieldName}" value="${option}">
                            <span>${option}</span>
                        </label>`;
                    });
                }
                html += `</div>`;
                break;
                
            case 'textarea':
                html += `<textarea id="${fieldName}" class="form-control" ${field.required ? 'required' : ''} 
                    placeholder="${field.placeholder || ''}" rows="3"></textarea>`;
                break;
                
            case 'autocomplete':
                html += `<input type="text" id="${fieldName}" class="form-control autocomplete-field" 
                    ${field.required ? 'required' : ''} 
                    placeholder="Type to search ${field.label.toLowerCase()}..."
                    data-api="${field.api || ''}">`;
                break;
                
            case 'checkbox':
                html += `<label class="checkbox-label">
                    <input type="checkbox" id="${fieldName}" ${field.required ? 'required' : ''}>
                    <span>${field.label}</span>
                </label>`;
                break;
                
            case 'file':
                html += `<input type="file" id="${fieldName}" class="form-control" 
                    accept=".pdf,.jpg,.jpeg,.png" ${field.required ? 'required' : ''}>`;
                break;
                
            case 'password':
                html += `<input type="password" id="${fieldName}" class="form-control" 
                    ${field.required ? 'required' : ''} placeholder="${field.placeholder || ''}">`;
                if (field.strength) {
                    html += `<div class="password-strength">
                        <div class="strength-meter">
                            <div class="strength-fill"></div>
                        </div>
                        <span class="strength-text">Password strength</span>
                    </div>`;
                }
                break;
                
            default:
                html += `<input type="${field.type}" id="${fieldName}" class="form-control" 
                    ${field.required ? 'required' : ''} 
                    ${field.readonly ? 'readonly' : ''}
                    placeholder="${field.placeholder || ''}"
                    ${field.unique ? 'data-unique="true"' : ''}>`;
        }
        
        if (field.verify) {
            html += `<div class="verification-indicator">
                <i data-lucide="mail"></i>
                <span>Verification required</span>
            </div>`;
        }
        
        html += '</div>';
    });
    
    return html;
}

function formatVerificationName(verification) {
    const names = {
        'email': 'Email Verification',
        'badge_verification': 'Badge/ID Verification',
        'agency_approval': 'Agency Approval',
        'background_check': 'Background Check',
        'license_verification': 'License Verification',
        'certification_verification': 'Certification Verification',
        'lab_verification': 'Laboratory Verification',
        'bar_license_verification': 'Bar License Verification',
        'law_firm_confirmation': 'Law Firm Confirmation',
        'court_official_verification': 'Court Official Verification',
        'judicial_records_confirmation': 'Judicial Records Confirmation',
        'appointing_authority_confirmation': 'Appointing Authority Confirmation',
        'facility_verification': 'Facility Verification',
        'property_officer_verification': 'Property Officer Verification',
        'security_clearance': 'Security Clearance Verification',
        'auditor_license_verification': 'Auditor License Verification',
        'authority_verification': 'Authority Verification',
        'government_background_check': 'Government Background Check'
    };
    return names[verification] || verification.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

if (typeof window !== 'undefined') {
    window.ComprehensiveRegistration = {
        generateRegistrationForm,
        COMMON_FIELDS,
        ROLE_SPECIFIC_FIELDS,
        VERIFICATION_REQUIREMENTS
    };
}