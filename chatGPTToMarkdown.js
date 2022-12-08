// ==UserScript==
// @name        ChatGPT to Markdown
// @author      self@chrisdallas.tech
// @version     1.1
// @description Export ChatGPT conversations to markdown.
// @grant       none
// @match       *://chat.openai.com/*
// ==/UserScript==

function getConversation() {
  let conversationItemNodes = document.querySelectorAll('*[class^="text-base"]');
  let conversation = searchConversationItemNodes(conversationItemNodes);
  let formattedConversation = conversationToMarkdown(conversation)
  return formattedConversation
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

function conversationToMarkdown(conversation) {
  let markdown = '';
  conversation.forEach((item) => {
    markdown += '**' + item.author + '**: ' + item.text + '\n';
  });

  return markdown;
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
  let conversation = getConversation()
  if (conversation !== '' ) {
    navigator.clipboard.writeText(conversation);
    console.log("ChatGPT Conversation copied")
  }
}, false);

let copyButton = document.createElement('button');
copyButton.innerText = 'Copy to clipboard';

copyButton.style.position = 'fixed';
copyButton.style.borderRadius = "5px";
copyButton.style.bottom = '0';
copyButton.style.right = '0';
copyButton.style.zIndex = '9999';

copyButton.addEventListener("mouseenter", function() {
  copyButton.style.backgroundColor = "#444654";
  copyButton.style.opacity = 1
});

copyButton.addEventListener("mouseleave", function() {
  copyButton.style.backgroundColor = "";
  copyButton.style.fontSize = "";
});

copyButton.addEventListener("click", function() {
  let copyChatGPTEvent = new Event("copy-chatgpt-text");
  document.dispatchEvent(copyChatGPTEvent);
})

document.body.appendChild(copyButton);
