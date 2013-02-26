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
    $( "span",thisObj ).removeClass("icon-ok-sign").addClass("icon-exclamation-sign");
    sendObj.active = false;
  } else {
    $( "span",thisObj ).removeClass("icon-exclamation-sign").addClass("icon-ok-sign");
    sendObj.active = true;
  }

  $.ajax({
    type: "POST",
    url: "/active_sourcedoc",
    data: sendObj
  }).fail(function(res) {
    if(res.responseText != "") {
      var resObj = JSON.parse(res.responseText);
      alert("Error: " + resObj.message || "Unexpected error.");
    }
    if(sendObj.active) {
      $( "span",thisObj ).removeClass("icon-ok-sign").addClass("icon-exclamation-sign");
      thisObj.button("toggle");
    } else {
      $( "span",thisObj ).removeClass("icon-exclamation-sign").addClass("icon-ok-sign");
      thisObj.button("toggle");
    }
  });
};

/**
 * close message box
 */
function closeMsg() {
  $(this).parent().slideUp();
};
 