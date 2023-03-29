import React, { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import AWS from "aws-sdk";
import { ProgressBar, Button } from "react-bootstrap";

AWS.config.update({
  accessKeyId: process.env.secretAccessKey,
  secretAccessKey: process.env.secretAccessKey,
  region: "asia-south1",
  signatureVersion: "v4",
});

const baseStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "150px",
  borderWidth: 2,
  borderRadius: 2,
  borderColor: "#eeeeee",
  borderStyle: "dashed",
  backgroundColor: "#fafafa",
  color: "#bdbdbd",
  outline: "none",
  transition: "border .24s ease-in-out",
};

const focusedStyle = {
  borderColor: "#2196f3",
};

const acceptStyle = {
  borderColor: "#00e676",
};

const rejectStyle = {
  borderColor: "#ff1744",
};

export default function Dropzone(props) {
  const [uploadProgress, setUploadProgress] = useState(0);
  console.log("upload Progress", uploadProgress);
  const {
    getRootProps,
    getInputProps,
    isFocused,
    isDragAccept,
    isDragReject,
    acceptedFiles,
  } = useDropzone({ accept: { "video/*": [] }, multiple: false });

  useEffect(() => {
    if (!acceptedFiles.length) return;
    setFile(acceptedFiles[0]);
  }, [acceptedFiles]);

  const s3 = new AWS.S3();
  const [file, setFile] = useState(null);

  const uploadToS3 = async () => {
    if (!file) {
      return;
    }
    const params = {
      Bucket: "myvideouploadbucket",
      Key: `${Date.now()}.${file.name}`,
      Body: file,
    };

    // const options = {
    //   partSize: 10 * 1024 * 1024, // 10 MB
    //   queueSize: 1,
    // };

    const s3Upload = s3.upload(params);

    s3Upload.on("httpUploadProgress", (progress) => {
      setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
    });

    try {
      const response = await s3Upload.promise();
      console.log(`File uploaded successfully to ${response.Location}`);
      setUploadProgress(0);
      acceptedFiles.splice(0, acceptedFiles.length);
      setFile(null);
    } catch (error) {
      console.error(`Error uploading file: ${error}`);
    }
  };

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : { borderColor: "#000" }),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isFocused, isDragAccept, isDragReject]
  );

  return (
    <section className="main-container">
      <div {...getRootProps({ style })}>
        <input {...getInputProps()} />
        <h1>You can upload video here</h1>
        <p>Drag 'n' drop some files here, or click to select files</p>
      </div>
      {file && uploadProgress === 0 && (
        <div className="alert alert-light" role="alert">
          <p>File {file.name} selected for upload</p>
        </div>
      )}
      <div style={{ marginTop: "10px" }}>
        {uploadProgress !== 0 && (
          <div className="alert alert-light" role="alert">
            <p>File {file.name} is uploading...</p>
            <div className="mt-2">
              <ProgressBar
                animated
                now={uploadProgress}
                label={`${uploadProgress}% completed`}
              />
              ;
            </div>
          </div>
        )}
        <div className="container bg-light">
          <div className="col-md-12 text-center">
            <Button className="btn btn-primary mt-2" onClick={uploadToS3}>
              Upload video
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
