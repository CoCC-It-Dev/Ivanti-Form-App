import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest, graphConfig } from '../authConfig';
import { LogOut, User, CheckCircle, XCircle, X } from 'lucide-react';
import subjectSuggestions from '../data/subjectSuggestionsprod.json';

const Dashboard = () => {
  const { instance, accounts } = useMsal();
  const account = accounts[0];

  /* -----------------------------
     State
  ------------------------------*/
  const [userProfile, setUserProfile] = useState(null);
  const [userRecord, setUserRecord] = useState(null);

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  const [recordLoaded, setRecordLoaded] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [subject, setSubject] = useState('');
  const [symptom, setSymptom] = useState('');
  const [department, setDepartment] = useState('Apps Support');

  // Autocomplete
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Notification modal
  const [notification, setNotification] = useState({
    show: false,
    success: false,
    incidentNumber: '',
    errorMessage: '',
  });

  const hasRecId = Boolean(userRecord?.rec_id);

  /* -----------------------------
     Logout
  ------------------------------*/
  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: '/',
    });
  };

  /* -----------------------------
     Fetch Microsoft Graph profile
  ------------------------------*/
  const fetchUserProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      const graphResponse = await fetch(graphConfig.graphMeEndpoint, {
        headers: { Authorization: `Bearer ${response.accessToken}` },
      });

      const data = await graphResponse.json();
      setUserProfile(data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  /* -----------------------------
     Fetch internal user record
  ------------------------------*/
  const fetchUserRecord = async (email) => {
    if (!email) return;

    setIsLoadingRecord(true);
    setRecordLoaded(false);

    try {
      const response = await fetch(
        `http://10.9.4.46:9084/api/users?email=${encodeURIComponent(email)}`
      );

      if (!response.ok) throw new Error('Failed to fetch user record');

      const data = await response.json();
      setUserRecord(data ?? {});
    } catch (error) {
      console.error('Failed to fetch internal user record:', error);
      setUserRecord({});
    } finally {
      setIsLoadingRecord(false);
      setRecordLoaded(true);
    }
  };

  /* -----------------------------
     Load data when account exists
  ------------------------------*/
  useEffect(() => {
    if (!account) return;
    fetchUserProfile();
    fetchUserRecord(account.username);
  }, [account]);

  /* -----------------------------
     Subject Autocomplete
  ------------------------------*/
  const handleSubjectChange = (e) => {
    const value = e.target.value;
    setSubject(value);
    setSelectedIndex(-1);

    if (value.length === 0) {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      setDepartment('Apps Support');
      return;
    }

    const matches = subjectSuggestions.filter((item) =>
      item.subject.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  };

  const handleSubjectKeyDown = (e) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const selected = filteredSuggestions[selectedIndex];
      setSubject(selected.subject);
      setDepartment(selected.team);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  /* -----------------------------
     Submit incident
  ------------------------------*/
  const submitIncident = async () => {
    if (!hasRecId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('https://cctexasfinance.com:9090/ivanti/incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rec_id: userRecord.rec_id,
          contact_phone: userRecord.phone1,
          service: "Online Submission",
          description: symptom,
          subject: subject,
          category: "General",
          subcategory: "General",
          team: department,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Submission failed');
      }

      const data = await response.json();
      const incidentNumber = data.incident_number || data.incidentNumber || data.id || 'N/A';

      setNotification({
        show: true,
        success: true,
        incidentNumber: incidentNumber,
        errorMessage: '',
      });

      setSubject('');
      setSymptom('');
      setDepartment('Apps Support');
    } catch (error) {
      console.error(error);
      setNotification({
        show: true,
        success: false,
        incidentNumber: '',
        errorMessage: error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* -----------------------------
     UI
  ------------------------------*/
  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAV */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/cctexas.png" alt="Logo" className="w-8 h-8" />
              <span className="text-xl font-bold text-gray-900">
                Request Portal
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md p-6">

          {/* User Info */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              {/* <User className="w-8 h-8 text-indigo-600" /> */}
              <img src="/cctexas.png" alt="Logo" className="w-21 h-19" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {account?.name}
              </h3>
              <p className="text-gray-600">{account?.username}</p>
            </div>
          </div>

          {(isLoadingProfile || isLoadingRecord) && (
            <p className="text-center text-gray-600">Loading user details...</p>
          )}

          {recordLoaded && !hasRecId && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <h4 className="font-semibold text-red-700">
                Service unavailable at the moment
              </h4>
            </div>
          )}

          {recordLoaded && hasRecId && (
            <>
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                 <p>Record ID: {userRecord.rec_id}</p> 
                <p>Phone: {userRecord.phone1}</p>
              </div>

              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <h4 className="font-semibold mb-4">Submit Incident</h4>

                {/* Subject with Autocomplete */}
                <div className="relative mb-2">
                  <input
                    type="text"
                    placeholder="Subject"
                    value={subject}
                    onChange={handleSubjectChange}
                    onKeyDown={handleSubjectKeyDown}
                    onFocus={() => subject.length >= 1 && filteredSuggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => {
                        setShowSuggestions(false);
                        setSelectedIndex(-1);
                      }, 150)
                    }
                    className="w-full p-2 border rounded-lg"
                  />

                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredSuggestions.map((item, index) => (
                        <li
                          key={index}
                          onMouseDown={() => {
                            setSubject(item.subject);
                            setDepartment(item.team);
                            setShowSuggestions(false);
                            setSelectedIndex(-1);
                          }}
                          className={`px-3 py-2 cursor-pointer ${
                            index === selectedIndex
                              ? 'bg-blue-500 text-white'
                              : 'hover:bg-blue-100'
                          }`}
                        >
                          {item.subject}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <textarea
                  placeholder="Tell us your issue."
                  value={symptom}
                  onChange={(e) => setSymptom(e.target.value)}
                  className="w-full p-2 border rounded-lg mb-2"
                  rows={4}
                />

                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    readOnly
                    className="w-full p-2 border rounded-lg bg-gray-200 text-gray-700 cursor-not-allowed"
                  />
                </div>

                <button
                  onClick={submitIncident}
                  disabled={isSubmitting}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Incident'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Notification Modal */}
      {notification.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className={`px-6 py-4 ${notification.success ? 'bg-green-500' : 'bg-red-500'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {notification.success ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <XCircle className="w-6 h-6 text-white" />
                  )}
                  <h3 className="text-lg font-semibold text-white">
                    {notification.success ? 'Success' : 'Error'}
                  </h3>
                </div>
                <button
                  onClick={() => setNotification({ ...notification, show: false })}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              {notification.success ? (
                <div className="text-center">
                  <p className="text-gray-700 mb-4">
                    Your incident has been submitted successfully.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-600 mb-1">Incident Number</p>
                    <p className="text-2xl font-bold text-green-700">
                      {notification.incidentNumber}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Please save this number for your records.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-700 mb-4">
                    We were unable to submit your incident.
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700">
                      {notification.errorMessage}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Please try again or contact support if the problem persists.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t">
              <button
                onClick={() => setNotification({ ...notification, show: false })}
                className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-colors ${
                  notification.success
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {notification.success ? 'Done' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
