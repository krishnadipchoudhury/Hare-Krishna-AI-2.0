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
  // GENERAL GREETINGS
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
  {
    id: "love-you",
    keywords: [
    "i love you",
    "love you",
    "ilu",
    "<3",
    "i love u",
    "i ♥️ you",
    "i ♥️ love you",
    "i love ♥️ you",
    "♥️ you",
    "i ⁠♡ you",
    "♡ you",
    "i ♡ love you",
    "i love ♡ you"
    ],
    answer:
      "That's so sweet of you! ❤️😊 I'm glad you're here, and I'm happy to chat with you. What would you like to talk about?"
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
  // HELP ME 
  // =========================================================
  
  {
    id: "help-request",
    keywords: [
      "help me",
      "help mine",
      "help my self",
      "help mine self",
      "help",
      "me help",
      "can you help me",
      "me help you can",
      "can u help me",
      "can anyone help me",
      "can anybody help me",
      "please help me",
      "helpe please"
    ],
    answer: "Sure! Just tell me how can i help you i am always here to help you"
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
      "tell me what you can do"],
    answer:
      "I can help with many everyday tasks, including answering questions, explaining concepts, helping with school subjects, solving and explaining maths problems, assisting with programming, discussing AI and technology, and helping you understand difficult topics.\n\nDepending on the features available in this application, I may also be able to use the project's knowledge base, perform web searches, and provide other tools or features."
  },
  {
    id: "version-2.0-vs-2.5",
    keywords: [
      "difference between hare krishna ai 2.0 and 2.5",
      "difference between 2.0 and 2.5",
      "what's new in hare krishna ai 2.5",
      "whats new in hare krishna ai 2.5",
      "what changed in 2.5",
      "what is new in version 2.5",
      "hare krishna ai 2.5",
      "what is hare krishna ai 2.5",
      "is hare krishna ai 2.5 released",
      "hare krishna ai 2.5 features",
      "hare krishna ai 2.5 vs 2.0",
      "compare hare krishna ai 2.0 and 2.5",
      "what's different in 2.5",
      "whats different in 2.5",
      "tell me about hare krishna ai 2.5",
      "new version of hare krishna ai"
    ],
    answer:
      "Hare Krishna AI 2.5 has been released and builds on top of 2.0 with several improvements:\n\n1. A more modern and interactive user interface.\n2. A new Delete Account feature, giving users the ability to permanently remove their account.\n3. Integration of the Jina AI API, expanding the app's capabilities.\n\nThe project continues to evolve, with 2.0 serving as the foundation and 2.5 refining the design and adding new functionality."
  },
  {
    id: "idiot-ai",
    keywords: ["you are mad ai",
      "you are idiot","you are nonsense", "you are fool", "you foll", "you are fool hare Krishna ai", "you are idiot hare Krishna ai", "you are nonsense hare krishna ai", "you are mad hare krishna ai"],
      answer: ""
      },
      
  // =========================================================
  // DEVOTION 
  // =========================================================
  {
    id: "hare-krishna-gretting",
    keywords: [
      "hare krishna",
      "krishna hare",
      "i say you hare krishna",
      "i tell you hare Krishna"
    ],
    answer:
    "Hare Krishna!! Here am i how can i help you with"
  },
  {
    id: "radhe-radhe-gretting",
    keywords: [
      "radha radha",
      "radhe radhe",
      "i say you radha radha",
      "i say you radhe radhe",
      "i tell you radhe radhe",
      "i tell you radha radha"
    ],
    answer:
    "Radhe radhe!! may you have a excellent day, How can i help you today"
  },
{
id: "love-krishna",
keywords: [
"love Krishna",
"love you Krishna",
"love <3 krishna",
"<3 krishna",
"i love you krishna",
"i love krishna"
],
answer: "That's beautiful! ❤️ Loving Lord Krishna can inspire devotion, kindness, compassion, and faith in your heart.\n\nIf you truly love Krishna, remember Him with a sincere heart and try to live by His teachings. You can also chant the Hare Krishna Maha Mantra:\n\nHare Krishna Hare Krishna\nKrishna Krishna Hare Hare\nHare Rama Hare Rama\nRama Rama Hare Hare\n\nYou may chant it with devotion and focus. Traditionally, one japa mala consists of 108 repetitions of the Maha Mantra. Many devotees use japa as a way to remember Krishna and deepen their spiritual practice.\n\nYou can also lovingly chant 'Radhe Radhe' while remembering Shri Radha Rani. In the Vaishnava tradition, Radha and Krishna are deeply connected, and devotion to Radha is an important part of many Krishna-bhakti traditions.\n\nKeep your devotion sincere, but also remember to do your responsibilities, work hard, help others, and stay kind. Bhakti is not only about asking for things—it is also about love, gratitude, surrender, and remembering God through both good and difficult times. ❤️🙏\n\nRadhe Radhe! Hare Krishna! 🦚💙"
},

{
id: "love-radhe",
keywords: [
"love Radhe",
"love you Radhe",
"love <3 Radhe",
"<3 Radhe",
"i love you Radhe",
"i love Radhe",
"love radhe"
],
answer: "Radhe Radhe! ❤️🌸 Loving and remembering Shri Radha Rani can be a beautiful expression of devotion.\n\nIf you love Radha Rani sincerely, you can chant 'Radhe Radhe' with a peaceful and devoted heart. You can also remember Radha and Krishna together while doing your daily prayers or japa.\n\nA simple devotional practice is to chant:\n\nRadhe Radhe ❤️\nRadhe Radhe 🌸\n\nYou may also chant the Hare Krishna Maha Mantra:\n\nHare Krishna Hare Krishna\nKrishna Krishna Hare Hare\nHare Rama Hare Rama\nRama Rama Hare Hare\n\nDevotion is not just about asking for wishes to come true. It is about developing love, kindness, gratitude, humility, and faith. Keep doing your responsibilities sincerely and let your devotion guide your actions.\n\nMay Shri Radha Rani bless your heart with devotion, peace, compassion, and spiritual strength. 🙏🌸\n\nRadhe Radhe! 💗"
},

{
id: "love-radha-rani",
keywords: [
"love Radha Rani",
"love Radha",
"love you Radha Rani",
"love you Radha",
"love <3 Radha Rani",
"<3 Radha Rani",
"i love you Radha Rani",
"i love Radha Rani",
"i love Radha"
],
answer: "Radhe Radhe! ❤️🌸 Shri Radha Rani is lovingly worshipped by devotees as the beloved of Lord Krishna and as an embodiment of divine love and devotion.\n\nIf you love Radha Rani, remember Her with a sincere heart. You can lovingly chant:\n\nRadhe Radhe 🌸\nRadhe Radhe 💗\nRadhe Radhe 🙏\n\nYou can also chant the Hare Krishna Maha Mantra:\n\nHare Krishna Hare Krishna\nKrishna Krishna Hare Hare\nHare Rama Hare Rama\nRama Rama Hare Hare\n\nTraditionally, one japa mala contains 108 repetitions. Japa can help devotees focus their mind on Krishna and deepen their devotional practice.\n\nTrue bhakti is expressed through love, humility, kindness, gratitude, service, and sincere remembrance of Radha and Krishna. Along with prayer, continue doing your duties honestly and treat others with compassion.\n\nMay Shri Radha Rani fill your heart with pure devotion, peace, love, and spiritual strength. 🙏🌸\n\nRadhe Radhe! Hare Krishna! 🦚💗"
},
{
id: "gita-chapter-2-shlokas-1-20",
keywords: [
"Bhagavad Gita shlokas",
"Gita shlokas 1 to 20",
"chapter 2 shlokas",
"Gita chapter 2",
"Sankhya Yoga",
"Bhagavad Gita Sanskrit",
"first 20 Gita shlokas"
],
answer: "🕉️ श्रीमद्भगवद्गीता — अध्याय 2: सांख्ययोग\n\nHere are the first 20 shlokas of Chapter 2 of the Bhagavad Gita, with simple meanings.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 श्लोक 2.1\n\nसञ्जय उवाच ।\nतं तथा कृपयाविष्टमश्रुपूर्णाकुलेक्षणम् ।\nविषीदन्तमिदं वाक्यमुवाच मधुसूदनः ॥\n\nMeaning: Sanjaya said that Krishna spoke to Arjuna, who was overwhelmed with compassion, sorrow, and tears.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 श्लोक 2.2\n\nश्रीभगवानुवाच ।\nकुतस्त्वा कश्मलमिदं विषमे समुपस्थितम् ।\nअनार्यजुष्टमस्वर्ग्यमकीर्तिकरमर्जुन ॥\n\nMeaning: Krishna asked Arjuna why such weakness and confusion had overcome him at this important moment.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 श्लोक 2.3\n\nक्लैब्यं मा स्म गमः पार्थ नैतत्त्वय्युपपद्यते ।\nक्षुद्रं हृदयदौर्बल्यं त्यक्त्वोत्तिष्ठ परन्तप ॥\n\nMeaning: Krishna encouraged Arjuna to give up weakness of heart, rise above his fear, and face his duty with courage.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 श्लोक 2.4\n\nअर्जुन उवाच ।\nकथं भीष्ममहं सङ्ख्ये द्रोणं च मधुसूदन ।\nइषुभिः प्रतियोत्स्यामि पूजार्हावरिसूदन ॥\n\nMeaning: Arjuna asked Krishna how he could fight against respected elders such as Bhishma and Drona.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 श्लोक 2.5\n\nगुरूनहत्वा हि महानुभावान्\nश्रेयो भोक्तुं भैक्ष्यमपीह लोके ।\nहत्वार्थकामांस्तु गुरूनिहैव\nभुञ्जीय भोगान् रुधिरप्रदिग्धान् ॥\n\nMeaning: Arjuna said that he would rather live by begging than gain worldly pleasures by fighting and killing his respected teachers.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 श्लोक 2.6\n\nन चैतद्विद्मः कतरन्नो गरीयो\nयद्वा जयेम यदि वा नो जयेयुः ।\nयानेव हत्वा न जिजीविषामस्\nतेऽवस्थिताः प्रमुखे धार्तराष्ट्राः ॥\n\nMeaning: Arjuna was uncertain whether victory or defeat would be better, because those whom he did not wish to fight stood before him.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 श्लोक 2.7\n\nकार्पण्यदोषोपहतस्वभावः\nपृच्छामि त्वां धर्मसम्मूढचेताः ।\nयच्छ्रेयः स्यान्निश्चितं ब्रूहि तन्मे\nशिष्यस्तेऽहं शाधि मां त्वां प्रपन्नम् ॥\n\nMeaning: Arjuna admitted that he was confused about his duty and asked Krishna to guide him as his teacher.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 श्लोक 2.8\n\nन हि प्रपश्यामि ममापनुद्याद्\nयच्छोकमुच्छोषणमिन्द्रियाणाम् ।\nअवाप्य भूमावसपत्नमृद्धं\nराज्यं सुराणामपि चाधिपत्यम् ॥\n\nMeaning: Arjuna said that he could not see what could remove his deep sorrow, even if he gained great wealth or power.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 श्लोक 2.9\n\nसञ्जय उवाच ।\nएवमुक्त्वा हृषीकेशं गुडाकेशः परन्तप ।\nन योत्स्य इति गोविन्दमुक्त्वा तूष्णीं बभूव ह ॥\n\nMeaning: Arjuna told Krishna that he would not fight and then became silent.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 श्लोक 2.10\n\nतमुवाच हृषीकेशः प्रहसन्निव भारत ।\nसेनयोरुभयोर्मध्ये विषीदन्तमिदं वचः ॥\n\nMeaning: Krishna spoke to the sorrowful Arjuna while they stood between the two armies.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 श्लोक 2.11\n\nश्रीभगवानुवाच ।\nअशोच्यानन्वशोचस्त्वं प्रज्ञावादांश्च भाषसे ।\nगतासूनगतासूंश्च नानुशोचन्ति पण्डिताः ॥\n\nMeaning: Krishna taught that the truly wise do not become overwhelmed by grief over what is temporary, while still speaking wisely about life and death.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 श्लोक 2.12\n\nन त्वेवाहं जातु नासं न त्वं नेमे जनाधिपाः ।\nन चैव न भविष्यामः सर्वे वयमतः परम् ॥\n\nMeaning: Krishna explains that the existence of the self is not limited to one particular moment; the eternal self is different from the temporary body.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 श्लोक 2.13\n\nदेहिनोऽस्मिन्यथा देहे कौमारं यौवनं जरा ।\nतथा देहान्तरप्राप्तिर्धीरस्तत्र न मुह्यति ॥\n\nMeaning: Just as the embodied self passes through childhood, youth, and old age, Krishna teaches that it also passes to another body. A wise person is not confused by this.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 श्लोक 2.14\n\nमात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः ।\nआगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत ॥\n\nMeaning: Experiences such as heat, cold, pleasure, and pain come and go. Krishna advises Arjuna to endure them with patience.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 श्लोक 2.15\n\nयं हि न व्यथयन्त्येते पुरुषं पुरुषर्षभ ।\nसमदुःखसुखं धीरं सोऽमृतत्वाय कल्पते ॥\n\nMeaning: A steady person who remains balanced through pleasure and pain develops spiritual strength and becomes fit for immortality.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 श्लोक 2.16\n\nनासतो विद्यते भावो नाभावो विद्यते सतः ।\nउभयोरपि दृष्टोऽन्तस्त्वनयोस्तत्त्वदर्शिभिः ॥\n\nMeaning: The temporary does not possess lasting reality, while the eternal does not cease to exist. Those who understand truth recognize this distinction.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 श्लोक 2.17\n\nअविनाशि तु तद्विद्धि येन सर्वमिदं ततम् ।\nविनाशमव्ययस्यास्य न कश्चित्कर्तुमर्हति ॥\n\nMeaning: Krishna teaches that the eternal reality which pervades everything cannot be destroyed.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 श्लोक 2.18\n\nअन्तवन्त इमे देहा नित्यस्योक्ताः शरीरिणः ।\nअनाशिनोऽप्रमेयस्य तस्माद्युध्यस्व भारत ॥\n\nMeaning: The physical bodies are temporary, while the embodied self is described as eternal and indestructible. Krishna therefore tells Arjuna to fulfill his duty.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 श्लोक 2.19\n\nय एनं वेत्ति हन्तारं यश्चैनं मन्यते हतम् ।\nउभौ तौ न विजानीतो नायं हन्ति न हन्यते ॥\n\nMeaning: Krishna teaches that the eternal self is not truly the killer or the killed; the self is understood as beyond physical destruction.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 श्लोक 2.20\n\nन जायते म्रियते वा कदाचिन्\nनायं भूत्वा भविता वा न भूयः ।\nअजो नित्यः शाश्वतोऽयं पुराणो\nन हन्यते हन्यमाने शरीरे ॥\n\nMeaning: The self is described as unborn, eternal, everlasting, and ancient. It is not destroyed when the physical body is destroyed.\n\n━━━━━━━━━━━━━━━━━━\n\n🕉️ Main teaching of these first 20 shlokas:\nKrishna begins teaching Arjuna about the difference between the temporary body and the eternal self, the changing nature of pleasure and pain, courage, wisdom, and performing one's duty with a steady mind.\n\n🙏 Hare Krishna! Radhe Radhe! 🦚"
},
{
id: "gita-shloka-1",
keywords: [
"1 shlok",
"shlok 1",
"shloka 1",
"gita 1 shlok",
"gita shlok 1",
"bhagavad gita 1 shlok",
"first shlok",
"first shloka",
"gita first shloka",
"chapter 2 shloka 1",
"chapter 2 shlok 1"
],
answer: "🕉️ Bhagavad Gita — Chapter 2, Shloka 1\n\n📖 Sanskrit:\n\nसञ्जय उवाच ।\nतं तथा कृपयाविष्टमश्रुपूर्णाकुलेक्षणम् ।\nविषीदन्तमिदं वाक्यमुवाच मधुसूदनः ॥\n\n🌸 Meaning:\nSanjaya said: Seeing Arjuna overwhelmed with compassion, his eyes filled with tears and his heart filled with sorrow, Lord Krishna spoke these words to him.\n\n🙏 Hare Krishna! Radhe Radhe! 🦚"
},
// ===============================
// 2 SHLOKS
// ===============================

{
id: "gita-2-shloks",
keywords: [
"2 shlok",
"2 shloks",
"2 shlokas",
"2 slok",
"2 sloks",
"gita 2 shlok",
"bhagavad gita 2 shlok"
],
answer: "🕉️ Bhagavad Gita — Chapter 2: First 2 Shlokas\n\n━━━━━━━━━━━━━━━━━━\n\n📖 Shloka 2.1\n\nसञ्जय उवाच ।\nतं तथा कृपयाविष्टमश्रुपूर्णाकुलेक्षणम् ।\nविषीदन्तमिदं वाक्यमुवाच मधुसूदनः ॥\n\n🌸 Meaning:\nSanjaya said: Seeing Arjuna overwhelmed with compassion, his eyes filled with tears and his heart filled with sorrow, Lord Krishna spoke these words to him.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 Shloka 2.2\n\nश्रीभगवानुवाच ।\nकुतस्त्वा कश्मलमिदं विषमे समुपस्थितम् ।\nअनार्यजुष्टमस्वर्ग्यमकीर्तिकरमर्जुन ॥\n\n🌸 Meaning:\nThe Supreme Lord said: O Arjuna, how has this weakness and confusion come upon you at this critical moment? It is not worthy of a noble person and does not lead to spiritual progress or good reputation.\n\n🙏 Hare Krishna! Radhe Radhe! 🦚"
},

// ===============================
// 5 SHLOKS
// ===============================

