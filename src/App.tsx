import { useState } from "react";
import "./App.css";

interface EncryptedData {
  key: string;
  iv: string;
  data: Uint8Array;
  type: string;
}

const App = (): JSX.Element => {
  const [file, setFile] = useState<File | null>(null);
  const [encryptedData, setEncryptedData] = useState<EncryptedData | null>(
    null,
  );

  const styles = {
    fileInput: {
      border: "none",
      borderRadius: "5px",
      backgroundColor: "#f2f2f2",
      padding: "10px",
      cursor: "pointer",
      fontSize: "16px",
      display: "flex",
      alignItems: "center",
    },
    fileName: {
      marginLeft: "10px",
      fontWeight: "bold",
    },
    fileSize: {
      marginLeft: "auto",
    },
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const inputFile = event.target.files?.[0];
    if (!inputFile) return;

    const reader = new FileReader();
    reader.readAsArrayBuffer(inputFile);
    reader.onloadend = () => {
      const imageBytes = new Uint8Array(reader.result as ArrayBuffer);
      const { key, iv } = generateRandomKey();
      encryptImage(imageBytes, key, iv)
        .then((result) => {
          const encryptedData: EncryptedData = {
            key: key.toString(),
            iv: iv.toString(),
            data: new Uint8Array(result),
            type: inputFile.type,
          };
          setFile(inputFile);
          setEncryptedData(encryptedData);
        })
        .catch((error) => {
          console.error(error);
        });
    };
  };

  const handleDownloadEncrypted = (): void => {
    if (!encryptedData || !file) return;

    const blob = new Blob([JSON.stringify(encryptedData)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${file.name}.encrypted`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="image-encryptor-container">
      <h1>Image Encryptor</h1>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={styles.fileInput}
      />
      {file && (
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={styles.fileName}>{file.name}</div>
          <span>&nbsp;|&nbsp;</span>
          <div style={styles.fileSize}>{`${(file.size / 1024).toFixed(
            2,
          )} KB`}</div>
        </div>
      )}
      {encryptedData && (
        <div>
          <button onClick={handleDownloadEncrypted}>
            Download Encrypted Image
          </button>
        </div>
      )}
    </div>
  );
};

const generateRandomKey = (): { key: Uint8Array; iv: Uint8Array } => {
  const key = window.crypto.getRandomValues(new Uint8Array(32));
  const iv = window.crypto.getRandomValues(new Uint8Array(16));
  return { key, iv };
};

const encryptImage = async (
  imageBytes: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array,
): Promise<ArrayBuffer> => {
  try {
    const algorithm = { name: "AES-GCM", iv: iv };
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      key,
      algorithm,
      false,
      ["encrypt"],
    );
    const encryptedData = await window.crypto.subtle.encrypt(
      algorithm,
      cryptoKey,
      imageBytes,
    );
    const encryptedBytes = new Uint8Array(encryptedData);
    return encryptedBytes;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to encrypt image");
  }
};

export default App;
