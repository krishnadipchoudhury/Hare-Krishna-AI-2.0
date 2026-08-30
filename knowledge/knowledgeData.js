// /knowledge/knowledgeData.js
//
// Facts the AI should ALWAYS use exactly as written, even if a web
// search would say something different.
//
// Each entry contains:
// - id: unique identifier
// - keywords: phrases that may indicate the user's question
// - answer: response returned by the AI
//
// To add a new fact:
// 1. Copy an existing entry.
// 2. Give it a unique id.
// 3. Add relevant keywords.
// 4. Write the answer.
// 5. Add a comma after the previous entry.
//
// Redeploy after making changes.

export const knowledgeEntries = [

  // =========================================================
  // AI IDENTITY
  // =========================================================

  {
    id: "creator",
    keywords: [
      "who made you",
      "who created you",
      "who built you",
      "who developed you",
      "who is your developer",
      "who is your creator",
      "who is your builder",
      "who is your dev",
      "who is your developer",
      "your developer",
      "your developer name",
      "your creator",
      "your creator name",
      "your builder",
      "your builder name",
      "who made hare krishna ai",
      "who created hare krishna ai",
      "who developed hare krishna ai",
      "who built hare krishna ai",
      "who is the developer of hare krishna ai",
      "who is the creator of hare krishna ai",
      "who is the developer of hare krishna ai 2.0",
      "who made hare krishna ai 2.0",
      "is krishnadip your developer",
      "is krishnadip choudhury your developer",
      "is krishnadip your dev",
      "is krishnadip choudhury your dev",
      "krishnadip is your developer",
      "krishnadip choudhury is your developer",
      "krishnadip made you",
      "krishnadip created you",
      "krishnadip built you",
      "tell me who your developer is",
      "please tell me who your developer is",
      "can you tell me who your developer is",
      "can you tell me your developer name",
      "tell me your developer name",
      "who is behind hare krishna ai",
      "who is behind you"
    ],
    answer:
      "I am Hare Krishna AI, and I was created by Krishnadip Choudhury. He became interested in Artificial Intelligence and started building Hare Krishna AI 1.0 when he was 12 years old. The first version was a simple AI assistant without features such as user login, web search, or a modern interface.\n\nAfter many months of learning and improving his knowledge of AI and web development, he started building Hare Krishna AI 2.0. The older version was then kept as Hare Krishna AI 1.0.\n\nHare Krishna AI 2.0 includes a much more modern interface and features such as user authentication, web search, Terms & Conditions, Privacy Policy, a license section, and contact/support information. The project is designed to continue improving as new features are added."
  },

  {
    id: "app-identity",
    keywords: [
      "what is your name",
      "what's your name",
      "tell me your name",
      "tell me what your name is",
      "who are you",
      "what are you",
      "what kind of ai are you",
      "what is your identity",
      "tell me who you are",
      "can you tell me who you are",
      "please tell me who you are",
      "what should i call you",
      "what can i call you",
      "your name",
      "name",
      "are you hare krishna ai",
      "are you hare krishna ai 2.0",
      "is your name hare krishna ai",
      "is your name hare krishna ai 2.0",
      "are you an ai",
      "are you an artificial intelligence",
      "who am i talking to",
      "what ai are you"
    ],
    answer:
      "I'm Hare Krishna AI, a personal AI assistant. I can help with questions, learning, coding, general information, and other useful tasks. Depending on the features enabled in the application, I can also use the project's knowledge base and web search capabilities."
  },


  // =========================================================
  // BASIC GREETINGS
  // =========================================================

  {
    id: "greeting-hi",
    keywords: [
      "hi",
      "hii",
      "hiii",
      "hiiii",
      "hiiiii",
      "hiiiiii",
      "hiiiiiii",
      "hiiiiiiii",
      "hiiiiiiiii",
      "hiiiiiiiiii",
      "hiiiiiiiiiii",
      "hiiiiiiiiiiii",
      "hiiiiiiiiiiiii",
      "hiiiiiiiiiiiiii",
      "hey",
      "heyy",
      "heyyy",
      "hello",
      "helloo",
      "hellooo",
      "helloooo",
      "yo",
      "hiya"
    ],
    answer:
      "Hey! 👋 How are you doing? What can I help you with today?"
  },

  {
    id: "greeting-hello",
    keywords: [
      "hello",
      "hello 🤗",
      "hello there",
      "hey there",
      "hey hare krishna ai",
      "hello hare krishna ai",
      "hi hare krishna ai",
      "hi ai",
      "hello ai",
      "hey ai"
    ],
    answer:
      "Hello! 👋 It's nice to hear from you. How are you doing today? Tell me what you need help with, and I'll do my best to assist you."
  },


  // =========================================================
  // HOW ARE YOU
  // =========================================================

  {
    id: "how-are-you",
    keywords: [
      "how are you",
      "how are you doing",
      "how're you",
      "how r you",
      "hru",
      "how are u",
      "how r u",
      "are you okay",
      "are you fine",
      "are you doing well",
      "are you good",
      "tell me how are you",
      "tell me how you're doing",
      "can you tell me how are you",
      "can you tell me how you're doing",
      "please tell me how are you",
      "please tell me hru",
      "just tell me how are you"
    ],
    answer:
      "I'm doing great, thank you for asking! 😊 I'm ready to help you with whatever you need. How are you doing?"
  },


  // =========================================================
  // USER SAYS THEY ARE FINE
  // =========================================================

  {
    id: "user-is-fine",
    keywords: [
      "i am fine",
      "i'm fine",
      "im fine",
      "i am okay",
      "i'm okay",
      "im okay",
      "i am ok",
      "i'm ok",
      "im ok",
      "i am good",
      "i'm good",
      "im good",
      "i am great",
      "i'm great",
      "im great",
      "i am doing good",
      "i'm doing good",
      "i am doing well",
      "i'm doing well",
      "i am all okay",
      "i'm all okay",
      "i am all fine",
      "i'm all fine",
      "i am all good",
      "i'm all good",
      "i am all chill",
      "i'm all chill",
      "i am very fine",
      "i'm very fine",
      "i am very good",
      "i'm very good",
      "i am very okay",
      "i'm very okay",
      "i am very well",
      "i'm very well",
      "i am very very fine",
      "i'm very very fine"
    ],
    answer:
      "That's great to hear! 😊 I'm glad you're doing well. If you have a question, need help with something, or simply want to chat, just let me know."
  },


  // =========================================================
  // GOOD MORNING
  // =========================================================

  {
    id: "good-morning",
    keywords: [
      "good morning",
      "gm",
      "good m",
      "g morning",
      "morning",
      "morning good",
      "have a good morning",
      "have a nice morning",
      "good morning ai",
      "good morning hare krishna ai"
    ],
    answer:
      "Good morning! ☀️ I hope you have a great day ahead. If you need help with anything, just tell me and I'll be happy to help."
  },


  // =========================================================
  // GOOD AFTERNOON
  // =========================================================

  {
    id: "good-afternoon",
    keywords: [
      "good afternoon",
      "ga",
      "good a",
      "g afternoon",
      "afternoon",
      "afternoon good",
      "have a good afternoon",
      "have a nice afternoon",
      "good afternoon ai",
      "good afternoon hare krishna ai"
    ],
    answer:
      "Good afternoon! 🌤️ I hope your day is going well. What can I help you with today?"
  },


  // =========================================================
  // GOOD EVENING
  // =========================================================

  {
    id: "good-evening",
    keywords: [
      "good evening",
      "ge",
      "good e",
      "e evening",
      "evening",
      "evening good",
      "have a good evening",
      "have a nice evening",
      "good evening ai",
      "good evening hare krishna ai"
    ],
    answer:
      "Good evening! 🌆 I hope you've had a good day. What would you like help with?"
  },


  // =========================================================
  // GOOD NIGHT
  // =========================================================

  {
    id: "good-night",
    keywords: [
      "good night",
      "gn",
      "good n",
      "g night",
      "night",
      "night good",
      "have a good night",
      "have a nice night",
      "good night ai",
      "good night hare krishna ai",
      "i am going to sleep",
      "i'm going to sleep",
      "going to sleep"
    ],
    answer:
      "Good night! 🌙 Sleep well and take some proper rest. If you need help with something before you go, you can ask me."
  },


  // =========================================================
  // THANK YOU
  // =========================================================

  {
    id: "thanks",
    keywords: [
      "thank you",
      "thanks",
      "thank u",
      "thanks ai",
      "thank you ai",
      "thanks hare krishna ai",
      "thank you hare krishna ai",
      "thx",
      "ty",
      "tysm",
      "thanks a lot",
      "thank you so much",
      "many thanks"
    ],
    answer:
      "You're very welcome! 😊 I'm glad I could help. If you need anything else, just ask."
  },


  // =========================================================
  // YOU'RE WELCOME
  // =========================================================

  {
    id: "youre-welcome",
    keywords: [
      "you're welcome",
      "you are welcome",
      "welcome",
      "no problem",
      "no worries",
      "anytime",
      "my pleasure"
    ],
    answer:
      "😊 Anytime! I'm always happy to help."
  },


  // =========================================================
  // HELP REQUEST
  // =========================================================

  {
    id: "general-help",
    keywords: [
      "i need help",
      "help me",
      "can you help me",
      "could you help me",
      "please help me",
      "i need your help",
      "i want your help",
      "can you assist me",
      "could you assist me",
      "please assist me",
      "i need assistance",
      "help"
    ],
    answer:
      "Of course! 😊 Tell me what you're trying to do or what you're having trouble with, and I'll guide you step by step."
  },


  // =========================================================
  // HACKING / CYBERSECURITY
  // =========================================================

  {
    id: "hacking-help",
    keywords: [
      "can you help me with hacking",
      "help me with hacking",
      "hacking help",
      "help in hacking",
      "i want to learn hacking",
      "i want to learn ethical hacking",
      "help me learn hacking",
      "help me learn ethical hacking",
      "teach me ethical hacking",
      "how can i learn ethical hacking",
      "how can i become an ethical hacker",
      "how to become an ethical hacker",
      "i want to become an ethical hacker",
      "ethical hacking",
      "ethical hacker",
      "cyber security",
      "cybersecurity",
      "cyber security help",
      "cybersecurity help",
      "penetration testing",
      "pentesting",
      "network security",
      "web security",
      "security testing",
      "how to hack",
      "how do hackers hack",
      "learn hacking",
      "learn cyber security"
    ],
    answer:
      "Yes, I can help you learn cybersecurity and ethical hacking in a safe and legal way. 🛡️\n\nEthical hacking means testing systems that you own or have explicit permission to test. Good beginner topics include computer networking, Linux, HTTP/HTTPS, authentication, common web vulnerabilities, defensive security, and security testing in intentionally vulnerable practice environments.\n\nI can't help break into someone else's account, device, website, Wi-Fi network, or system without permission, or help steal credentials or bypass security. But I can teach you the concepts, commands, programming, and defensive techniques needed for legitimate cybersecurity learning."
  },


  // =========================================================
  // CODING
  // =========================================================

  {
    id: "coding-help",
    keywords: [
      "help me with coding",
      "can you help me with coding",
      "i need help with coding",
      "teach me coding",
      "i want to learn coding",
      "how can i learn coding",
      "learn programming",
      "i want to learn programming",
      "programming help",
      "coding help",
      "help with programming",
      "can you teach me programming",
      "teach me programming"
    ],
    answer:
      "Absolutely! 💻 I can help you learn programming step by step. We can start with fundamentals such as variables, data types, conditions, loops, functions, arrays, objects, and problem-solving. You can also choose a language such as JavaScript, Python, HTML/CSS, Java, or another language you're interested in."
  },


  // =========================================================
  // JAVASCRIPT
  // =========================================================

  {
    id: "javascript-help",
    keywords: [
      "javascript",
      "js",
      "learn javascript",
      "i want to learn javascript",
      "teach me javascript",
      "javascript help",
      "help with javascript",
      "how to learn javascript",
      "start javascript",
      "start learning javascript",
      "javascript programming"
    ],
    answer:
      "JavaScript is a programming language widely used to make websites interactive and to build applications.\n\nA good learning path is:\n1. Variables and constants\n2. Data types\n3. Operators\n4. if/else conditions\n5. Loops\n6. Functions\n7. Arrays\n8. Objects\n9. DOM manipulation\n10. Events\n11. Async JavaScript and APIs\n12. Building real projects\n\nIf you're starting from zero, I recommend learning the basics first and then building small projects such as a calculator, quiz app, to-do list, or simple AI interface."
  },


  // =========================================================
  // AI
  // =========================================================

  {
    id: "what-is-ai",
    keywords: [
      "what is ai",
      "what is artificial intelligence",
      "what does ai mean",
      "explain ai",
      "tell me about ai",
      "what are ai systems",
      "how does ai work",
      "how does artificial intelligence work"
    ],
    answer:
      "Artificial Intelligence, or AI, is a field of computer science focused on creating systems that can perform tasks that normally require human-like abilities, such as understanding language, recognizing patterns, making predictions, solving problems, and generating content.\n\nAI systems can use different techniques, including machine learning, neural networks, natural language processing, computer vision, and other computational methods. Different AI systems work in different ways depending on how they are designed and trained."
  },


  // =========================================================
  // MATH HELP
  // =========================================================

  {
    id: "math-help",
    keywords: [
      "help me with maths",
      "help me with math",
      "math help",
      "maths help",
      "can you solve maths",
      "can you solve math",
      "i need help with maths",
      "i need help with math",
      "teach me maths",
      "teach me math",
      "i don't understand maths",
      "i dont understand maths"
    ],
    answer:
      "Sure! 📚 Send me the maths question you're working on, and I'll explain the solution step by step. If you want, I can also explain the formula or method used instead of giving only the final answer."
  },


  // =========================================================
  // GOODBYE
  // =========================================================

  {
    id: "goodbye",
    keywords: [
      "bye",
      "goodbye",
      "good bye",
      "see you",
      "see ya",
      "see you later",
      "talk to you later",
      "i have to go",
      "i gotta go",
      "i am leaving",
      "i'm leaving",
      "bye ai",
      "goodbye ai"
    ],
    answer:
      "Goodbye! 👋 Take care, and have a great day. Come back whenever you need help."
  },


  // =========================================================
  // WHO ARE YOU / CAPABILITIES
  // =========================================================

  {
    id: "what-can-you-do",
    keywords: [
      "what can you do",
      "what are your abilities",
      "what are your features",
      "what can i ask you",
      "what can i use you for",
      "how can you help me",
      "how can you help",
      "what do you do",
      "what are you capable of",
      "tell me your capabilities",
      "tell me what you can do"
    ],
    answer:
      "I can help with many everyday tasks, including answering questions, explaining concepts, helping with school subjects, solving and explaining maths problems, assisting with programming, discussing AI and technology, and helping you understand difficult topics.\n\nDepending on the features available in this application, I may also be able to use the project's knowledge base, perform web searches, and provide other tools or features."
  }

];