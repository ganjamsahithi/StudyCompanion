import React from 'react';
import './Dashboard.css';

const LearningProfileCard = () => {
    // Mock data based on Chat/Quiz history
    const weakConcepts = [
        { concept: 'Graph Traversal', course: 'Data Structures' },
        { concept: 'Thermodynamics', course: 'Physics' },
        { concept: 'The Renaissance', course: 'Art History' },
    ];
    
    return (
        <div className="card learning-profile">
            <h3>📉 Weakness Profile</h3>
            <p>Concepts identified from recent quizzes and chat history:</p>
            <ul>
                {weakConcepts.map((item, index) => (
                    <li key={index}>
                        <span className="concept-tag">{item.concept}</span> 
                        <span className="course-name">({item.course})</span>
                        <button className="remediate-btn">Review</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default LearningProfileCard;