// src/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:8000/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Dashboard response:', response.data);

      if (response.data.success) {
        const data = response.data.data;

        setStats({
          workloadScore: data.workloadScore || 0,
          metrics: {
            totalTasks: data.metrics?.totalTasks || 0,
            overdueTasks: data.metrics?.overdueTasks || 0,
            totalDocuments: data.metrics?.totalDocuments || 0
          },
          alerts: data.highPriorityAlerts || [],
          upcomingDeadlines: data.upcomingDeadlines || [],
          upcomingExams: data.upcomingExams || [],
          examPredictions: data.examPredictions || []
        });
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getTaskTypeColor = (type) => {
    const colors = {
      'Assignment': '#4CAF50',
      'Exam': '#f44336',
      'Project': '#2196F3',
      'Quiz': '#FF9800',
      'Lab': '#9C27B0',
      'Reading': '#00BCD4',
      'Review': '#FFC107'
    };
    return colors[type] || '#757575';
  };

  const getWorkloadLevel = (score) => {
    if (score >= 70) return { level: 'Heavy', color: '#f44336' };
    if (score >= 40) return { level: 'Moderate', color: '#FF9800' };
    return { level: 'Light', color: '#4CAF50' };
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const workloadLevel = stats?.workloadScore ? getWorkloadLevel(stats.workloadScore) : { level: 'Unknown', color: '#757575' };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Dashboard Overview</h1>
          <p className="header-subtitle">Track your academic progress and stay on top of deadlines</p>
        </div>
        <button onClick={fetchDashboardData} className="refresh-btn">
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      {/* Workload Score Banner */}
      {stats?.workloadScore !== undefined && (
        <div className="workload-banner" style={{ borderLeftColor: workloadLevel.color }}>
          <div className="workload-info">
            <h3>Current Workload: {workloadLevel.level}</h3>
            <p>You have {stats.metrics.pendingTasks} pending tasks • {stats.metrics.completedTasks} completed</p>
          </div>
          <div className="workload-gauge">
            <div className="gauge-circle" style={{ background: `conic-gradient(${workloadLevel.color} 0deg ${(stats.workloadScore / 100) * 360}deg, #e0e0e0 ${(stats.workloadScore / 100) * 360}deg)` }}>
              <div className="gauge-inner">
                <span className="gauge-text">{stats.workloadScore}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* High Priority Alerts */}
      {stats?.alerts && stats.alerts.length > 0 && (
        <div className="alerts-section">
          <h3>⚠️ High Priority Alerts</h3>
          <div className="alerts-list">
            {stats.alerts.map((alert, index) => (
              <div key={index} className={`alert alert-${alert.severity}`}>
                <span className="alert-message">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card tasks-card">
          <div className="stat-icon">
            <i className="fas fa-tasks"></i>
          </div>
          <div className="stat-content">
            <h3>Total Tasks</h3>
            <p className="stat-number">{stats?.metrics?.totalTasks || 0}</p>
            <span className="stat-label">All deadlines</span>
          </div>
        </div>

        <div className="stat-card overdue-card">
          <div className="stat-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="stat-content">
            <h3>Overdue Tasks</h3>
            <p className="stat-number">{stats?.metrics?.overdueTasks || 0}</p>
            <span className="stat-label">Requires attention</span>
          </div>
        </div>

        <div className="stat-card notes-card">
          <div className="stat-icon">
            <i className="fas fa-file-alt"></i>
          </div>
          <div className="stat-content">
            <h3>My Notes</h3>
            <p className="stat-number">{stats?.metrics?.totalDocuments || 0}</p>
            <span className="stat-label">Documents uploaded</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content-grid">
        
        {/* Upcoming Deadlines - All task types except Exams */}
        <div className="dashboard-card upcoming-deadlines">
          <div className="card-header">
            <h2>
              <i className="fas fa-calendar-alt"></i>
              Upcoming Deadlines
            </h2>
            <span className="deadline-count">{stats?.upcomingDeadlines?.length || 0}</span>
          </div>
          <div className="card-content">
            {stats?.upcomingDeadlines && stats.upcomingDeadlines.length > 0 ? (
              <ul className="deadline-list">
                {stats.upcomingDeadlines.map((task, index) => (
                  <li key={index} className="deadline-item">
                    <div className="deadline-info">
                      <span 
                        className="task-type-badge" 
                        style={{ backgroundColor: getTaskTypeColor(task.taskType) }}
                      >
                        {task.taskType}
                      </span>
                      <div className="task-details">
                        <h4>{task.taskName}</h4>
                        <p className="course-name">{task.courseName}</p>
                      </div>
                    </div>
                    <div className="deadline-date">
                      <i className="fas fa-clock"></i>
                      <span>{task.daysUntil} day{task.daysUntil !== 1 ? 's' : ''}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                <i className="fas fa-check-circle"></i>
                <p>No upcoming deadlines</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Exams */}
        <div className="dashboard-card upcoming-exams">
          <div className="card-header">
            <h2>
              <i className="fas fa-graduation-cap"></i>
              Upcoming Exams
            </h2>
            <span className="exam-count">{stats?.upcomingExams?.length || 0}</span>
          </div>
          <div className="card-content">
            {stats?.upcomingExams && stats.upcomingExams.length > 0 ? (
              <ul className="exam-list">
                {stats.upcomingExams.map((exam, index) => (
                  <li key={index} className="exam-item">
                    <div className="exam-info">
                      <h4>{exam.courseName}</h4>
                      <p className="exam-task">{exam.taskName}</p>
                    </div>
                    <div className="exam-days">
                      <span className="badge">{exam.daysUntil}d</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                <i className="fas fa-calendar"></i>
                <p>No upcoming exams</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;