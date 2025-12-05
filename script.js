const videos=[], AVATARS=['1.jpg','2.jpg','3.jpg','4.jpg','5.jpg','6.jpg','7.jpg','8.jpg','9.jpg','10.jpg','11.jpg','12.jpg','13.jpg','14.jpg','15.jpg','16.jpg'], ADMIN_AVATAR='admin.jpg', GENRES=['All','Action','Romance','Adventure'];

let users=[
  {username:'admin',password:'admin123',role:'admin',profile:ADMIN_AVATAR,playlist:[]},
  {username:'user',password:'1234',role:'user',profile:AVATARS[0],playlist:[]}
];

let currentUser=null, currentGenre='All', currentPlayingId=null;

const modal=document.getElementById('modal'),
      avatarGrid=document.getElementById('avatarGrid'),
      usernameInput=document.getElementById('usernameInput'),
      passwordInput=document.getElementById('passwordInput'),
      loginBtn=document.getElementById('loginBtn'),
      loginSubmit=document.getElementById('loginSubmit'),
      registerSubmit=document.getElementById('registerSubmit'),
      profileSection=document.getElementById('profileSection'),
      adminLoginBtn=document.getElementById('adminLoginBtn'),
      fileUpload=document.getElementById('fileUpload'),
      uploadBtn=document.getElementById('uploadBtn'),
      thumbGrid=document.getElementById('thumbGrid'),
      playlistGrid=document.getElementById('playlistGrid'),
      playlistSection=document.getElementById('playlistSection'),
      mainVideo=document.getElementById('mainVideo'),
      videoTitle=document.getElementById('videoTitle'),
      toggleMusic=document.getElementById('toggleMusic');

let selectedAvatarIndex=0;

// Render avatars
function renderAvatarGrid(){
  avatarGrid.innerHTML='';
  AVATARS.forEach((src,i)=>{
    const img=document.createElement('img'); 
    img.src=src; 
    img.dataset.idx=i;
    img.onclick=()=>{
      avatarGrid.querySelectorAll('img').forEach(x=>x.classList.remove('avatar-selected'));
      img.classList.add('avatar-selected'); 
      selectedAvatarIndex=i;
      if(currentUser && currentUser.role==='admin'){ 
        currentUser.profile=AVATARS[i]; 
        updateHeaderAvatar(); 
        alert('Admin avatar updated!'); 
      }
    };
    if(i===0) img.classList.add('avatar-selected');
    avatarGrid.appendChild(img);
  });
}
renderAvatarGrid();

function updateHeaderAvatar(){
  if(currentUser){
    profileSection.innerHTML=`<div style="display:flex;align-items:center;gap:8px">
      <img src="${currentUser.profile}" id="headerAvatar" alt="avatar">
      <div style="color:#fff">${currentUser.username}</div>
      <button id="logoutBtn" class="btn ghost" style="margin-left:8px">Logout</button>
    </div>`;
    document.getElementById('logoutBtn').onclick=logout;
    loginBtn.style.display='none';
  } else { profileSection.innerHTML=''; loginBtn.style.display='inline-block'; }
}

function applyUserToUI(){
  updateHeaderAvatar();
  uploadBtn.style.display=currentUser && currentUser.role==='admin'?'inline-block':'none';
  playlistSection.style.display=currentUser && currentUser.role==='user'?'block':'none';
}

// Login/Register
loginBtn.onclick=()=>{ modal.style.display='flex'; }
modal.onclick=e=>{ if(e.target===modal) modal.style.display='none'; }
loginSubmit.onclick=()=>{
  const u=usernameInput.value.trim(), p=passwordInput.value.trim(); 
  const user=users.find(x=>x.username===u && x.password===p); 
  if(!user){ alert('Invalid credentials'); return; } 
  currentUser=user; modal.style.display='none'; applyUserToUI(); renderThumbs(currentGenre);
}
registerSubmit.onclick=()=>{
  const u=usernameInput.value.trim(), p=passwordInput.value.trim(); 
  if(!u||!p){ alert('Enter username + password'); return; } 
  if(users.find(x=>x.username===u)){ alert('Username exists'); return; } 
  const profile=AVATARS[selectedAvatarIndex]; 
  const user={username:u,password:p,role:'user',profile:profile,playlist:[]}; 
  users.push(user); currentUser=user; modal.style.display='none'; applyUserToUI(); renderThumbs(currentGenre);
}

adminLoginBtn.onclick=()=>{
  const u=prompt('Admin username:'), p=prompt('Admin password:'); 
  if(u==='admin' && p==='admin123'){ currentUser=users.find(x=>x.role==='admin'); applyUserToUI(); alert('Admin logged in!'); renderThumbs(currentGenre); }
  else alert('Invalid admin creds'); 
}

