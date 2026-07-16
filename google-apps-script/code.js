// Configuration
const SPREADSHEET_ID = "13Rjro-IgQ2SjPtMnZpXyHZ1NvMMHNJjklCzfOE6c2UI";
const DRIVE_ROOT_FOLDER_NAME = "Citadyo Uploads";
const DEFAULT_STATUS = "Pending";

// Main POST entry point
function doPost(e) {
  try {
    const requestBody = JSON.parse(e.postData.contents);
    const action = requestBody.action;

    if (!action) {
      return createJsonResponse({ success: false, error: "Action is required" });
    }

    const spreadsheet = getSpreadsheet();
    let result;


    switch (action) {
      case 'waitlist':
        result = handleWaitlist(requestBody, spreadsheet);
        break;
      case 'investor':
        result = handleInvestor(requestBody, spreadsheet);
        break;
      case 'associate':
        result = handleAssociate(requestBody, spreadsheet);
        break;
      case 'driver':
        result = handleDriver(requestBody, spreadsheet);
        break;
      case 'rental':
        result = handleRental(requestBody, spreadsheet);
        break;
      case 'delivery':
        result = handleDelivery(requestBody, spreadsheet);
        break;
      case 'arrival':
        result = handleArrival(requestBody, spreadsheet);
        break;
      case 'askSenior':
        result = handleAskSenior(requestBody, spreadsheet);
        break;
      case 'users':
        return handleUsers(requestBody, spreadsheet);
      case 'getUser':
        result = handleGetUser(requestBody, spreadsheet);
        break;
      case 'updatePhone':
        return handleUpdatePhone(requestBody, spreadsheet);
      case 'updateProfile':
        result = handleUpdateProfile(requestBody, spreadsheet);
        break;
      case 'supportRequest':
        result = handleSupportRequest(requestBody, spreadsheet);
        break;
      case 'saveChatMessage':
        result = handleSaveChatMessage(requestBody, spreadsheet);
        break;
      default:
        return createJsonResponse({ success: false, error: "Invalid action: " + action });
    }

    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

// Enable CORS for GET requests (test endpoint)
function doGet(e) {
  return createJsonResponse({ success: true, message: "Citadyo Apps Script API is active" });
}

// ----------------------------------------------------
// Handlers for each endpoint
// ----------------------------------------------------

function handleWaitlist(data, spreadsheet) {
  validateFields(data, ['name', 'email']);

  const submissionId = Utilities.getUuid();
  const timestamp = new Date();

  const headers = ["Submission ID", "Timestamp", "Full Name", "Email", "Destination City", "Status"];
  const rowData = {
    "Submission ID": submissionId,
    "Timestamp": timestamp,
    "Full Name": data.name,
    "Email": data.email,
    "Destination City": data.destination_city || "",
    "Status": DEFAULT_STATUS
  };

  appendRowToSheet("Waitlist", headers, rowData, spreadsheet);
  return { success: true, submissionId: submissionId };
}

function handleInvestor(data, spreadsheet) {
  validateFields(data, ['name', 'email']);

  const submissionId = Utilities.getUuid();
  const timestamp = new Date();

  const headers = [
    "Submission ID", "Timestamp", "Full Name", "Email", "Phone", "WhatsApp Number",
    "LinkedIn URL", "Location", "Organization", "Role", "Profile", "Invested Before",
    "Interest", "Contact Preference", "Status"
  ];

  const rowData = {
    "Submission ID": submissionId,
    "Timestamp": timestamp,
    "Full Name": data.name,
    "Email": data.email,
    "Phone": data.phone || "",
    "WhatsApp Number": data.whatsapp_number || "",
    "LinkedIn URL": data.linkedin_url || "",
    "Location": data.location || "",
    "Organization": data.organization || "",
    "Role": data.role || "",
    "Profile": data.profile || "",
    "Invested Before": data.invested_before || "",
    "Interest": data.interest || "",
    "Contact Preference": data.contact_preference || "",
    "Status": DEFAULT_STATUS
  };

  appendRowToSheet("Investors", headers, rowData, spreadsheet);
  return { success: true, submissionId: submissionId };
}

function handleAssociate(data, spreadsheet) {
  validateFields(data, ['name', 'email', 'phone', 'city_area', 'declaration']);

  const submissionId = Utilities.getUuid();
  const timestamp = new Date();

  let driveUrl = "";
  if (data.profile_type === 'student' && data.collegeIdFile) {
    driveUrl = uploadFileToDrive(data.collegeIdFile, "Associates");
  }

  const headers = [
    "Submission ID", "Timestamp", "Full Name", "Email", "Phone", "City Area",
    "Native Place", "Gender", "Profile Type", "College", "Company", "Role",
    "Experience Years", "Primary Language", "Secondary Language", "Other Languages",
    "Driving License?", "Vehicle Type", "Motivation", "Declaration", "College ID Drive URL", "Status"
  ];

  const rowData = {
    "Submission ID": submissionId,
    "Timestamp": timestamp,
    "Full Name": data.name,
    "Email": data.email,
    "Phone": data.phone,
    "City Area": data.city_area,
    "Native Place": data.native_place || "",
    "Gender": data.gender || "",
    "Profile Type": data.profile_type || "",
    "College": data.college || "",
    "Company": data.company || "",
    "Role": data.role || "",
    "Experience Years": data.experience_years || "",
    "Primary Language": data.primary_language || "",
    "Secondary Language": data.secondary_language || "",
    "Other Languages": data.other_languages || "",
    "Driving License?": data.driving ? "Yes" : "No",
    "Vehicle Type": data.vehicle || "",
    "Motivation": data.motivation || "",
    "Declaration": data.declaration ? "Agreed" : "No",
    "College ID Drive URL": driveUrl,
    "Status": DEFAULT_STATUS
  };

  appendRowToSheet("Associates", headers, rowData, spreadsheet);
  return { success: true, submissionId: submissionId, fileUrl: driveUrl };
}

function handleDriver(data, spreadsheet) {
  validateFields(data, ['name', 'phone', 'city_area', 'native_place', 'vehicle_number', 'car_model', 'vehicle_type', 'fuel_type', 'ac_type', 'experience_years', 'airport_experience', 'work_preference', 'primary_language', 'secondary_language', 'declaration']);

  const submissionId = Utilities.getUuid();
  const timestamp = new Date();

  let driveUrl = "";
  if (data.licenseFile) {
    driveUrl = uploadFileToDrive(data.licenseFile, "Drivers");
  }

  const headers = [
    "Submission ID", "Timestamp", "Full Name", "Phone", "Email", "Gender",
    "City Area", "Native Place", "Vehicle Number", "Car Model", "Vehicle Type",
    "Fuel Type", "AC Type", "Experience Years", "Airport Experience", "Work Preference",
    "Primary Language", "Secondary Language", "Other Languages", "License Drive URL", "Declaration", "Status"
  ];

  const rowData = {
    "Submission ID": submissionId,
    "Timestamp": timestamp,
    "Full Name": data.name,
    "Phone": data.phone,
    "Email": data.email || "",
    "Gender": data.gender || "",
    "City Area": data.city_area,
    "Native Place": data.native_place,
    "Vehicle Number": data.vehicle_number,
    "Car Model": data.car_model,
    "Vehicle Type": data.vehicle_type,
    "Fuel Type": data.fuel_type,
    "AC Type": data.ac_type,
    "Experience Years": data.experience_years,
    "Airport Experience": data.airport_experience ? "Yes" : "No",
    "Work Preference": data.work_preference,
    "Primary Language": data.primary_language,
    "Secondary Language": data.secondary_language,
    "Other Languages": data.other_languages || "",
    "License Drive URL": driveUrl,
    "Declaration": data.declaration ? "Agreed" : "No",
    "Status": DEFAULT_STATUS
  };

  appendRowToSheet("Drivers", headers, rowData, spreadsheet);
  return { success: true, submissionId: submissionId, fileUrl: driveUrl };
}

function handleRental(data, spreadsheet) {
  validateFields(data, ['company_name', 'owner_name', 'phone', 'city_area', 'address', 'service_type', 'vehicle_count', 'declaration']);

  const submissionId = Utilities.getUuid();
  const timestamp = new Date();

  // Create folder structure if files ever get added in the future
  let driveUrl = "";
  if (data.rentalFile) {
    driveUrl = uploadFileToDrive(data.rentalFile, "Rental Partners");
  }

  const headers = [
    "Submission ID", "Timestamp", "Company Name", "Owner Name", "Email", "Phone",
    "City Area", "Address", "Website", "Service Type", "Use Cases", "Vehicle Count",
    "Vehicle Types", "Pilot Ready", "On Demand Ready", "Experience", "Motivation", "Declaration", "Status"
  ];

  const rowData = {
    "Submission ID": submissionId,
    "Timestamp": timestamp,
    "Company Name": data.company_name,
    "Owner Name": data.owner_name,
    "Email": data.email || "",
    "Phone": data.phone,
    "City Area": data.city_area,
    "Address": data.address,
    "Website": data.website || "",
    "Service Type": data.service_type,
    "Use Cases": data.use_cases || "",
    "Vehicle Count": data.vehicle_count,
    "Vehicle Types": data.vehicle_types || "",
    "Pilot Ready": data.pilot_ready ? "Yes" : "No",
    "On Demand Ready": data.on_demand_ready ? "Yes" : "No",
    "Experience": data.experience || "",
    "Motivation": data.motivation || "",
    "Declaration": data.declaration ? "Agreed" : "No",
    "Status": DEFAULT_STATUS
  };

  appendRowToSheet("Rental Partners", headers, rowData, spreadsheet);
  return { success: true, submissionId: submissionId };
}

function handleDelivery(data, spreadsheet) {
  validateFields(data, ['name', 'phone', 'city_area', 'native_place', 'vehicle_type', 'vehicle_number', 'vehicle_model', 'capacity', 'delivery_ready', 'areas', 'availability', 'experience']);

  const submissionId = Utilities.getUuid();
  const timestamp = new Date();

  const headers = [
    "Submission ID", "Timestamp", "Full Name", "Phone", "Email", "City Area",
    "Native Place", "Vehicle Type", "Vehicle Number", "Vehicle Model", "Capacity",
    "Delivery Ready", "Preferred Areas", "Availability", "Experience Years", "Status"
  ];

  const rowData = {
    "Submission ID": submissionId,
    "Timestamp": timestamp,
    "Full Name": data.name,
    "Phone": data.phone,
    "Email": data.email || "",
    "City Area": data.city_area,
    "Native Place": data.native_place,
    "Vehicle Type": data.vehicle_type,
    "Vehicle Number": data.vehicle_number,
    "Vehicle Model": data.vehicle_model,
    "Capacity": data.capacity,
    "Delivery Ready": data.delivery_ready || "",
    "Preferred Areas": data.areas,
    "Availability": data.availability,
    "Experience Years": data.experience,
    "Status": DEFAULT_STATUS
  };

  appendRowToSheet("Delivery Partners", headers, rowData, spreadsheet);
  return { success: true, submissionId: submissionId };
}

function handleArrival(data, spreadsheet) {
  // Generic handler storing all form data (keys/values) as JSON
  const submissionId = Utilities.getUuid();
  const timestamp = new Date();

  const headers = ["Submission ID", "Timestamp", "Payload JSON", "Status"];
  const rowData = {
    "Submission ID": submissionId,
    "Timestamp": timestamp,
    "Payload JSON": JSON.stringify(data),
    "Status": DEFAULT_STATUS
  };

  appendRowToSheet("Arrival Assistance", headers, rowData, spreadsheet);
  return { success: true, submissionId: submissionId };
}

function handleAskSenior(data, spreadsheet) {
  // Generic handler storing all form data as JSON
  const submissionId = Utilities.getUuid();
  const timestamp = new Date();

  const headers = ["Submission ID", "Timestamp", "Payload JSON", "Status"];
  const rowData = {
    "Submission ID": submissionId,
    "Timestamp": timestamp,
    "Payload JSON": JSON.stringify(data),
    "Status": DEFAULT_STATUS
  };

  appendRowToSheet("Ask A Senior", headers, rowData, spreadsheet);
  return { success: true, submissionId: submissionId };
}

// ----------------------------------------------------
// Helper functions
// ----------------------------------------------------

function validateFields(data, requiredFields) {
  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (data[field] === undefined || data[field] === null || (typeof data[field] === 'string' && data[field].trim().length === 0)) {
      throw new Error("Missing required field: " + field);
    }
  }
}

function appendRowToSheet(sheetName, headers, rowData, spreadsheet) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  } else {
    // Dynamically insert missing columns for backward compatibility / updates
    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    headers.forEach(targetCol => {
      if (currentHeaders.indexOf(targetCol) === -1) {
        // If it's "Fuel Type", insert immediately after "Vehicle Type"
        if (targetCol === "Fuel Type") {
          const vehicleTypeIdx = currentHeaders.indexOf("Vehicle Type");
          if (vehicleTypeIdx !== -1) {
            sheet.insertColumnAfter(vehicleTypeIdx + 1);
            sheet.getRange(1, vehicleTypeIdx + 2).setValue("Fuel Type").setFontWeight("bold");
            // Refresh current headers inline
            currentHeaders.splice(vehicleTypeIdx + 1, 0, "Fuel Type");
          } else {
            sheet.getRange(1, sheet.getLastColumn() + 1).setValue(targetCol).setFontWeight("bold");
            currentHeaders.push(targetCol);
          }
        } else {
          sheet.getRange(1, sheet.getLastColumn() + 1).setValue(targetCol).setFontWeight("bold");
          currentHeaders.push(targetCol);
        }
      }
    });
  }

  // Re-read current headers of sheet to map rowData keys perfectly in order
  const finalHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowValues = finalHeaders.map(header => {
    return rowData[header] !== undefined ? rowData[header] : "";
  });

  sheet.appendRow(rowValues);
}

