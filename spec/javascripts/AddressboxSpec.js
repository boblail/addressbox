describe("Addressbox", function() {
  
  beforeEach(function() {
    loadFixtures('sample.html');
  });
  
  // should be a jQuery extension for a textarea
  // so that you can call $('.addressbox').addressbox();
  it("should extend jQuery", function() {
    expect($('.foo').addressbox).toBeDefined();
  });
  
  
  // should show a placeholder address that can
  // be configured via options to `addressbox()`
  // over the textarea
  // it("should show a placeholder", function() {
  //   $('.foo').addressbox({placeholder: "123 Somewhere"});
  //   expect("123 Somewhere").toExist();
  // })
  
  // should send the address to Google's Map API
  // upon 'change' event
  it("should send the address to the Google Map API on change", function() {
    var geocoder = { geocode: function() {} };
    spyOn(geocoder, 'geocode');
    $('.foo').addressbox({geocoder: geocoder}).change();
    expect(geocoder.geocode).toHaveBeenCalled();
  })
  
  // when Google returns an error, should add an
  // error style to the textarea and (optionally)
  // invoke an errback
  
  // when Google returns success, should add a
  // success style to the textarea and (optionally)
  // invoke a callback
  
  // when the callback returns false, should
  // cancel the change
  
  // when the callback returns true, should
  // commit the change
  
});
