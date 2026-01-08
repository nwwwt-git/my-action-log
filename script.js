let records = JSON.parse(localStorage.getItem('actionLogs')) || [];

const recordList = document.getElementById('recordList');
const recordBtn = document.getElementById('recordBtn');
const memoInput = document.getElementById('memo');
const targetMonthInput = document.getElementById('targetMonth');
const downloadBtn = document.getElementById('downloadBtn');
const deleteMonthBtn = document.getElementById('deleteMonthBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const toggleAdminBtn = document.getElementById('toggleAdminBtn');
const adminPanel = document.getElementById('adminPanel');

const catIcons = { work: 'fa-briefcase', rest: 'fa-couch', move: 'fa-car-side', other: 'fa-icons' };
const catNames = { work: '仕事', rest: '休憩', move: '移動', other: '他' };

window.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  targetMonthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  render();
});

toggleAdminBtn.onclick = () => {
  const isHidden = adminPanel.classList.toggle('hidden');
  toggleAdminBtn.innerHTML = isHidden ? '<i class="fa-solid fa-gear"></i> 管理設定を表示' : '<i class="fa-solid fa-xmark"></i> 閉じる';
};

let selectedCategory = 'work';
document.querySelectorAll('.cat-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelector('.cat-btn.active').classList.remove('active');
    btn.classList.add('active');
    selectedCategory = btn.dataset.cat;
  };
});

recordBtn.onclick = () => {
  const now = new Date();
  const f2 = (n) => String(n).padStart(2, '0');
  const timeStr = `${now.getFullYear()}-${f2(now.getMonth()+1)}-${f2(now.getDate())}T${f2(now.getHours())}:${f2(now.getMinutes())}`;
  records.push({ category: selectedCategory, memo: memoInput.value, time: timeStr });
  memoInput.value = '';
  saveAndRender();
};

function render() {
  recordList.innerHTML = '';
  records.sort((a, b) => new Date(b.time) - new Date(a.time));
  
  const groups = {};
  records.forEach(r => {
    const m = r.time.substring(0, 7);
    if (!groups[m]) groups[m] = [];
    groups[m].push(r);
  });

  const currentMonthStr = new Date().toISOString().substring(0, 7);

  Object.keys(groups).sort().reverse().forEach(month => {
    const isCurrentMonth = (month === currentMonthStr);
    const monthGroup = document.createElement('div');
    monthGroup.className = `month-group ${isCurrentMonth ? 'open' : ''}`;
    
    monthGroup.innerHTML = `
      <div class="month-header">
        <span>${month.replace('-', '年')}月</span>
        <i class="fa-solid fa-chevron-down" style="margin-left:auto;"></i>
      </div>
      <div class="month-content"><ul></ul></div>
    `;

    monthGroup.querySelector('.month-header').onclick = () => monthGroup.classList.toggle('open');
    const ul = monthGroup.querySelector('ul');
    ul.style.padding = "0"; ul.style.margin = "0";
    let lastDate = "";

    groups[month].forEach((record, i) => {
      const datePart = record.time.substring(0, 10);
      if (datePart !== lastDate) {
        const d = new Date(datePart);
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = `${d.getMonth()+1}/${d.getDate()} (${["日","月","火","水","木","金","土"][d.getDay()]})`;
        ul.appendChild(dayHeader);
        lastDate = datePart;
      }

      let durationText = "";
      if (groups[month][i + 1]) {
        const diff = Math.floor((new Date(record.time) - new Date(groups[month][i + 1].time)) / 60000);
        if (diff > 0 && diff < 6000) {
          durationText = `<span class="duration">${String(Math.floor(diff/60)).padStart(2,'0')}:${String(diff%60).padStart(2,'0')}</span>`;
        }
      }

      const recordIndex = records.indexOf(record);
      const li = document.createElement('li');
      li.className = 'record-item';
      li.innerHTML = `
        <div class="item-top">
          <div class="edit-wrapper">
            <select class="edit-overlay cat-edit">
              ${Object.keys(catIcons).map(c => `<option value="${c}" ${record.category===c?'selected':''}>${catNames[c]}</option>`).join('')}
            </select>
            <i class="fa-solid ${catIcons[record.category]}" style="color:var(--primary); font-size:0.9rem;"></i>
          </div>
          <div class="edit-wrapper">
            <input type="datetime-local" class="edit-overlay dt-edit" value="${record.time}">
            <span style="font-size:0.85rem; font-weight:bold;">${record.time.substring(11, 16)}</span>
          </div>
          ${durationText}
        </div>
        <div class="memo-text">${record.memo || "..." }</div>
        <button class="delete-btn"><i class="fa-solid fa-trash-can"></i></button>
      `;

      li.querySelector('.cat-edit').onchange = (e) => { records[recordIndex].category = e.target.value; saveAndRender(); };
      li.querySelector('.dt-edit').onchange = (e) => { records[recordIndex].time = e.target.value; saveAndRender(); };
      li.querySelector('.memo-text').onclick = () => {
        const m = prompt("メモ修正:", record.memo);
        if(m!==null){ records[recordIndex].memo = m; saveAndRender(); }
      };
      li.querySelector('.delete-btn').onclick = () => {
        if(confirm("削除しますか？")) { records.splice(recordIndex, 1); saveAndRender(); }
      };
      ul.appendChild(li);
    });
    recordList.appendChild(monthGroup);
  });
}

function saveAndRender() { localStorage.setItem('actionLogs', JSON.stringify(records)); render(); }
// ... (CSV, Backup, Restore関数はそのまま維持) ...
