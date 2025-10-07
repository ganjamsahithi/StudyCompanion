import React, { useState } from 'react';
import './Quiz.css';

const sampleQuiz = {
    title: "Data Structures: Graph Traversal Quick Quiz",
    questions: [
        { id: 1, text: "Which algorithm uses a stack to find the next vertex?", type: "MCQ", options: ["BFS", "DFS", "Dijkstra"], answer: "DFS" },
        { id: 2, text: "True or False: BFS is generally better for finding the shortest path in an unweighted graph.", type: "TrueFalse", answer: "True" },
        { id: 3, text: "Briefly explain the key difference in memory usage between BFS and DFS.", type: "ShortAnswer", answer: "BFS may require more memory to store pointers to sibling nodes, while DFS generally uses less memory because it only needs to store nodes on the current path." }
    ]
};

const QuizInterface = ({ setActiveSection }) => {
    const [currentQuiz, setCurrentQuiz] = useState(sampleQuiz);
    const [answers, setAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(null);

    const handleAnswerChange = (id, value) => {
        setAnswers(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = () => {
        // --- Backend Simulation ---
        let correctAnswers = 0;
        currentQuiz.questions.forEach(q => {
            if (q.type === 'MCQ' || q.type === 'TrueFalse') {
                if (answers[q.id] === q.answer) {
                    correctAnswers++;
                }
            } else if (q.type === 'ShortAnswer') {
                // Simplified scoring: just checking if an answer was provided
                if (answers[q.id] && answers[q.id].length > 5) {
                    correctAnswers++; 
                }
            }
        });
        
        setScore(correctAnswers);
        setIsSubmitted(true);
        // In a real application, you'd send answers to Python/LLM for advanced scoring
        // and update the Learning Profile here.
    };

    if (isSubmitted) {
        return (
            <div className="quiz-container">
                <div className="quiz-results card">
                    <h2>Quiz Results: {currentQuiz.title}</h2>
                    <p className="final-score">
                        You scored: **{score} / {currentQuiz.questions.length}**
                    </p>
                    <div className="feedback-section">
                        <h3>Detailed Feedback</h3>
                        {currentQuiz.questions.map(q => (
                            <div key={q.id} className={`feedback-item ${answers[q.id] === q.answer ? 'correct' : 'incorrect'}`}>
                                <p><strong>Q:</strong> {q.text}</p>
                                <p><strong>Your Answer:</strong> {answers[q.id] || '[No Answer]'}</p>
                                <p><strong>Correct Answer:</strong> {q.answer}</p>
                                {/* In a real app, the backend provides detailed rationale */}
                                {answers[q.id] !== q.answer && <p className="rationale">Rationale: Misunderstanding of queue/stack usage.</p>}
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setActiveSection('dashboard')}>Back to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="quiz-container">
            <h2>{currentQuiz.title}</h2>
            <div className="quiz-form card">
                {currentQuiz.questions.map(q => (
                    <div key={q.id} className="question-item">
                        <p><strong>{q.id}.</strong> {q.text}</p>
                        {q.type === 'MCQ' && (
                            <div className="options">
                                {q.options.map(opt => (
                                    <label key={opt}>
                                        <input
                                            type="radio"
                                            name={`q-${q.id}`}
                                            value={opt}
                                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                        /> {opt}
                                    </label>
                                ))}
                            </div>
                        )}
                        {q.type === 'TrueFalse' && (
                            <div className="options">
                                <label><input type="radio" name={`q-${q.id}`} value="True" onChange={(e) => handleAnswerChange(q.id, e.target.value)} /> True</label>
                                <label><input type="radio" name={`q-${q.id}`} value="False" onChange={(e) => handleAnswerChange(q.id, e.target.value)} /> False</label>
                            </div>
                        )}
                        {q.type === 'ShortAnswer' && (
                             <textarea 
                                rows="3" 
                                placeholder="Type your answer here..."
                                value={answers[q.id] || ''}
                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                             />
                        )}
                    </div>
                ))}
                <button onClick={handleSubmit} className="submit-quiz-btn">Submit Quiz</button>
            </div>
        </div>
    );
};

export default QuizInterface;