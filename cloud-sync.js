(() => {
  const SUPABASE_URL = 'https://okqcbyemvdvrtpojrnjl.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_t3E0fjKytjg7i0V1zohdtg_YdNlkfmx';
  const client = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY);
  if (!client || !window.rooznegar) return;
  const authScreen=document.getElementById('authScreen'), appShell=document.getElementById('appShell');
  const authEmail=document.getElementById('authEmail'), authPassword=document.getElementById('authPassword'), rememberMe=document.getElementById('rememberMe'), authMessage=document.getElementById('authMessage');
  const setGate=ok=>{authScreen?.classList.toggle('hidden',ok);appShell?.classList.toggle('locked',!ok);document.querySelector('.topbar')?.classList.toggle('locked',!ok);if(ok)window.rooznegar.render('today')};
  const remembered=localStorage.getItem('rooznegar-remember-email');if(remembered&&authEmail){authEmail.value=remembered;rememberMe.checked=true}

  const bar = document.createElement('div');
  bar.className = 'cloud-sync-bar';
  bar.innerHTML = '<span id="cloudStatus">همگام‌سازی ابری: وارد نشده</span><button id="cloudLogin" class="secondary mini">ورود/ثبت‌نام</button><button id="cloudSync" class="secondary mini" hidden>همگام‌سازی</button><button id="cloudLogout" class="danger mini" hidden>خروج</button>';
  (document.getElementById('drawerCloudMount') || document.querySelector('.actions'))?.appendChild(bar);
  const status = (text, bad = false) => { const e = document.getElementById('cloudStatus'); if (e) { e.textContent = text; e.classList.toggle('cloud-error', bad); } };
  const syncNow = async () => {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;
    const payload = window.rooznegar.getData();
    const { error } = await client.from('rooznegar_data').upsert({ user_id: user.id, payload, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
    status('همگام‌سازی شد');
  };
  const loadRemote = async user => {
    const { data, error } = await client.from('rooznegar_data').select('payload,updated_at').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    if (data?.payload) window.rooznegar.replaceData(data.payload);
    else await syncNow();
  };
  const authSubmit=async(mode)=>{const email=authEmail?.value.trim(),password=authPassword?.value;if(!email||!password){if(authMessage)authMessage.textContent='ایمیل و رمز عبور را وارد کنید';return}if(authMessage)authMessage.textContent='در حال اتصال...';let result;try{result=mode==='signup'?await client.auth.signUp({email,password}):await client.auth.signInWithPassword({email,password})}catch(error){if(authMessage)authMessage.textContent='اتصال به سرویس ورود برقرار نشد';return}if(result.error){const text=result.error.message||'';if(authMessage)authMessage.textContent=text.includes('Invalid login credentials')?'ایمیل یا رمز عبور نادرست است':text.includes('Email not confirmed')?'ابتدا ایمیل حساب را تأیید کنید':text||'ورود ناموفق بود';return}if(rememberMe?.checked)localStorage.setItem('rooznegar-remember-email',email);else localStorage.removeItem('rooznegar-remember-email');if(result.data.session&&result.data.user){await loadRemote(result.data.user);update(result.data.user)}else if(mode==='signup'&&authMessage)authMessage.textContent='ثبت‌نام انجام شد؛ ایمیل تأیید را بررسی کنید، سپس وارد شوید.'};
  document.getElementById('authForm')?.addEventListener('submit',e=>{e.preventDefault();authSubmit('login').catch(()=>{if(authMessage)authMessage.textContent='خطا در اتصال'})});
  document.getElementById('authSignup')?.addEventListener('click',()=>authSubmit('signup').catch(()=>{if(authMessage)authMessage.textContent='خطا در ثبت‌نام'}));
  const update = user => {
    status(`متصل: ${user.email}`);
    document.getElementById('cloudLogin').hidden = true;
    document.getElementById('cloudSync').hidden = false;
    document.getElementById('cloudLogout').hidden = false;
    setGate(true);
  };
  document.getElementById('cloudLogin').onclick = () => authScreen?.classList.remove('hidden');
  document.getElementById('cloudSync').onclick = () => syncNow().catch(() => status('همگام‌سازی ناموفق بود', true));
  document.getElementById('cloudLogout').onclick = () => client.auth.signOut().then(() => location.reload());
  let timer;
  window.addEventListener('rooznegar:data-changed', () => { clearTimeout(timer); timer = setTimeout(() => syncNow().catch(() => {}), 900); });
  client.auth.onAuthStateChange(async (_event, user) => {
    if (user) {
      try { await loadRemote(user); } catch { status('اتصال ابری برقرار نشد', true); }
      update(user);
    } else setGate(false);
  });
  client.auth.getUser().then(async ({ data: { user } }) => {
    if (user) { try { await loadRemote(user); } catch {} update(user); }
    else setGate(false);
  });
})();
