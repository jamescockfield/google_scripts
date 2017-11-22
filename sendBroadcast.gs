function prepareBroadcast()
{
  // Get today's outbound email volume
  var date = new Date();
  var sentToday = GmailApp.search("is:sent  after:" + date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + (date.getDate() - 1)).length;
  
  // Get list of unsubscribers
  var file = DriveApp.getFoldersByName("automatic_replies").next().getFilesByName("unsubscribes").next();
  var unsubscribes = SpreadsheetApp.open(file).getDataRange().getValues().map(function(i) { return i[0] });
  
  // Build message options contents
  var aliases = GmailApp.getAliases(),
      inlineImages = { 
        "carl_sig.jpg": DriveApp.getFilesByName("carl_sig.jpg").next().getBlob() 
      }
  for (var i in aliases)
  {
    if (aliases[i].substring(0, 5) === "carl")
    {
      var carl = aliases[i];
      break;
    }
  }
  
  // THIS PART IS PRETTY ROPEY, HOW WILL OUR CALL TO FOREACH MANAGE CONDITIONS FOR SENDING?
  
  function forEach(sentToday, unsubscribes)
  {
    // Because of mutations, create new initial options object for each call to sendBroadcast
    var options = {
      name: "James Cockfield",
      inlineImages: inlineImages,
      from: carl
    }
    if (sentToday > 400) return; // Approaching daily email sending limit, exit
    if (unsubscribes.indexOf(recipient) === -1) // Prospect already unsubscribed, skip
    {
      if (sendBroadcast(recipient, options)) sentToday += 1;
    }
  }
  
  iterateStreak(forEach, sentToday, unsubscribes);
}

/**
 * Check for date of last contact
 * if over 3 months, will send a new broadcast email
 *
 * @param string recipient, a valid prospect email address
 *
 * @return bool, whether an email was sent or not
 */
function sendBroadcast(recipient, options)
{  
  var threads = GmailApp.search(recipient);
  var waitPeriod = (86400 * 1000 * 90); // 3 MONTHS TIME
  
  if ((new Date() - threads[0].getLastMessageDate()) < waitPeriod) return false; // Last contact was less than 3 months ago, exit
  
  // Last contact was over 3 months ago
  // Get last message from the prospect
  var messages = threads[0].getMessages(),
      lastMessage = messages[messages.length - 1];
  
  // Randomly pick subject and raw body from 3 broadcast templates
  var subjects = [
    "How are your projects going this month?",
    "Just wanted to check in!",
    "Need help with lighting on your next project?"
  ],
      pick = Math.floor(Math.random() * 3),
      subject = subjects[pick];
  
  var file = DriveApp.getFoldersByName("automation").next().getFilesByName("broadcast").next().getId(),
      messageBody = DocumentApp.openById(file).getBody().getText(); // Just 1 broadcast body template for now
      
  var plainBody = getBroadcastOptions(options, lastMessage, messageBody);
  
  // GmailApp.sendEmail(recipient, subject, plainBody, options);
  return true;
}

/**
 * Helper function: MODIFIES options, adding some essential info for sendEmail
 *
 * @param object options, the object containing options to be used in email broadcast
 * @param GmailMessage lastMessage, which constitutes the most recent email message sent by the prospect to us
 * @param string rawMessageBody, the raw text email template, with merge tags to be replaced
 *
 * @return string plainBody, the plain version of the email body
 */
function getBroadcastOptions(options, lastMessage, rawMessageBody)
{
  var recipientName = lastMessage.getFrom().split(/"*([^\s]*)/)[1];
  
  if (recipientName.indexOf("@") > -1) recipientName = ""; // Recipient is email address rather than first name, use blank
  
  // Build website URL to .co.uk or .com
  var domain = lastMessage.getReplyTo().substr(-3);
  if (domain === "com")
  {
    var URLending = "er.com";
  }
  else
  {
    var URLending = "re.co.uk";
  }
  var websiteURL = "http://www.italian-lighting-cent" + URLending;
  
  // Build initial email body
  var initialBody = rawMessageBody.replace("{{NAME}}", recipientName)
                                 .replace("{{URL}}", websiteURL);
  // Build HTML email body
  options.htmlBody = "<p>" +
                     initialBody.replace("{{SIG}}", '<img src="cid:carl_sig.jpg" />')
                                .replace(/\n/g,"</p><p>")
                     + "</p>";
  
  return initialBody.replace("{{SIG}}", ""); // plainBody
}
