import React, { useState, useEffect } from "react";
import {
  LoginButton,
  useSession,
} from "@inrupt/solid-ui-react";
import { 
  getSolidDataset, 
  getThing, 
  getStringNoLocale, 
  getUrl 
} from "@inrupt/solid-client";

const authOptions = {
  clientName: "Solid Todo App",
};

function App() {
  const { session } = useSession();

  const [podUrl, setPodUrl] = useState<string | null>(null);
  const [tempPodUrl, setTempPodUrl] = useState<string>("");
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileImgUrl, setProfileImgUrl] = useState<string | null>(null);

  // Load saved pod URL from localStorage
  useEffect(() => {
    const savedPodUrl = localStorage.getItem("podUrl");
    if (savedPodUrl) {
      setPodUrl(savedPodUrl);
    }
  }, []);

  // After login and having podUrl, fetch profile
  useEffect(() => {
    async function fetchProfile() {
      if (!session.info.isLoggedIn || !podUrl) return;

      try {
        const profileUrl = `${podUrl}profile`;
        console.log(`Fetching profile from: ${profileUrl}`);
        const profileDataset = await getSolidDataset(profileUrl, { fetch: session.fetch });
        const profileThing = getThing(profileDataset, `${podUrl}profile`);

        if (!profileThing) {
          console.warn("Profile thing not found.");
          return;
        }

        const name =
          getStringNoLocale(profileThing, "http://www.w3.org/2006/vcard/ns#fn") ||
          getStringNoLocale(profileThing, "http://xmlns.com/foaf/0.1/name");

        const imgUrl = getUrl(profileThing, "http://xmlns.com/foaf/0.1/img");

        if (name) {
          setProfileName(name);
        } else {
          console.warn("Name not found in profile document.");
        }

        if (imgUrl) {
          try {
            const imgResponse = await session.fetch(imgUrl);
            const imgBlob = await imgResponse.blob();
            const objectUrl = URL.createObjectURL(imgBlob);
            setProfileImgUrl(objectUrl);
          } catch (imgError) {
            console.error("Error fetching profile image:", imgError);
          }
        } else {
          console.warn("Profile image not found.");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    }

    fetchProfile();
  }, [session, podUrl]);

  const handlePodUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempPodUrl) {
      localStorage.setItem("podUrl", tempPodUrl);
      setPodUrl(tempPodUrl);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("podUrl"); // clear podUrl on logout
    window.location.reload(); // force app reload
  };

  return (
    <div className="app-container">
      {session.info.isLoggedIn ? (
        <>
          {podUrl ? (
            <div className="message logged-in">
              <span>You are logged in as: {profileName || session.info.webId}</span>
              <br />
              {profileImgUrl && (
                <img
                  src={profileImgUrl}
                  alt="Profile"
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginTop: "1rem"
                  }}
                />
              )}
              <br />
              <button onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <form onSubmit={handlePodUrlSubmit}>
              <label>
                Enter your Pod base URL (e.g., https://storage.inrupt.com/your-id/):
                <input
                  type="url"
                  value={tempPodUrl}
                  onChange={(e) => setTempPodUrl(e.target.value)}
                  required
                />
              </label>
              <button type="submit">Save Pod URL</button>
            </form>
          )}
        </>
      ) : (
        <div className="message">
          <span>You are not logged in.</span>
          <LoginButton
            oidcIssuer="https://login.inrupt.com"
            redirectUrl={window.location.href}
            authOptions={authOptions}
          />
        </div>
      )}
    </div>
  );
}

export default App;
