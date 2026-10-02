/**
 * Admission Verification Report Email Template
 * Princeton Professional Exam Portal
 * Details grounded in https://princetonprofessional.com
 */

export const generateAdmissionReport = ({
  admissionId,
  fullName,
  email,
  phone,
  courseName,
  pincode,
  state,
  city,
  addressLine,
  ipAddress,
  videoUrl,
  frontUrl,
  backUrl,
  panUrl,
  signatureUrl
}) => {
  const locationStr = [city, state].filter(Boolean).join(', ');
  const formattedPhone = phone
    ? (phone.startsWith('+91') ? phone : `+91 ${phone.replace(/\D/g, '')}`)
    : 'N/A';

  return `
----------------------------------------
ADMISSION VERIFICATION REPORT
----------------------------------------

APPLICATION & CANDIDATE DETAILS:
--------------------------------
• Application Reference ID: ${admissionId || 'N/A'}
• Application Status: Pending Admin Approval
• Full Name: ${fullName}
• Email ID: ${email}
• Phone: ${formattedPhone}
• Course Name: ${courseName || 'N/A'}
• PIN Code: ${pincode || 'N/A'}
• Location: ${locationStr || 'N/A'}
• Residential Address: ${addressLine || 'N/A'}
• IP Address: ${ipAddress || 'Not Detected'}

VERIFICATION STATUS:
----------------------------------------
• Declaration: CHECKED & ACCEPTED ✓
• Signature: CAPTURED & VERIFIED ✓
• Documentation: ALL ASSETS UPLOADED ✓

LEGAL ACKNOWLEDGEMENT & ATTESTATION:
----------------------------------
1. IDENTITY VERIFICATION:
Candidate authorizes live photo capture for identity authentication and anti-proxy measures.

2. EMPLOYMENT DISCLAIMER:
Candidate acknowledges certification does not guarantee employment, placement, or financial increases.

3. ACADEMIC INTEGRITY:
Candidate agrees to complete exams independently without unauthorized materials or AI assistance.

4. LIMITATION OF LIABILITY:
Portal is not liable for technical failures or candidate-side connectivity issues during examinations.

FINAL DECLARATION & FULL AGREEMENT:
----------------------------------

SERVICE DELIVERY:
🔎 Step 1: Immediate Admission Confirmation After Payment
The student onboarding journey begins instantly upon checkout. As soon as a transaction clears our secure platform gateways, our backend servers trigger an Automated Admission Confirmation Notice. Students receive a digital welcome package containing their permanent user profile IDs, platform workspace access routes, and an overview map of their target educational tracks.

📌 Step 2: Mandatory Document KYC Verification
In strict compliance with structural risk management policies, all enrolled learners must verify their commercial profile data. Students are required to securely upload their valid identity documentation (such as government-issued photo IDs or institutional cards) to our encrypted verification portal. This step ensures that final completion documentation matches legal corporate profiles accurately.

🔎 Step 3: Secure Video KYC Authentication
To prevent platform identity theft, proxy testing, and transaction chargeback vectors, students must execute an automated Video KYC Verification step. Using an integrated web interface, learners record a brief, self-directed biometric identity check matching their uploaded documents. This establishes an unalterable audit trail for security purposes.

📊 Step 4: System Generation & Delivery of GST Invoice
Accountability and fiscal transparency are foundational to our services. Within 24 hours of successful verification, our accounting systems compile a comprehensive, legally compliant Corporate GST Invoice detailing the exact service breakdown and tax identifiers. This asset is dispatched straight to the studentʼs billing tab for corporate tax deduction filing purposes.

🗒 Step 5: Dissemination of Comprehensive PDF Study Material (Strict One-Time Release)
Upon successful verification, the complete independent text registry library is unlocked. Students receive high-fidelity, comprehensive PDF Study Materials and Text Workbooks tailored strictly to their curriculum.
⚠ Operational Security Notice: In accordance with our digital asset protection protocols, all reading materials are shared on a strict one-time basis only. Students must securely download and save these assets immediately upon distribution, as link refreshes or secondary file dispatches will not be granted.

🌟 Step 6: Issuance of Formal Training Enrollment Certificate
Before course modules begin, our records registry generates a formal, verifiable Princeton Professional Enrollment Certificate. This initial credential serves as an active commercial proof of status, reflecting that the individual is currently under training within an active, non-affiliated skill development boot camp.

📈 Step 7: Access Provisioning for Video Lecture Sessions (Strict One-Time Release)
Learners gain access to their master collection of high-definition, pre-recorded visual walkthroughs and technical screen-shares. These professional Video Lectures contain the entirety of the execution-level core methodologies.
⚠ Operational Security Notice: In line with platform distribution rules, access keys to the video lecture sets are shared on a strict one-time basis only. Re-sharing, profile splitting, or secondary video deliveries are completely restricted to safeguard content parameters.

🗓 Step 8: Distribution of Final Examination Login Credentials
Once the 10-day, 20-day, or 30-day curriculum timeline has elapsed, the student workspace triggers the final evaluation phase. The platform outputs unique, encrypted Final Exam Login Credentials directly to the student portal, giving them an isolated access window to complete their timed, multiple-choice evaluation independently.

✅ Step 9: Final Exam Result Processing & Delivery with Provisional Certificate (PC)
Upon completing the examination, our grading engines parse the submission data against metric matrices. The comprehensive Final Exam Result Sheet is computed and displayed instantly inside the dashboard. Graduates are immediately issued their verified Provisional Certificate (PC), closing out the service lifecycle and enabling immediate skill deployment in the corporate sector.

TERMS & CONDITIONS:
📜 TERMS AND CONDITIONS UPDATE: SERVICE FULFILLMENT & NO REFUND POLICY

1. Scope of Independent Vocational Services
By completing a commercial transaction and registering for any training program on Princeton Professional (https://princetonprofessional.com), the user (hereinafter referred to as the "Student" or "Client") explicitly acknowledges and agrees that all services rendered are independent, skill-based vocational training programs.
Princeton Professional functions strictly as an asynchronous educational infrastructure platform. Our programs are non-degree, non-diploma courses and explicitly do not require or maintain any affiliation, accreditation, or licensing from any university, government institute, or private educational board. Princeton Professional grants institutional "Certificates of Completion" and "Provisional Certificates" based solely on independent competency assessments.

2. Asynchronous Delivery Model & Anti-Interactive Clauses
The Client explicitly understands and accepts that Princeton Professional operates on a static digital distribution model:
Exclusivity of Medium: Training is delivered solely and exclusively via pre-recorded, asynchronous video lecture modules and downloadable PDF text study workbooks.
Prohibition of Live Training: Princeton Professional never offers, promises, or provides any person-to-person instruction, live classroom training, group webinars, real-time mentorship, or interactive tutor sessions.
Self-Directed Operational Responsibility: The Student bears absolute responsibility for navigating the course materials independently within the platformʼs self-contained hosting framework. No claims for refunds based on the lack of live human interaction will be entertained under any circumstances, as the platform explicitly disclaims interactive training.

3. Strict 9-Step Service Delivery Protocol & Binding Benchmarks
Fulfillment of the purchase contract is systematically tracked and verified by our backend architecture across nine sequential milestones. By enrolling, the Student agrees to comply with the operational conditions of each step:
• Admission Confirmation After Payment: Triggered instantly upon payment gateway clearance. This marks the commencement of the digital contractual relationship.
• Mandatory Document KYC: The Student must securely upload valid government-issued photo identification to verify their profile. Failure to provide legitimate documentation within the course timeframe will result in account suspension without a refund.
• Mandatory Video KYC Authentication: A biometric video check must be recorded by the student to verify identity, eliminate fraud, and prevent proxy test-taking. Accounts failing the security profile checks are immediately locked to preserve system integrity.
• GST Invoice Delivery: A legally compliant Corporate GST Invoice is compiled and posted to the student's dashboard within 24 hours of successful validation.
• PDF Study Material Dissemination (Strict One-Time Release Clauses): Comprehensive text materials are unlocked inside the student portal. The Client acknowledges that files are shared on a strict one-time basis only. The Student bears the full legal and technical responsibility to securely save, download, and backup these digital assets immediately upon distribution. Princeton Professional completely denies any liability for file loss, hardware failure, or requests for link refreshes post-distribution.
• Enrollment Certificate Issuance: A digital record reflecting that the individual is actively under training within our independent boot camp is instantly generated and delivered.
• Video Lecture Access Provisioning (Strict One-Time Release Clauses): Pre-recorded training paths are made accessible to the profile workspace. Like the text files, access keys to the video streams are delivered on a strict one-time basis only. Account sharing, profile splitting, or data scraping are prohibited and will trigger automated account bans without a refund.
• Final Examination Login Credentials: Upon expiration of the designated course duration (10, 20, or 30 days maximum), encrypted examination keys are assigned to the portal.
• Final Exam Grading & Provisional Certificate (PC) Delivery: Upon submission, grading engines compute results instantly, and a provisional credential is issued to close the service loop.

4. Defatigability of Services & Definitive "No-Refund" Policy
Princeton Professional distributes high-value, proprietary digital intellectual property. Due to the digital nature of these assets—which can be instantly viewed, saved, or downloaded upon release—all transactions executed on https://princetonprofessional.com are strictly FINAL, NON-CANCELLABLE, AND NON-REFUNDABLE.

[POLICY PROVISION TABLE]
--------------------------------------------------------------------------------------------------------
| POLICY PROVISION | DESCRIPTION & EXECUTION THRESHOLD | LEGAL IMPACT ON CLIENT |
| :--- | :--- | :--- |
| Instant Fulfillment Waiver | Triggered immediately upon Step 1 (Payment Clearance) and Step 5 (PDF Study Material Dissemination). | The Client explicitly waives any right to an operational "cooling-off period" or transaction cancellation once assets are deployed. |
| One-Time Sharing Indemnification | Established upon execution of the "Strict One-Time Release" protocols in Step 5 and Step 7. | The platform is completely indemnified against student complaints regarding data loss, user error, device incompatibility, or platform lockouts resulting from a breach of user rules. |
| KYC Refusal Forfeiture | Triggered if a user refuses or fails Step 2 (Document KYC) or Step 3 (Video KYC). | The user's account will be permanently banned for a security breach. All paid registration fees are entirely forfeited to cover administrative processing costs. |
| Dispute & Chargeback Mitigation | Triggered when a client files a dispute, credit card chargeback, or payment reversal claim. | Treated legally as a breach of contract. The platform will submit this policy and server logs to banks to aggressively deny the claim. |
--------------------------------------------------------------------------------------------------------

• Instant Fulfillment Waiver: Triggered immediately upon Step 1 (Payment Clearance) and Step 5 (PDF Study Material Dissemination). The Client explicitly waives any right to an operational "cooling-off period" or transaction cancellation once assets are deployed.
• One-Time Sharing Indemnification: Established upon execution of the "Strict One-Time Release" protocols in Step 5 and Step 7. The platform is completely indemnified against student complaints regarding data loss, user error, device incompatibility, or platform lockouts resulting from a breach of user rules.
• KYC Refusal Forfeiture: Triggered if a user refuses or fails Step 2 (Document KYC) or Step 3 (Video KYC). The user's account will be permanently banned for a security breach. All paid registration fees are entirely forfeited to cover administrative processing costs.
• Dispute & Chargeback Mitigation: Triggered when a client files a dispute, credit card chargeback, or payment reversal claim. Treated legally as a breach of contract. The platform will submit this policy and server logs to banks to aggressively deny the claim.

5. Acceptance of Terms
By scrolling past this screen, clicking "I Agree," or processing a training fee payment on our network domains, you explicitly declare that you have read, understood, and agreed to be legally bound by this Service Delivery Framework and No-Refund Policy. If you do not accept these asynchronous, un-affiliated delivery constraints, you must exit our platform immediately and refrain from purchasing any services.

PRIVACY POLICY:
1. Introduction & Scope
This Privacy Policy governs the data collection, storage, processing, and security practices of Princeton Professional (operating through its asynchronous educational infrastructure platform at https://princetonprofessional.com).
To deliver independent vocational training programs, identity verification services, and verifiable institutional credentials, Princeton Professional must handle specific personal and biometric data. By registering an account, making a purchase, or completing the security verification steps, you explicitly consent to the collection, processing, and retention practices outlined in this policy.

2. Information We Collect
Princeton Professional processes information through various stages of your onboarding, verification, and educational journey:
A. Personal Identification Data:
Registration & Contact Information: Full legal name, billing address, phone number, and corporate email address collected during checkout or sign-up.
Fiscal Identity: Information required to generate corporate accounts, including corporate entity names and specific tax identifiers.
B. Mandatory KYC & Security Verification Data:
Documentary Identity (Document KYC): Images or digital files of valid government-issued photo identification cards or institutional credential badges uploaded securely to our portal.
Biometric Identity (Video KYC): Self-directed, brief video records processed through an integrated web interface to execute facial matching against submitted documentation and to eliminate proxy testing.
C. Academic & Technical Workspace Logs:
Evaluation Records: Answers, responses, submission timestamps, and performance metrics parsed by our grading matrices during automated final examinations.
System & Backend Server Logs: Unique workspace access keys, internet protocol (IP) address mapping, browser data, and precise file download timestamps related to the release of text libraries and video lecture elements.

3. How We Use Your Data
Your information is processed strictly to maintain platform safety and complete the structural service loop:
• Identity Verification & Anti-Fraud: Cross-referencing your biometric Video KYC data with your submitted physical document profile to establish an unalterable audit trail, eliminating proxy test-taking and financial transaction theft.
• Service Fulfillment: Provisioning individual profiles with unique access keys to streaming lecture workspaces, digital text repositories, and encrypted final examination modules.
• Credential Issuance: Generating accurate legal profiles for formal, verifiable documents, including initial Enrollment Certificates and final Provisional Certificates (PC).
• Compliance & Legal Accountability: Compiling and posting legally compliant Corporate GST Invoices straight to your workspace within 24 hours of successful validation.

4. Data Protection, Sharing, and Disclosure
A. Strict Third-Party Restrictions:
Princeton Professional treats proprietary and personal data with high security. We do not sell, rent, trade, or share your personal, documentary, or biometric data with external third-party marketing networks or unrelated data brokers.
B. Conditional Sharing Framework:
Data is shared exclusively under the following strict conditions:
- Payment Processing: Financial details are managed securely via encrypted, external payment gateways during checkout to clear transactions safely.
- Dispute and Chargeback Defense: In alignment with our Terms and Conditions, if a user files a transaction dispute, credit card chargeback, or payment reversal claim, Princeton Professional will submit backend server logs (such as download metrics and KYC verification markers) to the involved financial institutions to defend against the claim.
- Legal Enforcement: Data may be disclosed if required by an official court order, applicable government statutory body, or prevailing regulatory legal framework.

5. Security & Technical Safeguards
We implement a multi-layered security infrastructure to shield your files and identity profiles:
• Data Encryption: Document uploads, video files, and financial invoice generation are processed and stored over secure, encrypted network connections.
• Workspace Automated Bans: Automated behavioral system parameters track multi-location concurrent logins. Profiles attempting unauthorized concurrent access, scraping attempts via scripts, or distributing video access streams are banned to ensure ecosystem security.

6. Data Retention Policies
• Operational Files: Personal profile structures, exam transcripts, and credential verification links are kept for as long as your workspace account remains active or to fulfill tax, corporate accounting, or institutional tracking standards.
• KYC Security Profiles: Biometric checks and government identification logs are preserved securely to maintain an unalterable transaction audit trail, serving as definitive evidence of contractual compliance.

7. Acceptance & Acknowledgement
Interacting with the platform, completing registrations, or inputting identity vectors implies explicit and dynamic acknowledgement of this Privacy Policy. If you do not accept these data handling rules, you must immediately halt data submission and exit the platform.

REFUND POLICY:
1. Executive Summary & Legal Framework of Services
By completing a commercial financial transaction, processing a payment gateway fee, or registering for any independent skill-based training program on the Princeton Professional network domains, the user (hereinafter legally referred to as the "Student", "Client", or "User") explicitly acknowledges, understands, and binds themselves to this comprehensive, non-negotiable Service Fulfillment and No-Refund Policy.
Princeton Professional functions strictly and exclusively as an independent, asynchronous educational infrastructure platform. The digital training pathways, core methodologies, and instructional material hosted on the platform are structured solely as non-degree, non-diploma vocational training programs aimed at execution-level corporate skill development.

Independent Status Notice:
The Client explicitly recognizes that Princeton Professional does not maintain, require, or claim any affiliation, accreditation, licensing, or oversight from any university, government institute, statutory educational body, or private educational board. All institutional credentials, including "Certificates of Completion" and "Provisional Certificates (PC)", are granted based entirely on independent competency assessments managed internally by the platformʼs grading matrices. Consequently, normal academic withdrawal policies, student tuition protection schemes, or traditional institutional refund metrics are wholly inapplicable to transactions executed with this platform.

2. Asynchronous Delivery Model & Anti-Interactive Clauses
A fundamental pillar of this refund policy is the nature of the service delivery itself. Princeton Professional operates on a static digital distribution model. The commercial valuation of the program is tied directly to the ingestion of proprietary digital intellectual property rather than live human instruction.
Exclusivity of Medium:
All vocational training curricula are delivered solely and exclusively via pre-recorded, asynchronous video lecture modules and downloadable PDF text study workbooks.
Prohibition of Live Training:
The platform never offers, promises, schedules, or provides any form of person-to-person instruction, live virtual classroom training, synchronous group webinars, real-time mentorship, or interactive tutor-led question-and-answer sessions.
Self-Directed Operational Responsibility:
The Student bears absolute, sole, and un-delegable responsibility for independently navigating, reading, viewing, and completing the course materials within the platformʼs self-contained hosting framework.
BINDING CLAUSE: No claims, complaints, demands, or legal petitions for refunds based on a purported lack of live human interaction, lack of custom feedback, or dissatisfaction with the self-guided nature of the platform will be entertained under any circumstances. The platform explicitly disclaims interactive training prior to purchase, and registration constitutes a complete waiver of claims regarding structural isolation during the learning process.

3. The Strict 9-Step Service Delivery Protocol
Fulfillment of the digital purchase contract is systematically tracked, timestamped, and verified by the platform's automated backend server log database. Contractual execution is broken down into nine sequential milestones:
[Step 1: Payment & Instant Admission] ➡ [Step 2: Document KYC] ➡ [Step 3: Biometric Video KYC]
⬇
[Step 6: Enrollment Certificate] ⬅ [Step 5: One-Time PDF Release] ⬅ [Step 4: Corporate GST Invoice]
⬇
[Step 7: One-Time Video Release] ➡ [Step 8: Exam Key Distribution] ➡ [Step 9: Grading & Provisional Cert]

• Step 1: Immediate Admission Confirmation After Payment: Triggered instantly upon payment gateway clearance. As soon as the transaction clears, our backend architecture outputs an Automated Admission Confirmation Notice containing permanent user profile IDs, platform workspace access routes, and an educational track overview map. This instantaneous action marks the official commencement of the binding digital contractual relationship.
• Step 2: Mandatory Document KYC Verification: In strict compliance with commercial risk management, students are required to securely upload valid government-issued photo identification to our encrypted verification portal. This ensures final documentation matches legal corporate profiles. Failure to upload legitimate documentation within the selected course timeframe results in account suspension without refund eligibility.
• Step 3: Secure Video KYC Authentication: To prevent identity theft, proxy test-taking, and transaction chargeback vectors, students must execute an automated, self-directed biometric identity check via an integrated web interface. Accounts failing or refusing this profile check are immediately locked to preserve system integrity, causing immediate forfeiture of fees.
• Step 4: System Generation & Delivery of GST Invoice: Accountability and fiscal transparency are verified through the automated compilation of a legally compliant Corporate GST Invoice detailing the exact service breakdown and tax identifiers. This asset is dispatched straight to the studentʼs billing tab within 24 hours of validation for corporate tax deduction purposes.
• Step 5: Dissemination of Comprehensive PDF Study Material (Strict One-Time Release): Upon successful validation, the comprehensive text registry library is unlocked, allowing the student to view high-fidelity PDF Study Materials and Text Workbooks. The One-Time Release Clause: Files are shared on a strict one-time basis only. The Student bears full legal and technical responsibility to securely save, download, and backup these digital assets immediately upon distribution. Princeton Professional completely denies any liability for file loss, hardware failure, or requests for link refreshes post-distribution.
• Step 6: Issuance of Formal Training Enrollment Certificate: The records registry automatically generates a formal, verifiable Princeton Professional Enrollment Certificate. Delivered straight to the portal dashboard, this initial credential serves as active commercial proof of status, reflecting that the individual is currently under training within an active, non-affiliated skill development boot camp.
• Step 7: Access Provisioning for Video Lecture Sessions (Strict One-Time Release): The student profile is provisioned with access keys to the master collection of pre-recorded visual walkthroughs and technical screen shares containing execution-level core methodologies. The One-Time Video Stream Clause: Like the text files, access keys to the video streams are delivered on a strict one-time basis only. Account sharing, profile splitting, or data scraping are prohibited and will trigger automated account bans without a refund.
• Step 8: Distribution of Final Examination Login Credentials: Upon the expiration of the designated course duration matrix (10, 20, or 30 days maximum), the student workspace automatically triggers the evaluation phase by outputting unique, encrypted Final Exam Login Credentials directly to the student portal. This provides an isolated access window to complete the timed, multiple-choice evaluation independently.
• Step 9: Final Exam Result Processing & Delivery with Provisional Certificate (PC): Upon submission, grading engines parse the submission data against metric matrices instantly. The comprehensive Final Exam Result Sheet is computed and displayed inside the dashboard, and graduates are immediately issued their verified Provisional Certificate (PC), closing out the service lifecycle.

4. Defatigability of Services & Definitive "No-Refund" Core Policy
Princeton Professional distributes high-value, proprietary digital intellectual property. Due to the digital nature of these assets—which can be instantly viewed, saved, cached, screenshotted, or downloaded immediately upon release—all transactions executed on https://princetonprofessional.com are strictly FINAL, NON-CANCELLABLE, AND NON-REFUNDABLE.

[POLICY PROVISION TABLE]
--------------------------------------------------------------------------------------------------------
| POLICY PROVISION | DESCRIPTION & EXECUTION THRESHOLD | LEGAL IMPACT ON CLIENT |
| :--- | :--- | :--- |
| Instant Fulfillment Waiver | Triggered immediately upon Step 1 (Payment Clearance) and Step 5 (PDF Study Material Dissemination). | The Client explicitly waives any right to an operational "cooling-off period" or transaction cancellation once assets are deployed. |
| One-Time Sharing Indemnification | Established upon execution of the "Strict One-Time Release" protocols in Step 5 and Step 7. | The platform is completely indemnified against student complaints regarding data loss, user error, device incompatibility, or platform lockouts resulting from a breach of user rules. |
| KYC Refusal Forfeiture | Triggered if a user refuses or fails Step 2 (Document KYC) or Step 3 (Video KYC). | The user's account will be permanently banned for a security breach. All paid registration fees are entirely forfeited to cover administrative processing costs. |
| Dispute & Chargeback Mitigation | Triggered when a client files a dispute, credit card chargeback, or payment reversal claim. | Treated legally as a breach of contract. The platform will submit this policy and server logs to banks to aggressively deny the claim. |
--------------------------------------------------------------------------------------------------------

• Instant Fulfillment Waiver: Triggered immediately upon Step 1 (Payment Clearance) and Step 5 (PDF Study Material Dissemination). The Client explicitly waives any right to an operational "cooling-off period" or transaction cancellation once assets are deployed.
• One-Time Sharing Indemnification: Established upon execution of the "Strict One-Time Release" protocols in Step 5 and Step 7. The platform is completely indemnified against student complaints regarding data loss, user error, device incompatibility, or platform lockouts resulting from a breach of user rules.
• KYC Refusal Forfeiture: Triggered if a user refuses or fails Step 2 (Document KYC) or Step 3 (Video KYC). The user's account will be permanently banned for a security breach. All paid registration fees are entirely forfeited to cover administrative processing costs.
• Dispute & Chargeback Mitigation: Triggered when a client files a dispute, credit card chargeback, or payment reversal claim. Treated legally as a breach of contract. The platform will submit this policy and server logs to banks to aggressively deny the claim.

5. Exhaustive Legal Provisos & Operational Enforcement
A. Technical Incompatibility & Device Disclaimers: The platform distributes standardized PDF formats and encrypted video stream wrappers. It is the sole technical responsibility of the Client to ensure that their personal hardware devices (desktop, laptop, mobile, or tablet), operating systems, and internet service providers meet the baseline operational requirements needed to stream video data and open PDF document repositories. No refunds will be granted based on technical limitations, outdated user browsers, local firewall blocks, network latency, ISP restrictions, or general device incompatibility.
B. Unilateral Account Revocation for Security Violations: Princeton Professional maintains strict automated behavioral tracking parameters across its workspace dashboards. The platform reserves the right to terminate any user profile instantly, without warning, and without the obligation of financial reimbursement or refund, if the backend system logs detect any of the following unauthorized activities:
- Concurrent multi-location IP logins indicating profile sharing or account splitting.
- Attempted injection of automated data-scraping scripts, download managers, or unauthorized stream-ripping software designed to duplicate proprietary video lectures.
- The uploading of corrupted data packages, malware, or fraudulent identity documentation during Step 2 (Document KYC) or Step 3 (Video KYC) protocols.
C. Program Modification and Discontinuance Indemnity: Princeton Professional reserves the right to modify, adjust, update, or re-sequence any portion of its pre-recorded instructional modules, PDF workbooks, grading metrics, or exam platforms at any time to preserve current corporate relevance. The execution of a curriculum update does not entitle the Client to a retrofitted refund, platform credit, or course exchange.

6. Acceptance of Terms & Dynamic Acknowledgement
By scrolling past presentation screens, checking an "I Agree" checkbox, interacting with any workspace element, or processing a training fee payment on our network domains, you explicitly declare that you have read, understood, and agreed to be legally bound by this Service Delivery Framework and No-Refund Policy.
If you do not accept these asynchronous, un-affiliated delivery constraints, or if you maintain any reservation regarding the definitive finality of commercial transactions executed on this domain, you must exit our platform immediately and refrain from purchasing any services.

COMPANY DETAILS & OFFICIAL CONTACT (https://princetonprofessional.com):
-----------------------------------------------------------------------
• Entity Name: Princeton Professional
• Official Domain: https://princetonprofessional.com
• Official Support Email: support@princetonprofessional.com
• Official Contact Numbers: +91 7969654625 | +91 8062386661 | +91 2241507376
• Corporate Address: Imperial Tower, Balkrishna Nakashe Marg, Janata Nagar, Tardeo, Mumbai, Maharashtra 400034

ACCEPTED BY CANDIDATE: YES ✓
----------------------------------------

SUPPORTING EVIDENCE:
--------------------
• IP Address: ${ipAddress || 'Not Detected'}
• Live Video Statement:
${videoUrl || 'N/A'}

• Aadhaar Card (Front):
${frontUrl || 'N/A'}

• Aadhaar Card (Back):
${backUrl || 'N/A'}

• PAN Card:
${panUrl || 'N/A'}

• Digital Signature:
${signatureUrl || 'N/A'}

By proceeding, the candidate electronically signs and agrees to all terms above.
----------------------------------------

Submitted via Princeton Professional Exam Portal
`.trim();
};
