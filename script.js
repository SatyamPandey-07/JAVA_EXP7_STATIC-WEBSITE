// Data storage using localStorage
class DataManager {
    constructor() {
        this.studentsKey = 'workshop-students';
        this.feedbackKey = 'workshop-feedback';
    }

    getStudents() {
        const data = localStorage.getItem(this.studentsKey);
        return data ? JSON.parse(data) : [];
    }

    saveStudent(student) {
        const students = this.getStudents();
        student.id = Date.now().toString();
        student.registrationDate = new Date().toLocaleDateString();
        students.push(student);
        localStorage.setItem(this.studentsKey, JSON.stringify(students));
        return student;
    }

    getFeedback() {
        const data = localStorage.getItem(this.feedbackKey);
        return data ? JSON.parse(data) : [];
    }

    saveFeedback(feedback) {
        const feedbackList = this.getFeedback();
        feedback.id = Date.now().toString();
        feedback.submissionDate = new Date().toLocaleDateString();
        feedbackList.push(feedback);
        localStorage.setItem(this.feedbackKey, JSON.stringify(feedbackList));
        return feedback;
    }
}

// Initialize data manager
const dataManager = new DataManager();

// Navigation functionality
class Navigation {
    constructor() {
        this.navButtons = document.querySelectorAll('.nav-btn');
        this.sections = document.querySelectorAll('.section');
        this.init();
    }

    init() {
        this.navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetSection = e.target.getAttribute('data-section');
                this.showSection(targetSection);
            });
        });
    }

    showSection(sectionId) {
        // Update active nav button
        this.navButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

        // Show target section
        this.sections.forEach(section => section.classList.remove('active'));
        document.getElementById(sectionId).classList.add('active');

        // Update content when switching sections
        if (sectionId === 'students') {
            studentsManager.displayStudents();
        } else if (sectionId === 'view-feedback') {
            feedbackViewer.displayFeedback();
        }
    }
}

// Registration form management
class RegistrationManager {
    constructor() {
        this.form = document.getElementById('registration-form');
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }

    handleSubmit() {
        const formData = new FormData(this.form);
        const student = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            organization: formData.get('organization')
        };

        // Validate email uniqueness
        const existingStudents = dataManager.getStudents();
        if (existingStudents.some(s => s.email === student.email)) {
            alert('A student with this email is already registered!');
            return;
        }

        // Save student
        dataManager.saveStudent(student);
        
        // Show success message
        alert('Registration successful! Welcome to the AI Workshop.');
        
        // Reset form
        this.form.reset();
        
        // Update students count if on students page
        studentsManager.displayStudents();
    }
}

// Students list management
class StudentsManager {
    constructor() {
        this.studentsTable = document.getElementById('students-tbody');
        this.studentCount = document.getElementById('student-count');
        this.displayStudents();
    }

    displayStudents() {
        const students = dataManager.getStudents();
        
        // Update count
        this.studentCount.textContent = `${students.length} registered`;
        
        // Clear table
        this.studentsTable.innerHTML = '';
        
        if (students.length === 0) {
            this.studentsTable.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #666;">
                        No students registered yet
                    </td>
                </tr>
            `;
            return;
        }

        // Populate table
        students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.fullName}</td>
                <td>${student.email}</td>
                <td>${student.phone}</td>
                <td>${student.organization}</td>
                <td>${student.registrationDate}</td>
            `;
            this.studentsTable.appendChild(row);
        });
    }
}

// Star rating functionality
class StarRating {
    constructor() {
        this.ratings = {};
        this.init();
    }

    init() {
        const starRatings = document.querySelectorAll('.star-rating');
        starRatings.forEach(rating => {
            const stars = rating.querySelectorAll('.star');
            const ratingType = rating.getAttribute('data-rating');
            
            stars.forEach((star, index) => {
                star.addEventListener('click', () => {
                    this.setRating(ratingType, index + 1);
                    this.updateStarDisplay(rating, index + 1);
                });
                
                star.addEventListener('mouseover', () => {
                    this.updateStarDisplay(rating, index + 1);
                });
            });
            
            rating.addEventListener('mouseleave', () => {
                const currentRating = this.ratings[ratingType] || 0;
                this.updateStarDisplay(rating, currentRating);
            });
        });
    }

