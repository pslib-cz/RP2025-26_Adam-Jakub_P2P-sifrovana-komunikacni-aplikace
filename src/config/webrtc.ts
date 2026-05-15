export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun.relay.metered.ca:80" },
  {
    urls: "turn:global.relay.metered.ca:443",
    username: "97b6737bc142e0519a6d6bda",
    credential: "aqwbmHxp5fobShAc",
  },
  {
    urls: "turns:global.relay.metered.ca:443?transport=tcp",
    username: "97b6737bc142e0519a6d6bda",
    credential: "aqwbmHxp5fobShAc",
  },
];

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 0,
};
