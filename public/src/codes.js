function sortHandler(){
  $('.sort-fav').on('click', function(){
    $('[data-fav="false"]').hide();
    $('.sort-fav').addClass('sort-select');
    $('.sort-all').removeClass('sort-select');
  });
  $('.sort-all').on('click', function(){
    $('.code-thumbnail').show();
    $('.sort-all').addClass('sort-select');
    $('.sort-fav').removeClass('sort-select');
  })
}

function init(){
  sortHandler();
}

$(init);