function uploadFileToDrive(fileData, subfolderName) {
  if (!fileData || !fileData.base64 || !fileData.name) {
    return "";
  }

  // Find or create root folder
  let rootFolder;
  const rootFolders = DriveApp.getFoldersByName(DRIVE_ROOT_FOLDER_NAME);
  if (rootFolders.hasNext()) {
    rootFolder = rootFolders.next();
  } else {
    rootFolder = DriveApp.createFolder(DRIVE_ROOT_FOLDER_NAME);
  }

  // Find or create subfolder
  let subfolder;
  const subfolders = rootFolder.getFoldersByName(subfolderName);
  if (subfolders.hasNext()) {
    subfolder = subfolders.next();
  } else {
    subfolder = rootFolder.createFolder(subfolderName);
  }

  // Generate unique filename
  const timestamp = new Date().getTime();
  const randomStr = Math.random().toString(36).substring(2, 7);
  const uniqueName = timestamp + "_" + randomStr + "_" + fileData.name;

  // Decode Base64 and create file
  const decodedBytes = Utilities.base64Decode(fileData.base64);
  const blob = Utilities.newBlob(decodedBytes, fileData.mimeType || 'application/octet-stream', uniqueName);
  const file = subfolder.createFile(blob);

  // Set sharing so anyone with the link can view it
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return file.getUrl();
}

