(function($) {
  
  // https://developers.google.com/maps/documentation/javascript/geocoding
  
  // https://developers.google.com/maps/documentation/javascript/tutorial?csw=1#asynch
  var googleMapsCallback = '__jq_addressbox_google_callback';
  var googleMapsApi = 'https://maps.googleapis.com/maps/api/js?' + $.param({
    v: '3.12',
    sensor: false,
    callback: googleMapsCallback
    // key: API_KEY
  });
  
  
  function loadGoogleMapsApi(callback) {
    window[googleMapsCallback] = function() {
      $(document).trigger('google.maps:loaded');
    };
    $.getScript(googleMapsApi);
    if(callback) {
      $(document).bind('google.maps:loaded', callback);
    }
  }
  
  
  function geocode(geocoder, value, $el) {
    $el.removeClass('addressbox-notfound addressbox-success addressbox-error');
    $el.addClass('addressbox-working');
    
    if(!geocoder) {
      if(window.google && google.maps && google.maps.Geocoder) {
        geocoder = new google.maps.Geocoder();
      } else {
        loadGoogleMapsApi(function () {
          geocode(new google.maps.Geocoder(), value, $el);
        });
        return; // resume when google.maps API is loaded
      }
    }
    
    geocoder.geocode({address: value}, function(results, status) {
      $el.removeClass('addressbox-working');
      
      // https://developers.google.com/maps/documentation/javascript/reference#GeocoderStatus
      switch(status) {
        case google.maps.GeocoderStatus.OK: 
        case google.maps.GeocoderStatus.ZERO_RESULTS: 
          processResults(results, $el);
          break;
          
        case google.maps.GeocoderStatus.ERROR: 
        case google.maps.GeocoderStatus.INVALID_REQUEST: 
        case google.maps.GeocoderStatus.OVER_QUERY_LIMIT: 
        case google.maps.GeocoderStatus.REQUEST_DENIED: 
        case google.maps.GeocoderStatus.UNKNOWN_ERROR: 
          handleError(results, status, $el);
          break;
      }
    });
  }
  
  
  function processResults(results, $el) {
    results = onlyStreetAddresses(results);
    if(results.length == 0) {
      $el.addClass('addressbox-notfound');
      $el.trigger('addressbox:complete', [[]]);
    } else {
      $el.addClass('addressbox-success');
      $el.trigger('addressbox:success', [results]);
      $el.trigger('addressbox:complete', [results]);
    }
  }
  
  
  function onlyStreetAddresses(results) {
    var streetAddresses = []
    for(var i=0; i<results.length; i++) {
      var result = results[i];
      for(var j=0; j<result.types.length; j++) {
        if(result.types[j] == 'street_address') {
          streetAddresses.push(result);
        }
      }
    }
    return streetAddresses;
  }
  
  
  function onlyCompleteMatches(results) {
    var completeMatches = []
    for(var i=0; i<results.length; i++) {
      var result = results[i];
      if(!result.partial_match) {
        completeMatches.push(result);
      }
    }
    return completeMatches;
  }
  
  
  function handleError(results, status, $el) {
    $el.addClass('addressbox-error');
    $el.trigger('addressbox:error', 'An error occurred');
    $el.trigger('addressbox:complete', [[]]);
    console.log('an error occurred');
    console.log(results);
    console.log(status);
  }
  
  
  function formatAddress(result) {
    var streetNumber = findAddressComponent(result.address_components, 'street_number');
    var route = findAddressComponent(result.address_components, 'route');
    if(streetNumber && route) {
      var streetAddress = streetNumber + ' ' + route;
      return result.formatted_address
        .replace(streetAddress + ', ', streetAddress + '\n')
        .replace(/, USA$/, '');
    } else {
      return result.formatted_address.replace(/, USA$/, '');
    }
  }
  
  function findAddressComponent(components, type) {
    for(var i=0; i<components.length; i++) {
      var component = components[i];
      for(var j=0; j<component.types.length; j++) {
        if(component.types[j] == type) {
          return component.long_name;
        }
      }
    }
  }
  
  
  $.fn.addressbox = function(options) {
    options = options || {};
    var geocoder = options.geocoder;
    var event = options.autocomplete ? 'keypress' : 'change';
    var placeholderAddress = '94 Evergreen Terrace\nSpringfield, USA';
    
    return $(this).each(function(i, textarea) {
      var delay = 500;
      var geocodeQueued = false;
      var $textarea = $(textarea);
      var $container = $textarea.wrap('<div class="addressbox-container"></div>').closest('div');
      var $placeholder = $('<textarea readonly class="addressbox-placeholder">' + placeholderAddress + '</textarea>').appendTo($container);
      var lastValue = null;
      
      if(event == 'change') {
        $textarea.on(event, function() {
          geocode(geocoder, $textarea.val(), $textarea);
        });
        $textarea.on('keyup', function() {
          $placeholder.toggle($textarea.val().length == 0);
        });
      } else {
        $textarea.on('keydown', function(e) {
          if(e.keyCode == 9) {
            var val = $placeholder.val();
            if(val != placeholderAddress) {
              e.preventDefault();
              if(val.length > 0) {
                $textarea.val(val);
              }
            }
          }
        });
        $textarea.on('keyup', function() {
          if($textarea.val().length == 0) {
            $placeholder.val(placeholderAddress);
          } else if(!geocodeQueued) {
            setTimeout(function() {
              var val = $textarea.val();
              if(val.length > 0 && val != lastValue) {
                geocode(geocoder, val, $textarea);
                lastValue = val;
              }
              geocodeQueued = false;
            }, delay);
            geocodeQueued = true;
          }
        });
        $textarea.on('addressbox:complete', function(e, results) {
          var results = onlyCompleteMatches(results);
          var address = results.length > 0 ? formatAddress(results[0]) : '';
          $placeholder.val(address);
        });
      }
      
    });
  }
  
})(jQuery);
