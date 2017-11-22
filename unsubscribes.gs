/**
 * iterates through unsubscribe label, adding each email prospect to unsubscribes spreadsheet
 */
function unsubscribe()
{
  var label = GmailApp.getUserLabelByName("unsubscribes"),
      threads = label.getThreads(),
      file = DriveApp.getFoldersByName("automation").next().getFilesByName("unsubscribes").next(),
      sheet = SpreadsheetApp.open(file).getActiveSheet(),
      unsubscribes = sheet.getDataRange().getValues().map(function(row){ return row[0] });
  
  for (var i in threads)
  {
    var messages = threads[i].getMessages();
    var from = messages[messages.length - 1].getFrom().split(/<([^>]*)/)[1];
    
    if (unsubscribes.indexOf(from) === -1)
    {
      sheet.getRange(sheet.getLastRow(), 1).setValue(from);
      threads[i].removeLabel(label);
      threads[i].moveToTrash();
    }
  }
}

// NEEDS DEBUGGING

/**
 * Parses quickmail import data, retaining only the email address info
 */
function parseData()
{
  var file = DriveApp.getFoldersByName("automation").next().getFilesByName("unsubscribes").next(),
      sheet = SpreadsheetApp.open(file).getActiveSheet(),
      range = sheet.getRange(1, 1, sheet.getLastRow()),
      values = range.getValues();
  
  modify(sheet, function(values, i) { return values[i][0].indexOf("@") === -1 } ); 
  removeDuplicates();
}

/**
 * Removes duplicate values from the spreadsheet
 */
function removeDuplicates()
{
  var file = DriveApp.getFoldersByName("automation").next().getFilesByName("unsubscribes").next(),
      sheet = SpreadsheetApp.open(file).getActiveSheet(),
      range = sheet.getRange(1, 1, sheet.getLastRow()),
      values = range.getValues();
  
  var sorted = values.sort();
  
  modify(sheet, function(values, i)
         {
           if (i < values.length - 1)
           {
             return values[i][0] === values[i + 1][0];
           }
           else return false;
         }
  );
}

/**
 * helper function
 * MODIFIIES the spreadsheet, deleting specified values based on condition function
 *
 * @param Sheet sheet, the Google Sheets Sheet object containing the data to be parsed
 * @param function condition(values, i)
 *        a function which returns true if the input value is to be deleted
 *        params:
 *              array values, the spreadsheet-like array of values to be parsed
 *              int i, the current row index to run search condition on
 */
function modify(sheet, condition)
{
  var range = sheet.getRange(1, 1, sheet.getLastRow()),
      values = range.getValues();
  
  var i = 0,
      max = values.length;
  while (i < max)
  {
    if (condition(values, i))
    {
      values.splice(i, 1);
      values.push([]);
      max--;
      i--;
    }
    i++;
  }
  range.setValues(values);
}