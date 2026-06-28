/**
 * Document Task Management System
 * Server-side GAS Script (Code.gs)
 * Optimized for maximum performance (minimized API calls to Google Services)
 */

// Global variable to cache spreadsheet object within the same execution context
var cachedSpreadsheet = null;

// Custom web app entry point
function doGet(e) {
  // Ensure database sheets exist (only checked once on page load)
  try { initDatabase(); } catch(initErr) { console.error('initDatabase error: ' + initErr.message); }
  
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Quản lý Văn bản & Công việc')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Utility function to include external HTML template files (CSS, JS)
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Helper to get the Spreadsheet.
 * Caches spreadsheet object to avoid multiple expensive openById calls.
 */
function getSpreadsheet() {
  if (cachedSpreadsheet) return cachedSpreadsheet;
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) {
      cachedSpreadsheet = ss;
      return ss;
    }
  } catch (e) {
    // Catch error if not container-bound
  }
  
  // =========================================================================
  // NẾU BẠN TẠO APPS SCRIPT ĐỘC LẬP (Trực tiếp từ trang script.google.com):
  // Hãy thay thế chuỗi dưới đây bằng ID Google Sheet của bạn.
  // =========================================================================
  var SPREADSHEET_ID = '1DEmjC5YpuWhgeQWBA2mmhhcBBX1StcNrcigZLAsLadU'; 
  
  cachedSpreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  return cachedSpreadsheet;
}

/**
 * Initialize Google Sheets as the database
 * Creates sheets and headers if they do not exist
 */
function initDatabase() {
  var ss = getSpreadsheet();
  
  // 1. Documents Sheet
  var docSheet = ss.getSheetByName('Documents');
  if (!docSheet) {
    docSheet = ss.insertSheet('Documents');
    docSheet.appendRow(['ID', 'Receive Date', 'Document Number', 'Document Name', 'Description', 'Deadline', 'Progress', 'Status']);
    docSheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#f3f4f6');
  }
  
  // 2. SubTasks Sheet
  var taskSheet = ss.getSheetByName('SubTasks');
  if (!taskSheet) {
    taskSheet = ss.insertSheet('SubTasks');
    taskSheet.appendRow(['ID', 'Document ID', 'Title', 'Assignee', 'Deadline', 'Status', 'Event ID']);
    taskSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f3f4f6');
  } else {
    var tHeaders = taskSheet.getRange(1, 1, 1, taskSheet.getLastColumn()).getValues()[0];
    if (tHeaders.indexOf('Event ID') === -1) {
      taskSheet.getRange(1, tHeaders.length + 1).setValue('Event ID').setFontWeight('bold').setBackground('#f3f4f6');
    }
  }
  
  // 3. Employees Sheet
  var empSheet = ss.getSheetByName('Employees');
  if (!empSheet) {
    empSheet = ss.insertSheet('Employees');
    empSheet.appendRow(['ID', 'Name', 'Department']);
    empSheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#f3f4f6');
    
    // Add default sample employees
    empSheet.appendRow(['EMP-1', 'Nguyễn Văn A', 'Phòng Kỹ thuật']);
  }
  
  // 4. Settings Sheet
  var settingsSheet = ss.getSheetByName('Settings');
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet('Settings');
    settingsSheet.appendRow(['Key', 'Value']);
    settingsSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#f3f4f6');
    
    // Default settings
    settingsSheet.appendRow(['reminderTime', '08:00']);
    settingsSheet.appendRow(['warningDays', '3']);
    settingsSheet.appendRow(['emailEnabled', 'true']);
    settingsSheet.appendRow(['popupEnabled', 'true']);
    settingsSheet.appendRow(['calendarEnabled', 'false']);
    settingsSheet.appendRow(['calendarReminderMinutes', '60']);
  } else {
    var sData = settingsSheet.getDataRange().getValues();
    var hasCal = false;
    var hasCalRem = false;
    for(var i=0; i<sData.length; i++) {
      if(sData[i][0] === 'calendarEnabled') hasCal = true;
      if(sData[i][0] === 'calendarReminderMinutes') hasCalRem = true;
    }
    if(!hasCal) settingsSheet.appendRow(['calendarEnabled', 'false']);
    if(!hasCalRem) settingsSheet.appendRow(['calendarReminderMinutes', '60']);
  }
}