function getSpreadsheet() {
  if (typeof SPREADSHEET_ID !== 'undefined' && SPREADSHEET_ID.trim().length > 0) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    return active;
  }
  throw new Error("Unable to obtain Google Sheet reference. Please define SPREADSHEET_ID at the top of your script.");
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleGetUser(data, spreadsheet) {
  validateFields(data, ['uid']);
  const sheet = spreadsheet.getSheetByName("Users");
  if (!sheet) {
    return { success: true, exists: false };
  }

  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    return { success: true, exists: false };
  }

  const headers = rows[0];
  let uidIndex = headers.indexOf("FirebaseUID");
  if (uidIndex === -1) {
    uidIndex = headers.indexOf("Firebase UID");
  }
  if (uidIndex === -1) {
    return { success: true, exists: false };
  }

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][uidIndex] == data.uid) {
      // Build user object from row
      const user = {};
      headers.forEach((header, idx) => {
        user[header] = rows[i][idx];
      });
      return { success: true, exists: true, user: user };
    }
  }

  return { success: true, exists: false };
}

function handleUsers(data, spreadsheet) {
  validateFields(data, ['uid', 'name', 'email']);

  let sheet = spreadsheet.getSheetByName("Users");
  const headers = [
    "FirebaseUID", "GoogleName", "PreferredName", "Email", "Phone", "PhoneVerified",
    "DestinationCity", "MoveStatus", "UserType", "College", "Company", "MemberSince",
    "LastLogin", "ProfileComplete"
  ];

  if (!sheet) {
    sheet = spreadsheet.insertSheet("Users");
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  } else {
    // Ensure all target columns exist in case we are running on an older sheet
    const existingHeaders = sheet.getDataRange().getValues()[0];
    headers.forEach(h => {
      if (existingHeaders.indexOf(h) === -1) {
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h).setFontWeight("bold");
      }
    });
  }

  // Re-read rows & active headers after any migrations
  const rows = sheet.getDataRange().getValues();
  const currentHeaders = rows[0];
  const uidIndex = currentHeaders.indexOf("FirebaseUID");
  const lastLoginIndex = currentHeaders.indexOf("LastLogin");

  if (uidIndex === -1) {
    throw new Error("FirebaseUID column is missing in Users sheet.");
  }

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][uidIndex] == data.uid) {
      rowIndex = i + 1;
      break;
    }
  }

  const isNewUser = (rowIndex === -1);

  if (isNewUser) {
    const rowData = {
      "FirebaseUID": data.uid,
      "GoogleName": data.name,
      "PreferredName": "",
      "Email": data.email,
      "Phone": "",
      "PhoneVerified": false,
      "DestinationCity": "",
      "MoveStatus": "",
      "UserType": "",
      "College": "",
      "Company": "",
      "MemberSince": new Date(),
      "LastLogin": new Date(),
      "ProfileComplete": "20%" // Email is verified, which is 20% complete initial status
    };

    const rowValues = currentHeaders.map(header => {
      return rowData[header] !== undefined ? rowData[header] : "";
    });

    sheet.appendRow(rowValues);
  } else {
    // Update Last Login
    if (lastLoginIndex !== -1) {
      sheet.getRange(rowIndex, lastLoginIndex + 1).setValue(new Date());
    }
  }

  return createJsonResponse({
    success: true,
    isNewUser: isNewUser
  });
}

