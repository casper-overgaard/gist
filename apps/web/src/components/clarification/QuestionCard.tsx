"use client";

import { ClarificationQuestion } from "@signalboard/domain";
import { useSessionStore } from "@/store/useSessionStore";
import { useState } from "react";

interface QuestionCardProps {
  question: ClarificationQuestion;
  sessionId: string;
}

export default function QuestionCard({ question, sessionId }: QuestionCardProps) {
  const { answerQuestion } = useSessionStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [submitted, setSubmitted] = useState(question.status === "answered");

  const handleSubmit = async () => {
    if (submitted) return;

    let answerValue: string | string[];
    if (question.questionType === "free_text") {
      if (!freeText.trim()) return;
      answerValue = freeText.trim();
    } else if (question.questionType === "multi_select") {
      if (selected.length === 0) return;
      answerValue = selected;
    } else {
      if (selected.length === 0) return;
      answerValue = selected[0];
    }

    await answerQuestion(sessionId, {
      id: crypto.randomUUID(),
      questionId: question.id,
      sessionId,
      answerValue,
      createdAt: new Date().toISOString(),
    });

    setSubmitted(true);
  };

  const toggleOption = (opt: string) => {
    if (question.questionType === "single_select") {
      setSelected([opt]);
    } else {
      setSelected((prev) =>
        prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
      );
    }
  };

  return (
    <div className={`rounded-lg border p-4 transition-all ${submitted ? "border-green-800 bg-green-950/30 opacity-60" : "border-neutral-700 bg-neutral-900"}`}>
      <p className="text-sm text-neutral-200 mb-3 font-medium leading-snug">{question.prompt}</p>

      {(question.questionType === "single_select" || question.questionType === "multi_select") && !submitted && (
        <div className="flex flex-col gap-2 mb-3">
          {question.options?.map((opt) => (
            <button
              key={opt}
              onClick={() => toggleOption(opt)}
              className={`text-left text-xs px-3 py-2 rounded border transition-colors ${
                selected.includes(opt)
                  ? "border-blue-500 bg-blue-500/20 text-blue-300"
                  : "border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-600"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {question.questionType === "free_text" && !submitted && (
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="Type your answer..."
          className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-xs text-white outline-none focus:border-neutral-500 resize-none mb-3"
          rows={3}
        />
      )}

      {submitted ? (
        <p className="text-xs text-green-500">✓ Answered</p>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={submitted}
          className="text-xs px-3 py-1.5 bg-white text-black rounded hover:bg-neutral-200 transition-colors font-medium"
        >
          Submit
        </button>
      )}
    </div>
  );
}
