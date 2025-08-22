const socket = io();

// Get or prompt device name
let deviceName = localStorage.getItem("deviceName");
if (!deviceName) {
  deviceName = prompt("Enter your device name:") || socket.id;
  localStorage.setItem("deviceName", deviceName);
}

// Get or assign color
let deviceColor = localStorage.getItem("deviceColor");
if (!deviceColor) {
  const colors = ['red', 'blue', 'green', 'orange', 'purple', 'brown', 'pink'];
  deviceColor = colors[Math.floor(Math.random() * colors.length)];
  localStorage.setItem("deviceColor", deviceColor);
}

const map = L.map('map').setView([20.5937, 78.9629], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

const markers = {};
const markerGroup = L.featureGroup().addTo(map);

function sendLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.watchPosition((position) => {
      const { latitude, longitude } = position.coords;
      socket.emit('location-update', {
        id: socket.id,
        name: deviceName,
        lat: latitude,
        lng: longitude,
        color: deviceColor
      });
    }, (err) => {
      console.error("Geolocation error:", err);
    }, {
      enableHighAccuracy: true,
      maximumAge: 0
    });
  } else {
    alert("Geolocation not supported by your browser.");
  }
}

socket.on('location-update', (data) => {
  const { id, name, lat, lng, color } = data;

  const icon = L.icon({
    iconUrl: '/images/marker.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    className: `marker-${color}`
  });

  if (markers[id]) {
    markers[id].setLatLng([lat, lng]);
    markers[id].setPopupContent(`${name}`);
  } else {
    const marker = L.marker([lat, lng], { icon }).bindPopup(`${name}`).addTo(markerGroup);
    marker.openPopup();
    markers[id] = marker;

    map.fitBounds(markerGroup.getBounds(), {
      padding: [50, 50],
      maxZoom: 16
    });
  }
});

// 🔥 Live Device List Sidebar
socket.on('device-list', (devices) => {
  const list = document.getElementById('device-list');
  list.innerHTML = ''; // Clear previous list

  devices.forEach(device => {
    const li = document.createElement('li');

    const colorBox = document.createElement('span');
    colorBox.className = 'color-box';
    colorBox.style.backgroundColor = device.color;

    li.innerHTML = `<span style="color: green;">●</span> `;
    li.appendChild(colorBox);
    li.appendChild(document.createTextNode(device.name));
    list.appendChild(li);
  });
});

sendLocation();
function resetName() {
  const newName = prompt("Enter a new name for this device:");
  if (newName && newName.trim() !== "") {
    socket.emit("location-update", {
      name: newName,
      color: deviceColor // keep the existing device color
    });
  }
}