function handleUpdatePhone(data, spreadsheet) {
  validateFields(data, ['uid', 'phone', 'phoneVerified']);

  const sheet = spreadsheet.getSheetByName("Users");
  if (!sheet) {
    return createJsonResponse({ success: false, error: "Users sheet not found" });
  }

  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    return createJsonResponse({ success: false, error: "No user records found" });
  }

  const headers = rows[0];
  const uidIndex = headers.indexOf("FirebaseUID");
  const phoneIndex = headers.indexOf("Phone");
  const verifiedIndex = headers.indexOf("PhoneVerified");
  const verifiedAtIndex = headers.indexOf("VerifiedAt");

  if (uidIndex === -1) {
    return createJsonResponse({ success: false, error: "FirebaseUID column not found" });
  }

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][uidIndex] == data.uid) {
      const rowNum = i + 1;

      if (phoneIndex !== -1) {
        sheet.getRange(rowNum, phoneIndex + 1).setValue(data.phone);
      }
      if (verifiedIndex !== -1) {
        sheet.getRange(rowNum, verifiedIndex + 1).setValue(data.phoneVerified);
      }
      if (verifiedAtIndex !== -1) {
        sheet.getRange(rowNum, verifiedAtIndex + 1).setValue(data.verifiedAt || new Date());
      }

      return createJsonResponse({ success: true });
    }
  }

  return createJsonResponse({ success: false, error: "User not found" });
}

