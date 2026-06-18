"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, PenTool, Copy, Check, Loader2, Eraser } from "lucide-react";
import toast from "react-hot-toast";
import { generateContent } from "@/app/ai-actions"; // Server Action Import

export default function MiniWriterPage() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professional");
  const [language, setLanguage] = useState("English");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return toast.error("Please enter a topic first!");

    setLoading(true);
    setResult(""); // Reset previous result

    // Prompt Engineering (Magic happens here)
    const prompt = `Write a creative mini-article about "${topic}".
    Tone: ${tone}.
    Language: ${language}.
    Structure: catchy headline, engaging intro, 3 bullet points, and a conclusion.
    Keep it under 200 words. Use emojis where appropriate.`;

    const response = await generateContent(prompt);

    if (response.success) {
      setResult(response.text);
      toast.success("Content Generated! 🎉");
    } else {
      toast.error(response.error);
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 sm:px-6 pt-24 pb-16">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="chip inline-flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4" style={{ color: "var(--pink-600)" }} /> AI Powered Tool
        </div>
        <h1 className="font-display grad-text text-4xl md:text-5xl mb-2">
          Mini Content Writer
        </h1>
        <p style={{ color: "var(--muted)" }}>
          Generate engaging social media posts or mini-articles in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Input Section */}
        <div className="card p-6 h-fit">
          <div className="space-y-5">
            {/* Topic Input */}
            <div>
              <label className="field-label">What is your topic?</label>
              <textarea
                className="field-textarea rounded-xl p-4"
                style={{ minHeight: "120px", resize: "none" }}
                placeholder="e.g. Benefits of waking up early..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Select Tone</label>
                <select
                  className="field-select rounded-lg p-3"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                >
                  <option>Professional</option>
                  <option>Funny & Witty</option>
                  <option>Casual & Friendly</option>
                  <option>Inspirational</option>
                  <option>Educational</option>
                </select>
              </div>
              <div>
                <label className="field-label">Language</label>
                <select
                  className="field-select rounded-lg p-3"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option>English</option>
                  <option>Bengali</option>
                  <option>Swedish</option>
                  <option>Spanish</option>
                </select>
              </div>
            </div>

            {/* Generate Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={loading}
              className="btn btn-primary w-full py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? "Writing Magic..." : "Generate Content"}
            </motion.button>
          </div>
        </div>

        {/* RIGHT: Output Section */}
        <div className="card p-6 relative flex flex-col" style={{ minHeight: "400px" }}>
          <div
            className="flex justify-between items-center mb-4 pb-3"
            style={{ borderBottom: "1px solid var(--line)" }}
          >
            <h3 className="font-bold flex items-center gap-2" style={{ color: "var(--ink-2)" }}>
              <PenTool className="w-4 h-4" style={{ color: "var(--pink)" }} /> Result
            </h3>
            <div className="flex gap-2">
              {result && (
                <>
                  <button
                    onClick={() => setResult("")}
                    className="btn btn-ghost p-2 rounded-lg"
                    title="Clear"
                  >
                    <Eraser className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCopy}
                    className="btn btn-ghost p-2 rounded-lg"
                    title="Copy"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" style={{ color: "var(--green)" }} />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          <div
            className="flex-1 rounded-xl p-4 overflow-y-auto"
            style={{
              background: "var(--bg-tint)",
              border: "1px solid var(--line)",
              maxHeight: "500px",
            }}
          >
            {loading ? (
              <div
                className="h-full flex flex-col items-center justify-center space-y-3"
                style={{ color: "var(--muted)" }}
              >
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--pink)" }} />
                <p className="text-sm animate-pulse">Gemini is thinking...</p>
              </div>
            ) : result ? (
              <div
                className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed"
                style={{ color: "var(--ink-2)" }}
              >
                {result}
              </div>
            ) : (
              <div
                className="h-full flex flex-col items-center justify-center"
                style={{ color: "var(--faint)" }}
              >
                <Sparkles className="w-12 h-12 mb-2" />
                <p>Your AI content will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
