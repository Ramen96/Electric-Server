const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Require the SendGrid library
const sgMail = require('@sendgrid/mail');

// Set the SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
}));
app.set('trust proxy', 2);

// Rate limiting for email endpoints
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many emails sent from this IP, please try again later.'
});

app.use(express.json());

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
          <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #FFD700; border-radius: 5px; background-color: #1a1a1a;">
            <h4 style="color: #FFD700; margin-top: 0;">Employment ${index + 1}</h4>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Employer:</strong> ${record.employer}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Job Title:</strong> ${record.jobTitle}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Address:</strong> ${record.address}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Period:</strong> ${record.fromDate} to ${record.toDate}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Duties:</strong> ${record.duties}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Reason for Leaving:</strong> ${record.reasonForLeaving}</p>
          </div>
        `).join('');
    };

    // Format education records for email
    const formatEducationHistory = (records) => {
      return records
        .filter(record => record.institution) // Only include filled records
        .map(record => `
          <tr>
            <td style="border: 1px solid #FFD700; padding: 8px; color: #ffffff; background-color: #1a1a1a;">${record.institution}</td>
            <td style="border: 1px solid #FFD700; padding: 8px; color: #ffffff; background-color: #1a1a1a;">${record.subject}</td>
            <td style="border: 1px solid #FFD700; padding: 8px; color: #ffffff; background-color: #1a1a1a;">${record.qualification}</td>
            <td style="border: 1px solid #FFD700; padding: 8px; color: #ffffff; background-color: #1a1a1a;">${record.dateGained}</td>
          </tr>
        `).join('');
    };

    // Format training records for email
    const formatTrainingHistory = (records) => {
      return records
        .filter(record => record.course) // Only include filled records
        .map(record => `
          <tr>
            <td style="border: 1px solid #FFD700; padding: 8px; color: #ffffff; background-color: #1a1a1a;">${record.course}</td>
            <td style="border: 1px solid #FFD700; padding: 8px; color: #ffffff; background-color: #1a1a1a;">${record.date}</td>
          </tr>
        `).join('');
    };

    // Format references for email
    const formatReferences = (refs) => {
      return refs
        .filter(ref => ref.name) // Only include filled references
        .map((ref, index) => `
          <div style="margin-bottom: 15px; padding: 10px; background-color: #1a1a1a; border: 1px solid #FFD700; border-radius: 5px;">
            <h4 style="color: #FFD700; margin-top: 0;">Reference ${index + 1}</h4>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Name:</strong> ${ref.name}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Position:</strong> ${ref.position}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Organization:</strong> ${ref.organization}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Address:</strong> ${ref.address}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Telephone:</strong> ${ref.telephone}</p>
          </div>
        `).join('');
    };

    // Prepare attachments for SendGrid
    const sgAttachments = [];
    if (resume) {
      sgAttachments.push({
        content: resume, // Base64 encoded string
        filename: 'resume.pdf',
        type: 'application/pdf',
        disposition: 'attachment',
      });
    }
    if (additionalDocuments && additionalDocuments.length > 0) {
      additionalDocuments.forEach((doc, index) => {
        // Assuming doc.content is Base64 and doc.filename exists
        sgAttachments.push({
          content: doc.content,
          filename: doc.filename || `document_${index + 1}.pdf`,
          type: doc.type || 'application/octet-stream', // Default to generic if type not provided
          disposition: 'attachment',
        });
      });
    }

    const msg = {
      to: process.env.HR_EMAIL, // Your HR email address
      from: process.env.SENDGRID_SENDER_EMAIL, // Must be a verified sender in SendGrid
      subject: `New Job Application: ${jobTitle} - ${firstName} ${lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background-color: #000000; color: #ffffff; padding: 20px;">
          <h1 style="color: #FFD700; border-bottom: 2px solid #FFD700; padding-bottom: 10px; margin-top: 0;">
            New Job Application
          </h1>

          <h2 style="color: #FFD700; margin-top: 30px;">Position Applied For</h2>
          <div style="background-color: #1a1a1a; padding: 15px; border-radius: 5px; border: 1px solid #FFD700;">
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Job Title:</strong> ${jobTitle}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Department/Region:</strong> ${department || 'Not specified'}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Reference Number:</strong> ${referenceNumber || 'Not specified'}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Advertisement Source:</strong> ${advertisementSource || 'Not specified'}</p>
          </div>

          <h2 style="color: #FFD700; margin-top: 30px;">Applicant Details</h2>
          <div style="background-color: #1a1a1a; padding: 15px; border-radius: 5px; border: 1px solid #FFD700;">
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Name:</strong> ${title} ${firstName} ${lastName}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Email:</strong> ${email}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Address:</strong> ${homeAddress}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Zip Code:</strong> ${zipCode}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Home Phone:</strong> ${homePhone || 'Not provided'}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Work Phone:</strong> ${workPhone || 'Not provided'}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Mobile Phone:</strong> ${mobilePhone || 'Not provided'}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Driving License:</strong> ${hasDriversLicense ? 'Yes' : 'No'}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Medical Conditions:</strong> ${hasMedicalCondition ? 'Yes (see separate form)' : 'No'}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Work Restrictions:</strong> ${hasWorkRestrictions ? 'Yes' : 'No'}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Notice Required:</strong> ${noticeRequired || 'Not specified'}</p>
          </div>

          <h2 style="color: #FFD700; margin-top: 30px;">Employment History</h2>
          ${formatEmploymentHistory(employmentRecords || [])}

          <h2 style="color: #FFD700; margin-top: 30px;">Education</h2>
          ${educationRecords && educationRecords.some(rec => rec.institution) ? `
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background-color: #FFD700; color: #000000;">
                  <th style="border: 1px solid #FFD700; padding: 8px; font-weight: bold;">Institution</th>
                  <th style="border: 1px solid #FFD700; padding: 8px; font-weight: bold;">Subject</th>
                  <th style="border: 1px solid #FFD700; padding: 8px; font-weight: bold;">Qualification</th>
                  <th style="border: 1px solid #FFD700; padding: 8px; font-weight: bold;">Date</th>
                </tr>
              </thead>
              <tbody>
                ${formatEducationHistory(educationRecords)}
              </tbody>
            </table>
          ` : '<p style="color: #ffffff;">No education records provided</p>'}

          <h2 style="color: #FFD700; margin-top: 30px;">Training</h2>
          ${trainingRecords && trainingRecords.some(rec => rec.course) ? `
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background-color: #FFD700; color: #000000;">
                  <th style="border: 1px solid #FFD700; padding: 8px; font-weight: bold;">Course</th>
                  <th style="border: 1px solid #FFD700; padding: 8px; font-weight: bold;">Date</th>
                </tr>
              </thead>
              <tbody>
                ${formatTrainingHistory(trainingRecords)}
              </tbody>
            </table>
          ` : '<p style="color: #ffffff;">No training records provided</p>'}

          <h2 style="color: #FFD700; margin-top: 30px;">Experience & Skills</h2>
          <div style="background-color: #1a1a1a; padding: 15px; border-radius: 5px; border: 1px solid #FFD700;">
            <p style="white-space: pre-wrap; color: #ffffff;">${experienceSkills || 'Not provided'}</p>
          </div>

          <h2 style="color: #FFD700; margin-top: 30px;">References</h2>
          ${formatReferences(references || [])}

          <h2 style="color: #FFD700; margin-top: 30px;">Legal Information</h2>
          <div style="background-color: #1a1a1a; padding: 15px; border-radius: 5px; border: 1px solid #FFD700;">
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Criminal Convictions:</strong> ${hasCriminalConvictions ? 'Yes' : 'No'}</p>
            <p style="color: #ffffff;"><strong style="color: #FFD700;">Drug & Alcohol Policy Acknowledged:</strong> ${drugAlcoholPolicyAcknowledged ? 'Yes' : 'No'}</p>
          </div>

          <div style="margin-top: 30px; padding: 15px; background-color: #1a1a1a; border-radius: 5px; border: 1px solid #FFD700;">
            <p style="margin: 0; font-size: 12px; color: #FFD700;">
              Application submitted on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      `,
      attachments: sgAttachments,
    };

    await sgMail.send(msg);

    res.json({
      success: true,
      message: 'Application submitted successfully!'
    });

  } catch (error) {
    console.error('SendGrid Email Error (Job Application):', error.response ? error.response.body : error);
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

    const msg = {
      to: process.env.CONTACT_EMAIL, // Your contact email address
      from: process.env.SENDGRID_SENDER_EMAIL, // Must be a verified sender in SendGrid
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
      replyTo: email,
    };

    await sgMail.send(msg);

    console.log('SendGrid Email sent successfully (Contact Form)!');

    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('SendGrid Email Error (Contact Form):', error.response ? error.response.body : error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Email server running on port ${PORT}`);
});