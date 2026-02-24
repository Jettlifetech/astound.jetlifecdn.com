$(function(){
	$('.menuBtn').on('click',function(){
		if($('html').is('.navOpen')){
			$('html').removeClass('navOpen');
		}else{
			setTimeout(function(){
				$('html').addClass('navOpen');
			},100);
		}
		return false;
	});
	
	$('a',$('.navWrap')).on('click',function(){
		$('html').removeClass('navOpen');
	});

	if('ontouchstart' in window){
		$('html').addClass('touch');
	}else{
		$('html').addClass('no-touch');
	}
	$('a[href^="#"]:not(.btn):not([href="#"]):not(.tab_link)').on('click',function(){
		$('html, body').animate({scrollTop:$($(this).attr('href')).offset().top});
		
		history.pushState('', '', $(this).attr('href'));
		
		return false;	
	});
	
	$(window).on('load',function(){
		setTimeout(function(){
			if($(window.location.hash).length){
				$('html, body').animate({scrollTop:$(window.location.hash).offset().top});
			}
		},1000);
	});
	
	$('.container').on('mousemove',function(){
		var id = $(this).attr('id');
		if($('#'+id).length){
			if(!$('[href="#'+id+'"]').is('.cur')){
				$('.navWrap a').removeClass('cur').filter('[href="#'+id+'"]').addClass('cur');
			}
		}
	});
	
	$('.navWrap a').on('click',function(){
		$('.navWrap a').removeClass('cur').filter(this).addClass('cur');
	});
});