    setRating(type, value) {
        this.ratings[type] = value;
    }

    updateStarDisplay(ratingElement, value) {
        const stars = ratingElement.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index < value) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    getRatings() {
        return this.ratings;
    }

    resetRatings() {
        this.ratings = {};
        const starRatings = document.querySelectorAll('.star-rating');
        starRatings.forEach(rating => {
            const stars = rating.querySelectorAll('.star');
            stars.forEach(star => star.classList.remove('active'));
        });
    }
}

// Feedback form management
class FeedbackManager {
    constructor() {
        this.form = document.getElementById('feedback-form');
        this.starRating = new StarRating();
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }

    handleSubmit() {
        const formData = new FormData(this.form);
        const ratings = this.starRating.getRatings();
        
        // Validate that all ratings are provided
        const requiredRatings = ['overall', 'content', 'instructor', 'organization'];
        const missingRatings = requiredRatings.filter(rating => !ratings[rating]);
        
        if (missingRatings.length > 0) {
            alert('Please provide ratings for all categories.');
            return;
        }

        const feedback = {
            name: formData.get('feedbackName'),
            email: formData.get('feedbackEmail'),
            ratings: ratings,
            recommend: formData.get('recommend'),
            comments: formData.get('comments')
        };

        // Validate recommendation selection
        if (!feedback.recommend) {
            alert('Please select whether you would recommend this workshop.');
            return;
        }

        // Save feedback
        dataManager.saveFeedback(feedback);
        
        // Show success message with personal feedback option
        const avgRating = Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length;
        alert(`Thank you for your feedback! Your average rating: ${avgRating.toFixed(1)}/5\n\nYou can view your feedback anytime in the "View Feedback" section by entering your email.`);
        
        // Reset form and ratings
        this.form.reset();
        this.starRating.resetRatings();
        
        // Update feedback display if on feedback page
        feedbackViewer.displayFeedback();
    }
}

// Feedback viewer and analytics
class FeedbackViewer {
    constructor() {
        this.feedbackEntries = document.getElementById('feedback-entries');
        this.totalResponses = document.getElementById('total-responses');
        this.averageRating = document.getElementById('average-rating');
        this.recommendCount = document.getElementById('recommend-count');
        this.recommendRate = document.getElementById('recommend-rate');
        this.feedbackCount = document.getElementById('feedback-count');
        this.currentView = 'all';
        this.initializeControls();
        this.displayFeedback();
    }

