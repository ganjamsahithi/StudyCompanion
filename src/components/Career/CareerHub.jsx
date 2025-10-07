import React, { useState } from 'react';
import './Career.css';

const CareerHub = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCareer, setSelectedCareer] = useState('software-engineer');

  // Mock data - will be replaced with API calls
  const careerPaths = [
    { id: 'software-engineer', name: 'Software Engineer', icon: '💻' },
    { id: 'data-scientist', name: 'Data Scientist', icon: '📊' },
    { id: 'web-developer', name: 'Web Developer', icon: '🌐' },
    { id: 'ai-ml-engineer', name: 'AI/ML Engineer', icon: '🤖' }
  ];

  const mockCareerData = {
    'software-engineer': {
      title: 'Software Engineer',
      description: 'Design, develop, and maintain software applications.',
      currentSkills: [
        { skill: 'Data Structures & Algorithms', level: 75, course: 'CS 301' },
        { skill: 'Object-Oriented Programming', level: 80, course: 'CS 201' },
        { skill: 'Database Management', level: 60, course: 'CS 401' },
        { skill: 'Version Control (Git)', level: 70, course: 'Self-taught' }
      ],
      skillsNeeded: [
        { skill: 'System Design', level: 0, priority: 'High', timeToLearn: '3 months' },
        { skill: 'Cloud Computing (AWS/Azure)', level: 0, priority: 'High', timeToLearn: '2 months' },
        { skill: 'API Development (REST/GraphQL)', level: 30, priority: 'Medium', timeToLearn: '1 month' },
        { skill: 'Testing & CI/CD', level: 20, priority: 'Medium', timeToLearn: '1 month' }
      ],
      courseConnections: [
        { course: 'Data Structures - CS 301', realWorldApp: 'Optimizing search algorithms in e-commerce platforms', companies: ['Amazon', 'Google'], example: 'Graph algorithms are used in social network connections, route optimization in GPS apps, and recommendation systems.', projectIdea: '🚀 Build a recommendation engine using graph traversal' },
        { course: 'Database Management - CS 401', realWorldApp: 'Designing scalable database architectures', companies: ['Meta', 'Netflix'], example: 'SQL optimization techniques help streaming platforms serve millions of users simultaneously without lag.', projectIdea: '🚀 Create a movie database with advanced query optimization' },
        { course: 'Thermodynamics - PHYS 201', realWorldApp: 'Data center cooling and energy efficiency', companies: ['Google Cloud', 'AWS'], example: 'Understanding heat transfer helps design efficient server cooling systems, reducing operational costs.', projectIdea: '🚀 Model energy consumption patterns for cloud infrastructure' }
      ],
      internships: [
        { id: 1, company: 'Google', position: 'Software Engineering Intern', location: 'Mountain View, CA', duration: 'Summer 2026', skills: ['Python', 'Data Structures', 'System Design'], matchScore: 85, deadline: '2025-11-15', stipend: '$8,000/month' },
        { id: 2, company: 'Microsoft', position: 'SWE Intern - Cloud Services', location: 'Redmond, WA', duration: 'Summer 2026', skills: ['C++', 'Cloud Computing', 'Algorithms'], matchScore: 78, deadline: '2025-12-01', stipend: '$7,500/month' },
        { id: 3, company: 'Startup: TechVision', position: 'Full-Stack Developer Intern', location: 'San Francisco, CA', duration: 'Jan-May 2026', skills: ['React', 'Node.js', 'MongoDB'], matchScore: 72, deadline: '2025-10-30', stipend: '$5,000/month + equity' }
      ],
      portfolioProjects: [
        { id: 1, title: 'E-Commerce Platform', courses: ['CS 301 - Data Structures', 'CS 401 - Databases'], skills: ['Full-Stack Development', 'Payment Integration'], impact: 'Demonstrates ability to build production-ready applications', features: ['Product search using optimized algorithms (Binary Search Trees)', 'User authentication and session management'], githubStars: 45, liveDemo: 'https://myshop-demo.com' },
        { id: 2, title: 'Real-Time Chat Application', courses: ['CS 301 - Data Structures', 'CS 501 - Networks'], skills: ['WebSockets', 'Real-time Systems'], impact: 'Shows understanding of network protocols and real-time data', features: ['One-on-one and group messaging', 'File sharing and media upload'], githubStars: 32, liveDemo: 'https://mychat-app.com' },
        { id: 3, title: 'Social Network Analysis Tool', courses: ['CS 301 - Data Structures'], skills: ['Graph Algorithms', 'Data Visualization'], impact: 'Perfect for showcasing graph algorithm expertise', features: ['Visualize network connections using D3.js', 'Find shortest path between users (Dijkstra)'], githubStars: 28, liveDemo: 'https://network-viz.com' }
      ],
      learningPath: {
        immediate: [{ resource: 'System Design Primer (GitHub)', type: 'Documentation', time: '4 weeks' }, { resource: 'AWS Cloud Practitioner Certification', type: 'Course', time: '6 weeks' }, { resource: 'LeetCode - Top 75 Questions', type: 'Practice', time: 'Ongoing' }],
        shortTerm: [{ resource: 'Docker & Kubernetes Fundamentals', type: 'Course', time: '3 weeks' }, { resource: 'REST API Best Practices', type: 'Tutorial', time: '2 weeks' }, { resource: 'Build 3 Full-Stack Projects', type: 'Project', time: '8 weeks' }],
        longTerm: [{ resource: 'Contribute to Open Source (React, Node.js)', type: 'Community', time: '6 months' }, { resource: 'Advanced System Design', type: 'Course', time: '3 months' }, { resource: 'Mock Interviews on Pramp', type: 'Practice', time: 'Ongoing' }]
      }
    }
  };

  const careerData = mockCareerData[selectedCareer];

  const getSkillColor = (level) => {
    if (level >= 70) return '#4caf50';
    if (level >= 40) return '#ff9800';
    return '#f44336';
  };

  return (
    <div className="career-path">
      <div className="career-header">
        <h2>🎯 Career Path Integration</h2>
        <p>Connect your coursework to real-world careers and opportunities</p>
      </div>

      {/* Career Selection */}
      <div className="career-selector">
        <label>Explore Career Path:</label>
        <div className="career-options">
          {careerPaths.map(career => (
            <button
              key={career.id}
              className={selectedCareer === career.id ? 'career-btn active' : 'career-btn'}
              onClick={() => setSelectedCareer(career.id)}
            >
              <span className="career-icon">{career.icon}</span>
              <span className="career-name">{career.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Career Overview Card */}
      <div className="career-overview-card">
        <h3>{careerData.title}</h3>
        <p>{careerData.description}</p>
        
        <div className="skills-progress">
          <div className="progress-header">
            <span>Your Progress</span>
            <span className="progress-percent">
              {Math.round(careerData.currentSkills.reduce((acc, s) => acc + s.level, 0) / careerData.currentSkills.length)}%
            </span>
          </div>
          <div className="overall-progress-bar">
            <div 
              className="overall-progress-fill"
              style={{ 
                width: `${careerData.currentSkills.reduce((acc, s) => acc + s.level, 0) / careerData.currentSkills.length}%` 
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="career-tabs">
        <button 
          className={activeTab === 'overview' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('overview')}
        >
          📈 Skills Overview
        </button>
        <button 
          className={activeTab === 'connections' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('connections')}
        >
          🔗 Course Connections
        </button>
        <button 
          className={activeTab === 'internships' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('internships')}
        >
          💼 Internships
        </button>
        <button 
          className={activeTab === 'portfolio' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('portfolio')}
        >
          🚀 Portfolio Projects
        </button>
      </div>

      {/* Tab Content */}
      <div className="career-tab-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="skills-grid">
              <div className="skills-column">
                <h3>✅ Your Current Skills</h3>
                <div className="skills-list">
                  {careerData.currentSkills.map((skill, idx) => (
                    <div key={idx} className="skill-card">
                      <div className="skill-header">
                        <span className="skill-name">{skill.skill}</span>
                        <span className="skill-level">{skill.level}%</span>
                      </div>
                      <div className="skill-bar">
                        <div 
                          className="skill-fill"
                          style={{ 
                            width: `${skill.level}%`,
                            background: getSkillColor(skill.level)
                          }}
                        />
                      </div>
                      <span className="skill-source">From: {skill.course}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="skills-column">
                <h3>🎯 Skills to Develop</h3>
                <div className="skills-list">
                  {careerData.skillsNeeded.map((skill, idx) => (
                    <div key={idx} className="skill-card needed">
                      <div className="skill-header">
                        <span className="skill-name">{skill.skill}</span>
                        <span className={`priority-badge ${skill.priority.toLowerCase()}`}>
                          {skill.priority}
                        </span>
                      </div>
                      <div className="skill-bar">
                        <div 
                          className="skill-fill"
                          style={{ width: `${skill.level}%`, background: '#9e9e9e' }}
                        />
                      </div>
                      <div className="skill-footer">
                        <span className="time-estimate">⏱️ {skill.timeToLearn}</span>
                        <button className="learn-btn">Start Learning →</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Learning Path */}
            <div className="learning-path-section">
              <h3>📚 Recommended Learning Path</h3>
              <div className="learning-timeline">
                <div className="timeline-phase">
                  <div className="phase-label">Immediate (Now)</div>
                  <div className="resources-list">
                    {careerData.learningPath.immediate.map((resource, idx) => (
                      <div key={idx} className="resource-item">
                        <span className="resource-icon">
                          {resource.type === 'Course' ? '🎓' : 
                            resource.type === 'Practice' ? '💪' : '📖'}
                        </span>
                        <div className="resource-info">
                          <div className="resource-name">{resource.resource}</div>
                          <div className="resource-meta">
                            {resource.type} • {resource.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="timeline-phase">
                  <div className="phase-label">Short-term (1-3 months)</div>
                  <div className="resources-list">
                    {careerData.learningPath.shortTerm.map((resource, idx) => (
                      <div key={idx} className="resource-item">
                        <span className="resource-icon">
                          {resource.type === 'Course' ? '🎓' : 
                            resource.type === 'Project' ? '🚀' : '📖'}
                        </span>
                        <div className="resource-info">
                          <div className="resource-name">{resource.resource}</div>
                          <div className="resource-meta">
                            {resource.type} • {resource.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="timeline-phase">
                  <div className="phase-label">Long-term (3-6 months)</div>
                  <div className="resources-list">
                    {careerData.learningPath.longTerm.map((resource, idx) => (
                      <div key={idx} className="resource-item">
                        <span className="resource-icon">
                          {resource.type === 'Community' ? '👥' : 
                            resource.type === 'Practice' ? '💪' : '🎓'}
                        </span>
                        <div className="resource-info">
                          <div className="resource-name">{resource.resource}</div>
                          <div className="resource-meta">
                            {resource.type} • {resource.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="connections-section">
            <div className="connections-intro">
              <h3>🔗 How Your Courses Apply to Real-World Work</h3>
              <p>See exactly how what you're learning translates to professional scenarios</p>
            </div>

            <div className="connections-list">
              {careerData.courseConnections.map((connection, idx) => (
                <div key={idx} className="connection-card">
                  <div className="connection-header">
                    <h4>{connection.course}</h4>
                    <div className="companies-tag">
                      Used at: {connection.companies.join(', ')}
                    </div>
                  </div>

                  <div className="connection-body">
                    <div className="real-world-app">
                      <strong>💼 Real-World Application:</strong>
                      <p>{connection.realWorldApp}</p>
                    </div>

                    <div className="example-box">
                      <strong>💡 Example:</strong>
                      <p>{connection.example}</p>
                    </div>

                    <div className="project-suggestion">
                      {connection.projectIdea}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'internships' && (
          <div className="internships-section">
            <div className="internships-header">
              <h3>💼 Recommended Internships</h3>
              <p>Based on your current skills and career goals</p>
            </div>

            <div className="internships-list">
              {careerData.internships.map((internship) => (
                <div key={internship.id} className="internship-card">
                  <div className="internship-header">
                    <div className="company-info">
                      <h4>{internship.company}</h4>
                      <p className="position">{internship.position}</p>
                    </div>
                    <div className="match-score">
                      <div className="match-circle" style={{ 
                        background: `conic-gradient(#4caf50 ${internship.matchScore * 3.6}deg, #e0e0e0 0deg)` 
                      }}>
                        <div className="match-inner">{internship.matchScore}%</div>
                      </div>
                      <span className="match-label">Match</span>
                    </div>
                  </div>

                  <p className="internship-description">{internship.description}</p>

                  <div className="internship-details">
                    <div className="detail-item">
                      <span className="detail-icon">📍</span>
                      <span>{internship.location}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">📅</span>
                      <span>{internship.duration}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">💰</span>
                      <span>{internship.stipend}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">⏰</span>
                      <span>Deadline: {internship.deadline}</span>
                    </div>
                  </div>

                  <div className="required-skills">
                    <strong>Required Skills:</strong>
                    <div className="skills-tags">
                      {internship.skills.map((skill, idx) => (
                        <span key={idx} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>

                  <div className="internship-actions">
                    <button className="apply-btn">Apply Now</button>
                    <button className="save-btn">Save for Later</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="portfolio-section">
            <div className="portfolio-header">
              <h3>🚀 Portfolio-Worthy Projects</h3>
              <p>Turn your coursework into impressive projects that showcase your skills</p>
            </div>

            <div className="portfolio-list">
              {careerData.portfolioProjects.map((project) => (
                <div key={project.id} className="portfolio-card">
                  <div className="portfolio-header-section">
                    <h4>{project.title}</h4>
                    <div className="portfolio-stats">
                      <span className="stat">⭐ {project.githubStars} stars</span>
                      <a href={project.liveDemo} className="demo-link">
                        🔗 Live Demo
                      </a>
                    </div>
                  </div>

                  <div className="courses-used">
                    <strong>Built using concepts from:</strong>
                    <div className="course-tags">
                      {project.courses.map((course, idx) => (
                        <span key={idx} className="course-tag">{course}</span>
                      ))}
                    </div>
                  </div>

                  <div className="skills-demonstrated">
                    <strong>Skills Demonstrated:</strong>
                    <div className="skills-tags">
                      {project.skills.map((skill, idx) => (
                        <span key={idx} className="skill-tag-portfolio">{skill}</span>
                      ))}
                    </div>
                  </div>

                  <div className="project-impact">
                    <strong>💡 Why This Matters:</strong>
                    <p>{project.impact}</p>
                  </div>

                  <div className="project-features">
                    <strong>Key Features:</strong>
                    <ul>
                      {project.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                  </div>

                  <button className="build-btn">Start Building This Project →</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerHub;