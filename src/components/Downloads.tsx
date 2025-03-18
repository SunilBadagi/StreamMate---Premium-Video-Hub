import React, { useEffect, useState } from "react";
import { Trash, Play } from "lucide-react";
import toast from "react-hot-toast";

interface DownloadedVideo {
  name: string;
  url: string;
}

export default function Downloads() {
  const [downloadedVideos, setDownloadedVideos] = useState<DownloadedVideo[]>([]);

  useEffect(() => {
    loadDownloads();
  }, []);

  // ✅ Load Downloads from Local Storage
  const loadDownloads = () => {
    const savedVideos = localStorage.getItem("downloaded_videos");
    if (savedVideos) {
      setDownloadedVideos(JSON.parse(savedVideos));
    }
  };

  // ✅ Delete a Downloaded Video
  const deleteDownload = (videoName: string) => {
    const updatedVideos = downloadedVideos.filter((video) => video.name !== videoName);
    localStorage.setItem("downloaded_videos", JSON.stringify(updatedVideos));
    setDownloadedVideos(updatedVideos);
    toast.success("Video removed from downloads!");
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Downloads</h2>

      {downloadedVideos.length === 0 ? (
        <p className="text-gray-500 text-center">No videos downloaded.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {downloadedVideos.map((video) => (
            <div key={video.name} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold">{video.name}</h3>

              {/* ✅ Play Downloaded Video */}
              <video controls className="w-full h-40 mt-2">
                <source src={video.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* ✅ Delete Button */}
              <button
                onClick={() => deleteDownload(video.name)}
                className="mt-2 w-full flex items-center justify-center px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
              >
                <Trash size={20} />
                <span className="ml-1">Remove</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
