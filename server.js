const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

let bookings = {}; // { "doctor_date_time": [patient names] }

app.post('/book', (req, res) => {
    const { patientName, doctor, date, timeSlot } = req.body;

    if (!patientName || !doctor || !date || !timeSlot) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const key = `${doctor}_${date}_${timeSlot}`;
    if (!bookings[key]) {
        bookings[key] = [];
    }

    if (bookings[key].length >= 20) {
        return res.status(400).json({ message: 'This slot is full' });
    }

    bookings[key].push(patientName);
    const tokenNumber = bookings[key].length; // Token based on order

    res.json({
        message: 'Booking successful',
        tokenNumber,
        patientName,
        doctor,
        date,
        timeSlot
    });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
