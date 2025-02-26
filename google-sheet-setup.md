# Google Sheets Integration Setup Guide

This guide will walk you through setting up your Shred Athletics contact form to submit data directly to a Google Sheet.

## Step 1: Create a New Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and sign in with your Google account
2. Create a new spreadsheet by clicking on the "+" button
3. Name your spreadsheet "Shred Athletics Contact Form Submissions"
4. In row 1, add the following column headers (exactly as written):
   - **A1**: Timestamp
   - **B1**: Name
   - **C1**: Email
   - **D1**: Phone
   - **E1**: Instagram
   - **F1**: Goal
   - **G1**: Message
   - **H1**: Contact Preference

## Step 2: Set Up Google Apps Script

1. In your Google Sheet, click on **Extensions** > **Apps Script**
2. This will open the Apps Script editor in a new tab
3. Delete any code that appears in the editor
4. Copy and paste the following code:

```javascript
// This function runs once to save your spreadsheet ID
function initialSetup() {
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('sheetId', SpreadsheetApp.getActiveSpreadsheet().getId());
}

// This function handles POST requests from your website
function doPost(e) {
  try {
    // Get the sheet ID from properties
    const properties = PropertiesService.getScriptProperties();
    const sheetId = properties.getProperty('sheetId');
    
    // If no sheet ID is saved, use the active spreadsheet
    const ss = sheetId ? 
      SpreadsheetApp.openById(sheetId) : 
      SpreadsheetApp.getActiveSpreadsheet();
    
    const sheet = ss.getSheetByName('Sheet1');
    
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Create a timestamp
    const timestamp = new Date().toLocaleString();
    
    // Prepare the data row
    const row = [
      timestamp,
      data.name || '',
      data.email || '',
      data.phone || '',
      data.instagram || '',
      data.goal || '',
      data.message || '',
      data.contactPreference || ''
    ];
    
    // Append the data to the sheet
    sheet.appendRow(row);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

5. Click on **Save** and name your project "Shred Athletics Form Handler"

## Step 3: Run the Initial Setup

1. In the Apps Script editor, select the `initialSetup` function from the dropdown menu next to the "Debug" button
2. Click the **Run** button (play icon)
3. You'll be asked to authorize the script - follow the prompts to allow access
4. This step saves your spreadsheet ID to the script properties

## Step 4: Deploy as Web App

1. In the Apps Script editor, click on **Deploy** > **New deployment**
2. For the deployment type, select **Web app**
3. Fill in the following:
   - Description: "Shred Athletics Form Handler"
   - Execute as: "Me"
   - Who has access: "Anyone"
4. Click **Deploy**
5. Copy the Web app URL that appears - you'll need this for your website

## Step 5: Update Your Website

1. Open the `script.js` file in your website files
2. Find the line that contains `const scriptURL = '';` (around line 50)
3. Paste your Web app URL between the quotes, so it looks like:
   ```javascript
   const scriptURL = 'https://script.google.com/macros/s/your-unique-script-id/exec';
   ```
4. Save the file

## Step 6: Test the Form

1. Open your website and fill out the contact form
2. Submit the form
3. Check your Google Sheet - a new row should appear with the submitted data
4. If successful, you'll be redirected to the thank-you page

## Troubleshooting

If your form submissions aren't appearing in your Google Sheet:

1. **Check the Console**: Open your browser's developer tools (F12) and look for any errors in the console
2. **Verify the Script URL**: Make sure you've copied the correct URL from the Apps Script deployment
3. **Check CORS Issues**: If you see CORS errors, make sure your website is being served from a web server, not opened as a local file
4. **Verify Column Headers**: Ensure the column headers in your Google Sheet exactly match the field names in the code
5. **Check Script Permissions**: Make sure you've authorized the script to access your Google Sheets

## Important Notes

1. **Local Testing**: The form submission to Google Sheets will only work when your website is served through a web server, not when opened directly as a file
2. **Redeployment**: If you make changes to the Apps Script code, you'll need to create a new deployment and update the URL in your website
3. **Quota Limits**: Google Apps Script has usage quotas - if you expect high volume, consider alternative solutions
4. **Data Privacy**: Be aware that form data will be stored in your Google Sheet - handle personal information according to relevant privacy laws

## Next Steps

Once your form is successfully submitting data to Google Sheets, you can:

1. **Customize the Sheet**: Add formatting, filters, or conditional formatting to better organize submissions
2. **Set Up Notifications**: Use Google Sheets' built-in notification rules to get alerts for new submissions
3. **Share Access**: Share the Google Sheet with team members who need to see the submissions
4. **Data Analysis**: Use Google Sheets' features to analyze submission trends over time