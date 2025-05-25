import React, { useState } from 'react';
import AppLayout from '../../layouts/app-layout/AppLayout';
import DriveStatsPanel from '../../components/drive-stat-panel/DriveStatPanel';
import { Breadcrumb, Divider } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

interface IHomeProps {
  // Add props here if needed
}

const breadcrumbItems = [
  {
    title: <Link to="/"><HomeOutlined /></Link>,
  }
];

const Home: React.FC<IHomeProps> = () => {
  const [loading, setLoading] = useState(false); // Track loading state

 const downloadFile = async () => {
    const fileName = './Your Name.mkv'; // Adjust this to the specific file you want to download
    const apiUrl = 'https://localhost:7119/download'; // Replace with your API URL

    setLoading(true); // Show loading indicator

    try {
        // Send the request to the server with the file name
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paths: [fileName] // Send the file path in the request body
            })
        });

        // Check if the response is okay
        if (!response.ok) {
            console.error('Failed to download the file:', response.statusText);
            alert('Failed to download the file. Please try again.');
            return;
        }

        // Get the filename from the response headers or default to a static name
        const disposition = response.headers.get('Content-Disposition');
        console.log('Content-Disposition:', disposition);
        
        let fileNameHeader = 'downloadedFile'; // Default name if filename is not found

        if (disposition) {
            const filenameRegex = /filename\*?=(?:"([^"]*)"|([^;]*))/;
            const matches = disposition.match(filenameRegex);

            if (matches) {
                fileNameHeader = matches[1] || decodeURIComponent(matches[2]); // Use decoded value
            }
        }

        // Create a blob from the response body and use it to download the file
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);

        // Create an anchor element to trigger the download
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileNameHeader;
        a.click();

        // Clean up the URL object after download
        URL.revokeObjectURL(downloadUrl);

    } catch (error) {
        console.error('Error during download:', error);
        alert('An error occurred while downloading the file.');
    } finally {
        setLoading(false); // Hide loading indicator
    }
};


  return (
    <AppLayout>
      <Breadcrumb items={breadcrumbItems} />
      <Divider style={{ margin: "12px 0" }} />
      <DriveStatsPanel />
      <div className="container">
        <h1>Download Large File</h1>

        {/* Button to trigger the download */}
        <button id="downloadBtn" onClick={downloadFile} disabled={loading}>
          {loading ? 'Downloading...' : 'Download Your Name.mkv'}
        </button>

        {/* Display loading indicator */}
        {loading && <div className="loading" id="loading">Downloading...</div>}
      </div>
    </AppLayout>
  );
};

export default Home;
