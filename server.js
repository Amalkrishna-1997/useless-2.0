const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
const DOCTORS_FILE = path.join(DATA_DIR, 'doctors.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

function readJSON(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeJSON(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2));
}

// Ensure data dir + files exist with sample data
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(DOCTORS_FILE)) {
  const sampleDoctors = [
    { id: 1, name: "Dr. Anita Sharma", specialization: "Cardiology", experience: "10 yrs" },
    { id: 2, name: "Dr. Ramesh Iyer", specialization: "Orthopedics", experience: "8 yrs" },
    { id: 3, name: "Dr. Priya Nair", specialization: "Pediatrics", experience: "6 yrs" }
  ];
  writeJSON(DOCTORS_FILE, sampleDoctors);
}
if (!fs.existsSync(BOOKINGS_FILE)) {
  writeJSON(BOOKINGS_FILE, []);
}

// Utility to get booked slots for doctor+date
function getBookingsFor(doctorId, date) {
  const all = readJSON(BOOKINGS_FILE) || [];
  return all.filter(b => b.doctorId === doctorId && b.date === date);
}

// API: Get doctors
app.get('/api/doctors', (req, res) => {
  const doctors = readJSON(DOCTORS_FILE) || [];
  res.json(doctors);
});

// API: Get available slots for doctor + date
// Query: ?doctorId=1&date=2025-08-10
app.get('/api/slots', (req, res) => {
  const doctorId = parseInt(req.query.doctorId);
  const date = req.query.date;
  if (!doctorId || !date) return res.status(400).json({ error: 'doctorId and date required' });

  // predefined daily slots
  const slots = [
    "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30",
    "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30"
  ];

  const booked = getBookingsFor(doctorId, date).map(b => b.slot);
  const available = slots.map(s => ({ time: s, available: !booked.includes(s) }));
  res.json({ date, doctorId, slots: available, bookedCount: booked.length });
});

// API: Book a slot
/*
POST body:
{
  "doctorId": 1,
  "date": "2025-08-10",
  "slot": "09:30",
  "patientName": "Amal",
  "patientPhone": "9876543210",
  "notes": "..."
}
*/
app.post('/api/book', (req, res) => {
  const { doctorId, date, slot, patientName, patientPhone, notes } = req.body;
  if (!doctorId || !date || !slot || !patientName) {
    return res.status(400).json({ error: 'doctorId, date, slot and patientName required' });
  }

  const bookings = readJSON(BOOKINGS_FILE) || [];
  // Prevent double booking for same doctor/date/slot
// Limit to 20 patients per slot
const slotBookings = bookings.filter(
  b => b.doctorId === doctorId && b.date === date && b.slot === slot
);
if (slotBookings.length >= 20) {
  return res.status(409).json({ error: 'Slot fully booked (20 patients max)' });
}


  const newBooking = {
    id: (bookings.length ? bookings[bookings.length-1].id + 1 : 1),
    doctorId,
    date,
    slot,
    patientName,
    patientPhone: patientPhone || '',
    notes: notes || '',
    createdAt: new Date().toISOString()
  };
  bookings.push(newBooking);
  writeJSON(BOOKINGS_FILE, bookings);
  res.json({ success: true, booking: newBooking });
});

// API: get all bookings (admin demo)
app.get('/api/bookings', (req, res) => {
  const bookings = readJSON(BOOKINGS_FILE) || [];
  res.json(bookings);
});

// Serve frontend index.html by default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
