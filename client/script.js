var currentLocation = "New York City";
var placingPin = false;
var clicked = false;
var socket = io();

var map = new GMaps({
  el: '#map',
  lat: 40.70,
  lng: -74.0060,
  markers: [],
  zoomControl: false,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: true,
  rotateControl: false,
  fullscreenControl: false,
  styles: [ // dark mode!
    {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
    {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
    {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
    {
      "featureType": "all",
      "elementType": "labels.icon",
      "stylers": [
          {
              "visibility": "off"
          }
      ]
    },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{color: '#d59563'}]
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{color: '#d59563'}]
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{color: '#263c3f'}]
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{color: '#6b9a76'}]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{color: '#38414e'}]
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{color: '#212a37'}]
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{color: '#9ca5b3'}]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{color: '#746855'}]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{color: '#1f2835'}]
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{color: '#f3d19c'}]
    },
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [{color: '#2f3948'}]
    },
    {
      featureType: 'transit.station',
      elementType: 'labels.text.fill',
      stylers: [{color: '#d59563'}]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{color: '#17263c'}]
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{color: '#515c6d'}]
    },
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [{color: '#17263c'}]
    }
  ]
});
setCurrentLocation(currentLocation);

socket.emit('start');

var options = {
  enableHighAccuracy: true,
  zoom: 5,
  maximumAge: 0
};

function setMapPosition(lat, lng) {
  map.setCenter(lat, lng, () => {})
}

function setCurrentLocation(loc) {
  $("#search").val(loc);
}

function positionSuccess(pos) {
  var coords = pos.coords;

  console.log('Position:');
  console.log(`Latitude : ${coords.latitude}`);
  console.log(`Longitude: ${coords.longitude}`);
  console.log(`Accuracy: ${coords.accuracy} meters.`);

  setMapPosition(coords.latitude, coords.longitude);
  currentLocation = "Your location";
  setCurrentLocation(currentLocation);
}

function positionError(err) {
  console.warn(`Could not get location (${err.code}): ${err.message}`);
}

$("#pinpoint").click(() => {
  currentLocation = "Getting current location...";
  setCurrentLocation(currentLocation);

  navigator.geolocation.getCurrentPosition(positionSuccess, positionError, options);
})

function initializeAutocomplete(id) {
  var element = document.getElementById(id);
  if (element) {
    var autocomplete = new google.maps.places.Autocomplete(element, { types: ['geocode'] });
    google.maps.event.addListener(autocomplete, 'place_changed', onPlaceChanged);
  }
}

function onPlaceChanged() {
  var place = this.getPlace();
  var loc = place.geometry.location;

  // set current location from later use
  currentLocation = place.formatted_address;

  // to get full returned object
  console.log(place);

  setMapPosition(loc.lat(), loc.lng());
  socket.emit('load_city', place.id);
  socket.emit('load_city', "custom");

  for (var i in place.address_components) {
    var component = place.address_components[i];
    for (var j in component.types) {  // Some types are ["country", "political"]
      var type_element = document.getElementById(component.types[j]);
      if (type_element) {
        type_element.value = component.long_name;
      }
    }
  }
}

google.maps.event.addDomListener(window, 'load', function() {
  initializeAutocomplete('search');
});

$("#search").click(() => {
  setCurrentLocation("");
})

$("#search").blur(() => {
  setCurrentLocation(currentLocation);
})

// Logic for adding locations

$("#add-location").click(() => {
  setTimeout(() => {
    placingPin = true;
    $("#marker").show();
  }, 100);
})

$(document).mousemove(function(e){
  if (placingPin) {
    $("#marker").css({left:e.pageX, top:e.pageY});
  } 
});

google.maps.event.addListener(map.map, 'click', function(event) {  
  console.log(event)
  if (placingPin) {
    placingPin = false;
    console.log(event.latLng)
    $("#marker").hide();
    const name = prompt("Please enter a name for this location")
    const url = prompt("Please attach a photo URL")
    socket.emit('place_location', { pos: event.latLng, name: name, url: url });
  }
});

function openInNewTab(url) {
  var win = window.open(url, '_blank');
  win.focus();
}

function seeMore(id) {
  openInNewTab("https://www.instagram.com/explore/locations/" + id);
}

function closeModal() {
  map.hideInfoWindows();
}

// takes in JSON data from Express server and populates the map
function populateMap(data) {
  const locations = data.locations;
  for(var i = 0; i < locations.length; i++) {
    const location = locations[i];
    const name = location.name;
    const id = location.id;
    const latlng = {lat: location.lat, lng: location.long};
    const photos = location.photos;

    var content = 
    `
      <div class="popup">
        <div class="row">
          <h2 class="popup-header">${name}</h2>

          <div class="buttons">
    `;

    console.log(id);
    if (id != -1) {
      content += `<a class="button red see-more" onclick="seeMore(${id})">See More</a>`;
    }

    content += `
            <a class="button red close" onclick="closeModal()">Close</a>
          </div>
        </div>
        <div class="grid">
    `;
    
    for (var j = 0; j < photos.length; j++) {
      const url = photos[j];
      content += `<img class="icon" src='${url}'></img>`;
    }

    content += '</div></div>';
    
    // add the marker
    map.addMarker({
      lat: location.lat,
      lng: location.long,
      title: name,
      label: {
        color: 'white',
        fontWeight: 'bold',
        text: name,
      },
      infoWindow: {
        content: content
      },
      icon: {
        labelOrigin: new google.maps.Point(11, 50),
        url: 'https://raw.githubusercontent.com/Concept211/Google-Maps-Markers/master/images/marker_red.png',
        size: new google.maps.Size(22, 40),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(11, 40),
      }
    });
  }
  console.log(data);
}

socket.on('load_finish', (data) => {
  populateMap(data);
})

socket.on('update_custom', (data) => {
  socket.emit('load_city', "custom");
})