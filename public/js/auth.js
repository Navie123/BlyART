/**
 * auth.js — login / logout logic.
 */
const Auth = (() => {
  function isLoggedIn() { return !!API.getToken(); }

  async function login(username, password) {
    const data = await API.post('/auth/login', { username, password });
    API.setToken(data.token);
    API.setUser(data.user);
    return data.user;
  }

  function logout() {
    API.clearToken();
    window.location.reload();
  }

  function currentUser() { return API.getUser(); }

  return { isLoggedIn, login, logout, currentUser };
})();
