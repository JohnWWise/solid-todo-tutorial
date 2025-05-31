import React from "react";
import { useSession } from "@inrupt/solid-ui-react";
import { overwriteFile } from "@inrupt/solid-client";

function ProfileUploader() {
  const { session } = useSession();

  const handleUpload = async () => {
    if (!session.info.isLoggedIn) {
      alert("You must be logged in to upload your profile.");
      return;
    }

    // 🚨 Replace this with your actual Pod storage URL
    const podStorageUrl = "https://storage.inrupt.com/e6f86213-f198-47d7-a7d8-4de3638729ac/";

    // RDF Turtle Content
    const turtleContent = `
      @prefix : <#>.
      @prefix foaf: <http://xmlns.com/foaf/0.1/>.
      @prefix vcard: <http://www.w3.org/2006/vcard/ns#>.
      @prefix solid: <http://www.w3.org/ns/solid/terms#>.

      :me a foaf:Person, vcard:Individual;
          foaf:name "John Wise";
          vcard:fn "John Wise";
          vcard:hasEmail <mailto:jwalterwi@gmail.com>;
          solid:account <${podStorageUrl}>.
    `;

    try {
      const blob = new Blob([turtleContent], { type: "text/turtle" });

      const fileUrl = `${podStorageUrl}profile/card`; // Standard Solid profile path

      await overwriteFile(fileUrl, blob, {
        contentType: "text/turtle",
        fetch: session.fetch,
      });

      alert("Profile successfully uploaded!");
    } catch (error) {
      console.error("Error uploading profile:", error);
      alert("Failed to upload profile.");
    }
  };

  return (
    <div>
      <button onClick={handleUpload}>Upload Profile</button>
    </div>
  );
}

export default ProfileUploader;
