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
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileImgUrl, setProfileImgUrl] = useState<string | null>(null);
  const [tempPodUrl, setTempPodUrl] = useState<string>("");

  // 🚩 1. Load saved Pod URL from localStorage if available
  useEffect(() => {
    const savedPodUrl = localStorage.getItem("podUrl");
    if (savedPodUrl) {
      setPodUrl(savedPodUrl);
    }
  }, []);

  // 🚩 2. Fetch WebID profile and related info after login
  useEffect(() => {
    async function fetchWebIdProfile() {
      if (!session.info.isLoggedIn || !session.info.webId) return;

      console.log("WebID:", session.info.webId);

      try {
        // Fetch the WebID document
        const response = await session.fetch(session.info.webId);
        console.log("WebID Fetch response status:", response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch WebID document: ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");
        console.log("Content-Type of WebID response:", contentType);

        const text = await response.text();
        console.log("Raw WebID document content:", text);

        const webIdDataset = await getSolidDataset(session.info.webId, { fetch: session.fetch });
        const webIdThing = getThing(webIdDataset, session.info.webId);

        if (!webIdThing) {
          console.warn("WebID Thing not found in the dataset.");
          return;
        }

        // Extract Pod Storage URL
        const storage = getUrl(webIdThing, "http://www.w3.org/ns/pim/space#storage");
        if (storage) {
          setPodUrl(storage);
          localStorage.setItem("podUrl", storage);
          console.log("Pod Storage URL:", storage);
        }

        const registrySetUrl = getUrl(webIdThing, "http://www.w3.org/ns/solid/interop#hasRegistrySet");
        if (registrySetUrl) {
            console.log("Registry Set URL:", registrySetUrl);
        }


        // Find Profile Document URL
        const profileUrl = getUrl(webIdThing, "http://www.w3.org/2000/01/rdf-schema#seeAlso") ||
                           getUrl(webIdThing, "http://xmlns.com/foaf/0.1/isPrimaryTopicOf");

        if (profileUrl) {
          console.log("Profile Document URL:", profileUrl);

          // Fetch the profile document
          const profileDataset = await getSolidDataset(profileUrl, { fetch: session.fetch });
          const profileThing = getThing(profileDataset, profileUrl);

          if (profileThing) {
            const name = getStringNoLocale(profileThing, "http://www.w3.org/2006/vcard/ns#fn") ||
                         getStringNoLocale(profileThing, "http://xmlns.com/foaf/0.1/name");

            const imgUrl = getUrl(profileThing, "http://xmlns.com/foaf/0.1/img") ||
                           getUrl(profileThing, "http://www.w3.org/2006/vcard/ns#hasPhoto");

            console.log("Extracted Name from Profile:", name);
            console.log("Extracted Profile Image URL:", imgUrl);

            if (name) setProfileName(name);

            if (imgUrl) {
              try {
                const imgResponse = await session.fetch(imgUrl);
                if (!imgResponse.ok) {
                  throw new Error(`Failed to fetch profile image: ${imgResponse.statusText}`);
                }
                const imgBlob = await imgResponse.blob();
                const objectUrl = URL.createObjectURL(imgBlob);
                setProfileImgUrl(objectUrl);
              } catch (imgError) {
                console.error("Error fetching profile image:", imgError);
              }
            }
          } else {
            console.warn("Profile Thing not found in profile document.");
          }
        } else {
          console.warn("No profile document URL found in WebID document.");
        }
      } catch (error) {
        console.error("Error fetching or parsing WebID profile:", error);
      }
    }

    fetchWebIdProfile();
  }, [session, session.info.isLoggedIn, session.info.webId]);

  // Handle manual Pod URL input (Fallback if needed)
  const handlePodUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempPodUrl) {
      localStorage.setItem("podUrl", tempPodUrl);
      setPodUrl(tempPodUrl);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("podUrl"); // Clear podUrl on logout
    window.location.reload(); // Force app reload
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
