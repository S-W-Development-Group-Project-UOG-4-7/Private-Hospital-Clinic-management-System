🏥 Private Hospital Clinic Management System (PHCMS)

Developed by:

Sheron Fernando – UOG0723008

Malitha Rathnayaka – UOG0422006

Hemanthi Anodya – UOG0422073

Nilukshi Wijerathna – UOG0422059

Nilusha Wijerathna – UOG0422060

Date: 11 / 2025

📌 Project Overview

The Private Hospital Clinic Management System (PHCMS) is a comprehensive web-based platform designed to automate and integrate clinical and administrative operations in private healthcare environments. This system overcomes the limitations of traditional paper-based workflows, fragmented tools, and legacy systems by offering a unified, secure, and scalable solution.

The system emphasizes:
✔ Seamless patient experience
✔ Improved operational efficiency
✔ High data security & compliance
✔ Support for modern healthcare services (Telemedicine, EHR, CDS)

📄 Abstract

The PHCMS provides a centralized digital environment for managing patient appointments, records, teleconsultations, billing, inventory, and administrative operations.

Core features include:

Online Patient Portal: Appointment scheduling, remote check-in, online payments.

Electronic Health Records (EHR): Interoperability, ICD coding, and Clinical Decision Support (CDS).

Telemedicine Module: Video and audio consultations.

Financial & Insurance Module: Real-time insurance verification, automated invoices.

Pharmacy & Inventory Management: Drug interaction checks, automatic reordering.

The system follows a 3-Tier Architecture and is developed using HTML, CSS, JavaScript, PHP, and MySQL, ensuring scalability, performance, and security. The Waterfall Model was used as the software development methodology, enabling structured development with thorough documentation.

🙏 Acknowledgements

We extend our sincere gratitude to:

Ms. Tharushi

Ms. Ashika

Mr. Janith

for their continuous guidance and support during this project.
We also thank all lecturers and staff at LNBTI for providing the academic foundation required to complete this work successfully.
Finally, we appreciate the encouragement and support from our families, friends, and everyone who contributed to this project.

## Setup
1. Backend:
   - `cd backend`
   - `composer install`
   - `php artisan key:generate`
   - `php artisan migrate`
   - `php artisan db:seed`
   - `php artisan permission:cache-reset`
   - `php artisan serve`
2. Frontend:
   - `cd frontend`
   - `npm install`
   - `npm start`

## Demo Credentials
- Admin: `admin@mediclinic.com` / `admin123`
- Doctor: `doctor@mediclinic.com` / `doctor123`
- Receptionist: `receptionist@mediclinic.com` / `receptionist123`
- Pharmacist: `pharmacist@mediclinic.com` / `pharmacist123`
- Patient: `patient@mediclinic.com` / `patient123`

## Testing
- Backend: `cd backend && php artisan test`
- Frontend: `cd frontend && npm test`

**Scheduling Notes**
- `visit_mode` indicates where the visit happens: `PHYSICAL` (in-person) or `ONLINE` (video).
- `booking_channel` indicates how it was booked: `FRONTDESK`, `PATIENT_PORTAL`, or `SYSTEM`.
- Example: a patient can book a hospital visit online with `visit_mode=PHYSICAL` and `booking_channel=PATIENT_PORTAL`.
- Video sessions are created only for `visit_mode=ONLINE` appointments and follow `CREATED -> LIVE -> ENDED`.
- Patients receive a join URL only when the session is `LIVE`; doctors can start and end sessions.
