import { useState, useEffect } from 'react';

function App() {
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [activeTab, setActiveTab] = useState('feed');
  const [currentUser, setCurrentUser] = useState(null);
  
  // 'login', 'register', 'community', 'post', null
  const [showForm, setShowForm] = useState(null); 
  const [activeCommentPost, setActiveCommentPost] = useState(null);

  const [formData, setFormData] = useState({
    username: '', password: '', commName: '', commSlug: '', 
    postTitle: '', postContent: '', postCommId: '', commentContent: ''
  });

  const fetchData = () => {
    fetch('http://127.0.0.1:8000/api/posts').then(res => res.json()).then(data => setPosts(data));
    fetch('http://127.0.0.1:8000/api/communities').then(res => res.json()).then(data => setCommunities(data));
  };

  useEffect(() => { fetchData(); }, []);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- Auth Handlers ---
  const handleAuth = async (e, type) => {
    e.preventDefault();
    const endpoint = type === 'register' ? 'signup' : 'login';
    const res = await fetch(`http://127.0.0.1:8000/api/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: formData.username, password: formData.password })
    });
    const data = await res.json();
    if (res.ok) {
      setCurrentUser({ id: data.user_id, username: data.username });
      setShowForm(null);
      setFormData({...formData, username: '', password: ''});
    } else {
      alert(data.detail || "Authentication failed");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowForm(null);
  };

  // --- Content Handlers ---
  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    await fetch('http://127.0.0.1:8000/api/communities', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: formData.commName, slug: formData.commSlug })
    });
    setShowForm(null); fetchData(); setActiveTab('communities');
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    await fetch('http://127.0.0.1:8000/api/posts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: formData.postTitle, content: formData.postContent, community_id: parseInt(formData.postCommId), author_id: currentUser.id })
    });
    setShowForm(null); fetchData(); setActiveTab('feed');
  };

  const handleVote = async (postId, type) => {
    if (!currentUser) return alert('Please login to vote');
    await fetch('http://127.0.0.1:8000/api/votes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: type, post_id: postId, user_id: currentUser.id })
    });
    fetchData();
  };

  const handleComment = async (e, postId) => {
    e.preventDefault();
    if (!currentUser) return alert('Please login to comment');
    await fetch('http://127.0.0.1:8000/api/comments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: formData.commentContent, post_id: postId, author_id: currentUser.id })
    });
    setFormData({...formData, commentContent: ''});
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-300 font-sans pb-12">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center"><span className="text-white font-black text-xl">R</span></div>
          <h1 className="text-2xl font-extrabold text-white">Clone<span className="text-orange-500">.</span>MVP</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button onClick={() => {setActiveTab('feed'); setShowForm(null);}} className={`px-4 py-1.5 rounded-md text-sm font-semibold ${activeTab === 'feed' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Feed</button>
            <button onClick={() => {setActiveTab('communities'); setShowForm(null);}} className={`px-4 py-1.5 rounded-md text-sm font-semibold ${activeTab === 'communities' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Communities</button>
          </div>
          
          {currentUser ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-md">u/{currentUser.username}</span>
              <button onClick={handleLogout} className="text-sm text-rose-400 hover:text-rose-300 font-semibold border border-rose-500/30 px-3 py-1.5 rounded-md hover:bg-rose-500/10">Logout</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setShowForm('login')} className="text-slate-300 hover:text-white text-sm font-bold px-4 py-1.5 rounded-md">Login</button>
              <button onClick={() => setShowForm('register')} className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold px-4 py-1.5 rounded-md shadow-lg shadow-orange-600/20">Register</button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-6 mt-4">
        
        {/* Action Buttons */}
        {currentUser && !showForm && (
          <div className="flex gap-3 mb-6">
            <button onClick={() => setShowForm('post')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg shadow-md">+ Create Post</button>
            <button onClick={() => setShowForm('community')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg shadow-md">+ New Community</button>
          </div>
        )}

        {/* Forms Engine */}
        {(showForm === 'register' || showForm === 'login') && (
          <form onSubmit={(e) => handleAuth(e, showForm)} className="bg-slate-900/60 p-8 rounded-xl border border-orange-500/30 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">{showForm === 'login' ? 'Welcome Back' : 'Create an Account'}</h3>
            <input type="text" name="username" placeholder="Username" onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 mb-4 text-white" required />
            <input type="password" name="password" placeholder="Password" onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 mb-6 text-white" required />
            <div className="flex gap-3">
              <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-6 rounded-lg w-full">{showForm === 'login' ? 'Login' : 'Register'}</button>
              <button type="button" onClick={() => setShowForm(null)} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg">Cancel</button>
            </div>
          </form>
        )}

        {showForm === 'post' && (
          <form onSubmit={handleCreatePost} className="bg-slate-900/60 p-8 rounded-xl border border-slate-500/30 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Create a Post</h3>
            <select name="postCommId" onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 mb-4 text-white" required defaultValue="">
              <option value="" disabled>Select Community</option>
              {communities.map(c => <option key={c.id} value={c.id}>r/{c.name}</option>)}
            </select>
            <input type="text" name="postTitle" placeholder="Title" onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 mb-4 text-white" required />
            <textarea name="postContent" placeholder="Content" onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 mb-6 text-white h-32" required />
            <div className="flex gap-3">
              <button type="submit" className="bg-slate-200 hover:bg-white text-slate-900 font-bold py-3 px-6 rounded-lg w-full">Publish</button>
              <button type="button" onClick={() => setShowForm(null)} className="bg-slate-800 text-white font-bold py-3 px-6 rounded-lg">Cancel</button>
            </div>
          </form>
        )}

        {showForm === 'community' && (
          <form onSubmit={handleCreateCommunity} className="bg-slate-900/60 p-8 rounded-xl border border-indigo-500/30 shadow-2xl">
             <h3 className="text-2xl font-bold text-white mb-6">Create a Community</h3>
             <input type="text" name="commName" placeholder="Name (e.g. React)" onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 mb-4 text-white" required />
             <input type="text" name="commSlug" placeholder="Slug (e.g. react)" onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 mb-6 text-white" required />
             <div className="flex gap-3">
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg w-full">Launch</button>
              <button type="button" onClick={() => setShowForm(null)} className="bg-slate-800 text-white font-bold py-3 px-6 rounded-lg">Cancel</button>
            </div>
          </form>
        )}

        {/* Feed View */}
        {!showForm && activeTab === 'feed' && (
          <div className="space-y-6">
            {posts.map((post) => (
              <article key={post.id} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-orange-500 uppercase bg-orange-500/10 px-2 py-1 rounded">r/{post.community}</span>
                  <span className="text-xs text-slate-400">Posted by u/{post.author}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-100 mb-2">{post.title}</h2>
                <p className="text-slate-400 mb-4">{post.content}</p>
                
                {/* Voting & Toggle Comments */}
                <div className="flex space-x-3 mb-4">
                  <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700/50">
                    <button onClick={() => handleVote(post.id, 'up')} className="px-3 py-1.5 text-orange-500 hover:bg-slate-700 rounded-l-lg font-bold">▲</button>
                    <span className="px-2 text-white font-bold">{post.score}</span>
                    <button onClick={() => handleVote(post.id, 'down')} className="px-3 py-1.5 text-indigo-400 hover:bg-slate-700 rounded-r-lg font-bold">▼</button>
                  </div>
                  <button onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)} className="flex items-center gap-2 bg-slate-800/80 text-slate-300 px-4 py-1.5 rounded-lg border border-slate-700/50 hover:bg-slate-700">
                    💬 {post.comments.length} Comments
                  </button>
                </div>

                {/* Comments Section */}
                {activeCommentPost === post.id && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    {post.comments.map(c => (
                      <div key={c.id} className="mb-3 bg-slate-950/50 p-3 rounded border border-slate-800/50">
                        <span className="text-xs text-emerald-400 font-bold block mb-1">u/{c.author}</span>
                        <p className="text-sm text-slate-300">{c.content}</p>
                      </div>
                    ))}
                    {currentUser && (
                      <form onSubmit={(e) => handleComment(e, post.id)} className="flex gap-2 mt-3">
                        <input type="text" name="commentContent" value={formData.commentContent} onChange={handleInputChange} placeholder="Add a comment..." className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white" required />
                        <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded text-sm font-bold">Post</button>
                      </form>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {/* Communities View */}
        {!showForm && activeTab === 'communities' && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">Active Hubs</h2>
            <ul className="grid grid-cols-2 gap-4">
              {communities.map(comm => (
                <li key={comm.id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">r/</div>
                  <span className="font-bold text-slate-200">{comm.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;