/**
 * Fetch all sheets data in a single payload
 */
function getInitialData(ss) {
  if (!ss) ss = getSpreadsheet();
  return {
    documents: getDocumentsList(ss),
    subTasks: getSubTasksList(ss),
    employees: getEmployeesList(ss),
    settings: getSettingsData(ss)
  };
}

// --- HELPER FOR SHEET READ/WRITE ---

function readSheetAsJson(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  
  var headers = values[0];
  var result = [];
  
  for (var i = 1; i < values.length; i++) {
    var obj = {};
    var row = values[i];
    var hasData = false;
    
    for (var j = 0; j < headers.length; j++) {
      var cellVal = row[j];
      
      // Handle Date cells: convert to YYYY-MM-DD
      if (cellVal instanceof Date) {
        cellVal = formatDateString(cellVal);
      }
      
      obj[headers[j]] = cellVal;
      if (cellVal !== '' && cellVal !== null && cellVal !== undefined) {
        hasData = true;
      }
    }
    if (hasData) {
      result.push(obj);
    }
  }
  return result;
}

function formatDateString(date) {
  var yyyy = date.getFullYear();
  var mm = String(date.getMonth() + 1).padStart(2, '0');
  var dd = String(date.getDate()).padStart(2, '0');
  var hh = String(date.getHours()).padStart(2, '0');
  var min = String(date.getMinutes()).padStart(2, '0');
  
  if (hh === '00' && min === '00') {
    return yyyy + '-' + mm + '-' + dd;
  } else {
    return yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + min;
  }
}

function parseDateTime(val) {
  if (val instanceof Date) return val;
  if (!val) return null;
  var str = String(val).trim();
  var normalized = str.replace(' ', 'T');
  if (normalized.length === 10) {
    return new Date(normalized + 'T23:59:59');
  }
  return new Date(normalized);
}

// --- GETTERS ---

function getDocumentsList(ss) {
  return readSheetAsJson(ss, 'Documents');
}

function getSubTasksList(ss) {
  return readSheetAsJson(ss, 'SubTasks');
}

function getEmployeesList(ss) {
  return readSheetAsJson(ss, 'Employees');
}

function getSettingsData(ss) {
  var list = readSheetAsJson(ss, 'Settings');
  var settings = {};
  list.forEach(function(row) {
    var val = row.Value;
    if (typeof val === 'string') {
      var lower = val.toLowerCase().trim();
      if (lower === 'true') val = true;
      else if (lower === 'false') val = false;
      else if (val !== '' && !isNaN(val)) val = Number(val);
    }
    settings[row.Key] = val;
  });
  return settings;
}

// --- DOCUMENTS CRUD ---

function addDocument(doc) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Documents');
  var id = 'DOC-' + Date.now() + Math.floor(Math.random() * 100);
  
  var row = [
    id,
    doc.receiveDate,
    doc.docNumber,
    doc.docName,
    doc.description,
    doc.deadline,
    '0%', // Initial progress
    'Mới tạo' // Initial status
  ];
  
  sheet.appendRow(row);
  return getInitialData(ss);
}

function updateDocument(doc) {
  var ss = getSpreadsheet();
  
  // Validate that new document deadline is not earlier than any existing subtask deadlines
  if (doc.deadline) {
    var taskSheet = ss.getSheetByName('SubTasks');
    var tasksData = taskSheet.getDataRange().getValues();
    var newDocDeadlineTime = parseDateTime(doc.deadline).getTime();
    
    for (var i = 1; i < tasksData.length; i++) {
      if (tasksData[i][1] === doc.id && tasksData[i][4]) {
        var subDeadlineTime = parseDateTime(tasksData[i][4]).getTime();
        if (subDeadlineTime > newDocDeadlineTime) {
          throw new Error('Hạn chót văn bản không được sớm hơn hạn chót của các công việc con hiện có!');
        }
      }
    }
  }

  var sheet = ss.getSheetByName('Documents');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === doc.id) {
      var rowNum = i + 1;
      sheet.getRange(rowNum, 2).setValue(doc.receiveDate);
      sheet.getRange(rowNum, 3).setValue(doc.docNumber);
      sheet.getRange(rowNum, 4).setValue(doc.docName);
      sheet.getRange(rowNum, 5).setValue(doc.description);
      sheet.getRange(rowNum, 6).setValue(doc.deadline);
      break;
    }
  }
  return getInitialData(ss);
}