    initializeControls() {
        // View toggle buttons
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.getAttribute('data-view');
                this.switchView(view);
            });
        });

        // Personal feedback lookup
        const lookupBtn = document.getElementById('lookup-btn');
        const lookupEmail = document.getElementById('lookup-email');
        
        lookupBtn.addEventListener('click', () => {
            this.lookupPersonalFeedback();
        });
        
        lookupEmail.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.lookupPersonalFeedback();
            }
        });
    }

    switchView(view) {
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        // Show/hide appropriate sections
        const personalLookup = document.getElementById('personal-feedback-lookup');
        const allFeedbackView = document.getElementById('all-feedback-view');
        
        if (view === 'personal') {
            personalLookup.classList.remove('hidden');
            allFeedbackView.style.display = 'none';
        } else {
            personalLookup.classList.add('hidden');
            allFeedbackView.style.display = 'block';
            this.displayFeedback();
        }
    }

    lookupPersonalFeedback() {
        const email = document.getElementById('lookup-email').value.trim();
        const resultDiv = document.getElementById('personal-feedback-result');
        
        if (!email) {
            alert('Please enter your email address');
            return;
        }
        
        const feedbackList = dataManager.getFeedback();
        const personalFeedback = feedbackList.filter(feedback => 
            feedback.email.toLowerCase() === email.toLowerCase()
        );
        
        resultDiv.innerHTML = '';
        
        if (personalFeedback.length === 0) {
            resultDiv.innerHTML = `
                <div class="no-feedback-message">
                    <h4>No feedback found</h4>
                    <p>We couldn't find any feedback submitted with the email address: <strong>${email}</strong></p>
                    <p>Please check your email address or submit feedback first.</p>
                </div>
            `;
        } else {
            personalFeedback.forEach(feedback => {
                const card = this.createPersonalFeedbackCard(feedback);
                resultDiv.appendChild(card);
            });
        }
    }

    createPersonalFeedbackCard(feedback) {
        const card = document.createElement('div');
        card.className = 'personal-feedback-card';
        
        const recommendText = {
            'yes': 'Yes, definitely',
            'maybe': 'Maybe', 
            'no': 'No, I wouldn\'t'
        };
        
        const averageRating = Object.values(feedback.ratings).reduce((a, b) => a + b, 0) / Object.values(feedback.ratings).length;
        
        card.innerHTML = `
            <div class="personal-feedback-header">
                <h4>Your Feedback Submission</h4>
                <div class="submission-date">Submitted on: ${feedback.submissionDate}</div>
            </div>
            
            <div class="feedback-ratings">
                <div class="rating-item">
                    <div class="label">Overall</div>
                    <div class="stars">${'★'.repeat(feedback.ratings.overall)}${'☆'.repeat(5 - feedback.ratings.overall)}</div>
                </div>
                <div class="rating-item">
                    <div class="label">Content</div>
                    <div class="stars">${'★'.repeat(feedback.ratings.content)}${'☆'.repeat(5 - feedback.ratings.content)}</div>
                </div>
                <div class="rating-item">
                    <div class="label">Instructor</div>
                    <div class="stars">${'★'.repeat(feedback.ratings.instructor)}${'☆'.repeat(5 - feedback.ratings.instructor)}</div>
                </div>
                <div class="rating-item">
                    <div class="label">Organization</div>
                    <div class="stars">${'★'.repeat(feedback.ratings.organization)}${'☆'.repeat(5 - feedback.ratings.organization)}</div>
                </div>
            </div>
            
            <div style="margin: 20px 0; text-align: center;">
                <div style="font-size: 1.2rem; font-weight: 600; color: #667eea;">Average Rating: ${averageRating.toFixed(1)}/5</div>
            </div>
            
            <div class="recommend-badge recommend-${feedback.recommend}">
                Would Recommend: ${recommendText[feedback.recommend]}
            </div>
            
            ${feedback.comments ? `
                <div class="feedback-comments" style="margin-top: 15px; padding: 15px; background: rgba(102, 126, 234, 0.05); border-radius: 10px;">
                    <strong>Your Comments:</strong><br>
                    "${feedback.comments}"
                </div>
            ` : ''}
        `;
        
        return card;
    }

    displayFeedback() {
        const feedbackList = dataManager.getFeedback();
        
        // Update statistics
        this.updateStatistics(feedbackList);
        
        // Clear feedback entries
        this.feedbackEntries.innerHTML = '';
        
        if (feedbackList.length === 0) {
            this.feedbackEntries.innerHTML = `
                <div class="empty-state">
                    <h3>No feedback yet</h3>
                    <p>Feedback from workshop participants will appear here.</p>
                </div>
            `;
            return;
        }

        // Display feedback entries (most recent first)
        feedbackList.reverse().forEach(feedback => {
            const entry = this.createFeedbackEntry(feedback);
            this.feedbackEntries.appendChild(entry);
        });
    }

    updateStatistics(feedbackList) {
        const total = feedbackList.length;
        this.totalResponses.textContent = total;
        this.feedbackCount.textContent = `${total} responses`;

        if (total === 0) {
            this.averageRating.textContent = '0.0';
            this.recommendCount.textContent = '0';
            this.recommendRate.textContent = '0%';
            return;
        }

        // Calculate average rating
        let totalRating = 0;
        let ratingCount = 0;
        
        feedbackList.forEach(feedback => {
            Object.values(feedback.ratings).forEach(rating => {
                totalRating += rating;
                ratingCount++;
            });
        });
        
        const avgRating = (totalRating / ratingCount).toFixed(1);
        this.averageRating.textContent = avgRating;

        // Calculate recommendation statistics
        const recommendYes = feedbackList.filter(f => f.recommend === 'yes').length;
        this.recommendCount.textContent = recommendYes;
        
        const recommendationRate = ((recommendYes / total) * 100).toFixed(0);
        this.recommendRate.textContent = `${recommendationRate}%`;
    }

    createFeedbackEntry(feedback) {
        const entry = document.createElement('div');
        entry.className = 'feedback-entry';
        
        const recommendBadgeClass = `recommend-${feedback.recommend}`;
        const recommendText = {
            'yes': 'Yes, definitely',
            'maybe': 'Maybe',
            'no': 'No, I wouldn\'t'
        };

        entry.innerHTML = `
            <div class="feedback-header">
                <div>
                    <div class="feedback-name">${feedback.name}</div>
                    <div class="feedback-email">${feedback.email}</div>
                </div>
            </div>
            <div class="feedback-ratings">
                <div class="rating-item">
                    <div class="label">Overall</div>
                    <div class="stars">${'★'.repeat(feedback.ratings.overall)}${'☆'.repeat(5 - feedback.ratings.overall)}</div>
                </div>
                <div class="rating-item">
                    <div class="label">Content</div>
                    <div class="stars">${'★'.repeat(feedback.ratings.content)}${'☆'.repeat(5 - feedback.ratings.content)}</div>
                </div>
                <div class="rating-item">
                    <div class="label">Instructor</div>
                    <div class="stars">${'★'.repeat(feedback.ratings.instructor)}${'☆'.repeat(5 - feedback.ratings.instructor)}</div>
                </div>
                <div class="rating-item">
                    <div class="label">Organization</div>
                    <div class="stars">${'★'.repeat(feedback.ratings.organization)}${'☆'.repeat(5 - feedback.ratings.organization)}</div>
                </div>
            </div>
            <div class="recommend-badge ${recommendBadgeClass}">
                Recommend: ${recommendText[feedback.recommend]}
            </div>
            ${feedback.comments ? `<div class="feedback-comments">"${feedback.comments}"</div>` : ''}
        `;
        
        return entry;
    }
}

