import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../services/chatService";
import { chatService } from "../services/chatService";
import { socketClient } from "../services/socketClient";
import { encryptMessage, safeDecrypt } from "../services/cryptoService";

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
      .then(async (data) => {
        if (data.success && data.messages) {
          const serverMsgs = await Promise.all(
            data.messages.map(async (m: any) => ({
              fromUserId: m.senderId,
              message: await safeDecrypt(m.content, currentUserId, targetUserId),
              timestamp: m.timestamp,
            }))
          );

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
        setConnected(true);
      };
      dc.onclose = () => setConnected(false);
      dc.onmessage = async (e) => {
        try {
          const raw = JSON.parse(e.data);
          const plaintext = await safeDecrypt(raw.message, targetUserId, currentUserId);
          handleIncoming({ ...raw, message: plaintext });
        } catch { }
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
      if (pc.connectionState === "connected") setConnected(true);
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setConnected(false);
      }
    };

    pc.ondatachannel = (e) => setupDc(e.channel);

    pc.onnegotiationneeded = async () => {
      try {
        makingOffer = true;
        await pc.setLocalDescription();
        socketClient.send({
          type: "signal",
          targetUserId,
          fromUserId: currentUserId,
          signal: pc.localDescription,
        });
      } catch {
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
        if (ignoreOffer) return;

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
      } catch {
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
      } catch {
      }
    };

    const onChatMessage = async (data: any) => {
      if (data.fromUserId !== targetUserId) return;
      const plaintext = await safeDecrypt(data.message, data.fromUserId, currentUserId);
      handleIncoming({
        fromUserId: data.fromUserId,
        message: plaintext,
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

  const sendMessage = async (text: string) => {
    const timestamp = new Date().toISOString();
    const encrypted = await encryptMessage(text, currentUserId, targetUserId);

    const msg: ChatMessage = {
      fromUserId: currentUserId,
      message: text,
      timestamp,
    };

    if (dcRef.current?.readyState === "open") {
      dcRef.current.send(JSON.stringify({ ...msg, message: encrypted }));
    } else {
      socketClient.send({
        type: "chat_message",
        targetUserId,
        fromUserId: currentUserId,
        message: encrypted,
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