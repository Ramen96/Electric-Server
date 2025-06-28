const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));

// Rate limiting
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many emails sent, please try again later.'
});

app.use(express.json());

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Job application endpoint
app.post('/api/job-application', emailLimiter, async (req, res) => {
  try {
    const {
      // Position details
      jobTitle,
      department,
      referenceNumber,
      advertisementSource,

      // Personal details
      title,
      lastName,
      firstName,
      homeAddress,
      zipCode,
      homePhone,
      workPhone,
      mobilePhone,
      email,

      // Additional info
      hasDriversLicense,
      hasMedicalCondition,
      hasWorkRestrictions,
      noticeRequired,

      // Employment records
      employmentRecords,

      // Education records
      educationRecords,

      // Training records
      trainingRecords,

      // Experience and skills
      experienceSkills,

      // References
      references,

      // Legal
      hasCriminalConvictions,
      drugAlcoholPolicyAcknowledged,

      // Optional attachments
      resume,
      additionalDocuments
    } = req.body;

    // Format employment history for email
    const formatEmploymentHistory = (records) => {
      return records
        .filter(record => record.employer) // Only include filled records
        .map((record, index) => `
          <div class="employment-record">
            <div class="employment-header">
              <span class="employment-number">Employment ${index + 1}</span>
            </div>
            <div class="employment-details">
              <div class="detail-row">
                <span class="detail-label">Employer:</span>
                <span class="detail-value">${record.employer}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Position:</span>
                <span class="detail-value">${record.jobTitle}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Address:</span>
                <span class="detail-value">${record.address}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Period:</span>
                <span class="detail-value">${record.fromDate} to ${record.toDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duties:</span>
                <span class="detail-value">${record.duties}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Reason for Leaving:</span>
                <span class="detail-value">${record.reasonForLeaving}</span>
              </div>
            </div>
          </div>
        `).join('');
    };

    // Format education records for email
    const formatEducationHistory = (records) => {
      return records
        .filter(record => record.institution) // Only include filled records
        .map(record => `
          <div class="table-row">
            <div class="table-cell">${record.institution}</div>
            <div class="table-cell">${record.subject}</div>
            <div class="table-cell">${record.qualification}</div>
            <div class="table-cell">${record.dateGained}</div>
          </div>
        `).join('');
    };

    // Format training records for email
    const formatTrainingHistory = (records) => {
      return records
        .filter(record => record.course) // Only include filled records
        .map(record => `
          <div class="table-row">
            <div class="table-cell">${record.course}</div>
            <div class="table-cell">${record.date}</div>
          </div>
        `).join('');
    };

    // Format references for email
    const formatReferences = (refs) => {
      return refs
        .filter(ref => ref.name) // Only include filled references
        .map((ref, index) => `
          <div class="reference-record">
            <div class="reference-header">
              <span class="reference-number">Reference ${index + 1}</span>
            </div>
            <div class="reference-details">
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${ref.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Position:</span>
                <span class="detail-value">${ref.position}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Organization:</span>
                <span class="detail-value">${ref.organization}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Address:</span>
                <span class="detail-value">${ref.address}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Telephone:</span>
                <span class="detail-value">${ref.telephone}</span>
              </div>
            </div>
          </div>
        `).join('');
    };

    // Prepare attachments
    const attachments = [];
    if (resume) {
      attachments.push({
        filename: 'resume.pdf',
        content: resume
      });
    }
    if (additionalDocuments && additionalDocuments.length > 0) {
      additionalDocuments.forEach((doc, index) => {
        attachments.push({
          filename: doc.filename || `document_${index + 1}.pdf`,
          content: doc.content
        });
      });
    }

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.HR_EMAIL,
      subject: `New Job Application: ${jobTitle} - ${firstName} ${lastName}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Job Application</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #ffffff;
              background: #000000;
              min-height: 100vh;
              padding: 40px 20px;
            }
            
            .container {
              max-width: 900px;
              margin: 0 auto;
              background: rgb(0, 0, 0);
              border: 2px solid rgb(234, 179, 8);
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 30px 60px -12px rgb(0, 0, 0), 0 0 0 1px rgb(234, 179, 8), inset 0 1px 0 rgb(234, 179, 8);
              position: relative;
            }
            
            .container::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 3px;
              background: linear-gradient(90deg, rgb(234, 179, 8) 0%, rgb(255, 215, 0) 50%, rgb(234, 179, 8) 100%);
              z-index: 10;
            }
            
            .header {
              background: linear-gradient(135deg, rgb(0, 0, 0) 0%, rgb(20, 20, 20) 50%, rgb(0, 0, 0) 100%);
              padding: 40px 32px;
              text-align: center;
              border-bottom: 2px solid rgb(234, 179, 8);
              position: relative;
              overflow: hidden;
            }
            
            .header::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 1px;
              background: linear-gradient(90deg, transparent 0%, rgb(234, 179, 8) 50%, transparent 100%);
            }
            
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCI+PHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgLz48L3BhdHRlcm4+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIgLz48L3N2Zz4=') repeat;
              opacity: 0.4;
              z-index: 0;
            }
            
            .header-content {
              position: relative;
              z-index: 1;
            }
            
            .badge {
              display: inline-block;
              padding: 10px 20px;
              background: linear-gradient(135deg, rgb(0, 0, 0) 0%, rgb(30, 30, 30) 100%);
              border: 2px solid rgb(234, 179, 8);
              border-radius: 25px;
              color: rgb(234, 179, 8);
              font-size: 13px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 20px;
              box-shadow: 0 4px 15px rgb(234, 179, 8), inset 0 1px 0 rgb(234, 179, 8);
              position: relative;
              overflow: hidden;
            }
            
            .badge::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgb(255, 215, 0), transparent);
              opacity: 0.3;
              animation: shimmer 3s infinite;
            }
            
            @keyframes shimmer {
              0% { left: -100%; }
              100% { left: 100%; }
            }
            
            .title {
              font-size: 42px;
              font-weight: 900;
              color: #ffffff !important;
              margin-bottom: 12px;
              line-height: 1.1;
              letter-spacing: -0.5px;
              text-shadow: 0 2px 10px rgba(234, 179, 8, 0.5);
            }
            
            .applicant-name {
              color: rgb(234, 179, 8);
              font-size: 24px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 2px;
              opacity: 0.9;
            }
            
            .job-title {
              color: rgb(255, 255, 255);
              font-size: 18px;
              font-weight: 500;
              margin-top: 8px;
              opacity: 0.8;
            }
            
            .content {
              padding: 40px;
              background: linear-gradient(135deg, rgb(0, 0, 0) 0%, rgb(10, 10, 10) 100%);
            }
            
            .section {
              margin-bottom: 40px;
            }
            
            .section-title {
              color: rgb(234, 179, 8);
              font-size: 24px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 20px;
              position: relative;
              padding-bottom: 10px;
            }
            
            .section-title::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              width: 60px;
              height: 3px;
              background: linear-gradient(90deg, rgb(234, 179, 8), rgb(255, 215, 0));
              border-radius: 2px;
            }
            
            .field-group {
              margin-bottom: 28px;
              background: linear-gradient(135deg, rgb(0, 0, 0) 0%, rgb(15, 15, 15) 100%);
              border: 2px solid rgb(234, 179, 8);
              border-radius: 16px;
              padding: 24px;
              transition: all 0.4s ease;
              position: relative;
              overflow: hidden;
            }
            
            .field-group::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 1px;
              background: linear-gradient(90deg, transparent 0%, rgb(255, 215, 0) 50%, transparent 100%);
              opacity: 0.6;
            }
            
            .field-label {
              display: block;
              color: rgb(234, 179, 8);
              font-weight: 700;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-bottom: 12px;
              position: relative;
            }
            
            .field-label::after {
              content: '';
              position: absolute;
              bottom: -4px;
              left: 0;
              width: 30px;
              height: 2px;
              background: linear-gradient(90deg, rgb(234, 179, 8), rgb(255, 215, 0));
              border-radius: 1px;
            }
            
            .field-value {
              color: rgb(255, 255, 255);
              font-size: 17px;
              font-weight: 500;
              word-wrap: break-word;
              line-height: 1.6;
            }
            
            .detail-row {
              display: flex;
              margin-bottom: 12px;
              align-items: flex-start;
            }
            
            .detail-label {
              color: rgb(234, 179, 8);
              font-weight: 600;
              font-size: 14px;
              min-width: 120px;
              margin-right: 16px;
            }
            
            .detail-value {
              color: rgb(255, 255, 255);
              font-size: 15px;
              flex: 1;
            }
            
            .employment-record, .reference-record {
              background: linear-gradient(135deg, rgb(0, 0, 0) 0%, rgb(20, 20, 20) 100%);
              border: 2px solid rgb(234, 179, 8);
              border-radius: 16px;
              margin-bottom: 24px;
              overflow: hidden;
              position: relative;
            }
            
            .employment-record::before, .reference-record::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 1px;
              background: linear-gradient(90deg, transparent 0%, rgb(255, 215, 0) 50%, transparent 100%);
              opacity: 0.8;
            }
            
            .employment-header, .reference-header {
              background: linear-gradient(135deg, rgb(234, 179, 8) 0%, rgb(255, 215, 0) 100%);
              padding: 16px 24px;
              position: relative;
            }
            
            .employment-number, .reference-number {
              color: rgb(0, 0, 0);
              font-weight: 700;
              font-size: 16px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .employment-details, .reference-details {
              padding: 24px;
            }
            
            .custom-table {
              width: 100%;
              border-collapse: collapse;
              background: linear-gradient(135deg, rgb(0, 0, 0) 0%, rgb(15, 15, 15) 100%);
              border: 2px solid rgb(234, 179, 8);
              border-radius: 16px;
              overflow: hidden;
              position: relative;
            }
            
            .custom-table::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 1px;
              background: linear-gradient(90deg, transparent 0%, rgb(255, 215, 0) 50%, transparent 100%);
              opacity: 0.6;
            }
            
            .table-header {
              background: linear-gradient(135deg, rgb(234, 179, 8) 0%, rgb(255, 215, 0) 100%);
              display: flex;
            }
            
            .table-header-cell {
              color: rgb(0, 0, 0);
              font-weight: 700;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 16px;
              flex: 1;
              text-align: left;
            }
            
            .table-row {
              display: flex;
              border-bottom: 1px solid rgba(234, 179, 8, 0.2);
            }
            
            .table-row:last-child {
              border-bottom: none;
            }
            
            .table-cell {
              color: rgb(255, 255, 255);
              font-size: 15px;
              padding: 16px;
              flex: 1;
              border-right: 1px solid rgba(234, 179, 8, 0.2);
            }
            
            .table-cell:last-child {
              border-right: none;
            }
            
            .experience-field {
              background: linear-gradient(135deg, rgb(0, 0, 0) 0%, rgb(15, 15, 15) 100%);
              border: 2px solid rgb(234, 179, 8);
              border-radius: 16px;
              padding: 28px;
              position: relative;
              overflow: hidden;
            }
            
            .experience-field::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 1px;
              background: linear-gradient(90deg, transparent 0%, rgb(255, 215, 0) 50%, transparent 100%);
              opacity: 0.6;
            }
            
            .experience-field .field-value {
              line-height: 1.7;
              white-space: pre-wrap;
            }
            
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-top: 40px;
              padding-top: 40px;
              border-top: 2px solid rgb(234, 179, 8);
              position: relative;
            }
            
            .stats-grid::before {
              content: '';
              position: absolute;
              top: -1px;
              left: 50%;
              transform: translateX(-50%);
              width: 100px;
              height: 2px;
              background: linear-gradient(90deg, transparent 0%, rgb(255, 215, 0) 50%, transparent 100%);
            }
            
            .stat-card {
              background: linear-gradient(135deg, rgb(0, 0, 0) 0%, rgb(20, 20, 20) 100%);
              border: 2px solid rgb(234, 179, 8);
              border-radius: 16px;
              padding: 24px;
              text-align: center;
              transition: all 0.4s ease;
              position: relative;
              overflow: hidden;
            }
            
            .stat-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 1px;
              background: linear-gradient(90deg, transparent 0%, rgb(255, 215, 0) 50%, transparent 100%);
              opacity: 0.8;
            }
            
            .stat-icon {
              font-size: 24px;
              margin-bottom: 8px;
            }
            
            .stat-label {
              color: rgb(255, 255, 255);
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            
            .stat-value {
              color: rgb(234, 179, 8);
              font-size: 18px;
              font-weight: 700;
            }
            
            .footer {
              background: rgb(0, 0, 0);
              padding: 24px 32px;
              text-align: center;
              border-top: 1px solid rgb(234, 179, 8);
            }
            
            .footer-text {
              color: rgb(255, 255, 255);
              font-size: 14px;
            }
            
            .highlight {
              color: rgb(234, 179, 8);
              font-weight: 600;
            }
            
            .no-data {
              color: rgba(255, 255, 255, 0.6);
              font-style: italic;
              text-align: center;
              padding: 40px;
            }
            
            @media (max-width: 600px) {
              .container {
                margin: 0 10px;
              }
              
              .title {
                font-size: 28px;
              }
              
              .content, .header {
                padding: 24px;
              }
              
              .stats-grid {
                grid-template-columns: 1fr;
              }
              
              .detail-row {
                flex-direction: column;
              }
              
              .detail-label {
                margin-bottom: 4px;
                margin-right: 0;
              }
              
              .table-header, .table-row {
                flex-direction: column;
              }
              
              .table-header-cell, .table-cell {
                border-right: none;
                border-bottom: 1px solid rgba(234, 179, 8, 0.2);
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-content">
                <div class="badge">New Application</div>
                <h1 class="title">Job Application</h1>
                <p class="applicant-name">${firstName} ${lastName}</p>
                <p class="job-title">${jobTitle}</p>
              </div>
            </div>
            
            <div class="content">
              <div class="section">
                <h2 class="section-title">Experience & Skills</h2>
                <div class="experience-field">
                  <span class="field-label">Experience & Skills</span>
                  <div class="field-value">${experienceSkills || 'Not provided'}</div>
                </div>
              </div>

              <div class="section">
                <h2 class="section-title">References</h2>
                ${references && references.some(ref => ref.name) ?
          formatReferences(references) :
          '<div class="no-data">No references provided</div>'
        }
              </div>

              <div class="section">
                <h2 class="section-title">Legal Information</h2>
                <div class="field-group">
                  <span class="field-label">Legal Declarations</span>
                  <div class="field-value">
                    <div class="detail-row">
                      <span class="detail-label">Criminal Convictions:</span>
                      <span class="detail-value">${hasCriminalConvictions ? 'Yes' : 'No'}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Drug & Alcohol Policy:</span>
                      <span class="detail-value">${drugAlcoholPolicyAcknowledged ? 'Acknowledged' : 'Not Acknowledged'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-icon">👤</div>
                  <div class="stat-label">Applicant</div>
                  <div class="stat-value">${firstName} ${lastName}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">💼</div>
                  <div class="stat-label">Position</div>
                  <div class="stat-value">${jobTitle}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">📅</div>
                  <div class="stat-label">Applied</div>
                  <div class="stat-value">${new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p class="footer-text">
                Application submitted on <span class="highlight">${new Date().toLocaleDateString()}</span> at <span class="highlight">${new Date().toLocaleTimeString()}</span>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: attachments
    });

    res.json({
      success: true,
      message: 'Application submitted successfully!'
    });

  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application. Please try again.'
    });
  }
});

// Contact form endpoint
app.post('/api/contact', emailLimiter, async (req, res) => {
  try {
    const { name, email, phone, company, projectType, message } = req.body;

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.CONTACT_EMAIL,
      subject: `Contact Form: ${projectType} Project`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Form Submission</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #ffffff;
              background: #000000;
              min-height: 100vh;
              padding: 40px 20px;
            }
            
            .container {
              max-width: 700px;
              margin: 0 auto;
              background: rgb(0, 0, 0);
              border: 2px solid rgb(234, 179, 8);
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 30px 60px -12px rgb(0, 0, 0), 0 0 0 1px rgb(234, 179, 8), inset 0 1px 0 rgb(234, 179, 8);
              position: relative;
            }
            
            .container::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 3px;
              background: linear-gradient(90deg, rgb(234, 179, 8) 0%, rgb(255, 215, 0) 50%, rgb(234, 179, 8) 100%);
              z-index: 10;
            }
            
            .header {
              background: linear-gradient(135deg, rgb(0, 0, 0) 0%, rgb(20, 20, 20) 50%, rgb(0, 0, 0) 100%);
              padding: 40px 32px;
              text-align: center;
              border-bottom: 2px solid rgb(234, 179, 8);
              position: relative;
              overflow: hidden;
            }
            
            .header::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 1px;
              background: linear-gradient(90deg, transparent 0%, rgb(234, 179, 8) 50%, transparent 100%);
            }
            
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCI+PHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgLz48L3BhdHRlcm4+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIgLz48L3N2Zz4=') repeat;
              opacity: 0.4;
              z-index: 0;
            }
            
            .header-content {
              position: relative;
              z-index: 1;
            }
            
            .badge {
              display: inline-block;
              padding: 10px 20px;
              background: linear-gradient(135deg, rgb(0, 0, 0) 0%, rgb(30, 30, 30) 100%);
              border: 2px solid rgb(234, 179, 8);
              border-radius: 25px;
              color: rgb(234, 179, 8);
              font-size: 13px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 20px;
              box-shadow: 0 4px 15px rgb(234, 179, 8), inset 0 1px 0 rgb(234, 179, 8);
              position: relative;
              overflow: hidden;
            }
            
            .badge::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgb(255, 215, 0), transparent);
              opacity: 0.3;
              animation: shimmer 3s infinite;
            }
            
            @keyframes shimmer {
              0% { left: -100%; }
              100% { left: 100%; }
            }
            
            .title {
              font-size: 42px;
              font-weight: 900;
              color: #ffffff !important;
              margin-bottom: 12px;
              line-height: 1.1;
              letter-spacing: -0.5px;
              text-shadow: 0 2px 10px rgba(234, 179, 8, 0.5);
            }
            
            .subtitle {
              color: rgb(255, 255, 255);
              font-size: 20px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 2px;
              opacity: 0.9;
            }
            
            .content {
              padding: 40px;
              background: linear-gradient(135deg, rgb(0, 0, 0) 0%, rgb(10, 10, 10) 100%);
            }
            
            .field-group {
              margin-bottom: 28px;
              background: linear-gradient(135deg, rgb(0, 0, 0) 0%, rgb(15, 15, 15) 100%);
              border: 2px solid rgb(234, 179, 8);
              border-radius: 16px;
              padding: 24px;
              transition: all 0.4s ease;
              position: relative;
              overflow: hidden;
            }
            
            .field-group::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 1px;
              background: linear-gradient(90deg, transparent 0%, rgb(255, 215, 0) 50%, transparent 100%);
              opacity: 0.6;
            }
            
            .field-group:hover {
              border-color: rgb(255, 215, 0);
              box-shadow: 0 12px 35px -8px rgb(234, 179, 8), 0 0 0 1px rgb(234, 179, 8);
              transform: translateY(-2px);
            }
            
            .field-label {
              display: block;
              color: rgb(234, 179, 8);
              font-weight: 700;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-bottom: 12px;
              position: relative;
            }
            
            .field-label::after {
              content: '';
              position: absolute;
              bottom: -4px;
              left: 0;
              width: 30px;
              height: 2px;
              background: linear-gradient(90deg, rgb(234, 179, 8), rgb(255, 215, 0));
              border-radius: 1px;
            }
            
            .field-value {
              color: rgb(255, 255, 255);
              font-size: 17px;
              font-weight: 500;
              word-wrap: break-word;
              line-height: 1.6;
            }
            
            .message-field {
              background: linear-gradient(135deg, rgb(0, 0, 0) 0%, rgb(15, 15, 15) 100%);
              border: 2px solid rgb(234, 179, 8);
              border-radius: 16px;
              padding: 28px;
              position: relative;
              overflow: hidden;
            }
            
            .message-field::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 1px;
              background: linear-gradient(90deg, transparent 0%, rgb(255, 215, 0) 50%, transparent 100%);
              opacity: 0.6;
            }
            
            .message-field .field-value {
              line-height: 1.7;
              white-space: pre-wrap;
            }
            
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-top: 40px;
              padding-top: 40px;
              border-top: 2px solid rgb(234, 179, 8);
              position: relative;
            }
            
            .stats-grid::before {
              content: '';
              position: absolute;
              top: -1px;
              left: 50%;
              transform: translateX(-50%);
              width: 100px;
              height: 2px;
              background: linear-gradient(90deg, transparent 0%, rgb(255, 215, 0) 50%, transparent 100%);
            }
            
            .stat-card {
              background: linear-gradient(135deg, rgb(0, 0, 0) 0%, rgb(20, 20, 20) 100%);
              border: 2px solid rgb(234, 179, 8);
              border-radius: 16px;
              padding: 24px;
              text-align: center;
              transition: all 0.4s ease;
              position: relative;
              overflow: hidden;
            }
            
            .stat-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 1px;
              background: linear-gradient(90deg, transparent 0%, rgb(255, 215, 0) 50%, transparent 100%);
              opacity: 0.8;
            }
            
            .stat-card:hover {
              transform: translateY(-3px);
              box-shadow: 0 15px 40px -10px rgb(234, 179, 8), 0 0 0 1px rgb(255, 215, 0);
              border-color: rgb(255, 215, 0);
            }
            
            .stat-icon {
              font-size: 24px;
              margin-bottom: 8px;
            }
            
            .stat-label {
              color: rgb(255, 255, 255);
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            
            .stat-value {
              color: rgb(234, 179, 8);
              font-size: 18px;
              font-weight: 700;
            }
            
            .footer {
              background: rgb(0, 0, 0);
              padding: 24px 32px;
              text-align: center;
              border-top: 1px solid rgb(234, 179, 8);
            }
            
            .footer-text {
              color: rgb(255, 255, 255);
              font-size: 14px;
            }
            
            .highlight {
              color: rgb(234, 179, 8);
              font-weight: 600;
            }
            
            @media (max-width: 600px) {
              .container {
                margin: 0 10px;
              }
              
              .title {
                font-size: 28px;
              }
              
              .content, .header {
                padding: 24px;
              }
              
              .stats-grid {
                grid-template-columns: 1fr;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-content">
                <div class="badge">New Inquiry</div>
                <h1 class="title">Contact Form Submission</h1>
                <p class="subtitle">C&C Construction & Electrical</p>
              </div>
            </div>
            
            <div class="content">
              <div class="field-group">
                <span class="field-label">Contact Information</span>
                <div class="field-value">
                  <strong>${name}</strong><br>
                  📧 ${email}<br>
                  📞 ${phone}
                </div>
              </div>
              
              ${company ? `
              <div class="field-group">
                <span class="field-label">Company</span>
                <div class="field-value">${company}</div>
              </div>
              ` : ''}
              
              <div class="field-group">
                <span class="field-label">Project Type</span>
                <div class="field-value">
                  <span class="highlight">${projectType}</span>
                </div>
              </div>
              
              <div class="message-field">
                <span class="field-label">Message</span>
                <div class="field-value">${message}</div>
              </div>
              
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-icon">⚡</div>
                  <div class="stat-label">Priority</div>
                  <div class="stat-value">High</div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">📅</div>
                  <div class="stat-label">Received</div>
                  <div class="stat-value">${new Date().toLocaleDateString()}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">🏗️</div>
                  <div class="stat-label">Service</div>
                  <div class="stat-value">${projectType}</div>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p class="footer-text">
                Respond promptly to maintain our <span class="highlight">99.8% client satisfaction</span> rate
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      replyTo: email
    });

    console.log('Email sent successfully:', info.messageId);

    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Email server running on port ${PORT}`);
});