import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emailMap, setEmailMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const s = document.createElement('script');
    s.src = '/data/email-consignee-map.js'; s.async = true;
    s.onload = () => window.EMAIL_CONSIGNEE_MAP && setEmailMap(window.EMAIL_CONSIGNEE_MAP);
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    if (user && Object.keys(emailMap).length) {
      setLoading(true);
      fetch('/data/shipments.json')
        .then(r => r.json())
        .then(data => {
          const consignee = emailMap[user.email.toLowerCase()];
          let filtered = data;
          if (consignee && consignee !== "ALL") {
            filtered = data.filter(r => (r.CONSIGNEE || '').trim().toUpperCase() === consignee.trim().toUpperCase());
          }
          setShipments(filtered);
          setFilteredShipments(filtered);
          setLoading(false);
        });
    }
  }, [user, emailMap]);

  useEffect(() => {
    if (!searchTerm) setFilteredShipments(shipments);
    else setFilteredShipments(shipments.filter(r => 
      Object.values(r).some(v => v.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    ));
  }, [searchTerm, shipments]);

  const handleLogin = e => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then(u => setUser(u.user))
      .catch(err => alert(err.message));
  };

  if (!user) return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg,#f97316,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{background:'white', padding:'3rem', borderRadius:'1.5rem', boxShadow:'0 20px 40px rgba(0,0,0,0.3)', width:'400px', textAlign:'center'}}>
        <div style={{width:'80px', height:'80px', background:'linear-gradient(to right,#f97316,#22c55e)', borderRadius:'1rem', margin:'0 auto 1.5rem'}}></div>
        <h1 style={{fontSize:'2rem', fontWeight:'bold', marginBottom:'0.5rem'}}>Pech Fruits Tracker</h1>
        <form onSubmit={handleLogin} style={{marginTop:'2rem'}}>
          <input type="email" placeholder="Email" required value={email} onChange={e=>setEmail(e.target.value)}
            style={{width:'100%', padding:'1rem', marginBottom:'1rem', border:'1px solid #ccc', borderRadius:'0.75rem', fontSize:'1rem'}} />
          <input type="password" placeholder="Password" required value={password} onChange={e=>setPassword(e.target.value)}
            style={{width:'100%', padding:'1rem', marginBottom:'1.5rem', border:'1px solid #ccc', borderRadius:'0.75rem', fontSize:'1rem'}} />
          <button type="submit" style={{width:'100%', padding:'1rem', background:'linear-gradient(to right,#f97316,#22c55e)', color:'white', fontWeight:'bold', border:'none', borderRadius:'0.75rem', fontSize:'1.1rem', cursor:'pointer'}}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );

  const userConsignee = emailMap[user.email.toLowerCase()] || 'Restricted';
  const total = filteredShipments.length;

  return (
    <div style={{minHeight:'100vh', background:'#f8fafc', fontFamily:'system-ui,sans-serif'}}>
      {/* TOP BAR - 100% GUARANTEED HORIZONTAL */}
      <header style={{background:'white', boxShadow:'0 4px 6px rgba(0,0,0,0.1)', position:'sticky', top:0, zIndex:50}}>
        <div style={{maxWidth:'1400px', margin:'0 auto', padding:'1rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{display:'flex', alignItems:'center', gap:'3rem'}}>
            <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
              <div style={{width:'40px', height:'40px', background:'linear-gradient(to right,#f97316,#22c55e)', borderRadius:'8px'}}></div>
              <h1 style={{fontSize:'1.8rem', fontWeight:'bold', color:'#1e293b'}}>Pech Fruits Tracker</h1>
            </div>
            <nav style={{display:'flex', gap:'2rem'}}>
              <a href="#" style={{color:'#475569', fontWeight:'500'}}>Dashboard</a>
              <a href="#" style={{color:'#ea580c', fontWeight:'bold', borderBottom:'3px solid #ea580c', paddingBottom:'0.25rem'}}>Shipments</a>
              <a href="#" style={{color:'#475569', fontWeight:'500'}}>Documents</a>
            </nav>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:'2rem'}}>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:'0.8rem', color:'#64748b'}}>Logged in as</div>
              <div style={{fontWeight:'bold', color:'#1e293b'}}>{userConsignee === 'ALL' ? 'ALL CLIENTS' : userConsignee}</div>
            </div>
            <button onClick={()=>auth.signOut().then(()=>setUser(null))}
              style={{background:'#dc2626', color:'white', padding:'0.75rem 1.5rem', borderRadius:'0.5rem', border:'none', fontWeight:'bold', cursor:'pointer'}}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main style={{maxWidth:'1400px', margin:'2rem auto', padding:'0 2rem'}}>
        <h2 style={{fontSize:'2rem', fontWeight:'bold', marginBottom:'2rem', color:'#1e293b'}}>Live Shipments ({total})</h2>
        
        <input type="text" placeholder="Search anything..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
          style={{width:'100%', padding:'1rem', marginBottom:'2rem', border:'1px solid #e2e8f0', borderRadius:'0.75rem', fontSize:'1.1rem'}} />

        {loading ? <p>Loading...</p> : (
          <div style={{overflowX:'auto', background:'white', borderRadius:'1rem', boxShadow:'0 10px 25px rgba(0,0,0,0.1)'}}>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead style={{background:'#f1f5f9'}}>
                <tr>{Object.keys(filteredShipments[0]||{}).map(h=><th key={h} style={{padding:'1rem', textAlign:'left', fontWeight:'bold', color:'#475569'}}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filteredShipments.map((row,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid #e2e8f0'}}>
                    {Object.values(row).map((c,j)=><td key={j} style={{padding:'1rem'}}>{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