function deleteDocument(docId) {
  var ss = getSpreadsheet();
  
  // Delete document row
  var docSheet = ss.getSheetByName('Documents');
  var docData = docSheet.getDataRange().getValues();
  for (var i = 1; i < docData.length; i++) {
    if (docData[i][0] === docId) {
      docSheet.deleteRow(i + 1);
      break;
    }
  }
  
  // Delete associated subtasks
  var taskSheet = ss.getSheetByName('SubTasks');
  var taskData = taskSheet.getDataRange().getValues();
  // Delete from bottom up to avoid index shifting problems
  for (var j = taskData.length - 1; j >= 1; j--) {
    if (taskData[j][1] === docId) {
      var eventId = taskData[j][6];
      try { if (eventId) syncToCalendar('DELETE', null, eventId); } catch(e) { console.error('Calendar sync failed: ' + e.message); }
      taskSheet.deleteRow(j + 1);
    }
  }
  
  return getInitialData(ss);
}

// --- SUBTASKS CRUD ---

function addSubTask(task) {
  var ss = getSpreadsheet();
  
  // Validate subtask deadline against parent document deadline
  var docSheet = ss.getSheetByName('Documents');
  var docsData = docSheet.getDataRange().getValues();
  var parentDocDeadline = null;
  for (var i = 1; i < docsData.length; i++) {
    if (docsData[i][0] === task.docId) {
      parentDocDeadline = docsData[i][5];
      break;
    }
  }
  
  if (parentDocDeadline && task.deadline) {
    var pTime = parseDateTime(parentDocDeadline).getTime();
    var tTime = parseDateTime(task.deadline).getTime();
    if (tTime > pTime) {
      throw new Error('Hạn chót công việc con không được vượt quá hạn chót của văn bản cha!');
    }
  }

  var sheet = ss.getSheetByName('SubTasks');
  var id = 'TSK-' + Date.now() + Math.floor(Math.random() * 100);
  
  var eventId = '';
  try { eventId = syncToCalendar('CREATE', task, null) || ''; } catch(e) { console.error('Calendar sync failed: ' + e.message); }
  
  var row = [
    id,
    task.docId,
    task.title,
    task.assignee,
    task.deadline,
    'Todo', // Initial status
    eventId
  ];
  
  sheet.appendRow(row);
  recalculateDocProgress(ss, task.docId);
  return getInitialData(ss);
}

function updateSubTask(task) {
  var ss = getSpreadsheet();
  
  // Validate subtask deadline against parent document deadline
  var docSheet = ss.getSheetByName('Documents');
  var docsData = docSheet.getDataRange().getValues();
  var parentDocDeadline = null;
  for (var i = 1; i < docsData.length; i++) {
    if (docsData[i][0] === task.docId) {
      parentDocDeadline = docsData[i][5];
      break;
    }
  }
  
  if (parentDocDeadline && task.deadline) {
    var pTime = parseDateTime(parentDocDeadline).getTime();
    var tTime = parseDateTime(task.deadline).getTime();
    if (tTime > pTime) {
      throw new Error('Hạn chót công việc con không được vượt quá hạn chót của văn bản cha!');
    }
  }

  var sheet = ss.getSheetByName('SubTasks');
  var data = sheet.getDataRange().getValues();
  
  var oldEventId = '';
  var rowNum = -1;
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === task.id) {
      rowNum = i + 1;
      oldEventId = data[i][6];
      break;
    }
  }
  
  if (rowNum > -1) {
    var newEventId = '';
    try { newEventId = syncToCalendar('UPDATE', task, oldEventId) || ''; } catch(e) { console.error('Calendar sync failed: ' + e.message); newEventId = oldEventId || ''; }
    
    sheet.getRange(rowNum, 3).setValue(task.title);
    sheet.getRange(rowNum, 4).setValue(task.assignee);
    sheet.getRange(rowNum, 5).setValue(task.deadline);
    sheet.getRange(rowNum, 6).setValue(task.status);
    
    var lastCol = sheet.getLastColumn();
    if (lastCol < 7) { sheet.getRange(1, 7).setValue('Event ID'); }
    sheet.getRange(rowNum, 7).setValue(newEventId);
  }
  
  recalculateDocProgress(ss, task.docId);
  return getInitialData(ss);
}

