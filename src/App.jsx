import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { auth, storage } from './firebase';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [emailMap, setEmailMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);

  // Set page title + favicon
  useEffect(() => {
    document.title = "Pech Fruits Tracker";
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.rel = 'icon';
    link.href = '/favicon.ico';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const s = document.createElement('script');
    s.src = '/data/email-consignee-map.js'; s.async = true;
    s.onload = () => window.EMAIL_CONSIGNEE_MAP && setEmailMap(window.EMAIL_CONSIGNEE_MAP);
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    if (user && Object.keys(emailMap).length) {
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
        });
    }
  }, [user, emailMap]);

  useEffect(() => {
    if (!searchTerm) setFilteredShipments(shipments);
    else setFilteredShipments(shipments.filter(r =>
      Object.values(r).some(v => v?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    ));
  }, [searchTerm, shipments]);

  const handleLogin = e => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then(u => setUser(u.user))
      .catch(err => alert(err.message));
  };

  const openDocuments = async (shipment) => {
    const refValue = shipment.REF || shipment.CONTAINER;
    setSelectedShipment(shipment);
    setDocsLoading(true);
    setDocs([]);

    try {
      const folderRef = ref(storage, `documents/${refValue}`);
      const result = await listAll(folderRef);
      const urls = await Promise.all(result.items.map(item => getDownloadURL(item)));
      
      const docsList = result.items.map((item, i) => ({
        name: item.name,
        url: urls[i],
        isOrderConf: item.name.toLowerCase().includes('order')
      }));

      setDocs(docsList.sort((a) => a.isOrderConf ? -1 : 1));
    } catch (err) {
      setDocs([{ name: 'No documents found', url: null }]);
    }
    setDocsLoading(false);
  };

  if (!user) return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg,#f97316,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem'}}>
      <div style={{background:'white', padding:'3rem', borderRadius:'1.5rem', boxShadow:'0 25px 50px rgba(0,0,0,0.3)', width:'420px', maxWidth:'95%', textAlign:'center'}}>
        <img src="/logo.jpg" alt="Pech Fruits" style={{width:'160px', height:'auto', margin:'0 auto 1.5rem', display:'block'}} />
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

  const currentConsignee = user ? emailMap[user.email.toLowerCase()] || user.email : '';
  const total = filteredShipments.length;

  return (
    <div style={{minHeight:'100vh', background:'#f8fafc', fontFamily:'system-ui,sans-serif'}}>
      {/* FINAL HEADER */}
      <header style={{background:'white', boxShadow:'0 4px 20px rgba(0,0,0,0.1)', position:'sticky', top:0, zIndex:50}}>
        <div style={{padding:'1rem', position:'relative', minHeight:'80px', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{textAlign:'center', position:'absolute', left:'50%', top:'50%', transform:'translate(-50%, -50%)'}}>
            <img src="/logo.jpg" alt="Pech Fruits" style={{height:'56px', width:'auto', display:'block', margin:'0 auto 0.4rem'}} />
            <h1 style={{fontSize:'1.6rem', fontWeight:'bold', color:'#1e293b', margin:0}}>Pech Fruits Tracker</h1>
          </div>
          <div style={{position:'absolute', left:'1rem', top:'50%', transform:'translateY(-50%)', fontSize:'0.95rem', color:'#475569'}}>
            Logged in as <strong style={{color:'#1e293b'}}>{currentConsignee}</strong>
          </div>
          <div style={{position:'absolute', right:'1rem', top:'50%', transform:'translateY(-50%)'}}>
            <button onClick={()=>auth.signOut().then(()=>setUser(null))}
              style={{background:'#dc2626', color:'white', padding:'0.65rem 1.3rem', borderRadius:'0.6rem', border:'none', fontWeight:'bold', fontSize:'0.95rem'}}>
              Logout
            </button>
          </div>
        </div>
      </header>

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
          <div style={{maxHeight:'70vh', overflow:'auto', WebkitOverflowScrolling:'touch'}}>
            <table style={{width:'100%', minWidth:'1200px', borderCollapse:'collapse'}}>
              {/* FROZEN (STICKY) HEADERS */}
              <thead style={{background:'#f1f5f9', position:'sticky', top:0, zIndex:10, boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
                <tr>
                  {Object.keys(filteredShipments[0] || {}).map((h, i) => (
                    <th key={i} style={{padding:'1rem 0.6rem', textAlign:'left', fontSize:'0.85rem', fontWeight:'bold', color:'#1e293b', whiteSpace:'nowrap'}}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredShipments.map((row, i) => {
                  const refValue = row.REF || row.CONTAINER || '';
                  const refIndex = Object.keys(row).findIndex(k => row[k] === refValue);

                  return (
                    <tr key={i} style={{background:i%2===0?'#fdfdfd':'#ffffff', borderTop:'1px solid #f1f5f9'}}>
                      {Object.values(row).map((cell, j) => (
                        <td key={j} style={{padding:'0.9rem 0.6rem', fontSize:'0.9rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                          {j === refIndex ? (
                            <span onClick={() => openDocuments(row)} style={{color:'#ea580c', fontWeight:'bold', textDecoration:'underline', cursor:'pointer'}}>
                              {cell}
                            </span>
                          ) : cell}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* DOCUMENTS MODAL — unchanged */}
        {selectedShipment && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem'}}>
            <div style={{background:'white', borderRadius:'1.5rem', width:'90%', maxWidth:'500px', maxHeight:'90vh', overflow:'auto', boxShadow:'0 25px 60px rgba(0,0,0,0.4)'}}>
              <div style={{padding:'1.5rem', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h3 style={{fontSize:'1.5rem', fontWeight:'bold', color:'#1e293b'}}>
                  Documents – {selectedShipment.REF || selectedShipment.CONTAINER}
                </h3>
                <button onClick={() => {setSelectedShipment(null); setDocs([])}} style={{fontSize:'2rem', color:'#6b7280', background:'none', border:'none', cursor:'pointer'}}>×</button>
              </div>
              <div style={{padding:'1.5rem', display:'grid', gap:'1rem'}}>
                {docsLoading ? <div style={{textAlign:'center', padding:'2rem', color:'#64748b'}}>Loading documents...</div>
                : docs.length === 0 ? <div style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>No documents uploaded yet</div>
                : docs.map((doc, i) => (
                    <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                      style={{padding:'1.2rem', background:doc.isOrderConf?'#f0fdf4':'#fefce8', border:doc.isOrderConf?'2px solid #86efac':'2px solid #fbbf24', borderRadius:'1rem', textAlign:'center', color:doc.isOrderConf?'#166534':'#92400e', fontWeight:'bold', textDecoration:'none', fontSize:'1rem'}}>
                      {doc.isOrderConf ? 'Order Confirmation' : 'Export Document'}<br/>
                      <small style={{fontWeight:'normal', color:'#475569'}}>{doc.name}</small>
                    </a>
                  ))
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
