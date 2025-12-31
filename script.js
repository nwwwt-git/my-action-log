let records = JSON.parse(localStorage.getItem('actionLogs')) || [];

// 要素の取得
const recordList = document.getElementById('recordList');
const recordBtn = document.getElementById('recordBtn');
const memoInput = document.getElementById('memo');
const targetMonthInput = document.getElementById('targetMonth');
const downloadBtn = document.getElementById('downloadBtn');
const deleteMonthBtn = document.getElementById('deleteMonthBtn');
const toggleAdminBtn = document.getElementById('toggleAdminBtn');
const adminPanel = document.getElementById('adminPanel');

const catIcons = { work: 'fa-briefcase', rest: 'fa-couch', move: 'fa-car-side', other: 'fa-icons' };
const catNames = { work: '仕事', rest: '休憩', move: '移動', other: '他' };

// 初期化
window.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  targetMonthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  render();
});

// 管理パネルの開閉
toggleAdminBtn.onclick = () => {
  const isHidden = adminPanel.classList.toggle('hidden');
  toggleAdminBtn.innerHTML = isHidden ? 
    '<i class="fa-solid fa-gear"></i> 管理設定を表示' : 
    '<i class="fa-solid fa-xmark"></i> 閉じる';
};

// カテゴリー選択
let selectedCategory = 'work';
document.querySelectorAll('.cat-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelector('.cat-btn.active').classList.remove('active');
    btn.classList.add('active');
    selectedCategory = btn.dataset.cat;
  };
});

// --- 修正：記録ボタンの処理 ---
recordBtn.onclick = () => {
  const now = new Date();
  const f2 = (n) => String(n).padStart(2, '0'); // 2桁にする関数

  const year = now.getFullYear();
  const month = f2(now.getMonth() + 1);
  const date = f2(now.getDate());
  const hours = f2(now.getHours());
  const minutes = f2(now.getMinutes());
  const seconds = f2(now.getSeconds());

  // 秒まで保存（2桁固定）
  const timeStr = `${year}-${month}-${date}T${hours}:${minutes}:${seconds}`;
  
  records.push({
    category: selectedCategory,
    memo: memoInput.value,
    time: timeStr
  });
  
  memoInput.value = '';
  saveAndRender();
};

// 描画
function render() {
  recordList.innerHTML = '';
  // 新しい順にソート
  records.sort((a, b) => new Date(b.time) - new Date(a.time));

  // 月ごとにグループ化
  const groups = {};
  records.forEach(record => {
    const month = record.time.substring(0, 7); // "2025-12" の形式
    if (!groups[month]) groups[month] = [];
    groups[month].push(record);
  });

  // 今日の年月を取得 (例: "2025-12")
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // グループ（月）のキーを降順でループ
  Object.keys(groups).sort().reverse().forEach(month => {
    const monthGroup = document.createElement('div');
    
    // 【修正ポイント】ここでの判定を確実に
    // month(2025-12) と currentMonth(2025-12) が一致すれば 'open' クラスを付与
    const isOpenClass = (month === currentMonth) ? 'open' : '';
    monthGroup.className = `month-group ${isOpenClass}`;
    
    monthGroup.innerHTML = `
      <div class="month-header" onclick="this.parentElement.classList.toggle('open')">
        <span>${month.replace('-', '年')}月</span>
        <span class="count">${groups[month].length}件</span>
        <i class="fa-solid fa-chevron-down arrow"></i>
      </div>
      <div class="month-content">
        <ul class="inner-list"></ul>
      </div>
    `;

    const ul = monthGroup.querySelector('.inner-list');

groups[month].forEach((record, i) => {
  // --- 経過時間の計算 ---
  let durationText = "";
  // groups[month]の中で、次の要素（1つ前の記録）が存在する場合のみ計算
  if (groups[month][i + 1]) {
    const currentTime = new Date(record.time);
    const prevTime = new Date(groups[month][i + 1].time);
    const diffMs = currentTime - prevTime; // ミリ秒単位の差
    const diffMin = Math.floor(diffMs / (1000 * 60)); // 分単位

    if (diffMin > 0 && diffMin < 6000) { // 0分以上99時間59分(5999分)未満
      const h = String(Math.floor(diffMin / 60)).padStart(2, '0');
      const m = String(diffMin % 60).padStart(2, '0');
      durationText = `<span class="duration"><i class="fa-regular fa-clock"></i> ${h}:${m}</span>`;
    }
  }

  const recordIndex = records.indexOf(record);
  const displayTime = record.time.substring(0, 16);
  const li = document.createElement('li');
  li.className = 'record-item';
  li.innerHTML = `
    <div class="list-header">
      <div class="cat-wrapper" style="position:relative;">
        <select class="cat-edit" style="position:absolute; opacity:0; width:100%; height:100%; cursor:pointer;">
          ${Object.keys(catIcons).map(cat => `<option value="${cat}" ${record.category === cat ? 'selected' : ''}>${catNames[cat]}</option>`).join('')}
        </select>
        <i class="fa-solid ${catIcons[record.category]}" style="color:var(--primary); width:20px; margin-right:5px;"></i>
        <span style="font-size:0.85rem; font-weight:bold; color:var(--primary);">${catNames[record.category]} <i class="fa-solid fa-caret-down" style="font-size:0.6rem;"></i></span>
      </div>
      <input type="datetime-local" class="time-edit" value="${displayTime}">
      ${durationText} </div>
    <span class="memo-text">${record.memo || "（メモなし）"}</span>
    <button class="delete-btn"><i class="fa-solid fa-trash-can"></i> 削除</button>
  `;
  // ...（以下、イベント登録等の処理は変更なし）

      // 各種イベント
      li.querySelector('.cat-edit').onchange = (e) => { records[recordIndex].category = e.target.value; saveAndRender(); };
      li.querySelector('.time-edit').onchange = (e) => { records[recordIndex].time = e.target.value; saveAndRender(); };
      li.querySelector('.memo-text').onclick = () => {
        const m = prompt("修正:", record.memo);
        if (m !== null) { records[recordIndex].memo = m; saveAndRender(); }
      };
      li.querySelector('.delete-btn').onclick = () => {
        if (confirm("削除しますか？")) { records.splice(recordIndex, 1); saveAndRender(); }
      };

      ul.appendChild(li);
    });

    recordList.appendChild(monthGroup);
  });
}

function saveAndRender() {
  localStorage.setItem('actionLogs', JSON.stringify(records));
  render();
}

// CSV保存（秒まで出力）
downloadBtn.onclick = () => {
  const month = targetMonthInput.value;
  const filtered = records.filter(r => r.time.startsWith(month));
  if (!filtered.length) return alert("データなし");

  let csv = "\uFEFF日時,カテゴリー,メモ\n" + filtered.map(r => 
    `${r.time.replace('T', ' ')},${catNames[r.category]},"${(r.memo || "").replace(/"/g, '""')}"`
  ).join("\n");

  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `log_${month.replace('-', '')}.csv`;
  a.click();
};

// 一括削除
deleteMonthBtn.onclick = () => {
  const month = targetMonthInput.value;
  if (confirm(`${month}を削除？`) && confirm("本当によろしいですか？")) {
    records = records.filter(r => !r.time.startsWith(month));
    saveAndRender();
  }
};