function deleteSubTask(taskId, docId) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('SubTasks');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === taskId) {
      var oldEventId = data[i][6];
      try { if (oldEventId) syncToCalendar('DELETE', null, oldEventId); } catch(e) { console.error('Calendar sync failed: ' + e.message); }
      sheet.deleteRow(i + 1);
      break;
    }
  }
  recalculateDocProgress(ss, docId);
  return getInitialData(ss);
}

function toggleSubTaskStatus(taskId, docId, status) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('SubTasks');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === taskId) {
      var oldEventId = data[i][6];
      var action = status === 'Done' ? 'COMPLETE' : 'INCOMPLETE';
      var taskData = {
        docId: data[i][1],
        title: data[i][2],
        assignee: data[i][3],
        deadline: data[i][4]
      };
      try { if (oldEventId) syncToCalendar(action, taskData, oldEventId); } catch(e) { console.error('Calendar sync failed: ' + e.message); }
      
      sheet.getRange(i + 1, 6).setValue(status);
      break;
    }
  }
  recalculateDocProgress(ss, docId);
  return getInitialData(ss);
}

/**
 * Automatically recalculate progress and status of a Document based on its SubTasks
 * Reuses active spreadsheet instance for efficiency
 */
function recalculateDocProgress(ss, docId) {
  var taskSheet = ss.getSheetByName('SubTasks');
  var docSheet = ss.getSheetByName('Documents');
  
  var taskData = taskSheet.getDataRange().getValues();
  var total = 0;
  var done = 0;
  var hasDoing = false;
  
  for (var i = 1; i < taskData.length; i++) {
    if (taskData[i][1] === docId) {
      total++;
      if (taskData[i][5] === 'Done') {
        done++;
      } else if (taskData[i][5] === 'Doing') {
        hasDoing = true;
      }
    }
  }
  
  var progress = total === 0 ? 0 : Math.round((done / total) * 100);
  
  // Determine doc status
  var status = 'Mới tạo';
  if (total > 0) {
    if (done === total) {
      status = 'Hoàn thành';
    } else if (done > 0 || hasDoing) {
      status = 'Đang xử lý';
    } else {
      status = 'Đã phân công';
    }
  }
  
  // Update Document Row
  var docData = docSheet.getDataRange().getValues();
  for (var j = 1; j < docData.length; j++) {
    if (docData[j][0] === docId) {
      var rowNum = j + 1;
      // Set explicit string to prevent sheets converting '100%' to 1.0 (which parses as 1%)
      docSheet.getRange(rowNum, 7).setValue("'" + progress + "%");
      docSheet.getRange(rowNum, 8).setValue(status);
      break;
    }
  }
}

// --- EMPLOYEES CRUD ---

function addEmployee(emp) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Employees');
  var id = 'EMP-' + Date.now();
  sheet.appendRow([id, emp.name, emp.department]);
  return getInitialData(ss);
}

function updateEmployee(emp) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Employees');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === emp.id) {
      var rowNum = i + 1;
      sheet.getRange(rowNum, 2).setValue(emp.name);
      sheet.getRange(rowNum, 3).setValue(emp.department);
      break;
    }
  }
  return getInitialData(ss);
}

function deleteEmployee(empId) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Employees');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === empId) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return getInitialData(ss);
}

// --- CALENDAR SYNCHRONIZATION ---

