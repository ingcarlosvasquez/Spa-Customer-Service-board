function setLocationArea(locationName) {
  localStorage.setItem("tabletLocationArea", locationName);
}

// Run this once on each tablet:
setLocationArea("Area 1"); // Tablet at location 1

// To test it immediately, open your application in Chrome, press F12 → Console, then run:
localStorage.setItem("setLocationArea", "Cabina 1");
localStorage.getItem("setLocationArea");
