async function chatGPT(msg, accessToken) {
    if(!accessToken) return false;
    const {ChatGPTUnofficialProxyAPI} = (await import('chatgpt'));
    const api = new ChatGPTUnofficialProxyAPI({
        accessToken: accessToken,
        apiReverseProxyUrl: 'https://ai.fakeopen.com/api/conversation'
      });
    const res = await api.sendMessage(msg);
   return res.text;
  }
  
  module.exports = chatGPT;