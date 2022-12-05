// ==UserScript==
// @name        ChatGPT to Markdown
// @author      self@chrisdallas.tech
// @version     1.0
// @description Export ChatGPT conversations to markdown.
// @grant       none
// @match       *://chat.openai.com/*
// ==/UserScript==

function conversationToMarkdown(conversation) {
  let markdown = '';
  conversation.forEach((item) => {
    markdown += '**' + item.author + '**: ' + item.text + '\n';
  });

  return markdown;
}

function searchConversationItemNodes(nodes) {
  let results = [];

  for (let node of nodes) {
    let nodeInnerText = node.innerText
    if (nodeInnerText.length > 0) {
      let author = getAuthor(node);
      let conversationItem = {"author": author, "text": nodeInnerText, "_node": node}
      results.push(conversationItem);
    }
  }

  return results;
}

function getAuthor(node) {
  let outerHTML = node.outerHTML
  function getImgAltAttribute(htmlString) {
    // Search the HTML string for the img element and extract the alt attribute (the authors name)
    const matches = htmlString.match(/<img[^>]+alt="([^"]+)"[^>]*>/i);

    // If there are any matches, return the value of the alt attribute
    if (matches && matches[1]) {
      return matches[1];
    }

    // If there are no matches, it is ChatGPT
    return "ChatGPT";
  }

  return getImgAltAttribute(outerHTML)
}

document.addEventListener('copy-chatgpt-text', function() {
  let conversationItemNodes = document.querySelectorAll('*[class^="ConversationItem__Message"]');
  console.log("Conversation", conversationItemNodes);
  let conversation = searchConversationItemNodes(conversationItemNodes);
  let formattedConversation = conversationToMarkdown(conversation)
  navigator.clipboard.writeText(formattedConversation);
  console.log("ChatGPT Conversation copied")
}, false);

let button = document.createElement('button');
button.innerText = 'Copy ChatGPT Conversation';

button.style.position = 'fixed';
button.style.border = "none";
button.style.borderRadius = "5px";
button.style.bottom = '0';
button.style.right = '0';
button.style.zIndex = '9999';

button.addEventListener("mouseenter", function() {
  button.style.backgroundColor = "#444654";
  button.style.opacity = 1
});

button.addEventListener("mouseleave", function() {
  button.style.backgroundColor = "";
  button.style.fontSize = "";
});

button.addEventListener("click", function() {
  let copyChatGPTEvent = new Event("copy-chatgpt-text");
  document.dispatchEvent(copyChatGPTEvent);
})

document.body.appendChild(button);