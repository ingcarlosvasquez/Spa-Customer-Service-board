function setLocationArea(locationName) {
  localStorage.setItem("tabletLocationArea", locationName);
}

// Run this once on each tablet:
setLocationArea("Area 1"); // Tablet at location 1

// To test it immediately, open your application in Chrome, press F12 → Console, then run:
localStorage.setItem("setLocationArea", "Cabina 1");
localStorage.getItem("setLocationArea");

/* 1. Open the app in Chrome or Edge.
  2. Press F12 (or Ctrl+Shift+I) and select the Console tab.
  3. Add console.table(services.map(s => ({ location: s.location, customer: s.customerName }))); in app.js, save the file, then reload the page.
  4. Look for a table in the Console, with location and customer columns.
  */
console.table(services.map(s => ({ location: s.location, customer: s.customerName })));