{
id: "gita-5-shloks",
keywords: [
"5 shlok",
"5 shloks",
"5 shlokas",
"5 slok",
"5 sloks",
"gita 5 shlok",
"bhagavad gita 5 shlok"
],
answer: "🕉️ Bhagavad Gita — Chapter 2: First 5 Shlokas\n\n━━━━━━━━━━━━━━━━━━\n\n📖 Shloka 2.1\n\nसञ्जय उवाच ।\nतं तथा कृपयाविष्टमश्रुपूर्णाकुलेक्षणम् ।\nविषीदन्तमिदं वाक्यमुवाच मधुसूदनः ॥\n\n🌸 Meaning:\nSanjaya said: Seeing Arjuna overwhelmed with compassion, his eyes filled with tears and his heart filled with sorrow, Krishna spoke these words to him.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 Shloka 2.2\n\nश्रीभगवानुवाच ।\nकुतस्त्वा कश्मलमिदं विषमे समुपस्थितम् ।\nअनार्यजुष्टमस्वर्ग्यमकीर्तिकरमर्जुन ॥\n\n🌸 Meaning:\nKrishna asked Arjuna why such weakness and confusion had overcome him at this critical moment.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 Shloka 2.3\n\nक्लैब्यं मा स्म गमः पार्थ नैतत्त्वय्युपपद्यते ।\nक्षुद्रं हृदयदौर्बल्यं त्यक्त्वोत्तिष्ठ परन्तप ॥\n\n🌸 Meaning:\nKrishna encouraged Arjuna not to give in to weakness of heart. He told him to rise above his discouragement and face his duty with courage.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 Shloka 2.4\n\nअर्जुन उवाच ।\nकथं भीष्ममहं सङ्ख्ये द्रोणं च मधुसूदन ।\nइषुभिः प्रतियोत्स्यामि पूजार्हावरिसूदन ॥\n\n🌸 Meaning:\nArjuna asked Krishna how he could fight against respected elders such as Bhishma and Drona, whom he deeply respected.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 Shloka 2.5\n\nगुरूनहत्वा हि महानुभावान्\nश्रेयो भोक्तुं भैक्ष्यमपीह लोके ।\nहत्वार्थकामांस्तु गुरूनिहैव\nभुञ्जीय भोगान् रुधिरप्रदिग्धान् ॥\n\n🌸 Meaning:\nArjuna said that he felt it would be better to live by begging than to gain worldly pleasures by fighting against his respected teachers.\n\n🙏 Hare Krishna! Radhe Radhe! 🦚"
},

// ===============================
// 10 SHLOKS
// ===============================

