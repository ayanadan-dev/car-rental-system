import React, { useState, useEffect } from 'react';
import { 
  Car as CarIcon, 
  Calendar, 
  User as UserIcon, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Search, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Filter,
  ArrowRight,
  ShieldCheck,
  Clock
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/api';

// Pre-seeded Mock Data for fallbacks (if backend API is unavailable)
const DEFAULT_CARS = [
  { id: 1, brand: 'Tesla', model: 'Model S Plaid', pricePerDay: 150.0, status: 'AVAILABLE', imageUrl: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800' },
  { id: 2, brand: 'Porsche', model: '911 Carrera S', pricePerDay: 220.0, status: 'AVAILABLE', imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800' },
  { id: 3, brand: 'Audi', model: 'e-tron GT', pricePerDay: 180.0, status: 'RENTED', imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800' },
  { id: 4, brand: 'Ford', model: 'Mustang Mach 1', pricePerDay: 110.0, status: 'AVAILABLE', imageUrl: 'https://images.unsplash.com/photo-1605558202076-1692af9a01b4?auto=format&fit=crop&q=80&w=800' },
  { id: 5, brand: 'Mercedes-Benz', model: 'AMG GT', pricePerDay: 250.0, status: 'MAINTENANCE', imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=800' },
  { id: 6, brand: 'BMW', model: 'M4 Competition', pricePerDay: 160.0, status: 'AVAILABLE', imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800' }
];

export default function App() {
  // Authentication & Navigation states
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('landing'); // landing, customer, admin
  const [authMode, setAuthMode] = useState(null); // null, 'login', 'signup'
  const [authError, setAuthError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states for login/signup
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'CUSTOMER' });

  // Core business states
  const [cars, setCars] = useState(DEFAULT_CARS);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiActive, setApiActive] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Booking Modal State
  const [selectedCarForBooking, setSelectedCarForBooking] = useState(null);
  const [bookingDates, setBookingDates] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0] // 3 days default
  });

  // Admin Car Management states
  const [editingCar, setEditingCar] = useState(null);
  const [carForm, setCarForm] = useState({ brand: '', model: '', pricePerDay: '', status: 'AVAILABLE', imageUrl: '' });
  const [showCarModal, setShowCarModal] = useState(false);

  // Alert system helper
  const triggerAlert = (msg, type = 'success') => {
    if (type === 'success') {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      setAuthError(msg);
      setTimeout(() => setAuthError(''), 4000);
    }
  };

  // API Call helper wrapper
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'API Call failed');
      }
      setApiActive(true);
      return await response.json();
    } catch (err) {
      console.warn(`Backend API unavailable at ${endpoint}. Operating in Demo/Local mode.`, err.message);
      return null;
    }
  };

  // Load Initial Data
  const loadData = async () => {
    setLoading(true);
    const fetchedCars = await apiCall('/cars');
    if (fetchedCars) {
      setCars(fetchedCars);
    } else {
      // Local fallback setup: use default cars from state
      setCars(prev => {
        const localSaved = localStorage.getItem('local_cars');
        return localSaved ? JSON.parse(localSaved) : DEFAULT_CARS;
      });
    }

    if (currentUser) {
      if (currentUser.role === 'ADMIN') {
        const allRentals = await apiCall('/rentals');
        if (allRentals) {
          setRentals(allRentals);
        } else {
          const localSavedRentals = localStorage.getItem('local_rentals');
          setRentals(localSavedRentals ? JSON.parse(localSavedRentals) : []);
        }
      } else {
        const userRentals = await apiCall(`/rentals/user/${currentUser.userId}`);
        if (userRentals) {
          setRentals(userRentals);
        } else {
          const localSavedRentals = localStorage.getItem('local_rentals');
          const allLocalRentals = localSavedRentals ? JSON.parse(localSavedRentals) : [];
          setRentals(allLocalRentals.filter(r => r.user?.id === currentUser.userId));
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Save changes locally to localStorage for Demo Mode persistence
  const syncLocalCars = (newCars) => {
    setCars(newCars);
    localStorage.setItem('local_cars', JSON.stringify(newCars));
  };

  const syncLocalRentals = (newRentals) => {
    setRentals(newRentals);
    localStorage.setItem('local_rentals', JSON.stringify(newRentals));
  };

  // Handle Authentication
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (authMode === 'signup') {
      const response = await apiCall('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(authForm)
      });

      if (response) {
        handleLoginSuccess(response);
      } else {
        // Local signup emulation
        const mockResponse = {
          token: 'mock-session-token-' + Math.random().toString(36).substring(7),
          userId: Date.now(),
          name: authForm.name,
          email: authForm.email,
          role: authForm.role
        };
        handleLoginSuccess(mockResponse);
        triggerAlert('Emulated Signup Successful (Demo Mode)');
      }
    } else {
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: authForm.email, password: authForm.password })
      });

      if (response) {
        handleLoginSuccess(response);
      } else {
        // Local login emulation
        if (authForm.email === 'admin@system.com' && authForm.password === 'admin123') {
          handleLoginSuccess({
            token: 'mock-admin-token',
            userId: 999,
            name: 'System Admin',
            email: 'admin@system.com',
            role: 'ADMIN'
          });
          triggerAlert('Logged in as Admin (Demo Mode)');
        } else if (authForm.email === 'user@system.com' && authForm.password === 'user123') {
          handleLoginSuccess({
            token: 'mock-customer-token',
            userId: 100,
            name: 'John Doe',
            email: 'user@system.com',
            role: 'CUSTOMER'
          });
          triggerAlert('Logged in as Customer (Demo Mode)');
        } else {
          setAuthError('Use demo accounts: admin@system.com/admin123 or user@system.com/user123');
        }
      }
    }
  };

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setAuthMode(null);
    setAuthForm({ name: '', email: '', password: '', role: 'CUSTOMER' });
    setActiveTab(userData.role === 'ADMIN' ? 'admin' : 'customer');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
    setActiveTab('landing');
    triggerAlert('Logged out successfully');
  };

  // Booking action
  const handleBookCar = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setAuthMode('login');
      return;
    }

    const payload = {
      carId: selectedCarForBooking.id,
      userId: currentUser.userId,
      startDate: bookingDates.startDate,
      endDate: bookingDates.endDate
    };

    const response = await apiCall('/rentals/book', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (response) {
      triggerAlert('Booking request sent successfully!');
      setSelectedCarForBooking(null);
      loadData();
    } else {
      // Local emulated booking logic
      const days = Math.max(1, Math.round((new Date(bookingDates.endDate) - new Date(bookingDates.startDate)) / (1000 * 60 * 60 * 24)));
      const cost = selectedCarForBooking.pricePerDay * days;
      const newRental = {
        id: Date.now(),
        startDate: bookingDates.startDate,
        endDate: bookingDates.endDate,
        totalCost: cost,
        status: 'PENDING',
        user: { id: currentUser.userId, name: currentUser.name, email: currentUser.email },
        car: selectedCarForBooking
      };

      const localRentals = localStorage.getItem('local_rentals') ? JSON.parse(localStorage.getItem('local_rentals')) : [];
      const updatedLocalRentals = [newRental, ...localRentals];
      syncLocalRentals(updatedLocalRentals);

      // Emulate Car status booking pending/rented? Keep available until approved.
      triggerAlert(`Booking request sent successfully! Total: $${cost.toFixed(2)} (Demo Mode)`);
      setSelectedCarForBooking(null);
      
      // Reload customer view
      setRentals(updatedLocalRentals.filter(r => r.user?.id === currentUser.userId));
    }
  };

  // Admin Car Actions
  const handleSaveCar = async (e) => {
    e.preventDefault();
    const carPrice = parseFloat(carForm.pricePerDay);
    if (!carForm.brand || !carForm.model || isNaN(carPrice)) {
      triggerAlert('Please enter valid car details', 'error');
      return;
    }

    const carData = {
      brand: carForm.brand,
      model: carForm.model,
      pricePerDay: carPrice,
      status: carForm.status,
      imageUrl: carForm.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'
    };

    if (editingCar) {
      const response = await apiCall(`/cars/${editingCar.id}`, {
        method: 'PUT',
        body: JSON.stringify(carData)
      });

      if (response) {
        triggerAlert('Car updated successfully!');
        loadData();
      } else {
        const updatedCars = cars.map(c => c.id === editingCar.id ? { ...c, ...carData } : c);
        syncLocalCars(updatedCars);
        triggerAlert('Car updated locally (Demo Mode)');
      }
    } else {
      const response = await apiCall('/cars', {
        method: 'POST',
        body: JSON.stringify(carData)
      });

      if (response) {
        triggerAlert('Car added successfully!');
        loadData();
      } else {
        const newCar = {
          id: Date.now(),
          ...carData
        };
        const updatedCars = [...cars, newCar];
        syncLocalCars(updatedCars);
        triggerAlert('Car added locally (Demo Mode)');
      }
    }

    setShowCarModal(false);
    setEditingCar(null);
    setCarForm({ brand: '', model: '', pricePerDay: '', status: 'AVAILABLE', imageUrl: '' });
  };

  const handleDeleteCar = async (carId) => {
    const response = await fetch(`${API_BASE_URL}/cars/${carId}`, { method: 'DELETE' }).catch(() => null);

    if (response && response.ok) {
      triggerAlert('Car deleted successfully!');
      loadData();
    } else {
      const updatedCars = cars.filter(c => c.id !== carId);
      syncLocalCars(updatedCars);
      triggerAlert('Car deleted locally (Demo Mode)');
    }
  };

  // Admin Rental Approval Actions
  const handleRentalStatusUpdate = async (rentalId, status) => {
    const response = await apiCall(`/rentals/${rentalId}/status?status=${status}`, {
      method: 'PUT'
    });

    if (response) {
      triggerAlert(`Rental booking status set to: ${status}`);
      loadData();
    } else {
      // Local emulation
      const allLocalRentals = localStorage.getItem('local_rentals') ? JSON.parse(localStorage.getItem('local_rentals')) : [];
      
      const updatedRentals = allLocalRentals.map(r => {
        if (r.id === rentalId) {
          const updatedRental = { ...r, status: status };
          
          // Modify referenced car status as well
          const updatedCars = cars.map(c => {
            if (c.id === r.car.id) {
              let updatedStatus = 'AVAILABLE';
              if (status === 'APPROVED') updatedStatus = 'RENTED';
              return { ...c, status: updatedStatus };
            }
            return c;
          });
          syncLocalCars(updatedCars);
          updatedRental.car.status = status === 'APPROVED' ? 'RENTED' : 'AVAILABLE';
          return updatedRental;
        }
        return r;
      });

      syncLocalRentals(updatedRentals);
      setRentals(updatedRentals);
      triggerAlert(`Status updated to ${status} (Demo Mode)`);
    }
  };

  // Filter cars for display
  const filteredCars = cars.filter(car => {
    const matchesSearch = `${car.brand} ${car.model}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || car.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate Admin Metrics
  const adminMetrics = React.useMemo(() => {
    const totalRev = rentals.filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED').reduce((acc, r) => acc + r.totalCost, 0);
    const rentedCount = cars.filter(c => c.status === 'RENTED').length;
    const pendingBookings = rentals.filter(r => r.status === 'PENDING').length;
    return {
      revenue: totalRev,
      rentedCars: rentedCount,
      pendingRequests: pendingBookings
    };
  }, [cars, rentals]);

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      {/* Toast Messages */}
      {successMessage && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', padding: '16px 24px', 
          backgroundColor: 'var(--success)', borderRadius: '10px', color: 'white', 
          fontWeight: 600, boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)', zIndex: 10000,
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Check size={20} />
          {successMessage}
        </div>
      )}

      {/* Global Alert Header (Demo Status Indication) */}
      {!apiActive && (
        <div style={{
          background: 'linear-gradient(90deg, #4338ca 0%, #6d28d9 100%)',
          textAlign: 'center', padding: '8px 24px', fontSize: '0.85rem', fontWeight: 600,
          borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px', marginBottom: '10px',
          color: '#e0e7ff', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
        }}>
          <ShieldCheck size={16} />
          Operating in Local Demo Mode. Start the Spring Boot Backend at port 8080 to enable database integration automatically!
        </div>
      )}

      {/* Premium Header/Navbar */}
      <header className="navbar">
        <a href="#" className="logo" onClick={() => setActiveTab('landing')}>
          <CarIcon size={32} style={{ color: 'var(--accent)' }} />
          <span>Veloce</span>Rentals
        </a>
        <nav className="nav-links">
          <a className={`nav-link ${activeTab === 'landing' ? 'active' : ''}`} onClick={() => setActiveTab('landing')}>Explore Cars</a>
          {currentUser && currentUser.role === 'CUSTOMER' && (
            <a className={`nav-link ${activeTab === 'customer' ? 'active' : ''}`} onClick={() => setActiveTab('customer')}>My Bookings</a>
          )}
          {currentUser && currentUser.role === 'ADMIN' && (
            <a className={`nav-link ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>Admin Dashboard</a>
          )}
          
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <UserIcon size={18} style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 600 }}>{currentUser.name}</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.6, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                  {currentUser.role}
                </span>
              </div>
              <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                <LogOut size={16} />
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" onClick={() => { setAuthMode('login'); setAuthError(''); }} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Login
              </button>
              <button className="btn-primary" onClick={() => { setAuthMode('signup'); setAuthError(''); }} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Sign Up
              </button>
            </div>
          )}
        </nav>
      </header>

      {/* Auth Modal */}
      {authMode && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <button className="modal-close" onClick={() => setAuthMode(null)}><X /></button>
            
            <h2 style={{ marginBottom: '8px', fontSize: '1.8rem' }} className="text-gradient">
              {authMode === 'login' ? 'Welcome Back' : 'Join Veloce'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
              {authMode === 'login' ? 'Log in to manage bookings and browse cars' : 'Create an account to book your premium dream car'}
            </p>

            {authError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem'
              }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              {authMode === 'signup' && (
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control" 
                    placeholder="John Doe"
                    value={authForm.name} 
                    onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                  />
                </div>
              )}
              
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  required 
                  className="form-control" 
                  placeholder="name@example.com"
                  value={authForm.email} 
                  onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  required 
                  className="form-control" 
                  placeholder="••••••••"
                  value={authForm.password} 
                  onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                />
              </div>

              {authMode === 'signup' && (
                <div className="form-group">
                  <label>Role</label>
                  <select 
                    className="form-control"
                    value={authForm.role}
                    onChange={e => setAuthForm({ ...authForm, role: e.target.value })}
                  >
                    <option value="CUSTOMER">Customer (Rent Cars)</option>
                    <option value="ADMIN">Administrator (Manage System)</option>
                  </select>
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                {authMode === 'login' ? 'Login' : 'Create Account'}
              </button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button 
                onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}
              >
                {authMode === 'login' ? 'Sign Up' : 'Log In'}
              </button>
            </div>

            <div style={{ marginTop: '20px', padding: '12px', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              <strong>Demo Login Accounts:</strong><br />
              • Admin: <code style={{ color: 'var(--text-primary)' }}>admin@system.com</code> / <code style={{ color: 'var(--text-primary)' }}>admin123</code><br />
              • Customer: <code style={{ color: 'var(--text-primary)' }}>user@system.com</code> / <code style={{ color: 'var(--text-primary)' }}>user123</code>
            </div>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {selectedCarForBooking && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '450px' }}>
            <button className="modal-close" onClick={() => setSelectedCarForBooking(null)}><X /></button>
            <h2 className="text-gradient" style={{ marginBottom: '8px' }}>Confirm Reservation</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
              Complete dates below to book {selectedCarForBooking.brand} {selectedCarForBooking.model}.
            </p>

            <div style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
              <img src={selectedCarForBooking.imageUrl} alt={selectedCarForBooking.model} style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
              <div>
                <h4 style={{ fontSize: '1rem' }}>{selectedCarForBooking.brand} {selectedCarForBooking.model}</h4>
                <p style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.95rem' }}>${selectedCarForBooking.pricePerDay} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/ day</span></p>
              </div>
            </div>

            <form onSubmit={handleBookCar}>
              <div className="form-group">
                <label>Rental Start Date</label>
                <input 
                  type="date" 
                  required 
                  className="form-control"
                  value={bookingDates.startDate} 
                  onChange={e => setBookingDates({ ...bookingDates, startDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Rental End Date</label>
                <input 
                  type="date" 
                  required 
                  className="form-control"
                  value={bookingDates.endDate} 
                  onChange={e => setBookingDates({ ...bookingDates, endDate: e.target.value })}
                />
              </div>

              {/* Dynamic Cost Counter */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', marginBottom: '24px' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Estimated Total:</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)' }}>
                  ${(selectedCarForBooking.pricePerDay * Math.max(1, Math.round((new Date(bookingDates.endDate) - new Date(bookingDates.startDate)) / (1000 * 60 * 60 * 24)))).toFixed(2)}
                </span>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                <Calendar size={18} />
                Reserve Car Now
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Car Modal (Admin) */}
      {showCarModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <button className="modal-close" onClick={() => { setShowCarModal(false); setEditingCar(null); }}><X /></button>
            <h2 className="text-gradient" style={{ marginBottom: '24px' }}>{editingCar ? 'Update Fleet Car' : 'Add New Car to Fleet'}</h2>
            
            <form onSubmit={handleSaveCar}>
              <div className="form-group">
                <label>Brand / Manufacturer</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Tesla, Porsche"
                  className="form-control"
                  value={carForm.brand} 
                  onChange={e => setCarForm({ ...carForm, brand: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Model Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Model Y, Cayenne"
                  className="form-control"
                  value={carForm.model} 
                  onChange={e => setCarForm({ ...carForm, model: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Daily Price ($)</label>
                <input 
                  type="number" 
                  required
                  placeholder="120"
                  className="form-control"
                  value={carForm.pricePerDay} 
                  onChange={e => setCarForm({ ...carForm, pricePerDay: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select 
                  className="form-control"
                  value={carForm.status} 
                  onChange={e => setCarForm({ ...carForm, status: e.target.value })}
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="RENTED">Rented</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>

              <div className="form-group">
                <label>Car Image URL</label>
                <input 
                  type="text" 
                  placeholder="https://images.unsplash.com/..."
                  className="form-control"
                  value={carForm.imageUrl} 
                  onChange={e => setCarForm({ ...carForm, imageUrl: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
                {editingCar ? 'Update Vehicle' : 'Add Vehicle'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LANDING PAGE VIEW */}
      {activeTab === 'landing' && (
        <div>
          {/* Hero Section */}
          <div style={{ textAlign: 'center', padding: '60px 0 80px 0', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '3.6rem', lineHeight: '1.1', marginBottom: '24px' }}>
              Drive The Future With <span className="text-gradient-accent">Veloce Premium</span> Fleet
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: '1.6', marginBottom: '32px' }}>
              Experience high-end engineering, transparent rental rates, and instant online scheduling. Book sports cars, luxurious sedans, and high-performance electric vehicles.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <a href="#cars-catalog" className="btn-primary">
                Explore Vehicles
                <ArrowRight size={18} />
              </a>
              {!currentUser && (
                <button className="btn-secondary" onClick={() => setAuthMode('signup')}>
                  Get Started
                </button>
              )}
            </div>
          </div>

          {/* Cars Catalog Grid */}
          <div id="cars-catalog" style={{ paddingTop: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
              <div>
                <h2 style={{ fontSize: '2rem' }}>Fleet Collection</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Browse and choose your premium ride</p>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '250px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Search model, brand..." 
                    className="form-control" 
                    style={{ paddingLeft: '40px' }}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                <select 
                  className="form-control" 
                  style={{ width: '160px' }}
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="RENTED">Rented</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading Fleet Collection...</div>
            ) : filteredCars.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', border: '1px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                No cars found matching your search.
              </div>
            ) : (
              <div className="grid-cars">
                {filteredCars.map(car => (
                  <div key={car.id} className="car-card glass-panel">
                    <div className="car-image-container">
                      <img src={car.imageUrl} alt={`${car.brand} ${car.model}`} />
                      <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                        <span className={`badge badge-${car.status.toLowerCase()}`}>
                          {car.status}
                        </span>
                      </div>
                    </div>
                    <div className="car-details">
                      <h3 style={{ fontSize: '1.25rem' }}>{car.brand} <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>{car.model}</span></h3>
                      <div className="car-price">
                        ${car.pricePerDay} <span>/ day</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                        <button 
                          disabled={car.status !== 'AVAILABLE'} 
                          className="btn-primary" 
                          style={{ flexGrow: 1, justifyContent: 'center', opacity: car.status === 'AVAILABLE' ? 1 : 0.5 }}
                          onClick={() => {
                            if (!currentUser) {
                              setAuthMode('login');
                            } else {
                              setSelectedCarForBooking(car);
                            }
                          }}
                        >
                          {car.status === 'AVAILABLE' ? 'Book Vehicle' : 'Unavailable'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CUSTOMER MY BOOKINGS VIEW */}
      {activeTab === 'customer' && currentUser && (
        <div className="animate-fade-in">
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '2.2rem' }}>My Reservations</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Track and view your car booking status history</p>
          </div>

          {rentals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 40px', border: '1px dashed var(--border-color)', borderRadius: '16px' }}>
              <Clock size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3>No bookings registered yet</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>You haven't reserved any vehicles yet. Check out our luxury fleet selection.</p>
              <button className="btn-primary" onClick={() => setActiveTab('landing')}>Explore Fleet</button>
            </div>
          ) : (
            <div className="table-container glass-panel">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Rental ID</th>
                    <th>Vehicle</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Total Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rentals.map(rental => (
                    <tr key={rental.id}>
                      <td>#{rental.id}</td>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={rental.car.imageUrl} alt={rental.car.model} style={{ width: '50px', height: '35px', objectFit: 'cover', borderRadius: '4px' }} />
                        <div>
                          <strong>{rental.car.brand}</strong> {rental.car.model}
                        </div>
                      </td>
                      <td>{rental.startDate}</td>
                      <td>{rental.endDate}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>${rental.totalCost.toFixed(2)}</td>
                      <td>
                        <span className={`badge badge-${rental.status.toLowerCase()}`}>
                          {rental.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADMIN DASHBOARD VIEW */}
      {activeTab === 'admin' && currentUser && currentUser.role === 'ADMIN' && (
        <div className="animate-fade-in">
          {/* Analytical Metrics Cards */}
          <div className="stats-grid">
            <div className="stat-card glass-panel">
              <div className="stat-info">
                <span className="stat-label">Total Revenue</span>
                <span className="stat-value" style={{ color: 'var(--success)' }}>${adminMetrics.revenue.toFixed(2)}</span>
              </div>
              <div className="stat-icon success-style">
                <TrendingUp size={24} />
              </div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-info">
                <span className="stat-label">Vehicles Rented</span>
                <span className="stat-value">{adminMetrics.rentedCars}</span>
              </div>
              <div className="stat-icon secondary-style">
                <CarIcon size={24} />
              </div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-info">
                <span className="stat-label">Pending Requests</span>
                <span className="stat-value">{adminMetrics.pendingRequests}</span>
              </div>
              <div className="stat-icon">
                <Clock size={24} />
              </div>
            </div>
          </div>

          {/* Admin Tabs */}
          <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border-color)', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.4rem', paddingBottom: '12px', borderBottom: '2px solid var(--accent)' }}>Fleet & Booking Manager</h3>
          </div>

          {/* Fleet Manager */}
          <div style={{ marginBottom: '60px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h4 style={{ fontSize: '1.2rem' }}>Fleet Collection</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Add, update, or remove fleet cars</p>
              </div>
              <button className="btn-primary" onClick={() => { setEditingCar(null); setCarForm({ brand: '', model: '', pricePerDay: '', status: 'AVAILABLE', imageUrl: '' }); setShowCarModal(true); }}>
                <Plus size={16} />
                Add Vehicle
              </button>
            </div>

            <div className="table-container glass-panel">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Brand</th>
                    <th>Model</th>
                    <th>Price / Day</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cars.map(car => (
                    <tr key={car.id}>
                      <td>
                        <img src={car.imageUrl} alt={car.model} style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                      </td>
                      <td><strong>{car.brand}</strong></td>
                      <td>{car.model}</td>
                      <td>${car.pricePerDay}</td>
                      <td>
                        <span className={`badge badge-${car.status.toLowerCase()}`}>
                          {car.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-secondary" style={{ padding: '6px 12px' }} onClick={() => { setEditingCar(car); setCarForm(car); setShowCarModal(true); }}>
                            <Edit size={14} />
                          </button>
                          <button className="btn-secondary" style={{ padding: '6px 12px', color: 'rgba(239, 68, 68, 0.8)' }} onClick={() => handleDeleteCar(car.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Booking Approver Manager */}
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '1.2rem' }}>Rental Approvals</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage, approve, or reject customer rental requests</p>
            </div>

            {rentals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                No reservation requests logged yet.
              </div>
            ) : (
              <div className="table-container glass-panel">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Vehicle</th>
                      <th>Dates</th>
                      <th>Total Cost</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentals.map(rental => (
                      <tr key={rental.id}>
                        <td>
                          <strong>{rental.user.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{rental.user.email}</div>
                        </td>
                        <td>
                          <strong>{rental.car.brand}</strong> {rental.car.model}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem' }}>{rental.startDate}</span> to <span style={{ fontSize: '0.85rem' }}>{rental.endDate}</span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>${rental.totalCost.toFixed(2)}</td>
                        <td>
                          <span className={`badge badge-${rental.status.toLowerCase()}`}>
                            {rental.status}
                          </span>
                        </td>
                        <td>
                          {rental.status === 'PENDING' ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className="btn-success" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleRentalStatusUpdate(rental.id, 'APPROVED')}>
                                <Check size={14} /> Approve
                              </button>
                              <button className="btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleRentalStatusUpdate(rental.id, 'REJECTED')}>
                                <X size={14} /> Reject
                              </button>
                            </div>
                          ) : rental.status === 'APPROVED' ? (
                            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleRentalStatusUpdate(rental.id, 'COMPLETED')}>
                              Mark Completed
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No actions pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
