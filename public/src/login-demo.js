function clickHandler(){
  $('.demo-show').on('click', () => {
    $('.demo-user-info').fadeIn(1000).css('display', 'block');
  });
}

$(clickHandler);