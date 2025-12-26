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

// 記録ボタン
recordBtn.onclick = () => {
  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  
  records.push({
    category: selectedCategory,
    memo: memoInput.value,
    time: timeStr
  });
  
  memoInput.value = '';
  saveAndRender();
};

// 描画処理
function render() {
  recordList.innerHTML = '';
  // 新しい順に並び替え
  records.sort((a, b) => new Date(b.time) - new Date(a.time));

  records.forEach((record, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="list-header">
        <div class="cat-wrapper" style="position:relative;">
          <select class="cat-edit" style="position:absolute; opacity:0; width:100%; height:100%; cursor:pointer;">
            ${Object.keys(catIcons).map(cat => `<option value="${cat}" ${record.category === cat ? 'selected' : ''}>${catNames[cat]}</option>`).join('')}
          </select>
          <i class="fa-solid ${catIcons[record.category]}" style="color:var(--primary); width:20px; margin-right:5px;"></i>
          <span style="font-size:0.85rem; font-weight:bold; color:var(--primary);">${catNames[record.category]} <i class="fa-solid fa-caret-down" style="font-size:0.6rem;"></i></span>
        </div>
        <input type="datetime-local" class="time-edit" value="${record.time}">
      </div>
      <span class="memo-text">${record.memo || "（メモなし）"}</span>
      <button class="delete-btn"><i class="fa-solid fa-trash-can"></i> 削除</button>
    `;

    // インラインでのイベント設定
    li.querySelector('.cat-edit').onchange = (e) => { records[index].category = e.target.value; saveAndRender(); };
    li.querySelector('.time-edit').onchange = (e) => { records[index].time = e.target.value; saveAndRender(); };
    li.querySelector('.memo-text').onclick = () => {
      const newMemo = prompt("メモを修正:", record.memo);
      if (newMemo !== null) { records[index].memo = newMemo; saveAndRender(); }
    };
    li.querySelector('.delete-btn').onclick = () => {
      if (confirm("この記録を削除しますか？")) { records.splice(index, 1); saveAndRender(); }
    };

    recordList.appendChild(li);
  });
}

function saveAndRender() {
  localStorage.setItem('actionLogs', JSON.stringify(records));
  render();
}

// CSV保存
downloadBtn.onclick = () => {
  const month = targetMonthInput.value;
  const filtered = records.filter(r => r.time.startsWith(month));
  if (filtered.length === 0) return alert("選択した月のデータがありません。");

  let csv = "\uFEFF日時,カテゴリー,メモ\n" + filtered.map(r => 
    `${r.time.replace('T', ' ')},${catNames[r.category]},"${(r.memo || "").replace(/"/g, '""')}"`
  ).join("\n");

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `log_${month.replace('-', '')}.csv`;
  a.click();
};

// 月間一括削除
deleteMonthBtn.onclick = () => {
  const month = targetMonthInput.value;
  if (confirm(`${month}のデータをすべて削除しますか？`) && confirm("本当に削除します。元に戻せません。")) {
    records = records.filter(r => !r.time.startsWith(month));
    saveAndRender();
  }
};
