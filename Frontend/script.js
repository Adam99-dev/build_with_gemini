// =======================================================
// 1. GLOBAL STATE & MOCK DATA
// =======================================================

let isLoggedIn = false;
let loggedInUser = '';
let plannerChartInstance = null;
let dashboardChartInstance = null;
let hasNewActivity = false;

// Mock Data Definitions
const NUTRITION_TASKS = [
    { name: 'Log Dinner (Target: 600 kcal)', completed: false, icon: 'apple' },
    { name: 'Drink 8 glasses of water', completed: true, icon: 'droplet' },
    { name: 'Review Macro Breakdown', completed: false, icon: 'utensils' },
    { name: 'Take multivitamin', completed: true, icon: 'milk' }
];

const WORKOUT_TASKS = [
    { name: 'Complete Leg Day Routine', completed: false, icon: 'run' },
    { name: 'Log 1 hour yoga session', completed: true, icon: 'dumbbell' },
    { name: 'Set recovery day reminder', completed: false, icon: 'stretching' },
    { name: 'Check heart rate zones', completed: false, icon: 'heart-pulse' }
];

let mockGoals = [
    { id: 1, name: "Daily Steps (10,000)", target: 10000, current: 7500, type: "Activity" },
    { id: 2, name: "Sleep Avg (8 hours)", target: 8, current: 8.25, type: "Sleep" },
    { id: 3, name: "Strength Training (3x/wk)", target: 3, current: 2, type: "Workout" },
];
let nextGoalId = 4;

let mockActivities = [
    { id: 1, metric: "STEPS", value: 15000, date: new Date().toLocaleDateString(), type: "Activity" },
    { id: 2, metric: "SLEEP", value: "8 hours", date: new Date(Date.now() - 86400000).toLocaleDateString(), type: "Sleep" },
    { id: 3, metric: "BP", value: "130/85", date: new Date(Date.now() - 2 * 86400000).toLocaleDateString(), type: "Health" },
];
let nextActivityId = 4;

let mockMedications = [
    { id: 101, name: "Metformin (500mg)", schedule: "8:00 AM Daily", status: "Active", adherence: 88, nextDose: "8:00 AM", dosage: "500mg", frequency: "Daily" },
    { id: 102, name: "Vitamin D (1000 IU)", schedule: "1:00 PM Daily", status: "Active", adherence: 95, nextDose: "1:00 PM", dosage: "1000 IU", frequency: "Daily" },
    { id: 103, name: "Aspirin (81mg)", schedule: "6:00 PM Daily", status: "Active", adherence: 75, nextDose: "6:00 PM", dosage: "81mg", frequency: "Daily" },
    { id: 104, name: "Amoxicillin", schedule: "2x/Day for 7 days", status: "Completed", adherence: 100, nextDose: "-", dosage: "250mg", frequency: "Twice Daily" },
];
let nextMedicationId = 105;

let healthScores = {
    activity: 92,
    sleep: 85,
    stress: 79,
    nutrition: 95
};

// =======================================================
// 2. INITIALIZATION AND CORE UI FUNCTIONS
// =======================================================

/**
 * Executes on page load to set up the initial state.
 */
window.onload = () => {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    updateHeaderAuthDisplay();
    // Set default accent color
    applyAccentColor('Teal'); 
};

/**
 * Toggles the mobile navigation menu.
 */
function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}

/**
 * Switches the displayed view/tab in the single-page application.
 */
function showView(viewId) {
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.classList.remove('active'));

    const targetView = document.getElementById(viewId + '-view');
    if (targetView) {
        targetView.classList.add('active');
        window.scrollTo(0, 0); 
    }

    if (viewId === 'dashboard') {
        checkAuthAndShowDashboard();
    }

    // Reset activity flag when leaving dashboard
    if (viewId !== 'dashboard') {
        hasNewActivity = false;
        renderGoalsAndActivities(); 
    }

    if (typeof lucide !== 'undefined') { lucide.createIcons(); }

    const mobileMenu = document.getElementById('mobile-menu');
    if (!mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.add('hidden');
    }
}

/**
 * Calculates wellness scores based on mock activities and updates the DOM.
 */
function calculateAndRenderScores() {
    // Mock Score Logic: Increase activity based on steps
    const totalSteps = mockActivities
        .filter(a => a.metric === 'STEPS')
        .reduce((sum, a) => sum + (parseInt(a.value) || 0), 0);
    
    let newActivityScore = Math.min(100, 85 + Math.floor(totalSteps / 10000));
    
    // Mock stress score adjustment based on meditation entries
    const mindfulCount = mockActivities.filter(a => a.metric === 'MEDITATION').length;
    let newStressScore = Math.min(100, 79 + (mindfulCount * 5));

    healthScores.activity = newActivityScore;
    healthScores.stress = newStressScore;
    
    // Calculate Overall Wellness Score
    const totalScore = (healthScores.activity + healthScores.sleep + healthScores.stress + healthScores.nutrition) / 4;
    const roundedScore = Math.round(totalScore);

    // Update DOM elements
    document.getElementById('overall-score').textContent = roundedScore;
    document.getElementById('score-activity').textContent = healthScores.activity;
    document.getElementById('score-sleep').textContent = healthScores.sleep;
    document.getElementById('score-stress').textContent = healthScores.stress;
    document.getElementById('score-nutrition').textContent = healthScores.nutrition;
    
    renderGoalsAndActivities();
    renderDashboardChart();
}

/**
 * Renders goals and the recent activity feed using mock data.
 */
