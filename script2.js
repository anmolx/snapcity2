// IMAGE UPLOAD
document.getElementById('uploadArea').addEventListener('click', () => {
  document.getElementById('photoInput').click();
});

document.getElementById('photoInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.innerHTML = `
      <div style="color: #059669; font-weight: 500;">
        📷 ${file.name} selected
      </div>
      <div style="color: #6b7280; font-size: 0.9rem; margin-top: 5px;">
        Click to change photo
      </div>
    `;
  }
});

// GET LOCATION
document.getElementById('getLocationBtn').addEventListener('click', () => {
  const locationInput = document.getElementById('locationInput');
  const btn = document.getElementById('getLocationBtn');

  if (navigator.geolocation) {
    btn.innerHTML = "Getting location...";
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      function(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`)
          .then(response => response.json())
          .then(data => {
            const address = data.locality ? 
              `${data.locality}, ${data.principalSubdivision}, ${data.countryName}` : 
              `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            locationInput.value = address;
            btn.innerHTML = "✓ Location Captured";
            btn.style.backgroundColor = "#dcfce7";
            btn.style.color = "#166534";
          })
          .catch(() => {
            locationInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            btn.innerHTML = "✓ Location Captured";
          })
          .finally(() => {
            btn.disabled = false;
          });
      },
      function() {
        alert("Unable to retrieve location. Please enter manually.");
        btn.innerHTML = "Get Current Location";
        btn.disabled = false;
      }
    );
  } else {
    alert("Geolocation is not supported by this browser.");
  }
});

// FORM SUBMIT + TICKET GENERATION
document.getElementById('reportForm').addEventListener('submit', function(e) {
  e.preventDefault();

  // Generate a random ticket ID (e.g., SNPCT-20250919-XXXX)
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit random number

  const ticketID = `SNPCT-${yyyy}${mm}${dd}-${randomPart}`;

  alert(`Report submitted successfully!\nYour Ticket ID: ${ticketID}`);
});
