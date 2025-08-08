const api = {
  getDoctors: () => fetch('/api/doctors').then(r=>r.json()),
  getSlots: (doctorId, date) => fetch(`/api/slots?doctorId=${doctorId}&date=${date}`).then(r=>r.json()),
  book: (payload) => fetch('/api/book', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)}).then(r=>r.json().then(j=>({status:r.status, body:j})))
};

const doctorSelect = document.getElementById('doctorSelect');
const doctorInfo = document.getElementById('doctorInfo');
const dateInput = document.getElementById('dateInput');
const checkBtn = document.getElementById('checkBtn');
const slotsCard = document.getElementById('slotsCard');
const slotsList = document.getElementById('slotsList');
const selectedDateLabel = document.getElementById('selectedDate');
const bookingCard = document.getElementById('bookingCard');
const slotLabel = document.getElementById('slotLabel');
const patientName = document.getElementById('patientName');
const patientPhone = document.getElementById('patientPhone');
const notes = document.getElementById('notes');
const bookBtn = document.getElementById('bookBtn');
const msg = document.getElementById('msg');

let doctors = [];
let chosen = { doctorId: null, date: null, slot: null };

function showMsg(text, color) {
  msg.textContent = text;
  msg.style.color = color || '#333';
  setTimeout(()=> { /* optional clear */ }, 4000);
}

async function loadDoctors(){
  doctors = await api.getDoctors();
  doctorSelect.innerHTML = doctors.map(d=>`<option value="${d.id}">${d.name} — ${d.specialization}</option>`).join('');
  doctorSelect.addEventListener('change', ()=> {
    const id = parseInt(doctorSelect.value);
    const d = doctors.find(x=>x.id===id);
    doctorInfo.textContent = d ? `${d.specialization} • ${d.experience}` : '';
  });
  // set initial
  if(doctors.length) {
    doctorSelect.value = doctors[0].id;
    doctorInfo.textContent = `${doctors[0].specialization} • ${doctors[0].experience}`;
  }
}

checkBtn.addEventListener('click', async ()=>{
  const doctorId = parseInt(doctorSelect.value);
  const date = dateInput.value;
  if (!doctorId || !date) return showMsg('Select doctor and date', 'red');
  chosen.doctorId = doctorId;
  chosen.date = date;
  selectedDateLabel.textContent = `${date} — ${doctors.find(d=>d.id===doctorId).name}`;
  slotsCard.style.display = 'block';
  bookingCard.style.display = 'none';
  slotLabel.textContent = '';
  // fetch slots
  const res = await api.getSlots(doctorId, date);
  slotsList.innerHTML = '';
  res.slots.forEach(s => {
    const el = document.createElement('div');
    el.className = 'slot ' + (s.available ? 'available' : 'booked');
    el.textContent = s.time + (s.available ? '' : ' (booked)');
    if (s.available) {
      el.addEventListener('click', ()=> {
        chosen.slot = s.time;
        slotLabel.textContent = `${s.time} with ${doctors.find(d=>d.id===doctorId).name} on ${date}`;
        bookingCard.style.display = 'block';
        window.scrollTo({top:document.body.scrollHeight, behavior:'smooth'});
      });
    }
    slotsList.appendChild(el);
  });
});

bookBtn.addEventListener('click', async ()=>{
  if (!chosen.doctorId || !chosen.date || !chosen.slot) return showMsg('Pick a slot first', 'red');
  const name = patientName.value.trim();
  if (!name) return showMsg('Enter patient name', 'red');
  bookBtn.disabled = true;
  const payload = {
    doctorId: chosen.doctorId,
    date: chosen.date,
    slot: chosen.slot,
    patientName: name,
    patientPhone: patientPhone.value.trim(),
    notes: notes.value.trim()
  };
  const result = await api.book(payload);
  bookBtn.disabled = false;
  if (result.status === 200 && result.body.success) {
    showMsg('Booking confirmed! ID: ' + result.body.booking.id, 'green');
    // refresh slots
    checkBtn.click();
    // clear form
    patientName.value = patientPhone.value = notes.value = '';
    bookingCard.style.display = 'none';
  } else if (result.status === 409) {
    showMsg('Slot already booked. Please choose another.', 'red');
  } else {
    showMsg('Booking failed: ' + (result.body.error || 'unknown'), 'red');
  }
});

loadDoctors();
