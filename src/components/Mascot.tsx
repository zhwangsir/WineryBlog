import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  text: string;
  direction: 'left' | 'right';
}

interface MascotProps {
  enabled?: boolean;
  avatar?: string;
  name?: string;
  messages?: string[];
}

export const Mascot: React.FC<MascotProps> = ({
  enabled = true,
  avatar = '/images/HuTao/avatar.Cxp9qlib_DMTcv.png',
  name = 'Hutao',
  messages = [
    '你好呀！欢迎来到我的博客~',
    '今天也要开心每一天哦！',
    '记得关注我了解更多内容~',
    '有任何问题都可以问我哦！'
  ]
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!enabled || messages.length === 0) return;

    const showMessage = () => {
      setCurrentMessage({
        text: messages[messageIndex],
        direction: 'left'
      });

      setTimeout(() => {
        setCurrentMessage(null);
      }, 6000);

      setMessageIndex((prev) => (prev + 1) % messages.length);
    };

    // 延迟 3 秒后显示第一条消息
    const initialDelay = setTimeout(() => {
      showMessage();
    }, 3000);

    // 每 15 秒切换一次消息
    const interval = setInterval(showMessage, 15000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [enabled, messages]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[1000] flex flex-col items-end gap-2">
      <AnimatePresence>
        {currentMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-lg max-w-[200px]"
          >
            <p className="text-sm text-gray-700 dark:text-gray-200">{currentMessage.text}</p>
            <div className="absolute bottom-2 right-2 w-0 h-0 border-l-8 border-t-8 border-l-transparent border-t-white/90 dark:border-t-gray-800/90" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="relative cursor-pointer group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsVisible(!isVisible)}
      >
        <div className="w-20 h-20 rounded-full overflow-hidden shadow-xl border-2 border-white dark:border-gray-700">
          <img
            src={avatar}
            alt={name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
        
        <motion.div
          className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="text-white text-xs">✓</span>
        </motion.div>

        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          点击 {isVisible ? '隐藏' : '显示'}
        </div>

        {isVisible && (
          <motion.div
            className="absolute -left-2 top-1/2 -translate-y-1/2"
            animate={{ x: [-2, 2, -2] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <div className="w-4 h-4 bg-white dark:bg-gray-800 rotate-45" />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