function handleSupportRequest(data, spreadsheet) {
  validateFields(data, ['ticketId', 'name', 'email', 'contactMethod', 'message', 'currentPage']);

  const headers = [
    "TicketID", "UID", "Name", "Email", "Phone", "ContactMethod", "Category", "Message", "CurrentPage", "CreatedAt", "AssignedTo", "Priority", "Status"
  ];

  const rowData = {
    "TicketID": data.ticketId,
    "UID": data.uid || "Guest",
    "Name": data.name,
    "Email": data.email,
    "Phone": data.phone || "N/A",
    "ContactMethod": data.contactMethod,
    "Category": data.category || "General Support",
    "Message": data.message,
    "CurrentPage": data.currentPage,
    "CreatedAt": new Date(),
    "AssignedTo": "Unassigned",
    "Priority": "Medium",
    "Status": DEFAULT_STATUS
  };

  appendRowToSheet("SupportRequests", headers, rowData, spreadsheet);
  return { success: true };
}

function handleSaveChatMessage(data, spreadsheet) {
  validateFields(data, ['conversationId', 'ticketId', 'sender', 'message', 'timestamp']);

  const headers = [
    "ConversationID", "TicketID", "Sender", "Message", "Timestamp"
  ];

  const rowData = {
    "ConversationID": data.conversationId,
    "TicketID": data.ticketId,
    "Sender": data.sender,
    "Message": data.message,
    "Timestamp": data.timestamp || new Date()
  };

  appendRowToSheet("ChatMessages", headers, rowData, spreadsheet);
  return { success: true };
}

