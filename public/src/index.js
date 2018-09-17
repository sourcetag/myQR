function checkUrl(){
  const codeData = $('.code-data').text();
  const expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
  const regex = new RegExp(expression);
  if(codeData.match(regex)){
    $('.code-link').html(`<span><i class="fas fa-link"></i> Link Detected: <a href="${checkProtocol(codeData)}" target="_blank">Click here to visit link</a>`);
    $('.code-link').css('display', 'block');
  } else {
    console.log('this is not a link');
  }
}

function checkProtocol(codeData) {
  if (codeData.substr(0, 5) !== 'http'){
    return `https://${codeData}`
  } else {
    return codeData;
  }
}

function displayDate(){
  const dateToDisplay = $('.code-created').text().substr(0,15);
  $('.code-created').text(dateToDisplay);
}

function displayFavorite(){
  const favText = '<i class="far fa-star"></i> Favorite Code';
  const unFavText = '<i class="fas fa-star"></i> Unfavorite Code';
  console.log($('.code-favorite').html());
  $('.code-favorite').on('click', function(){
    if($(this).attr("data-fav") === 'true') {
      $('.code-favorite').html(favText);
    } else {
      $('.code-favorite').html(unFavText);
    }
  })
}

function init(){
  checkUrl();
  displayDate();
  displayFavorite();
}

$(init);