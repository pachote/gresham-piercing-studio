import React, { useState, useEffect } from 'react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://gresham-piercing-studio.onrender.com';

function App() {
  const [businessInfo, setBusinessInfo] = useState(null);
  const [pricingInfo, setPricingInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    piercing_type: '',
    jewelry_choice: '16g_bead_ring',
    is_minor: false,
    agreed_terms: false
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchBusinessInfo();
    fetchPricing();
  }, []);

  const fetchBusinessInfo = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/business-info`);
      const data = await response.json();
      setBusinessInfo(data);
    } catch (error) {
      console.error('Error fetching business info:', error);
    }
  };

  const fetchPricing = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/pricing`);
      const data = await response.json();
      setPricingInfo(data);
    } catch (error) {
      console.error('Error fetching pricing:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        signature: 'Digital signature placeholder',
        id_photo: 'ID photo placeholder'
      };

      const response = await fetch(`${BACKEND_URL}/api/release-form`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();
      if (result.success) {
        setMessage(`✅ Form submitted successfully! Your piercing price: $${result.pricing}`);
      } else {
        setMessage('❌ Error submitting form. Please try again.');
      }
    } catch (error) {
      setMessage('❌ Error submitting form. Please try again.');
      console.error('Error:', error);
    }
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <div className="container">
          <h1>Multnomah Body Piercing & Tattoo</h1>
          <nav>
            <button 
              className={activeTab === 'home' ? 'active' : ''} 
              onClick={() => setActiveTab('home')}
            >
              Home
            </button>
            <button 
              className={activeTab === 'release-form' ? 'active' : ''} 
              onClick={() => setActiveTab('release-form')}
            >
              Release Form
            </button>
            <button 
              className={activeTab === 'pricing' ? 'active' : ''} 
              onClick={() => setActiveTab('pricing')}
            >
              Pricing
            </button>
          </nav>
        </div>
      </header>

      <main className="container">
        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="tab-content">
            <div className="hero">
              <h2>Professional Body Piercing Services</h2>
              <p>Expert piercing with 3-month guarantee • Free downsizing included</p>
            </div>

            {businessInfo && (
              <div className="business-info">
                <h3>Visit Our Studio</h3>
                <div className="info-grid">
                  <div>
                    <h4>Location & Contact</h4>
                    <p>📍 {businessInfo.address}</p>
                    <p>📞 {businessInfo.phone}</p>
                    <p>✉️ {businessInfo.email}</p>
                  </div>
                  <div>
                    <h4>Business Hours</h4>
                    {businessInfo.hours && Object.entries(businessInfo.hours).map(([day, hours]) => (
                      <p key={day}>
                        <strong>{day.charAt(0).toUpperCase() + day.slice(1)}:</strong> {hours}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="policies">
                  <h4>Our Policies</h4>
                  <ul>
                    <li>🚶‍♂️ No appointments needed - Walk-ins welcome!</li>
                    <li>⏰ No piercings 30 minutes before closing</li>
                    <li>📞 Available during business hours for help</li>
                    <li>💎 3-month guarantee - free re-pierce if jewelry falls out</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Release Form Tab */}
        {activeTab === 'release-form' && (
          <div className="tab-content">
            <h2>Digital Release Form</h2>
            <form onSubmit={handleSubmit} className="release-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Piercing Type *</label>
                  <input
                    type="text"
                    value={formData.piercing_type}
                    onChange={(e) => setFormData({...formData, piercing_type: e.target.value})}
                    placeholder="e.g., Nostril, Helix, Tragus"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Jewelry Choice *</label>
                <select
                  value={formData.jewelry_choice}
                  onChange={(e) => setFormData({...formData, jewelry_choice: e.target.value})}
                  required
                >
                  <option value="16g_bead_ring">16g Bead Ring</option>
                  <option value="16g_labret_stud">16g Labret Stud with Clear Jewel</option>
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_minor}
                    onChange={(e) => setFormData({...formData, is_minor: e.target.checked})}
                  />
                  Client is under 18 (requires parent/guardian)
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.agreed_terms}
                    onChange={(e) => setFormData({...formData, agreed_terms: e.target.checked})}
                    required
                  />
                  I agree to the terms and conditions *
                </label>
              </div>

              <button type="submit" className="submit-btn">
                Submit Release Form
              </button>

              {message && <div className="message">{message}</div>}
            </form>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && pricingInfo && (
          <div className="tab-content">
            <h2>Piercing Prices</h2>
            
            <div className="pricing-section">
              <h3>Specialty Piercings</h3>
              <div className="pricing-grid">
                {Object.entries(pricingInfo.single_piercings).map(([key, item]) => (
                  <div key={key} className="price-item">
                    <span className="service">{item.name}</span>
                    <span className="price">${item.price}</span>
                    {key === 'set_of_earlobes' && <small>*No downsize included</small>}
                  </div>
                ))}
              </div>
            </div>

            <div className="pricing-section">
              <h3>Standard Piercings</h3>
              <div className="price-item">
                <span className="service">One piercing</span>
                <span className="price">${pricingInfo.standard_piercings.single.price}</span>
              </div>
              <div className="price-item">
                <span className="service">Two piercings</span>
                <span className="price">${pricingInfo.standard_piercings.pair.price}</span>
              </div>
              <p className="note">$20 for each additional piercing</p>
              
              <div className="piercing-types">
                <h4>Standard Piercing Types:</h4>
                <div className="types-grid">
                  {pricingInfo.standard_piercings.single.types.map((type) => (
                    <span key={type} className="piercing-type">{type}</span>
                  ))}
                </div>
              </div>

              <div className="guarantee">
                <h4>🎯 Downsize Schedule (FREE):</h4>
                <ul>
                  <li>Oral piercings: 2 weeks</li>
                  <li>Daith piercings: 4 months</li>
                  <li>All others: 3 months</li>
                  <li>Earlobes: No downsize included</li>
                </ul>
                <p>✨ <strong>{pricingInfo.guarantee}</strong></p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 Multnomah Body Piercing & Tattoo. Professional piercing services in Gresham, Oregon.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