function logout(){ 
  currentUser=null; mainVideo.src=''; videoTitle.textContent='Select a video…'; selectedAvatarIndex=0; 
  updateHeaderAvatar(); uploadBtn.style.display='none'; playlistSection.style.display='none'; renderThumbs('All'); 
}

// Side nav
document.querySelectorAll('nav.side a').forEach(a=>{
  a.onclick=e=>{ e.preventDefault(); currentGenre=a.textContent; renderThumbs(currentGenre); }; 
});

// Upload
fileUpload.addEventListener('change',async e=>{
  if(!currentUser||currentUser.role!=='admin'){ alert('Only admin can upload'); return; }
  for(const file of e.target.files){
    const id=Date.now()+Math.random(); 
    const src=URL.createObjectURL(file); 
    let thumb=await genThumb(file); 
    const title=prompt('Enter title:',file.name.replace(/\.[^/.]+$/,''))||'Untitled'; 
    let genre=prompt(`Enter genre (${GENRES.slice(1).join(', ')}):`,'Action'); 
    if(!GENRES.includes(genre)) genre='Action'; 
    videos.push({id,src,thumb,title,genre}); 
    renderThumbs(currentGenre);
  }
});

async function genThumb(file){ 
  return new Promise(res=>{
    const url=URL.createObjectURL(file), v=document.createElement('video'); 
    v.src=url; v.muted=true; 
    v.onloadeddata=()=>{ 
      const c=document.createElement('canvas'); c.width=300; c.height=170; 
      c.getContext('2d').drawImage(v,0,0,300,170); 
      c.toBlob(b=>res(URL.createObjectURL(b)),'image/jpeg',0.7); 
    }; 
  }); 
}

// Render videos
function renderThumbs(genre){
  thumbGrid.innerHTML='';
  const filtered=genre==='All'?videos:videos.filter(v=>v.genre===genre);
  filtered.forEach(v=>{
    const card=document.createElement('div'); card.className='card';
    let adminButtons=currentUser && currentUser.role==='admin'?`<button class='del-btn' onclick='delVid(${v.id})'>Delete</button>`:'';
    let userPlaylistBtn=currentUser && currentUser.role==='user'?`<button class='btn ghost' style='position:absolute;bottom:8px;right:8px;font-size:11px' onclick='addToPlaylist(${v.id},event)'>➕</button>`:'';
    card.innerHTML=`${adminButtons}<img src='${v.thumb}' style='width:100%;border-radius:8px'><h4 style='margin:8px 0;color:#fff'>${v.title}</h4>${userPlaylistBtn}`;
    card.onclick=()=>{ play(v); };
    thumbGrid.appendChild(card);
  });
  renderPlaylist();
}

// Playlist
function addToPlaylist(videoId,e){ 
  e.stopPropagation(); 
  if(!currentUser||currentUser.role!=='user'){ alert('Only users can add to playlist'); return; } 
  const video=videos.find(v=>v.id===videoId); 
  if(!video) return; 
  if(currentUser.playlist.find(v=>v.id===videoId)){ alert('Already in playlist'); return; } 
  currentUser.playlist.push(video); 
  renderPlaylist(); 
}

function renderPlaylist(){ 
  playlistGrid.innerHTML=''; 
  if(!currentUser||currentUser.role!=='user') return; 
  currentUser.playlist.forEach(v=>{
    const item=document.createElement('div'); item.className='card'; 
    item.style.display='flex'; item.style.alignItems='center'; item.style.gap='8px'; item.style.cursor='pointer'; 
    if(v.id===currentPlayingId) item.style.boxShadow='0 0 20px var(--accent)'; 
    item.innerHTML=`<img src='${v.thumb}' style='width:60px;height:40px;border-radius:6px;object-fit:cover'><div style='color:#fff'>${v.title}</div>`; 
    item.onclick=()=>{ play(v); currentPlayingId=v.id; renderPlaylist(); }; 
    playlistGrid.appendChild(item); 
  }); 
}

function play(v){ 
  mainVideo.src=v.src; videoTitle.textContent=v.title; mainVideo.play(); currentPlayingId=v.id; renderPlaylist(); 
}

function delVid(id){ 
  if(!currentUser||currentUser.role!=='admin'){ alert('Only admin can delete'); return; } 
  const i=videos.findIndex(x=>x.id===id); 
  if(i>-1){ if(videos[i].id===currentPlayingId) currentPlayingId=null; videos.splice(i,1); renderThumbs(currentGenre); } 
}
window.delVid=delVid;

// Music
const bg=new Audio('bg-music.mp3'); bg.loop=true; bg.volume=0.4; try{bg.play()}catch(e){}
toggleMusic.onclick=()=>{ if(bg.paused) bg.play(); else bg.pause(); }

// Initial render
renderThumbs('All');
