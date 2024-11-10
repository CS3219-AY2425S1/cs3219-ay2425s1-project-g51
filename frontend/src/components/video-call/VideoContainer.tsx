import { FC, useEffect, useState } from 'react';
import VideoCall from './VideoCall';

interface VideoContainerProps {
  sessionId: string;
  username: string;
}

const VideoContainer: FC<VideoContainerProps> = ({ sessionId, username }) => {
  const [token, setToken] = useState<string | null>(null);
  const [uid] = useState<string>(username); // Use the username as uid for simplicity

  useEffect(() => {
    const fetchToken = async () => {
      const VIDEO_SERVICE_URL = process.env.NEXT_PUBLIC_VIDEO_SERVICE_URL;
      const VIDEO_SERVICE_COMPLETE_URL = `${VIDEO_SERVICE_URL}/video-call/token`;
      console.log(VIDEO_SERVICE_COMPLETE_URL);
      const response = await fetch(VIDEO_SERVICE_COMPLETE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName: sessionId, uid })
      });
      const data = await response.json();
      setToken(data.token);
    };

    fetchToken();
  }, [sessionId, uid]);

  if (!token) return <div>Loading video call...</div>;

  return <VideoCall channelName={sessionId} token={token} uid={uid} />;
};

export default VideoContainer;