function syncToCalendar(action, taskData, oldEventId) {
  var ss = getSpreadsheet();
  var settings = getSettingsData(ss);
  if (!settings.calendarEnabled) return oldEventId || null;
  if (!taskData || !taskData.deadline) return oldEventId || null;
  
  var calendar = CalendarApp.getDefaultCalendar();
  if (!calendar) return oldEventId || null;
  
  var eventDate = new Date(taskData.deadline);
  var isAllDay = (taskData.deadline.length <= 10);
  
  var docName = '';
  if (taskData.docId) {
    var docs = getDocumentsList(ss);
    for (var j = 0; j < docs.length; j++) {
      if (docs[j].ID === taskData.docId) {
        docName = docs[j]['Document Name'];
        break;
      }
    }
  }
  var docSuffix = docName ? ' [' + docName + ']' : '';
  var eventTitle = taskData.title + '_' + taskData.assignee + docSuffix;
  
  var managerEmail = settings.emailRecipient || '';
  
  var reminderMin = Number(settings.calendarReminderMinutes);
  if (isNaN(reminderMin)) reminderMin = 60;
  
  try {
    if (action === 'CREATE') {
      var event;
      if (isAllDay) {
        event = calendar.createAllDayEvent(eventTitle, eventDate);
      } else {
        var endDate = new Date(eventDate.getTime() + 15 * 60000);
        event = calendar.createEvent(eventTitle, eventDate, endDate);
      }
      
      if (managerEmail && managerEmail !== Session.getActiveUser().getEmail()) {
        event.addGuest(managerEmail);
      }
      
      event.removeAllReminders();
      event.addPopupReminder(reminderMin);
      
      return event.getId();
      
    } else if (action === 'UPDATE' && oldEventId) {
      var event = calendar.getEventById(oldEventId);
      if (event) {
        event.setTitle(eventTitle);
        if (isAllDay) {
          var curStart = event.getAllDayStartDate();
          if (!curStart || curStart.getTime() !== eventDate.getTime()) {
            event.setAllDayDate(eventDate);
          }
        } else {
          var endDate = new Date(eventDate.getTime() + 15 * 60000);
          event.setTime(eventDate, endDate);
        }
        
        event.removeAllReminders();
        event.addPopupReminder(reminderMin);
      } else {
        var newEvent;
        if (isAllDay) {
          newEvent = calendar.createAllDayEvent(eventTitle, eventDate);
        } else {
          var endDate = new Date(eventDate.getTime() + 15 * 60000);
          newEvent = calendar.createEvent(eventTitle, eventDate, endDate);
        }
        
        if (managerEmail && managerEmail !== Session.getActiveUser().getEmail()) {
          newEvent.addGuest(managerEmail);
        }
        
        newEvent.removeAllReminders();
        newEvent.addPopupReminder(reminderMin);
        return newEvent.getId();
      }
      return oldEventId;
      
    } else if (action === 'DELETE' && oldEventId) {
      var event = calendar.getEventById(oldEventId);
      if (event) event.deleteEvent();
      return null;
      
    } else if (action === 'COMPLETE' && oldEventId) {
      var event = calendar.getEventById(oldEventId);
      if (event) {
        event.setColor(CalendarApp.EventColor.PALE_GREEN);
        event.setTitle('✅ ' + eventTitle);
      }
      return oldEventId;
      
    } else if (action === 'INCOMPLETE' && oldEventId) {
      var event = calendar.getEventById(oldEventId);
      if (event) {
        event.setColor(''); 
        event.setTitle(eventTitle);
      }
      return oldEventId;
    }
  } catch (e) {
    console.error('Calendar error: ' + e.message);
    return oldEventId || null;
  }
  return oldEventId || null;
}

// --- SETTINGS & TRIGGERS ---

function saveSettings(settings) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Settings');
  sheet.clearContents();
  sheet.appendRow(['Key', 'Value']);
  sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#f3f4f6');
  
  for (var key in settings) {
    sheet.appendRow([key, String(settings[key])]);
  }
  
  // Update Time Trigger based on settings
  var timeStr = settings.reminderTime || '08:00';
  var emailEnabled = settings.emailEnabled;
  
  setupTrigger(timeStr, emailEnabled);
  
  return getInitialData(ss);
}

