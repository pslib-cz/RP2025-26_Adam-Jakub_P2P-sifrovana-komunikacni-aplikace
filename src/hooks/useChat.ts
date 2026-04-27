import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../services/chatService";
import { chatService } from "../services/chatService";
import { socketClient } from "../services/socketClient";

import { API_BASE_URL } from "../api/http";

export const useChat = (currentUserId: string, targetUserId: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);

  useEffect(() => {
    const stored = chatService.getMessages(currentUserId, targetUserId);
    setMessages(
      stored.map((m, i) => ({ id: i, ...m, isOwn: m.fromUserId === currentUserId }))
    );
    fetch(`${API_BASE_URL}/messages/history/${currentUserId}/${targetUserId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.messages) {
          const serverMsgs = data.messages.map((m: any) => ({
            fromUserId: m.senderId,
            message: m.content,
            timestamp: m.timestamp,
          }));

          const allMsgs = [...chatService.getMessages(currentUserId, targetUserId)];
          let changed = false;

          for (const sMsg of serverMsgs) {
            const exists = allMsgs.find(
              (m) => m.timestamp === sMsg.timestamp && m.message === sMsg.message
            );
            if (!exists) {
              allMsgs.push(sMsg);
              changed = true;
            }
          }

          if (changed) {
            allMsgs.sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            localStorage.setItem(
              chatService.getKey(currentUserId, targetUserId),
              JSON.stringify(allMsgs)
            );
            setMessages(
              allMsgs.map((m, i) => ({ id: i, ...m, isOwn: m.fromUserId === currentUserId }))
            );
          }
        }
      })
      .catch((err) => console.error("Fetch history err:", err))
      .finally(() => setLoading(false));
  }, [currentUserId, targetUserId]);

  useEffect(() => {
    const polite = currentUserId > targetUserId;
    let makingOffer = false;
    let ignoreOffer = false;
    let iceQueue: RTCIceCandidateInit[] = [];

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });
    pcRef.current = pc;

    const flushIceQueue = async () => {
      const q = [...iceQueue];
      iceQueue = [];
      for (const c of q) {
        try { await pc.addIceCandidate(c); } catch { }
      }
    };

    const setupDc = (dc: RTCDataChannel) => {
      dcRef.current = dc;
      dc.onopen = () => {
        console.log("[P2P] data channel open");
        setConnected(true);
      };
      dc.onclose = () => setConnected(false);
      dc.onmessage = (e) => {
        try { handleIncoming(JSON.parse(e.data)); } catch { }
      };
    };

    pc.onicecandidate = ({ candidate }) => {
      if (!candidate) return;
      socketClient.send({
        type: "ice_candidate",
        targetUserId,
        fromUserId: currentUserId,
        candidate,
      });
    };

    pc.onconnectionstatechange = () => {
      console.log("[P2P] connection state:", pc.connectionState);
      if (pc.connectionState === "connected") setConnected(true);
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setConnected(false);
      }
    };

    pc.ondatachannel = (e) => setupDc(e.channel);

    pc.onnegotiationneeded = async () => {
      try {
        makingOffer = true;
        console.log("[P2P] negotiation needed, creating offer");
        await pc.setLocalDescription();       
        socketClient.send({
          type: "signal",
          targetUserId,
          fromUserId: currentUserId,
          signal: pc.localDescription,
        });
      } catch (err) {
        console.error("[P2P] negotiation error", err);
      } finally {
        makingOffer = false;
      }
    };

    const onSignal = async (data: any) => {
      if (data.fromUserId !== targetUserId) return;

      const desc = data.signal as any;

      if (desc.type === "ping") {
        if (!polite) {
          pc.onnegotiationneeded?.(new Event("negotiationneeded"));
        }
        return;
      }
      const rtcDesc = desc as RTCSessionDescriptionInit;

      try {
        const offerCollision =
          rtcDesc.type === "offer" &&
          (makingOffer || pc.signalingState !== "stable");

        ignoreOffer = !polite && offerCollision;
        if (ignoreOffer) {
          console.log("[P2P] ignoring colliding offer (impolite)");
          return;
        }

        await pc.setRemoteDescription(rtcDesc);
        await flushIceQueue();

        if (rtcDesc.type === "offer") {
          await pc.setLocalDescription();
          socketClient.send({
            type: "signal",
            targetUserId,
            fromUserId: currentUserId,
            signal: pc.localDescription,
          });
        }
      } catch (err) {
        console.error("[P2P] signal handling error", err);
      }
    };

    const onIce = async (data: any) => {
      if (data.fromUserId !== targetUserId) return;
      if (!data.candidate) return;

      try {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(data.candidate);
        } else {
          iceQueue.push(data.candidate);
        }
      } catch (err) {
        console.error("[P2P] ice candidate error", err);
      }
    };

    const onChatMessage = (data: any) => {
      if (data.fromUserId !== targetUserId) return;
      handleIncoming({
        fromUserId: data.fromUserId,
        message: data.message,
        timestamp: data.timestamp ?? new Date().toISOString(),
      });
    };

    socketClient.on("signal", onSignal);
    socketClient.on("ice_candidate", onIce);
    socketClient.on("chat_message", onChatMessage);

    if (!polite) {
      setupDc(pc.createDataChannel("chat"));
    } else {
      socketClient.send({
        type: "signal",
        targetUserId,
        fromUserId: currentUserId,
        signal: { type: "ping" },
      });
    }
    return () => {
      socketClient.off("signal", onSignal);
      socketClient.off("ice_candidate", onIce);
      socketClient.off("chat_message", onChatMessage);
      pc.close();
      pcRef.current = null;
      dcRef.current = null;
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
    } else {
      socketClient.send({
        type: "chat_message",
        targetUserId,
        fromUserId: currentUserId,
        message: text,
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