function handleUpdateProfile(data, spreadsheet) {
  validateFields(data, ['uid', 'name']);

  const sheet = spreadsheet.getSheetByName("Users");
  if (!sheet) {
    return { success: false, error: "Users sheet not found" };
  }

  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    return { success: false, error: "No user records found" };
  }

  // Ensure new columns exist dynamically
  const headers = rows[0];
  const targetHeaders = ["PreferredName", "DestinationCity", "MoveStatus", "UserType", "College", "Company", "ProfileComplete"];
  let headersUpdated = false;
  targetHeaders.forEach(col => {
    if (headers.indexOf(col) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(col).setFontWeight("bold");
      headers.push(col);
      headersUpdated = true;
    }
  });

  const activeHeaders = headersUpdated ? sheet.getDataRange().getValues()[0] : headers;

  const uidIndex = activeHeaders.indexOf("FirebaseUID");
  const prefNameIndex = activeHeaders.indexOf("PreferredName");
  const cityIndex = activeHeaders.indexOf("DestinationCity");
  const statusIndex = activeHeaders.indexOf("MoveStatus");
  const typeIndex = activeHeaders.indexOf("UserType");
  const collegeIndex = activeHeaders.indexOf("College");
  const companyIndex = activeHeaders.indexOf("Company");
  const completeIndex = activeHeaders.indexOf("ProfileComplete");

  if (uidIndex === -1) {
    return { success: false, error: "FirebaseUID column not found" };
  }

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][uidIndex] == data.uid) {
      const rowNum = i + 1;

      if (prefNameIndex !== -1 && data.preferredName !== undefined) sheet.getRange(rowNum, prefNameIndex + 1).setValue(data.preferredName);
      if (cityIndex !== -1 && data.destinationCity !== undefined) sheet.getRange(rowNum, cityIndex + 1).setValue(data.destinationCity);
      if (statusIndex !== -1 && data.moveStatus !== undefined) sheet.getRange(rowNum, statusIndex + 1).setValue(data.moveStatus);
      if (typeIndex !== -1 && data.userType !== undefined) sheet.getRange(rowNum, typeIndex + 1).setValue(data.userType);
      if (collegeIndex !== -1 && data.college !== undefined) sheet.getRange(rowNum, collegeIndex + 1).setValue(data.college);
      if (companyIndex !== -1 && data.company !== undefined) sheet.getRange(rowNum, companyIndex + 1).setValue(data.company);
      if (completeIndex !== -1 && data.profileComplete !== undefined) sheet.getRange(rowNum, completeIndex + 1).setValue(data.profileComplete);

      return { success: true };
    }
  }

  return { success: false, error: "User not found" };
}
