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
            filtered = data.filter(r => 
              (r.CONSIGNEE || '').trim().toUpperCase() === consignee.trim().toUpperCase()
            );
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
      <div style={{background:'white', padding:'3rem', borderRadius:'1.5rem', boxShadow:'0 25px 50px rgba(0,0,0,0.3)', width:'420px', maxWidth:'95%', textAlign:'center'}}>
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
      {/* HEADER */}
      <header style={{background:'white', boxShadow:'0 4px 20px rgba(0,0,0,0.1)', position:'sticky', top:0, zIndex:50}}>
        <div style={{padding:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem'}}>
          <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
            <div style={{width:'40px', height:'40px', background:'linear-gradient(to right,#f97316,#22c55e)', borderRadius:'10px'}}></div>
            <h1 style={{fontSize:'1.5rem', fontWeight:'bold', color:'#1e293b'}}>Pech Fruits Tracker</h1>
          </div>
          <button onClick={()=>auth.signOut().then(()=>setUser(null))}
            style={{background:'#dc2626', color:'white', padding:'0.6rem 1.2rem', borderRadius:'0.6rem', border:'none', fontWeight:'bold'}}>
            Logout
          </button>
        </div>
      </header>

      {/* FULL-SCREEN CONTENT — NO MARGINS ON MOBILE */}
      <div style={{padding:'1rem', width:'100vw', marginLeft:'calc(50% - 50vw)', boxSizing:'border-box'}}>
        <h2 style={{fontSize:'1.8rem', fontWeight:'bold', color:'#1e293b', marginBottom:'1rem', textAlign:'center'}}>
          Live Shipments ({total})
        </h2>

        <input
          type="text"
          placeholder="Search anything..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{width:'100%', padding:'1rem', marginBottom:'1.5rem', border:'1px solid #cbd5e1', borderRadius:'1rem', fontSize:'1rem', boxSizing:'border-box'}}
        />

        <div style={{background:'white', borderRadius:'1rem', boxShadow:'0 10px 25px rgba(0,0,0,0.1)', overflow:'hidden'}}>
          <div style={{overflowX:'auto', WebkitOverflowScrolling:'touch'}}>
            <table style={{width:'100%', minWidth:'1200px', borderCollapse:'collapse'}}>
              <thead style={{background:'#f1f5f9', position:'sticky', top:0}}>
                <tr>
                  {Object.keys(filteredShipments[0] || {}).map(h => (
                    <th key={h} style={{padding:'1rem 0.6rem', textAlign:'left', fontSize:'0.85rem', fontWeight:'bold', color:'#1e293b', whiteSpace:'nowrap'}}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredShipments.slice(0, 100).map((row, i) => (
                  <tr key={i} style={{background:i%2===0?'#fdfdfd':'#ffffff', borderTop:'1px solid #f1f5f9'}}>
                    {Object.values(row).map((cell, j) => (
                      <td key={j} style={{padding:'0.9rem 0.6rem', fontSize:'0.9rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'150px'}}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
