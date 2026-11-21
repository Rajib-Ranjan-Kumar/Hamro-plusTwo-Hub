import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { Send, Users, MessageSquare, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

const MAX_MESSAGES = 75;

interface Message {
  id?: string;
  type: 'system' | 'chat';
  sender?: string;
  user_id?: string;
  user_name?: string;
  role?: string;
  content: string;
  timestamp: any;
  college_id: string;
  stream: string;
  year: string;
}

export const Chat = () => {
  const { user } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user || !user.college_id || !user.stream || !user.year) return;

    setIsConnected(true);

    const q = query(
      collection(db, 'messages'),
      where('college_id', '==', user.college_id),
      where('stream', '==', user.stream),
      where('year', '==', user.year)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      newMessages.sort((a: any, b: any) => {
        const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp || 0).getTime();
        const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp || 0).getTime();
        return timeA - timeB;
      });

      // Maintain only the last 75 messages
      if (newMessages.length > MAX_MESSAGES) {
        const excess = newMessages.length - MAX_MESSAGES;
        const toDelete = newMessages.slice(0, excess);
        setMessages(newMessages.slice(excess));

        // Delete excess older messages from Firestore database
        try {
          const batch = writeBatch(db);
          toDelete.forEach(msg => {
            if (msg.id) {
              batch.delete(doc(db, 'messages', msg.id));
            }
          });
          batch.commit().catch(e => console.warn('Prune old messages error:', e));
        } catch (pruneErr) {
          console.warn('Prune batch error:', pruneErr);
        }
      } else {
        setMessages(newMessages);
      }
    }, (error) => {
      console.error('Chat onSnapshot error:', error);
    });

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [user]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || isSending) return;

    const messageContent = input.trim();
    setInput('');
    setIsSending(true);
    startLoading(35, 'Sending message...');

    try {
      await addDoc(collection(db, 'messages'), {
        type: 'chat',
        user_id: user.id,
        user_name: user.name,
        role: user.role || 'student',
        content: messageContent,
        timestamp: serverTimestamp(),
        college_id: user.college_id,
        stream: user.stream,
        year: user.year
      });
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
      stopLoading();
    }
  };

  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto w-full flex-1 flex flex-col overflow-hidden h-full min-h-0"
    >
      <div className="rounded-t-3xl bg-slate-900/95 p-4 sm:p-5 border border-slate-700/60 backdrop-blur-xl shadow-lg flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#F5C21B]">
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold text-white leading-tight">Stream Community Chat</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Users className="w-3.5 h-3.5 text-amber-400" /> {user.stream} Stream • {user.year}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-full border border-slate-800">
          <span className="relative flex h-2 w-2">
            {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
          </span>
          <span className="text-xs font-semibold text-slate-300">
            {isConnected ? 'Online' : 'Reconnecting...'}
          </span>
        </div>
      </div>

      <div className="flex-1 bg-slate-950/70 border-x border-slate-700/60 p-4 sm:p-6 overflow-y-auto no-scrollbar space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-12">
            <MessageSquare className="w-12 h-12 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-white">No messages yet</p>
            <p className="text-xs text-slate-400">Be the first to say namaste and ask your exam questions!</p>
          </div>
        )}
        
        {messages.map((msg, idx) => {
          if (msg.type === 'system') {
            return (
              <div key={idx} className="flex justify-center">
                <span className="text-[10px] sm:text-xs bg-slate-800 text-slate-400 border border-slate-700/60 px-3 py-1 rounded-full">
                  {msg.content}
                </span>
              </div>
            );
          }

          const isMe = msg.user_id === user.id || msg.sender === user.name;
          const isAdmin = msg.role === 'admin';

          return (
            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && (
                <span className={`text-[11px] sm:text-xs ml-1 mb-1 font-semibold flex items-center gap-1.5 ${isAdmin ? 'text-amber-400' : 'text-slate-400'}`}>
                  {msg.user_name || msg.sender}
                  {isAdmin && <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded uppercase tracking-wider font-bold">Admin</span>}
                </span>
              )}
              <div className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl ${
                isMe 
                  ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-sm shadow-md' 
                  : 'bg-slate-900/90 text-white border border-slate-700/60 rounded-tl-sm shadow-md'
              }`}>
                <p className="text-xs sm:text-sm leading-relaxed break-words">{msg.content}</p>
              </div>
              <span className="text-[9px] sm:text-[10px] text-slate-500 mt-1 mx-1 font-medium">
                {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="rounded-b-3xl bg-slate-900/95 p-3 sm:p-4 border border-slate-700/60 backdrop-blur-xl shadow-lg shrink-0">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question or message for classmates..."
            className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-white outline-none text-xs sm:text-sm placeholder-slate-500 transition-all"
            disabled={!isConnected || isSending}
          />
          <button
            type="submit"
            disabled={!input.trim() || !isConnected || isSending}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 p-2.5 sm:p-3 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer flex items-center justify-center font-bold"
          >
            {isSending ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-slate-950" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />}
          </button>
        </form>
      </div>
    </motion.div>
  );
};
