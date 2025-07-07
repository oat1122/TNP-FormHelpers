import React from 'react';
import { useDropzone } from 'react-dropzone';
import { useUploadFile } from '../../features/MaxSupply/maxSupplyApi';

const FileUpload = () => {
  const upload = useUploadFile();

  const onDrop = React.useCallback((acceptedFiles) => {
    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);
    upload.mutate(formData);
  }, [upload]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} className="border p-4 rounded">
      <input {...getInputProps()} />
      <p>Drag and drop file here, or click to select</p>
    </div>
  );
};

export default FileUpload;