function setupTrigger(timeStr, emailEnabled) {
  var triggerName = 'sendDailyReminders';
  var triggers = ScriptApp.getProjectTriggers();
  
  // Remove existing daily reminder triggers
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === triggerName) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  // Create new one if emails are enabled
  if (emailEnabled && timeStr) {
    var parts = timeStr.split(':');
    var hour = parseInt(parts[0], 10) || 8;
    var minute = parseInt(parts[1], 10) || 0;
    
    // In Google Apps Script, nearMinute requires 0, 15, 30, or 45
    var validMinute = Math.round(minute / 15) * 15;
    if (validMinute === 60) {
      validMinute = 0;
      hour = (hour + 1) % 24;
    }
    
    ScriptApp.newTrigger(triggerName)
      .timeBased()
      .everyDays(1)
      .atHour(hour)
      .nearMinute(validMinute)
      .create();
  }
}

// --- EMAIL NOTIFICATION & REMINDER LOGIC ---

/**
 * Daily cron-job function triggered at set hour
 */
function sendDailyReminders() {
  var ss = getSpreadsheet();
  var settings = getSettingsData(ss);
  if (!settings.emailEnabled) return;
  
  var warningDays = settings.warningDays || 3;
  var today = new Date();
  today.setHours(0,0,0,0);
  
  var documents = getDocumentsList(ss);
  var subTasks = getSubTasksList(ss);
  
  var overdueTasks = [];
  var todayTasks = [];
  var warningTasks = [];
  
  // Find subtasks that are NOT completed and evaluate their deadlines
  subTasks.forEach(function(task) {
    if (task.Status === 'Done') return;
    if (!task.Deadline) return;
    
    var deadlineDate = new Date(task.Deadline);
    deadlineDate.setHours(0,0,0,0);
    
    var timeDiff = deadlineDate.getTime() - today.getTime();
    var dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Find parent document name
    var docName = 'Văn bản không rõ';
    var docNum = '';
    for (var i = 0; i < documents.length; i++) {
      if (documents[i].ID === task['Document ID']) {
        docName = documents[i]['Document Name'];
        docNum = documents[i]['Document Number'];
        break;
      }
    }
    
    var taskInfo = {
      title: task.Title,
      assignee: task.Assignee,
      deadline: task.Deadline,
      documentName: docName,
      documentNumber: docNum
    };
    
    if (dayDiff < 0) {
      overdueTasks.push(taskInfo);
    } else if (dayDiff === 0) {
      todayTasks.push(taskInfo);
    } else if (dayDiff > 0 && dayDiff <= warningDays) {
      warningTasks.push(taskInfo);
    }
  });
  
  // Send email if there's any task to notify
  if (overdueTasks.length > 0 || todayTasks.length > 0 || warningTasks.length > 0) {
    var emailBody = buildHtmlEmail(overdueTasks, todayTasks, warningTasks);
    var recipient = settings.emailRecipient || Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
    
    if (recipient) {
      MailApp.sendEmail({
        to: recipient,
        subject: '[Nhắc nhở Công việc] Báo cáo tiến độ văn bản hàng ngày - ' + formatDateString(today),
        htmlBody: emailBody
      });
    }
  }
}

/**
 * Send a test email reminder immediately
 */
function testEmail() {
  var ss = getSpreadsheet();
  var settings = getSettingsData(ss);
  var warningDays = settings.warningDays || 3;
  
  // Create some mockup tasks for the test email
  var overdueTasks = [
    { title: 'Soạn thảo tờ trình gửi Sở', assignee: 'Nguyễn Văn A', deadline: '2026-06-20', documentName: 'Báo cáo kế hoạch 2026', documentNumber: '123/BC-KH' }
  ];
  var todayTasks = [
    { title: 'Xem xét phê duyệt báo cáo', assignee: 'Trần Thị B', deadline: formatDateString(new Date()), documentName: 'Tờ trình cấp kinh phí', documentNumber: '45/TTr-TC' }
  ];
  
  var targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + warningDays);
  var warningTasks = [
    { title: 'Thu thập thông tin phòng ban', assignee: 'Lê Văn C', deadline: formatDateString(targetDate), documentName: 'Đề án chuyển đổi số', documentNumber: '88/ĐA-STTTT' }
  ];
  
  var emailBody = buildHtmlEmail(overdueTasks, todayTasks, warningTasks);
  var recipient = settings.emailRecipient || Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  
  if (recipient) {
    MailApp.sendEmail({
      to: recipient,
      subject: '[TEST REMINDER] Báo cáo tiến độ văn bản hàng ngày',
      htmlBody: emailBody
    });
    return 'Gửi email test thành công tới: ' + recipient;
  }
  return 'Lỗi: Không xác định được email người nhận.';
}

