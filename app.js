/*
  To use a live Google Sheet, publish it as CSV (File > Share > Publish to web)
  and replace the empty string below with the generated URL. Required headers:
  Nombre, TipoServicio, Asignacion, Location, StartTime, EndTime
*/
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTQKfQ6fuLCfd9kY-9badyFMtPhasVApdDJDadpZblDTxcE9Y_LosPKZfJNRZ2_cHAy6u3HYjdyrA9H/pub?output=csv';
const REFRESH_INTERVAL = 5 * 60 * 1000;
let services = [];

const $ = (selector) => document.querySelector(selector);
const demoServices = () => {
  const now = new Date();
  const at = (minutes) => new Date(now.getTime() + minutes * 60000).toISOString();
  return [
    { customerName: 'Maya Anderson', serviceType: 'Restorative facial', assignee: 'Lena Morris', location: 'Room 04', startTime: at(-35), endTime: at(25) },
    { customerName: 'Oliver Chen', serviceType: 'Deep tissue massage', assignee: 'Theo James', location: 'Room 02', startTime: at(-10), endTime: at(80) },
    { customerName: 'Sofia Patel', serviceType: 'Signature massage', assignee: 'Amara Bell', location: 'Room 06', startTime: at(25), endTime: at(85) },
    { customerName: 'Noah Williams', serviceType: 'Body ritual', assignee: 'Lena Morris', location: 'Suite 01', startTime: at(70), endTime: at(160) },
    { customerName: 'Evelyn Brooks', serviceType: 'Restorative facial', assignee: 'Mia Chen', location: 'Room 03', startTime: at(118), endTime: at(178) }
  ];
};

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/); 
  const headers = lines.shift().split(',').map(x => x.replace(/^\uFEFF/, '').trim().toLowerCase());
  return lines.map(line => { const values = line.match(/(?:"([^"]*(?:""[^"]*)*)"|([^,]*))(?:,|$)/g).map(v => v.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '')); 
  const row = {};
  headers.forEach((header, i) => row[header] = values[i]?.trim());
  return { 
    customerName: row.nombre || row['customer name'], 
    serviceType: row.tiposervicio || row['type of service'], 
    assignee: row.asignacion || row.assignee, 
    location: row.location || row['room number'], 
    startTime: row.starttime || row['start time'], 
    endTime: row.endtime || row['end time'] };
  }).filter(x => x.customerName && x.startTime && x.endTime);
}
function initials(name) { return name.split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase(); }
function date(value) {
  const text = String(value ?? '').trim();
  const timeOnly = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeOnly) {
    const result = new Date();
    result.setHours(Number(timeOnly[1]), Number(timeOnly[2]), Number(timeOnly[3] || 0), 0);
    return result;
  }
  return new Date(value);
}
function clock(value) { return date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
function duration(mins) { return `${Math.round(mins)} min`; }
function relativeMinutes(mins) { if (mins <= 0) return 'Complete'; if (mins < 60) return `${Math.ceil(mins)} min left`; return `${Math.floor(mins / 60)}h ${Math.ceil(mins % 60)}m left`; }

function render() {
  const now = new Date(); 
  const windowEnd = new Date(now.getTime() + 120 * 60000);
  const selectedLocation = (localStorage.getItem('setLocationArea') || '').trim().toLowerCase(); // setLocationArea is set in the browser console manually.
  const visible = services.filter(s => {
    const serviceLocation = (s.location || '').trim().toLowerCase();
    return selectedLocation && serviceLocation === selectedLocation && date(s.endTime) > now && date(s.startTime) <= windowEnd;
  }).sort((a,b) => date(a.startTime) - date(b.startTime));
  const active = visible.filter(s => date(s.startTime) <= now && date(s.endTime) > now);
  const upcoming = visible.filter(s => date(s.startTime) > now);
  $('#inServiceCount').textContent = active.length; $('#upcomingCount').textContent = upcoming.length; $('#endingSoonCount').textContent = active.filter(s => (date(s.endTime)-now)/60000 <= 30).length;
  $('#timeWindow').textContent = `${clock(now)} – ${clock(windowEnd)}`; $('#recordMessage').textContent = visible.length ? `${visible.length} scheduled services in the active two-hour window` : 'No scheduled services in the active window';
  $('#emptyState').hidden = visible.length > 0;
  $('#customerRows').innerHTML = visible.map(s => { const isUpcoming = date(s.startTime) > now; const mins = isUpcoming ? (date(s.startTime)-now)/60000 : (date(s.endTime)-now)/60000; const total = (date(s.endTime)-date(s.startTime))/60000;
    return `<tr><td><div class="customer"><span class="initials">${initials(s.customerName)}</span>${s.customerName}</div></td><td><span class="service-name">${s.serviceType}</span><span class="service-length">${duration(total)}</span></td><td>${s.assignee}</td><td><span class="room">${s.location}</span></td><td class="schedule">${clock(s.startTime)} — ${clock(s.endTime)}</td><td><span class="time-badge ${isUpcoming ? 'upcoming' : ''}">${isUpcoming ? `Starts in ${relativeMinutes(mins).replace(' left','')}` : relativeMinutes(mins)}</span></td></tr>`;
  }).join('');
}
async function loadServices() {
  try {
    if (GOOGLE_SHEET_CSV_URL) {
      const response = await fetch(GOOGLE_SHEET_CSV_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Sheet unavailable (${response.status})`);
      const csv = await response.text();
      if (!csv.trim()) throw new Error('Sheet returned no data');
      services = parseCsv(csv);
      if (!services.length) throw new Error('Sheet CSV has no valid service rows');
      $('#connectionText').textContent = 'Live data · Google Sheet connected';
    }
    else 
      { services = JSON.parse(localStorage.getItem('spaServices') || 'null') || demoServices(); }
    $('#connectionDot').classList.remove('error'); 
    $('#refreshNote').textContent = `Updated ${new Date().toLocaleTimeString([], { hour:'numeric', minute:'2-digit' })}`; 
    render();
  } catch (error) { $('#connectionDot').classList.add('error'); 
    $('#connectionText').textContent = 'Could not refresh Google Sheet'; 
    $('#recordMessage').textContent = 'Showing the last available data.'; 
    render(); }
}
$('#refreshButton').addEventListener('click', loadServices); setInterval(loadServices, REFRESH_INTERVAL); setInterval(render, 60000);
loadServices();