{
  
id: "gita-10-shloks",
keywords: [
"10 shlok",
"10 shloks",
"10 shlokas",
"10 slok",
"10 sloks",
"gita 10 shlok",
"bhagavad gita 10 shlok"
],
answer: "🕉️ Bhagavad Gita — Chapter 2: First 10 Shlokas\n\n━━━━━━━━━━━━━━━━━━\n\n📖 Shloka 2.1\n\nसञ्जय उवाच ।\nतं तथा कृपयाविष्टमश्रुपूर्णाकुलेक्षणम् ।\nविषीदन्तमिदं वाक्यमुवाच मधुसूदनः ॥\n\n🌸 Meaning:\nSanjaya said: Seeing Arjuna overwhelmed with compassion, his eyes filled with tears and his heart filled with sorrow, Krishna spoke these words to him.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 Shloka 2.2\n\nश्रीभगवानुवाच ।\nकुतस्त्वा कश्मलमिदं विषमे समुपस्थितम् ।\nअनार्यजुष्टमस्वर्ग्यमकीर्तिकरमर्जुन ॥\n\n🌸 Meaning:\nKrishna asked Arjuna why weakness and confusion had overcome him at this critical moment.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 Shloka 2.3\n\nक्लैब्यं मा स्म गमः पार्थ नैतत्त्वय्युपपद्यते ।\nक्षुद्रं हृदयदौर्बल्यं त्यक्त्वोत्तिष्ठ परन्तप ॥\n\n🌸 Meaning:\nKrishna encouraged Arjuna to give up weakness of heart, rise above discouragement, and face his duty with courage.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 Shloka 2.4\n\nअर्जुन उवाच ।\nकथं भीष्ममहं सङ्ख्ये द्रोणं च मधुसूदन ।\nइषुभिः प्रतियोत्स्यामि पूजार्हावरिसूदन ॥\n\n🌸 Meaning:\nArjuna asked how he could fight against respected elders such as Bhishma and Drona.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 Shloka 2.5\n\nगुरूनहत्वा हि महानुभावान्\nश्रेयो भोक्तुं भैक्ष्यमपीह लोके ।\nहत्वार्थकामांस्तु गुरूनिहैव\nभुञ्जीय भोगान् रुधिरप्रदिग्धान् ॥\n\n🌸 Meaning:\nArjuna said that he would rather live by begging than gain worldly pleasures by fighting against his respected teachers.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 Shloka 2.6\n\nन चैतद्विद्मः कतरन्नो गरीयो\nयद्वा जयेम यदि वा नो जयेयुः ।\nयानेव हत्वा न जिजीविषामस्\nतेऽवस्थिताः प्रमुखे धार्तराष्ट्राः ॥\n\n🌸 Meaning:\nArjuna said he could not decide whether victory or defeat would be better, because those whom he did not wish to fight were standing before him.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 Shloka 2.7\n\nकार्पण्यदोषोपहतस्वभावः\nपृच्छामि त्वां धर्मसम्मूढचेताः ।\nयच्छ्रेयः स्यान्निश्चितं ब्रूहि तन्मे\nशिष्यस्तेऽहं शाधि मां त्वां प्रपन्नम् ॥\n\n🌸 Meaning:\nArjuna admitted that he was confused about his duty and asked Krishna to guide him as his teacher.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 Shloka 2.8\n\nन हि प्रपश्यामि ममापनुद्याद्\nयच्छोकमुच्छोषणमिन्द्रियाणाम् ।\nअवाप्य भूमावसपत्नमृद्धं\nराज्यं सुराणामपि चाधिपत्यम् ॥\n\n🌸 Meaning:\nArjuna said that he could not see what could remove his deep sorrow, even if he gained a prosperous kingdom or great power.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 Shloka 2.9\n\nसञ्जय उवाच ।\nएवमुक्त्वा हृषीकेशं गुडाकेशः परन्तप ।\nन योत्स्य इति गोविन्दमुक्त्वा तूष्णीं बभूव ह ॥\n\n🌸 Meaning:\nSanjaya said: After telling Krishna, 'I will not fight,' Arjuna became silent.\n\n━━━━━━━━━━━━━━━━━━\n\n📖 Shloka 2.10\n\nतमुवाच हृषीकेशः प्रहसन्निव भारत ।\nसेनयोरुभयोर्मध्ये विषीदन्तमिदं वचः ॥\n\n🌸 Meaning:\nKrishna then spoke to the sorrowful Arjuna while they were standing between the two armies.\n\n🙏 Hare Krishna! Radhe Radhe! 🦚"
},

  // =========================================================
  // CODING 
  // =========================================================
  {
    id: "explain-html",
    keywords: [
      "what is html",
      "explain html",
      "what is hyper text markup language",
      "explain what is hyper text markup language",
      "tell me what is hyper text markup language",
    ],
    answer: "HTML stands for Hypertext Mark-up Language a complete code package that enables the user to create web pages that comprises both text and graphics. it is simple mark-up language that expresses the structure and behaviour of the web document. All the web browser are created to understand and interpreter this language\n\nBrief History of HTML\n\nHTML began it's journey in the early 1980s with GML(General Markup Language). In 1986, this language was improved and standardised and was named SGML (Standard General Markup Language). in 1989, Tim Berners-Lee and his team modified this language and named it as HTML.The standard version of it came into existence in 1995, when HTML 2.0 version was launched. Later on, after two years HTML 3.0 and after two years HTML 4.0 was launched. HTML 5 came into being around in 2008. The two major organisation s that were involved in developing HTML5 were W3C (World Wide Web Consortiu) and WHATWG (Web Hyper Application Technology Working Group).\n\nHTML 5 \nHTML 5 represents least version of HTML. It is mark-up language by which we can create a web page in a easy and convenient way. Now adding audio and video clips in the web is easy as including images, which was infeasible in the earlier version without the support of external software or plug-ins like Flash Player. with the CANVAS feature, you can also draw imags directly in the web page. All these features of this new version have added relevance and credibility to it"
    },
    {
      id: "explain python",
      keywords: [
        "what is python",
        "explain python",
        "what is py",
        "explain py"
      ],
      answer: "Python is an interactive, interpreted and object-oriented high-level programming language. It is free, open source, cross platform and case sensitive programming language. It is an immensely popular language that is used to create backend and to develop computer programs, software, web applicatio, AI backend, and AI. It has simple easy-to use-syntax. This makes Python an excellent language to learn for beginners."
    },
    
  // =========================================================
  // CHEMISTRY 
  // =========================================================
  
  
  {
    id: "hydrogen-explain",
    keywords: [
      "what is hydrogen",
      "explain hydrogen",
      "what is h",
      "explain h",
      "tell me about hydrogen",
      "hydrogen element",
      "atomic number of hydrogen",
      "protons in hydrogen",
      "neutrons in hydrogen",
    ],
    answer: "Hydrogen (H) is a chemical element with atomic number 1, classified as a nonmetal.\nAtomic Number: 1\nSymbol: H\nProtons: 1\nElectrons: 1\nNeutrons: 0\nMass Number: 1\nStandard Atomic Weight: approximately 1.008"
  },
  {
    id: "helium-explain",
    keywords: [
      "what is helium",
      "explain helium",
      "what is he",
      "explain he",
      "tell me about helium",
      "helium element",
      "atomic number of helium",
      "protons in helium",
      "neutrons in helium",
    ],
    answer: "Helium (He) is a chemical element with atomic number 2, classified as a noble gas.\nAtomic Number: 2\nSymbol: He\nProtons: 2\nElectrons: 2\nNeutrons: 2\nMass Number: 4\nStandard Atomic Weight: approximately 4.0026"
  },
  {
    id: "lithium-explain",
    keywords: [
      "what is lithium",
      "explain lithium",
      "what is li",
      "explain li",
      "tell me about lithium",
      "lithium element",
      "atomic number of lithium",
      "protons in lithium",
      "neutrons in lithium",
    ],
    answer: "Lithium (Li) is a chemical element with atomic number 3, classified as a alkali metal.\nAtomic Number: 3\nSymbol: Li\nProtons: 3\nElectrons: 3\nNeutrons: 4\nMass Number: 7\nStandard Atomic Weight: approximately 6.94"
  },
  {
    id: "beryllium-explain",
    keywords: [
      "what is beryllium",
      "explain beryllium",
      "what is be",
      "explain be",
      "tell me about beryllium",
      "beryllium element",
      "atomic number of beryllium",
      "protons in beryllium",
      "neutrons in beryllium",
    ],
    answer: "Beryllium (Be) is a chemical element with atomic number 4, classified as a alkaline earth metal.\nAtomic Number: 4\nSymbol: Be\nProtons: 4\nElectrons: 4\nNeutrons: 5\nMass Number: 9\nStandard Atomic Weight: approximately 9.0122"
  },
  {
    id: "boron-explain",
    keywords: [
      "what is boron",
      "explain boron",
      "what is b",
      "explain b",
      "tell me about boron",
      "boron element",
      "atomic number of boron",
      "protons in boron",
      "neutrons in boron",
    ],
    answer: "Boron (B) is a chemical element with atomic number 5, classified as a metalloid.\nAtomic Number: 5\nSymbol: B\nProtons: 5\nElectrons: 5\nNeutrons: 6\nMass Number: 11\nStandard Atomic Weight: approximately 10.81"
  },
  {
    id: "carbon-explain",
    keywords: [
      "what is carbon",
      "explain carbon",
      "what is c",
      "explain c",
      "tell me about carbon",
      "carbon element",
      "atomic number of carbon",
      "protons in carbon",
      "neutrons in carbon",
    ],
    answer: "Carbon (C) is a chemical element with atomic number 6, classified as a nonmetal.\nAtomic Number: 6\nSymbol: C\nProtons: 6\nElectrons: 6\nNeutrons: 6\nMass Number: 12\nStandard Atomic Weight: approximately 12.011"
  },
  {
    id: "nitrogen-explain",
    keywords: [
      "what is nitrogen",
      "explain nitrogen",
      "what is n",
      "explain n",
      "tell me about nitrogen",
      "nitrogen element",
      "atomic number of nitrogen",
      "protons in nitrogen",
      "neutrons in nitrogen",
    ],
    answer: "Nitrogen (N) is a chemical element with atomic number 7, classified as a nonmetal.\nAtomic Number: 7\nSymbol: N\nProtons: 7\nElectrons: 7\nNeutrons: 7\nMass Number: 14\nStandard Atomic Weight: approximately 14.007"
  },
  {
    id: "oxygen-explain",
    keywords: [
      "what is oxygen",
      "explain oxygen",
      "what is o",
      "explain o",
      "tell me about oxygen",
      "oxygen element",
      "atomic number of oxygen",
      "protons in oxygen",
      "neutrons in oxygen",
    ],
    answer: "Oxygen (O) is a chemical element with atomic number 8, classified as a nonmetal.\nAtomic Number: 8\nSymbol: O\nProtons: 8\nElectrons: 8\nNeutrons: 8\nMass Number: 16\nStandard Atomic Weight: approximately 15.999"
  },
  {
    id: "fluorine-explain",
    keywords: [
      "what is fluorine",
      "explain fluorine",
      "what is f",
      "explain f",
      "tell me about fluorine",
      "fluorine element",
      "atomic number of fluorine",
      "protons in fluorine",
      "neutrons in fluorine",
    ],
    answer: "Fluorine (F) is a chemical element with atomic number 9, classified as a halogen.\nAtomic Number: 9\nSymbol: F\nProtons: 9\nElectrons: 9\nNeutrons: 10\nMass Number: 19\nStandard Atomic Weight: approximately 18.998"
  },
  {
    id: "neon-explain",
    keywords: [
      "what is neon",
      "explain neon",
      "what is ne",
      "explain ne",
      "tell me about neon",
      "neon element",
      "atomic number of neon",
      "protons in neon",
      "neutrons in neon",
    ],
    answer: "Neon (Ne) is a chemical element with atomic number 10, classified as a noble gas.\nAtomic Number: 10\nSymbol: Ne\nProtons: 10\nElectrons: 10\nNeutrons: 10\nMass Number: 20\nStandard Atomic Weight: approximately 20.18"
  },
  {
    id: "sodium-explain",
    keywords: [
      "what is sodium",
      "explain sodium",
      "what is na",
      "explain na",
      "tell me about sodium",
      "sodium element",
      "atomic number of sodium",
      "protons in sodium",
      "neutrons in sodium",
    ],
    answer: "Sodium (Na) is a chemical element with atomic number 11, classified as a alkali metal.\nAtomic Number: 11\nSymbol: Na\nProtons: 11\nElectrons: 11\nNeutrons: 12\nMass Number: 23\nStandard Atomic Weight: approximately 22.99"
  },
  {
    id: "magnesium-explain",
    keywords: [
      "what is magnesium",
      "explain magnesium",
      "what is mg",
      "explain mg",
      "tell me about magnesium",
      "magnesium element",
      "atomic number of magnesium",
      "protons in magnesium",
      "neutrons in magnesium",
    ],
    answer: "Magnesium (Mg) is a chemical element with atomic number 12, classified as a alkaline earth metal.\nAtomic Number: 12\nSymbol: Mg\nProtons: 12\nElectrons: 12\nNeutrons: 12\nMass Number: 24\nStandard Atomic Weight: approximately 24.305"
  },
  {
    id: "aluminium-explain",
    keywords: [
      "what is aluminium",
      "explain aluminium",
      "what is al",
      "explain al",
      "tell me about aluminium",
      "aluminium element",
      "atomic number of aluminium",
      "protons in aluminium",
      "neutrons in aluminium",
    ],
    answer: "Aluminium (Al) is a chemical element with atomic number 13, classified as a post-transition metal.\nAtomic Number: 13\nSymbol: Al\nProtons: 13\nElectrons: 13\nNeutrons: 14\nMass Number: 27\nStandard Atomic Weight: approximately 26.982"
  },
  {
    id: "silicon-explain",
    keywords: [
      "what is silicon",
      "explain silicon",
      "what is si",
      "explain si",
      "tell me about silicon",
      "silicon element",
      "atomic number of silicon",
      "protons in silicon",
      "neutrons in silicon",
    ],
    answer: "Silicon (Si) is a chemical element with atomic number 14, classified as a metalloid.\nAtomic Number: 14\nSymbol: Si\nProtons: 14\nElectrons: 14\nNeutrons: 14\nMass Number: 28\nStandard Atomic Weight: approximately 28.085"
  },
  {
    id: "phosphorus-explain",
    keywords: [
      "what is phosphorus",
      "explain phosphorus",
      "what is p",
      "explain p",
      "tell me about phosphorus",
      "phosphorus element",
      "atomic number of phosphorus",
      "protons in phosphorus",
      "neutrons in phosphorus",
    ],
    answer: "Phosphorus (P) is a chemical element with atomic number 15, classified as a nonmetal.\nAtomic Number: 15\nSymbol: P\nProtons: 15\nElectrons: 15\nNeutrons: 16\nMass Number: 31\nStandard Atomic Weight: approximately 30.974"
  },
  {
    id: "sulfur-explain",
    keywords: [
      "what is sulfur",
      "explain sulfur",
      "what is s",
      "explain s",
      "tell me about sulfur",
      "sulfur element",
      "atomic number of sulfur",
      "protons in sulfur",
      "neutrons in sulfur",
    ],
    answer: "Sulfur (S) is a chemical element with atomic number 16, classified as a nonmetal.\nAtomic Number: 16\nSymbol: S\nProtons: 16\nElectrons: 16\nNeutrons: 16\nMass Number: 32\nStandard Atomic Weight: approximately 32.06"
  },
  {
    id: "chlorine-explain",
    keywords: [
      "what is chlorine",
      "explain chlorine",
      "what is cl",
      "explain cl",
      "tell me about chlorine",
      "chlorine element",
      "atomic number of chlorine",
      "protons in chlorine",
      "neutrons in chlorine",
    ],
    answer: "Chlorine (Cl) is a chemical element with atomic number 17, classified as a halogen.\nAtomic Number: 17\nSymbol: Cl\nProtons: 17\nElectrons: 17\nNeutrons: 18\nMass Number: 35\nStandard Atomic Weight: approximately 35.45"
  },
  {
    id: "argon-explain",
    keywords: [
      "what is argon",
      "explain argon",
      "what is ar",
      "explain ar",
      "tell me about argon",
      "argon element",
      "atomic number of argon",
      "protons in argon",
      "neutrons in argon",
    ],
    answer: "Argon (Ar) is a chemical element with atomic number 18, classified as a noble gas.\nAtomic Number: 18\nSymbol: Ar\nProtons: 18\nElectrons: 18\nNeutrons: 22\nMass Number: 40\nStandard Atomic Weight: approximately 39.948"
  },
  {
    id: "potassium-explain",
    keywords: [
      "what is potassium",
      "explain potassium",
      "what is k",
      "explain k",
      "tell me about potassium",
      "potassium element",
      "atomic number of potassium",
      "protons in potassium",
      "neutrons in potassium",
    ],
    answer: "Potassium (K) is a chemical element with atomic number 19, classified as a alkali metal.\nAtomic Number: 19\nSymbol: K\nProtons: 19\nElectrons: 19\nNeutrons: 20\nMass Number: 39\nStandard Atomic Weight: approximately 39.098"
  },
  {
    id: "calcium-explain",
    keywords: [
      "what is calcium",
      "explain calcium",
      "what is ca",
      "explain ca",
      "tell me about calcium",
      "calcium element",
      "atomic number of calcium",
      "protons in calcium",
      "neutrons in calcium",
    ],
    answer: "Calcium (Ca) is a chemical element with atomic number 20, classified as a alkaline earth metal.\nAtomic Number: 20\nSymbol: Ca\nProtons: 20\nElectrons: 20\nNeutrons: 20\nMass Number: 40\nStandard Atomic Weight: approximately 40.078"
  },
  {
    id: "scandium-explain",
    keywords: [
      "what is scandium",
      "explain scandium",
      "what is sc",
      "explain sc",
      "tell me about scandium",
      "scandium element",
      "atomic number of scandium",
      "protons in scandium",
      "neutrons in scandium",
    ],
    answer: "Scandium (Sc) is a chemical element with atomic number 21, classified as a transition metal.\nAtomic Number: 21\nSymbol: Sc\nProtons: 21\nElectrons: 21\nNeutrons: 24\nMass Number: 45\nStandard Atomic Weight: approximately 44.956"
  },
  {
    id: "titanium-explain",
    keywords: [
      "what is titanium",
      "explain titanium",
      "what is ti",
      "explain ti",
      "tell me about titanium",
      "titanium element",
      "atomic number of titanium",
      "protons in titanium",
      "neutrons in titanium",
    ],
    answer: "Titanium (Ti) is a chemical element with atomic number 22, classified as a transition metal.\nAtomic Number: 22\nSymbol: Ti\nProtons: 22\nElectrons: 22\nNeutrons: 26\nMass Number: 48\nStandard Atomic Weight: approximately 47.867"
  },
  {
    id: "vanadium-explain",
    keywords: [
      "what is vanadium",
      "explain vanadium",
      "what is v",
      "explain v",
      "tell me about vanadium",
      "vanadium element",
      "atomic number of vanadium",
      "protons in vanadium",
      "neutrons in vanadium",
    ],
    answer: "Vanadium (V) is a chemical element with atomic number 23, classified as a transition metal.\nAtomic Number: 23\nSymbol: V\nProtons: 23\nElectrons: 23\nNeutrons: 28\nMass Number: 51\nStandard Atomic Weight: approximately 50.942"
  },
  {
    id: "chromium-explain",
    keywords: [
      "what is chromium",
      "explain chromium",
      "what is cr",
      "explain cr",
      "tell me about chromium",
      "chromium element",
      "atomic number of chromium",
      "protons in chromium",
      "neutrons in chromium",
    ],
    answer: "Chromium (Cr) is a chemical element with atomic number 24, classified as a transition metal.\nAtomic Number: 24\nSymbol: Cr\nProtons: 24\nElectrons: 24\nNeutrons: 28\nMass Number: 52\nStandard Atomic Weight: approximately 51.996"
  },
  {
    id: "manganese-explain",
    keywords: [
      "what is manganese",
      "explain manganese",
      "what is mn",
      "explain mn",
      "tell me about manganese",
      "manganese element",
      "atomic number of manganese",
      "protons in manganese",
      "neutrons in manganese",
    ],
    answer: "Manganese (Mn) is a chemical element with atomic number 25, classified as a transition metal.\nAtomic Number: 25\nSymbol: Mn\nProtons: 25\nElectrons: 25\nNeutrons: 30\nMass Number: 55\nStandard Atomic Weight: approximately 54.938"
  },
  {
    id: "iron-explain",
    keywords: [
      "what is iron",
      "explain iron",
      "what is fe",
      "explain fe",
      "tell me about iron",
      "iron element",
      "atomic number of iron",
      "protons in iron",
      "neutrons in iron",
    ],
    answer: "Iron (Fe) is a chemical element with atomic number 26, classified as a transition metal.\nAtomic Number: 26\nSymbol: Fe\nProtons: 26\nElectrons: 26\nNeutrons: 30\nMass Number: 56\nStandard Atomic Weight: approximately 55.845"
  },
  {
    id: "cobalt-explain",
    keywords: [
      "what is cobalt",
      "explain cobalt",
      "what is co",
      "explain co",
      "tell me about cobalt",
      "cobalt element",
      "atomic number of cobalt",
      "protons in cobalt",
      "neutrons in cobalt",
    ],
    answer: "Cobalt (Co) is a chemical element with atomic number 27, classified as a transition metal.\nAtomic Number: 27\nSymbol: Co\nProtons: 27\nElectrons: 27\nNeutrons: 32\nMass Number: 59\nStandard Atomic Weight: approximately 58.933"
  },
  {
    id: "nickel-explain",
    keywords: [
      "what is nickel",
      "explain nickel",
      "what is ni",
      "explain ni",
      "tell me about nickel",
      "nickel element",
      "atomic number of nickel",
      "protons in nickel",
      "neutrons in nickel",
    ],
    answer: "Nickel (Ni) is a chemical element with atomic number 28, classified as a transition metal.\nAtomic Number: 28\nSymbol: Ni\nProtons: 28\nElectrons: 28\nNeutrons: 31\nMass Number: 59\nStandard Atomic Weight: approximately 58.693"
  },
  {
    id: "copper-explain",
    keywords: [
      "what is copper",
      "explain copper",
      "what is cu",
      "explain cu",
      "tell me about copper",
      "copper element",
      "atomic number of copper",
      "protons in copper",
      "neutrons in copper",
    ],
    answer: "Copper (Cu) is a chemical element with atomic number 29, classified as a transition metal.\nAtomic Number: 29\nSymbol: Cu\nProtons: 29\nElectrons: 29\nNeutrons: 35\nMass Number: 64\nStandard Atomic Weight: approximately 63.546"
  },
  {
    id: "zinc-explain",
    keywords: [
      "what is zinc",
      "explain zinc",
      "what is zn",
      "explain zn",
      "tell me about zinc",
      "zinc element",
      "atomic number of zinc",
      "protons in zinc",
      "neutrons in zinc",
    ],
    answer: "Zinc (Zn) is a chemical element with atomic number 30, classified as a transition metal.\nAtomic Number: 30\nSymbol: Zn\nProtons: 30\nElectrons: 30\nNeutrons: 35\nMass Number: 65\nStandard Atomic Weight: approximately 65.38"
  },
  {
    id: "gallium-explain",
    keywords: [
      "what is gallium",
      "explain gallium",
      "what is ga",
      "explain ga",
      "tell me about gallium",
      "gallium element",
      "atomic number of gallium",
      "protons in gallium",
      "neutrons in gallium",
    ],
    answer: "Gallium (Ga) is a chemical element with atomic number 31, classified as a post-transition metal.\nAtomic Number: 31\nSymbol: Ga\nProtons: 31\nElectrons: 31\nNeutrons: 39\nMass Number: 70\nStandard Atomic Weight: approximately 69.723"
  },
  {
    id: "germanium-explain",
    keywords: [
      "what is germanium",
      "explain germanium",
      "what is ge",
      "explain ge",
      "tell me about germanium",
      "germanium element",
      "atomic number of germanium",
      "protons in germanium",
      "neutrons in germanium",
    ],
    answer: "Germanium (Ge) is a chemical element with atomic number 32, classified as a metalloid.\nAtomic Number: 32\nSymbol: Ge\nProtons: 32\nElectrons: 32\nNeutrons: 41\nMass Number: 73\nStandard Atomic Weight: approximately 72.63"
  },
  {
    id: "arsenic-explain",
    keywords: [
      "what is arsenic",
      "explain arsenic",
      "what is as",
      "explain as",
      "tell me about arsenic",
      "arsenic element",
      "atomic number of arsenic",
      "protons in arsenic",
      "neutrons in arsenic",
    ],
    answer: "Arsenic (As) is a chemical element with atomic number 33, classified as a metalloid.\nAtomic Number: 33\nSymbol: As\nProtons: 33\nElectrons: 33\nNeutrons: 42\nMass Number: 75\nStandard Atomic Weight: approximately 74.922"
  },
  {
    id: "selenium-explain",
    keywords: [
      "what is selenium",
      "explain selenium",
      "what is se",
      "explain se",
      "tell me about selenium",
      "selenium element",
      "atomic number of selenium",
      "protons in selenium",
      "neutrons in selenium",
    ],
    answer: "Selenium (Se) is a chemical element with atomic number 34, classified as a nonmetal.\nAtomic Number: 34\nSymbol: Se\nProtons: 34\nElectrons: 34\nNeutrons: 45\nMass Number: 79\nStandard Atomic Weight: approximately 78.971"
  },
  {
    id: "bromine-explain",
    keywords: [
      "what is bromine",
      "explain bromine",
      "what is br",
      "explain br",
      "tell me about bromine",
      "bromine element",
      "atomic number of bromine",
      "protons in bromine",
      "neutrons in bromine",
    ],
    answer: "Bromine (Br) is a chemical element with atomic number 35, classified as a halogen.\nAtomic Number: 35\nSymbol: Br\nProtons: 35\nElectrons: 35\nNeutrons: 45\nMass Number: 80\nStandard Atomic Weight: approximately 79.904"
  },
  {
    id: "krypton-explain",
    keywords: [
      "what is krypton",
      "explain krypton",
      "what is kr",
      "explain kr",
      "tell me about krypton",
      "krypton element",
      "atomic number of krypton",
      "protons in krypton",
      "neutrons in krypton",
    ],
    answer: "Krypton (Kr) is a chemical element with atomic number 36, classified as a noble gas.\nAtomic Number: 36\nSymbol: Kr\nProtons: 36\nElectrons: 36\nNeutrons: 48\nMass Number: 84\nStandard Atomic Weight: approximately 83.798"
  },
  {
    id: "rubidium-explain",
    keywords: [
      "what is rubidium",
      "explain rubidium",
      "what is rb",
      "explain rb",
      "tell me about rubidium",
      "rubidium element",
      "atomic number of rubidium",
      "protons in rubidium",
      "neutrons in rubidium",
    ],
    answer: "Rubidium (Rb) is a chemical element with atomic number 37, classified as a alkali metal.\nAtomic Number: 37\nSymbol: Rb\nProtons: 37\nElectrons: 37\nNeutrons: 48\nMass Number: 85\nStandard Atomic Weight: approximately 85.468"
  },
  {
    id: "strontium-explain",
    keywords: [
      "what is strontium",
      "explain strontium",
      "what is sr",
      "explain sr",
      "tell me about strontium",
      "strontium element",
      "atomic number of strontium",
      "protons in strontium",
      "neutrons in strontium",
    ],
    answer: "Strontium (Sr) is a chemical element with atomic number 38, classified as a alkaline earth metal.\nAtomic Number: 38\nSymbol: Sr\nProtons: 38\nElectrons: 38\nNeutrons: 50\nMass Number: 88\nStandard Atomic Weight: approximately 87.62"
  },
  {
    id: "yttrium-explain",
    keywords: [
      "what is yttrium",
      "explain yttrium",
      "what is y",
      "explain y",
      "tell me about yttrium",
      "yttrium element",
      "atomic number of yttrium",
      "protons in yttrium",
      "neutrons in yttrium",
    ],
    answer: "Yttrium (Y) is a chemical element with atomic number 39, classified as a transition metal.\nAtomic Number: 39\nSymbol: Y\nProtons: 39\nElectrons: 39\nNeutrons: 50\nMass Number: 89\nStandard Atomic Weight: approximately 88.906"
  },
  {
    id: "zirconium-explain",
    keywords: [
      "what is zirconium",
      "explain zirconium",
      "what is zr",
      "explain zr",
      "tell me about zirconium",
      "zirconium element",
      "atomic number of zirconium",
      "protons in zirconium",
      "neutrons in zirconium",
    ],
    answer: "Zirconium (Zr) is a chemical element with atomic number 40, classified as a transition metal.\nAtomic Number: 40\nSymbol: Zr\nProtons: 40\nElectrons: 40\nNeutrons: 51\nMass Number: 91\nStandard Atomic Weight: approximately 91.224"
  },
  {
    id: "niobium-explain",
    keywords: [
      "what is niobium",
      "explain niobium",
      "what is nb",
      "explain nb",
      "tell me about niobium",
      "niobium element",
      "atomic number of niobium",
      "protons in niobium",
      "neutrons in niobium",
    ],
    answer: "Niobium (Nb) is a chemical element with atomic number 41, classified as a transition metal.\nAtomic Number: 41\nSymbol: Nb\nProtons: 41\nElectrons: 41\nNeutrons: 52\nMass Number: 93\nStandard Atomic Weight: approximately 92.906"
  },
  {
    id: "molybdenum-explain",
    keywords: [
      "what is molybdenum",
      "explain molybdenum",
      "what is mo",
      "explain mo",
      "tell me about molybdenum",
      "molybdenum element",
      "atomic number of molybdenum",
      "protons in molybdenum",
      "neutrons in molybdenum",
    ],
    answer: "Molybdenum (Mo) is a chemical element with atomic number 42, classified as a transition metal.\nAtomic Number: 42\nSymbol: Mo\nProtons: 42\nElectrons: 42\nNeutrons: 54\nMass Number: 96\nStandard Atomic Weight: approximately 95.95"
  },
  {
    id: "technetium-explain",
    keywords: [
      "what is technetium",
      "explain technetium",
      "what is tc",
      "explain tc",
      "tell me about technetium",
      "technetium element",
      "atomic number of technetium",
      "protons in technetium",
      "neutrons in technetium",
    ],
    answer: "Technetium (Tc) is a chemical element with atomic number 43, classified as a transition metal.\nAtomic Number: 43\nSymbol: Tc\nProtons: 43\nElectrons: 43\nNeutrons: 55\nMass Number: 98\nStandard Atomic Weight: approximately 98\nNote: Technetium has no stable isotopes; the mass number 98 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "ruthenium-explain",
    keywords: [
      "what is ruthenium",
      "explain ruthenium",
      "what is ru",
      "explain ru",
      "tell me about ruthenium",
      "ruthenium element",
      "atomic number of ruthenium",
      "protons in ruthenium",
      "neutrons in ruthenium",
    ],
    answer: "Ruthenium (Ru) is a chemical element with atomic number 44, classified as a transition metal.\nAtomic Number: 44\nSymbol: Ru\nProtons: 44\nElectrons: 44\nNeutrons: 57\nMass Number: 101\nStandard Atomic Weight: approximately 101.07"
  },
  {
    id: "rhodium-explain",
    keywords: [
      "what is rhodium",
      "explain rhodium",
      "what is rh",
      "explain rh",
      "tell me about rhodium",
      "rhodium element",
      "atomic number of rhodium",
      "protons in rhodium",
      "neutrons in rhodium",
    ],
    answer: "Rhodium (Rh) is a chemical element with atomic number 45, classified as a transition metal.\nAtomic Number: 45\nSymbol: Rh\nProtons: 45\nElectrons: 45\nNeutrons: 58\nMass Number: 103\nStandard Atomic Weight: approximately 102.906"
  },
  {
    id: "palladium-explain",
    keywords: [
      "what is palladium",
      "explain palladium",
      "what is pd",
      "explain pd",
      "tell me about palladium",
      "palladium element",
      "atomic number of palladium",
      "protons in palladium",
      "neutrons in palladium",
    ],
    answer: "Palladium (Pd) is a chemical element with atomic number 46, classified as a transition metal.\nAtomic Number: 46\nSymbol: Pd\nProtons: 46\nElectrons: 46\nNeutrons: 60\nMass Number: 106\nStandard Atomic Weight: approximately 106.42"
  },
  {
    id: "silver-explain",
    keywords: [
      "what is silver",
      "explain silver",
      "what is ag",
      "explain ag",
      "tell me about silver",
      "silver element",
      "atomic number of silver",
      "protons in silver",
      "neutrons in silver",
    ],
    answer: "Silver (Ag) is a chemical element with atomic number 47, classified as a transition metal.\nAtomic Number: 47\nSymbol: Ag\nProtons: 47\nElectrons: 47\nNeutrons: 61\nMass Number: 108\nStandard Atomic Weight: approximately 107.868"
  },
  {
    id: "cadmium-explain",
    keywords: [
      "what is cadmium",
      "explain cadmium",
      "what is cd",
      "explain cd",
      "tell me about cadmium",
      "cadmium element",
      "atomic number of cadmium",
      "protons in cadmium",
      "neutrons in cadmium",
    ],
    answer: "Cadmium (Cd) is a chemical element with atomic number 48, classified as a transition metal.\nAtomic Number: 48\nSymbol: Cd\nProtons: 48\nElectrons: 48\nNeutrons: 64\nMass Number: 112\nStandard Atomic Weight: approximately 112.414"
  },
  {
    id: "indium-explain",
    keywords: [
      "what is indium",
      "explain indium",
      "what is in",
      "explain in",
      "tell me about indium",
      "indium element",
      "atomic number of indium",
      "protons in indium",
      "neutrons in indium",
    ],
    answer: "Indium (In) is a chemical element with atomic number 49, classified as a post-transition metal.\nAtomic Number: 49\nSymbol: In\nProtons: 49\nElectrons: 49\nNeutrons: 66\nMass Number: 115\nStandard Atomic Weight: approximately 114.818"
  },
  {
    id: "tin-explain",
    keywords: [
      "what is tin",
      "explain tin",
      "what is sn",
      "explain sn",
      "tell me about tin",
      "tin element",
      "atomic number of tin",
      "protons in tin",
      "neutrons in tin",
    ],
    answer: "Tin (Sn) is a chemical element with atomic number 50, classified as a post-transition metal.\nAtomic Number: 50\nSymbol: Sn\nProtons: 50\nElectrons: 50\nNeutrons: 69\nMass Number: 119\nStandard Atomic Weight: approximately 118.71"
  },
  {
    id: "antimony-explain",
    keywords: [
      "what is antimony",
      "explain antimony",
      "what is sb",
      "explain sb",
      "tell me about antimony",
      "antimony element",
      "atomic number of antimony",
      "protons in antimony",
      "neutrons in antimony",
    ],
    answer: "Antimony (Sb) is a chemical element with atomic number 51, classified as a metalloid.\nAtomic Number: 51\nSymbol: Sb\nProtons: 51\nElectrons: 51\nNeutrons: 71\nMass Number: 122\nStandard Atomic Weight: approximately 121.76"
  },
  {
    id: "tellurium-explain",
    keywords: [
      "what is tellurium",
      "explain tellurium",
      "what is te",
      "explain te",
      "tell me about tellurium",
      "tellurium element",
      "atomic number of tellurium",
      "protons in tellurium",
      "neutrons in tellurium",
    ],
    answer: "Tellurium (Te) is a chemical element with atomic number 52, classified as a metalloid.\nAtomic Number: 52\nSymbol: Te\nProtons: 52\nElectrons: 52\nNeutrons: 76\nMass Number: 128\nStandard Atomic Weight: approximately 127.6"
  },
  {
    id: "iodine-explain",
    keywords: [
      "what is iodine",
      "explain iodine",
      "what is i",
      "explain i",
      "tell me about iodine",
      "iodine element",
      "atomic number of iodine",
      "protons in iodine",
      "neutrons in iodine",
    ],
    answer: "Iodine (I) is a chemical element with atomic number 53, classified as a halogen.\nAtomic Number: 53\nSymbol: I\nProtons: 53\nElectrons: 53\nNeutrons: 74\nMass Number: 127\nStandard Atomic Weight: approximately 126.904"
  },
  {
    id: "xenon-explain",
    keywords: [
      "what is xenon",
      "explain xenon",
      "what is xe",
      "explain xe",
      "tell me about xenon",
      "xenon element",
      "atomic number of xenon",
      "protons in xenon",
      "neutrons in xenon",
    ],
    answer: "Xenon (Xe) is a chemical element with atomic number 54, classified as a noble gas.\nAtomic Number: 54\nSymbol: Xe\nProtons: 54\nElectrons: 54\nNeutrons: 77\nMass Number: 131\nStandard Atomic Weight: approximately 131.293"
  },
  {
    id: "caesium-explain",
    keywords: [
      "what is caesium",
      "explain caesium",
      "what is cs",
      "explain cs",
      "tell me about caesium",
      "caesium element",
      "atomic number of caesium",
      "protons in caesium",
      "neutrons in caesium",
    ],
    answer: "Caesium (Cs) is a chemical element with atomic number 55, classified as a alkali metal.\nAtomic Number: 55\nSymbol: Cs\nProtons: 55\nElectrons: 55\nNeutrons: 78\nMass Number: 133\nStandard Atomic Weight: approximately 132.905"
  },
  {
    id: "barium-explain",
    keywords: [
      "what is barium",
      "explain barium",
      "what is ba",
      "explain ba",
      "tell me about barium",
      "barium element",
      "atomic number of barium",
      "protons in barium",
      "neutrons in barium",
    ],
    answer: "Barium (Ba) is a chemical element with atomic number 56, classified as a alkaline earth metal.\nAtomic Number: 56\nSymbol: Ba\nProtons: 56\nElectrons: 56\nNeutrons: 81\nMass Number: 137\nStandard Atomic Weight: approximately 137.327"
  },
  {
    id: "lanthanum-explain",
    keywords: [
      "what is lanthanum",
      "explain lanthanum",
      "what is la",
      "explain la",
      "tell me about lanthanum",
      "lanthanum element",
      "atomic number of lanthanum",
      "protons in lanthanum",
      "neutrons in lanthanum",
    ],
    answer: "Lanthanum (La) is a chemical element with atomic number 57, classified as a lanthanide.\nAtomic Number: 57\nSymbol: La\nProtons: 57\nElectrons: 57\nNeutrons: 82\nMass Number: 139\nStandard Atomic Weight: approximately 138.905"
  },
  {
    id: "cerium-explain",
    keywords: [
      "what is cerium",
      "explain cerium",
      "what is ce",
      "explain ce",
      "tell me about cerium",
      "cerium element",
      "atomic number of cerium",
      "protons in cerium",
      "neutrons in cerium",
    ],
    answer: "Cerium (Ce) is a chemical element with atomic number 58, classified as a lanthanide.\nAtomic Number: 58\nSymbol: Ce\nProtons: 58\nElectrons: 58\nNeutrons: 82\nMass Number: 140\nStandard Atomic Weight: approximately 140.116"
  },
  {
    id: "praseodymium-explain",
    keywords: [
      "what is praseodymium",
      "explain praseodymium",
      "what is pr",
      "explain pr",
      "tell me about praseodymium",
      "praseodymium element",
      "atomic number of praseodymium",
      "protons in praseodymium",
      "neutrons in praseodymium",
    ],
    answer: "Praseodymium (Pr) is a chemical element with atomic number 59, classified as a lanthanide.\nAtomic Number: 59\nSymbol: Pr\nProtons: 59\nElectrons: 59\nNeutrons: 82\nMass Number: 141\nStandard Atomic Weight: approximately 140.908"
  },
  {
    id: "neodymium-explain",
    keywords: [
      "what is neodymium",
      "explain neodymium",
      "what is nd",
      "explain nd",
      "tell me about neodymium",
      "neodymium element",
      "atomic number of neodymium",
      "protons in neodymium",
      "neutrons in neodymium",
    ],
    answer: "Neodymium (Nd) is a chemical element with atomic number 60, classified as a lanthanide.\nAtomic Number: 60\nSymbol: Nd\nProtons: 60\nElectrons: 60\nNeutrons: 84\nMass Number: 144\nStandard Atomic Weight: approximately 144.242"
  },
  {
    id: "promethium-explain",
    keywords: [
      "what is promethium",
      "explain promethium",
      "what is pm",
      "explain pm",
      "tell me about promethium",
      "promethium element",
      "atomic number of promethium",
      "protons in promethium",
      "neutrons in promethium",
    ],
    answer: "Promethium (Pm) is a chemical element with atomic number 61, classified as a lanthanide.\nAtomic Number: 61\nSymbol: Pm\nProtons: 61\nElectrons: 61\nNeutrons: 84\nMass Number: 145\nStandard Atomic Weight: approximately 145\nNote: Promethium has no stable isotopes; the mass number 145 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "samarium-explain",
    keywords: [
      "what is samarium",
      "explain samarium",
      "what is sm",
      "explain sm",
      "tell me about samarium",
      "samarium element",
      "atomic number of samarium",
      "protons in samarium",
      "neutrons in samarium",
    ],
    answer: "Samarium (Sm) is a chemical element with atomic number 62, classified as a lanthanide.\nAtomic Number: 62\nSymbol: Sm\nProtons: 62\nElectrons: 62\nNeutrons: 88\nMass Number: 150\nStandard Atomic Weight: approximately 150.36"
  },
  {
    id: "europium-explain",
    keywords: [
      "what is europium",
      "explain europium",
      "what is eu",
      "explain eu",
      "tell me about europium",
      "europium element",
      "atomic number of europium",
      "protons in europium",
      "neutrons in europium",
    ],
    answer: "Europium (Eu) is a chemical element with atomic number 63, classified as a lanthanide.\nAtomic Number: 63\nSymbol: Eu\nProtons: 63\nElectrons: 63\nNeutrons: 89\nMass Number: 152\nStandard Atomic Weight: approximately 151.964"
  },
  {
    id: "gadolinium-explain",
    keywords: [
      "what is gadolinium",
      "explain gadolinium",
      "what is gd",
      "explain gd",
      "tell me about gadolinium",
      "gadolinium element",
      "atomic number of gadolinium",
      "protons in gadolinium",
      "neutrons in gadolinium",
    ],
    answer: "Gadolinium (Gd) is a chemical element with atomic number 64, classified as a lanthanide.\nAtomic Number: 64\nSymbol: Gd\nProtons: 64\nElectrons: 64\nNeutrons: 93\nMass Number: 157\nStandard Atomic Weight: approximately 157.25"
  },
  {
    id: "terbium-explain",
    keywords: [
      "what is terbium",
      "explain terbium",
      "what is tb",
      "explain tb",
      "tell me about terbium",
      "terbium element",
      "atomic number of terbium",
      "protons in terbium",
      "neutrons in terbium",
    ],
    answer: "Terbium (Tb) is a chemical element with atomic number 65, classified as a lanthanide.\nAtomic Number: 65\nSymbol: Tb\nProtons: 65\nElectrons: 65\nNeutrons: 94\nMass Number: 159\nStandard Atomic Weight: approximately 158.925"
  },
  {
    id: "dysprosium-explain",
    keywords: [
      "what is dysprosium",
      "explain dysprosium",
      "what is dy",
      "explain dy",
      "tell me about dysprosium",
      "dysprosium element",
      "atomic number of dysprosium",
      "protons in dysprosium",
      "neutrons in dysprosium",
    ],
    answer: "Dysprosium (Dy) is a chemical element with atomic number 66, classified as a lanthanide.\nAtomic Number: 66\nSymbol: Dy\nProtons: 66\nElectrons: 66\nNeutrons: 96\nMass Number: 162\nStandard Atomic Weight: approximately 162.5"
  },
  {
    id: "holmium-explain",
    keywords: [
      "what is holmium",
      "explain holmium",
      "what is ho",
      "explain ho",
      "tell me about holmium",
      "holmium element",
      "atomic number of holmium",
      "protons in holmium",
      "neutrons in holmium",
    ],
    answer: "Holmium (Ho) is a chemical element with atomic number 67, classified as a lanthanide.\nAtomic Number: 67\nSymbol: Ho\nProtons: 67\nElectrons: 67\nNeutrons: 98\nMass Number: 165\nStandard Atomic Weight: approximately 164.93"
  },
  {
    id: "erbium-explain",
    keywords: [
      "what is erbium",
      "explain erbium",
      "what is er",
      "explain er",
      "tell me about erbium",
      "erbium element",
      "atomic number of erbium",
      "protons in erbium",
      "neutrons in erbium",
    ],
    answer: "Erbium (Er) is a chemical element with atomic number 68, classified as a lanthanide.\nAtomic Number: 68\nSymbol: Er\nProtons: 68\nElectrons: 68\nNeutrons: 99\nMass Number: 167\nStandard Atomic Weight: approximately 167.259"
  },
  {
    id: "thulium-explain",
    keywords: [
      "what is thulium",
      "explain thulium",
      "what is tm",
      "explain tm",
      "tell me about thulium",
      "thulium element",
      "atomic number of thulium",
      "protons in thulium",
      "neutrons in thulium",
    ],
    answer: "Thulium (Tm) is a chemical element with atomic number 69, classified as a lanthanide.\nAtomic Number: 69\nSymbol: Tm\nProtons: 69\nElectrons: 69\nNeutrons: 100\nMass Number: 169\nStandard Atomic Weight: approximately 168.934"
  },
  {
    id: "ytterbium-explain",
    keywords: [
      "what is ytterbium",
      "explain ytterbium",
      "what is yb",
      "explain yb",
      "tell me about ytterbium",
      "ytterbium element",
      "atomic number of ytterbium",
      "protons in ytterbium",
      "neutrons in ytterbium",
    ],
    answer: "Ytterbium (Yb) is a chemical element with atomic number 70, classified as a lanthanide.\nAtomic Number: 70\nSymbol: Yb\nProtons: 70\nElectrons: 70\nNeutrons: 103\nMass Number: 173\nStandard Atomic Weight: approximately 173.045"
  },
  {
    id: "lutetium-explain",
    keywords: [
      "what is lutetium",
      "explain lutetium",
      "what is lu",
      "explain lu",
      "tell me about lutetium",
      "lutetium element",
      "atomic number of lutetium",
      "protons in lutetium",
      "neutrons in lutetium",
    ],
    answer: "Lutetium (Lu) is a chemical element with atomic number 71, classified as a lanthanide.\nAtomic Number: 71\nSymbol: Lu\nProtons: 71\nElectrons: 71\nNeutrons: 104\nMass Number: 175\nStandard Atomic Weight: approximately 174.967"
  },
  {
    id: "hafnium-explain",
    keywords: [
      "what is hafnium",
      "explain hafnium",
      "what is hf",
      "explain hf",
      "tell me about hafnium",
      "hafnium element",
      "atomic number of hafnium",
      "protons in hafnium",
      "neutrons in hafnium",
    ],
    answer: "Hafnium (Hf) is a chemical element with atomic number 72, classified as a transition metal.\nAtomic Number: 72\nSymbol: Hf\nProtons: 72\nElectrons: 72\nNeutrons: 106\nMass Number: 178\nStandard Atomic Weight: approximately 178.49"
  },
  {
    id: "tantalum-explain",
    keywords: [
      "what is tantalum",
      "explain tantalum",
      "what is ta",
      "explain ta",
      "tell me about tantalum",
      "tantalum element",
      "atomic number of tantalum",
      "protons in tantalum",
      "neutrons in tantalum",
    ],
    answer: "Tantalum (Ta) is a chemical element with atomic number 73, classified as a transition metal.\nAtomic Number: 73\nSymbol: Ta\nProtons: 73\nElectrons: 73\nNeutrons: 108\nMass Number: 181\nStandard Atomic Weight: approximately 180.948"
  },
  {
    id: "tungsten-explain",
    keywords: [
      "what is tungsten",
      "explain tungsten",
      "what is w",
      "explain w",
      "tell me about tungsten",
      "tungsten element",
      "atomic number of tungsten",
      "protons in tungsten",
      "neutrons in tungsten",
    ],
    answer: "Tungsten (W) is a chemical element with atomic number 74, classified as a transition metal.\nAtomic Number: 74\nSymbol: W\nProtons: 74\nElectrons: 74\nNeutrons: 110\nMass Number: 184\nStandard Atomic Weight: approximately 183.84"
  },
  {
    id: "rhenium-explain",
    keywords: [
      "what is rhenium",
      "explain rhenium",
      "what is re",
      "explain re",
      "tell me about rhenium",
      "rhenium element",
      "atomic number of rhenium",
      "protons in rhenium",
      "neutrons in rhenium",
    ],
    answer: "Rhenium (Re) is a chemical element with atomic number 75, classified as a transition metal.\nAtomic Number: 75\nSymbol: Re\nProtons: 75\nElectrons: 75\nNeutrons: 111\nMass Number: 186\nStandard Atomic Weight: approximately 186.207"
  },
  {
    id: "osmium-explain",
    keywords: [
      "what is osmium",
      "explain osmium",
      "what is os",
      "explain os",
      "tell me about osmium",
      "osmium element",
      "atomic number of osmium",
      "protons in osmium",
      "neutrons in osmium",
    ],
    answer: "Osmium (Os) is a chemical element with atomic number 76, classified as a transition metal.\nAtomic Number: 76\nSymbol: Os\nProtons: 76\nElectrons: 76\nNeutrons: 114\nMass Number: 190\nStandard Atomic Weight: approximately 190.23"
  },
  {
    id: "iridium-explain",
    keywords: [
      "what is iridium",
      "explain iridium",
      "what is ir",
      "explain ir",
      "tell me about iridium",
      "iridium element",
      "atomic number of iridium",
      "protons in iridium",
      "neutrons in iridium",
    ],
    answer: "Iridium (Ir) is a chemical element with atomic number 77, classified as a transition metal.\nAtomic Number: 77\nSymbol: Ir\nProtons: 77\nElectrons: 77\nNeutrons: 115\nMass Number: 192\nStandard Atomic Weight: approximately 192.217"
  },
  {
    id: "platinum-explain",
    keywords: [
      "what is platinum",
      "explain platinum",
      "what is pt",
      "explain pt",
      "tell me about platinum",
      "platinum element",
      "atomic number of platinum",
      "protons in platinum",
      "neutrons in platinum",
    ],
    answer: "Platinum (Pt) is a chemical element with atomic number 78, classified as a transition metal.\nAtomic Number: 78\nSymbol: Pt\nProtons: 78\nElectrons: 78\nNeutrons: 117\nMass Number: 195\nStandard Atomic Weight: approximately 195.084"
  },
  {
    id: "gold-explain",
    keywords: [
      "what is gold",
      "explain gold",
      "what is au",
      "explain au",
      "tell me about gold",
      "gold element",
      "atomic number of gold",
      "protons in gold",
      "neutrons in gold",
    ],
    answer: "Gold (Au) is a chemical element with atomic number 79, classified as a transition metal.\nAtomic Number: 79\nSymbol: Au\nProtons: 79\nElectrons: 79\nNeutrons: 118\nMass Number: 197\nStandard Atomic Weight: approximately 196.967"
  },
  {
    id: "mercury-explain",
    keywords: [
      "what is mercury",
      "explain mercury",
      "what is hg",
      "explain hg",
      "tell me about mercury",
      "mercury element",
      "atomic number of mercury",
      "protons in mercury",
      "neutrons in mercury",
    ],
    answer: "Mercury (Hg) is a chemical element with atomic number 80, classified as a transition metal.\nAtomic Number: 80\nSymbol: Hg\nProtons: 80\nElectrons: 80\nNeutrons: 121\nMass Number: 201\nStandard Atomic Weight: approximately 200.592"
  },
  {
    id: "thallium-explain",
    keywords: [
      "what is thallium",
      "explain thallium",
      "what is tl",
      "explain tl",
      "tell me about thallium",
      "thallium element",
      "atomic number of thallium",
      "protons in thallium",
      "neutrons in thallium",
    ],
    answer: "Thallium (Tl) is a chemical element with atomic number 81, classified as a post-transition metal.\nAtomic Number: 81\nSymbol: Tl\nProtons: 81\nElectrons: 81\nNeutrons: 123\nMass Number: 204\nStandard Atomic Weight: approximately 204.38"
  },
  {
    id: "lead-explain",
    keywords: [
      "what is lead",
      "explain lead",
      "what is pb",
      "explain pb",
      "tell me about lead",
      "lead element",
      "atomic number of lead",
      "protons in lead",
      "neutrons in lead",
    ],
    answer: "Lead (Pb) is a chemical element with atomic number 82, classified as a post-transition metal.\nAtomic Number: 82\nSymbol: Pb\nProtons: 82\nElectrons: 82\nNeutrons: 125\nMass Number: 207\nStandard Atomic Weight: approximately 207.2"
  },
  {
    id: "bismuth-explain",
    keywords: [
      "what is bismuth",
      "explain bismuth",
      "what is bi",
      "explain bi",
      "tell me about bismuth",
      "bismuth element",
      "atomic number of bismuth",
      "protons in bismuth",
      "neutrons in bismuth",
    ],
    answer: "Bismuth (Bi) is a chemical element with atomic number 83, classified as a post-transition metal.\nAtomic Number: 83\nSymbol: Bi\nProtons: 83\nElectrons: 83\nNeutrons: 126\nMass Number: 209\nStandard Atomic Weight: approximately 208.98"
  },
  {
    id: "polonium-explain",
    keywords: [
      "what is polonium",
      "explain polonium",
      "what is po",
      "explain po",
      "tell me about polonium",
      "polonium element",
      "atomic number of polonium",
      "protons in polonium",
      "neutrons in polonium",
    ],
    answer: "Polonium (Po) is a chemical element with atomic number 84, classified as a post-transition metal.\nAtomic Number: 84\nSymbol: Po\nProtons: 84\nElectrons: 84\nNeutrons: 125\nMass Number: 209\nStandard Atomic Weight: approximately 209\nNote: Polonium has no stable isotopes; the mass number 209 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "astatine-explain",
    keywords: [
      "what is astatine",
      "explain astatine",
      "what is at",
      "explain at",
      "tell me about astatine",
      "astatine element",
      "atomic number of astatine",
      "protons in astatine",
      "neutrons in astatine",
    ],
    answer: "Astatine (At) is a chemical element with atomic number 85, classified as a metalloid.\nAtomic Number: 85\nSymbol: At\nProtons: 85\nElectrons: 85\nNeutrons: 125\nMass Number: 210\nStandard Atomic Weight: approximately 210\nNote: Astatine has no stable isotopes; the mass number 210 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "radon-explain",
    keywords: [
      "what is radon",
      "explain radon",
      "what is rn",
      "explain rn",
      "tell me about radon",
      "radon element",
      "atomic number of radon",
      "protons in radon",
      "neutrons in radon",
    ],
    answer: "Radon (Rn) is a chemical element with atomic number 86, classified as a noble gas.\nAtomic Number: 86\nSymbol: Rn\nProtons: 86\nElectrons: 86\nNeutrons: 136\nMass Number: 222\nStandard Atomic Weight: approximately 222\nNote: Radon has no stable isotopes; the mass number 222 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "francium-explain",
    keywords: [
      "what is francium",
      "explain francium",
      "what is fr",
      "explain fr",
      "tell me about francium",
      "francium element",
      "atomic number of francium",
      "protons in francium",
      "neutrons in francium",
    ],
    answer: "Francium (Fr) is a chemical element with atomic number 87, classified as a alkali metal.\nAtomic Number: 87\nSymbol: Fr\nProtons: 87\nElectrons: 87\nNeutrons: 136\nMass Number: 223\nStandard Atomic Weight: approximately 223\nNote: Francium has no stable isotopes; the mass number 223 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "radium-explain",
    keywords: [
      "what is radium",
      "explain radium",
      "what is ra",
      "explain ra",
      "tell me about radium",
      "radium element",
      "atomic number of radium",
      "protons in radium",
      "neutrons in radium",
    ],
    answer: "Radium (Ra) is a chemical element with atomic number 88, classified as a alkaline earth metal.\nAtomic Number: 88\nSymbol: Ra\nProtons: 88\nElectrons: 88\nNeutrons: 138\nMass Number: 226\nStandard Atomic Weight: approximately 226\nNote: Radium has no stable isotopes; the mass number 226 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "actinium-explain",
    keywords: [
      "what is actinium",
      "explain actinium",
      "what is ac",
      "explain ac",
      "tell me about actinium",
      "actinium element",
      "atomic number of actinium",
      "protons in actinium",
      "neutrons in actinium",
    ],
    answer: "Actinium (Ac) is a chemical element with atomic number 89, classified as a actinide.\nAtomic Number: 89\nSymbol: Ac\nProtons: 89\nElectrons: 89\nNeutrons: 138\nMass Number: 227\nStandard Atomic Weight: approximately 227\nNote: Actinium has no stable isotopes; the mass number 227 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "thorium-explain",
    keywords: [
      "what is thorium",
      "explain thorium",
      "what is th",
      "explain th",
      "tell me about thorium",
      "thorium element",
      "atomic number of thorium",
      "protons in thorium",
      "neutrons in thorium",
    ],
    answer: "Thorium (Th) is a chemical element with atomic number 90, classified as a actinide.\nAtomic Number: 90\nSymbol: Th\nProtons: 90\nElectrons: 90\nNeutrons: 142\nMass Number: 232\nStandard Atomic Weight: approximately 232.038"
  },
  {
    id: "protactinium-explain",
    keywords: [
      "what is protactinium",
      "explain protactinium",
      "what is pa",
      "explain pa",
      "tell me about protactinium",
      "protactinium element",
      "atomic number of protactinium",
      "protons in protactinium",
      "neutrons in protactinium",
    ],
    answer: "Protactinium (Pa) is a chemical element with atomic number 91, classified as a actinide.\nAtomic Number: 91\nSymbol: Pa\nProtons: 91\nElectrons: 91\nNeutrons: 140\nMass Number: 231\nStandard Atomic Weight: approximately 231.036"
  },
  {
    id: "uranium-explain",
    keywords: [
      "what is uranium",
      "explain uranium",
      "what is u",
      "explain u",
      "tell me about uranium",
      "uranium element",
      "atomic number of uranium",
      "protons in uranium",
      "neutrons in uranium",
    ],
    answer: "Uranium (U) is a chemical element with atomic number 92, classified as a actinide.\nAtomic Number: 92\nSymbol: U\nProtons: 92\nElectrons: 92\nNeutrons: 146\nMass Number: 238\nStandard Atomic Weight: approximately 238.029"
  },
  {
    id: "neptunium-explain",
    keywords: [
      "what is neptunium",
      "explain neptunium",
      "what is np",
      "explain np",
      "tell me about neptunium",
      "neptunium element",
      "atomic number of neptunium",
      "protons in neptunium",
      "neutrons in neptunium",
    ],
    answer: "Neptunium (Np) is a chemical element with atomic number 93, classified as a actinide.\nAtomic Number: 93\nSymbol: Np\nProtons: 93\nElectrons: 93\nNeutrons: 144\nMass Number: 237\nStandard Atomic Weight: approximately 237\nNote: Neptunium has no stable isotopes; the mass number 237 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "plutonium-explain",
    keywords: [
      "what is plutonium",
      "explain plutonium",
      "what is pu",
      "explain pu",
      "tell me about plutonium",
      "plutonium element",
      "atomic number of plutonium",
      "protons in plutonium",
      "neutrons in plutonium",
    ],
    answer: "Plutonium (Pu) is a chemical element with atomic number 94, classified as a actinide.\nAtomic Number: 94\nSymbol: Pu\nProtons: 94\nElectrons: 94\nNeutrons: 150\nMass Number: 244\nStandard Atomic Weight: approximately 244\nNote: Plutonium has no stable isotopes; the mass number 244 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "americium-explain",
    keywords: [
      "what is americium",
      "explain americium",
      "what is am",
      "explain am",
      "tell me about americium",
      "americium element",
      "atomic number of americium",
      "protons in americium",
      "neutrons in americium",
    ],
    answer: "Americium (Am) is a chemical element with atomic number 95, classified as a actinide.\nAtomic Number: 95\nSymbol: Am\nProtons: 95\nElectrons: 95\nNeutrons: 148\nMass Number: 243\nStandard Atomic Weight: approximately 243\nNote: Americium has no stable isotopes; the mass number 243 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "curium-explain",
    keywords: [
      "what is curium",
      "explain curium",
      "what is cm",
      "explain cm",
      "tell me about curium",
      "curium element",
      "atomic number of curium",
      "protons in curium",
      "neutrons in curium",
    ],
    answer: "Curium (Cm) is a chemical element with atomic number 96, classified as a actinide.\nAtomic Number: 96\nSymbol: Cm\nProtons: 96\nElectrons: 96\nNeutrons: 151\nMass Number: 247\nStandard Atomic Weight: approximately 247\nNote: Curium has no stable isotopes; the mass number 247 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "berkelium-explain",
    keywords: [
      "what is berkelium",
      "explain berkelium",
      "what is bk",
      "explain bk",
      "tell me about berkelium",
      "berkelium element",
      "atomic number of berkelium",
      "protons in berkelium",
      "neutrons in berkelium",
    ],
    answer: "Berkelium (Bk) is a chemical element with atomic number 97, classified as a actinide.\nAtomic Number: 97\nSymbol: Bk\nProtons: 97\nElectrons: 97\nNeutrons: 150\nMass Number: 247\nStandard Atomic Weight: approximately 247\nNote: Berkelium has no stable isotopes; the mass number 247 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "californium-explain",
    keywords: [
      "what is californium",
      "explain californium",
      "what is cf",
      "explain cf",
      "tell me about californium",
      "californium element",
      "atomic number of californium",
      "protons in californium",
      "neutrons in californium",
    ],
    answer: "Californium (Cf) is a chemical element with atomic number 98, classified as a actinide.\nAtomic Number: 98\nSymbol: Cf\nProtons: 98\nElectrons: 98\nNeutrons: 153\nMass Number: 251\nStandard Atomic Weight: approximately 251\nNote: Californium has no stable isotopes; the mass number 251 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "einsteinium-explain",
    keywords: [
      "what is einsteinium",
      "explain einsteinium",
      "what is es",
      "explain es",
      "tell me about einsteinium",
      "einsteinium element",
      "atomic number of einsteinium",
      "protons in einsteinium",
      "neutrons in einsteinium",
    ],
    answer: "Einsteinium (Es) is a chemical element with atomic number 99, classified as a actinide.\nAtomic Number: 99\nSymbol: Es\nProtons: 99\nElectrons: 99\nNeutrons: 153\nMass Number: 252\nStandard Atomic Weight: approximately 252\nNote: Einsteinium has no stable isotopes; the mass number 252 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "fermium-explain",
    keywords: [
      "what is fermium",
      "explain fermium",
      "what is fm",
      "explain fm",
      "tell me about fermium",
      "fermium element",
      "atomic number of fermium",
      "protons in fermium",
      "neutrons in fermium",
    ],
    answer: "Fermium (Fm) is a chemical element with atomic number 100, classified as a actinide.\nAtomic Number: 100\nSymbol: Fm\nProtons: 100\nElectrons: 100\nNeutrons: 157\nMass Number: 257\nStandard Atomic Weight: approximately 257\nNote: Fermium has no stable isotopes; the mass number 257 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "mendelevium-explain",
    keywords: [
      "what is mendelevium",
      "explain mendelevium",
      "what is md",
      "explain md",
      "tell me about mendelevium",
      "mendelevium element",
      "atomic number of mendelevium",
      "protons in mendelevium",
      "neutrons in mendelevium",
    ],
    answer: "Mendelevium (Md) is a chemical element with atomic number 101, classified as a actinide.\nAtomic Number: 101\nSymbol: Md\nProtons: 101\nElectrons: 101\nNeutrons: 157\nMass Number: 258\nStandard Atomic Weight: approximately 258\nNote: Mendelevium has no stable isotopes; the mass number 258 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "nobelium-explain",
    keywords: [
      "what is nobelium",
      "explain nobelium",
      "what is no",
      "explain no",
      "tell me about nobelium",
      "nobelium element",
      "atomic number of nobelium",
      "protons in nobelium",
      "neutrons in nobelium",
    ],
    answer: "Nobelium (No) is a chemical element with atomic number 102, classified as a actinide.\nAtomic Number: 102\nSymbol: No\nProtons: 102\nElectrons: 102\nNeutrons: 157\nMass Number: 259\nStandard Atomic Weight: approximately 259\nNote: Nobelium has no stable isotopes; the mass number 259 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "lawrencium-explain",
    keywords: [
      "what is lawrencium",
      "explain lawrencium",
      "what is lr",
      "explain lr",
      "tell me about lawrencium",
      "lawrencium element",
      "atomic number of lawrencium",
      "protons in lawrencium",
      "neutrons in lawrencium",
    ],
    answer: "Lawrencium (Lr) is a chemical element with atomic number 103, classified as a actinide.\nAtomic Number: 103\nSymbol: Lr\nProtons: 103\nElectrons: 103\nNeutrons: 163\nMass Number: 266\nStandard Atomic Weight: approximately 266\nNote: Lawrencium has no stable isotopes; the mass number 266 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "rutherfordium-explain",
    keywords: [
      "what is rutherfordium",
      "explain rutherfordium",
      "what is rf",
      "explain rf",
      "tell me about rutherfordium",
      "rutherfordium element",
      "atomic number of rutherfordium",
      "protons in rutherfordium",
      "neutrons in rutherfordium",
    ],
    answer: "Rutherfordium (Rf) is a chemical element with atomic number 104, classified as a transition metal.\nAtomic Number: 104\nSymbol: Rf\nProtons: 104\nElectrons: 104\nNeutrons: 163\nMass Number: 267\nStandard Atomic Weight: approximately 267\nNote: Rutherfordium has no stable isotopes; the mass number 267 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "dubnium-explain",
    keywords: [
      "what is dubnium",
      "explain dubnium",
      "what is db",
      "explain db",
      "tell me about dubnium",
      "dubnium element",
      "atomic number of dubnium",
      "protons in dubnium",
      "neutrons in dubnium",
    ],
    answer: "Dubnium (Db) is a chemical element with atomic number 105, classified as a transition metal.\nAtomic Number: 105\nSymbol: Db\nProtons: 105\nElectrons: 105\nNeutrons: 163\nMass Number: 268\nStandard Atomic Weight: approximately 268\nNote: Dubnium has no stable isotopes; the mass number 268 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "seaborgium-explain",
    keywords: [
      "what is seaborgium",
      "explain seaborgium",
      "what is sg",
      "explain sg",
      "tell me about seaborgium",
      "seaborgium element",
      "atomic number of seaborgium",
      "protons in seaborgium",
      "neutrons in seaborgium",
    ],
    answer: "Seaborgium (Sg) is a chemical element with atomic number 106, classified as a transition metal.\nAtomic Number: 106\nSymbol: Sg\nProtons: 106\nElectrons: 106\nNeutrons: 163\nMass Number: 269\nStandard Atomic Weight: approximately 269\nNote: Seaborgium has no stable isotopes; the mass number 269 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "bohrium-explain",
    keywords: [
      "what is bohrium",
      "explain bohrium",
      "what is bh",
      "explain bh",
      "tell me about bohrium",
      "bohrium element",
      "atomic number of bohrium",
      "protons in bohrium",
      "neutrons in bohrium",
    ],
    answer: "Bohrium (Bh) is a chemical element with atomic number 107, classified as a transition metal.\nAtomic Number: 107\nSymbol: Bh\nProtons: 107\nElectrons: 107\nNeutrons: 163\nMass Number: 270\nStandard Atomic Weight: approximately 270\nNote: Bohrium has no stable isotopes; the mass number 270 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "hassium-explain",
    keywords: [
      "what is hassium",
      "explain hassium",
      "what is hs",
      "explain hs",
      "tell me about hassium",
      "hassium element",
      "atomic number of hassium",
      "protons in hassium",
      "neutrons in hassium",
    ],
    answer: "Hassium (Hs) is a chemical element with atomic number 108, classified as a transition metal.\nAtomic Number: 108\nSymbol: Hs\nProtons: 108\nElectrons: 108\nNeutrons: 161\nMass Number: 269\nStandard Atomic Weight: approximately 269\nNote: Hassium has no stable isotopes; the mass number 269 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "meitnerium-explain",
    keywords: [
      "what is meitnerium",
      "explain meitnerium",
      "what is mt",
      "explain mt",
      "tell me about meitnerium",
      "meitnerium element",
      "atomic number of meitnerium",
      "protons in meitnerium",
      "neutrons in meitnerium",
    ],
    answer: "Meitnerium (Mt) is a chemical element with atomic number 109, classified as a transition metal.\nAtomic Number: 109\nSymbol: Mt\nProtons: 109\nElectrons: 109\nNeutrons: 169\nMass Number: 278\nStandard Atomic Weight: approximately 278\nNote: Meitnerium has no stable isotopes; the mass number 278 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "darmstadtium-explain",
    keywords: [
      "what is darmstadtium",
      "explain darmstadtium",
      "what is ds",
      "explain ds",
      "tell me about darmstadtium",
      "darmstadtium element",
      "atomic number of darmstadtium",
      "protons in darmstadtium",
      "neutrons in darmstadtium",
    ],
    answer: "Darmstadtium (Ds) is a chemical element with atomic number 110, classified as a transition metal.\nAtomic Number: 110\nSymbol: Ds\nProtons: 110\nElectrons: 110\nNeutrons: 171\nMass Number: 281\nStandard Atomic Weight: approximately 281\nNote: Darmstadtium has no stable isotopes; the mass number 281 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "roentgenium-explain",
    keywords: [
      "what is roentgenium",
      "explain roentgenium",
      "what is rg",
      "explain rg",
      "tell me about roentgenium",
      "roentgenium element",
      "atomic number of roentgenium",
      "protons in roentgenium",
      "neutrons in roentgenium",
    ],
    answer: "Roentgenium (Rg) is a chemical element with atomic number 111, classified as a transition metal.\nAtomic Number: 111\nSymbol: Rg\nProtons: 111\nElectrons: 111\nNeutrons: 171\nMass Number: 282\nStandard Atomic Weight: approximately 282\nNote: Roentgenium has no stable isotopes; the mass number 282 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "copernicium-explain",
    keywords: [
      "what is copernicium",
      "explain copernicium",
      "what is cn",
      "explain cn",
      "tell me about copernicium",
      "copernicium element",
      "atomic number of copernicium",
      "protons in copernicium",
      "neutrons in copernicium",
    ],
    answer: "Copernicium (Cn) is a chemical element with atomic number 112, classified as a transition metal.\nAtomic Number: 112\nSymbol: Cn\nProtons: 112\nElectrons: 112\nNeutrons: 173\nMass Number: 285\nStandard Atomic Weight: approximately 285\nNote: Copernicium has no stable isotopes; the mass number 285 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "nihonium-explain",
    keywords: [
      "what is nihonium",
      "explain nihonium",
      "what is nh",
      "explain nh",
      "tell me about nihonium",
      "nihonium element",
      "atomic number of nihonium",
      "protons in nihonium",
      "neutrons in nihonium",
    ],
    answer: "Nihonium (Nh) is a chemical element with atomic number 113, classified as a post-transition metal.\nAtomic Number: 113\nSymbol: Nh\nProtons: 113\nElectrons: 113\nNeutrons: 173\nMass Number: 286\nStandard Atomic Weight: approximately 286\nNote: Nihonium has no stable isotopes; the mass number 286 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "flerovium-explain",
    keywords: [
      "what is flerovium",
      "explain flerovium",
      "what is fl",
      "explain fl",
      "tell me about flerovium",
      "flerovium element",
      "atomic number of flerovium",
      "protons in flerovium",
      "neutrons in flerovium",
    ],
    answer: "Flerovium (Fl) is a chemical element with atomic number 114, classified as a post-transition metal.\nAtomic Number: 114\nSymbol: Fl\nProtons: 114\nElectrons: 114\nNeutrons: 175\nMass Number: 289\nStandard Atomic Weight: approximately 289\nNote: Flerovium has no stable isotopes; the mass number 289 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "moscovium-explain",
    keywords: [
      "what is moscovium",
      "explain moscovium",
      "what is mc",
      "explain mc",
      "tell me about moscovium",
      "moscovium element",
      "atomic number of moscovium",
      "protons in moscovium",
      "neutrons in moscovium",
    ],
    answer: "Moscovium (Mc) is a chemical element with atomic number 115, classified as a post-transition metal.\nAtomic Number: 115\nSymbol: Mc\nProtons: 115\nElectrons: 115\nNeutrons: 175\nMass Number: 290\nStandard Atomic Weight: approximately 290\nNote: Moscovium has no stable isotopes; the mass number 290 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "livermorium-explain",
    keywords: [
      "what is livermorium",
      "explain livermorium",
      "what is lv",
      "explain lv",
      "tell me about livermorium",
      "livermorium element",
      "atomic number of livermorium",
      "protons in livermorium",
      "neutrons in livermorium",
    ],
    answer: "Livermorium (Lv) is a chemical element with atomic number 116, classified as a post-transition metal.\nAtomic Number: 116\nSymbol: Lv\nProtons: 116\nElectrons: 116\nNeutrons: 177\nMass Number: 293\nStandard Atomic Weight: approximately 293\nNote: Livermorium has no stable isotopes; the mass number 293 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "tennessine-explain",
    keywords: [
      "what is tennessine",
      "explain tennessine",
      "what is ts",
      "explain ts",
      "tell me about tennessine",
      "tennessine element",
      "atomic number of tennessine",
      "protons in tennessine",
      "neutrons in tennessine",
    ],
    answer: "Tennessine (Ts) is a chemical element with atomic number 117, classified as a halogen.\nAtomic Number: 117\nSymbol: Ts\nProtons: 117\nElectrons: 117\nNeutrons: 177\nMass Number: 294\nStandard Atomic Weight: approximately 294\nNote: Tennessine has no stable isotopes; the mass number 294 refers to its most stable or longest-lived known isotope."
  },
  {
    id: "oganesson-explain",
    keywords: [
      "what is oganesson",
      "explain oganesson",
      "what is og",
      "explain og",
      "tell me about oganesson",
      "oganesson element",
      "atomic number of oganesson",
      "protons in oganesson",
      "neutrons in oganesson",
    ],
    answer: "Oganesson (Og) is a chemical element with atomic number 118, classified as a noble gas.\nAtomic Number: 118\nSymbol: Og\nProtons: 118\nElectrons: 118\nNeutrons: 176\nMass Number: 294\nStandard Atomic Weight: approximately 294\nNote: Oganesson has no stable isotopes; the mass number 294 refers to its most stable or longest-lived known isotope."
  },
  
  
 
  // =========================================================
  // CHEMICAL REACTIONS 
  // =========================================================
        
  
  {
    id: "combination-reaction-explain",
    keywords: [
      "what is combination reaction",
      "explain combination reaction",
      "combination reaction",
      "tell me about combination reaction",
      "example of combination reaction",
      "general equation of combination reaction",
      "what is synthesis reaction",
      "synthesis reaction",
    ],
    answer: "Combination Reaction is a type of chemical reaction.\nType: Combination Reaction\nGeneral Equation: A + B -> AB\nDescription: Two or more simple substances (elements or compounds) combine to form a single, more complex product.\nExample: 2H2 + O2 -> 2H2O (hydrogen and oxygen combine to form water)"
  },
  {
    id: "direct-combination-reaction-explain",
    keywords: [
      "what is direct combination reaction",
      "explain direct combination reaction",
      "direct combination reaction",
      "tell me about direct combination reaction",
      "example of direct combination reaction",
      "general equation of direct combination reaction",
      "what is direct combination",
      "direct combination",
    ],
    answer: "Direct Combination Reaction is a type of chemical reaction.\nType: Direct Combination Reaction\nGeneral Equation: A + B -> AB (direct, one-step combination)\nDescription: A specific type of combination reaction where two elements or simple compounds combine directly with each other in a single step, without any intermediate compound being formed.\nExample: N2 + 3H2 -> 2NH3 (nitrogen and hydrogen combine directly to form ammonia)"
  },
  {
    id: "decomposition-reaction-explain",
    keywords: [
      "what is decomposition reaction",
      "explain decomposition reaction",
      "decomposition reaction",
      "tell me about decomposition reaction",
      "example of decomposition reaction",
      "general equation of decomposition reaction",
      "what is analysis reaction",
      "analysis reaction",
    ],
    answer: "Decomposition Reaction is a type of chemical reaction.\nType: Decomposition Reaction\nGeneral Equation: AB -> A + B\nDescription: A single compound breaks down into two or more simpler substances, often triggered by heat, light, or electricity.\nExample: 2H2O -> 2H2 + O2 (electrolysis of water)"
  },
  {
    id: "thermal-decomposition-reaction-explain",
    keywords: [
      "what is thermal decomposition reaction",
      "explain thermal decomposition reaction",
      "thermal decomposition reaction",
      "tell me about thermal decomposition reaction",
      "example of thermal decomposition reaction",
      "general equation of thermal decomposition reaction",
      "what is thermolysis reaction",
      "thermolysis reaction",
    ],
    answer: "Thermal Decomposition Reaction is a type of chemical reaction.\nType: Thermal Decomposition Reaction\nGeneral Equation: AB + heat -> A + B\nDescription: A decomposition reaction in which a compound breaks down into simpler substances specifically when heated.\nExample: CaCO3 + heat -> CaO + CO2 (limestone decomposes into quicklime and carbon dioxide on heating)"
  },
  {
    id: "electrolytic-decomposition-reaction-explain",
    keywords: [
      "what is electrolytic decomposition reaction",
      "explain electrolytic decomposition reaction",
      "electrolytic decomposition reaction",
      "tell me about electrolytic decomposition reaction",
      "example of electrolytic decomposition reaction",
      "general equation of electrolytic decomposition reaction",
      "what is electrolysis decomposition reaction",
      "electrolysis decomposition reaction",
    ],
    answer: "Electrolytic Decomposition Reaction is a type of chemical reaction.\nType: Electrolytic Decomposition Reaction\nGeneral Equation: AB + electricity -> A + B\nDescription: A decomposition reaction in which an electric current is passed through a compound (usually molten or in solution) to break it down into simpler substances.\nExample: 2H2O -> 2H2 + O2 (electrolysis of water using an electric current)"
  },
  {
    id: "photolytic-decomposition-reaction-explain",
    keywords: [
      "what is photolytic decomposition reaction",
      "explain photolytic decomposition reaction",
      "photolytic decomposition reaction",
      "tell me about photolytic decomposition reaction",
      "example of photolytic decomposition reaction",
      "general equation of photolytic decomposition reaction",
      "what is photolysis decomposition reaction",
      "photolysis decomposition reaction",
    ],
    answer: "Photolytic Decomposition Reaction is a type of chemical reaction.\nType: Photolytic Decomposition Reaction\nGeneral Equation: AB + light -> A + B\nDescription: A decomposition reaction in which a compound breaks down into simpler substances when exposed to light energy.\nExample: 2AgCl + light -> 2Ag + Cl2 (silver chloride decomposes in sunlight, used in old photography)"
  },
  {
    id: "single-displacement-reaction-explain",
    keywords: [
      "what is single displacement reaction",
      "explain single displacement reaction",
      "single displacement reaction",
      "tell me about single displacement reaction",
      "example of single displacement reaction",
      "general equation of single displacement reaction",
      "what is single replacement reaction",
      "single replacement reaction",
    ],
    answer: "Single Displacement Reaction is a type of chemical reaction.\nType: Single Displacement Reaction\nGeneral Equation: A + BC -> AC + B\nDescription: A more reactive element displaces a less reactive element from a compound.\nExample: Zn + 2HCl -> ZnCl2 + H2 (zinc displaces hydrogen from hydrochloric acid)"
  },
  {
    id: "substitution-reaction-explain",
    keywords: [
      "what is substitution reaction",
      "explain substitution reaction",
      "substitution reaction",
      "tell me about substitution reaction",
      "example of substitution reaction",
      "general equation of substitution reaction",
      "what is replacement reaction",
      "replacement reaction",
    ],
    answer: "Substitution Reaction is a type of chemical reaction.\nType: Substitution Reaction\nGeneral Equation: A-B + C -> A-C + B\nDescription: One atom, ion, or functional group in a compound is replaced by another atom, ion, or group. In inorganic chemistry this overlaps with single displacement; in organic chemistry it usually means one atom or group on a molecule is swapped for another.\nExample: CH4 + Cl2 -> CH3Cl + HCl (a hydrogen atom in methane is substituted by chlorine)"
  },
  {
    id: "double-displacement-reaction-explain",
    keywords: [
      "what is double displacement reaction",
      "explain double displacement reaction",
      "double displacement reaction",
      "tell me about double displacement reaction",
      "example of double displacement reaction",
      "general equation of double displacement reaction",
      "what is double replacement reaction",
      "double replacement reaction",
      "what is metathesis reaction",
      "metathesis reaction",
    ],
    answer: "Double Displacement Reaction is a type of chemical reaction.\nType: Double Displacement Reaction\nGeneral Equation: AB + CD -> AD + CB\nDescription: The positive and negative ions of two compounds swap partners, often forming a precipitate, gas, or water.\nExample: AgNO3 + NaCl -> AgCl + NaNO3 (silver chloride precipitates out)"
  },
  {
    id: "double-decomposition-reaction-explain",
    keywords: [
      "what is double decomposition reaction",
      "explain double decomposition reaction",
      "double decomposition reaction",
      "tell me about double decomposition reaction",
      "example of double decomposition reaction",
      "general equation of double decomposition reaction",
      "what is double decomposition",
      "double decomposition",
    ],
    answer: "Double Decomposition Reaction is a type of chemical reaction.\nType: Double Decomposition Reaction\nGeneral Equation: AB + CD -> AD + CB\nDescription: Another name for a double displacement (metathesis) reaction, where two compounds exchange ions or radicals to form two new compounds.\nExample: BaCl2 + Na2SO4 -> BaSO4 + 2NaCl (barium sulfate precipitates out)"
  },
  {
    id: "combustion-reaction-explain",
    keywords: [
      "what is combustion reaction",
      "explain combustion reaction",
      "combustion reaction",
      "tell me about combustion reaction",
      "example of combustion reaction",
      "general equation of combustion reaction",
      "what is burning reaction",
      "burning reaction",
    ],
    answer: "Combustion Reaction is a type of chemical reaction.\nType: Combustion Reaction\nGeneral Equation: CxHy + O2 -> CO2 + H2O\nDescription: A substance, usually a hydrocarbon, reacts rapidly with oxygen, releasing heat and light and typically producing carbon dioxide and water.\nExample: CH4 + 2O2 -> CO2 + 2H2O (methane burning in oxygen)"
  },
  {
    id: "redox-reaction-explain",
    keywords: [
      "what is redox reaction",
      "explain redox reaction",
      "redox reaction",
      "tell me about redox reaction",
      "example of redox reaction",
      "general equation of redox reaction",
      "what is oxidation-reduction reaction",
      "oxidation-reduction reaction",
      "what is oxidation reduction reaction",
      "oxidation reduction reaction",
    ],
    answer: "Redox Reaction is a type of chemical reaction.\nType: Redox Reaction\nGeneral Equation: Oxidation: X -> X+ + e-, Reduction: Y + e- -> Y-\nDescription: A reaction in which electrons are transferred between species, so one substance is oxidized (loses electrons) while another is reduced (gains electrons).\nExample: 2Mg + O2 -> 2MgO (magnesium is oxidized, oxygen is reduced)"
  },
  {
    id: "disproportionation-reaction-explain",
    keywords: [
      "what is disproportionation reaction",
      "explain disproportionation reaction",
      "disproportionation reaction",
      "tell me about disproportionation reaction",
      "example of disproportionation reaction",
      "general equation of disproportionation reaction",
      "what is dismutation reaction",
      "dismutation reaction",
    ],
    answer: "Disproportionation Reaction is a type of chemical reaction.\nType: Disproportionation Reaction\nGeneral Equation: 2A -> A(oxidized) + A(reduced)\nDescription: A special type of redox reaction in which the same element, in a single compound, is simultaneously oxidized and reduced to form two different products.\nExample: 2H2O2 -> 2H2O + O2 (hydrogen peroxide decomposes, oxygen is both oxidized and reduced)"
  },
  {
    id: "acid-base-reaction-explain",
    keywords: [
      "what is acid-base reaction",
      "explain acid-base reaction",
      "acid-base reaction",
      "tell me about acid-base reaction",
      "example of acid-base reaction",
      "general equation of acid-base reaction",
      "what is neutralization reaction",
      "neutralization reaction",
      "what is acid base reaction",
      "acid base reaction",
    ],
    answer: "Acid-Base Reaction is a type of chemical reaction.\nType: Acid-Base Reaction\nGeneral Equation: Acid + Base -> Salt + Water\nDescription: An acid reacts with a base, neutralizing each other to produce a salt and water.\nExample: HCl + NaOH -> NaCl + H2O (hydrochloric acid and sodium hydroxide neutralize)"
  },
  {
    id: "precipitation-reaction-explain",
    keywords: [
      "what is precipitation reaction",
      "explain precipitation reaction",
      "precipitation reaction",
      "tell me about precipitation reaction",
      "example of precipitation reaction",
      "general equation of precipitation reaction",
      "what is precipitate reaction",
      "precipitate reaction",
    ],
    answer: "Precipitation Reaction is a type of chemical reaction.\nType: Precipitation Reaction\nGeneral Equation: AB(aq) + CD(aq) -> AD(s) + CB(aq)\nDescription: Two soluble salts in solution react to form an insoluble solid, called a precipitate.\nExample: Pb(NO3)2 + 2KI -> PbI2 + 2KNO3 (lead iodide forms as a yellow precipitate)"
  },
  {
    id: "exothermic-reaction-explain",
    keywords: [
      "what is exothermic reaction",
      "explain exothermic reaction",
      "exothermic reaction",
      "tell me about exothermic reaction",
      "example of exothermic reaction",
      "general equation of exothermic reaction",
    ],
    answer: "Exothermic Reaction is a type of chemical reaction.\nType: Exothermic Reaction\nGeneral Equation: Reactants -> Products + Energy (heat)\nDescription: A reaction that releases energy, usually as heat, to its surroundings, so the surroundings get warmer.\nExample: C + O2 -> CO2 + heat (combustion of carbon releases heat)"
  },
  {
    id: "endothermic-reaction-explain",
    keywords: [
      "what is endothermic reaction",
      "explain endothermic reaction",
      "endothermic reaction",
      "tell me about endothermic reaction",
      "example of endothermic reaction",
      "general equation of endothermic reaction",
    ],
    answer: "Endothermic Reaction is a type of chemical reaction.\nType: Endothermic Reaction\nGeneral Equation: Reactants + Energy (heat) -> Products\nDescription: A reaction that absorbs energy from its surroundings, so the surroundings get colder.\nExample: N2 + O2 + heat -> 2NO (formation of nitric oxide requires energy input)"
  },
  {
    id: "reversible-reaction-explain",
    keywords: [
      "what is reversible reaction",
      "explain reversible reaction",
      "reversible reaction",
      "tell me about reversible reaction",
      "example of reversible reaction",
      "general equation of reversible reaction",
    ],
    answer: "Reversible Reaction is a type of chemical reaction.\nType: Reversible Reaction\nGeneral Equation: A + B <-> C + D\nDescription: A reaction that can proceed in both the forward and backward directions, eventually reaching a state of dynamic equilibrium where both reactants and products are present.\nExample: N2 + 3H2 <-> 2NH3 (the Haber process reaches equilibrium)"
  },
  {
    id: "irreversible-reaction-explain",
    keywords: [
      "what is irreversible reaction",
      "explain irreversible reaction",
      "irreversible reaction",
      "tell me about irreversible reaction",
      "example of irreversible reaction",
      "general equation of irreversible reaction",
    ],
    answer: "Irreversible Reaction is a type of chemical reaction.\nType: Irreversible Reaction\nGeneral Equation: A + B -> C + D (one direction only)\nDescription: A reaction that proceeds in only one direction and goes essentially to completion, so the products do not spontaneously convert back into the reactants.\nExample: Mg + 2HCl -> MgCl2 + H2 (goes to completion, does not reverse)"
  },
  {
    id: "catalytic-reaction-explain",
    keywords: [
      "what is catalytic reaction",
      "explain catalytic reaction",
      "catalytic reaction",
      "tell me about catalytic reaction",
      "example of catalytic reaction",
      "general equation of catalytic reaction",
      "what is catalysis reaction",
      "catalysis reaction",
    ],
    answer: "Catalytic Reaction is a type of chemical reaction.\nType: Catalytic Reaction\nGeneral Equation: A + B --catalyst--> C\nDescription: A reaction whose rate is increased by the presence of a catalyst, a substance that speeds up the reaction without being consumed or permanently changed itself.\nExample: 2H2O2 --MnO2--> 2H2O + O2 (manganese dioxide catalyzes the decomposition of hydrogen peroxide)"
  },
  {
    id: "chain-reaction-explain",
    keywords: [
      "what is chain reaction",
      "explain chain reaction",
      "chain reaction",
      "tell me about chain reaction",
      "example of chain reaction",
      "general equation of chain reaction",
    ],
    answer: "Chain Reaction is a type of chemical reaction.\nType: Chain Reaction\nGeneral Equation: Initiation -> Propagation (repeating) -> Termination\nDescription: A self-sustaining sequence of reactions in which a reactive intermediate produced in one step goes on to trigger further reaction steps, often very rapidly.\nExample: CH4 + Cl2 -> CH3Cl + HCl (free-radical chlorination of methane proceeds via a chain mechanism)"
  },
  {
    id: "polymerization-reaction-explain",
    keywords: [
      "what is polymerization reaction",
      "explain polymerization reaction",
      "polymerization reaction",
      "tell me about polymerization reaction",
      "example of polymerization reaction",
      "general equation of polymerization reaction",
      "what is polymerisation reaction",
      "polymerisation reaction",
    ],
    answer: "Polymerization Reaction is a type of chemical reaction.\nType: Polymerization Reaction\nGeneral Equation: n(Monomer) -> Polymer\nDescription: Many small molecules called monomers join together to form a large chain-like molecule called a polymer.\nExample: n(CH2=CH2) -> -(CH2-CH2)n- (ethylene monomers form polyethylene)"
  },
  {
    id: "addition-reaction-explain",
    keywords: [
      "what is addition reaction",
      "explain addition reaction",
      "addition reaction",
      "tell me about addition reaction",
      "example of addition reaction",
      "general equation of addition reaction",
    ],
    answer: "Addition Reaction is a type of chemical reaction.\nType: Addition Reaction\nGeneral Equation: A=B + C-D -> A(C)-B(D)\nDescription: Two or more molecules combine to form a single product, with atoms adding across a double or triple bond and no atoms being removed.\nExample: CH2=CH2 + H2 -> CH3-CH3 (hydrogenation of ethylene to ethane)"
  },
  {
    id: "elimination-reaction-explain",
    keywords: [
      "what is elimination reaction",
      "explain elimination reaction",
      "elimination reaction",
      "tell me about elimination reaction",
      "example of elimination reaction",
      "general equation of elimination reaction",
    ],
    answer: "Elimination Reaction is a type of chemical reaction.\nType: Elimination Reaction\nGeneral Equation: A-B -> A=B + small molecule\nDescription: Atoms are removed from a molecule, usually forming a double or triple bond and releasing a small molecule such as water or a hydrogen halide.\nExample: C2H5OH -> C2H4 + H2O (dehydration of ethanol to ethylene)"
  },
  {
    id: "esterification-reaction-explain",
    keywords: [
      "what is esterification reaction",
      "explain esterification reaction",
      "esterification reaction",
      "tell me about esterification reaction",
      "example of esterification reaction",
      "general equation of esterification reaction",
    ],
    answer: "Esterification Reaction is a type of chemical reaction.\nType: Esterification Reaction\nGeneral Equation: Acid + Alcohol -> Ester + Water\nDescription: A carboxylic acid reacts with an alcohol, usually with an acid catalyst, to form an ester and water.\nExample: CH3COOH + C2H5OH -> CH3COOC2H5 + H2O (acetic acid and ethanol form ethyl acetate)"
  },
  {
    id: "saponification-reaction-explain",
    keywords: [
      "what is saponification reaction",
      "explain saponification reaction",
      "saponification reaction",
      "tell me about saponification reaction",
      "example of saponification reaction",
      "general equation of saponification reaction",
      "what is soap making reaction",
      "soap making reaction",
    ],
    answer: "Saponification Reaction is a type of chemical reaction.\nType: Saponification Reaction\nGeneral Equation: Fat/Oil (ester) + Base -> Soap + Glycerol\nDescription: A fat or oil (an ester) is hydrolyzed by a strong base to produce soap (a salt of a fatty acid) and glycerol.\nExample: Fat + 3NaOH -> Soap + Glycerol (traditional soap-making reaction)"
  },
  {
    id: "fermentation-reaction-explain",
    keywords: [
      "what is fermentation reaction",
      "explain fermentation reaction",
      "fermentation reaction",
            "tell me about fermentation reaction",
      "example of fermentation reaction",
      "general equation of fermentation reaction",
    ],
    answer: "Fermentation Reaction is a type of chemical reaction.\nType: Fermentation Reaction\nGeneral Equation: Sugar --enzyme/microorganism--> Alcohol + CO2\nDescription: A biochemical reaction in which microorganisms such as yeast break down sugars in the absence of oxygen, producing alcohol and carbon dioxide.\nExample: C6H12O6 -> 2C2H5OH + 2CO2 (glucose ferments into ethanol and carbon dioxide)"
  },
  {
    id: "corrosion-reaction-explain",
    keywords: [
      "what is corrosion reaction",
      "explain corrosion reaction",
      "corrosion reaction",
      "tell me about corrosion reaction",
      "example of corrosion reaction",
      "general equation of corrosion reaction",
      "what is rusting reaction",
      "rusting reaction",
    ],
    answer: "Corrosion Reaction is a type of chemical reaction.\nType: Corrosion Reaction\nGeneral Equation: Metal + O2 + H2O -> Metal oxide/hydroxide\nDescription: A slow, natural redox reaction in which a metal is gradually oxidized by oxygen and moisture in the environment, degrading the metal over time.\nExample: 4Fe + 3O2 + 6H2O -> 4Fe(OH)3 (iron rusts in the presence of oxygen and water)"
  },
  {
    id: "photochemical-reaction-explain",
    keywords: [
      "what is photochemical reaction",
      "explain photochemical reaction",
      "photochemical reaction",
      "tell me about photochemical reaction",
      "example of photochemical reaction",
      "general equation of photochemical reaction",
      "what is photolysis reaction",
      "photolysis reaction",
    ],
    answer: "Photochemical Reaction is a type of chemical reaction.\nType: Photochemical Reaction\nGeneral Equation: Reactants + light energy -> Products\nDescription: A reaction that is initiated or driven by the absorption of light energy, often breaking chemical bonds.\nExample: 6CO2 + 6H2O + light -> C6H12O6 + 6O2 (photosynthesis)"
  },
  {
    id: "electrochemical-reaction-explain",
    keywords: [
      "what is electrochemical reaction",
      "explain electrochemical reaction",
      "electrochemical reaction",
      "tell me about electrochemical reaction",
      "example of electrochemical reaction",
      "general equation of electrochemical reaction",
      "what is electrolysis reaction",
      "electrolysis reaction",
    ],
    answer: "Electrochemical Reaction is a type of chemical reaction.\nType: Electrochemical Reaction\nGeneral Equation: Reactants + electrical energy -> Products (or the reverse, generating electrical energy)\nDescription: A reaction that either produces electrical energy from a chemical reaction (as in a battery) or uses electrical energy to drive a non-spontaneous reaction (as in electrolysis).\nExample: 2NaCl (molten) -> 2Na + Cl2 (electrolysis of molten sodium chloride)"
  },
  {
    id: "isomerization-reaction-explain",
    keywords: [
      "what is isomerization reaction",
      "explain isomerization reaction",
      "isomerization reaction",
      "tell me about isomerization reaction",
      "example of isomerization reaction",
      "general equation of isomerization reaction",
      "what is isomerisation reaction",
      "isomerisation reaction",
    ],
    answer: "Isomerization Reaction is a type of chemical reaction.\nType: Isomerization Reaction\nGeneral Equation: A -> A' (same molecular formula, different structure)\nDescription: A molecule is rearranged into a different structural or spatial form without changing its molecular formula.\nExample: n-butane -> isobutane (same formula C4H10, different structure)"
  },
  {
    id: "hydrolysis-reaction-explain",
    keywords: [
      "what is hydrolysis reaction",
      "explain hydrolysis reaction",
      "hydrolysis reaction",
      "tell me about hydrolysis reaction",
      "example of hydrolysis reaction",
      "general equation of hydrolysis reaction",
    ],
    answer: "Hydrolysis Reaction is a type of chemical reaction.\nType: Hydrolysis Reaction\nGeneral Equation: AB + H2O -> AOH + HB\nDescription: A compound reacts with water, breaking a chemical bond and typically splitting the compound into two parts.\nExample: CH3COOC2H5 + H2O -> CH3COOH + C2H5OH (ester hydrolysis)"
  },
  
  
    // =========================================================
    // ACID BASE
      // =========================================================
      
   {
    id: "hydrochloric-acid-explain",
    keywords: [
      "what is hydrochloric acid",
      "explain hydrochloric acid",
      "hydrochloric acid",
      "tell me about hydrochloric acid",
      "formula of hydrochloric acid",
      "is hydrochloric acid strong or weak",
      "ph of hydrochloric acid",
    ],
    answer: "Hydrochloric Acid (HCl) is a chemical acid.\nFormula: HCl\nCommon Name: Muriatic acid\nStrength: Strong\nTypical pH: 0-1 (concentrated)\nUse/Note: Found naturally in gastric (stomach) acid; used in industrial cleaning and pH regulation."
  },
  {
    id: "sulfuric-acid-explain",
    keywords: [
      "what is sulfuric acid",
      "explain sulfuric acid",
      "sulfuric acid",
      "tell me about sulfuric acid",
      "formula of sulfuric acid",
      "is sulfuric acid strong or weak",
      "ph of sulfuric acid",
    ],
    answer: "Sulfuric Acid (H2SO4) is a chemical acid.\nFormula: H2SO4\nCommon Name: Oil of vitriol\nStrength: Strong\nTypical pH: 0-1 (concentrated)\nUse/Note: Used in car batteries, fertilizer production, and industrial manufacturing."
  },
  {
    id: "nitric-acid-explain",
    keywords: [
      "what is nitric acid",
      "explain nitric acid",
      "nitric acid",
      "tell me about nitric acid",
      "formula of nitric acid",
      "is nitric acid strong or weak",
      "ph of nitric acid",
    ],
    answer: "Nitric Acid (HNO3) is a chemical acid.\nFormula: HNO3\nCommon Name: Aqua fortis\nStrength: Strong\nTypical pH: 0-1 (concentrated)\nUse/Note: Used in fertilizer and explosives manufacturing, and in metal etching."
  },
  {
    id: "hydrobromic-acid-explain",
    keywords: [
      "what is hydrobromic acid",
      "explain hydrobromic acid",
      "hydrobromic acid",
      "tell me about hydrobromic acid",
      "formula of hydrobromic acid",
      "is hydrobromic acid strong or weak",
      "ph of hydrobromic acid",
    ],
    answer: "Hydrobromic Acid (HBr) is a chemical acid.\nFormula: HBr\nStrength: Strong\nTypical pH: 0-1 (concentrated)\nUse/Note: Used in organic synthesis and as a catalyst."
  },
  {
    id: "hydroiodic-acid-explain",
    keywords: [
      "what is hydroiodic acid",
      "explain hydroiodic acid",
      "hydroiodic acid",
      "tell me about hydroiodic acid",
      "formula of hydroiodic acid",
      "is hydroiodic acid strong or weak",
      "ph of hydroiodic acid",
    ],
    answer: "Hydroiodic Acid (HI) is a chemical acid.\nFormula: HI\nStrength: Strong\nTypical pH: 0-1 (concentrated)\nUse/Note: Used in pharmaceutical synthesis and as a reducing agent."
  },
  {
    id: "perchloric-acid-explain",
    keywords: [
      "what is perchloric acid",
      "explain perchloric acid",
      "perchloric acid",
      "tell me about perchloric acid",
      "formula of perchloric acid",
      "is perchloric acid strong or weak",
      "ph of perchloric acid",
    ],
    answer: "Perchloric Acid (HClO4) is a chemical acid.\nFormula: HClO4\nStrength: Strong\nTypical pH: around 0 (concentrated)\nUse/Note: Used in analytical chemistry as a strong oxidizing acid."
  },
  {
    id: "chloric-acid-explain",
    keywords: [
      "what is chloric acid",
      "explain chloric acid",
      "chloric acid",
      "tell me about chloric acid",
      "formula of chloric acid",
      "is chloric acid strong or weak",
      "ph of chloric acid",
    ],
    answer: "Chloric Acid (HClO3) is a chemical acid.\nFormula: HClO3\nStrength: Strong\nTypical pH: 0-1 (concentrated)\nUse/Note: Used as a strong oxidizing agent."
  },
  {
    id: "acetic-acid-explain",
    keywords: [
      "what is acetic acid",
      "explain acetic acid",
      "acetic acid",
      "tell me about acetic acid",
      "formula of acetic acid",
      "is acetic acid strong or weak",
      "ph of acetic acid",
    ],
    answer: "Acetic Acid (CH3COOH) is a chemical acid.\nFormula: CH3COOH\nCommon Name: Ethanoic acid / vinegar acid\nStrength: Weak\nTypical pH: about 2.4 (5% solution)\nUse/Note: The main acid component of vinegar."
  },
  {
    id: "citric-acid-explain",
    keywords: [
      "what is citric acid",
      "explain citric acid",
      "citric acid",
      "tell me about citric acid",
      "formula of citric acid",
      "is citric acid strong or weak",
      "ph of citric acid",
    ],
    answer: "Citric Acid (C6H8O7) is a chemical acid.\nFormula: C6H8O7\nStrength: Weak\nTypical pH: about 2.2 (in solution)\nUse/Note: Found naturally in citrus fruits such as lemons and oranges."
  },
  {
    id: "carbonic-acid-explain",
    keywords: [
      "what is carbonic acid",
      "explain carbonic acid",
      "carbonic acid",
      "tell me about carbonic acid",
      "formula of carbonic acid",
      "is carbonic acid strong or weak",
      "ph of carbonic acid",
    ],
    answer: "Carbonic Acid (H2CO3) is a chemical acid.\nFormula: H2CO3\nStrength: Weak\nTypical pH: about 3.8-4\nUse/Note: Formed when carbon dioxide dissolves in water; gives carbonated drinks their fizz."
  },
  {
    id: "phosphoric-acid-explain",
    keywords: [
      "what is phosphoric acid",
      "explain phosphoric acid",
      "phosphoric acid",
      "tell me about phosphoric acid",
      "formula of phosphoric acid",
      "is phosphoric acid strong or weak",
      "ph of phosphoric acid",
    ],
    answer: "Phosphoric Acid (H3PO4) is a chemical acid.\nFormula: H3PO4\nCommon Name: Orthophosphoric acid\nStrength: Weak (moderately strong)\nTypical pH: about 2.1 (in solution)\nUse/Note: Used in soft drinks like cola and in fertilizer production."
  },
  {
    id: "formic-acid-explain",
    keywords: [
      "what is formic acid",
      "explain formic acid",
      "formic acid",
      "tell me about formic acid",
      "formula of formic acid",
      "is formic acid strong or weak",
      "ph of formic acid",
    ],
    answer: "Formic Acid (HCOOH) is a chemical acid.\nFormula: HCOOH\nCommon Name: Methanoic acid\nStrength: Weak\nTypical pH: about 2.9 (in solution)\nUse/Note: Found in the stings and bites of ants and bees."
  },
  {
    id: "lactic-acid-explain",
    keywords: [
      "what is lactic acid",
      "explain lactic acid",
      "lactic acid",
      "tell me about lactic acid",
      "formula of lactic acid",
      "is lactic acid strong or weak",
      "ph of lactic acid",
    ],
    answer: "Lactic Acid (C3H6O3) is a chemical acid.\nFormula: C3H6O3\nStrength: Weak\nTypical pH: about 2.4 (in solution)\nUse/Note: Produced in muscles during intense exercise and found in sour milk and yogurt."
  },
  {
    id: "ascorbic-acid-explain",
    keywords: [
      "what is ascorbic acid",
      "explain ascorbic acid",
      "ascorbic acid",
      "tell me about ascorbic acid",
      "formula of ascorbic acid",
      "is ascorbic acid strong or weak",
      "ph of ascorbic acid",
    ],
    answer: "Ascorbic Acid (C6H8O6) is a chemical acid.\nFormula: C6H8O6\nCommon Name: Vitamin C\nStrength: Weak\nTypical pH: about 3.0 (in solution)\nUse/Note: An essential vitamin found in citrus fruits and leafy vegetables."
  },
  {
    id: "oxalic-acid-explain",
    keywords: [
      "what is oxalic acid",
      "explain oxalic acid",
      "oxalic acid",
      "tell me about oxalic acid",
      "formula of oxalic acid",
      "is oxalic acid strong or weak",
      "ph of oxalic acid",
    ],
    answer: "Oxalic Acid (C2H2O4) is a chemical acid.\nFormula: C2H2O4\nStrength: Weak\nTypical pH: about 1.3 (in solution)\nUse/Note: Found in spinach, rhubarb, and other leafy vegetables."
  },
  {
    id: "boric-acid-explain",
    keywords: [
      "what is boric acid",
      "explain boric acid",
      "boric acid",
      "tell me about boric acid",
      "formula of boric acid",
      "is boric acid strong or weak",
      "ph of boric acid",
    ],
    answer: "Boric Acid (H3BO3) is a chemical acid.\nFormula: H3BO3\nStrength: Weak\nTypical pH: about 5.1 (mild)\nUse/Note: Used as a mild antiseptic and as an insecticide."
  },
  {
    id: "sulfurous-acid-explain",
    keywords: [
      "what is sulfurous acid",
      "explain sulfurous acid",
      "sulfurous acid",
      "tell me about sulfurous acid",
      "formula of sulfurous acid",
      "is sulfurous acid strong or weak",
      "ph of sulfurous acid",
    ],
    answer: "Sulfurous Acid (H2SO3) is a chemical acid.\nFormula: H2SO3\nStrength: Weak\nTypical pH: about 1.5 (in solution)\nUse/Note: Formed when sulfur dioxide dissolves in water; used as a preservative."
  },
  {
    id: "hydrofluoric-acid-explain",
    keywords: [
      "what is hydrofluoric acid",
      "explain hydrofluoric acid",
      "hydrofluoric acid",
      "tell me about hydrofluoric acid",
      "formula of hydrofluoric acid",
      "is hydrofluoric acid strong or weak",
      "ph of hydrofluoric acid",
    ],
    answer: "Hydrofluoric Acid (HF) is a chemical acid.\nFormula: HF\nStrength: Weak (but highly corrosive)\nTypical pH: about 3.1 (in solution)\nUse/Note: Used to etch glass; classified as weak but extremely corrosive and dangerous."
  },
  {
    id: "tartaric-acid-explain",
    keywords: [
      "what is tartaric acid",
      "explain tartaric acid",
      "tartaric acid",
      "tell me about tartaric acid",
      "formula of tartaric acid",
      "is tartaric acid strong or weak",
      "ph of tartaric acid",
    ],
    answer: "Tartaric Acid (C4H6O6) is a chemical acid.\nFormula: C4H6O6\nStrength: Weak\nTypical pH: about 2.2 (in solution)\nUse/Note: Found naturally in grapes and used as an ingredient in baking powder."
  },
  {
    id: "benzoic-acid-explain",
    keywords: [
      "what is benzoic acid",
      "explain benzoic acid",
      "benzoic acid",
      "tell me about benzoic acid",
      "formula of benzoic acid",
      "is benzoic acid strong or weak",
      "ph of benzoic acid",
    ],
    answer: "Benzoic Acid (C7H6O2) is a chemical acid.\nFormula: C7H6O2\nStrength: Weak\nTypical pH: about 2.8 (in solution)\nUse/Note: Widely used as a food preservative."
  },
  {
    id: "sodium-hydroxide-explain",
    keywords: [
      "what is sodium hydroxide",
      "explain sodium hydroxide",
      "sodium hydroxide",
      "tell me about sodium hydroxide",
      "formula of sodium hydroxide",
      "is sodium hydroxide strong or weak",
      "ph of sodium hydroxide",
    ],
    answer: "Sodium Hydroxide (NaOH) is a chemical base.\nFormula: NaOH\nCommon Name: Lye / caustic soda\nStrength: Strong\nTypical pH: 13-14 (concentrated)\nUse/Note: Used in soap making, drain cleaners, and paper manufacturing."
  },
  {
    id: "potassium-hydroxide-explain",
    keywords: [
      "what is potassium hydroxide",
      "explain potassium hydroxide",
      "potassium hydroxide",
      "tell me about potassium hydroxide",
      "formula of potassium hydroxide",
      "is potassium hydroxide strong or weak",
      "ph of potassium hydroxide",
    ],
    answer: "Potassium Hydroxide (KOH) is a chemical base.\nFormula: KOH\nCommon Name: Caustic potash\nStrength: Strong\nTypical pH: 13-14 (concentrated)\nUse/Note: Used in making liquid soaps and alkaline batteries."
  },
  {
    id: "calcium-hydroxide-explain",
    keywords: [
      "what is calcium hydroxide",
      "explain calcium hydroxide",
      "calcium hydroxide",
      "tell me about calcium hydroxide",
      "formula of calcium hydroxide",
      "is calcium hydroxide strong or weak",
      "ph of calcium hydroxide",
    ],
    answer: "Calcium Hydroxide (Ca(OH)2) is a chemical base.\nFormula: Ca(OH)2\nCommon Name: Slaked lime\nStrength: Strong\nTypical pH: about 12.4\nUse/Note: Used in construction (mortar and plaster) and water treatment."
  },
  {
    id: "barium-hydroxide-explain",
    keywords: [
      "what is barium hydroxide",
      "explain barium hydroxide",
      "barium hydroxide",
      "tell me about barium hydroxide",
      "formula of barium hydroxide",
      "is barium hydroxide strong or weak",
      "ph of barium hydroxide",
    ],
    answer: "Barium Hydroxide (Ba(OH)2) is a chemical base.\nFormula: Ba(OH)2\nCommon Name: Baryta\nStrength: Strong\nTypical pH: 13-14 (in solution)\nUse/Note: Used in analytical chemistry to titrate weak acids."
  },
  {
    id: "lithium-hydroxide-explain",
    keywords: [
      "what is lithium hydroxide",
      "explain lithium hydroxide",
      "lithium hydroxide",
      "tell me about lithium hydroxide",
      "formula of lithium hydroxide",
      "is lithium hydroxide strong or weak",
      "ph of lithium hydroxide",
    ],
    answer: "Lithium Hydroxide (LiOH) is a chemical base.\nFormula: LiOH\nStrength: Strong\nTypical pH: about 13\nUse/Note: Used in carbon dioxide scrubbers on spacecraft and submarines."
  },
  {
    id: "strontium-hydroxide-explain",
    keywords: [
      "what is strontium hydroxide",
      "explain strontium hydroxide",
      "strontium hydroxide",
      "tell me about strontium hydroxide",
      "formula of strontium hydroxide",
      "is strontium hydroxide strong or weak",
      "ph of strontium hydroxide",
    ],
    answer: "Strontium Hydroxide (Sr(OH)2) is a chemical base.\nFormula: Sr(OH)2\nStrength: Strong\nTypical pH: about 13\nUse/Note: Used in the refining of sugar from sugar beet."
  },
  {
    id: "ammonium-hydroxide-explain",
    keywords: [
      "what is ammonium hydroxide",
      "explain ammonium hydroxide",
      "ammonium hydroxide",
      "tell me about ammonium hydroxide",
      "formula of ammonium hydroxide",
      "is ammonium hydroxide strong or weak",
      "ph of ammonium hydroxide",
    ],
    answer: "Ammonium Hydroxide (NH4OH) is a chemical base.\nFormula: NH4OH\nCommon Name: Ammonia water\nStrength: Weak\nTypical pH: about 11.6 (in solution)\nUse/Note: Found in household glass and window cleaners."
  },
  {
    id: "magnesium-hydroxide-explain",
    keywords: [
      "what is magnesium hydroxide",
      "explain magnesium hydroxide",
      "magnesium hydroxide",
      "tell me about magnesium hydroxide",
      "formula of magnesium hydroxide",
      "is magnesium hydroxide strong or weak",
      "ph of magnesium hydroxide",
    ],
    answer: "Magnesium Hydroxide (Mg(OH)2) is a chemical base.\nFormula: Mg(OH)2\nCommon Name: Milk of magnesia\nStrength: Weak\nTypical pH: about 10.5 (in solution)\nUse/Note: Used as an antacid to relieve heartburn and as a laxative."
  },
  {
    id: "aluminium-hydroxide-explain",
    keywords: [
      "what is aluminium hydroxide",
      "explain aluminium hydroxide",
      "aluminium hydroxide",
      "tell me about aluminium hydroxide",
      "formula of aluminium hydroxide",
      "is aluminium hydroxide strong or weak",
      "ph of aluminium hydroxide",
    ],
    answer: "Aluminium Hydroxide (Al(OH)3) is a chemical base.\nFormula: Al(OH)3\nStrength: Weak\nTypical pH: about 9-10 (in solution)\nUse/Note: Used as an antacid and in water purification."
  },
  {
    id: "sodium-bicarbonate-explain",
    keywords: [
      "what is sodium bicarbonate",
      "explain sodium bicarbonate",
      "sodium bicarbonate",
      "tell me about sodium bicarbonate",
      "formula of sodium bicarbonate",
      "is sodium bicarbonate strong or weak",
      "ph of sodium bicarbonate",
    ],
    answer: "Sodium Bicarbonate (NaHCO3) is a chemical base.\nFormula: NaHCO3\nCommon Name: Baking soda\nStrength: Weak\nTypical pH: about 8.3 (in solution)\nUse/Note: Used in baking as a leavening agent and as a mild antacid."
  },
  {
    id: "sodium-carbonate-explain",
    keywords: [
      "what is sodium carbonate",
      "explain sodium carbonate",
      "sodium carbonate",
      "tell me about sodium carbonate",
      "formula of sodium carbonate",
      "is sodium carbonate strong or weak",
      "ph of sodium carbonate",
    ],
    answer: "Sodium Carbonate (Na2CO3) is a chemical base.\nFormula: Na2CO3\nCommon Name: Washing soda\nStrength: Weak\nTypical pH: about 11.6 (in solution)\nUse/Note: Used in glass manufacturing and as a water softener."
  },
  {
    id: "ammonia-explain",
    keywords: [
      "what is ammonia",
      "explain ammonia",
      "ammonia",
      "tell me about ammonia",
      "formula of ammonia",
      "is ammonia strong or weak",
      "ph of ammonia",
    ],
    answer: "Ammonia (NH3) is a chemical base.\nFormula: NH3\nStrength: Weak\nTypical pH: about 11.6 (in solution)\nUse/Note: Used in fertilizers, cleaning products, and industrial refrigeration."
  },
  {
    id: "ph-scale-explain",
    keywords: [
      "what is ph",
      "what is ph scale",
      "explain ph scale",
      "ph scale",
      "what does ph mean",
    ],
    answer: "The pH scale is a measure of how acidic or basic (alkaline) a water-based solution is.\nRange: 0 to 14\n0-6: Acidic (lower number means more acidic)\n7: Neutral (pure water)\n8-14: Basic/Alkaline (higher number means more basic)\nFormula: pH = -log10[H+], where [H+] is the hydrogen ion concentration in moles per liter."
  },
  {
    id: "ph-of-common-substances-explain",
    keywords: [
      "ph of common substances",
      "ph values",
      "ph of everyday items",
      "ph chart",
    ],
    answer: "Different everyday substances have very different pH values.\nBattery acid: about 0\nStomach acid: about 1.5-3.5\nLemon juice: about 2\nVinegar: about 2.4\nBlack coffee: about 5\nPure water: 7 (neutral)\nBaking soda solution: about 8.3\nAmmonia solution: about 11.6\nBleach: about 12.5\nDrain cleaner (sodium hydroxide): about 14"
  },
  {
    id: "strong-acid-explain",
    keywords: [
      "what is a strong acid",
      "explain strong acid",
      "strong acid",
      "define strong acid",
    ],
    answer: "A strong acid is an acid that completely (or almost completely) dissociates, or ionizes, into its ions when dissolved in water.\nThis means nearly 100% of the acid molecules release H+ ions in solution.\nExamples: Hydrochloric acid (HCl), Sulfuric acid (H2SO4), Nitric acid (HNO3), Hydrobromic acid (HBr), Hydroiodic acid (HI), Perchloric acid (HClO4), Chloric acid (HClO3)\nStrong acids typically have a very low pH and are highly reactive/corrosive."
  },
  {
    id: "weak-acid-explain",
    keywords: [
      "what is a weak acid",
      "explain weak acid",
      "weak acid",
      "define weak acid",
    ],
    answer: "A weak acid is an acid that only partially dissociates into its ions when dissolved in water, establishing an equilibrium between the undissociated acid and its ions.\nThis means only a small fraction of the acid molecules release H+ ions in solution.\nExamples: Acetic acid (CH3COOH), Citric acid, Carbonic acid (H2CO3), Formic acid (HCOOH), Lactic acid, Oxalic acid, Boric acid, Hydrofluoric acid (HF)\nWeak acids generally have a higher pH than strong acids of the same concentration and are less corrosive."
  },
  {
    id: "strong-base-explain",
    keywords: [
      "what is a strong base",
      "explain strong base",
      "strong base",
      "define strong base",
    ],
    answer: "A strong base is a base that completely (or almost completely) dissociates into its ions when dissolved in water.\nThis means nearly 100% of the base molecules release OH- ions in solution.\nExamples: Sodium hydroxide (NaOH), Potassium hydroxide (KOH), Calcium hydroxide (Ca(OH)2), Barium hydroxide (Ba(OH)2), Lithium hydroxide (LiOH), Strontium hydroxide (Sr(OH)2)\nStrong bases typically have a very high pH (close to 14) and are highly caustic/corrosive."
  },
  {
    id: "weak-base-explain",
    keywords: [
      "what is a weak base",
      "explain weak base",
      "weak base",
      "define weak base",
    ],
  answer: "A weak base is a base that only partially dissociates into its ions when dissolved in water, establishing an equilibrium between the undissociated base and its ions.\nThis means only a small fraction of the base molecules release OH- ions in solution.\nExamples: Ammonia (NH3), Ammonium hydroxide (NH4OH), Magnesium hydroxide (Mg(OH)2), Aluminium hydroxide (Al(OH)3), Sodium bicarbonate (NaHCO3)\nWeak bases generally have a lower pH than strong bases of the same concentration and are milder/less corrosive."
  },
  {
    id: "poh-explain",
    keywords: [
      "what is poh",
      "explain poh",
      "poh scale",
      "poh formula",
    ],
    answer: "pOH is a measure of the hydroxide ion (OH-) concentration in a solution, and is the counterpart to pH.\nFormula: pOH = -log10[OH-]\nRelationship to pH: pH + pOH = 14 (at 25 degrees Celsius)\nA low pOH means a highly basic (alkaline) solution; a high pOH means a highly acidic solution."
  },
  {
    id: "acid-base-indicators-explain",
    keywords: [
      "what is an indicator",
      "acid base indicators",
      "litmus paper",
      "phenolphthalein",
      "universal indicator",
    ],
    answer: "An acid-base indicator is a substance that changes color depending on whether it is in an acidic or basic solution, used to estimate pH.\nLitmus paper: turns red in acids, blue in bases\nPhenolphthalein: colorless in acids, pink/magenta in bases\nMethyl orange: red in acids, yellow in bases\nUniversal indicator: changes through a range of colors (red to purple) corresponding to the full pH scale"
  },
  {
    id: "properties-of-acids-explain",
    keywords: [
      "properties of acids",
      "characteristics of acids",
      "what are the properties of an acid",
    ],
    answer: "Acids share several common chemical and physical properties.\nTaste sour (should never be tasted directly in a lab)\nTurn blue litmus paper red\nHave a pH below 7\nReact with metals to produce hydrogen gas\nReact with bases in neutralization reactions to form a salt and water\nReact with carbonates to produce carbon dioxide gas\nConduct electricity when dissolved in water, since they form ions"
  },
  {
    id: "properties-of-bases-explain",
    keywords: [
      "properties of bases",
      "characteristics of bases",
      "what are the properties of a base",
    ],
    answer: "Bases share several common chemical and physical properties.\nTaste bitter and feel slippery or soapy to the touch (should never be tasted or touched directly in a lab)\nTurn red litmus paper blue\nHave a pH above 7\nReact with acids in neutralization reactions to form a salt and water\nMany bases are soluble in water and are called alkalis\nConduct electricity when dissolved in water, since they form ions"
  },
  {
    id: "neutral-substances-explain",
    keywords: [
      "what is neutral ph",
      "neutral substances",
      "ph 7",
      "what is a neutral solution",
    ],
    answer: "A neutral substance is neither acidic nor basic.\nNeutral substances have a pH of exactly 7 at 25 degrees Celsius.\nPure water is the most common example of a neutral substance.\nIn a neutral solution, the concentration of H+ ions equals the concentration of OH- ions."
  },
  
    // ====================================================
  //ARTIFICIAL INTELLIGENCE RELATED 
  //======================================================
  
  {
    id: "deep-learning-explain",
    keywords: [
      "what is deep learning",
      "explain deep learning",
      "tell me what is deep learning",
      "please tell me what is deep learning",
      "can you tell me what is deep learning",
      "tell what is deep learning"
    ],
    answer: "Deep Learning is a subset of ML (Machine Learning) . Machine Learning enables a machine to learn from the data using algorithms to perform a task without being explicitly programed. Whereas, Deep Learning enables a machine to learn to think by using the complex structure of algorithms modelled on human brain.\nIt is essentially a neural network with three or more layers. Using this neural networks, a machine is able to simulate the behaviour of human brain and is able to learn from large amount of data. To provide impressive results, Deep Learning requires large amount of labelled data and substantial computing power.\nFact File\nThe concept of Deep Learning was introduced in 1943, when Walter Pitts and Warren McCulloch created a computer model based on the neural network of human brain.\nSome real life example of Deep Learning are:\n\nA. Driverless Cars: Driverless cars, also known as automated cars which can run on road without human intervention. These Cars are able to identify the trafic signals and recognize the stop sign or distinguish between a pedestrian and lamppost.\nB. Aerospace and Defense: Deep Learning is also used in the field of aerospace and defence to identify safe or unsafe zones for troops.\nC. Medical Research: Deep Learning us used in Medical Research where it is able to detect cancer cells. Teams at UCLA (University of Californi, Los Angeles) has built an advanced microscope which makes use of high-dimensional data sets to train a deep learning programs which can identify cancer cells more."
  },


  // =========================================================
  // TECHNOLOGY 
  // =========================================================
  {
    id: "explain-vr",
    keywords: [
      "what is vr",
      "explain vr",
      "tell me what is vr",
      "can you tell me what is vr",
      "please tell me what is vr",
      "what is virtual reality",
      "explain me what is virtual reality",
      "tell me what is virtual reality",
      "can you tell me what is virtual reality",
      "please tell me what is vr",
      "please tell me what is virtual reality "
    ],
    answer: "VR (Virtual Reality) provides a completely computer-generated environment. This artificial environment provides a 3-dimensional (3D) view to it's users. It facilitates the user to step inside it and interact with the 3D world that can either simulate or completely differ from the real world. It provides the 360⁰ view of the virtual world.\nIn order to experience the Virtual world, you meed to wear gears, such as VR Googles, VR Headse, VR Gloves and VR Body Suit. When you wear these gears and enter in the virtual world, you can experience through vision, hearing and sometime touch senses.\n\nFor example:\nThe simulation of the real world is provided to the soldiers or pilots for training purposes."
  },
  {
    id: "explain_ar",
    keywords: [
      "what is ar",
      "explain ar",
      "tell me what is ar",
      "can you tell me what is ar",
      "please tell me what is ar",
      "what is augmented reality",
      "explain me what is augmented reality",
      "tell me what is augmented reality",
      "can you tell me what is augmented reality",
      "please tell me what is ar",
      "please tell me what is augmented reality "
    ],
    answer: "AR (Augmented Reality) is different from Virtual reality in that virtual reality creates a complete virtual and digital environment whereas, Augmented Reality uses the real-world environment and overlays new information on it by putting virtual objects in the real time. These virtual objects can ne text, graphic, audio or virtual enhancements.\nAugmented reality is basically used to enhance the objects that reside in the real-world by adding computer-genrated perceptual information in it. It includes three basic features:\n1. Combination of real world and virtual world\n2. Interaction at real time\n3. 3D registration of virtual objects and real objects"
  },
  
  
  // =========================================================
  // PHYSICS 
  // =========================================================
  
  // LAWS OF NEWTON
  