/**
 * Builds a beautiful HTML email body with table reports
 */
function buildHtmlEmail(overdue, today, warning) {
  var html = '<div style="font-family: \'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333333; max-width: 650px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">';
  html += '<div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 20px; border-radius: 6px; text-align: center; color: #ffffff; margin-bottom: 25px;">';
  html += '<h2 style="margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 0.5px;">BÁO CÁO TIẾN ĐỘ CÔNG VIỆC</h2>';
  html += '<p style="margin: 5px 0 0 0; opacity: 0.85; font-size: 14px;">Bản tin nhắc nhở tự động từ Web App Quản lý Văn bản</p>';
  html += '</div>';
  
  // Section Overdue
  if (overdue.length > 0) {
    html += '<h3 style="color: #dc2626; border-bottom: 2px solid #fee2e2; padding-bottom: 5px; margin-top: 20px;">🚨 CÔNG VIỆC QUÁ HẠN</h3>';
    html += buildTableHtml(overdue, '#fee2e2', '#991b1b');
  }
  
  // Section Today
  if (today.length > 0) {
    html += '<h3 style="color: #d97706; border-bottom: 2px solid #fef3c7; padding-bottom: 5px; margin-top: 25px;">⏳ HẠN HOÀN THÀNH HÔM NAY</h3>';
    html += buildTableHtml(today, '#fef3c7', '#92400e');
  }
  
  // Section Warning
  if (warning.length > 0) {
    html += '<h3 style="color: #2563eb; border-bottom: 2px solid #dbeafe; padding-bottom: 5px; margin-top: 25px;">📅 CÔNG VIỆC SẮP ĐẾN HẠN (Trong những ngày tới)</h3>';
    html += buildTableHtml(warning, '#dbeafe', '#1e40af');
  }
  
  html += '<div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eaeaea; font-size: 12px; color: #6b7280; text-align: center;">';
  html += '<p>Email này được tạo tự động bởi hệ thống Quản lý Văn bản.</p>';
  html += '<p>Để cập nhật tiến độ công việc hoặc thay đổi cấu hình nhắc nhở, vui lòng truy cập trực tiếp Web App của bạn.</p>';
  html += '</div>';
  html += '</div>';
  
  return html;
}

function buildTableHtml(tasks, bg, textColor) {
  var t = '<table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">';
  t += '<thead><tr style="background-color: #f8fafc; text-align: left; border-bottom: 1px solid #cbd5e1;">';
  t += '<th style="padding: 10px; font-weight: 600;">Công việc / Nhân viên</th>';
  t += '<th style="padding: 10px; font-weight: 600;">Thuộc Văn bản</th>';
  t += '<th style="padding: 10px; font-weight: 600; width: 90px;">Hạn chót</th>';
  t += '</tr></thead>';
  t += '<tbody>';
  
  tasks.forEach(function(item) {
    var docText = item.documentNumber ? '<strong>[' + item.documentNumber + ']</strong> ' + item.documentName : item.documentName;
    t += '<tr style="border-bottom: 1px solid #e2e8f0;">';
    t += '<td style="padding: 12px 10px;">';
    t += '<div style="font-weight: 600; color: #1e293b; margin-bottom: 3px;">' + item.title + '</div>';
    t += '<div style="font-size: 12px; color: #64748b;">Giao cho: <strong>' + item.assignee + '</strong></div>';
    t += '</td>';
    t += '<td style="padding: 12px 10px; color: #475569; vertical-align: top;">' + docText + '</td>';
    t += '<td style="padding: 12px 10px; vertical-align: top;">';
    t += '<span style="background-color: ' + bg + '; color: ' + textColor + '; padding: 3px 6px; border-radius: 4px; font-weight: bold; font-size: 11px; white-space: nowrap;">' + item.deadline + '</span>';
    t += '</td>';
    t += '</tr>';
  });
  
  t += '</tbody></table>';
  return t;
}
