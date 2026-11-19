import React, { useMemo, useState } from 'react';
import './App.css';

const caregivers = [
  { id: 1, name: 'Mia K.', title: 'Dog walker | Pet sitter', rating: 4.98, reviews: 42, distance: '0.6 km away', price: 12, unit: 'walk', completed: 38, verified: true, image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=85', tags: ['Dogs', 'Cats', 'Flexible'], bio: 'Calm, attentive care and long neighborhood walks. I send photo updates during every booking.' },
  { id: 2, name: 'Alex R.', title: 'Dog walker', rating: 4.92, reviews: 28, distance: '1.1 km away', price: 10, unit: 'walk', completed: 26, verified: true, image: 'https://images.unsplash.com/photo-1500648767791-00fn4a7a3?auto=format&fit=crop&w=900&q=85', tags: ['Dogs', 'Active walks'], bio: "Enjoys exploring parks and adapting walks to your pet's pace and personality." },
  { id: 3, name: 'Laura P.', title: 'Pet sitter | Cat care', rating: 5.0, reviews: 19, distance: '1.8 km away', price: 16, unit: 'visit', completed: 19, verified: true, image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=85', tags: ['Cats', 'Small pets', 'Home visits'], bio: 'Home visits for feeding, playtime, medication reminders, and keeping pets comfortable.' },
  { id: 4, name: 'Noah T.', title: 'Pet sitter', rating: 4.87, reviews: 15, distance: '2.3 km away', price: 20, unit: 'day', completed: 15, verified: false, image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=85', tags: ['Dogs', 'Overnight'], bio: 'Small group or one-on-one care. Meet first to make sure we are a good fit.' },
];

function Icon({ name }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9M9 21v-7h6v7"/></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    heart: <path d="M20.5 8.5c0 4.5-8.5 10-8.5 10s-8.5-5.5-8.5-10a4.5 4.5 0 0 1 8.5-1.5 4.5 4.5 0 0 1 8.5 1.5Z"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  };
  return <svg viewBox="0 0 24 24" className="icon" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}


export default function App() {
  const [service, setService] = useState('walk');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recommended');
  const [saved, setSaved] = useState([]);
  const [activeTab, setActiveTab] = useState('discover');
  const [selected, setSelected] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingNote, setBookingNote] = useState('');
  const [booked, setBooked] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let items = caregivers.filter((c) => !term || `${c.name} ${c.title} ${c.tags.join(' ')}`.toLowerCase().includes(term));
    if (sort === 'rating') items = [...items].sort((a, b) => b.rating - a.rating);
    if (sort === 'price') items = [...items].sort((a, b) => a.price - b.price);
    if (sort === 'distance') items = [...items].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    return items;
  }, [search, sort]);

  const toggleSaved = (id) => setSaved((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const openBooking = (caregiver) => { setSelected(caregiver); setBooked(false); setBookingDate(''); setBookingTime(''); setBookingNote(''); };
  const submitBooking = (e) => { e.preventDefault(); setBooked(true); };

  return (
    <div className="app-shell">
      <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
      <header className="topbar">
        <a className="brand" href="#home" onClick={() => setActiveTab('discover')}><span className="brand-mark">P</span><span>paw<span className="brand-accent">pal</span></span></a>
        <button className="location-pill" aria-label="Change location"><Icon name="pin"/><span><small>LOCATION</small> Tallinn, Estonia</span><span className="chevron">v</span></button>
        <button className="avatar-button" aria-label="Profile">R</button>
      </header>

      <main className="main-content">
        {activeTab === 'discover' && <>
          <section className="hero-section">
            <div className="hero-copy"><p className="eyebrow">PET CARE, CLOSE TO HOME</p><h1>Good care.<br/><span>Peace of mind.</span></h1><p className="hero-description">Find trusted people nearby to walk, visit, or look after your pets.</p></div>
            <div className="hero-illustration"><div className="hero-circle"/><img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1000&q=90" alt="Happy dog"/><span className="floating-badge"><span className="badge-dot"/> Caring people nearby</span></div>
          </section>
          <section className="search-panel">
            <div className="service-switch"><button className={service === 'walk' ? 'selected' : ''} onClick={() => setService('walk')}>Dog walking</button><button className={service === 'sitting' ? 'selected' : ''} onClick={() => setService('sitting')}>Pet sitting</button></div>
            <div className="search-row"><div className="search-input-wrap"><Icon name="search"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, pet type, service..."/></div><button className="search-button" onClick={() => document.querySelector('.caregiver-grid')?.scrollIntoView({ behavior: 'smooth' })}>Find care <Icon name="arrow"/></button></div>
            <div className="search-foot"><span><Icon name="pin"/> Within <strong>5 km</strong> of you</span><span className="secure-note"><Icon name="check"/> Profiles & reviews matter</span></div>
          </section>
          <section className="trust-strip"><div className="trust-item"><span className="trust-icon"><Icon name="check"/></span><div><strong>Verified profiles</strong><small>Know who you book</small></div></div><div className="trust-item"><span className="trust-icon">5</span><div><strong>Real reviews</strong><small>From completed bookings</small></div></div><div className="trust-item"><span className="trust-icon"><Icon name="pin"/></span><div><strong>Nearby care</strong><small>Local people & places</small></div></div></section>
          <section className="list-section"><div className="section-heading"><div><p className="eyebrow">YOUR NEIGHBORHOOD</p><h2>Caregivers nearby</h2><p className="section-subtitle">People available to help your pet</p></div><label className="sort-select"><span>Sort:</span><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="recommended">Recommended</option><option value="rating">Top rated</option><option value="distance">Nearest</option><option value="price">Lowest price</option></select></label></div>
            <div className="caregiver-grid">{filtered.map((c) => <article className="care-card" key={c.id}><div className="care-photo-wrap"><img src={c.image} alt={`${c.name} profile`} className="care-photo"/><div className="photo-overlay"/><button className={`save-button ${saved.includes(c.id) ? 'saved' : ''}`} onClick={() => toggleSaved(c.id)} aria-label={saved.includes(c.id) ? 'Remove saved' : 'Save caregiver'}><Icon name="heart"/></button>{c.verified && <span className="verified-badge"><Icon name="check"/> Identity checked</span>}</div><div className="care-card-content"><div className="care-title-row"><div><h3>{c.name}</h3><p className="care-role">{service === 'walk' ? c.title : c.title.includes('sitter') ? c.title : 'Pet sitter | Home visits'}</p></div><div className="rating"><strong>{c.rating.toFixed(2)}</strong><small>({c.reviews})</small></div></div><div className="care-meta"><span><Icon name="pin"/>{c.distance}</span><span>{c.completed} bookings</span></div><p className="care-bio">{c.bio}</p><div className="tag-row">{c.tags.slice(0, 3).map(tag => <span key={tag} className="tag">{tag}</span>)}</div><div className="care-card-footer"><div className="price"><strong>{service === 'walk' ? c.price : c.price + 6} EUR</strong><span> / {service === 'walk' ? 'walk' : 'visit'}</span></div><button className="view-button" onClick={() => openBooking(c)}>View & book <Icon name="arrow"/></button></div></div></article>)}</div>
            {filtered.length === 0 && <div className="empty-state"><h3>No matches found</h3><p>Try a different name or pet type.</p></div>}
          </section>
        </>}
        {activeTab === 'map' && <section className="placeholder-screen"><span className="placeholder-icon"><Icon name="pin"/></span><h1>Map view</h1><p>Caregivers around your area will appear here when location services are enabled.</p><button className="primary-action" onClick={() => setActiveTab('discover')}>Browse caregivers</button></section>}
        {activeTab === 'bookings' && <section className="placeholder-screen"><span className="placeholder-icon"><Icon name="calendar"/></span><h1>Your bookings</h1><p>Upcoming pet walks and care visits will show here after you request a booking.</p><button className="primary-action" onClick={() => setActiveTab('discover')}>Find a caregiver</button></section>}
        {activeTab === 'profile' && <section className="placeholder-screen"><span className="placeholder-icon"><Icon name="user"/></span><h1>Your profile</h1><p>Manage your account, pets, saved caregivers, and preferences.</p><div className="profile-summary"><strong>{saved.length}</strong><span>Saved caregivers</span></div><button className="primary-action" onClick={() => setActiveTab('discover')}>Explore care</button></section>}
      </main>
      <nav className="bottom-nav"><button className={activeTab === 'discover' ? 'active' : ''} onClick={() => setActiveTab('discover')}><Icon name="home"/><span>Discover</span></button><button className={activeTab === 'map' ? 'active' : ''} onClick={() => setActiveTab('map')}><Icon name="map"/><span>Map</span></button><button className={activeTab === 'bookings' ? 'active' : ''} onClick={() => setActiveTab('bookings')}><Icon name="calendar"/><span>Bookings</span></button><button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}><Icon name="user"/><span>Profile</span></button></nav>
      {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><div className="booking-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)} aria-label="Close">X</button>{booked ? <div className="booking-success"><span className="success-icon"><Icon name="check"/></span><h2>Request prepared!</h2><p>Your booking request for {selected.name} is ready in this demo. In a real app, this would be sent to the caregiver.</p><button className="primary-action" onClick={() => setSelected(null)}>Done</button></div> : <><div className="modal-caregiver"><img src={selected.image} alt="Caregiver"/><div><h2>{selected.name}</h2><p>{selected.rating.toFixed(2)} | {selected.reviews} reviews</p><small>{selected.distance} | {selected.completed} bookings</small></div></div><h3 className="modal-heading">Request a service</h3><form onSubmit={submitBooking} className="booking-form"><label>Service date<input required type="date" min={new Date().toISOString().slice(0,10)} value={bookingDate} onChange={(e) => setBookingDate(e.target.value)}/></label><label>Preferred time<select required value={bookingTime} onChange={(e) => setBookingTime(e.target.value)}><option value="">Select time</option><option>Morning (8-12)</option><option>Afternoon (12-17)</option><option>Evening (17-21)</option></select></label><label>Notes for caregiver<textarea rows="3" placeholder="Tell them about your pet or special instructions..." value={bookingNote} onChange={(e) => setBookingNote(e.target.value)}/></label><div className="modal-price"><span>Estimated service price</span><strong>{service === 'walk' ? selected.price : selected.price + 6} EUR</strong></div><button className="primary-action full-width" type="submit">Request booking <Icon name="arrow"/></button><p className="form-disclaimer">No payment in this demo. Confirm details with the caregiver before booking.</p></form></>}</div></div>}
      <footer className="footer"><span>pawpal | Pet care, closer to home</span><span>Demo front-end | Sample profiles</span></footer>
    </div>
  );
}
