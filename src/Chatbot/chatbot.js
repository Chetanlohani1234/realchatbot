import React, { useState } from 'react';
import messageLogo from '../assets/Message-icon.png';
import sendLogo from '../assets/send.png';
import user from '../assets/user.jpeg';
import bot from '../assets/bot.jpeg';
import uploadLogo from '../assets/file.jpeg';
import '../Chatbot/chatbot.css';

const Chatbot = () => {
  const [isChatboxVisible, setIsChatboxVisible] = useState(true);
  const [messages, setMessages] = useState([
    { text: 'Hello! How can I assist you today?', sender: '' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [currentTypingMessage, setCurrentTypingMessage] = useState(''); // For the typing effect of the current message
  const [isTyping, setIsTyping] = useState(false);

  // const toggleChatbox = () => {
  //   setIsChatboxVisible(!isChatboxVisible);
  // };

  const [showConfirmation, setShowConfirmation] = useState(false); // State for confirmation popup

  const toggleChatbox = () => {
    if (isChatboxVisible) {
      setShowConfirmation(true);
    } else {
      setIsChatboxVisible(true); // If chatbox is not visible, show it
    }
  };

  // const toggleChatbox = () => {
  //   setIsChatboxVisible(!isChatboxVisible);
  //   if (isChatboxVisible) {
  //     // Clear the chatbox when closing it
  //     setMessages([{ text: 'Hello! How can I assist you today?', sender: '' }]);
  //     setCurrentTypingMessage('');
  //     setIsTyping(false);
  //     setNewMessage('');
  //   }
  // };

  const confirmDelete = () => {
    //setMessages([]); // Clear the chat history
    setMessages([{ text: 'Hello! How can I assist you today?', sender: '' }]);
    setIsChatboxVisible(false);
    setShowConfirmation(false);
    setNewMessage(''); // Clear any new message being typed
    //setTypingMessage(''); // Clear typing message
  };

  const cancelDelete = () => {
    setShowConfirmation(false);
  };
  

  const handleSendMessage = async () => {
    if (newMessage.trim() !== '' && !isTyping) {
      setMessages([...messages, { text: newMessage, sender: 'user' }]);
      setNewMessage('');
      setIsTyping(true); // Set typing state to true

      try {
        const response = await fetch('https://api-es5l.onrender.com/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'polymetrics',
            prompt: newMessage,
            stream: true,
          }),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedResponse = '';
        let partialResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          partialResponse += chunk;

          while (true) {
            try {
              const start = partialResponse.indexOf('{');
              const end = partialResponse.indexOf('}') + 1;
              if (start === -1 || end === -1) break;

              const jsonStr = partialResponse.slice(start, end);
              const jsonResponse = JSON.parse(jsonStr);

              if (jsonResponse.response) {
                accumulatedResponse += jsonResponse.response;
              }

              partialResponse = partialResponse.slice(end);
            } catch (error) {
              console.error('Error parsing JSON chunk:', error);
              break;
            }
          }
        }

        // Display the response with typing effect
        let index = 0;
        const typingInterval = setInterval(() => {
          setCurrentTypingMessage(accumulatedResponse.slice(0, index + 1));
          index += 1;
          if (index === accumulatedResponse.length) {
            clearInterval(typingInterval);
            setMessages((prevMessages) => [
              ...prevMessages,
              { text: accumulatedResponse, sender: 'bot' },
            ]);
            setCurrentTypingMessage(''); // Clear the current typing message
            setIsTyping(false); // Allow new messages after typing is done
          }
        }, 50); // Adjust the typing speed by changing the interval

      } catch (error) {
        console.error('Error fetching API:', error);
        setIsTyping(false); // Reset typing state on error
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Selected file:', file);
    }
  };

  return (
    <div className="chatbot-container">
      {/* Message Photo */}
      <div className="message-photo" onClick={toggleChatbox}>
        <img src={messageLogo} alt="Message" />
      </div>

      {/* Chatbox UI */}
      {isChatboxVisible && (
        <div className="chatbox">
          <div className="chatbox-header">
            <h2 className='chatbox-h2'>Chat with Us</h2>
            <button className="cut-icon" onClick={toggleChatbox}>×</button>
          </div>
          <div className="chatbox-body">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message-container ${
                  message.sender === 'user' ? 'user-message' : 'bot-message'
                }`}
              >
                {message.sender === 'bot' && (
                  <img
                    src={bot}
                    alt="Bot Avatar"
                    className="avatar"
                  />
                )}
                <p className={`message ${message.sender}`}>
                  {message.text}
                </p>
                {message.sender === 'user' && (
                  <img
                    src={user}
                    alt="User Avatar"
                    className="avatar"
                  />
                )}
              </div>
            ))}
            {isTyping && (
              <div className="message-container bot-message">
                <img src={bot} alt="Bot Avatar" className="avatar" />
                <p className="message bot">{currentTypingMessage}</p>
              </div>
            )}
          </div>
          <div className="chatbox-footer">
            <input
              type="text"
              className="message-input"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isTyping} // Disable input if bot is typing
            />
            {/* <input
              type="file"
              id="imageUpload"
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleImageUpload}
            /> */}
            {/* <label htmlFor="imageUpload" className="image-upload-icon">
              <img src={uploadLogo} alt="Upload" />
            </label> */}
            <button className="send-button" onClick={handleSendMessage} disabled={isTyping}>
              <img src={sendLogo} alt="Send" />
            </button>
          </div>
        </div>
      )}
            {showConfirmation && (
        <div className="confirmation-popup">
          <p>Are you sure you want to delete this chat?</p>
          <button onClick={confirmDelete}>Yes</button>
          <button onClick={cancelDelete}>No</button>
        </div>
      )}
    </div>
  );
};

export default Chatbot;




