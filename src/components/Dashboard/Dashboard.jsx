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
      
      const response = await axios.get('http://localhost:5000/api/dashboard/stats', {
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
            totalDocuments: data.metrics?.totalDocuments || 0,
            summarizedDocuments: data.metrics?.summarizedDocuments || 0
          },
          alerts: data.highPriorityAlerts || [],
          upcomingTasks: data.upcomingTasks || [],
          upcomingExams: data.upcomingExams || []
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
          <p className="header-subtitle">Track your academic progress and manage deadlines</p>
        </div>
        <button onClick={fetchDashboardData} className="refresh-btn">
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      {/* Workload Score Banner */}
      {stats?.workloadScore !== undefined && (
        <div className="workload-banner" style={{ borderLeftColor: workloadLevel.color }}>
          <div className="workload-info">
            <h3>Current Workload: <span className="workload-level">{workloadLevel.level}</span></h3>
            <p>You have <strong>{stats.metrics.totalTasks}</strong> total tasks • <strong>{stats.metrics.overdueTasks}</strong> overdue</p>
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
          <h3><i className="fas fa-exclamation-circle"></i> High Priority Alerts</h3>
          <div className="alerts-list">
            {stats.alerts.map((alert, index) => (
              <div key={index} className={`alert alert-${alert.severity}`}>
                <span className="alert-message">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Glimpse Stats */}
      <div className="quick-stats-section">
        <div className="quick-stat-item materials">
          <div className="stat-icon">
            <i className="fas fa-book"></i>
          </div>
          <div className="stat-info">
            <p className="stat-label">Materials</p>
            <p className="stat-number">{stats?.metrics?.totalDocuments || 0}</p>
            <p className="stat-sublabel">Documents uploaded</p>
          </div>
        </div>

        <div className="quick-stat-item due-tasks">
          <div className="stat-icon">
            <i className="fas fa-tasks"></i>
          </div>
          <div className="stat-info">
            <p className="stat-label">Due Tasks</p>
            <p className="stat-number">{stats?.metrics?.totalTasks || 0}</p>
            <p className="stat-sublabel">All deadlines</p>
          </div>
        </div>

        <div className="quick-stat-item notes">
          <div className="stat-icon">
            <i className="fas fa-sticky-note"></i>
          </div>
          <div className="stat-info">
            <p className="stat-label">Notes</p>
            <p className="stat-number">{stats?.metrics?.summarizedDocuments || 0}</p>
            <p className="stat-sublabel">Summarized</p>
          </div>
        </div>

        <div className="quick-stat-item overdue">
          <div className="stat-icon">
            <i className="fas fa-exclamation"></i>
          </div>
          <div className="stat-info">
            <p className="stat-label">Overdue</p>
            <p className="stat-number">{stats?.metrics?.overdueTasks || 0}</p>
            <p className="stat-sublabel">Need attention</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content-grid">
        
        {/* Upcoming Tasks - All non-exam tasks */}
        <div className="dashboard-card upcoming-tasks">
          <div className="card-header">
            <h2>
              <i className="fas fa-calendar-check"></i>
              Upcoming Tasks
            </h2>
            <span className="task-count">{stats?.upcomingTasks?.length || 0}</span>
          </div>
          <div className="card-content">
            {stats?.upcomingTasks && stats.upcomingTasks.length > 0 ? (
              <ul className="task-list">
                {stats.upcomingTasks.map((task, index) => (
                  <li key={index} className="task-item">
                    <div className="task-left">
                      <span 
                        className="task-badge" 
                        style={{ backgroundColor: getTaskTypeColor(task.taskType) }}
                      >
                        {task.taskType}
                      </span>
                      <div className="task-details">
                        <h4>{task.taskName}</h4>
                        <p className="course-code">{task.courseName}</p>
                      </div>
                    </div>
                    <div className="task-right">
                      <span className="days-badge">{task.daysUntil}d</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                <i className="fas fa-check-circle"></i>
                <p>No upcoming tasks</p>
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
                    <div className="exam-left">
                      <span className="exam-badge">EXAM</span>
                      <div className="exam-details">
                        <h4>{exam.courseName}</h4>
                        <p className="exam-name">{exam.taskName}</p>
                      </div>
                    </div>
                    <div className="exam-right">
                      <span className="exam-days">{exam.daysUntil}d</span>
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