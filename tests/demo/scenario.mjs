export default {
  title: "Mesh Daily Question",
  description: "A private room where each peer leaves one answer to today’s rotating prompt.",
  steps: [
    { action: "wait", ms: 900 },
    { action: "click", selector: "textarea" },
    { action: "type", text: "A slow cup of coffee before the messages arrive." },
    { action: "click", selector: ".primary" },
    { action: "wait", ms: 800 },
  ],
};
