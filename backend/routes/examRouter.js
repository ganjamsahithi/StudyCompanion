// backend/routes/examRouter.js
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Import models (adjust paths based on your structure)
const Task = require('../models/Task');
const Document = require('../models/Document');

/**
 * GET /exam/predict/:courseName
 * Generate exam predictions for a specific course
 */
router.get('/predict/:courseName', async (req, res) => {
    try {
        const { courseName } = req.params;
        console.log('📚 Generating exam prediction for:', courseName);

        // 1. Find the exam task for this course
        const examTask = await Task.findOne({
            courseName: courseName,
            taskType: 'Exam'
        }).sort({ dueDate: 1 }); // Get the nearest exam

        if (!examTask) {
            return res.status(404).json({
                message: `No exam found for course "${courseName}". Create an exam task first.`
            });
        }

        // 2. Find all documents/notes for this course
        const documents = await Document.find({
            courseName: courseName
        });

        if (documents.length === 0) {
            return res.status(404).json({
                message: `No documents found for "${courseName}". Upload course notes first.`
            });
        }

        // 3. Calculate days until exam
        const today = new Date();
        const examDate = new Date(examTask.dueDate);
        const daysUntilExam = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));

        // 4. Prepare document summaries for AI
        const documentSummaries = documents
            .map((doc, idx) => `${idx + 1}. ${doc.fileName}: ${doc.summary || 'No summary available'}`)
            .join('\n');

        // 5. Create AI prompt
        const aiPrompt = `
You are an expert academic AI assistant specializing in exam preparation.

**Course:** ${courseName}
**Exam:** ${examTask.taskName}
**Exam Date:** ${examTask.dueDate}
**Days Until Exam:** ${daysUntilExam}
**Documents Analyzed:** ${documents.length}

**Course Materials:**
${documentSummaries}

Based on the above materials, generate a comprehensive exam preparation report in JSON format:

{
  "examDate": "${examTask.dueDate}",
  "topicsCount": <number of important topics>,
  "estimatedHours": <realistic study hours needed>,
  "documentsAnalyzed": ${documents.length},
  "studyTip": "<personalized tip based on days remaining>",
  "weakAreas": ["<topic1>", "<topic2>", "<topic3>"],
  "importantTopics": [
    {
      "topic": "<topic name>",
      "priority": "High|Medium|Low",
      "description": "<why this is important>",
      "estimatedTime": "X hours"
    }
  ],
  "practiceQuestions": [
    {
      "question": "<detailed practice question>",
      "difficulty": "Easy|Medium|Hard",
      "topic": "<related topic>",
      "estimatedTime": "X minutes"
    }
  ],
  "studyPlan": [
    {
      "startDate": "<date>",
      "endDate": "<date>",
      "tasks": [
        "<task description 1>",
        "<task description 2>"
      ]
    }
  ]
}

**Requirements:**
1. Identify 5-8 most important topics from the materials
2. Generate 8-12 practice questions covering all topics
3. Create a realistic study plan from today (${today.toISOString().split('T')[0]}) until exam
4. If exam is within 7 days, emphasize "URGENT - Focus on high-priority topics only"
5. Estimate 1-3 hours per topic for study
6. Practice questions should test understanding, not just memorization
7. Study plan should divide work into manageable weekly chunks

Return ONLY valid JSON, no additional text or markdown.
`;

        // 6. Call Gemini AI
        console.log('🤖 Calling Gemini AI...');
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(aiPrompt);
        const responseText = result.response.text();

        // 7. Parse JSON response
        console.log('📥 AI Response received');
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            console.error('❌ AI did not return valid JSON');
            throw new Error('AI response parsing failed');
        }

        const predictionData = JSON.parse(jsonMatch[0]);

        // 8. Add metadata
        predictionData.courseName = courseName;
        predictionData.examTaskId = examTask._id;
        predictionData.generatedAt = new Date();

        console.log('✅ Prediction generated successfully');
        res.json(predictionData);

    } catch (error) {
        console.error('❌ Exam Prediction Error:', error);
        res.status(500).json({
            message: 'Failed to generate exam prediction',
            error: error.message,
            details: 'Check server logs for more information'
        });
    }
});

module.exports = router;