function renderGoalsAndActivities() {
    // 1. RENDER GOALS
    const goalsContainer = document.querySelector('#dashboard-content .card:nth-child(2) .space-y-4');
    if (goalsContainer) {
        goalsContainer.innerHTML = mockGoals.map(goal => {
            const percentage = (goal.current / goal.target) * 100;
            const width = Math.min(100, percentage);
            const color = percentage >= 100 ? 'bg-green-500' : 'color-bg-accent'; 
            const textColor = 'color-accent-text'; 

            return `
                <div>
                    <div class="flex justify-between items-center text-sm mb-1">
                        <span class="font-medium text-white">${goal.name}</span>
                        <span class="${textColor} font-bold">${goal.type === 'Sleep' ? `${goal.current}h 15m` : `${Math.floor(percentage)}%`}</span>
                    </div>
                    <div class="w-full bg-gray-700 rounded-full h-2.5">
                        <div class="${color} h-2.5 rounded-full transition-all duration-500" style="width: ${width}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // 2. RENDER ACTIVITY FEED
    const activityFeed = document.querySelector('#dashboard-content .card:nth-child(3) ul.space-y-3'); 
    if (activityFeed) {
        activityFeed.innerHTML = mockActivities.slice().reverse().slice(0, 3).map(activity => {
            let icon, label, time, color;
            
            if (activity.metric === 'STEPS') {
                icon = 'footprints';
                label = `Logged ${activity.metric} count: ${activity.value}.`;
                time = '4 hours ago';
                color = 'text-green-400';
            } else if (activity.metric === 'SLEEP') {
                icon = 'moon';
                label = `Logged ${activity.metric}: ${activity.value}.`;
                time = '4 hours ago';
                color = 'text-indigo-400';
            } else if (activity.metric === 'MEDITATION') {
                icon = 'lotus';
                label = `Logged ${activity.metric} session: ${activity.value}.`;
                time = 'Just Now';
                color = 'text-pink-400';
            } else {
                icon = 'bolt';
                label = `Logged ${activity.metric}: ${activity.value}.`;
                time = 'Just Now';
                color = 'text-white';
            }
            
            return `
                <li class="flex items-center space-x-3 text-sm">
                    <i data-lucide="${icon}" class="w-5 h-5 ${color}"></i>
                    <span class="flex-1">${label}</span>
                    <span class="text-xs text-gray-500">${time}</span>
                </li>
            `;
        }).join('');
    }
    
    // 3. Update Activity Dot (Visual notification)
    const activityDot = document.getElementById('activity-dot');
    if (activityDot) {
         if (mockActivities.length > 3 || hasNewActivity) {
             activityDot.classList.remove('hidden');
             activityDot.classList.add('activity-dot');
         } else {
             activityDot.classList.add('hidden');
             activityDot.classList.remove('activity-dot');
         }
    }

    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

// =======================================================
// 3. AUTHENTICATION HANDLERS
// =======================================================

/**
 * Updates the header based on login status.
 */
function updateHeaderAuthDisplay() {
    const authButtons = document.getElementById('auth-buttons');
    const userInfo = document.getElementById('user-info');
    const userGreeting = document.getElementById('user-greeting');
    const homeTeaser = document.getElementById('home-wellness-teaser');

    if (isLoggedIn) {
        authButtons.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userInfo.classList.add('flex');
        userGreeting.textContent = `Welcome, ${loggedInUser}`;
        homeTeaser.style.display = 'inline-block'; 
    } else {
        authButtons.classList.remove('hidden');
        userInfo.classList.add('hidden');
        userInfo.classList.remove('flex');
        homeTeaser.style.display = 'none'; 
    }
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

/**
 * Checks auth state and shows dashboard content or a login prompt.
 */
function checkAuthAndShowDashboard() {
    const content = document.getElementById('dashboard-content');
    const prompt = document.getElementById('dashboard-auth-prompt');

    if (isLoggedIn) {
        prompt.classList.add('hidden');
        content.classList.remove('hidden');
        // Delay chart and score calculation slightly to ensure DOM is ready
        setTimeout(() => {
            calculateAndRenderScores();
        }, 100);
    } else {
        content.classList.add('hidden');
        prompt.classList.remove('hidden');
        if (dashboardChartInstance) dashboardChartInstance.destroy();
    }
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function showAuthModal(mode = 'login') {
    const authModal = document.getElementById('auth-modal-backdrop');
    authModal.style.display = 'flex';
    switchAuthMode(null, mode);
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function hideAuthModal() {
    document.getElementById('auth-modal-backdrop').style.display = 'none';
}

function switchAuthMode(event, mode) {
    if (event) event.preventDefault();

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const title = document.getElementById('auth-title');
    const switchToSignupLink = document.getElementById('switch-to-signup');
    const switchToLoginLink = document.getElementById('switch-to-login');

    if (mode === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        title.textContent = 'Login to PULSE';
        switchToSignupLink.classList.remove('hidden');
        switchToLoginLink.classList.add('hidden');
    } else if (mode === 'signup') {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        title.textContent = 'Create PULSE Account';
        switchToSignupLink.classList.add('hidden');
        switchToLoginLink.classList.remove('hidden');
    }
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function loginUser(event) {
    if (event) event.preventDefault();
    const email = document.getElementById('login-email').value;
    loggedInUser = email.split('@')[0];

    hideAuthModal();
    isLoggedIn = true;
    updateHeaderAuthDisplay();

    showModal('Login Successful', `Welcome back to PULSE, **${loggedInUser}**! Redirecting to your Dashboard.`, 'Continue');
    setTimeout(() => showView('dashboard'), 1500);
}

function signUpUser(event) {
    if (event) event.preventDefault();
    const fullNameInput = document.getElementById('signup-name').value.trim();
    const fullName = fullNameInput || 'PULSE User';

    loggedInUser = fullName;

    hideAuthModal();
    isLoggedIn = true;
    updateHeaderAuthDisplay();

    showModal('Account Created', `Your PULSE account is ready, **${loggedInUser}**! Redirecting to your Dashboard.`, 'Continue');
    setTimeout(() => showView('dashboard'), 1500);
}

function signOutUser() {
    isLoggedIn = false;
    loggedInUser = '';
    updateHeaderAuthDisplay();
    showView('home');
    showModal('Signed Out', 'You have successfully signed out. Your dashboard data is now protected.', 'Login Again');
}

// =======================================================
// 4. MODAL & UTILITY FUNCTIONS
// =======================================================

/**
 * Universal modal handler for showing alerts or confirmation dialogues.
 */
function showModal(title, message, buttonText = 'Close', modalClass = 'modal-content', onConfirm = null) {
    const modalContent = document.getElementById('universal-modal-content');
    modalContent.className = '';
    modalContent.classList.add(modalClass.includes('modal-content') ? 'modal-content' : modalClass); 
    
    let buttonHtml = `<button onclick="hideModal()" class="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-150">${buttonText}</button>`;
    
    if (onConfirm) {
        const confirmButtonClass = buttonText.toLowerCase().includes('delete') ? 'bg-red-600 hover:bg-red-700 text-white' : 'color-bg-accent color-bg-accent-hover text-black';

        buttonHtml = `<button onclick="hideModal(); ${onConfirm}()" class="${confirmButtonClass} font-bold py-2 px-4 rounded-lg transition duration-150 mr-3">${buttonText}</button>`;
        buttonHtml += `<button onclick="hideModal()" class="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-150">Cancel</button>`;
    }

    modalContent.innerHTML = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close modal">&times;</button>
        <h3 class="text-2xl font-bold mb-3 text-white">${title}</h3>
        <p class="text-gray-400 mb-6">${message}</p>
        <div class="flex justify-end">
            ${buttonHtml}
        </div>
    `;
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function hideModal() {
    document.getElementById('universal-modal-backdrop').style.display = 'none';
}

/**
 * Handles the dynamic color scheme via CSS variables.
 */
function applyAccentColor(colorName) {
    let color, hover;
    switch(colorName) {
        case 'Teal':
            color = '#2dd4bf';
            hover = '#14b8a6';
            break;
        case 'Indigo':
            color = '#818cf8';
            hover = '#6366f1';
            break;
        case 'Pink':
            color = '#f472b6';
            hover = '#ec4899';
            break;
        default:
            color = '#2dd4bf';
            hover = '#14b8a6';
    }
    
    document.documentElement.style.setProperty('--accent-color', color);
    document.documentElement.style.setProperty('--accent-color-hover', hover);
    document.documentElement.style.setProperty('--accent-text', color);
    
    if (dashboardChartInstance) renderDashboardChart();
    if (plannerChartInstance) renderPlannerChart(document.getElementById('planner-title').textContent.includes('Nutrition') ? 'Nutrition' : 'Workout');
}

// =======================================================
// 5. CHART FUNCTIONS (Chart.js implementation)
// =======================================================

/**
 * Renders the weekly performance chart on the Dashboard.
 */
function renderDashboardChart() {
    const ctx = document.getElementById('weeklyPerformanceChart');
    if (!ctx) return;

    if (dashboardChartInstance) {
        dashboardChartInstance.destroy();
        dashboardChartInstance = null;
    }
    
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');

    const data = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Steps (x1000)',
                data: [8, 12, 10, 15, 9, 11, 14],
                backgroundColor: accentColor,
                borderColor: accentColor,
                yAxisID: 'y',
                tension: 0.3,
                type: 'bar',
                borderRadius: 5
            },
            {
                label: 'Sleep Quality (%)',
                data: [85, 90, 80, 75, 95, 88, 92],
                backgroundColor: '#a78bfa',
                borderColor: '#a78bfa',
                yAxisID: 'y1',
                tension: 0.4,
                pointRadius: 5,
                type: 'line'
            }
        ]
    };

    dashboardChartInstance = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Steps (x1000)', color: accentColor },
                    grid: { color: '#2d333b' },
                    ticks: { color: '#c9d1d9' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Sleep Quality (%)', color: '#a78bfa' },
                    grid: { drawOnChartArea: false, color: '#2d333b' },
                    ticks: { color: '#c9d1d9' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#c9d1d9' }
                }
            },
            plugins: {
                legend: { labels: { color: '#c9d1d9' } },
                tooltip: {
                    backgroundColor: '#1f2937',
                    titleColor: '#fff',
                    bodyColor: '#c9d1d9',
                    borderColor: accentColor,
                    borderWidth: 1
                },
                title: {
                    display: true,
                    text: 'Weekly Health Trend',
                    color: '#c9d1d9'
                }
            }
        },
    });
}

/**
 * Renders the long-term progress chart specific to the Planner type.
 */
function renderPlannerChart(plannerType) {
    const ctx = document.getElementById('longTermChart');
    if (!ctx) return;

    if (plannerChartInstance) {
        plannerChartInstance.destroy();
        plannerChartInstance = null;
    }
    
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');

    // Mock data based on planner type
    const dataLabel = plannerType === 'Nutrition' ? 'Weight (kg)' : 'Strength Score (RM)';
    const chartData = plannerType === 'Nutrition'
        ? [85, 84.5, 83, 83.5, 82, 81.5, 80.8, 80]
        : [50, 55, 60, 65, 63, 70, 75, 80];
    const chartColor = plannerType === 'Nutrition' ? accentColor : '#a78bfa';

    plannerChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
            datasets: [{
                label: dataLabel,
                data: chartData,
                borderColor: chartColor,
                backgroundColor: chartColor + '40',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#161b22',
                pointBorderColor: chartColor
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: dataLabel,
                        color: '#9ca3af'
                    },
                    grid: {
                        color: '#2d333b',
                    },
                    ticks: {
                        color: '#c9d1d9'
                    }
                },
                x: {
                    grid: {
                        display: false,
                    },
                    ticks: {
                        color: '#c9d1d9'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#c9d1d9'
                    }
                },
                title: {
                    display: true,
                    text: plannerType === 'Nutrition' ? '8-Week Weight Progress' : '8-Week Strength Progression',
                    color: '#c9d1d9'
                }
            }
        }
    });
}

// =======================================================
// 6. DASHBOARD & DATA MANAGEMENT
// =======================================================

