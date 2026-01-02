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
  // 秒なしで保存
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

  const currentMonth = new Date().toISOString().substring(0, 7);

  Object.keys(groups).sort().reverse().forEach(month => {
    const monthGroup = document.createElement('div');
    monthGroup.className = `month-group ${month === currentMonth ? 'open' : ''}`;
    monthGroup.innerHTML = `<div class="month-header" onclick="this.parentElement.classList.toggle('open')"><span>${month.replace('-', '年')}月</span><span style="margin-left:auto; margin-right:10px; font-size:0.7rem; color:#64748b;">${groups[month].length}件</span><i class="fa-solid fa-chevron-down arrow"></i></div><div class="month-content"><ul style="padding:0; margin:0;"></ul></div>`;

    const ul = monthGroup.querySelector('ul');
    let lastDate = "";

    groups[month].forEach((record, i) => {
      const dateLabel = record.time.substring(0, 10);
      if (dateLabel !== lastDate) {
        const d = new Date(dateLabel);
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = `${d.getMonth()+1}/${d.getDate()} (${["日","月","火","水","木","金","土"][d.getDay()]})`;
        ul.appendChild(dayHeader);
        lastDate = dateLabel;
      }

      let durationText = "";
      if (groups[month][i + 1]) {
        const diff = Math.floor((new Date(record.time) - new Date(groups[month][i + 1].time)) / 60000);
        if (diff > 0 && diff < 6000) durationText = `<span class="duration">${String(Math.floor(diff/60)).padStart(2,'0')}:${String(diff%60).padStart(2,'0')}</span>`;
      }

      const recordIndex = records.indexOf(record);
      const li = document.createElement('li');
      li.className = 'record-item';
      li.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="position:relative; flex-shrink:0;">
            <select class="cat-edit" style="position:absolute; opacity:0; width:100%; height:100%; cursor:pointer;">
              ${Object.keys(catIcons).map(c => `<option value="${c}" ${record.category===c?'selected':''}>${catNames[c]}</option>`).join('')}
            </select>
            <i class="fa-solid ${catIcons[record.category]}" style="color:var(--primary); width:18px;"></i>
            <span style="font-size:0.8rem; font-weight:bold; color:var(--primary);">${catNames[record.category]}</span>
          </div>
          <input type="time" class="time-edit" value="${record.time.substring(11,16)}" style="border:none; background:transparent; font-size:0.85rem; color:#64748b; width:50px;">
          ${durationText}
        </div>
        <span class="memo-text">${record.memo || "..." }</span>
        <button class="delete-btn"><i class="fa-solid fa-trash-can"></i></button>
      `;

      li.querySelector('.cat-edit').onchange = (e) => { records[recordIndex].category = e.target.value; saveAndRender(); };
      li.querySelector('.time-edit').onchange = (e) => { records[recordIndex].time = record.time.substring(0,11) + e.target.value; saveAndRender(); };
      li.querySelector('.memo-text').onclick = () => { const m = prompt("修正:", record.memo); if(m!==null){ records[recordIndex].memo = m; saveAndRender(); }};
      li.querySelector('.delete-btn').onclick = () => { if(confirm("削除しますか？")) { records.splice(recordIndex, 1); saveAndRender(); }};
      ul.appendChild(li);
    });
    recordList.appendChild(monthGroup);
  });
}

function saveAndRender() { localStorage.setItem('actionLogs', JSON.stringify(records)); render(); }

downloadBtn.onclick = () => {
  const m = targetMonthInput.value;
  const filtered = records.filter(r => r.time.startsWith(m));
  if(!filtered.length) return alert("データなし");
  let csv = "\uFEFF日時,カテゴリー,メモ\n" + filtered.map(r => `${r.time.replace('T',' ')},${catNames[r.category]},"${(r.memo||"").replace(/"/g,'""')}"`).join("\n");
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'})); a.download = `log_${m}.csv`; a.click();
};

exportBtn.onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(records, null, 2)], {type:'application/json'}));
  a.download = `backup_${new Date().toISOString().substring(0,10)}.json`;
  a.click();
};

importBtn.onclick = () => importFile.click();
importFile.onchange = (e) => {
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if(Array.isArray(data) && confirm("データを統合しますか？")) {
        const keys = new Set(records.map(r => r.time + r.category));
        records = [...records, ...data.filter(r => !keys.has(r.time + r.category))];
        saveAndRender();
      }
    } catch(e) { alert("失敗"); }
  };
  reader.readAsText(e.target.files[0]);
};

deleteMonthBtn.onclick = () => {
  const m = targetMonthInput.value;
  if(m && confirm(`${m}の全データを削除しますか？`) && confirm("本当によろしいですか？")) {
    records = records.filter(r => !r.time.startsWith(m));
    saveAndRender();
  }
};
