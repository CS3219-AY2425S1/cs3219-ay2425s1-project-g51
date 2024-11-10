import { FC, useEffect, useRef, useState } from 'react';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IRemoteVideoTrack, IRemoteAudioTrack } from 'agora-rtc-sdk-ng';
import React from 'react';

interface VideoCallProps {
  channelName: string;
  token: string;
  uid: string;
}

const VideoCall: FC<VideoCallProps> = ({ channelName, token, uid }) => {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const [videoTrack, setVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [audioTrack, setAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<IRemoteVideoTrack | null>(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState<IRemoteAudioTrack | null>(null);
  const localVideoContainerRef = useRef<HTMLDivElement>(null);
  const remoteVideoContainerRef = useRef<HTMLDivElement>(null);

  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  useEffect(() => {
    (async () => {
      const initAgoraClient = async () => {
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        // Join the channel
        await client.join(process.env.NEXT_PUBLIC_AGORA_APP_ID, channelName, token, uid);

        // Create and publish local audio and video tracks
        const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        setAudioTrack(micTrack);
        setVideoTrack(camTrack);
        
        client.publish([micTrack, camTrack]);

        // Play local video in its container
        if (localVideoContainerRef.current) {
          camTrack.play(localVideoContainerRef.current);
        }

        // Subscribe to remote user video and audio
        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          
          if (mediaType === 'video') {
            const remoteVideo = user.videoTrack as IRemoteVideoTrack;
            setRemoteVideoTrack(remoteVideo);
            if (remoteVideoContainerRef.current) {
              remoteVideo.play(remoteVideoContainerRef.current);
            }
          }

          if (mediaType === 'audio') {
            const remoteAudio = user.audioTrack as IRemoteAudioTrack;
            setRemoteAudioTrack(remoteAudio);
            remoteAudio.play();
          }
        });

        // Handle remote user leaving
        client.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'video') {
            remoteVideoTrack?.stop();
            setRemoteVideoTrack(null);
          }
          if (mediaType === 'audio') {
            remoteAudioTrack?.stop();
            setRemoteAudioTrack(null);
          }
        });
      };

      await initAgoraClient();

      return () => {
        clientRef.current?.leave();
        videoTrack?.stop();
        videoTrack?.close();
        audioTrack?.stop();
        audioTrack?.close();
        remoteVideoTrack?.stop();
        remoteAudioTrack?.stop();
      };
    })();
  }, [channelName, token, uid, videoTrack, audioTrack, remoteVideoTrack, remoteAudioTrack]);

  // Toggle local audio
  const toggleAudio = () => {
    if (audioTrack) {
      if (isAudioMuted) {
        audioTrack.setEnabled(true);
      } else {
        audioTrack.setEnabled(false);
      }
      setIsAudioMuted(!isAudioMuted);
    }
  };

  // Toggle local video
  const toggleVideo = () => {
    if (videoTrack) {
      if (isVideoMuted) {
        videoTrack.setEnabled(true);
      } else {
        videoTrack.setEnabled(false);
      }
      setIsVideoMuted(!isVideoMuted);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
      {/* Local video container */}
      <div>
        <div ref={localVideoContainerRef} style={{ width: '300px', height: '300px', backgroundColor: 'black' }} />
        <div style={{ marginTop: '10px' }}>
          <button onClick={toggleAudio}>{isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}</button>
          <button onClick={toggleVideo}>{isVideoMuted ? 'Turn On Video' : 'Turn Off Video'}</button>
        </div>
      </div>

      {/* Remote video container */}
      <div>
        <div ref={remoteVideoContainerRef} style={{ width: '300px', height: '300px', backgroundColor: 'black' }} />
      </div>
    </div>
  );
};

export default VideoCall;
