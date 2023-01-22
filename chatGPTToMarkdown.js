// ==UserScript==
// @name        ChatGPT to Markdown
// @author      self@chrisdallas.tech
// @version     1.1
// @description Export ChatGPT conversations to markdown.
// @grant       none
// @match       *://chat.openai.com/*
// @require  https://raw.githubusercontent.com/eligrey/FileSaver.js/cea522bc41bfadc364837293d0c4dc585a65ac46/dist/FileSaver.js
// ==/UserScript==

async function getConversation() {
  let conversationItemNodes = document.querySelectorAll('*[class^="text-base"]');
  let conversation = searchConversationItemNodes(conversationItemNodes);
  let formattedConversation = conversationToMarkdown(conversation)
  const chatData = await fetchChatMetadata(extractChatId())
  const epoch = chatData.create_time
  // trim whitespace from chatData.title 
  const title = chatData.title.trim()
  const date = new Date(epoch * 1000)
  const formattedDate = date.toISOString().split('T')[0]
  const markdownTitle = `# ${title} (${formattedDate})`
  return {
    markdown: markdownTitle + "\n\n" + formattedConversation,
    chatData: chatData,
    title, date, formattedDate
  }
}

function getLanguage(element) {
  var language = element.classList.value.split(" ").find(classname => classname.startsWith("language-"));
  if (language) {
    return language.substring("language-".length);
  }
  return null;
}

function htmlToMarkdown(element) {
  var markdown = "";
  for (var i = 0; i < element.childNodes.length; i++) {
    var node = element.childNodes[i];
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.nodeName === "CODE") {
        if (node.parentNode.nodeName === "P") {
          markdown += "`" + node.textContent + "`";
        } else {
          var language = getLanguage(node);
          markdown += "\n\n```" + (language ? language : "") + "\n" + node.textContent + "\n```\n\n";
        }
      } else if (node.nodeName === "LI") {
        if (node.parentNode.nodeName === "UL") {
          markdown += "* " + htmlToMarkdown(node) + "\n";
        } else if (node.parentNode.nodeName === "OL") {
          let index = Array.prototype.indexOf.call(node.parentNode.childNodes, node) + 1;
          markdown += "" + index + ". " + htmlToMarkdown(node) + "\n";
        } else {
          markdown += "* " + htmlToMarkdown(node) + "\n";
        }
      } else if (node.nodeName === "UL" || node.nodeName === "OL") {
        markdown += "\n" + htmlToMarkdown(node);
      } else if (node.nodeName === "P") {
        // if the preceding node is a P, add a newline
        if (i > 0 && element.childNodes[i - 1].nodeName === "P") {
          markdown += "\n";
        }
        markdown += htmlToMarkdown(node) + "\n";
      } else if (node.nodeName !== "BUTTON") {
        markdown += htmlToMarkdown(node);
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      markdown += node.textContent;
    }
  }
  return markdown;
}

function searchConversationItemNodes(nodes) {
  let results = [];

  for (let node of nodes) {
    let nodeInnerText = htmlToMarkdown(node)
    if (nodeInnerText.length > 0) {
      let author = getAuthor(node);
      let conversationItem = { "author": author, "text": nodeInnerText, "_node": node }
      results.push(conversationItem);
    }
  }

  return results;
}

function conversationToMarkdown(conversation) {
  let markdown = '';
  conversation.forEach((item) => {
    markdown += '\n**' + item.author + '**: ' + item.text + '\n';
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

function getMessages() {
  const threadMap = window.__NEXT_DATA__.props.pageProps.initialData.thread ?? {}
  window.threadMap = threadMap
  // iterate over threadMap and sort messages by create_time
  const messages = Object.values(threadMap)
    .filter((x) => x.message.create_time ?? undefined !== undefined)
    .map((x) => x.message)
    .sort((a, b) => a.create_time - b.create_time)
  return messages
}

function getFirstMessageTimestamp() {
  const messages = getMessages()
  if (messages.length === 0) {
    return null
  }
  const epoch = messages[0].create_time
  // convert epoch to date
  const date = new Date(epoch * 1000)
  return date
}

function extractChatId() {
  // extract chat ID out of current path looking like /chat/chatId
  const path = window.location.pathname
  const chatId = path.split("/")[2]
  return chatId
}

async function fetchChatMetadata(id) {
  const url = "https://chat.openai.com/backend-api/conversation/" + id;

  // fetch chat metadata and parse body as json
  const response = await fetch(url, {
    "cache": "default",
    "credentials": "include",
    "headers": {
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Authorization": "Bearer " + window.__NEXT_DATA__.props.pageProps.accessToken,
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15"
    },
    "method": "GET",
    "mode": "cors",
    "redirect": "follow",
    "referrer": window.location.url,
    "referrerPolicy": "strict-origin-when-cross-origin"
  })
  const ret = await response.json();
  return ret
}

const buttonDiv = document.createElement("div");
buttonDiv.style.position = 'fixed';
buttonDiv.style.bottom = '10px';
buttonDiv.style.right = '10px';
buttonDiv.style.zIndex = '9999';
document.body.appendChild(buttonDiv);

function makeButton(text, eventname, callback) {
  document.addEventListener(eventname, callback, false)
  const button = document.createElement("button")
  button.innerText = text
  button.style.marginLeft = "5px";
  button.style.marginRight = "5px";
  button.style.borderRadius = "5px";

  button.addEventListener("mouseenter", function () {
    button.style.backgroundColor = "#444654";
    button.style.opacity = 1
  });

  button.addEventListener("mouseleave", function () {
    button.style.backgroundColor = "";
    button.style.fontSize = "";
  });

  button.addEventListener("click", function () {
    document.dispatchEvent(new Event(eventname));
  })

  buttonDiv.appendChild(button)
}

makeButton("Copy to clipboard", "copy-chatgpt-text", function () {
  // we have to do this insanity because copy pasting to the clipboard is not 
  // doable in safari.
  //
  // See: https://developer.apple.com/forums/thread/691873
  const clipboardItem = new ClipboardItem({
    'text/plain': getConversation().then(({ markdown }) => {

      /**
       * We have to return an empty string to the clipboard if something bad happens, otherwise the
       * return type for the ClipBoardItem is incorrect.
       */
      if (!markdown) {
        return new Promise(async (resolve) => {
          resolve(new Blob[``]())
        })
      }

      return new Promise(async (resolve) => {
        console.log("Saving chatgpt markdown to clipboard")
        resolve(new Blob([markdown]))
      })
    }),
  })
  // Now, we can write to the clipboard in Safari
  navigator.clipboard.write([clipboardItem])
});

makeButton("Download markdown", "download-chatgpt-text", async function () {
  const { markdown, title, formattedDate } = await getConversation()
  if (!markdown) {
    return
  }

  var blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  // format date
  const filename = formattedDate + " - " + title + ".md"
  saveAs(blob, filename)
});