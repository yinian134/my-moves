/**
 * 登录/注册页面JavaScript
 */

// 切换登录/注册标签
function switchTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabs = document.querySelectorAll('.tab-btn');

  tabs.forEach(btn => btn.classList.remove('active'));

  if (tab === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    tabs[0].classList.add('active');
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    tabs[1].classList.add('active');
  }
}

// 处理登录
async function handleLogin(event) {
  event.preventDefault();
  
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  const messageDiv = document.getElementById('loginMessage');

  try {
    const result = await userAPI.login({ username, password });
    
    if (result.success) {
      // 保存token和用户信息
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('userInfo', JSON.stringify(result.data.user));
      
      messageDiv.className = 'message success';
      messageDiv.textContent = '登录成功，正在跳转...';
      
      // 跳转到首页
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } else {
      messageDiv.className = 'message error';
      messageDiv.textContent = result.message || '登录失败';
    }
  } catch (error) {
    console.error('登录错误:', error);
    messageDiv.className = 'message error';
    messageDiv.textContent = '登录失败，请稍后重试';
  }
}

// 处理注册
async function handleRegister(event) {
  event.preventDefault();
  
  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const phone = document.getElementById('registerPhone').value;
  const password = document.getElementById('registerPassword').value;
  const messageDiv = document.getElementById('registerMessage');

  try {
    const result = await userAPI.register({
      username,
      email: email || null,
      phone: phone || null,
      password
    });
    
    if (result.success) {
      messageDiv.className = 'message success';
      messageDiv.textContent = '注册成功，请登录';
      
      // 切换到登录标签
      setTimeout(() => {
        switchTab('login');
        document.getElementById('loginUsername').value = username;
      }, 1000);
    } else {
      messageDiv.className = 'message error';
      messageDiv.textContent = result.message || '注册失败';
    }
  } catch (error) {
    console.error('注册错误:', error);
    messageDiv.className = 'message error';
    messageDiv.textContent = '注册失败，请稍后重试';
  }
}

