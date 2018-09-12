function triggerDownload(){
  //...
}

function handleDownload(){
  var svg = $('svg');
  $('.download').on('click', function(){
    console.log(svg);
  });
}

$(handleDownload);