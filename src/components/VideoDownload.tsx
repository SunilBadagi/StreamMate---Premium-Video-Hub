import React, { useEffect, useState } from "react";
import { Play, Download, Crown } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
const API_URL =" https://sb1fgapi4jp-mfev--5001--5a421e5b.local-credentialless.webcontainer.io";
// Replace with actual backend URL


const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY;

interface Video {
  name: string;
  url: string;
}

export default function VideoDownload() {
  const { user } = useAuthStore();
  const [videos, setVideos] = useState<Video[]>([]);
  const [hasPremium, setHasPremium] = useState(false);

  useEffect(() => {
    fetchVideos();
    checkPremiumStatus();
  }, []);

  // ✅ Fetch Videos from Supabase Storage
  const fetchVideos = async () => {
    const { data, error } = await supabase.storage.from("videos").list();

    if (error) {
      toast.error("Failed to load videos!");
      console.error("Supabase Fetch Error:", error);
      return;
    }

    if (!data || data.length === 0) {
      toast.error("No videos found in Supabase Storage.");
      return;
    }

    // Generate public URLs
    const videoList = data.map((file) => ({
      name: file.name,
      url: supabase.storage.from("videos").getPublicUrl(file.name).data.publicUrl,
    }));

    console.log("Fetched video list:", videoList);
    setVideos(videoList);
  };

  // ✅ Check Premium Subscription Status
  const checkPremiumStatus = async () => {
    if (!user?.id) return;

    const { data } = await supabase
      .from("premium_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .gte("expires_at", new Date().toISOString())
      .maybeSingle();

    setHasPremium(!!data);
  };

  // ✅ Download Video from Supabase (No Limit)
  const handleDownload = async (videoUrl: string, fileName: string) => {
  try {
    if (!user?.id) {
      toast.error("You must be logged in to download.");
      return;
    }

    // ✅ Check if user has already downloaded today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: downloads } = await supabase
      .from("video_downloads")
      .select("*")
      .eq("user_id", user.id)
      .gte("downloaded_at", today.toISOString());

    // ✅ If user is not premium and already downloaded once today, show error
    if (!hasPremium && downloads.length >= 1) {
      toast.error("Daily download limit reached! Upgrade to premium for unlimited downloads.");
      return;
    }

    // ✅ Save the download record in Supabase
    await supabase.from("video_downloads").insert([
      { user_id: user.id, video_url: videoUrl, downloaded_at: new Date().toISOString() },
    ]);

    // ✅ Save in localStorage for offline viewing
    const savedVideos = JSON.parse(localStorage.getItem("downloaded_videos") || "[]");
    savedVideos.push({ name: fileName, url: videoUrl });
    localStorage.setItem("downloaded_videos", JSON.stringify(savedVideos));

    toast.success("Video saved for offline viewing!");
  } catch (error) {
    toast.error("Download failed. Please try again.");
    console.error("Download Error:", error);
  }
};


  // ✅ Upgrade to Premium (Razorpay Payment)
const handlePremiumUpgrade = () => {
  if (!user?.id) {
    toast.error("You must be logged in to upgrade.");
    return;
  }

  const options = {
    key: RAZORPAY_KEY,
    amount: 100, // ₹1.00 (for test mode)
    currency: "INR",
    name: "Video Premium",
    description: "Premium Subscription",
    handler: async function (response: any) {
      console.log("Payment Success:", response);

      // ✅ Directly Update Premium Status in Supabase (No Backend)
      const { error } = await supabase
        .from("premium_subscriptions")
        .insert([
          {
            user_id: user.id,
            payment_id: response.razorpay_payment_id, // Store Payment ID for reference
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days premium
          },
        ]);

      if (error) {
        toast.error("Failed to activate premium. Please contact support.");
      } else {
        toast.success("Welcome to Premium!");
        setHasPremium(true);
      }
    },
    prefill: {
      email: user.email,
    },
    theme: {
      color: "#3B82F6",
    },
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.open();
};


  return (
    <div className="container mx-auto p-4">
      {/* ✅ Upgrade to Premium Banner */}
      {!hasPremium && (
        <div className="mb-8 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Upgrade to Premium</h2>
            <p>Download unlimited videos and enjoy premium features!</p>
          </div>
          <button
            onClick={handlePremiumUpgrade}
            className="bg-white text-purple-500 px-6 py-2 rounded-full font-semibold flex items-center space-x-2 hover:bg-gray-100"
          >
            <Crown size={20} />
            <span>Upgrade Now</span>
          </button>
        </div>
      )}

      {/* ✅ Video Grid */}
      {videos.length === 0 ? (
        <p className="text-gray-500 text-center mt-4">No videos available</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div key={video.name} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{video.name}</h3>

                {/* ✅ Play Video Inside Page */}
                <video controls className="w-full h-48">
                  <source src={video.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {/* ✅ Download Video Button */}
                <button
                  onClick={() => handleDownload(video.url, video.name)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg mt-2 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Download size={20} />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
