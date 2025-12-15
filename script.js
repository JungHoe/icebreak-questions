// --- 카테고리 추출 ---
const CATEGORIES = [...new Set(QUESTIONS.map((x) => x.cat))];

// --- 상태 ---
let activeCats = new Set(CATEGORIES); // 기본 전체 선택
let pool = []; // 현재 필터에 해당하는 질문 목록(셔플됨)
let cursor = 0; // 다음에 보여줄 인덱스

// --- 유틸 함수 ---
const $ = (sel) => document.querySelector(sel);

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function rebuildPool() {
  pool = QUESTIONS.filter((x) => activeCats.has(x.cat));
  shuffle(pool);
  cursor = 0;
  updateCount();
}

function updateCount() {
  $("#countPill").textContent = `남은 질문: ${Math.max(pool.length - cursor, 0)}`;
  const catsText = activeCats.size === CATEGORIES.length ? "전체" : [...activeCats].join(", ");
  $("#activeCats").textContent = `선택된 카테고리: ${catsText}`;
}

function renderFilters() {
  const box = $("#filters");
  box.innerHTML = "";
  CATEGORIES.forEach((cat) => {
    const id = "cat_" + cat.replace(/[^\w가-힣]/g, "");
    const wrap = document.createElement("label");
    wrap.className = "chip";
    wrap.innerHTML = `<input type="checkbox" id="${id}" checked> <span>${cat}</span>`;
    wrap.querySelector("input").addEventListener("change", (e) => {
      if (e.target.checked) activeCats.add(cat);
      else activeCats.delete(cat);
      if (activeCats.size === 0) {
        // 최소 1개 유지
        activeCats.add(cat);
        e.target.checked = true;
        return;
      }
      rebuildPool();
      showNext(false);
      renderAllList();
    });
    box.appendChild(wrap);
  });
}

function showNext(animate = true) {
  if (pool.length === 0) rebuildPool();
  if (cursor >= pool.length) {
    // 모두 사용 → 자동 리셋
    rebuildPool();
  }
  const item = pool[cursor++];
  const box = $("#questionBox");
  box.textContent = item.q;
  $("#lastCat").textContent = `카테고리: ${item.cat}`;
  updateCount();
  if (animate) {
    box.style.transition = "transform .08s ease, opacity .12s ease";
    box.style.transform = "scale(1.02)";
    box.style.opacity = ".85";
    requestAnimationFrame(() =>
      setTimeout(() => {
        box.style.transform = "scale(1)";
        box.style.opacity = "1";
      }, 90)
    );
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(ta);
    }
    return Promise.resolve();
  }
}

async function share(text) {
  const title = "조모임 랜덤 질문";
  try {
    if (navigator.share) {
      await navigator.share({ title, text });
    } else {
      await copyToClipboard(text);
      alert("공유 기능이 없어 복사했어요. 채팅에 붙여넣기 하세요!");
    }
  } catch (e) {
    // 사용자가 취소한 경우 무시
  }
}

// --- 전체 목록 렌더 ---
function renderAllList() {
  const list = $("#listContainer");
  list.innerHTML = "";
  QUESTIONS.filter((x) => activeCats.has(x.cat)).forEach((item, i) => {
    const li = document.createElement("li");
    li.textContent = `[${item.cat}] ${item.q}`;
    list.appendChild(li);
  });
}

// --- 이벤트 ---
$("#nextBtn").addEventListener("click", () => showNext(true));
$("#reshuffleBtn").addEventListener("click", () => {
  rebuildPool();
  showNext(false);
});
$("#copyBtn").addEventListener("click", () =>
  copyToClipboard($("#questionBox").textContent).then(() => {
    const btn = $("#copyBtn");
    const txt = btn.textContent;
    btn.textContent = "복사됨 ✅";
    setTimeout(() => (btn.textContent = txt), 1400);
  })
);
$("#shareBtn").addEventListener("click", () => share($("#questionBox").textContent));
$("#showAllBtn").addEventListener("click", () => {
  const sec = $("#allList");
  const vis = sec.style.display !== "none";
  sec.style.display = vis ? "none" : "block";
  $("#showAllBtn").textContent = vis ? "전체 목록 보기" : "전체 목록 닫기";
});

// --- 초기화 ---
renderFilters();
rebuildPool();
renderAllList();
