/**
 * Main SourceDoc client-side javascript file
 */
 
/**
 * Handle active or de-active SourceDoc button for repository in user's panel
 */
function activeSourceDoc(github_id) {
  var thisObj = $(this);
  var sendObj = { github_id: github_id };
  if(thisObj.hasClass("active")) {
    thisObj.html("Off");
    sendObj.active = false;
  } else {
    thisObj.html("On");
    sendObj.active = true;
  }

  $.ajax({
    type: "POST",
    url: "/active_sourcedoc",
    data: sendObj
  }).fail(function(res) {
    var resObj = JSON.parse(res.responseText);
    alert("Error: " + resObj.message || "Unexpected error.");
    if(sendObj.active) {
      thisObj.html("Off");
      thisObj.button("toggle");
    } else {
      thisObj.html("On");
      thisObj.button("toggle");
    }
  });
};
 