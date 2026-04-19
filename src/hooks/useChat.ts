import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../services/chatService";
import { chatService } from "../services/chatService";
import { socketClient } from "../services/socketClient";

export const useChat = (currentUserId: string, targetUserId: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);

  const iceBuffer = useRef<RTCIceCandidateInit[]>([]);
  const isInitiator = useRef(false);

  useEffect(() => {
    const stored = chatService.getMessages(currentUserId, targetUserId);

    setMessages(
      stored.map((m, i) => ({
        id: i,
        ...m,
        isOwn: m.fromUserId === currentUserId,
      }))
    );

    setLoading(false);
  }, [currentUserId, targetUserId]);

  useEffect(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;

      socketClient.send({
        type: "ice_candidate",
        targetUserId,
        candidate: event.candidate,
        fromUserId: currentUserId,
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setConnected(true);
      if (pc.connectionState === "failed") setConnected(false);
    };

    pc.ondatachannel = (event) => {
      const dc = event.channel;
      dcRef.current = dc;

      dc.onmessage = (e) => handleIncoming(JSON.parse(e.data));
      dc.onopen = () => setConnected(true);
    };

    const onSignal = async (data: any) => {
      if (data.fromUserId !== targetUserId) return;

      if (data.signal.type === "offer") {
        await pc.setRemoteDescription(data.signal);

        for (const c of iceBuffer.current) {
          await pc.addIceCandidate(c);
        }
        iceBuffer.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketClient.send({
          type: "signal",
          targetUserId,
          signal: answer,
          fromUserId: currentUserId,
        });
      }

      if (data.signal.type === "answer") {
        await pc.setRemoteDescription(data.signal);

        for (const c of iceBuffer.current) {
          await pc.addIceCandidate(c);
        }
        iceBuffer.current = [];
      }
    };

    socketClient.on("signal", onSignal);
    const onIce = async (data: any) => {
      if (data.fromUserId !== targetUserId) return;

      if (pc.remoteDescription) {
        await pc.addIceCandidate(data.candidate);
      } else {
        iceBuffer.current.push(data.candidate);
      }
    };

    socketClient.on("ice_candidate", onIce);

    const shouldStart = currentUserId < targetUserId;

    const start = async () => {
      if (isInitiator.current) return;
      isInitiator.current = true;

      const dc = pc.createDataChannel("chat");
      dcRef.current = dc;

      dc.onmessage = (e) => handleIncoming(JSON.parse(e.data));
      dc.onopen = () => setConnected(true);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketClient.send({
        type: "signal",
        targetUserId,
        signal: offer,
        fromUserId: currentUserId,
      });
    };

    if (shouldStart) start();

    return () => {
      socketClient.off("signal", onSignal);
      socketClient.off("ice_candidate", onIce);
      pc.close();
    };
  }, [currentUserId, targetUserId]);

  const handleIncoming = (msg: ChatMessage) => {
    chatService.saveMessage(currentUserId, targetUserId, msg);

    setMessages((prev) => [
      ...prev,
      { id: prev.length, ...msg, isOwn: false },
    ]);
  };

  const sendMessage = (text: string) => {
    const msg: ChatMessage = {
      fromUserId: currentUserId,
      message: text,
      timestamp: new Date().toISOString(),
    };

    if (dcRef.current?.readyState === "open") {
      dcRef.current.send(JSON.stringify(msg));
    }
    // fallback
    else {
      socketClient.send({
        type: "chat_message",
        targetUserId,
        message: text,
        fromUserId: currentUserId,
      });
    }

    chatService.saveMessage(currentUserId, targetUserId, msg);

    setMessages((prev) => [
      ...prev,
      { id: prev.length, ...msg, isOwn: true },
    ]);
  };

  return { messages, connected, loading, sendMessage };
};