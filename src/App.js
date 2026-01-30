import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MsalAuthenticationTemplate } from '@azure/msal-react';
import { InteractionType } from '@azure/msal-browser';

import Dashboard from './components/Dashboard';
import { loginRequest } from './authConfig';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <MsalAuthenticationTemplate 
  interactionType={InteractionType.Redirect} 
  authenticationRequest={loginRequest}
  loadingComponent={() => <p>Authenticating with Microsoft... Please wait.</p>}
  errorComponent={({error}) => <p>Error: {error.errorMessage}</p>}
>
  <Dashboard />
</MsalAuthenticationTemplate>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
