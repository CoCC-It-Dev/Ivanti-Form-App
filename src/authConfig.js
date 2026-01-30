export const msalConfig = {
  auth: {
    clientId: "0cc307bd-c6a2-4ecf-ae9d-ebaab8e23b8f",                                    // Replace with your Client ID from Azure
    authority: "https://login.microsoftonline.com/33170101-7011-4613-a76e-288fd5841594",    // Replace with your Tenant ID
   redirectUri: "http://localhost:3000/",                              // Must match Azure registration
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  }
};

export const loginRequest = {
  scopes: ["User.Read"]
};

export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};
