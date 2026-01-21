let currentUser = null;
let currentMonth = new Date();

// VULNERABILITY: Hardcoded API key stored in client
const API_KEY = 'admin_secret_key_12345';

function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  // VULNERABILITY: Credentials sent in plain HTTP (should be HTTPS)
  fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      alert('Login failed');
    } else {
      // VULNERABILITY: Storing token in localStorage (should use httpOnly cookies)
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      currentUser = data.userId;
      document.getElementById('loginSection').style.display = 'none';
      document.getElementById('mainContent').style.display = 'block';
      loadEvents();
      renderCalendar();
    }
  });
}

function addEvent() {
  const title = document.getElementById('eventTitle').value;
  const description = document.getElementById('eventDescription').value;
  const date = document.getElementById('eventDate').value;
  
  // VULNERABILITY: No input validation - XSS possible with title/description
  if (!title || !date) {
    alert('Please fill in all fields');
    return;
  }
  
  // VULNERABILITY: Sending data with API key in header
  fetch('/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify({
      title: title,
      description: description,
      date: date,
      user_id: currentUser
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      alert('Error adding event: ' + data.error);
    } else {
      document.getElementById('eventTitle').value = '';
      document.getElementById('eventDescription').value = '';
      document.getElementById('eventDate').value = '';
      loadEvents();
      renderCalendar();
    }
  });
}

function loadEvents() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // VULNERABILITY: No SQL injection prevention
  // This query parameter is directly concatenated in the server
  fetch(`/api/events?user_id=${currentUser}&date=${today.toISOString().split('T')[0]}`)
    .then(response => response.json())
    .then(events => {
      displayEvents(events);
    });
}

function displayEvents(events) {
  const eventsList = document.getElementById('eventsList');
  eventsList.innerHTML = '';
  
  if (events.length === 0) {
    eventsList.innerHTML = '<p>No events scheduled</p>';
    return;
  }
  
  events.forEach(event => {
    // VULNERABILITY: Direct HTML insertion without sanitization - XSS vulnerability
    const eventHTML = `
      <div class="event-item">
        <h4>${event.title}</h4>
        <p>${event.description}</p>
        <div class="event-date">${event.date}</div>
      </div>
    `;
    eventsList.innerHTML += eventHTML;
  });
}

function renderCalendar() {
  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '';
  
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  document.getElementById('monthYear').textContent = 
    currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  // Previous month's days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = document.createElement('div');
    day.className = 'calendar-day other-month';
    day.textContent = daysInPrevMonth - i;
    calendar.appendChild(day);
  }
  
  // Current month's days
  const today = new Date();
  for (let i = 1; i <= daysInMonth; i++) {
    const day = document.createElement('div');
    day.className = 'calendar-day';
    day.textContent = i;
    
    const currentDate = new Date(year, month, i);
    if (currentDate.toDateString() === today.toDateString()) {
      day.classList.add('today');
    }
    
    day.addEventListener('click', () => {
      document.getElementById('eventDate').value = 
        currentDate.toISOString().split('T')[0];
    });
    
    calendar.appendChild(day);
  }
  
  // Next month's days
  const remainingDays = 42 - (firstDay + daysInMonth);
  for (let i = 1; i <= remainingDays; i++) {
    const day = document.createElement('div');
    day.className = 'calendar-day other-month';
    day.textContent = i;
    calendar.appendChild(day);
  }
}

function previousMonth() {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
  renderCalendar();
}

function nextMonth() {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
  renderCalendar();
}

// VULNERABILITY: Unencrypted CSV export - no authentication
function exportCSV() {
  // VULNERABILITY: Direct window navigation - could be exploited
  window.location.href = '/api/export-csv';
}

// Initialize
window.addEventListener('load', () => {
  // VULNERABILITY: No session validation on page load
  const storedUser = localStorage.getItem('userId');
  if (storedUser) {
    currentUser = storedUser;
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    renderCalendar();
  }
});
