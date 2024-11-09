"use client";

import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC, { ILocalVideoTrack, ILocalAudioTrack, IRemoteVideoTrack, IRemoteAudioTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { useRouter } from 'next/navigation';
import { verifyToken } from '@/lib/api-user';
import { Video, VideoOff, Mic, MicOff } from 'lucide-react';

interface VideoDisplayProps {
  sessionId: string;
}

export default function VideoDisplay({ sessionId }: VideoDisplayProps) {
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<IRemoteVideoTrack | null>(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState<IRemoteAudioTrack | null>(null);
  const [localAudioEnabled, setLocalAudioEnabled] = useState(true);
  const [remoteAudioEnabled, setRemoteAudioEnabled] = useState(true);
  const [localVideoEnabled, setLocalVideoEnabled] = useState(true);
  const [remoteVideoEnabled, setRemoteVideoEnabled] = useState(true);
  const [remoteUsername, setRemoteUsername] = useState('');
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string>('');
  const clientRef = useRef(AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }));
  const router = useRouter();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  useEffect(() => {
    const fetchUserId = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const res = await verifyToken(token);
        setUserId(res.data.username);
      } catch (error) {
        console.error('Error verifying token:', error);
        router.push('/login');
      }
    };

    fetchUserId();
  }, [router]);

  const playVideoTracks = () => {
    if (localVideoTrack && localVideoRef.current && localVideoEnabled) {
      try {
        localVideoTrack.play(localVideoRef.current);
      } catch (error) {
        console.error('Error playing local video:', error);
      }
    }

    if (remoteVideoTrack && remoteVideoRef.current && remoteVideoEnabled) {
      try {
        remoteVideoTrack.play(remoteVideoRef.current);
      } catch (error) {
        console.error('Error playing remote video:', error);
      }
    }
  };

  useEffect(() => {
    playVideoTracks();
  }, [localVideoTrack, remoteVideoTrack, localVideoEnabled, remoteVideoEnabled]);

  
  useEffect(() => {
    if (!userId) return;

    let mounted = true;

    const initAgora = async () => {
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
      if (!appId) {
        console.error('Agora App ID not found');
        return;
      }

      try {
        if (clientRef.current.connectionState === 'CONNECTED') {
          await clientRef.current.leave();
        }

        await clientRef.current.join(appId, sessionId, null, userId);
        console.log('Successfully joined channel');

        const videoTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: {
            width: 640,
            height: 480,
            frameRate: 30,
            bitrateMin: 400,
            bitrateMax: 1000,
          }
        });
        
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();

        if (mounted) {
          setLocalVideoTrack(videoTrack);
          setLocalAudioTrack(audioTrack);
          
          await clientRef.current.publish([videoTrack, audioTrack]);
          console.log('Local tracks published successfully');
        }

        clientRef.current.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
          console.log('Remote user published:', user.uid, mediaType);
          await clientRef.current.subscribe(user, mediaType);

          if (mediaType === 'video' && user.videoTrack) {
            if (mounted) {
              setRemoteVideoTrack(user.videoTrack);
              setRemoteVideoEnabled(true);
              setRemoteUsername(user.uid.toString());
            }
          } else if (mediaType === 'audio' && user.audioTrack) {
            setRemoteAudioTrack(user.audioTrack);
            setRemoteAudioEnabled(true);
          }
        });

        clientRef.current.on('user-unpublished', (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
          console.log('Remote user unpublished:', user.uid, mediaType);
          if (mediaType === 'video' && mounted) {
            setRemoteVideoTrack(null);
            setRemoteVideoEnabled(false);
          } else if (mediaType === 'audio') {
            setRemoteAudioTrack(null);
            setRemoteAudioEnabled(false);
          }
        });

        clientRef.current.on('user-left', (user: IAgoraRTCRemoteUser) => {
          console.log('Remote user left:', user.uid);
          if (mounted) {
            setRemoteVideoTrack(null);
            setRemoteVideoEnabled(false);
            setRemoteAudioTrack(null);
            setRemoteAudioEnabled(false);
            setRemoteUsername('');
          }
        });

      } catch (error) {
        console.error('Error initializing Agora:', error);
      }
    };

    initAgora();

    return () => {
      mounted = false;
      
      const cleanup = async () => {
        if (localVideoTrack) {
          localVideoTrack.stop();
          localVideoTrack.close();
        }
        if (localAudioTrack) {
          localAudioTrack.stop();
          localAudioTrack.close();
        }

        if (remoteVideoTrack) {
          remoteVideoTrack.stop();
          remoteVideoTrack.close();
        }
        setRemoteVideoTrack(null);

        if (clientRef.current.connectionState === 'CONNECTED') {
          await clientRef.current.leave();
        }
      };
      
      cleanup();
    };
  }, [userId]);

  const toggleVideo = async () => {
    if(localVideoTrack) {
      try {
        await localVideoTrack.setEnabled(!localVideoEnabled);
        setLocalVideoEnabled(!localVideoEnabled);
      } catch (error) {
        console.error('Error toggling video:', error);
      }
    }
  };

  // const toggleAudio = async () => {
  //   // if(localAudioTrack) {
  //     try {
  //       console.log('1. Toggling audio, video state: ', localAudioEnabled, localVideoEnabled);
  //       await localAudioTrack.setEnabled(!localAudioEnabled);
  //       console.log('2. Toggling audio, video state: ', localAudioEnabled, localVideoEnabled);
  //       setLocalAudioEnabled(!localAudioEnabled);
  //       console.log('3. Toggling audio, video state: ', localAudioEnabled, localVideoEnabled);
  //     } catch (error) {
  //       console.error('Error toggling audio:', error);
  //     }
  //   // }
  //   console.log('4. Toggling audio, video state: ', localAudioEnabled, localVideoEnabled);
  // };

  const toggleAudio = async () => {
    // if (localAudioTrack) {
    //   try {
    //     console.log('1. Toggling audio, current states - audio:', localAudioEnabled, 'video:', localVideoEnabled);
  
    //     // Toggle the local audio track
    //     await localAudioTrack.setEnabled(!localAudioEnabled);

    //     const newState = !localAudioEnabled;
  
    //     // Update the state only after toggling is complete
    //     setLocalAudioEnabled((prev) => {
    //       console.log('2. Audio toggled successfully, new audio state:', newState);
    //       return newState;
    //     });
  
    //     console.log('3. Final states after toggling - audio:', newState, 'video:', localVideoEnabled);
    //   } catch (error) {
    //     console.error('Error toggling audio:', error);
    //   }
    // }
  };

  const VideoContainer = ({ isLocal = false }) => {
    console.log('Rendering VideoContainer:', isLocal);
    const [showControls, setShowControls] = useState(false);
    const isVideoEnabled = isLocal ? localVideoEnabled : remoteVideoEnabled;
    const isAudioEnabled = isLocal ? localAudioEnabled : remoteAudioEnabled;
    const username = isLocal ? userId : remoteUsername;
    const videoRef = isLocal ? localVideoRef : remoteVideoRef;

    return (
      <div
        className="relative w-48 h-36 rounded-lg shadow-md overflow-hidden bg-gray-900"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <div 
          ref={videoRef} 
          className={`w-full h-full ${!isVideoEnabled ? 'hidden' : ''}`} 
        />
        {!isVideoEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white text-2xl font-bold">
            {username? getInitials(username) : 'Unavailable'}
          </div>
        )}
        
        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50 flex justify-center space-x-2 z-10">
            {isLocal ? (
              <>
                <button
                  onClick={toggleVideo}
                  className="p-1 rounded-full hover:bg-gray-700 text-white"
                >
                  {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                </button>
                <button
                  onClick={toggleAudio}
                  className="p-1 rounded-full hover:bg-gray-700 text-white"
                >
                  {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
              </>
            ) : (
              <>
                <button className="p-1 rounded-full text-white">
                  {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                </button>
                <button className="p-1 rounded-full text-white">
                  {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex space-x-2">
      <VideoContainer isLocal />
      <VideoContainer />
    </div>
  );
}