function showDeepDiveModal() {
    const currentScore = document.getElementById('overall-score').textContent;
    
    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close deep dive modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white flex items-center space-x-2"><i data-lucide="scan" class="w-7 h-7 color-accent-text"></i><span>Weekly Wellness Deep Dive (Score: ${currentScore})</span></h3>
        <p class="text-gray-400 mb-6">AI analysis of key health dimensions based on tracked data.</p>
        <ul class="space-y-4">
            <li class="bg-gray-800 p-4 rounded-lg border-l-4 border-green-500">
                <p class="font-bold text-white">Activity (${healthScores.activity}/100):</p>
                <p class="text-sm text-gray-400">Excellent performance. Recommendation: Increase interval training slightly.</p>
            </li>
            <li class="bg-gray-800 p-4 rounded-lg border-l-4 border-yellow-500">
                <p class="font-bold text-white">Sleep (${healthScores.sleep}/100):</p>
                <p class="text-sm text-gray-400">Good average duration, but **time in deep sleep** decreased. Recommendation: Adjust evening routine (screen time).</p>
            </li>
            <li class="bg-gray-800 p-4 rounded-lg border-l-4 border-red-500">
                <p class="font-bold text-white">Stress (${healthScores.stress}/100):</p>
                <p class="text-sm text-gray-400">Heart Rate Variability (HRV) shows elevated stress spikes. Recommendation: Utilize 10-minute meditation sessions.</p>
            </li>
        </ul>
        <button onclick="hideModal(); showView('wellness');" class="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition duration-150">
            Go to Wellness Studio for Stress Relief
        </button>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function showManualDataModal() {
    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close manual data modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white">Manual Data Entry</h3>
        <form onsubmit="submitManualData(event)" class="space-y-4">
            <div class="input-group">
                <label for="metric" class="block text-sm font-medium mb-1">Metric</label>
                <i data-lucide="gauge" class="w-5 h-5"></i>
                <select id="metric" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
                    <option value="steps">Steps Count</option>
                    <option value="weight">Weight (kg)</option>
                    <option value="sleep">Sleep Duration (hours)</option>
                    <option value="bp">Blood Pressure (systolic/diastolic)</option>
                    <option value="sugar">Blood Sugar (mg/dL)</option>
                    <option value="mindfulness">Mindfulness/Meditation (minutes)</option>
                </select>
            </div>
            <div class="input-group">
                <label for="value" class="block text-sm font-medium mb-1">Value</label>
                <i data-lucide="hash" class="w-5 h-5"></i>
                <input type="text" id="value" placeholder="Enter value(s) (e.g., 105/70 for BP)" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
            </div>
            <button type="submit" class="w-full color-bg-accent color-bg-accent-hover text-black font-bold py-2.5 rounded-lg transition duration-150">Submit Data</button>
        </form>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function submitManualData(event) {
    if (event) event.preventDefault();
    const metricInput = document.getElementById('metric').value;
    const value = document.getElementById('value').value;
    
    let activityType, metricName;

    if (metricInput === 'steps' || metricInput === 'weight') {
        activityType = 'Activity';
        metricName = metricInput.toUpperCase();
    } else if (metricInput === 'sleep') {
        activityType = 'Sleep';
        metricName = 'SLEEP';
    } else if (metricInput === 'mindfulness') {
        activityType = 'Mindfulness';
        metricName = 'MEDITATION';
    } else { 
        activityType = 'Health';
        metricName = metricInput.toUpperCase();
    }
    
    // Add new activity to mock data
    mockActivities.push({
        id: nextActivityId++,
        metric: metricName,
        value: value,
        date: new Date().toLocaleDateString(),
        type: activityType
    });
    
    hasNewActivity = true;
    
    hideModal();
    showModal('Data Added', `Successfully logged **${value}** for **${metricName}**. Your dashboard is updating.`, 'View Dashboard');
    
    calculateAndRenderScores();
}

function showEditDataModal() {
    let listHtml = mockActivities.slice().reverse().map(activity => {
        const id = activity.id;
        const display = `${activity.metric} - ${activity.value} (${activity.date})`;
        let color = activity.type === 'Activity' ? 'border-accent-teal' : activity.type === 'Sleep' ? 'border-indigo-400' : (activity.type === 'Mindfulness' ? 'border-pink-400' : 'border-green-500');
        
        return `
            <li class="flex justify-between items-center bg-gray-800 p-3 rounded-lg border-l-4 ${color}">
                <span class="text-sm">${display}</span>
                <div class="space-x-2">
                    <button onclick="showActualEditDataModal(${id})" class="text-xs text-yellow-500 hover:text-yellow-400 font-medium">Edit</button>
                    <button onclick="confirmDataDelete(${id})" class="text-xs text-red-500 hover:text-red-400 font-medium">Delete</button>
                </div>
            </li>
        `;
    }).join('');

    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close edit data modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white flex items-center space-x-2"><i data-lucide="edit-3" class="w-7 h-7 text-yellow-400"></i><span>Edit Health Data</span></h3>
        <p class="text-gray-400 mb-6">Select a recent entry to view, adjust, or delete it. **${mockActivities.length}** entries found.</p>

        <ul class="space-y-3 max-h-60 overflow-y-auto pr-2 mb-4">${listHtml || '<p class="text-gray-500">No data entries logged yet.</p>'}</ul>

        <button onclick="hideModal(); showManualDataModal();" class="w-full bg-accent-teal hover:bg-teal-400 text-black font-bold py-2.5 rounded-lg transition duration-150 mb-3">
            <i data-lucide="plus" class="w-4 h-4 inline-block mr-2"></i> Add New Data Manually
        </button>
        <button onclick="hideModal()" class="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 rounded-lg transition duration-150">
            Done Editing
        </button>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.add('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function showActualEditDataModal(id) {
    const activity = mockActivities.find(a => a.id === id);
    if (!activity) {
        hideModal();
        showModal('Error', 'Data entry not found.', 'OK');
        return;
    }
    
    hideModal();

    const content = `
        <button onclick="showEditDataModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close edit modal and go back">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white">Editing Entry ID: ${activity.id}</h3>
        <form onsubmit="saveEditedData(event, ${activity.id})" class="space-y-4">
            <div class="input-group">
                <label for="edit-metric" class="block text-sm font-medium mb-1">Metric</label>
                <i data-lucide="gauge" class="w-5 h-5"></i>
                <input type="text" id="edit-metric" value="${activity.metric}" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required readonly>
            </div>
            <div class="input-group">
                <label for="edit-value" class="block text-sm font-medium mb-1">Value</label>
                <i data-lucide="hash" class="w-5 h-5"></i>
                <input type="text" id="edit-value" value="${activity.value}" placeholder="Enter new value" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
            </div>
            <button type="submit" class="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2.5 rounded-lg transition duration-150">Save Changes</button>
        </form>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function saveEditedData(event, id) {
    if (event) event.preventDefault();
    const newValue = document.getElementById('edit-value').value;
    
    const index = mockActivities.findIndex(a => a.id === id);
    if (index !== -1) {
        mockActivities[index].value = newValue;
    }
    
    hideModal();
    showModal('Data Updated', `Entry ID ${id} value successfully updated to **${newValue}**. Dashboard recalculated.`, 'View Dashboard');
    calculateAndRenderScores();
}

function confirmDataDelete(id) {
    showModal('Confirm Deletion', `Are you sure you want to delete this data entry? This action cannot be undone.`, 'Delete Entry', 'modal-content', `deleteDataEntry(${id})`);
}

function deleteDataEntry(id) {
    mockActivities = mockActivities.filter(a => a.id !== id);
    hideModal();
    showModal('Data Deleted', `Entry ID **${id}** has been successfully deleted from your history.`, 'OK');
    calculateAndRenderScores();
    setTimeout(showEditDataModal, 500);
}

function undoChangeHandler() {
    showModal('Undo Last Action', 'The most recent data change (e.g., adding steps or editing a goal) has been successfully rolled back.', 'Confirmed');
}

// =======================================================
// 7. GOAL MANAGEMENT
// =======================================================

function showGoalManagementModal() {
    let listHtml = mockGoals.map(goal => `
        <li class="flex justify-between items-center bg-gray-800 p-3 rounded-lg border-l-4 border-accent-teal">
            <div class="flex-1">
                <p class="font-bold text-white">${goal.name}</p>
                <p class="text-xs text-gray-400">Target: ${goal.target} | Current: ${goal.current} (${goal.type})</p>
            </div>
            <div class="space-x-2">
                <button onclick="showGoalEditorModal(${goal.id})" class="text-sm text-yellow-500 hover:text-yellow-400 font-medium">Edit</button>
                <button onclick="confirmGoalDelete(${goal.id})" class="text-sm text-red-500 hover:text-red-400 font-medium">Delete</button>
            </div>
        </li>
    `).join('');

    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close goal management modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white flex items-center space-x-2"><i data-lucide="target" class="w-7 h-7 color-accent-text"></i><span>Goal Management</span></h3>
        <p class="text-gray-400 mb-4">View and modify your personalized health and fitness goals.</p>
        <ul class="space-y-3 max-h-60 overflow-y-auto pr-2 mb-6">${listHtml}</ul>

        <button onclick="showGoalEditorModal(null)" class="w-full color-bg-accent color-bg-accent-hover text-black font-bold py-2.5 rounded-lg transition duration-150">
            Add New Goal
        </button>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.add('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function showGoalEditorModal(id) {
    const isNew = id === null;
    const goal = mockGoals.find(g => g.id === id) || { name: '', target: '', current: 0, type: 'Custom' };
    
    if (!isNew) hideModal();
    
    const title = isNew ? 'Add New Goal' : `Edit Goal: ${goal.name}`;
    
    const content = `
        <button onclick="${isNew ? 'hideModal()' : 'showGoalManagementModal()'}" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close goal editor modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white">${title}</h3>
        <form onsubmit="saveGoal(event, ${id})" class="space-y-4">
            <div class="input-group">
                <label for="goal-name" class="block text-sm font-medium mb-1">Goal Name</label>
                <i data-lucide="tag" class="w-5 h-5"></i>
                <input type="text" id="goal-name" placeholder="e.g., Run 5K" value="${goal.name}" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
            </div>
            <div class="input-group">
                <label for="goal-target" class="block text-sm font-medium mb-1">Target Value</label>
                <i data-lucide="check" class="w-5 h-5"></i>
                <input type="number" id="goal-target" placeholder="e.g., 5000 (meters or steps)" value="${goal.target || ''}" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
            </div>
            <div class="input-group">
                <label for="goal-current" class="block text-sm font-medium mb-1">Current Progress</label>
                <i data-lucide="trending-up" class="w-5 h-5"></i>
                <input type="number" id="goal-current" placeholder="e.g., 1000" value="${goal.current}" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
            </div>
            <button type="submit" class="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2.5 rounded-lg transition duration-150">Save Changes</button>
        </form>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function saveGoal(event, id) {
    if (event) event.preventDefault();
    const name = document.getElementById('goal-name').value;
    const target = parseFloat(document.getElementById('goal-target').value);
    const current = parseFloat(document.getElementById('goal-current').value);
    
    const index = mockGoals.findIndex(g => g.id === id);
    
    if (index !== -1) {
        mockGoals[index].name = name;
        mockGoals[index].target = target;
        mockGoals[index].current = current;
    } else {
        mockGoals.push({
            id: nextGoalId++, 
            name: name, 
            target: target, 
            current: current, 
            type: "Custom"
        });
    }
    
    hideModal();
    showModal('Goal Saved', `Goal **${name}** saved successfully!`, 'OK');
    
    calculateAndRenderScores();
    setTimeout(showGoalManagementModal, 500);
}

function confirmGoalDelete(id) {
     const goal = mockGoals.find(g => g.id === id);
     if (goal) {
         showModal('Confirm Deletion', `Are you sure you want to delete the goal: **${goal.name}**?`, 'Delete', 'modal-content', `deleteGoalById(${id})`);
     }
}

function deleteGoalById(id) {
    mockGoals = mockGoals.filter(g => g.id !== id);
    showModal('Goal Deleted', 'Goal successfully removed.', 'OK');
    calculateAndRenderScores();
    setTimeout(showGoalManagementModal, 500);
}

// =======================================================
// 8. MEDICATION MANAGEMENT
// =======================================================

function showMedicationAdherenceModal(filter = 'Active') {
    if (!isLoggedIn) {
        showAuthModal('login');
        return;
    }
    
    const filteredMeds = mockMedications.filter(m => filter === 'All' || m.status === filter);

    let listHtml = filteredMeds.map(med => `
        <li class="bg-gray-700/30 p-3 rounded-lg flex justify-between items-center border-l-4 ${med.status === 'Active' ? 'border-orange-400' : 'border-gray-500'}">
            <div class="flex-1">
                <p class="font-bold text-white">${med.name}</p>
                <p class="text-xs text-gray-400">Dose: ${med.dosage} | Freq: ${med.frequency} | Adherence: ${med.adherence}%</p>
            </div>
            ${med.status === 'Active' ?
                `<button onclick="logDose(${med.id})" class="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-full text-xs font-semibold">Take Dose</button>` :
                `<button onclick="deleteMedication(${med.id})" class="text-xs text-red-500 hover:text-red-400 font-medium">Archive</button>`
            }
        </li>
    `).join('');
    
    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close medication modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white flex items-center space-x-2"><i data-lucide="pills" class="w-7 h-7 text-orange-400"></i><span>Medication Manager</span></h3>

        <div class="flex justify-between space-x-2 mb-4">
            <button onclick="showMedicationAdherenceModal('Active')" class="flex-1 px-3 py-1 text-sm rounded-lg ${filter === 'Active' ? 'bg-orange-500 text-black font-bold' : 'bg-gray-700 hover:bg-gray-600'}">Active (${mockMedications.filter(m => m.status === 'Active').length})</button>
            <button onclick="showMedicationAdherenceModal('All')" class="flex-1 px-3 py-1 text-sm rounded-lg ${filter === 'All' ? 'bg-orange-500 text-black font-bold' : 'bg-gray-700 hover:bg-gray-600'}">All (${mockMedications.length})</button>
        </div>

        <ul class="space-y-3 max-h-60 overflow-y-auto pr-2 mb-6">${listHtml || '<p class="text-gray-500">No medications matching this filter.</p>'}</ul>

        <button onclick="showAddMedicationModal()" class="w-full color-bg-accent color-bg-accent-hover text-black font-bold py-2.5 rounded-lg transition duration-150 mb-3">
            <i data-lucide="plus" class="w-5 h-5 inline-block mr-2"></i> Add New Prescription
        </button>
        <button onclick="showModal('Reminder Settings', 'Opening your smart reminder and refill management settings.', 'Configure')" class="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 rounded-lg transition duration-150">
            Edit Global Reminders
        </button>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function showAddMedicationModal() {
    hideModal();
    const content = `
        <button onclick="showMedicationAdherenceModal('Active')" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close add medication modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white">Add New Prescription</h3>
        <form onsubmit="submitNewMedication(event)" class="space-y-4">
            <div class="input-group">
                <label for="med-name" class="block text-sm font-medium mb-1">Medication Name</label>
                <i data-lucide="pill" class="w-5 h-5"></i>
                <input type="text" id="med-name" placeholder="e.g., Ibuprofen (200mg)" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
            </div>
            <div class="input-group">
                <label for="med-dosage" class="block text-sm font-medium mb-1">Dosage</label>
                <i data-lucide="hash" class="w-5 h-5"></i>
                <input type="text" id="med-dosage" placeholder="e.g., 200mg" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
            </div>
            <div class="input-group">
                <label for="med-freq" class="block text-sm font-medium mb-1">Frequency</label>
                <i data-lucide="clock" class="w-5 h-5"></i>
                <input type="text" id="med-freq" placeholder="e.g., Daily" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
            </div>
            <button type="submit" class="w-full color-bg-accent color-bg-accent-hover text-black font-bold py-2.5 rounded-lg transition duration-150">Save Medication</button>
        </form>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function submitNewMedication(event) {
    if (event) event.preventDefault();
    const name = document.getElementById('med-name').value;
    const dosage = document.getElementById('med-dosage').value;
    const frequency = document.getElementById('med-freq').value;
    
    mockMedications.push({
        id: nextMedicationId++,
        name: name,
        schedule: `${frequency} Schedule`, 
        status: "Active", 
        adherence: 100, 
        nextDose: "Now", 
        dosage: dosage, 
        frequency: frequency
    });
    
    hideModal();
    showModal('Medication Added', `**${name}** added to your active prescriptions.`, 'OK');
    setTimeout(() => showMedicationAdherenceModal('Active'), 500); 
}

function logDose(id) {
    const medIndex = mockMedications.findIndex(m => m.id === id);
    if (medIndex !== -1) {
        mockMedications[medIndex].adherence = Math.min(100, mockMedications[medIndex].adherence + 2); 
        showModal('Dose Logged', `Successfully logged dose of **${mockMedications[medIndex].name}**. Adherence rate updated!`, 'OK');
        setTimeout(() => showMedicationAdherenceModal('Active'), 500); 
    }
}

function deleteMedication(id) {
    mockMedications = mockMedications.filter(m => m.id !== id);
    showModal('Medication Archived', `Medication ID **${id}** has been archived.`, 'OK');
    setTimeout(() => showMedicationAdherenceModal('All'), 500);
}

// =======================================================
// 9. PLANNER & TOOLS
// =======================================================

function openPlanner(plannerName) {
    if (plannerName === 'Content Library') {
        showModal('Content Library', 'Accessing the curated library of health articles and videos verified by experts. This takes you to our blog and resources section.', 'Browse Content');
        return;
    }

    const titleElement = document.getElementById('planner-title');
    const tasksElement = document.getElementById('planner-tasks');
    const addTaskButton = document.getElementById('add-task-button');
    const plannerCardIcon = plannerName === 'Nutrition' ? 'apple' : 'activity';

    titleElement.innerHTML = `<i data-lucide="${plannerCardIcon}" class="w-9 h-9 mr-3"></i> ${plannerName} Planner`;
    addTaskButton.setAttribute('onclick', `showPlannerLogModal('${plannerName}')`);

    tasksElement.innerHTML = '';

    const tasksToRender = plannerName === 'Nutrition' ? NUTRITION_TASKS : WORKOUT_TASKS;

    tasksToRender.forEach(task => {
        const li = document.createElement('li');
        li.className = 'flex items-center space-x-3 bg-gray-700/30 p-3 rounded-lg hover:bg-gray-700 transition duration-150';
        li.innerHTML = `
            <i data-lucide="${task.icon}" class="w-5 h-5 ${task.completed ? 'text-green-500' : 'text-yellow-500'}"></i>
            <span class="flex-1 ${task.completed ? 'line-through text-gray-500' : 'text-white'}">${task.name}</span>
            <button onclick="togglePlannerTask('${task.name}', '${plannerName}')" class="text-xs ${task.completed ? 'text-gray-500 cursor-default' : 'color-accent-text hover:text-teal-400 font-bold'}">
                ${task.completed ? 'Completed' : 'Mark Done'}
            </button>
        `;
        tasksElement.appendChild(li);
    });

    renderPlannerChart(plannerName);

    if (typeof lucide !== 'undefined') { lucide.createIcons(); }

    showView('planner');
}

function togglePlannerTask(taskName, plannerType) {
    const tasks = plannerType === 'Nutrition' ? NUTRITION_TASKS : WORKOUT_TASKS;
    const task = tasks.find(t => t.name === taskName);
    if (task) {
        task.completed = !task.completed;
        openPlanner(plannerType);
        showModal('Task Status', `Task "${taskName}" marked as ${task.completed ? 'Completed' : 'Pending'}.`, 'OK');
    }
}

function showPlannerLogModal(plannerType) {
    const icon = plannerType === 'Nutrition' ? 'utensils' : 'dumbbell';
    const metric = plannerType === 'Nutrition' ? 'Meal/Food Item' : 'Exercise/Set Count';
    const placeholder = plannerType === 'Nutrition' ? 'e.g., Chicken Salad (450 kcal)' : 'e.g., 3x10 Squats (135 lbs)';

    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close planner log modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white">Log ${plannerType} Entry</h3>
        <form onsubmit="submitPlannerLog(event, '${plannerType}')" class="space-y-4">
            <div class="input-group">
                <label for="log-details" class="block text-sm font-medium mb-1">${metric}</label>
                <i data-lucide="book-open" class="w-5 h-5"></i>
                <input type="text" id="log-details" placeholder="${placeholder}" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
            </div>
            <div class="input-group">
                <label for="log-value" class="block text-sm font-medium mb-1">Value (e.g., 450 kcal, 45 min)</label>
                <i data-lucide="hash" class="w-5 h-5"></i>
                <input type="text" id="log-value" placeholder="Enter quantitative data" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required>
            </div>
            <button type="submit" class="w-full color-bg-accent color-bg-accent-hover text-black font-bold py-2.5 rounded-lg transition duration-150 flex items-center justify-center space-x-2">
                <i data-lucide="${icon}" class="w-5 h-5"></i>
                <span>Log to Tracker</span>
            </button>
        </form>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function submitPlannerLog(event, plannerType) {
    if (event) event.preventDefault();
    const details = document.getElementById('log-details').value;
    const value = document.getElementById('log-value').value;
    
    mockActivities.push({
        id: nextActivityId++,
        metric: plannerType.toUpperCase(),
        value: details,
        date: new Date().toLocaleDateString(),
        type: plannerType
    });
    
    hasNewActivity = true;
    
    hideModal();
    showModal('Log Successful', `Successfully logged "${details} (${value})" to your ${plannerType} tracker. Progress updated!`, 'Great!');
    
    calculateAndRenderScores();
    openPlanner(plannerType);
}


function generateHealthReport() {
    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close report options modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white flex items-center space-x-2"><i data-lucide="file-check-2" class="w-7 h-7 color-accent-text"></i><span>Health Report Options</span></h3>
        <p class="text-gray-400 mb-6">Select how you'd like to use your AI-driven health summary:</p>
        <div class="space-y-3">
            <button onclick="reportAction('PDF Export')" class="w-full color-bg-accent color-bg-accent-hover text-black font-bold py-2.5 rounded-lg transition duration-150 flex items-center justify-center space-x-2">
                <i data-lucide="file-text" class="w-5 h-5"></i><span>Export PDF/Printable</span>
            </button>
            <button onclick="reportAction('Sharing')" class="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 rounded-lg transition duration-150 flex items-center justify-center space-x-2">
                <i data-lucide="share-2" class="w-5 h-5"></i><span>Shareable Link (EHR)</span>
            </button>
            <button onclick="reportAction('Trend Analysis')" class="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 rounded-lg transition duration-150 flex items-center justify-center space-x-2">
                <i data-lucide="line-chart" class="w-5 h-5"></i><span>View Trend Analysis</span>
            </button>
        </div>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function reportAction(action) {
    hideModal();
    showModal(`${action} Activated`, `Simulating ${action.toLowerCase()} process. Your report is ready.`, 'OK');
}

function showSymptomCheckerModal() {
    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close symptom checker modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white">AI Symptom Checker</h3>
        <form onsubmit="submitSymptoms(event)" class="space-y-4">
            <div>
                <label for="symptoms" class="block text-sm font-medium mb-1">Describe your symptoms (e.g., headache, fever, fatigue)</label>
                <textarea id="symptoms" rows="3" placeholder="Enter symptoms here..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]" required></textarea>
            </div>
            <button type="submit" class="w-full color-bg-accent color-bg-accent-hover text-black font-bold py-2.5 rounded-lg transition duration-150">Get Preliminary Guidance</button>
        </form>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function submitSymptoms(event) {
    if (event) event.preventDefault();
    const symptoms = document.getElementById('symptoms').value;
    
    let guidance = `Thank you for sharing your symptoms (${symptoms}). Based on the information provided, please note this is **not a medical diagnosis**. We recommend:
    <ul class="list-disc list-inside mt-3 space-y-1 text-sm">
        <li>**Self-Care:** Ensure you are resting and hydrating adequately.</li>
        <li>**Monitoring:** Track your temperature and the persistence of the headache.</li>
        <li>**Next Step:** If symptoms worsen or persist for more than 48 hours, please **book an appointment** with a General Practitioner via the Booking tab.</li>
    </ul>
    <p class="mt-3 text-xs text-red-400">If you experience sudden severe pain, difficulty breathing, or loss of consciousness, call emergency services immediately.</p>`;

    hideModal();
    showModal('AI Preliminary Guidance', guidance, 'View Recommendations');
}

// =======================================================
// 10. BOOKING & PAYMENTS
// =======================================================

function bookAppointment(event) {
    if (event) event.preventDefault();
    const specialty = document.getElementById('specialty').value;
    const date = document.getElementById('date').value;
    const type = document.getElementById('type').value;
    const reason = document.getElementById('reason').value;

    if (specialty && date && reason) {
        hideModal();
        showModal('Appointment Confirmation',
            `Finding slots for a **${type.toUpperCase()}** consultation with a **${specialty.toUpperCase()}** specialist on **${date}**. If available, you will receive a confirmation shortly.`,
            'OK, Check Slots');
    } else {
        showModal('Incomplete Form', 'Please fill out all required fields (specialty, date, and reason) to find available slots.', 'Try Again');
    }
}

function portalAction(action) {
    showModal('Portal Access', `You are securely accessing your patient ${action}. Privacy measures are actively protecting your data.`, 'Continue');
}

function makeSubscriptionPayment(planName, price) {
    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close payment modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white flex items-center space-x-2">
            <i data-lucide="credit-card" class="w-7 h-7 text-yellow-500"></i>
            <span>Confirm ${planName} Subscription</span>
        </h3>
        <p class="text-gray-400 mb-6">You are subscribing to the **${planName}** plan for one month. Your card will be charged monthly.</p>
        <div class="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg mb-6 border border-gray-600">
            <span class="text-sm text-gray-300">Monthly Price:</span>
            <span class="text-3xl font-extrabold text-yellow-500">₹${price}</span>
        </div>
        <button onclick="simulateSubscriptionProcessing('${planName}', ${price})" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition duration-150">
            Proceed to Secure Checkout
        </button>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function simulateSubscriptionProcessing(planName, price) {
    hideModal();
    showModal('Payment Processing', `Authorizing subscription for **${planName}** (₹${price}/month). Please wait...`, 'Wait');
    setTimeout(() => {
        hideModal();
        showModal('Subscription Active!', `Congratulations! Your **${planName}** subscription is now active.`, 'Start Monitoring');
    }, 2000);
}

// =======================================================
// 11. CONNECT & CRISIS INTERVENTION
// =======================================================

function startChat() {
    showView('chatbot');
}

function sendChat(event) {
    if (event) event.preventDefault();
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');
    const userMessage = chatInput.value.trim();

    if (!userMessage) return;

    // 1. Log User Message
    const userHtml = `<div class="message user-message"><div class="user-bubble">${userMessage}</div></div>`;
    chatHistory.innerHTML += userHtml;
    chatInput.value = '';
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // 2. Simulate AI Typing Indicator
    const typingHtml = `<div class="message ai-message" id="typing-indicator"><div class="ai-typing"><div class="activity-dot"></div><span>AI is thinking...</span></div></div>`;
    chatHistory.innerHTML += typingHtml;
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // 3. Simulate AI Response after delay
    setTimeout(() => {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }

        let aiResponse;
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('score') || lowerMessage.includes('wellness')) {
            aiResponse = "Your current overall wellness score is **88/100**. Would you like to access a quick guided meditation?";
        } else if (lowerMessage.includes('yoga') || lowerMessage.includes('meditation') || lowerMessage.includes('yes')) {
            aiResponse = "Redirecting you to the Wellness Studio now to begin your de-stressing session!";
            setTimeout(() => showView('wellness'), 500);
        } else {
            aiResponse = `I'm focused on health stats and navigation. Try asking me for your 'sleep score' or 'Go to Booking'.`;
        }
        
        const aiHtml = `<div class="message ai-message"><div class="ai-bubble">${aiResponse}</div></div>`;
        chatHistory.innerHTML += aiHtml;
        chatHistory.scrollTop = chatHistory.scrollHeight;
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }, 1500);
}

function showMentalHealthCrisisModal() {
    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close crisis intervention modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-red-400 flex items-center space-x-2"><i data-lucide="alert-triangle" class="w-7 h-7"></i><span>Immediate Crisis Intervention</span></h3>
        <p class="text-white mb-4">If you are facing an emergency or feeling unsafe, please choose the option below that best supports you right now. **We are here to listen.**</p>
        <div class="space-y-4">
            <button onclick="crisisAction('Emergency Services')" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition duration-150 flex items-center justify-center space-x-2">
                <i data-lucide="phone" class="w-5 h-5"></i><span>Call Emergency Services (108/102)</span>
            </button>
            <button onclick="crisisAction('National Helpline')" class="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 rounded-lg transition duration-150 flex items-center justify-center space-x-2">
                <i data-lucide="message-square" class="w-5 h-5"></i><span>Connect to National Helpline (Chat/Call)</span>
            </button>
            <button onclick="crisisAction('Emergency Contact')" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition duration-150 flex items-center justify-center space-x-2">
                <i data-lucide="user-plus" class="w-5 h-5"></i><span>Alert Emergency Contact</span>
            </button>
        </div>
        <div class="mt-6 p-4 rounded-lg bg-gray-800 border border-gray-700">
            <h4 class="text-base font-semibold text-white mb-2">Feeling Overwhelmed?</h4>
            <p class="text-xs text-gray-400">Consider using the <button onclick="hideModal(); showView('wellness')" class="text-pink-400 underline">Wellness Studio</button> or talking to our <button onclick="hideModal(); showView('chatbot')" class="color-accent-text underline">AI Assistant</button>.</p>
        </div>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function crisisAction(action) {
    hideModal();
    showModal('Crisis Action Initiated', `**${action}** initiated. We are routing you to the appropriate resources immediately.`, 'Acknowledge');
}

// =======================================================
// 12. MISCELLANEOUS HANDLERS
// =======================================================

function showSettingsModal() {
    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close settings modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white flex items-center space-x-2"><i data-lucide="settings" class="w-7 h-7 color-accent-text"></i><span>App Settings</span></h3>
        <p class="text-gray-400 mb-6">General, data, and accessibility features for a personalized experience.</p>
        
        <div class="space-y-4">
            <div class="p-3 bg-gray-800 rounded-lg">
                <h4 class="font-bold text-white mb-2 flex items-center space-x-2"><i data-lucide="paint-roller" class="w-5 h-5 text-purple-400"></i><span>Appearance</span></h4>
                <div class="space-y-2 text-sm text-gray-400">
                    <div class="flex justify-between items-center">
                        <span>Color Accent</span>
                        <select onchange="applyAccentColor(this.value)" class="bg-gray-700 border border-gray-600 rounded-lg p-1 text-xs text-white focus:ring-accent-teal">
                            <option value="Teal">Teal (Default)</option>
                            <option value="Indigo">Indigo</option>
                            <option value="Pink">Pink</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="p-3 bg-gray-800 rounded-lg">
                <h4 class="font-bold text-white mb-2 flex items-center space-x-2"><i data-lucide="database" class="w-5 h-5 text-red-400"></i><span>Data & Privacy</span></h4>
                <div class="space-y-2 text-sm text-gray-400">
                    <button onclick="hideModal(); showDataExportModal()" class="w-full text-left p-2 rounded-lg bg-gray-700 hover:bg-gray-600">
                        Export All Health Data
                    </button>
                    <button onclick="showModal('Erase Data', 'This will permanently delete ALL your health data. Are you absolutely sure?', 'Delete All', 'modal-content', 'eraseAllData')" class="w-full text-left p-2 rounded-lg bg-red-800 hover:bg-red-700 text-red-300 font-bold">
                        Erase All Data
                    </button>
                </div>
            </div>

            <button onclick="hideModal(); showDeviceLinkModal()" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition duration-150 flex items-center justify-center space-x-2">
                <i data-lucide="watch" class="w-5 h-5"></i>
                <span>Connect/Manage Smart Device</span>
            </button>
        </div>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function showDataExportModal() {
    const content = `
        <button onclick="hideModal(); showSettingsModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white flex items-center space-x-2"><i data-lucide="file-down" class="w-7 h-7 text-green-400"></i><span>Export Health Data</span></h3>
        <p class="text-gray-400 mb-6">Select the format and data range for your download.</p>
        <div class="space-y-4">
            <div class="input-group">
                <label for="export-format" class="block text-sm font-medium mb-1">Format</label>
                <i data-lucide="file-text" class="w-5 h-5"></i>
                <select id="export-format" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-[var(--accent-color)]">
                    <option>JSON (Recommended)</option>
                    <option>CSV</option>
                </select>
            </div>
            <button onclick="simulateExport()" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition duration-150">
                Generate & Download
            </button>
        </div>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function simulateExport() {
    hideModal();
    showModal('Export Complete', 'Your health data file has been securely generated and is ready for download.', 'Download Now');
}

function eraseAllData() {
    // Mock Data Reset
    mockActivities = [];
    mockGoals = [];
    mockMedications = [];
    nextActivityId = 1;
    nextGoalId = 1;
    nextMedicationId = 101;
    healthScores = { activity: 50, sleep: 50, stress: 50, nutrition: 50 };
    isLoggedIn = false;
    loggedInUser = '';

    updateHeaderAuthDisplay();
    calculateAndRenderScores();
    showView('home');
    showModal('Data Erased', 'All personalized data has been permanently deleted.', 'Restart App');
}

function showDeviceLinkModal() {
    if (!isLoggedIn) {
        showAuthModal('login');
        return;
    }
    const linkStatus = `
        <div class="bg-gray-800 p-4 rounded-lg flex justify-between items-center mb-4 border-l-4 border-green-500">
            <div class="flex items-center space-x-3">
                <i data-lucide="watch" class="w-6 h-6 text-green-400"></i>
                <span class="font-bold text-white">Fitness Tracker 1</span>
            </div>
            <span class="text-xs text-green-400 font-semibold flex items-center space-x-1">
                <i data-lucide="check-circle" class="w-4 h-4"></i><span>Connected & Syncing</span>
            </span>
        </div>
        <div class="bg-gray-800 p-4 rounded-lg flex justify-between items-center mb-6 border-l-4 border-yellow-500">
            <div class="flex items-center space-x-3">
                <i data-lucide="scale" class="w-6 h-6 text-yellow-400"></i>
                <span class="font-bold text-white">Smart Scale 2</span>
            </div>
            <span class="text-xs text-yellow-400 font-semibold flex items-center space-x-1">
                 <i data-lucide="clock" class="w-4 h-4"></i><span>Last Sync: 12 hours ago</span>
            </span>
        </div>
    `;
    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close device hub modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white flex items-center space-x-2"><i data-lucide="link" class="w-7 h-7 text-green-400"></i><span>Device Link Hub</span></h3>
        <p class="text-gray-400 mb-4">Manage your linked smart devices and check their real-time sync status.</p>
        
        <h4 class="text-lg font-semibold text-white mb-3">Linked Devices:</h4>
        ${linkStatus}

        <h4 class="text-lg font-semibold text-white mb-3">Add New Device:</h4>
        <div class="space-y-3">
            <button onclick="simulateDeviceLink('FitBit')" class="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 rounded-lg transition duration-150 flex items-center justify-center space-x-2">
                <i data-lucide="watch" class="w-5 h-5"></i><span>Connect Fitbit / Google Fit</span>
            </button>
            <button onclick="simulateDeviceLink('Apple Health')" class="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 rounded-lg transition duration-150 flex items-center justify-center space-x-2">
                <i data-lucide="apple" class="w-5 h-5"></i><span>Connect Apple Health</span>
            </button>
        </div>

        <div class="mt-6 flex justify-between space-x-3">
            <button onclick="hideModal(); showManualDataImportModal()" class="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition duration-150 text-sm">
                Manual Import
            </button>
            <button onclick="hideModal(); showDataPermissionsModal()" class="w-1/2 bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2.5 rounded-lg transition duration-150 text-sm">
                Manage Permissions
            </button>
        </div>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function simulateDeviceLink(provider) {
    hideModal();
    showModal('Device Linking', `Redirecting to **${provider}** for secure authorization. Your data sync will begin shortly.`, 'Authorize Now');
}

function showManualDataImportModal() {
    const content = `
        <button onclick="hideModal(); showDeviceLinkModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white flex items-center space-x-2"><i data-lucide="upload-cloud" class="w-7 h-7 text-indigo-400"></i><span>Manual Data Import</span></h3>
        <p class="text-gray-400 mb-6">Upload previously exported data (CSV/JSON) from another service.</p>
        <form onsubmit="simulateDataUpload(event)" class="space-y-4">
            <div>
                <label for="data-file" class="block text-sm font-medium mb-1">Select File (CSV, JSON)</label>
                <input type="file" id="data-file" accept=".csv, .json" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600" required>
            </div>
            <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition duration-150">
                Start Secure Import
            </button>
        </form>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function simulateDataUpload(event) {
    if (event) event.preventDefault();
    hideModal();
    showModal('Import Success', 'File upload simulated. **250 new data points** successfully imported.', 'View Dashboard');
    setTimeout(() => calculateAndRenderScores(), 1000);
}

function showDataPermissionsModal() {
    const content = `
        <button onclick="hideModal(); showDeviceLinkModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white flex items-center space-x-2"><i data-lucide="key" class="w-7 h-7 text-yellow-400"></i><span>Manage Data Permissions</span></h3>
        <p class="text-gray-400 mb-6">Control which data categories linked devices and external partners can access.</p>

        <div class="space-y-3">
            <div class="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span class="text-white text-sm">Real-time Heart Rate</span>
                <input type="checkbox" checked class="h-4 w-4 rounded border-gray-700 bg-gray-700 text-accent-teal focus:ring-[var(--accent-color)]">
            </div>
            <div class="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span class="text-white text-sm">Sleep Stage Data</span>
                <input type="checkbox" checked class="h-4 w-4 rounded border-gray-700 bg-gray-700 text-accent-teal focus:ring-[var(--accent-color)]">
            </div>
            <div class="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span class="text-white text-sm">Location History (Activity Mapping)</span>
                <input type="checkbox" class="h-4 w-4 rounded border-gray-700 bg-gray-700 text-accent-teal focus:ring-[var(--accent-color)]">
            </div>
        </div>
        
        <p class="text-xs text-gray-500 mt-4">Note: Disabling permissions may limit personalized AI insights.</p>
        <button onclick="hideModal(); showDeviceLinkModal()" class="mt-6 w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2.5 rounded-lg transition duration-150">
            Save Permissions
        </button>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function sendSecureMessage() {
    showModal('Secure Messaging', 'Opening a secure, end-to-end encrypted form to contact the PULSE support team confidentially.', 'Open Form');
}

function showSpecialistFinderModal() {
    showModal('Specialist Finder', 'This advanced search tool finds certified doctors and therapists covered by your insurance.', 'Start Search');
}

function showCommunityPortalModal() {
    if (!isLoggedIn) {
        showAuthModal('login');
        return;
    }
    showModal('Community Portal', 'Accessing the peer support forums and discussion groups.', 'Enter Portal');
}

function showCompliance(standard) {
    showModal(`${standard} Compliance`, `PULSE is fully compliant with ${standard} data security and privacy standards. Your health information is protected.`, 'View Policy');
}

function showWaterQualityModal() {
    showModal('Water Quality Settings', 'Opening settings to customize water quality monitoring and hydration reminders.', 'Customize');
}

function showGenomicInsightsModal() {
    if (!isLoggedIn) {
        showAuthModal('login');
        return;
    }
    const content = `
        <button onclick="hideModal()" class="float-right text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close genomic insights modal">&times;</button>
        <h3 class="text-2xl font-bold mb-4 text-white flex items-center space-x-2"><i data-lucide="dna" class="w-7 h-7 text-green-500"></i><span>Genomic Health Insights</span></h3>
        <p class="text-gray-400 mb-6">Your DNA suggests you are a **Fast Metabolizer** of common anti-depressants. Consult your doctor.</p>
        <ul class="space-y-3 text-sm mb-6">
            <li class="flex justify-between items-center text-gray-300">
                <span>Personalized Diet Plan</span>
                <button onclick="showModal('Diet Insight', 'Genetics suggest a high protein tolerance and moderate carbohydrate sensitivity.', 'View Plan')" class="color-accent-text hover:text-teal-400 font-medium">View</button>
            </li>
            <li class="flex justify-between items-center text-gray-300">
                <span>Genetic Risk Score (Cardio)</span>
                <span class="font-bold text-yellow-400">Moderate</span>
            </li>
        </ul>
        <button onclick="showModal('Genomic Enrollment', 'This leads to a secure form for submitting DNA data or requesting a kit.', 'Enroll Now')" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition duration-150">
            Manage Genomic Data
        </button>
    `;
    document.getElementById('universal-modal-content').innerHTML = content;
    document.getElementById('universal-modal-content').classList.remove('modal-lg');
    document.getElementById('universal-modal-backdrop').style.display = 'flex';
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function generateCustomSession() {
    if (!isLoggedIn) {
        showAuthModal('login');
        return;
    }
    showModal('AI Session Generated', 'Your custom 15-minute yoga flow is ready! This routine is personalized based on your activity data.', 'Start Session');
}

function startSession(sessionName) {
    showModal('Starting Session', `Loading the **${sessionName}** session. Audio guidance will begin shortly.`, 'Ready');
}

function logMeditation() {
    // Mock logging a 10-minute session
    mockActivities.push({
        id: nextActivityId++,
        metric: 'MEDITATION',
        value: '10 minutes',
        date: new Date().toLocaleDateString(),
        type: 'Mindfulness'
    });
    hasNewActivity = true;
    calculateAndRenderScores();
    
    hideModal();
    showModal('Session Logged', 'A 10-minute mindfulness session has been logged!', 'Great');
}