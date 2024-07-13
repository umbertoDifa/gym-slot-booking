import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, update, get } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const GymSlotBooking = () => {
  const [bookings, setBookings] = useState({});
  const [name, setName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);

  const timeSlots = [
    '18:30 - 19:30', '18:30 - 19:30', '18:30 - 19:30', '18:30 - 19:30',
    '19:30 - 20:30', '19:30 - 20:30', '19:30 - 20:30', '19:30 - 20:30'
  ];

  useEffect(() => {
    const bookingsRef = ref(database, 'bookings');
    
    // First, try to get the existing data
    get(bookingsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setBookings(data);
      } else {
        // If no data exists, initialize with an empty object
        update(ref(database), { bookings: {} });
        setBookings({});
      }
      setLoading(false);
    });

    // Then, set up real-time listener for updates
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBookings(data);
      }
    });

    // Cleanup function to unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slotIndex) => {
    setSelectedSlot(slotIndex);
  };

  const handleBooking = () => {
    if (!name.trim()) {
      alert('Please enter your name before booking.');
      return;
    }
    if (!selectedDate) {
      alert('Please select a date before booking.');
      return;
    }
    if (selectedSlot === null) {
      alert('Please select a slot before booking.');
      return;
    }

    const updatedBookings = { ...bookings };
    if (!updatedBookings[selectedDate]) {
      updatedBookings[selectedDate] = Array(8).fill(null);
    }
    updatedBookings[selectedDate][selectedSlot] = { name };

    update(ref(database, 'bookings'), updatedBookings);
    setName('');
    setSelectedSlot(null);
  };

  const handleCancelBooking = (date, slotIndex) => {
    const updatedBookings = { ...bookings };
    updatedBookings[date][slotIndex] = null;
    update(ref(database, 'bookings'), updatedBookings);
  };

  const getAvailableSlots = (date) => {
    if (!bookings[date]) return 8;
    return 8 - Object.keys(bookings[date]).length;
  };

  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return <div className="container mx-auto px-4 py-8 max-w-md">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Gym Slot Booking</h1>
      
      <div className="mb-4">
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          max={today}
          className="w-full p-2 border rounded mb-2"
        />
      </div>

      <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4" role="alert">
        <p className="font-bold">Available Slots: {getAvailableSlots(selectedDate)} out of 8</p>
        <p>Book your slot for {new Date(selectedDate).toDateString()}!</p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full p-2 border rounded mb-2"
        />
        <button
          onClick={handleBooking}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
          disabled={!name.trim() || selectedSlot === null || getAvailableSlots(selectedDate) === 0}
        >
          Book Selected Slot
        </button>
      </div>

      {getAvailableSlots(selectedDate) === 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p className="font-bold">All slots are booked for this date.</p>
          <p>Please select another date or cancel a booking if it's yours.</p>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold mt-4 mb-2">18:30 - 19:30</h2>
        {timeSlots.slice(0, 4).map((time, index) => (
          <SlotItem
            key={index}
            time={time}
            index={index}
            selectedDate={selectedDate}
            bookings={bookings}
            selectedSlot={selectedSlot}
            handleSlotSelect={handleSlotSelect}
            handleCancelBooking={handleCancelBooking}
          />
        ))}
        
        <h2 className="text-xl font-semibold mt-4 mb-2">19:30 - 20:30</h2>
        {timeSlots.slice(4).map((time, index) => (
          <SlotItem
            key={index + 4}
            time={time}
            index={index + 4}
            selectedDate={selectedDate}
            bookings={bookings}
            selectedSlot={selectedSlot}
            handleSlotSelect={handleSlotSelect}
            handleCancelBooking={handleCancelBooking}
          />
        ))}
      </div>
    </div>
  );
};

const SlotItem = ({ time, index, selectedDate, bookings, selectedSlot, handleSlotSelect, handleCancelBooking }) => {
  const slot = bookings[selectedDate] ? bookings[selectedDate][index] : null;
  
  return (
    <div 
      className={`border rounded p-4 flex justify-between items-center ${selectedSlot === index ? 'bg-blue-100' : ''} ${slot ? 'bg-gray-100' : ''}`}
      onClick={() => !slot && handleSlotSelect(index)}
    >
      <div>
        <p className="font-semibold">{time}</p>
        {slot && <p className="text-sm text-gray-600">Booked by: {slot.name}</p>}
      </div>
      {slot ? (
        <button
          onClick={() => handleCancelBooking(selectedDate, index)}
          className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
        >
          <X size={20} />
        </button>
      ) : (
        <div className={`w-6 h-6 rounded-full ${selectedSlot === index ? 'bg-blue-500' : 'bg-gray-300'}`} />
      )}
    </div>
  );
};

export default GymSlotBooking;