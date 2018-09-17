function checkUrl(){
  const codeData = $('.code-data').text();
  const expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
  const regex = new RegExp(expression);
  if(codeData.match(regex)){
    $('.code-link').html(`<span><i class="fas fa-link"></i> Link Detected: <a href="${checkProtocol(codeData)}" target="_blank">Click here to visit link</a>`);
    $('.code-link').css('display', 'block');
  }
}

function checkProtocol(codeData) {
  if (codeData.substr(0, 5) !== 'http'){
    return `https://${codeData}`
  } else {
    return codeData;
  }
}

function displayFavorite(){
  const favText = '<i class="far fa-star"></i> Favorite Code';
  const unFavText = '<i class="fas fa-star"></i> Unfavorite Code';
  if($('.code-favorite').attr("data-fav") === 'false') {
    $('.code-favorite').html(favText);
  } else {
    $('.code-favorite').html(unFavText);
  }
  $('.code-favorite').off('click');
  $('.code-favorite').on('click', function(){
    if($(this).attr("data-fav") === 'false') {
      $('.code-favorite').html(favText);
    } else {
      $('.code-favorite').html(unFavText);
    }
  })
}

function init(){
  checkUrl();
  displayFavorite();
}

$(init);