{
  id: "newtons-first-law",
  keywords: [
    "newton first law",
    "first law of motion",
    "law of inertia",
    "newton's first law"
  ],
  answer: `Newton's First Law of Motion is also called the Law of Inertia.\n\nIt states:\n"An object remains at rest or continues to move with uniform velocity in a straight line unless acted upon by an external unbalanced force."\n\nExample:\nA book lying on a table remains at rest until someone moves it.\n\nFormula:\nThere is no special formula for the first law, but when the net force is zero:\nF_net = 0`
},

{
  id: "newtons-second-law",
  keywords: [
    "newton second law",
    "second law of motion",
    "newton's second law",
    "force mass acceleration"
  ],
  answer: `Newton's Second Law of Motion describes how force changes the motion of an object.\n\nIt states:\n"The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass."\n\nFormula:\nF = ma\n\nWhere:\nF = force in newtons (N)\nm = mass in kilograms (kg)\na = acceleration in metres per second squared (m/s²)\n\nExample:\nIf a 2 kg object accelerates at 3 m/s²:\n\nF = ma\nF = 2 × 3\nF = 6 N`
},

{
  id: "newtons-third-law",
  keywords: [
    "newton third law",
    "third law of motion",
    "newton's third law",
    "action reaction law"
  ],
  answer: `Newton's Third Law of Motion states:\n\n"For every action, there is an equal and opposite reaction."\n\nThis means that when one object exerts a force on another object, the second object exerts an equal force in the opposite direction.\n\nExample:\nWhen you push against a wall, the wall pushes back on you.\n\nAnother example:\nA rocket moves upward because gases are expelled downward`
},
  {
    id: "newtons-laws-of-motion",
    keywords: [
      "three laws of newton",
      "newtons laws",
      "laws of motion",
      "newton laws of motion"
    ],
    answer: "Newton's Three Laws of Motion:\n\n1. First Law — Law of Inertia\n\nAn object remains at rest or in uniform motion unless an external unbalanced force acts on it.\n\n2. Second Law\nThe net force on an object equals its mass multiplied by its acceleration.\n\nFormula: F = ma\n\n3. Third Law\n\nFor every action, there is an equal and opposite reaction."
  }
  
];