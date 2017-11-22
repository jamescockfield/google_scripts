// CAREFUL HERE, MAY EXHIBIT SOME STRANGE BEHAVIOUR, EG BOUNCE ON 2ND, 3RD, 4TH TOUCH
// MAY ALSO REPEATEDLY SEND TO BOUNCES FOUND IN TRASH?
function resendBounces()
{
  return;
  var threads = GmailApp.search("You have reached a limit for");
  var aliases = GmailApp.getAliases();
  for (var i in aliases)
  {
    if (aliases[i].indexOf("james") > -1) var alias = aliases[i]; break;
  }
  var options = {
    name: "James Cockfield",
    from: alias,
    subject: "Re: Statement Lighting Specialists"
  };
  for (var i in threads)
  {
    var message = threads[i].getMessages()[0];
    message.forward(message.getTo(), options);
    threads[i].moveToTrash();
  }
}
