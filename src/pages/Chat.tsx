import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { Send, Users, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
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
      where('year', '==', user.year),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(newMessages);
    }, (error) => {
      console.error('Chat onSnapshot error:', error);
    });

    // Add a system message locally for joining
    const joinMessage: Message = {
      type: 'system',
      content: `${user.name} joined the chat`,
      timestamp: new Date().toISOString(),
      college_id: user.college_id,
      stream: user.stream,
      year: user.year
    };
    
    // We don't save system messages to DB to save writes, just show them locally or handle via presence
    // For now, we'll just rely on the real messages

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [user]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const messageContent = input;
    setInput('');

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
    }
  };

  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)] flex flex-col"
    >
      <div className="glass-panel rounded-t-2xl p-4 border-b border-slate-700/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
            <MessageSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Stream Chat</h1>
            <p className="text-sm text-slate-400 flex items-center gap-1">
              <Users className="w-3 h-3" /> {user.stream} • {user.year}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          </span>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="flex-1 glass-panel p-4 overflow-y-auto no-scrollbar space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <MessageSquare className="w-12 h-12 opacity-20" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        
        {messages.map((msg, idx) => {
          if (msg.type === 'system') {
            return (
              <div key={idx} className="flex justify-center">
                <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full">
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
                <span className={`text-xs ml-1 mb-1 font-medium flex items-center gap-1 ${isAdmin ? 'text-rose-500' : 'text-slate-400'}`}>
                  {msg.user_name || msg.sender}
                  {isAdmin && <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded uppercase tracking-wider">Admin</span>}
                </span>
              )}
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                isMe 
                  ? 'bg-emerald-600 text-white rounded-tr-sm' 
                  : 'glass-panel text-white border border-slate-700/50 rounded-tl-sm shadow-sm'
              }`}>
                <p className="text-sm">{msg.content}</p>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 mx-1">
                {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="glass-panel rounded-b-2xl p-4 border-t border-slate-700/50 shrink-0">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-white/50 dark:bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white backdrop-blur-sm"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!input.trim() || !isConnected}
            className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover-lift"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </motion.div>
  );
};
