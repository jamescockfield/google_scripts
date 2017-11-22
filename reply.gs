/**
 * Main iteration function. Iterates through all automation/pending labels,
 *      using a ReplyHandler object to call the appropriate reply function on each
 */
function iteration()
{
  var replyHandler = new ReplyHandler();
  
  var labels = GmailApp.getUserLabels();
  for (var i in labels)
  {
    if (labels[i].getName().match("automation/pending/"))
    {
      var threads = labels[i].getThreads(),
          functionToCall = labels[i].getName().split("automation/pending/")[1];
      
      for (var j in threads)
      {
        replyHandler[functionToCall](threads[j]);
      }
    }
  }
}

/**
 * Handles various reply functions
 */
function ReplyHandler()
{
  // Reply functions
  this.generic = function(thread)
  {
    this.reply(thread, "generic");
    thread.addLabel(GmailApp.getUserLabelByName("automation/replied/generic"));
  }
  this.catalogue = function(thread)
  {
    this.reply(thread, "catalogue", ["catalogue.pdf"]);
    thread.addLabel(GmailApp.getUserLabelByName("automation/replied/positive"));
  }
  this.pricelist = function(thread)
  {
    this.reply(thread, "pricelist", ["pricelist.pdf"]);
    thread.addLabel(GmailApp.getUserLabelByName("automation/replied/positive"));
  }
  this.brochure = function(thread)
  {
    var recipient = this.reply(thread, "brochure", ["catalogue.pdf"]);
    thread.addLabel(GmailApp.getUserLabelByName("automation/replied/positive"));
    
    // Add to pending_brochures spreadsheet
    var file = DriveApp.getFoldersByName("automation").next().getFilesByName("pending_brochures").next(),
        sheet = SpreadsheetApp.open(file).getActiveSheet();
    
    Logger.log(sheet.getRange(1, 1).getValue());
    sheet.insertRows(2);
    var range = sheet.getRange(2, 1, 1, 2);
    range.setValues([[recipient, new Date().toDateString()]]);
  }
  
  /**
   * Main reply function
   * Sends the automatic reply, then removes all labels from the thread.
   *
   * @param Thread thread, the GmailApp thread instance to send a reply to.
   * @param string template, the file name of an email message template in automation/templates folder to be used
   * @param array attachments, the names of files in the automation/attachments folder to include as email attachments
   */
  this.reply = function(thread, template, attachments)
  {
    // GET EMAIL TEMPLATE BODY
    var file = DriveApp.getFoldersByName("automation").next().getFoldersByName("templates").next().getFilesByName(template).next().getId(),
        body = DocumentApp.openById(file).getBody().getText(),
        options = this.getOptions(attachments);
    
    lastMessage = thread.getMessages()[thread.getMessageCount() - 1],
        recipient = " " + lastMessage.getFrom().split(/"*([^\s]*)/)[1];
    
    if (recipient.indexOf("@") > -1) recipient = ""; // RECIPIENT IS EMAIL ADDREESS RATHER THAN FIRST NAME, USE BLANK
    
    // BUILD WEBSITE URL TO .CO.UK OR .COM
    var domain = lastMessage.getReplyTo().substr(-3);
    if (domain === "com") var URLending = "er.com";
    else var URLending = "re.co.uk";
    
    var websiteURL = "http://www.italian-lighting-cent" + URLending;
    
    // BUILD BASE EMAIL RESPONSE
    var initialBody = body.replace("{{NAME}}", recipient)
                          .replace("{{URL}}", websiteURL)
                          .replace(/{{price:(.*)}}/g, function(match){ return getPrice(match, domain) }),
        plainBody = initialBody.replace("/{{.*}}/", "");
    
    // BUILD HTML EMAIL RESPONSE
    options.htmlBody = "<p>" +
                   initialBody.replace("{{james_sig}}", "<img src='http://mallory-custom-lighting.co.uk/media/email/james_sig.jpg'>")
                              .replace(/http:\/\/www.mallory.*.jpg/g, "<img src='$&' height='300px'>")
                              .replace(/\n/g,"</p><p>")
                   + "</p>";   
    
    thread.reply(plainBody, options);
    var labels = thread.getLabels();
    for (var i in labels) thread.removeLabel(labels[i]);
    return lastMessage.getFrom().match(/<([^>]*)>/)[1];
  }
  
  // HELPER FUNCTIONS
  /**
  * builds the options object used when sending emails with GmailApp
  *
  * @param attachments, an array consisting of names of files in the current folder to include as email attachments
  * @return the options object used in sending emails with GmailApp
  */
  this.getOptions = function(attachments)
  {
    // GET ALIAS
    var aliases = GmailApp.getAliases();
    for (var i in aliases)
    {
      if (aliases[i].substring(0, 5) === "james") var james = aliases[i];
    }
    // BUILD MAIN OPTIONS OBJECT
    var options =
    {
      name: "James Cockfield",
      from: james,
      attachments: [],
      inlineImages: {}
    }
    if (typeof attachments !== "undefined")
    {
      var folder = DriveApp.getFoldersByName("automation").next().getFoldersByName("attachments").next();
      for (var i in attachments)
      {
        options.attachments.push(folder.getFilesByName(attachments[i]).next().getBlob());
      }
    }
    return options;
  }
}

/**
* replaces a price merge tag with appropriate price for the area found in domain
*
* @param match, the matched merge tag to be replaced
* @param domain, last 3 letters of the recipient email address, (.uk, com, or .au) to decipher location from
* @return a string representing the price in appropriate currency for the location
*/
function getPrice(match, domain)
{
  var price = match.match(/{{price:(.*)}}/)[1];
  if (domain === ".uk") return "£" + price;
  if (domain === ".com")
  {
    return "$" + price * JSON.parse(UrlFetchApp.fetch("http://api.fixer.io/latest?base=GBP")).rates.USD
  }
  else if (domain === ".au")
  { 
    return price * JSON.parse(UrlFetchApp.fetch("http://api.fixer.io/latest?base=GBP")).rates.AUD + "AUD";
  }
  else return price + "GBP"
}
