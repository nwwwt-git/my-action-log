let logs = JSON.parse(localStorage.getItem('actionLogs')) || [];

const activityInput = document.getElementById('activity');
const addBtn = document.getElementById('add-btn');
const logList = document.getElementById('log-list');

addBtn.addEventListener('click', addLog);

function addLog() {
    const activity = activityInput.value.trim();
    if (!activity) return;

    const now = new Date();
    const endTime = formatTime(now);
    let startTime = logs.length > 0 ? logs[0].endTime : endTime;

    const newLog = {
        id: Date.now(),
        name: activity,
        startTime: startTime,
        endTime: endTime,
        duration: calculateDuration(startTime, endTime)
    };

    logs.unshift(newLog);
    saveAndRender();
    activityInput.value = '';
}

function formatTime(date) {
    return date.getHours().toString().padStart(2, '0') + ':' + 
           date.getMinutes().toString().padStart(2, '0');
}

function calculateDuration(start, end) {
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let diff = (eH * 60 + eM) - (sH * 60 + sM);
    if (diff <= 0) diff += 24 * 60; 
    return diff + "分";
}

function deleteLog(id) {
    logs = logs.filter(log => log.id !== id);
    saveAndRender();
}

function saveAndRender() {
    localStorage.setItem('actionLogs', JSON.stringify(logs));
    render();
}

function render() {
    logList.innerHTML = logs.map(log => `
        <div class="log-item">
            <div class="log-content">
                <span class="activity-name">${log.name}</span>
                <span class="time-range">${log.startTime} 〜 ${log.endTime}</span>
            </div>
            <div style="display: flex; align-items: center;">
                <span class="duration-badge">${log.duration}</span>
                <button class="delete-btn" onclick="deleteLog(${log.id})">削除</button>
            </div>
        </div>
    `).join('');
}

render();
