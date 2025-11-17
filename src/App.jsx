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
        })
        .catch(() => setLoading(false));
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
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg,#f97316,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem'}}>
      <div style={{background:'white', padding:'3rem', borderRadius:'1.5rem', boxShadow:'0 25px 50px rgba(0,0,0,0.3)', width:'420px', maxWidth:'100%', textAlign:'center'}}>
        <div style={{width:'90px', height:'90px', background:'linear-gradient(to right,#f97316,#22c55e)', borderRadius:'1.2rem', margin:'0 auto 1.5rem'}}></div>
        <h1 style={{fontSize:'2.2rem', fontWeight:'bold', color:'#1e293b', marginBottom:'0.5rem'}}>Pech Fruits Tracker</h1>
        <p style={{color:'#64748b', marginBottom:'2rem'}}>Sign in to view your live shipments</p>
        <form onSubmit={handleLogin} style={{display:'grid', gap:'1rem'}}>
          <input type="email" placeholder="Email" required value={email} onChange={e=>setEmail(e.target.value)}
            style={{padding:'1rem 1.2rem', border:'1px solid #cbd5e1', borderRadius:'0.8rem', fontSize:'1.1rem'}} />
          <input type="password" placeholder="Password" required value={password} onChange={e=>setPassword(e.target.value)}
            style={{padding:'1rem 1.2rem', border:'1px solid #cbd5e1', borderRadius:'0.8rem', fontSize:'1.1rem'}} />
          <button type="submit"
            style={{padding:'1rem', background:'linear-gradient(to right,#ea580c,#16a34a)', color:'white', fontWeight:'bold', border:'none', borderRadius:'0.8rem', fontSize:'1.1rem', cursor:'pointer'}}>
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
      <header style={{background:'white', boxShadow:'0 4px 20px rgba(0,0,0,0.1)', position:'sticky', top:0, zIndex:50}}>
        <div style={{maxWidth:'1800px', margin:'0 auto', padding:'1.2rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{display:'flex', alignItems:'center', gap:'4rem'}}>
            <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
              <div style={{width:'48px', height:'48px', background:'linear-gradient(to right,#f97316,#22c55e)', borderRadius:'12px'}}></div>
              <h1 style={{fontSize:'2rem', fontWeight:'bold', color:'#1e293b'}}>Pech Fruits Tracker</h1>
            </div>
            <nav style={{display:'flex', gap:'2.5rem'}}>
              <a href="#" style={{color:'#475569', fontWeight:'600', fontSize:'1.1rem'}}>Dashboard</a>
              <a href="#" style={{color:'#ea580c', fontWeight:'bold', fontSize:'1.1rem', borderBottom:'4px solid #ea580c', paddingBottom:'0.4rem'}}>Shipments</a>
              <a href="#" style={{color:'#475569', fontWeight:'600', fontSize:'1.1rem'}}>Documents</a>
            </nav>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:'2.5rem'}}>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:'0.9rem', color:'#64748b'}}>Logged in as</div>
              <div style={{fontWeight:'bold', color:'#1e293b', fontSize:'1.1rem'}}>{userConsignee === 'ALL' ? 'ALL CLIENTS' : userConsignee}</div>
            </div>
            <button onClick={()=>auth.signOut().then(()=>setUser(null))}
              style={{background:'#dc2626', color:'white', padding:'0.9rem 1.8rem', borderRadius:'0.8rem', border:'none', fontWeight:'bold', fontSize:'1rem', cursor:'pointer'}}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main style={{maxWidth:'1800px', margin:'3rem auto', padding:'0 2rem'}}>
        <h2 style={{fontSize:'2.2rem', fontWeight:'bold', color:'#1e293b', marginBottom:'2rem'}}>Live Shipments ({total})</h2>

        <input
          type="text"
          placeholder="Search by container, vessel, reference, product, port..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{width:'100%', padding:'1.2rem 1.5rem', marginBottom:'2rem', border:'1px solid #cbd5e1', borderRadius:'1rem', fontSize:'1.1rem', boxShadow:'0 4px 10px rgba(0,0,0,0.05)'}}
        />

        {/* TABLE WITH VISIBLE HORIZONTAL SCROLLBAR AT BOTTOM */}
        <div style={{background:'white', borderRadius:'1.2rem', boxShadow:'0 15px 35px rgba(0,0,0,0.1)', overflow:'hidden'}}>
          <div style={{maxWidth:'100%', overflowX:'auto', WebkitOverflowScrolling:'touch'}}>
            <table style={{width:'100%', minWidth:'2200px', borderCollapse:'collapse', tableLayout:'fixed'}}>
              <thead style={{background:'#f8fafc', position:'sticky', top:0, zIndex:10}}>
                <tr>
                  {Object.keys(filteredShipments[0] || {}).map(h => {
                    const widths = {
                      'NR': '70px', 'VESSEL': '220px', 'CONTAINER': '170px', 'REF': '130px',
                      'INV': '130px', 'STATUS': '150px', 'CONSIGNEE': '240px', 'PRODUCTS': '260px',
                      'POL': '140px', 'POD': '140px', 'ETD': '140px', 'LIVE ETA': '140px', 'DOCS': '100px'
                    };
                    return (
                      <th key={h} style={{
                        padding:'1.3rem 1rem', textAlign:'left', fontWeight:'bold', color:'#1e293b',
                        fontSize:'0.95rem', whiteSpace:'nowrap', width: widths[h] || '150px',
                        borderBottom:'3px solid #e2e8f0'
                      }}>
                        {h}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredShipments.length === 0 ? (
                  <tr><td colSpan="20" style={{textAlign:'center', padding:'6rem', color:'#94a3b8', fontSize:'1.2rem'}}>No shipments found</td></tr>
                ) : filteredShipments.map((row, i) => (
                  <tr key={i} style={{background: i % 2 === 0 ? '#ffffff' : '#fdfdfd'}}>
                    {Object.values(row).map((cell, j) => (
                      <td key={j} style={{
                        padding:'1.1rem 1rem', whiteSpace:'nowrap', overflow:'hidden',
                        textOverflow:'ellipsis', color:'#334155', fontSize:'0.98rem'
                      }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
