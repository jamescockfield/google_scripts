/**
 * Iterates through each prospect in every Streak pipeline, calling the specified function on each
 *
 * @param forEach, the function to call on each prospect in each Streak pipeline
 */
function iterateStreak(forEach)
{
  // Streak API call
  var apiKey = PropertiesService.getScriptProperties().getProperty("apiKey"),
      options = {
    "headers": {
      "Authorization": "Basic " + Utilities.base64Encode(apiKey)
    }
  }
  var pipelines = JSON.parse(UrlFetchApp.fetch("https://www.streak.com/api/v1/pipelines", options).getContentText());
  
  // Iterate through pipelines
  for (var i in pipelines)
  {
    var fetch = UrlFetchApp.fetch("https://www.streak.com/api/v1/pipelines/" + pipelines[i].pipelineKey + "/boxes", options),
        pipeline = JSON.parse(fetch.getContentText());
    for (var j in pipeline)
    {
      var recipient = pipeline[j].name;
      
      forEach(recipient);
    }
  }
}