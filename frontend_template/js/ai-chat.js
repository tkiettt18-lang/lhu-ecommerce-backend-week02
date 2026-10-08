/**
 * LOGIC WIDGET TRỢ LÝ AI GOOGLE GEMINI TƯ VẤN BÁN HÀNG
 */

let isChatOpen = false;

function toggleAIChat() {
  const windowEl = document.getElementById('aiChatWindow');
  if (!windowEl) return;

  isChatOpen = !isChatOpen;
  if (isChatOpen) {
    windowEl.classList.remove('hidden');
    document.getElementById('aiInput')?.focus();
  } else {
    windowEl.classList.add('hidden');
  }
}

async function sendAIMessage(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('aiInput');
  const messagesContainer = document.getElementById('aiMessages');
  if (!input || !messagesContainer) return;

  const text = input.value.trim();
  if (!text) return;

  // 1. Render tin nhắn khách hàng
  appendMessage(text, 'user');
  input.value = '';

  // 2. Render trạng thái "AI đang gõ..."
  const typingId = 'typing-' + Date.now();
  const typingEl = document.createElement('div');
  typingEl.className = 'msg msg-ai';
  typingEl.id = typingId;
  typingEl.innerText = '🤖 Đang suy nghĩ và tra cứu sản phẩm...';
  messagesContainer.appendChild(typingEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // 3. Gọi API Backend
  const res = await API.askAI(text);

  // 4. Xóa trạng thái gõ và hiển thị phản hồi
  const activeTyping = document.getElementById(typingId);
  if (activeTyping) activeTyping.remove();

  const replyText = res.success ? res.reply : (res.message || 'Xin lỗi bạn, trợ lý AI đang bận. Bạn vui lòng thử lại câu hỏi khác nhé!');
  appendMessage(replyText, 'ai');
}

function appendMessage(text, sender) {
  const messagesContainer = document.getElementById('aiMessages');
  if (!messagesContainer) return;

  const msg = document.createElement('div');
  msg.className = `msg ${sender === 'user' ? 'msg-user' : 'msg-ai'}`;
  
  // Hỗ trợ hiển thị xuống dòng đẹp mắt
  msg.innerHTML = text.replace(/\n/g, '<br>');
  messagesContainer.appendChild(msg);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
