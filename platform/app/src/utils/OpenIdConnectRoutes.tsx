import React from 'react';
import { useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router';
import CallbackPage from '../routes/CallbackPage';

function OpenIdConnectRoutes({ routerBasename, userAuthenticationService }) {
  //const userManager = initUserManager(oidc, routerBasename);
  const userManager = {
    signinRedirect: () => {
      return <div></div>;
    },
  };

  //const userManager = {};
  const getAuthorizationHeader = () => {
    const user = userAuthenticationService.getUser();
    let response;
    //aca meter el bearer
    const cookies = document.cookie.split('; ');
    let cookieValue = '';
    cookies.forEach(cookie => {
      const [name, value] = cookie.split('=');
      if (name === 'fetchedData') {
        cookieValue = decodeURIComponent(value);
      }
    });

    if (cookieValue) {
      response = JSON.parse(cookieValue); // Parsear el valor de la cookie
    } else {
      console.log('No cookie found');
    }
    //aca
    return {
      Authorization: `Bearer ${response.access_token}`,
    };
  };

  const handleUnauthenticated = async () => {
    await userManager.signinRedirect();

    // return null because this is used in a react component
    return null;
  };

  const navigate = useNavigate();

  //for multi-tab logout
  useEffect(() => {
    localStorage.removeItem('signoutEvent');
    const storageEventListener = event => {
      const signOutEvent = localStorage.getItem('signoutEvent');
      if (signOutEvent) {
        navigate(`/logout?redirect_uri=${encodeURIComponent(window.location.href)}`);
      }
    };

    window.addEventListener('storage', storageEventListener);

    return () => {
      window.removeEventListener('storage', storageEventListener);
    };
  }, []);

  useEffect(() => {
    userAuthenticationService.set({ enabled: false });

    userAuthenticationService.setServiceImplementation({
      getAuthorizationHeader,
      handleUnauthenticated,
    });
  }, []);

  const location = useLocation();

  const { pathname, search } = location;

  const redirectURI = 'http://localhost:3000/callback';
  const silentRedirectURI = 'http://localhost:3000/silent-refresh.html';

  const redirect_uri = new URL(redirectURI).pathname.replace(
    routerBasename !== '/' ? routerBasename : '',
    ''
  );
  const silent_refresh_uri = new URL(silentRedirectURI).pathname; //.replace(routerBasename,'')

  if (pathname !== redirect_uri) {
    sessionStorage.setItem('ohif-redirect-to', JSON.stringify({ pathname, search }));
  }

  return (
    <Routes>
      <Route
        path={silent_refresh_uri}
        onEnter={window.location.reload}
      />

      <Route
        path={redirect_uri}
        element={
          <CallbackPage
            userManager={userManager}
            onRedirectSuccess={user => {
              const { pathname, search = '' } = JSON.parse(
                sessionStorage.getItem('ohif-redirect-to')
              );

              userAuthenticationService.setUser(user);

              navigate({
                pathname,
                search,
              });
            }}
          />
        }
      />
    </Routes>
  );
}

export default OpenIdConnectRoutes;
