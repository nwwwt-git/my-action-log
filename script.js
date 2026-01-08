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

// ...（冒頭の変数宣言部分は以前と同じ）...

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
      <div class="month-content"><ul style="padding:0; margin:0;"></ul></div>
    `;

    monthGroup.querySelector('.month-header').onclick = () => monthGroup.classList.toggle('open');

    const ul = monthGroup.querySelector('ul');
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

      // 経過時間の計算
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
          <div class="cat-display">
            <select class="cat-edit-overlay">
              ${Object.keys(catIcons).map(c => `<option value="${c}" ${record.category===c?'selected':''}>${catNames[c]}</option>`).join('')}
            </select>
            <i class="fa-solid ${catIcons[record.category]}" style="color:var(--primary); font-size:1rem; width:18px;"></i>
            <span style="font-size:0.85rem; font-weight:bold; color:var(--primary);">${catNames[record.category]}</span>
          </div>
          <div class="time-display">
            <input type="datetime-local" class="dt-edit-overlay" value="${record.time}">
            ${record.time.substring(11, 16)}
          </div>
          ${durationText}
        </div>
        <div class="memo-text">${record.memo || "..." }</div>
        <button class="delete-btn"><i class="fa-solid fa-trash-can"></i></button>
      `;

      // 種類変更イベント
      li.querySelector('.cat-edit-overlay').onchange = (e) => {
        records[recordIndex].category = e.target.value;
        saveAndRender();
      };
      // 日時変更イベント
      li.querySelector('.dt-edit-overlay').onchange = (e) => {
        records[recordIndex].time = e.target.value;
        saveAndRender();
      };
      // メモ変更
      li.querySelector('.memo-text').onclick = () => {
        const m = prompt("メモ修正:", record.memo);
        if(m!==null){ records[recordIndex].memo = m; saveAndRender(); }
      };
      // 削除
      li.querySelector('.delete-btn').onclick = () => {
        if(confirm("削除しますか？")) { records.splice(recordIndex, 1); saveAndRender(); }
      };

      ul.appendChild(li);
    });
    recordList.appendChild(monthGroup);
  });
}
// ...（saveAndRender以下の関数は以前と同じ）...

function saveAndRender() { localStorage.setItem('actionLogs', JSON.stringify(records)); render(); }

downloadBtn.onclick = () => {
  const m = targetMonthInput.value;
  const filtered = records.filter(r => r.time.startsWith(m));
  if(!filtered.length) return alert("データがありません");
  let csv = "\uFEFF日時,カテゴリー,メモ\n" + filtered.map(r => `${r.time.replace('T',' ')},${catNames[r.category]},"${(r.memo||"").replace(/"/g,'""')}"`).join("\n");
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'})); a.download = `log_${m}.csv`; a.click();
};

exportBtn.onclick = () => {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(records, null, 2)], {type:'application/json'}));
  a.download = `backup_${new Date().toISOString().substring(0,10)}.json`; a.click();
};

importBtn.onclick = () => importFile.click();
importFile.onchange = (e) => {
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if(Array.isArray(data) && confirm("データを復元（統合）しますか？")) {
        const keys = new Set(records.map(r => r.time + r.category));
        records = [...records, ...data.filter(r => !keys.has(r.time + r.category))];
        saveAndRender();
      }
    } catch(e) { alert("読み込みに失敗しました"); }
  };
  reader.readAsText(e.target.files[0]);
};

deleteMonthBtn.onclick = () => {
  const m = targetMonthInput.value;
  if(m && confirm(`${m.replace('-','年')}月の全データを削除しますか？`)) {
    if(confirm("本当によろしいですか？")) {
      records = records.filter(r => !r.time.startsWith(m));
      saveAndRender();
    }
  }
};