// Initialize all components when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all managers
    const navigation = new Navigation();
    const registrationManager = new RegistrationManager();
    const studentsManager = new StudentsManager();
    const feedbackManager = new FeedbackManager();
    const feedbackViewer = new FeedbackViewer();
    
    // Make managers globally accessible for cross-component communication
    window.studentsManager = studentsManager;
    window.feedbackViewer = feedbackViewer;
    
    // Add some sample data for demonstration (remove in production)
    addSampleData();
});

// Function to add sample data for demonstration
function addSampleData() {
    const students = dataManager.getStudents();
    const feedback = dataManager.getFeedback();
    
    // Add sample students if none exist
    if (students.length === 0) {
        const sampleStudents = [
            {
                fullName: 'Sarah Johnson',
                email: 'sarah.johnson@university.edu',
                phone: '+1 (555) 123-4567',
                organization: 'Stanford University',
                registrationDate: '8/1/2025'
            },
            {
                fullName: 'Michael Chen',
                email: 'michael.chen@techcorp.com',
                phone: '+1 (555) 987-6543',
                organization: 'Tech Corporation',
                registrationDate: '8/2/2025'
            },
            {
                fullName: 'Emily Rodriguez',
                email: 'emily@institute.org',
                phone: '+1 (555) 456-7890',
                organization: 'AI Research Institute',
                registrationDate: '8/2/2025'
            }
        ];
        
        sampleStudents.forEach(student => {
            student.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            dataManager.saveStudent(student);
        });
    }
    
    // Add sample feedback if none exists
    if (feedback.length === 0) {
        const sampleFeedback = [
            {
                name: 'Sarah Johnson',
                email: 'sarah.johnson@university.edu',
                ratings: { overall: 5, content: 5, instructor: 5, organization: 4 },
                recommend: 'yes',
                comments: 'Excellent workshop! The content was very informative and well-structured.',
                submissionDate: '8/3/2025'
            },
            {
                name: 'Michael Chen',
                email: 'michael.chen@techcorp.com',
                ratings: { overall: 4, content: 4, instructor: 5, organization: 4 },
                recommend: 'yes',
                comments: 'Great workshop overall. Would love to see more practical examples.',
                submissionDate: '8/3/2025'
            },
            {
                name: 'Emily Rodriguez',
                email: 'emily@institute.org',
                ratings: { overall: 5, content: 5, instructor: 4, organization: 5 },
                recommend: 'yes',
                comments: 'The instructor was fantastic and very knowledgeable!',
                submissionDate: '8/3/2025'
            }
        ];
        
        sampleFeedback.forEach(fb => {
            fb.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            dataManager.saveFeedback(fb);
        });
    }
}