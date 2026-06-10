import { useCallback } from "react";
import { API_BASE_URL } from "../api.mjs";

function XMLDownloadButton({
  children,
  className,
  route,
  authenticationKey = "",
  filename = "export.xml",
}) {
  const download = useCallback(() => {
    fetch(API_BASE_URL + route, {
      method: "GET",
      headers: {
        "x-auth-key": authenticationKey,
      },
    })
      .then((response) => {
        if (response.status == 200) {
          response.blob().then((data) => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(data);
            a.setAttribute("download", filename);
            a.click();
          });
        } else {
          response.json().then((body) => {
            console.error(body.message);
          });
        }
      })
      .catch((error) => {
        console.error("Failed to download - " + error);
      });
  }, [route, authenticationKey, filename]);
  return (
    <button onClick={() => download()} className={className}>
      {children}
    </button>
  );
}

export default XMLDownloadButton;
